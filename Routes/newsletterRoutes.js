const express = require('express');
const router = express.Router();
const newsletterController = require('../Controllers/newsletterController');
const { requireLogin } = require('../Middleware/auth');


router.post('/subscribe', requireLogin, newsletterController.subscribe);


router.post('/unsubscribe', requireLogin, newsletterController.unsubscribe);

module.exports = router; 