const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { auth } = require('../Middleware/auth');

// Public routes
router.get('/admin-login', (req, res) => {
    res.render('Auth/AdminLogin');
});

router.post('/api/admin/login', adminController.login);

// Protected API routes
router.use('/api/admin', auth);

// Dashboard stats
router.get('/api/admin/stats', adminController.getDashboardStats);

// Orders
router.get('/api/admin/recent-orders', adminController.getRecentOrders);
router.get('/api/admin/orders', adminController.getAllOrders);
router.get('/api/admin/orders/:orderId', adminController.getSingleOrder);
router.put('/api/admin/orders/:orderId/status', adminController.updateOrderStatus);

// Vendor status
router.get('/api/admin/vendor/status', adminController.getVendorStatus);
router.put('/api/admin/vendor/status', adminController.updateVendorStatus);

// Protected page routes
router.use('/admin', auth);

// Admin dashboard
router.get('/admin/dashboard', adminController.renderDashboard);

module.exports = router; 