const MenuItem = require('../Models/MenuItems');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// Function to convert image to WebP
const convertToWebP = async (inputBuffer, originalFilename) => {
    try {
        // Generate a unique filename with timestamp
        const timestamp = Date.now();
        const webpFilename = `${timestamp}-${originalFilename.replace(/\.[^/.]+$/, '.webp')}`;
        const outputPath = path.join(__dirname, '..', 'Public', 'Images', 'menu', webpFilename);

        await sharp(inputBuffer)
            .webp({ quality: 80 }) // 80% quality for good balance of size and quality
            .resize(800, 800, { // Resize to max 800x800 while maintaining aspect ratio
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFile(outputPath);

        console.log('Image converted to WebP:', webpFilename);
        return `/Images/menu/${webpFilename}`;
    } catch (error) {
        console.error('Error converting image to WebP:', error);
        throw error;
    }
};

// Search menu items for a vendor
exports.searchMenuItems = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { query } = req.query;

        if (!query) {
            return res.json([]);
        }

        const searchRegex = new RegExp(query, 'i');
        const menuItems = await MenuItem.find({
            vendorId,
            name: searchRegex,
            available: true
        }).sort({ name: 1 });

        res.json(menuItems);
    } catch (error) {
        console.error('Error searching menu items:', error);
        res.status(500).json({ message: 'Failed to search menu items' });
    }
};

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
        console.log('Fetching menu items for vendor:', vendorId);
        const menuItems = await MenuItem.find({ vendorId });
        console.log(`Found ${menuItems.length} menu items`);
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

        console.log('Creating menu item for vendor:', vendorId);
        console.log('Request body:', req.body);
        console.log('File upload:', req.file ? 'Yes' : 'No');

        // Handle image upload
        let imageURL = '';
        if (req.file) {
            console.log('File uploaded:', req.file.originalname);

            try {
                // Convert image to WebP
                imageURL = await convertToWebP(req.file.buffer, req.file.originalname);
            } catch (error) {
                console.error('Error processing image:', error);
                // Fallback: save original file without conversion
                const timestamp = Date.now();
                const filename = `${timestamp}-${req.file.originalname}`;
                const filePath = path.join(__dirname, '..', 'Public', 'Images', 'menu', filename);

                await fs.writeFile(filePath, req.file.buffer);
                imageURL = `/Images/menu/${filename}`;
                console.log('Original file saved as fallback:', filename);
            }
        } else {
            console.log('No file uploaded, using default image');
            imageURL = '/Images/default-food.webp';
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
        console.log('Menu item created successfully:', menuItem._id);
        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { id } = req.params;
        const { name, description, price, category, available } = req.body;

        console.log('Updating menu item:', id, 'for vendor:', vendorId);
        console.log('Request body:', req.body);
        console.log('File upload:', req.file ? 'Yes' : 'No');

        const menuItem = await MenuItem.findOne({ _id: id, vendorId });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Handle image upload
        if (req.file) {
            console.log('New file uploaded:', req.file.originalname);

            // Delete old image if exists and it's not the default image
            if (menuItem.imageURL && menuItem.imageURL !== '/Images/default-food.webp') {
                const oldImagePath = path.join(__dirname, '..', 'Public', menuItem.imageURL);
                try {
                    await fs.unlink(oldImagePath);
                    console.log('Old image deleted:', oldImagePath);
                } catch (error) {
                    console.error('Error deleting old image:', error);
                    // Continue with update even if old image deletion fails
                }
            }

            try {
                // Convert new image to WebP
                const newImageURL = await convertToWebP(req.file.buffer, req.file.originalname);
                menuItem.imageURL = newImageURL;
            } catch (error) {
                console.error('Error processing image:', error);
                // Fallback: save original file without conversion
                const timestamp = Date.now();
                const filename = `${timestamp}-${req.file.originalname}`;
                const filePath = path.join(__dirname, '..', 'Public', 'Images', 'menu', filename);

                await fs.writeFile(filePath, req.file.buffer);
                menuItem.imageURL = `/Images/menu/${filename}`;
                console.log('Original file saved as fallback:', filename);
            }
        }

        // Update fields
        menuItem.name = name || menuItem.name;
        menuItem.description = description !== undefined ? description : menuItem.description;
        menuItem.price = price || menuItem.price;
        menuItem.category = category !== undefined ? category : menuItem.category;
        menuItem.available = available !== undefined ? available : menuItem.available;

        await menuItem.save();
        console.log('Menu item updated successfully:', menuItem._id);
        res.json(menuItem);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { id } = req.params;

        console.log('Deleting menu item:', id, 'for vendor:', vendorId);

        const menuItem = await MenuItem.findOne({ _id: id, vendorId });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Delete image if exists and it's not the default image
        if (menuItem.imageURL && menuItem.imageURL !== '/Images/default-food.webp') {
            const imagePath = path.join(__dirname, '..', 'Public', menuItem.imageURL);
            try {
                await fs.unlink(imagePath);
                console.log('Image deleted:', imagePath);
            } catch (error) {
                console.error('Error deleting image:', error);
                // Continue with deletion even if image deletion fails
            }
        }

        await MenuItem.deleteOne({ _id: id });
        console.log('Menu item deleted successfully:', id);
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
