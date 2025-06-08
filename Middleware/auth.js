// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

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

module.exports = { protect, checkAuth, requireLogin };