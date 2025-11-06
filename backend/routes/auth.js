const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

// Store CSRF tokens temporarily (use Redis in production)
const csrfTokens = new Map();
const CSRF_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REFRESH_TOKENS = 5;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate JWT access and refresh tokens for a user
 */
function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      plan: user.subscription.plan
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

/**
 * Get cookie configuration based on environment
 */
function getCookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAge,
    path: '/',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
  };
}

/**
 * Clean up expired CSRF tokens from memory
 */
function cleanupExpiredTokens() {
  for (const [token, data] of csrfTokens.entries()) {
    if (Date.now() - data.timestamp > CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(token);
    }
  }
}

/**
 * Store refresh token in user's security object
 */
async function storeRefreshToken(user, refreshToken) {
  user.security = user.security || {};
  user.security.refresh_tokens = user.security.refresh_tokens || [];
  
  user.security.refresh_tokens.push({
    token: refreshToken,
    created_at: new Date(),
    expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
  });

  // Keep only the most recent tokens
  if (user.security.refresh_tokens.length > MAX_REFRESH_TOKENS) {
    user.security.refresh_tokens = user.security.refresh_tokens.slice(-MAX_REFRESH_TOKENS);
  }

  await user.save();
}

/**
 * Verify and validate refresh token
 */
function isValidRefreshToken(user, refreshToken) {
  return user.security.refresh_tokens?.some(
    t => t.token === refreshToken && new Date(t.expires_at) > new Date()
  );
}

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

/**
 * Initiate Google OAuth flow
 * Handles referral codes and CSRF protection
 */
router.get('/google', (req, res, next) => {
  // Generate CSRF token for security
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const referralCode = req.query.ref;
  
  // Store referral code in session if provided
  if (referralCode) {
    req.session.referralCode = referralCode;
  }

  // Store CSRF token with metadata
  csrfTokens.set(csrfToken, {
    timestamp: Date.now(),
    referralCode: referralCode || null
  });

  // Clean up old tokens
  cleanupExpiredTokens();

  // Redirect to Google OAuth
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: csrfToken
  })(req, res, next);
});

/**
 * Google OAuth callback handler
 * Validates CSRF, generates tokens, sets cookies
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth/callback?error=access_denied`,
    session: false
  }),
  async (req, res) => {
    try {
      const state = req.query.state;
      
      // Verify CSRF token
      if (!state || !csrfTokens.has(state)) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=csrf_failed`);
      }
      
      // Remove used CSRF token
      csrfTokens.delete(state);

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(req.user);

      // Store refresh token securely
      await storeRefreshToken(req.user, refreshToken);

      // DON'T set cookies - send tokens in URL instead
      // (cookies don't work cross-domain on Vercel)
      
      // Redirect with tokens in URL
      const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('success', 'true');
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('refreshToken', refreshToken);
      
      res.redirect(redirectUrl.toString());

    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=server_error`);
    }
  }
);

// ============================================
// TOKEN MANAGEMENT ROUTES
// ============================================

/**
 * Refresh expired access token using refresh token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'No refresh token provided',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Validate token exists in database
    if (!isValidRefreshToken(user, refreshToken)) {
      return res.status(401).json({ 
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Remove old refresh token and store new one
    user.security.refresh_tokens = user.security.refresh_tokens.filter(
      t => t.token !== refreshToken
    );
    await storeRefreshToken(user, tokens.refreshToken);

    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_MS));

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Refresh token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(401).json({ 
      error: 'Invalid refresh token',
      code: 'INVALID_TOKEN'
    });
  }
});

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
router.post('/revoke-all-sessions', async (req, res) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Clear all refresh tokens
    user.security.refresh_tokens = [];
    await user.save();

    // Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.json({
      success: true,
      message: 'All sessions revoked successfully'
    });

  } catch (error) {
    console.error('Revoke sessions error:', error);
    res.status(500).json({ 
      error: 'Failed to revoke sessions',
      code: 'REVOKE_FAILED'
    });
  }
});

// ============================================
// SESSION MANAGEMENT ROUTES
// ============================================

/**
 * Get current authenticated user information
 */
router.get('/user', async (req, res) => {
  try {
    // Try header first (for localStorage tokens), then cookies (for local dev)
    let accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      accessToken = req.cookies.accessToken;
    }

    if (!accessToken) {
      return res.status(401).json({
        error: 'Not authenticated',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'INVALID_USER'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        plan: user.subscription?.plan || 'free',
        credits: user.credits?.balance || 100,
        createdAt: user.timestamps?.created_at || user.createdAt,
        lastLogin: user.timestamps?.last_login || new Date()
      }
    });

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

    console.error('Get user error:', error);
    res.status(401).json({
      error: 'Not authenticated',
      code: 'AUTH_FAILED'
    });
  }
});

/**
 * Logout user and revoke current refresh token
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    // Revoke refresh token if present
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (user) {
          user.security.refresh_tokens = user.security.refresh_tokens?.filter(
            t => t.token !== refreshToken
          ) || [];
          await user.save();
        }
      } catch (err) {
        // Token invalid or expired, continue with logout
        console.log('Invalid token during logout:', err.message);
      }
    }

    // Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Always clear cookies even if there's an error
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({ 
      success: true, 
      message: 'Logged out' 
    });
  }
});

module.exports = router;