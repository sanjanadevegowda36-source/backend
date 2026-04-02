const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address, role, businessName, businessType, vehicleType, licenseNumber } = req.body;
    console.log('Registration attempt for:', email);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine if user needs approval
    const needsApproval = ['business_agent', 'delivery_agent'].includes(role);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      role: role || "user",
      isApproved: !needsApproval, // Auto-approve admin, professional, and regular users
      businessName: businessName || undefined,
      businessType: businessType || undefined,
      vehicleType: vehicleType || undefined,
      licenseNumber: licenseNumber || undefined
    });

    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser._id);

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      "sanjucart_secret_key",
      { expiresIn: "7d" }
    );

    // Different message based on whether approval is needed
    const message = needsApproval 
      ? "Registration submitted successfully. Please wait for admin approval."
      : "User registered successfully";

    res.status(201).json({
      success: true,
      message: message,
      token,
      user: {
        _id: newUser._id,
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        address: newUser.address,
        role: newUser.role,
        isApproved: newUser.isApproved,
        pageAccess: newUser.pageAccess || []
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error registering user", 
      error: error.message 
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Check if user is approved (for business/delivery agents)
    if (!user.isApproved && ['business_agent', 'delivery_agent'].includes(user.role)) {
      console.log('User not approved:', email);
      return res.status(403).json({ 
        success: false, 
        message: "Your account is pending approval. Please wait for admin to approve your registration." 
      });
    }

    console.log('Login successful for:', email);

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "sanjucart_secret_key",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        isApproved: user.isApproved,
        businessName: user.businessName,
        businessType: user.businessType,
        vehicleType: user.vehicleType,
        licenseNumber: user.licenseNumber,
        location: user.location,
        pageAccess: user.pageAccess || []
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error logging in", 
      error: error.message 
    });
  }
});

// Get all users (admin only)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      users: users.map(user => ({
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        isApproved: user.isApproved,
        businessName: user.businessName,
        businessType: user.businessType,
        vehicleType: user.vehicleType,
        licenseNumber: user.licenseNumber,
        location: user.location,
        pageAccess: user.pageAccess,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching users", 
      error: error.message 
    });
  }
});

// Approve or reject user (admin only)
router.put("/approve-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    user.isApproved = isApproved;
    await user.save();

    res.json({
      success: true,
      message: isApproved ? "User approved successfully" : "User rejected",
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error approving user", 
      error: error.message 
    });
  }
});

// Update user location (for delivery agents)
router.put("/update-location/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude, address } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    user.location = { latitude, longitude, address };
    await user.save();

    res.json({
      success: true,
      message: "Location updated successfully",
      user: {
        _id: user._id,
        location: user.location
      }
    });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating location", 
      error: error.message 
    });
  }
});

module.exports = router;
