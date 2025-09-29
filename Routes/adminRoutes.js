const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { auth } = require('../Middleware/auth');


router.get('/admin-login', (req, res) => {
    res.render('Auth/AdminLogin');
});

router.post('/api/admin/login', adminController.login);


// Admin logout (JSON API)
router.post('/api/admin/logout', (req, res) => {
    res.clearCookie('jwt');
    return res.status(200).json({ message: 'Logged out' });
});

// Admin logout (redirect)
router.get('/admin/logout', (req, res) => {
    res.clearCookie('jwt');
    return res.redirect('/admin-login');
});


router.use('/api/admin', auth);


router.get('/api/admin/stats', adminController.getDashboardStats);


router.get('/api/admin/recent-orders', adminController.getRecentOrders);
router.get('/api/admin/orders', adminController.getAllOrders);
router.get('/api/admin/orders/:orderId', adminController.getSingleOrder);
router.put('/api/admin/orders/:orderId/status', adminController.updateOrderStatus);


router.get('/api/admin/vendor/status', adminController.getVendorStatus);
router.put('/api/admin/vendor/status', adminController.updateVendorStatus);


router.use('/admin', auth);


router.get('/admin/dashboard', adminController.renderDashboard);


router.get('/admin/menu', (req, res) => {
    res.render('admin/menu-management');
});

module.exports = router;
