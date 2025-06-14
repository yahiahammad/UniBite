const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth } = require('../Middleware/auth');
const menuItemController = require('../Controllers/menuItemController');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/Images/menu'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});


router.get('/menu-items', auth, menuItemController.getMenuItems);
router.post('/menu-items', auth, upload.single('image'), menuItemController.createMenuItem);
router.put('/menu-items/:id', auth, upload.single('image'), menuItemController.updateMenuItem);
router.delete('/menu-items/:id', auth, menuItemController.deleteMenuItem);

module.exports = router; 