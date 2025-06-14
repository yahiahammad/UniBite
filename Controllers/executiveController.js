const mongoose = require('mongoose');
const User = require('../Models/User');
const Vendor = require('../Models/Vendor');


exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        let users;

        if (mongoose.Types.ObjectId.isValid(query)) {
            
            users = await User.findById(query);
            users = users ? [users] : [];
        } else {
            
            users = await User.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            });
        }

        res.json(users);
    } catch (error) {
        console.error('User search error:', error.stack);
        res.status(500).json({ message: 'Error searching users' });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('User deletion error:', error.stack);
        res.status(500).json({ message: 'Error deleting user' });
    }
};


exports.createRestaurant = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phoneNumber,
            location,
            cuisine,
            openingHours,
            closingHours
        } = req.body;

        
        const vendor = new Vendor({
            name,
            email: email.toLowerCase(),
            password, 
            contactInfo: phoneNumber,
            location,
            cuisine,
            openingHours,
            closingHours,
            isActive: true,
            status: 'closed'
        });

        await vendor.save();

        res.status(201).json({
            message: 'Restaurant created successfully',
            vendor
        });
    } catch (error) {
        console.error('Restaurant creation error:', error.stack);
        res.status(500).json({ message: 'Error creating restaurant' });
    }
};


exports.searchVendors = async (req, res) => {
    try {
        const { query } = req.query;
        let vendors;

        if (mongoose.Types.ObjectId.isValid(query)) {
            
            vendors = await Vendor.findById(query);
            vendors = vendors ? [vendors] : [];
        } else {
            
            vendors = await Vendor.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            });
        }

        res.json(vendors);
    } catch (error) {
        console.error('Vendor search error:', error.stack);
        res.status(500).json({ message: 'Error searching vendors' });
    }
};


exports.deleteVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const vendor = await Vendor.findByIdAndDelete(vendorId);

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error('Vendor deletion error:', error.stack);
        res.status(500).json({ message: 'Error deleting vendor' });
    }
}; 