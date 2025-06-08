// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
const cors = require('cors');
const Vendor = require('./Models/Vendor');
require('dotenv').config(); // Load environment variables from .env
const cookieParser = require('cookie-parser');
const { requireLogin } = require('./Middleware/auth'); // <--- NEW

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.set('auth', 'Views/Auth');


// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser());

// Connect to MongoDB (removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ DB Error:', err));

// --- Import all your modular route files (using capital 'Routes') ---
// Make sure these files exist in your 'Routes/' directory
const userRoutes = require('./Routes/userRoutes');
const vendorRoutes = require('./Routes/vendorRoutes');
const menuItemRoutes = require('./Routes/menuItemRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');
const adminRoutes = require('./Routes/adminRoutes');

// --- MOUNT YOUR ROUTES (This was missing!) ---
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/menuitems', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/', require('./Routes/adminRoutes'));

app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Server is up and running! 🎉 /api/test works!' });
});



app.use(express.static(path.join(__dirname, 'Public')));

//Routing
app.get('/', (req, res) => {
    res.render('UniBite');
});

app.get('/login', (req, res) => {
    res.render('Auth/Login');
});

app.get('/SignUp', (req, res) => {
    res.render('Auth/SignUp');
});

app.get('/Product-details', (req, res) => {
    res.render('Products/Product-details');
});

app.get('/Products', (req, res) => {
    res.render('Products/Products');
});

app.get('/About-us', (req, res) => {
    res.render('About-us');
});

app.get('/Help', (req, res) => {
    res.render('Help');
});

app.get('/Help', requireLogin, async (req, res) => {
    try {
        const vendors = await Vendor.find({ isActive: true });
        res.render('Help', { stores: vendors });
    } catch (error) {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/login');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));