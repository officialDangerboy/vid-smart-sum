const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// ============================================
// TIERED REFERRAL CREDIT CALCULATOR
// ============================================

function calculateReferralCredits(referralCount) {
  if (referralCount === 0) {
    return 50; // First referral: 50 credits
  } else if (referralCount === 1) {
    return 25; // Second referral: 25 credits
  } else {
    return 15; // Third onwards: 15 credits each
  }
}

// ============================================
// PROCESS REFERRAL (Tiered System)
// ============================================

async function processReferral(newUser, referralCode) {
  if (!referralCode) return null;
  
  const referrer = await User.findOne({ 'referral.code': referralCode });
  
  if (!referrer) {
    return { success: false, message: 'Invalid referral code' };
  }
  
  if (referrer._id.toString() === newUser._id.toString()) {
    return { success: false, message: 'Cannot refer yourself' };
  }
  
  // Calculate credits based on referrer's current referral count
  const currentReferralCount = referrer.referral.total_referrals;
  const creditsToGive = calculateReferralCredits(currentReferralCount);
  
  // Update new user with referrer info (NO CREDITS GIVEN TO NEW USER)
  newUser.referral = newUser.referral || {
    code: null,
    referred_by: null,
    referred_users: [],
    total_referrals: 0,
    total_credits_earned: 0
  };
  
  newUser.referral.referred_by = {
    user_id: referrer._id,
    email: referrer.email,
    code: referralCode,
    referred_at: new Date()
  };
  
  await newUser.save();
  
  // Add referred user to referrer's list
  referrer.referral.referred_users.push({
    user_id: newUser._id,
    email: newUser.email,
    signed_up_at: new Date(),
    credits_given: creditsToGive
  });
  
  // Update referrer stats
  referrer.referral.total_referrals += 1;
  referrer.referral.total_credits_earned += creditsToGive;
  
  // Give credits to referrer
  await referrer.addCredits(
    creditsToGive,
    'earned',
    `Referral #${currentReferralCount + 1}: ${newUser.email}`,
    {
      referred_user_id: newUser._id,
      referred_user_email: newUser.email,
      referral_number: currentReferralCount + 1
    }
  );
  
  if (referrer.credits.referral_credits !== undefined) {
    referrer.credits.referral_credits += creditsToGive;
  }
  
  await referrer.save();
  
  return {
    success: true,
    referrer_earned: creditsToGive,
    new_user_bonus: 0,
    referrer_email: referrer.email,
    referral_number: currentReferralCount + 1,
    tier: currentReferralCount === 0 ? '1st (50 credits)' : 
          currentReferralCount === 1 ? '2nd (25 credits)' : 
          '3rd+ (15 credits)'
  };
}

// ============================================
// PASSPORT GOOGLE STRATEGY
// ============================================

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const state = req.query.state;
        if (!state) {
          return done(new Error('Missing state parameter'), null);
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ googleId: profile.id });

        // EXISTING USER - Just login
        if (user) {
          user.timestamps.last_login = new Date();
          user.timestamps.last_activity = new Date();
          
          if (profile.photos && profile.photos[0]) {
            user.picture = profile.photos[0].value;
          }
          
          const ipAddress = req.ip || req.connection.remoteAddress;
          user.security = user.security || {};
          user.security.last_ip_address = ipAddress;
          
          await user.save();
          return done(null, user);
        }

        // NEW USER - Create account
        const ipAddress = req.ip || req.connection.remoteAddress;
        user = await User.create({
          googleId: profile.id,
          email: email,
          name: profile.displayName,
          picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          security: {
            last_ip_address: ipAddress,
            ip_addresses: [{
              ip: ipAddress,
              timestamp: new Date()
            }]
          }
        });

        // HANDLE REFERRAL IF EXISTS
        const referralCode = req.session?.referralCode;
        
        if (referralCode) {
          try {
            const result = await processReferral(user, referralCode);
            
            if (result && result.success) {
              // Referral processed successfully
              // No credits given to new user, only referrer gets tiered credits
            }
          } catch (referralError) {
            // Don't fail signup if referral fails
          }
        }

        // Clear referral code from session
        if (req.session) {
          delete req.session.referralCode;
        }

        done(null, user);
        
      } catch (error) {
        done(error, null);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};