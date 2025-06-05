const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-eats', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Middleware setup
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-eats',
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Session Authentication middleware
const authenticateSession = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.accountType)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

// Make middleware available globally
app.use((req, res, next) => {
    req.authenticateJWT = authenticateJWT;
    req.authenticateSession = authenticateSession;
    req.authorize = authorize;
    next();
});

// Global variables for views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cartCount = req.session.cartCount || 0;
    res.locals.currentPath = req.path;
    next();
});

// Route mounting
app.use('/auth', authRoutes);
app.use('/stores', storeRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Campus Eats - MIU Food Delivery',
        stores: [] // Will be populated from database
    });
});

// About page
app.get('/about', (req, res) => {
    res.render('About-us', { title: 'About Us - Campus Eats' });
});

// Help page
app.get('/help', (req, res) => {
    res.render('Help', { title: 'Help - Campus Eats' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Handle different error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid ID format'
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            message: 'Duplicate field value entered'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});