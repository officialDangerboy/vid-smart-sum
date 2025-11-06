# 🎥 Video Summarizer API - Secure Edition

A secure, production-ready Node.js API for video summarization with Google OAuth authentication, JWT tokens, credits system, and intelligent caching.

## 🔐 Security Features

✅ **JWT Authentication** - Access & refresh tokens with automatic rotation  
✅ **Google OAuth 2.0** - Secure third-party authentication  
✅ **CSRF Protection** - State parameter validation  
✅ **Rate Limiting** - IP and user-based throttling  
✅ **Security Headers** - Helmet.js integration  
✅ **Token Revocation** - Logout from all devices  
✅ **IP Tracking** - Monitor user access locations  
✅ **httpOnly Cookies** - XSS protection  
✅ **Encryption** - AES-256 for sensitive data  

## 📋 Prerequisites

- Node.js v16+ 
- MongoDB (local or Atlas)
- Google OAuth credentials
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Generate Secrets

Run these commands to generate secure secrets:

```bash
# JWT Secret (64 bytes)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (64 bytes)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Session Secret (32 bytes)
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (32 bytes)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### 5. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Required |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Required |
| `JWT_SECRET` | JWT access token secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Required |
| `SESSION_SECRET` | Express session secret | Required |
| `ENCRYPTION_KEY` | AES-256 encryption key | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `BACKEND_URL` | Backend URL | http://localhost:3000 |
| `FRONTEND_URL` | Frontend URL | http://localhost:8080 |
| `ENABLE_CRON_JOBS` | Enable cron jobs | true |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | FRONTEND_URL |

## 📡 API Endpoints

### Authentication

#### `GET /auth/google`
Initiate Google OAuth flow

#### `GET /auth/google/callback`
OAuth callback handler

#### `GET /auth/user`
Get current authenticated user
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free",
    "credits": 100
  }
}
```

#### `POST /auth/refresh-token`
Refresh access token using refresh token

#### `POST /auth/logout`
Logout and revoke tokens

#### `POST /auth/revoke-all-sessions`
Revoke all refresh tokens (logout from all devices)

### User Profile

#### `GET /api/user/profile`
Get full user profile with stats

**Requires:** JWT Authentication

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "plan": "free",
    "credits": {...},
    "usage": {...},
    "referral": {...}
  }
}
```

### Credits

#### `GET /api/credits/balance`
Get credit balance

**Requires:** JWT Authentication

### Video Summaries

#### `POST /api/summary/check-cache`
Check if summary exists in cache

**Requires:** JWT Authentication

```json
{
  "video_id": "dQw4w9WgXcQ",
  "ai_provider": "openai",
  "length": "medium"
}
```

#### `POST /api/summary/generate`
Generate video summary

**Requires:** JWT Authentication

```json
{
  "video_id": "dQw4w9WgXcQ",
  "video_title": "Example Video",
  "video_url": "https://youtube.com/watch?v=...",
  "video_duration": 180,
  "ai_provider": "openai",
  "summary_length": "medium"
}
```

#### `GET /api/summary/history`
Get summary generation history

**Requires:** JWT Authentication

Query params: `page` (default: 1), `limit` (default: 20)

### Referrals

#### `GET /api/referral/code`
Get or generate referral code

**Requires:** JWT Authentication

#### `POST /api/referral/apply`
Apply referral code

**Requires:** JWT Authentication

```json
{
  "referral_code": "ABC123"
}
```

### Subscriptions

#### `POST /api/subscription/upgrade`
Upgrade to Pro plan

**Requires:** JWT Authentication

```json
{
  "billing_cycle": "monthly",
  "stripe_data": {...}
}
```

## 🔐 Authentication Flow

### 1. Google OAuth Login

```javascript
// Frontend
window.location.href = 'http://localhost:3000/auth/google';
```

### 2. Callback Handling

After successful authentication, user is redirected to:
```
http://localhost:8080/auth/callback?success=true
```

Tokens are stored in httpOnly cookies:
- `accessToken` - Expires in 15 minutes
- `refreshToken` - Expires in 7 days

### 3. Making Authenticated Requests

```javascript
// Using cookies (recommended)
fetch('http://localhost:3000/api/user/profile', {
  credentials: 'include'
})

