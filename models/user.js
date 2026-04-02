const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  address: { type: String },
  role: { 
    type: String, 
    default: "user", 
    enum: ["user", "admin", "professional", "business_agent", "delivery_agent"] 
  },
  /* Approval status for business and delivery agents */
  isApproved: { type: Boolean, default: false },
  /* Business agent specific fields */
  businessName: { type: String },
  businessType: { type: String },
  /* Delivery agent specific fields */
  vehicleType: { type: String },
  licenseNumber: { type: String },
  /* Location for delivery agent */
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  pageAccess: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
