
const Vendor = require('../Models/Vendor'); 


exports.getAllVendors = async (req, res) => { 
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching all vendors:', error);
    res.status(500).json({ message: '❌ Internal server error fetching vendors.', error: error.message });
  }
};


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


exports.createVendor = (req, res) => {
  res.status(501).json({ message: 'POST Create Vendor not yet implemented.' });
};