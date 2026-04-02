const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  image: { type: String },
}, { _id: false });

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [wishlistItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
