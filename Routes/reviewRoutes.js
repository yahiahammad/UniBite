// Routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../Controllers/reviewController'); // Path adjusted

// GET /api/reviews/vendor/:vendorId - Get all reviews for a specific vendor

// router.post('/', reviewController.submitReview); // Removed middleware

module.exports = router;