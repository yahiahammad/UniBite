const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();


const Vendor = require('./Models/Vendor');
const MenuItem = require('./Models/MenuItems');


const { requireLogin, checkAuth, authenticateExecutive } = require('./Middleware/auth');


const { init } = require('./socket');


const app = express();
const server = http.createServer(app);
const io = init(server);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.set('auth', 'Views/Auth');


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


app.use(checkAuth);


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


app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated;
    res.locals.isExecutive = !!(req.user && req.user.userType === 'admin');
    next();
});


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ DB Error:', err));


const userRoutes = require('./Routes/userRoutes');
const vendorRoutes = require('./Routes/vendorRoutes');
const menuItemRoutes = require('./Routes/menuItemRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const cartRoutes = require('./Routes/cartRoutes');
const executiveRoutes = require('./Routes/executiveRoutes');
const newsletterRoutes = require('./Routes/newsletterRoutes');



app.use('/', userRoutes);
app.use('/api/users', userRoutes);


app.use('/api/vendors', vendorRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/executive', executiveRoutes);


app.use('/', orderRoutes);
app.use('/', adminRoutes);


app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Server is up and running! 🎉 /api/test works!' });
});


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


app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page Not Found',
        active: ''
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));