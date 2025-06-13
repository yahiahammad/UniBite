const express = require('express');
const router = express.Router();
const executiveController = require('../Controllers/executiveController');
const { authenticateExecutive } = require('../Middleware/auth');




router.get('/users/search', authenticateExecutive, executiveController.searchUsers);
router.delete('/users/:userId', authenticateExecutive, executiveController.deleteUser);


router.get('/vendors/search', authenticateExecutive, executiveController.searchVendors);
router.delete('/vendors/:vendorId', authenticateExecutive, executiveController.deleteVendor);


router.post('/restaurants', authenticateExecutive, executiveController.createRestaurant);

module.exports = router;