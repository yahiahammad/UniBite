// Routes/menuItemRoutes.js
const express = require('express');
const router = express.Router();
const menuItemController = require('../Controllers/menuItemController');
const { auth } = require('../Middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(), // Use memory storage to access file buffer
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// GET /api/menu-items/search/:vendorId - Search menu items for a vendor
router.get('/search/:vendorId', menuItemController.searchMenuItems);

// GET /api/menu-items/vendor - Get menu items for the logged-in vendor
router.get('/vendor', auth, menuItemController.getVendorMenuItems);

// GET /api/menu-items/:id - Get a specific menu item
router.get('/:id', auth, menuItemController.getMenuItem);

// POST /api/menu-items - Create a new menu item
router.post('/', auth, upload.single('image'), menuItemController.createMenuItem);

// PUT /api/menu-items/:id - Update a menu item
router.put('/:id', auth, upload.single('image'), menuItemController.updateMenuItem);

// DELETE /api/menu-items/:id - Delete a menu item
router.delete('/:id', auth, menuItemController.deleteMenuItem);

module.exports = router;