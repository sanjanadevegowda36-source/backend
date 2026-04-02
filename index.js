
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const workerTaskRoutes = require('./routes/workerTaskRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryAgentRoutes = require('./routes/deliveryAgentRoutes');
const User = require('./models/user');

const app = express();             

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tasks', workerTaskRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/delivery-agents', deliveryAgentRoutes);


// MongoDB Connection
console.log('Connecting to MongoDB with URI:', process.env.MONGO_URI || 'not defined');
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected to: " + process.env.MONGO_URI);
    
    // Create default admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@sanjucart.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@sanjucart.com',
        password: hashedPassword,
        phoneNumber: '1234567890',
        address: 'Admin Office',
        role: 'admin',
        pageAccess: ['home', 'about', 'products', 'blog', 'contact', 'cart', 'dashboard', 'orders', 'admin', 'professional']
      });
      console.log('✅ Default admin user created: admin@sanjucart.com / admin123');
    }
  })
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Test Route
app.get("/", (req, res) => {
  res.send("Backend Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);