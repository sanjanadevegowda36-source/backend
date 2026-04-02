const User = require("../models/user");

// Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const newUser = new User({
      name,
      email,
      phone,
    });

    await newUser.save();

    res.json({
      message: "User Saved Successfully",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};