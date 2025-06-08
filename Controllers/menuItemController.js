const MenuItem = require('../Models/MenuItems');
const path = require('path');
const fs = require('fs').promises;

// Get all menu items for a vendor
exports.getMenuItems = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const menuItems = await MenuItem.find({ vendorId });
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get menu items for the logged-in vendor
exports.getVendorMenuItems = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const menuItems = await MenuItem.find({ vendorId });
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching vendor menu items:', error);
        res.status(500).json({ message: 'Failed to load menu items' });
    }
};

// Get a specific menu item
exports.getMenuItem = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { id } = req.params;
        
        const menuItem = await MenuItem.findOne({ _id: id, vendorId });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        
        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ message: 'Failed to load menu item' });
    }
};

// Create new menu item
exports.createMenuItem = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { name, description, price, category } = req.body;
        
        // Handle image upload
        let imageURL = '';
        if (req.file) {
            imageURL = `/Images/menu/${req.file.filename}`;
        }

        const menuItem = new MenuItem({
            vendorId,
            name,
            description,
            price,
            category,
            imageURL,
            available: true
        });

        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { id } = req.params;
        const { name, description, price, category, available } = req.body;

        const menuItem = await MenuItem.findOne({ _id: id, vendorId });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Handle image upload
        if (req.file) {
            // Delete old image if exists
            if (menuItem.imageURL) {
                const oldImagePath = path.join(__dirname, '..', 'Public', menuItem.imageURL);
                try {
                    await fs.unlink(oldImagePath);
                } catch (error) {
                    console.error('Error deleting old image:', error);
                }
            }
            
            menuItem.imageURL = `/Images/menu/${req.file.filename}`;
        }

        // Update fields
        menuItem.name = name || menuItem.name;
        menuItem.description = description || menuItem.description;
        menuItem.price = price || menuItem.price;
        menuItem.category = category || menuItem.category;
        menuItem.available = available !== undefined ? available : menuItem.available;

        await menuItem.save();
        res.json(menuItem);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { id } = req.params;

        const menuItem = await MenuItem.findOne({ _id: id, vendorId });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Delete image if exists
        if (menuItem.imageURL) {
            const imagePath = path.join(__dirname, '..', 'Public', menuItem.imageURL);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }

        await MenuItem.deleteOne({ _id: id });
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
