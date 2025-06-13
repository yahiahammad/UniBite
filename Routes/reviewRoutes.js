
const express = require('express');
const router = express.Router();
const reviewController = require('../Controllers/reviewController'); 
const { requireLogin } = require('../Middleware/auth');


router.post('/', requireLogin, reviewController.createReview);


router.get('/vendor/:vendorId', reviewController.getVendorReviews);

module.exports = router;