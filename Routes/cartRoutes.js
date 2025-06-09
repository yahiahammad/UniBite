const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');

// Get cart page
router.get('/', protect, (req, res) => {
    res.render('Cart');
});

// Get checkout page
router.get('/checkout', protect, (req, res) => {
    res.render('checkout');
});

module.exports = router; 