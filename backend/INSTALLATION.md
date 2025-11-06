# 📦 Installation Guide

Complete step-by-step guide to set up the Video Summarizer API.

## 🎯 Quick Install (Recommended)

```bash
# 1. Run the setup script
./setup.sh

# 2. Follow the prompts
# 3. Update .env with your MongoDB URI and Google OAuth credentials
# 4. Start the server
npm run dev
```

## 📋 Manual Installation

### Step 1: Install Dependencies

```bash
npm install
```

**Required packages:**
- express
- mongoose
- passport & passport-google-oauth20
- jsonwebtoken
- cookie-parser
- helmet
- cors
- dotenv
- express-session
- node-cron

### Step 2: Create Environment File

```bash
cp .env.example .env
```

### Step 3: Generate Secrets

Run each command and copy the output to your `.env` file:

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

### Step 4: Set up MongoDB

#### Option A: Local MongoDB

```bash
# Install MongoDB
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod

# Update .env
MONGODB_URI=mongodb://localhost:27017/video-summarizer
```

#### Option B: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Add your IP to whitelist (or 0.0.0.0/0 for development)
5. Get connection string
6. Update .env:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Step 5: Set up Google OAuth

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name: "Video Summarizer API"
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Video Summarizer"
   
5. **Configure Authorized URLs**
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:8080
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/google/callback
   ```

6. **Copy Credentials**
   - Copy "Client ID" and "Client Secret"
   - Add to `.env`:
   
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

### Step 6: Configure Server URLs

Update your `.env` file:

```env
PORT=3000
NODE_ENV=development
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080
```

### Step 7: Configure Rate Limiting (Optional)

```env
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # 100 requests per window
```

### Step 8: Configure CORS

```env
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

Server starts with hot-reload on file changes.

### Production Mode

```bash
npm start
```

### Verify Installation

1. **Check server health:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test OAuth flow:**
   - Visit: http://localhost:3000/auth/google
   - Login with Google
   - You should be redirected back

3. **Check logs:**
   ```bash
   ✅ MongoDB connected successfully
   ✅ Cron jobs initialized
   🚀 Server running on http://localhost:3000
   ```

## 🐳 Docker Installation (Optional)

### Create Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/video-summarizer
    depends_on:
      - mongo
    volumes:
      - ./:/app
      - /app/node_modules

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### Run with Docker

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down
```

## 🔧 Troubleshooting

### Issue: "Cannot find module"

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: "MongoDB connection failed"

```bash
# Check MongoDB is running
# Local:
mongod --version

# Atlas: Check IP whitelist and credentials
```

### Issue: "JWT Secret not defined"

```bash
# Make sure .env file has JWT_SECRET
cat .env | grep JWT_SECRET

# If missing, generate new one
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Issue: "Google OAuth error"

1. Check Client ID and Secret in .env
2. Verify callback URL in Google Console matches `BACKEND_URL`
3. Make sure Google+ API is enabled

### Issue: "CORS error"

```bash
# Check ALLOWED_ORIGINS includes your frontend URL
# Example:
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

### Issue: "Port already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

## 📚 Additional Setup

### Install nodemon for development

```bash
npm install -D nodemon
```

### Install testing tools

```bash
npm install -D jest supertest
```

### Install linting tools

```bash
npm install -D eslint
npx eslint --init
```

### Set up logging

```bash
npm install winston morgan
```

## ✅ Verification Checklist

After installation, verify:

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Health endpoint responds (http://localhost:3000/health)
- [ ] Google OAuth login works
- [ ] Tokens stored in cookies
- [ ] Protected routes require authentication
- [ ] Rate limiting works
- [ ] Cron jobs initialized

## 📞 Need Help?

- **Documentation**: See README.md
- **Security**: See SECURITY_CHECKLIST.md
- **Issues**: Open a GitHub issue
- **Email**: support@yourapp.com

## 🎉 Next Steps

Once installed:

1. Test OAuth flow
2. Create a test user
3. Test API endpoints
4. Set up frontend
5. Deploy to production

Happy coding! 🚀
