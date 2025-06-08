const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const User = require('../Models/User');

// Get cart page
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.redirect('/login');
        }
        
        const cartItems = user.cart || [];
        
        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal; // Add any additional fees here if needed

        res.render('Cart', {
            cartItems,
            subtotal,
            total
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).render('error', { message: 'Error loading cart' });
    }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
    try {
        const { id, name, price, image, category, quantity } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Initialize cart if it doesn't exist
        if (!user.cart) {
            user.cart = [];
        }

        // Check if item already exists in cart
        const existingItemIndex = user.cart.findIndex(item => item.id === id);

        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            user.cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item if it doesn't exist
            user.cart.push({
                id,
                name,
                price,
                image,
                category,
                quantity
            });
        }

        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Error adding item to cart' });
    }
});

// Update item quantity
router.post('/update', protect, async (req, res) => {
    try {
        const { itemId, change } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const cart = user.cart || [];

        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            cart[itemIndex].quantity += change;
            
            // Remove item if quantity becomes 0 or less
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
            
            user.cart = cart;
            await user.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Error updating cart' });
    }
});

// Remove item from cart
router.post('/remove', protect, async (req, res) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const cart = user.cart || [];

        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            cart.splice(itemIndex, 1);
            user.cart = cart;
            await user.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ success: false, message: 'Error removing item from cart' });
    }
});

// Clear cart
router.post('/clear', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        user.cart = [];
        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, message: 'Error clearing cart' });
    }
});

module.exports = router; 