const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const mongoose = require('mongoose');

// Get all carts (admin)
router.get('/', async (req, res) => {
  try {
    const carts = await Cart.find();
    res.json(carts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get cart by userId - handle errors gracefully
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const cart = await Cart.findOne({ userId: userId });
    
    if (!cart) {
      return res.json({ userId: userId, items: [] });
    }
    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err.message);
    // Return empty cart instead of error - this handles invalid ObjectId
    res.json({ userId: req.params.userId, items: [] });
  }
});

// Add item to cart
router.post('/:userId', async (req, res) => {
  try {
    const { productId, name, brand, price, discount, profit, gst, quantity, image } = req.body;
    
    let cart = await Cart.findOne({ userId: req.params.userId });
    
    if (!cart) {
      cart = new Cart({ userId: req.params.userId, items: [] });
    }
    
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId && item.productId.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      cart.items.push({ productId, name, brand, price, discount, profit, gst, quantity: quantity || 1, image });
    }
    
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Update cart item quantity
router.put('/:userId/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.params.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item.productId && item.productId.toString() === req.params.productId
    );
    
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
    }
    
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Error updating cart:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Remove item from cart
router.delete('/:userId/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => 
      !item.productId || item.productId.toString() !== req.params.productId
    );
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Error removing from cart:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Clear cart
router.delete('/:userId', async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
