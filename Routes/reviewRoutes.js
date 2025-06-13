// Routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../Controllers/reviewController'); // Path adjusted
const { requireLogin } = require('../Middleware/auth');

// POST /api/reviews - Submit a review
router.post('/', requireLogin, reviewController.createReview);

// GET /api/reviews/vendor/:vendorId - Get all reviews for a specific vendor
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

module.exports = router;