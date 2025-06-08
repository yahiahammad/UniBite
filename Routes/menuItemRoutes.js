// Routes/menuItemRoutes.js
const express = require('express');
const router = express.Router();
const menuItemController = require('../Controllers/menuItemController');
const { auth } = require('../Middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Public/Images/menu');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

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