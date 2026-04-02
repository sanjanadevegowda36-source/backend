const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Middleware to check authentication and authorization
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, 'sanjucart_secret_key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is admin
    if (user.role === 'admin') {
      req.user = user;
      return next();
    }
    
    // Check if user is approved business agent
    if (user.role === 'business_agent' && user.isApproved) {
      req.user = user;
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied. Admin or approved business agent required.' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// @desc    Get all products (with optional brand filter)
router.get('/', async (req, res) => {
  try {
    const { brand } = req.query;
    const query = brand ? { brand: new RegExp(brand, 'i') } : {};
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Create a product (Admin or Approved Business Agent)
router.post('/', authMiddleware, async (req, res) => {
  const product = new Product({
    ...req.body,
    addedBy: req.user._id,
    addedByName: req.user.name
  });
  
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a product (Admin or Approved Business Agent who added it)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Business agents can only update their own products
    if (req.user.role === 'business_agent') {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      if (product.addedBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own products' });
      }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a product (Admin or Approved Business Agent who added it)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Business agents can only delete their own products
    if (req.user.role === 'business_agent') {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      if (product.addedBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own products' });
      }
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
