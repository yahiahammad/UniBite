const express = require('express');
const router = express.Router();
const orderController = require('../Controllers/orderController');

// PUT /api/orders/:id — update order status
router.put('/:id', orderController.updateOrderStatus);

module.exports = router;
