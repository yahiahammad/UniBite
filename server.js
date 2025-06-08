// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
const cors = require('cors');
const Vendor = require('./Models/Vendor');
const MenuItem = require('./Models/MenuItems');
require('dotenv').config(); // Load environment variables from .env
const cookieParser = require('cookie-parser');
const { requireLogin, checkAuth } = require('./Middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.set('auth', 'Views/Auth');

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Add checkAuth middleware to all routes
app.use(checkAuth);

// Make isAuthenticated available to all views
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated;
    next();
});

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
const cartRoutes = require('./Routes/cartRoutes');

// --- MOUNT YOUR ROUTES (This was missing!) ---
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/menuitems', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/', adminRoutes);
app.use('/cart', cartRoutes);

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

app.get('/Stores', requireLogin, async (req, res) => {
    try {
        const vendors = await Vendor.find({ isActive: true });
        res.render('Stores', { stores: vendors });
    } catch (error) {
        res.render('Stores', { stores: [] });
    }
});

app.get('/stores', requireLogin, async (req, res) => {
    try {
        const vendors = await Vendor.find({ isActive: true });
        res.render('Stores', { stores: vendors });
    } catch (error) {
        res.render('Stores', { stores: [] });
    }
});

app.get('/stores/:name', requireLogin, async (req, res) => {
    try {
        const vendorName = req.params.name;
        const vendor = await Vendor.findOne({ name: vendorName, isActive: true });

        if (!vendor) {
            return res.status(404).render('error', { message: 'Store not found' });
        }

        // Fetch menu items for this vendor
        const menuItems = await MenuItem.find({ vendorId: vendor._id, available: true });

        // Group menu items by category
        const menuByCategory = menuItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.render('store-detail', {
            title: vendor.name,
            vendor: vendor,
            menuItems: menuByCategory,
            categories: Object.keys(menuByCategory),
            active: 'stores'
        });
    } catch (error) {
        console.error('Error fetching store details:', error);
        res.status(500).render('error', { message: 'Error loading store details' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page Not Found',
        active: ''
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));