const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  gst: { type: Number, default: 18 },
  quantity: { type: Number, default: 1 },
  image: { type: String },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
