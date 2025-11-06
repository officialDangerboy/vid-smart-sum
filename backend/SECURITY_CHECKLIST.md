# 🔐 Security Checklist

## ✅ Pre-Deployment

### Environment & Secrets
- [ ] All secrets generated with `crypto.randomBytes()`
- [ ] Different secrets for development and production
- [ ] `.env` file added to `.gitignore`
- [ ] No hardcoded credentials in code
- [ ] MongoDB connection string uses authentication
- [ ] API keys encrypted in database

### Authentication & Authorization
- [ ] JWT secrets are 64+ bytes
- [ ] Refresh tokens stored in database
- [ ] Token expiration times appropriate (15min access, 7d refresh)
- [ ] CSRF protection enabled (state parameter)
- [ ] httpOnly cookies for tokens
- [ ] sameSite cookie attribute set
- [ ] OAuth callback URL whitelisted in Google Console

### Network Security
- [ ] HTTPS enabled in production
- [ ] CORS configured for production domains only
- [ ] Security headers enabled (Helmet.js)
- [ ] Rate limiting configured
- [ ] Trust proxy enabled for accurate IP tracking
- [ ] IP whitelist in MongoDB Atlas

### Input Validation
- [ ] Request body validation implemented
- [ ] File upload limits set
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS protection headers
- [ ] Content-Type validation

### Error Handling
- [ ] Stack traces hidden in production
- [ ] Error messages don't expose internals
- [ ] Logging configured (Winston/Morgan)
- [ ] Sensitive data not logged

## ✅ Production Deployment

### Server Configuration
- [ ] `NODE_ENV=production` set
- [ ] Port configured correctly
- [ ] Process manager (PM2/Docker)
- [ ] Graceful shutdown handlers
- [ ] Health check endpoint working

### Database
- [ ] Production database URL updated
- [ ] Connection pooling configured
- [ ] Indexes created for performance
- [ ] Backup strategy in place
- [ ] MongoDB Atlas network access configured

### Monitoring
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Performance monitoring
- [ ] Failed login attempt tracking
- [ ] Suspicious activity alerts
- [ ] Uptime monitoring

### Documentation
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment guide created
- [ ] Security incident response plan

## ✅ Post-Deployment

### Testing
- [ ] OAuth flow tested in production
- [ ] Token refresh tested
- [ ] Rate limiting verified
- [ ] CORS working correctly
- [ ] Error responses appropriate
- [ ] All API endpoints secured

### Maintenance
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Secret rotation schedule
- [ ] Backup testing schedule
- [ ] Incident response tested

## 🚨 Common Vulnerabilities to Check

### OWASP Top 10
- [ ] **A01 - Broken Access Control**: All routes properly authenticated
- [ ] **A02 - Cryptographic Failures**: Secrets properly encrypted
- [ ] **A03 - Injection**: Input validation on all endpoints
- [ ] **A04 - Insecure Design**: Security by design principles
- [ ] **A05 - Security Misconfiguration**: Secure defaults everywhere
- [ ] **A06 - Vulnerable Components**: Dependencies up to date
- [ ] **A07 - Authentication Failures**: Strong auth implementation
- [ ] **A08 - Data Integrity Failures**: Signed JWTs, integrity checks
- [ ] **A09 - Logging Failures**: Proper logging and monitoring
- [ ] **A10 - SSRF**: Validate all external requests

### JWT Security
- [ ] Tokens not stored in localStorage (XSS risk)
- [ ] Short expiration times
- [ ] Refresh token rotation
- [ ] Token revocation capability
- [ ] Algorithm explicitly set (HS256/RS256)
- [ ] Signature verified on every request

### Session Security
- [ ] Session fixation prevented
- [ ] Session timeout configured
- [ ] Secure session storage (Redis in prod)
- [ ] Session invalidation on logout
- [ ] CSRF tokens where needed

### API Security
- [ ] Rate limiting per user/IP
- [ ] Request size limits
- [ ] Idempotency for mutations
- [ ] API versioning
- [ ] Proper HTTP methods
- [ ] Status codes appropriate

## 📝 Security Audit Commands

### Check for hardcoded secrets
```bash
grep -r "password\|secret\|key\|token" --include="*.js" --exclude-dir=node_modules .
```

### Check npm vulnerabilities
```bash
npm audit
npm audit fix
```

### Check outdated packages
```bash
npm outdated
```

### Scan for security issues (optional)
```bash
npm install -g snyk
snyk test
```

## 🔄 Regular Maintenance Schedule

### Weekly
- [ ] Review error logs
- [ ] Check failed login attempts
- [ ] Monitor rate limit hits
- [ ] Review new user registrations

### Monthly
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Security audit

### Quarterly
- [ ] Rotate JWT secrets
- [ ] Penetration testing
- [ ] Review user permissions
- [ ] Update security policies

### Annually
- [ ] Full security audit
- [ ] Disaster recovery test
- [ ] Compliance review
- [ ] Training refresh

## 🆘 Incident Response

### If Breach Detected
1. **Contain**: Disable affected systems
2. **Investigate**: Identify scope and impact
3. **Notify**: Alert users if data compromised
4. **Remediate**: Fix vulnerability
5. **Review**: Post-mortem and improvements

### Contact Information
- Security Team: security@yourcompany.com
- Incident Hotline: +1-XXX-XXX-XXXX

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated**: November 2025  
**Version**: 2.0.0
