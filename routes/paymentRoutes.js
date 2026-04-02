const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Initialize Razorpay only if keys are configured
let razorpay = null;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && 
    RAZORPAY_KEY_ID !== 'your_razorpay_key_id' && 
    RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret') {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
}

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured',
        error: 'Razorpay keys not set in environment variables'
      });
    }

    const { amount, currency = 'INR' } = req.body;

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ 
      message: 'Error creating payment order',
      error: err.message 
    });
  }
});

// Verify payment signature
router.post('/verify-payment', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured',
        error: 'Razorpay keys not set in environment variables'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ 
      message: 'Error verifying payment',
      error: err.message 
    });
  }
});

// Get Razorpay key (for frontend)
router.get('/key', (req, res) => {
  if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === 'your_razorpay_key_id') {
    return res.status(503).json({ message: 'Payment gateway not configured' });
  }
  res.json({ key: RAZORPAY_KEY_ID });
});

module.exports = router;
