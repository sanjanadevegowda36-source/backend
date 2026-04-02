const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'car', 'van', 'truck'],
    default: 'bike'
  },
  vehicleNumber: {
    type: String,
    trim: true,
    default: ''
  },
  area: {
    type: String,
    trim: true,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
  },
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
deliveryAgentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
