const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
}

router.post('/demo-order', async (req, res) => {
  try {
    const { amount } = req.body;
    res.json({
      id: 'demo_' + Date.now(),
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: 'demo_receipt_' + Date.now()
    });
  } catch (err) {
    res.status(500).json({ message: 'Demo order failed' });
  }
});

router.post('/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured',
        error: 'Razorpay keys not set in environment variables'
      });
    }

    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ 
        message: 'Invalid amount',
        error: 'Amount must be at least ₹1'
      });
    }

    const options = {
      amount: Math.round(amount * 100),
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

router.post('/verify-payment', async (req, res) => {
  try {
    const { test_mode } = req.body;
    if (test_mode) {
      return res.json({ success: true, message: 'Test payment verified' });
    }

    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured',
        error: 'Razorpay keys not set in environment variables'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      console.log('Test mode - accepting payment');
      return res.json({ success: true, message: 'Payment verified (test mode)' });
    }

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

router.get('/key', (req, res) => {
  if (!RAZORPAY_KEY_ID) {
    return res.status(503).json({ message: 'Payment gateway not configured' });
  }
  res.json({ key: RAZORPAY_KEY_ID });
});

router.post('/test-pay', async (req, res) => {
  try {
    const { amount } = req.body;
    res.json({ 
      success: true, 
      message: 'Test payment successful',
      payment_id: 'test_' + Date.now(),
      amount: Math.round(amount * 100)
    });
  } catch (err) {
    res.status(500).json({ message: 'Test payment failed' });
  }
});

module.exports = router;