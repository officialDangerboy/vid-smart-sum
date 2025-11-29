const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticateJWT: protect } = require('../middleware/auth'); // ✅ FIXED
const User = require('../models/User');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan configurations
const PLANS = {
  pro_monthly: {
    amount: 79900, // ₹799 in paise
    currency: 'INR',
    duration: 30,
  },
  pro_yearly: {
    amount: 799900, // ₹7999 in paise
    currency: 'INR',
    duration: 365,
  },
};

// Create Order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { planType } = req.body;

    if (!PLANS[planType]) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const plan = PLANS[planType];
    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        planType: planType,
        email: req.user.email,
      },
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
      userData: {
        name: req.user.name,
        email: req.user.email,
        contact: req.user.phone || '',
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Verify Payment
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Fetch payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }

    // Update user subscription
    const plan = PLANS[planType];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'subscription.plan': planType,
          'subscription.status': 'active',
          'subscription.billing_cycle': planType === 'pro_monthly' ? 'monthly' : 'yearly',
          'subscription.started_at': startDate,
          'subscription.current_period_start': startDate,
          'subscription.current_period_end': endDate,
          'subscription.auto_renew': true,
        },
        $push: {
          payments: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            planType: planType,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('-password');

    // Update feature access
    updatedUser.updateFeatureAccess();
    await updatedUser.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Webhook Handler
router.post('/webhook', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSignature || !webhookSecret) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Get raw body for signature verification
    const body = req.body.toString('utf8');
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Webhook signature verification failed');
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Parse the body
    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload.payment.entity;

    console.log('Webhook event:', eventType);

    if (eventType === 'payment.captured') {
      const userId = payload.notes.userId;
      const planType = payload.notes.planType;
      const plan = PLANS[planType];

      if (userId && plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        await User.findByIdAndUpdate(userId, {
          $set: {
            'subscription.plan': planType,
            'subscription.status': 'active',
            'subscription.current_period_start': startDate,
            'subscription.current_period_end': endDate,
          },
        });

        console.log('Subscription updated via webhook for user:', userId);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed' });
  }
});

// Cancel Subscription
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'subscription.auto_renew': false,
          'subscription.cancel_at_period_end': true,
          'subscription.cancelled_at': new Date(),
        },
      },
      { new: true }
    ).select('-password');

    res.json({ success: true, message: 'Subscription cancelled', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel' });
  }
});

// Get Payment History
router.get('/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('payments');
    res.json({ success: true, payments: user.payments || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

module.exports = router;