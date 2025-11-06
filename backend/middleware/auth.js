const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================

exports.authenticateJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.flags.is_active) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'INVALID_USER'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// ============================================
// OPTIONAL AUTH (doesn't fail if no token)
// ============================================

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.flags.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silent fail for optional auth
  }
  
  next();
};

// ============================================
// PLAN-BASED ACCESS CONTROL
// ============================================

exports.requirePlan = (...allowedPlans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPlan = req.user.subscription?.plan || 'free';

    if (!allowedPlans.includes(userPlan)) {
      return res.status(403).json({ 
        error: 'This feature requires a premium plan',
        current_plan: userPlan,
        required_plans: allowedPlans
      });
    }

    next();
  };
};

// ============================================
// RATE LIMITING (IP + User based)
// ============================================

const rateLimitStore = new Map();

exports.rateLimit = (options = {}) => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message = 'Too many requests, please try again later'
  } = options;

  return (req, res, next) => {
    const key = req.user?._id?.toString() || 
                req.ip || 
                req.headers['x-forwarded-for']?.split(',')[0] ||
                req.connection.remoteAddress;

    const now = Date.now();
    const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    rateLimitStore.set(key, record);

    // Clean up old entries (1% chance)
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
          rateLimitStore.delete(k);
        }
      }
    }

    if (record.count > maxRequests) {
      return res.status(429).json({ 
        error: message,
        retry_after: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    next();
  };
};

// ============================================
// IP TRACKING
// ============================================

exports.trackIP = async (req, res, next) => {
  if (req.user) {
    try {
      const ipAddress = req.ip || 
                       req.headers['x-forwarded-for']?.split(',')[0] || 
                       req.connection.remoteAddress;
      
      req.user.security = req.user.security || {};
      req.user.security.last_ip_address = ipAddress;
      
      req.user.security.ip_addresses = req.user.security.ip_addresses || [];
      const existingIP = req.user.security.ip_addresses.find(ip => ip.ip === ipAddress);
      
      if (!existingIP) {
        req.user.security.ip_addresses.push({
          ip: ipAddress,
          timestamp: new Date()
        });
        
        if (req.user.security.ip_addresses.length > 20) {
          req.user.security.ip_addresses = req.user.security.ip_addresses.slice(-20);
        }
      }
      
      await req.user.save();
    } catch (error) {
      // Silent fail for IP tracking
    }
  }
  next();
};

// ============================================
// SECURITY HEADERS
// ============================================

exports.securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// ============================================
// LEGACY SESSION-BASED AUTH
// ============================================

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized - Please login' });
};

module.exports = exports;