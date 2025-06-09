const Newsletter = require('../Models/newsletter');
const User = require('../Models/User');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already subscribed
        const existingSubscription = await Newsletter.findOne({ email: user.email });
        if (existingSubscription) {
            return res.status(400).json({ message: 'You are already subscribed to the newsletter' });
        }

        // Add user's email to newsletter collection
        await Newsletter.create({ email: user.email });

        // Update user's newsletter preference
        user.newsletterSubscribed = true;
        user.lastNewsletterToggle = Date.now();
        await user.save();

        res.json({ message: 'Successfully subscribed to newsletter' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ message: 'Error subscribing to newsletter' });
    }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is subscribed
        const subscription = await Newsletter.findOne({ email: user.email });
        if (!subscription) {
            return res.status(400).json({ message: 'You are not subscribed to the newsletter' });
        }

        // Remove user's email from newsletter collection
        await Newsletter.deleteOne({ email: user.email });

        // Update user's newsletter preference
        user.newsletterSubscribed = false;
        user.lastNewsletterToggle = Date.now();
        await user.save();

        res.json({ message: 'Successfully unsubscribed from newsletter' });
    } catch (error) {
        console.error('Newsletter unsubscription error:', error);
        res.status(500).json({ message: 'Error unsubscribing from newsletter' });
    }
}; 