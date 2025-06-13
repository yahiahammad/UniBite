// server.js
const express = require('express');
const http = require('http'); // Import http module
const mongoose = require('mongoose');
const path = require("path");
const cors = require('cors');
const Vendor = require('./Models/Vendor');
const MenuItem = require('./Models/MenuItems');
require('dotenv').config(); // Load environment variables from .env
const cookieParser = require('cookie-parser');
const { requireLogin, checkAuth, authenticateExecutive} = require('./Middleware/auth');
const { init } = require('./socket'); // Import the init function

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = init(server); // Initialize Socket.IO and pass the server

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.set('auth', 'Views/Auth');

// CORS configuration
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Add checkAuth middleware to all routes
app.use(checkAuth);

// Sanitize user data before making it available to views
app.use((req, res, next) => {
    if (req.user) {
        // Create a sanitized version of the user object
        const sanitizedUser = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phoneNumber: req.user.phoneNumber,
            role: req.user.role,
            createdAt: req.user.createdAt,
            userType: req.user.userType
        };
        // Replace the user object with the sanitized version
        req.user = sanitizedUser;
    }
    next();
});

// Make isAuthenticated available to all views
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated;
    next();
});

// Middleware to check if the user is an executive (admin)
// This makes `isExecutive` available to all templates
app.use((req, res, next) => {
    res.locals.isExecutive = !!(req.user && req.user.userType === 'admin');
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
const executiveRoutes = require('./Routes/executiveRoutes');
const newsletterRoutes = require('./Routes/newsletterRoutes');

// --- MOUNT YOUR ROUTES ---
// Mount user routes for both API and page rendering
app.use('/', userRoutes); // This will handle page rendering routes
app.use('/api/users', userRoutes); // This will handle API routes

// Mount other routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/', orderRoutes); // Mount order page routes at root level
app.use('/api/orders', orderRoutes); // Mount order API routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/', adminRoutes);
app.use('/api/executive', executiveRoutes);

app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Server is up and running! 🎉 /api/test works!' });
});

app.use(express.static(path.join(__dirname, 'Public')));

//Routing
app.get('/', (req, res) => {
    res.render('UniBite');
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

app.get('/executive', authenticateExecutive, (req, res) => {
    res.render('executive', { active: 'executive', authenticateExecutive: true });
});

app.get('/cart', requireLogin, (req, res) => {
    res.render('Cart', { active: 'cart' });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page Not Found',
        active: ''
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`)); // Use server.listen