// Using Authorization header
fetch('http://localhost:3000/api/user/profile', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
})
```

### 4. Token Refresh

When access token expires (401 error with code `TOKEN_EXPIRED`):

```javascript
const response = await fetch('http://localhost:3000/auth/refresh-token', {
  method: 'POST',
  credentials: 'include'
});

if (response.ok) {
  // New tokens set in cookies, retry original request
}
```

### 5. Logout

```javascript
await fetch('http://localhost:3000/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
```

## 🛡️ Security Best Practices

### 1. Environment Variables
- Never commit `.env` to version control
- Use different secrets for each environment
- Rotate secrets regularly

### 2. HTTPS in Production
```javascript
// Add to server.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 3. Database Security
- Use MongoDB Atlas with IP whitelist
- Enable authentication
- Use connection string with SSL

### 4. Rate Limiting
Already configured per environment variables. Adjust for your needs:
- Free tier: 100 requests / 15 minutes
- Pro tier: Unlimited (implement different limits)

### 5. CORS Configuration
Update `ALLOWED_ORIGINS` in production:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 📊 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3000/health
```

### Active Sessions
Track number of logged-in users (implement in admin panel)

### Failed Login Attempts
Monitor suspicious activity in logs

## 🧪 Testing

### Test OAuth Flow
1. Visit `http://localhost:3000/auth/google`
2. Login with Google
3. Check cookies in browser DevTools
4. Verify tokens exist

### Test Protected Routes
```bash
# Get user profile
curl -b cookies.txt http://localhost:3000/api/user/profile

# Generate summary
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"video_id":"test","video_title":"Test"}' \
  http://localhost:3000/api/summary/generate
```

## 📦 Project Structure

```
├── config/
│   ├── database.js          # MongoDB connection
│   └── passport.js           # Passport OAuth config
├── jobs/
│   ├── cronJobs.js           # Cron job definitions
│   └── sheduleCrons.js       # Cron scheduler
├── middleware/
│   └── auth.js               # JWT & rate limiting middleware
├── models/
│   ├── User.js               # User schema
│   └── Video.js              # Video cache schema
├── routes/
│   ├── auth.js               # Auth routes (OAuth, JWT)
│   └── api.js                # API routes (protected)
├── utils/
│   └── helpers.js            # Helper functions
├── .env                      # Environment variables (DO NOT COMMIT)
├── .env.example              # Environment template
├── package.json              # Dependencies
└── server.js                 # Main server file
```

## 🔄 Cron Jobs

### Monthly Credit Reset
Runs every 1st of the month at midnight (UTC) to reset free user credits.

### Cache Cleanup
Runs weekly to remove old cached summaries (optional).

Disable cron jobs:
```env
ENABLE_CRON_JOBS=false
```

## 🐛 Troubleshooting

### "JWT Secret not defined"
Generate secrets using the commands in step 3 of Quick Start.

### "CORS Error"
Check `ALLOWED_ORIGINS` includes your frontend URL.

### "Cookies not being sent"
Ensure `credentials: 'include'` in fetch requests and CORS is configured.

### "Token expired"
Implement automatic token refresh in frontend.

### "MongoDB connection failed"
Check `MONGODB_URI` and network access in MongoDB Atlas.

## 🚀 Deployment

### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=...
heroku config:set MONGODB_URI=...
# ... (set all variables)

# Deploy
git push heroku main
```

### Vercel / Railway
1. Import GitHub repository
2. Set environment variables
3. Deploy

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 📝 License

MIT

## 👤 Author

Your Name

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

For issues, email: support@yourapp.com
