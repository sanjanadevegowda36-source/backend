const express = require('express');
const router = express.Router();
const DeliveryAgent = require('../models/deliveryAgent');

// Validation helper
const validatePhoneNumber = (phone) => {
  // Indian phone number validation (10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Get all delivery agents
router.get('/', async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all agents (including inactive)
router.get('/all', async (req, res) => {
  try {
    const agents = await DeliveryAgent.find().sort({ createdAt: -1 });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get available agents
router.get('/available', async (req, res) => {
  try {
    const agents = await DeliveryAgent.find({ isAvailable: true, isActive: true });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    }
    res.json(agent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new delivery agent
router.post('/', async (req, res) => {
  try {
    const { name, phoneNumber, email, vehicleType, vehicleNumber, area } = req.body;

    // Validation
    if (!name || !phoneNumber) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number. Must be 10 digits starting with 6-9' });
    }

    // Check if agent with same phone exists
    const existingAgent = await DeliveryAgent.findOne({ phoneNumber });
    if (existingAgent) {
      return res.status(400).json({ message: 'Delivery agent with this phone number already exists' });
    }

    const agent = new DeliveryAgent({
      name,
      phoneNumber,
      email,
      vehicleType,
      vehicleNumber,
      area
    });

    const newAgent = await agent.save();
    res.status(201).json(newAgent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update delivery agent
router.put('/:id', async (req, res) => {
  try {
    const { name, phoneNumber, email, vehicleType, vehicleNumber, area, isAvailable, isActive } = req.body;

    // Validation for phone if provided
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number. Must be 10 digits starting with 6-9' });
    }

    // Check if phone is being changed to an existing one
    if (phoneNumber) {
      const existingAgent = await DeliveryAgent.findOne({ 
        phoneNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingAgent) {
        return res.status(400).json({ message: 'Phone number already in use by another agent' });
      }
    }

    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        phoneNumber, 
        email, 
        vehicleType, 
        vehicleNumber, 
        area, 
        isAvailable, 
        isActive 
      },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    }

    res.json(agent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update agent availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    }

    res.json(agent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update agent location
router.patch('/:id/location', async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { 
        currentLocation: { latitude, longitude, address, updatedAt: Date.now() } 
      },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    }

    res.json(agent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete (deactivate) delivery agent
router.delete('/:id', async (req, res) => {
  try {
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    }

    res.json({ message: 'Delivery agent deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
