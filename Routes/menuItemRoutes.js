
const express = require('express');
const router = express.Router();
const menuItemController = require('../Controllers/menuItemController');
const { auth } = require('../Middleware/auth');
const multer = require('multer');
const path = require('path');


const upload = multer({
    storage: multer.memoryStorage(), 
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
        fileSize: 10 * 1024 * 1024 
    }
});


router.get('/search/:vendorId', menuItemController.searchMenuItems);


router.get('/vendor', auth, menuItemController.getVendorMenuItems);


router.get('/:id', auth, menuItemController.getMenuItem);


router.post('/', auth, upload.single('image'), menuItemController.createMenuItem);


router.put('/:id', auth, upload.single('image'), menuItemController.updateMenuItem);


router.delete('/:id', auth, menuItemController.deleteMenuItem);

module.exports = router;