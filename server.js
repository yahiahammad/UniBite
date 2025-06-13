// server.js

// --- Dependencies ---
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// --- Models ---
const Vendor = require('./Models/Vendor');
const MenuItem = require('./Models/MenuItems');

// --- Middleware ---
const { requireLogin, checkAuth, authenticateExecutive } = require('./Middleware/auth');

// --- Socket.IO Setup ---
const { init } = require('./socket');

// --- Initialize Express App ---
const app = express();
const server = http.createServer(app);
const io = init(server);

// --- View Engine Setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.set('auth', 'Views/Auth');

// --- Middleware Configuration ---
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));

// --- Authentication Middleware ---
app.use(checkAuth);

// --- User Data Sanitization Middleware ---
app.use((req, res, next) => {
    if (req.user) {
        const sanitizedUser = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phoneNumber: req.user.phoneNumber,
            role: req.user.role,
            createdAt: req.user.createdAt,
            userType: req.user.userType
        };
        req.user = sanitizedUser;
    }
    next();
});

// --- View Helpers Middleware ---
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated;
    res.locals.isExecutive = !!(req.user && req.user.userType === 'admin');
    next();
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ DB Error:', err));

// --- Route Imports ---
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const executiveRoutes = require('./routes/executiveRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

// --- Route Mounting ---
// User routes (both API and page rendering)
app.use('/', userRoutes);
app.use('/api/users', userRoutes);

// API routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/executive', executiveRoutes);

// Page routes
app.use('/', orderRoutes);
app.use('/', adminRoutes);

// --- Test Route ---
app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Server is up and running! 🎉 /api/test works!' });
});

// --- Page Routes ---
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

        const menuItems = await MenuItem.find({ vendorId: vendor._id, available: true });
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

// --- Error Handler ---
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page Not Found',
        active: ''
    });
});

// --- Server Start ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));