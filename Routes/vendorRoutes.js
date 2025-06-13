
const express = require('express');
const router = express.Router();
const vendorController = require('../Controllers/vendorController');


router.get('/', vendorController.getAllVendors); 

module.exports = router;