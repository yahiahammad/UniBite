const express = require('express');
const router = express.Router();
const { requireLogin } = require('../Middleware/auth');
const orderController = require('../Controllers/orderController');
const {createPayment, paymobCallback, paymobWebhook} = require('../Controllers/paymentController');

router.get('/checkout', requireLogin, (req, res) => {
    res.render('checkout');
});

router.get('/orders', requireLogin, (req, res) => {
    res.render('orders', { 
        active: 'orders',
        user: req.user
    });
});

router.post('/create-payment', requireLogin, createPayment);

// Synchronous redirect after payment
router.get('/payments/callback', paymobCallback);

// Webhook from Paymob (no auth)
router.post('/payments/webhook', paymobWebhook);

router.get('/order/confirmation', (req, res) => {
    const { id } = req.query;
    res.render('order-confirmation', { orderId: id || null });
});


router.get('/user', requireLogin, orderController.getUserOrders);
router.post('/submit', requireLogin, orderController.submitOrder);

module.exports = router;
