const express = require('express');
const router = express.Router();
const { requireLogin } = require('../Middleware/auth');
const orderController = require('../Controllers/orderController');
const {createPayment, paymobCallback, paymobWebhook} = require('../Controllers/paymentController');

// Simple ping to verify payments routes are mounted
router.get('/payments/ping', (req, res) => {
    res.status(200).json({ ok: true, message: 'payments routes are mounted' });
});

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

// Explicit GET response for webhook to avoid confusing 404 in browser
router.get('/payments/webhook', (req, res) => {
    res.status(405).json({ message: 'Method Not Allowed. Use POST for Paymob webhooks.' });
});

router.get('/order/confirmation', (req, res) => {
    const { id } = req.query;
    res.render('order-confirmation', { orderId: id || null });
});


router.get('/user', requireLogin, orderController.getUserOrders);
router.post('/submit', requireLogin, orderController.submitOrder);

module.exports = router;
