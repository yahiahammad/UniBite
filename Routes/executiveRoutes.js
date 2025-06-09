const express = require('express');
const router = express.Router();
const executiveController = require('../Controllers/executiveController');
const { authenticateExecutive } = require('../Middleware/auth');

// Apply executive authentication middleware to all routes
router.use(authenticateExecutive);

// User management routes
router.get('/users/search', executiveController.searchUsers);
router.delete('/users/:userId', executiveController.deleteUser);

// Restaurant management routes
router.post('/restaurants', executiveController.createRestaurant);

// Vendor management routes
router.get('/vendors/search', executiveController.searchVendors);
router.delete('/vendors/:vendorId', executiveController.deleteVendor);

module.exports = router; 