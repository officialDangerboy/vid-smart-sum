const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Supports both Authorization header and cookies
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Check Authorization header first (for localStorage tokens), then cookies
    let accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      accessToken = req.cookies?.accessToken;
    }

    if (!accessToken) {
      return res.status(401).json({
        error: 'Not authenticated',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user || !user.flags?.is_active) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'INVALID_USER'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional JWT Authentication
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      accessToken = req.cookies?.accessToken;
    }

    if (accessToken) {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.flags?.is_active) {
        req.user = user;
        req.userId = user._id;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};

/**
 * IP Tracking Middleware
 * Tracks user's IP addresses for security purposes
 */
const trackIP = async (req, res, next) => {
  try {
    if (req.user) {
      // Extract IP from headers (handles proxies, load balancers, etc.)
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                 req.headers['x-real-ip'] || 
                 req.connection?.remoteAddress || 
                 req.socket?.remoteAddress ||
                 req.ip;

      if (ip) {
        // Initialize security object if it doesn't exist
        if (!req.user.security) {
          req.user.security = {
            ip_addresses: [],
            last_ip: null,
            failed_login_attempts: 0,
            last_failed_login: null,
            account_locked_until: null
          };
        }

        // Initialize ip_addresses array if it doesn't exist
        if (!req.user.security.ip_addresses) {
          req.user.security.ip_addresses = [];
        }

        // Add new IP if not already tracked
        if (!req.user.security.ip_addresses.includes(ip)) {
          req.user.security.ip_addresses.push(ip);
          console.log(`🔒 New IP tracked for user ${req.user.email}: ${ip}`);
        }

        // Update last IP
        req.user.security.last_ip = ip;

        // Save user (don't await to avoid blocking the request)
        req.user.save().catch(err => {
          console.error('Error saving IP tracking:', err);
        });
      }
    }
    next();
  } catch (error) {
    console.error('IP tracking error:', error);
    // Continue even if tracking fails - don't block the request
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        code: 'NO_USER'
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * Check subscription plan middleware
 */
const requirePlan = (requiredPlans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        code: 'NO_USER'
      });
    }

    const userPlan = req.user.subscription?.plan || 'free';
    
    if (!requiredPlans.includes(userPlan)) {
      return res.status(403).json({
        error: 'Upgrade required',
        code: 'PLAN_REQUIRED',
        requiredPlans
      });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  trackIP,
  requireRole,
  requirePlan
};