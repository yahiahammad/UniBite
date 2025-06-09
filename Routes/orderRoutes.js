const express = require('express');
const router = express.Router();
const orderController = require('../Controllers/orderController');
const { requireLogin } = require('../Middleware/auth');

// GET /api/orders/user - get all orders for the current user
router.get('/user', requireLogin, orderController.getUserOrders);

// PUT /api/orders/:id — update order status
router.put('/:id', orderController.updateOrderStatus);

// POST /order/submit — submit a new order
router.post('/submit', orderController.submitOrder);

module.exports = router;
