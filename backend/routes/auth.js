const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

// ⭐ UPDATED: Handle referral code in OAuth state
router.get('/google', (req, res, next) => {
  const { ref } = req.query; // Referral code from URL
  
  // Pass referral code through OAuth state
  const state = ref ? JSON.stringify({ ref }) : undefined;
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state
  })(req, res, next);
});

// ⭐ UPDATED: Handle referral credits on callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    session: false 
  }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // ⭐ Check if this is a new user AND has referral code
      const isNewUser = user.timestamps.created_at.getTime() > (Date.now() - 5000); // Created within last 5 seconds
      
      if (isNewUser && req.query.state) {
        try {
          const state = JSON.parse(req.query.state);
          const referralCode = state.ref;
          
          if (referralCode) {
            console.log(`🎁 New user signup with referral code: ${referralCode}`);
            
            // Find the referrer
            const referrer = await User.findOne({ 'referral.code': referralCode });
            
            if (referrer && referrer._id.toString() !== user._id.toString()) {
              // ⭐ Give referral credits (10/7/5 based on count)
              await referrer.addReferralCredits(user);
              
              console.log(`✅ Referral credits given to ${referrer.email}`);
            }
          }
        } catch (parseError) {
          console.error('Error parsing referral state:', parseError);
        }
      }
      
      // Update last login
      user.timestamps.last_login = new Date();
      await user.save();
      
      // Generate JWT
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          plan: user.subscription.plan
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Redirect to frontend with token
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&success=true`;
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

// ============================================
// JWT AUTH ROUTES
// ============================================

// Logout (client-side handles token deletion)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        valid: false, 
        error: 'No token provided' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        valid: false, 
        error: 'User not found' 
      });
    }
    
    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.subscription.plan
      }
    });
    
  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      error: 'Invalid token' 
    });
  }
});

// ============================================
// REFERRAL VALIDATION
// ============================================

// ⭐ NEW: Validate referral code before signup
router.get('/referral/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const referrer = await User.findOne({ 'referral.code': code });
    
    if (referrer) {
      res.json({
        valid: true,
        referrer: {
          name: referrer.name,
          email: referrer.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Partially hide email
        }
      });
    } else {
      res.json({
        valid: false,
        message: 'Invalid referral code'
      });
    }
  } catch (error) {
    console.error('Referral validation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;