const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');

// Get wishlist by userId
router.get('/:userId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId });
    if (!wishlist) {
      return res.json({ userId: req.params.userId, items: [] });
    }
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add item to wishlist
router.post('/:userId', async (req, res) => {
  try {
    const { productId, name, brand, price, discount, image } = req.body;
    
    let wishlist = await Wishlist.findOne({ userId: req.params.userId });
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.params.userId, items: [] });
    }
    
    const existingItem = wishlist.items.find(item => item.productId.toString() === productId);
    
    if (existingItem) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }
    
    wishlist.items.push({ productId, name, brand, price, discount, image });
    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove item from wishlist
router.delete('/:userId/:productId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== req.params.productId);
    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear wishlist
router.delete('/:userId', async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
