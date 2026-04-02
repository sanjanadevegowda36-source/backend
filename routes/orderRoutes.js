const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const User = require('../models/user');

// Get all orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders by userId
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders by user email
router.get('/user/email/:email', async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { userId, userEmail, userName, items, totalAmount, shippingAddress, paymentMethod } = req.body;
    
    const order = new Order({
      userId,
      userEmail,
      userName,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'pending'
    });
    
    const newOrder = await order.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const { status, note } = req.body;
    const updateData = { status };
    
    // Add to tracking history
    if (status) {
      const order = await Order.findById(req.params.id);
      if (order) {
        order.trackingHistory.push({
          status,
          timestamp: Date.now(),
          note: note || `Order status updated to ${status}`
        });
        await order.save();
      }
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending orders available for delivery (for delivery agents)
router.get('/available/delivery', async (req, res) => {
  try {
    // Get orders that don't have a delivery agent assigned and are not cancelled
    const orders = await Order.find({
      $or: [
        { deliveryAgent: null },
        { 'deliveryAgent.agentId': { $exists: false } },
        { 'deliveryAgent.agentId': null }
      ],
      status: { $in: ['pending', 'processing'] }
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get delivery agent's assigned orders
router.get('/delivery-agent/:agentId', async (req, res) => {
  try {
    const orders = await Order.find({
      'deliveryAgent.agentId': req.params.agentId
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delivery agent accepts an order
router.patch('/:id/accept-order', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'delivery_agent' || !agent.isApproved) {
      return res.status(403).json({ message: 'Invalid or unapproved delivery agent' });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.deliveryAgent && order.deliveryAgent.agentId) {
      return res.status(400).json({ message: 'Order already has a delivery agent' });
    }
    
    // Update order with delivery agent
    order.deliveryAgent = {
      agentId: agent._id,
      agentName: agent.name,
      agentPhone: agent.phoneNumber,
      assignedAt: Date.now(),
      currentLocation: agent.location || {}
    };
    
    // Update order status
    order.status = 'shipped';
    
    // Add to tracking history
    order.trackingHistory.push({
      status: 'shipped',
      timestamp: Date.now(),
      note: `Order accepted by delivery agent: ${agent.name}`
    });
    
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign delivery agent to order (admin)
router.patch('/:id/assign-agent', async (req, res) => {
  try {
    const { agentId, agentName, agentPhone } = req.body;
    
    if (!agentId || !agentName || !agentPhone) {
      return res.status(400).json({ message: 'Agent ID, name, and phone are required' });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order with delivery agent
    order.deliveryAgent = {
      agentId,
      agentName,
      agentPhone,
      assignedAt: Date.now()
    };
    
    // Update order status to shipped
    order.status = 'shipped';
    
    // Add to tracking history
    order.trackingHistory.push({
      status: 'shipped',
      timestamp: Date.now(),
      note: `Order assigned to delivery agent: ${agentName}`
    });
    
    await order.save();
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update delivery agent location for an order
router.patch('/:id/agent-location', async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (!order.deliveryAgent || !order.deliveryAgent.agentId) {
      return res.status(400).json({ message: 'No delivery agent assigned to this order' });
    }
    
    order.deliveryAgent.currentLocation = {
      latitude,
      longitude,
      address,
      updatedAt: Date.now()
    };
    
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
