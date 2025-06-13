const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const User = require('../Models/User');


router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.redirect('/login');
        }
        
        const cartItems = user.cart || [];
        
        
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal; 

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


router.post('/update', protect, async (req, res) => {
    try {
        const { itemId, name, price, category, image, change } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        const cart = user.cart || [];
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
        } else if (change > 0) {
            cart.push({
                id: itemId,
                name,
                price,
                category,
                image,
                quantity: change
            });
        }
        user.cart = cart;
        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Error updating cart' });
    }
});


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