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
  requireRole,
  requirePlan
};