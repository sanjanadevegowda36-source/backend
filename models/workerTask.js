const mongoose = require('mongoose');

const workerTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'delivery', 'support', 'other'],
    default: 'order'
  },
  assignedTo: {
    type: String, // Professional email
    required: true
  },
  assignedBy: {
    type: String, // Admin email
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  orderId: {
    type: String
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkerTask', workerTaskSchema);
