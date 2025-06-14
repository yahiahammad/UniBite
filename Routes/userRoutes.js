const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController'); 
const { requireLogin } = require('../Middleware/auth');
const User = require('../Models/User');
const rateLimit = require('express-rate-limit');


const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 4, 
    message: 'Too many password reset requests, please try again after an hour'
});


router.get('/login', (req, res) => {
    res.render('Auth/Login');
});

router.get('/SignUp', (req, res) => {
    res.render('Auth/SignUp');
});

router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

router.get('/verify-email', (req, res) => {
    res.render('Auth/VerifyEmail');
});

router.get('/forgot-password', (req, res) => {
    res.render('Auth/ForgotPassword');
});

router.get('/reset-password', (req, res) => {
    res.render('Auth/ResetPassword');
});


router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/forgot-password', forgotPasswordLimiter, userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/verify-reset-token', userController.verifyResetToken);
router.post('/verify-email', userController.verifyEmail);


router.post('/update-profile', requireLogin, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name;
        user.phoneNumber = phone;
        await user.save();

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});


router.post('/change-password', requireLogin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
});

router.get('/account', requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('name email phoneNumber role createdAt userType');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.render('account', { 
            active: 'account',
            user: user,
            memberSince: new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

module.exports = router;