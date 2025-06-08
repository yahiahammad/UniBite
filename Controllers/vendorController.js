// Controllers/vendorController.js
const Vendor = require('../Models/Vendor'); // <-- Make sure this path is correct!

// Handles GET /api/vendors
exports.getAllVendors = async (req, res) => { // <-- This function needs to exist and be exported
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching all vendors:', error);
    res.status(500).json({ message: '❌ Internal server error fetching vendors.', error: error.message });
  }
};

// Handles GET /api/vendors/:id
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: '❌ Vendor not found.' });
    }
    res.status(200).json(vendor);
  } catch (error) {
    console.error('Error fetching vendor by ID:', error);
    res.status(500).json({ message: '❌ Internal server error fetching vendor.', error: error.message });
  }
};

// Placeholder for other vendor-related functions (e.g., createVendor)
exports.createVendor = (req, res) => {
  res.status(501).json({ message: 'POST Create Vendor not yet implemented.' });
};