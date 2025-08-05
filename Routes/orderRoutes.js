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

router.get('/order/confirmation', (req, res) => {
    res.render('payment/gateway', {
        AmountTrxn: process.env.AmountTrxn,
        MID: process.env.MID,
        TID: process.env.TID,
        MerchantReference: process.env.MerchantReference,
        Secret: process.env.Secret
    });
});


router.get('/user', requireLogin, orderController.getUserOrders);
router.post('/submit', requireLogin, orderController.submitOrder);

module.exports = router;
