const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  image: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  shippingAddress: { type: String },
  paymentMethod: { type: String, default: 'cash_on_delivery' },
  // Delivery Agent fields
  deliveryAgent: {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent', default: null },
    agentName: { type: String, default: null },
    agentPhone: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: '' },
      updatedAt: { type: Date, default: null }
    }
  },
  trackingHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
