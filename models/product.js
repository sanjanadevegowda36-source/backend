const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  detailedDescription: { type: String, default: '' },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  gst: { type: Number, default: 18 },
  iconName: { type: String, default: 'FaBox' },
  image: { type: String },
  // Track who added the product
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedByName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
