// Routes/menuItemRoutes.js
const express = require('express');
const router = express.Router();
const menuItemController = require('../Controllers/menuItemController'); // Path adjusted

// GET /api/menuitems - Get all menu items

// GET /api/menuitems/vendor/:vendorId - Get menu items for a specific vendor

// GET /api/menuitems/:id - Get a specific menu item by ID

// POST /api/menuitems - Create a new menu item
// router.post('/', menuItemController.createMenuItem); // Removed middleware

module.exports = router;