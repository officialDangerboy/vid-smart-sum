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
// PROCESS REFERRAL (Tiered System) - FIXED
// ============================================

async function processReferral(newUser, referralCode) {
  if (!referralCode) {
    console.log('⚠️ No referral code provided');
    return null;
  }
  
  console.log('🔍 Processing referral with code:', referralCode);
  console.log('👤 New user ID:', newUser._id);
  console.log('📧 New user email:', newUser.email);
  
  // CRITICAL: Fetch fresh referrer data
  const referrer = await User.findOne({ 'referral.code': referralCode });
  
  if (!referrer) {
    console.log('❌ Invalid referral code:', referralCode);
    return { success: false, message: 'Invalid referral code' };
  }
  
  console.log('✅ Referrer found:', referrer.email);
  console.log('💰 Referrer current balance:', referrer.credits.balance);
  
  if (referrer._id.toString() === newUser._id.toString()) {
    console.log('❌ User cannot refer themselves');
    return { success: false, message: 'Cannot refer yourself' };
  }
  
  // Calculate credits based on referrer's current referral count
  const currentReferralCount = referrer.referral?.total_referrals || 0;
  const creditsToGive = calculateReferralCredits(currentReferralCount);
  
  console.log(`💰 Credits to give: ${creditsToGive} (Referral #${currentReferralCount + 1})`);
  
  // STEP 1: Update new user with referrer info
  try {
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
    console.log('✅ New user updated with referrer info');
  } catch (error) {
    console.error('❌ Error updating new user:', error);
    return { success: false, message: 'Failed to update new user' };
  }
  
  // STEP 2: Update referrer - Add referred user to list
  try {
    referrer.referral = referrer.referral || {
      code: referralCode,
      referred_users: [],
      total_referrals: 0,
      total_credits_earned: 0
    };
    
    referrer.referral.referred_users.push({
      user_id: newUser._id,
      email: newUser.email,
      signed_up_at: new Date(),
      credits_given: creditsToGive
    });
    
    // Update referrer stats
    referrer.referral.total_referrals = (referrer.referral.total_referrals || 0) + 1;
    referrer.referral.total_credits_earned = (referrer.referral.total_credits_earned || 0) + creditsToGive;
    
    console.log('📊 Updated referrer stats:', {
      total_referrals: referrer.referral.total_referrals,
      total_credits_earned: referrer.referral.total_credits_earned
    });
    
  } catch (error) {
    console.error('❌ Error updating referrer data:', error);
  }
  
  // STEP 3: Give credits to referrer using addCredits method
  try {
    const balanceBefore = referrer.credits.balance;
    
    await referrer.addCredits(
      creditsToGive,
      'earned',
      `Referral reward: ${newUser.email} signed up`,
      {
        referred_user_id: newUser._id,
        referred_user_email: newUser.email,
        referral_number: currentReferralCount + 1,
        referral_tier: currentReferralCount === 0 ? '1st' : 
                       currentReferralCount === 1 ? '2nd' : '3rd+'
      }
    );
    
    const balanceAfter = referrer.credits.balance;
    
    console.log('✅ Credits added successfully!');
    console.log(`💰 Balance: ${balanceBefore} → ${balanceAfter} (+${creditsToGive})`);
    console.log('📝 Transaction logged in credit_transactions');
    
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    return { 
      success: false, 
      message: 'Failed to add credits',
      error: error.message 
    };
  }
  
  return {
    success: true,
    referrer_earned: creditsToGive,
    new_user_bonus: 0,
    referrer_email: referrer.email,
    referral_number: currentReferralCount + 1,
    tier: currentReferralCount === 0 ? '1st (50 credits)' : 
          currentReferralCount === 1 ? '2nd (25 credits)' : 
          '3rd+ (15 credits)',
    new_balance: referrer.credits.balance
  };
}

// ============================================
// PASSPORT GOOGLE STRATEGY - FIXED
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
          console.error('❌ Missing state parameter');
          return done(new Error('Missing state parameter'), null);
        }

        const email = profile.emails[0].value;
        console.log('👤 Processing OAuth for:', email);
        
        let user = await User.findOne({ googleId: profile.id });

        // EXISTING USER - Just login
        if (user) {
          console.log('✅ Existing user logged in:', email);
          
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
        console.log('🆕 Creating new user:', email);
        
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        // Initialize referral object properly
        user = new User({
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
          },
          referral: {
            code: null,
            referred_by: null,
            referred_users: [],
            total_referrals: 0,
            total_credits_earned: 0
          }
        });

        // SAVE USER FIRST - This ensures _id is generated
        await user.save();
        console.log('✅ New user created with ID:', user._id);

        // HANDLE REFERRAL AFTER USER IS SAVED
        const referralCode = req.session?.referralCode;
        
        console.log('🔗 Checking for referral code:', referralCode);
        
        if (referralCode) {
          try {
            console.log('🎁 Processing referral for new user...');
            
            // Small delay to ensure DB write is complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const result = await processReferral(user, referralCode);
            
            if (result && result.success) {
              console.log('✅✅✅ Referral processed successfully! ✅✅✅');
              console.log('📊 Referral details:', result);
            } else {
              console.log('⚠️ Referral processing failed:', result?.message);
              if (result?.error) {
                console.log('❌ Error details:', result.error);
              }
            }
          } catch (referralError) {
            // Don't fail signup if referral fails
            console.error('❌ Referral error (non-critical):', referralError);
            console.error('Stack trace:', referralError.stack);
          }
        } else {
          console.log('ℹ️ No referral code found for new user');
        }

        // Clear referral code from session
        if (req.session) {
          delete req.session.referralCode;
        }

        // Fetch updated user data to reflect any referral changes
        const updatedUser = await User.findById(user._id);
        done(null, updatedUser || user);
        
      } catch (error) {
        console.error('❌ OAuth Strategy Error:', error);
        console.error('Stack trace:', error.stack);
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