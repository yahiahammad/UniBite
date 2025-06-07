const Vendor = require('../Models/Vendor');

const auth = async (req, res, next) => {
    try {
        // Find the vendor by email
        const vendor = await Vendor.findOne({ email: 'mycorner@unibitecanteam.com' });
        
        if (!vendor) {
            console.log('Vendor not found in auth middleware');
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Set user info from vendor
        req.user = {
            id: vendor._id,
            email: vendor.email
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = auth; 