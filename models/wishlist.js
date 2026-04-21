const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  image: { type: String },
}, { _id: false });

const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [wishlistItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
