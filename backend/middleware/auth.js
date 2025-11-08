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
 * IP Tracking Middleware - FIXED VERSION
 * Tracks user's IP addresses for security purposes
 * Prevents ParallelSaveError by queuing saves
 */
const trackIP = async (req, res, next) => {
  // Continue the request immediately
  next();

  // Handle IP tracking asynchronously without blocking
  if (req.user) {
    setImmediate(async () => {
      try {
        // Extract IP from headers (handles proxies, load balancers, etc.)
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.headers['x-real-ip'] ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          req.ip;

        if (ip) {
          // Fetch fresh user to avoid stale data
          const user = await User.findById(req.user._id);

          if (!user) return;

          // Initialize security object if it doesn't exist
          if (!user.security) {
            user.security = {
              ip_addresses: [],
              last_ip_address: null
            };
          }

          // Initialize ip_addresses array if it doesn't exist
          if (!Array.isArray(user.security.ip_addresses)) {
            user.security.ip_addresses = [];
          }

          // Check if IP is already tracked
          const ipExists = user.security.ip_addresses.some(entry => entry.ip === ip);

          if (!ipExists) {
            // Add new IP address with timestamp
            user.security.ip_addresses.push({
              ip: ip,
              timestamp: new Date()
            });

            // Keep only last 50 IP addresses
            if (user.security.ip_addresses.length > 50) {
              user.security.ip_addresses = user.security.ip_addresses.slice(-50);
            }

            console.log(`🔒 New IP tracked for user ${user.email}: ${ip}`);
          }

          // Update last IP address
          user.security.last_ip_address = ip;

          // Save with retry logic to handle potential conflicts
          let retries = 3;
          while (retries > 0) {
            try {
              await user.save();
              break; // Success, exit retry loop
            } catch (saveError) {
              if (saveError.name === 'VersionError' || saveError.message.includes('ParallelSaveError')) {
                retries--;
                if (retries > 0) {
                  // Wait a bit before retrying
                  await new Promise(resolve => setTimeout(resolve, 100));
                  // Fetch fresh user data
                  const freshUser = await User.findById(user._id);
                  if (freshUser) {
                    user.security = freshUser.security;
                  }
                } else {
                  throw saveError;
                }
              } else {
                throw saveError;
              }
            }
          }
        }
      } catch (error) {
        // Log error but don't throw - IP tracking is not critical
        console.error('IP tracking error:', error.message);
      }
    });
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