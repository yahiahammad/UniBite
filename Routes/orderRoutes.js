const express = require('express');
const router = express.Router();
const { requireLogin } = require('../Middleware/auth');
const orderController = require('../Controllers/orderController');

// Page routes (these will be mounted at root level)
router.get('/checkout', requireLogin, (req, res) => {
    res.render('checkout');
});

router.get('/orders', requireLogin, (req, res) => {
    res.render('orders', { 
        active: 'orders',
        user: req.user
    });
});

router.get('/order/confirmation', (req, res) => {
    res.render('order-confirmation');
});

// API routes (these will be mounted at /api/orders)
router.get('/user', requireLogin, orderController.getUserOrders);
router.post('/submit', requireLogin, orderController.submitOrder);

module.exports = router;
