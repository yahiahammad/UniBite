// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController'); // Import the controller

router.post('/login', userController.loginUser);

module.exports = router;