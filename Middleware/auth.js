// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Vendor = require('../Models/Vendor');

// Vendor-specific auth middleware (hardcoded email)
const auth = async (req, res, next) => {
    try {
        // Find the vendor by email
        const vendor = await Vendor.findOne({ email: 'mycorner@unibitecanteam.com' });

        if (!vendor) {
            console.log('Vendor not found in auth middleware');
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Set user info from vendor
        req.user = {
            id: vendor._id,
            email: vendor.email
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Protect routes - require authentication
const protect = (req, res, next) => {
    let token = req.cookies.jwt;
    if (!token) return res.redirect('/login');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/login');
    }
};

// Check auth status without redirecting
const checkAuth = async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
                req.isAuthenticated = true;
            }
        } catch (error) {
            req.isAuthenticated = false;
        }
    } else {
        req.isAuthenticated = false;
    }
    next();
};

// Require login with redirect
function requireLogin(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) {
        return res.redirect('/login');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/login');
    }
}

module.exports = { auth, protect, checkAuth, requireLogin };