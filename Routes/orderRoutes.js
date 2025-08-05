const express = require('express');
const router = express.Router();
const { requireLogin } = require('../Middleware/auth');
const orderController = require('../Controllers/orderController');


router.get('/checkout', requireLogin, (req, res) => {
    res.render('checkout');
});

router.get('/orders', requireLogin, (req, res) => {
    res.render('orders', { 
        active: 'orders',
        user: req.user
    });
});

const path = require('path');

router.get('/order/confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/payment/gateway.html'));
});


router.get('/user', requireLogin, orderController.getUserOrders);
router.post('/submit', requireLogin, orderController.submitOrder);

module.exports = router;
