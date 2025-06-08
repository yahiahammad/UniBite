// Routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const vendorController = require('../Controllers/vendorController');

// GET /api/vendors - Get all vendors
router.get('/', vendorController.getAllVendors); // ✅ This line is good!

module.exports = router;