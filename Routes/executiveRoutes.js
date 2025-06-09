const express = require('express');
const router = express.Router();
const executiveController = require('../Controllers/executiveController');
const { authenticateExecutive } = require('../Middleware/auth');

// All routes in this file are protected and can only be accessed by an executive/admin

// User management routes
router.get('/users/search', authenticateExecutive, executiveController.searchUsers);
router.delete('/users/:userId', authenticateExecutive, executiveController.deleteUser);

// Vendor management routes
router.get('/vendors/search', authenticateExecutive, executiveController.searchVendors);
router.delete('/vendors/:vendorId', authenticateExecutive, executiveController.deleteVendor);

// Restaurant management routes
router.post('/restaurants', authenticateExecutive, executiveController.createRestaurant);

module.exports = router;