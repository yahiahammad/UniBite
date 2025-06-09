const express = require('express');
const router = express.Router();
const newsletterController = require('../Controllers/newsletterController');
const { requireLogin } = require('../Middleware/auth');

// Subscribe to newsletter
router.post('/subscribe', requireLogin, newsletterController.subscribe);

// Unsubscribe from newsletter
router.post('/unsubscribe', requireLogin, newsletterController.unsubscribe);

module.exports = router; 