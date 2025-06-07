const Order = require('../Models/orders');
const MenuItem = require('../Models/MenuItems');
const Vendor = require('../Models/Vendor');
const jwt = require('jsonwebtoken');

// Render admin dashboard
exports.renderDashboard = async (req, res) => {
    try {
        const vendorId = req.user.id;
        
        // Get vendor info
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Get recent orders
        const recentOrders = await Order.find({ vendorId })
            .sort({ orderTime: -1 })
            .limit(5)
            .populate('userId', 'name email')
            .populate('items.menuItemId');

        // Get dashboard stats
        const totalOrders = await Order.countDocuments({ vendorId });
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({
            vendorId,
            orderTime: { $gte: today }
        });

        const totalRevenue = await Order.aggregate([
            { $match: { vendorId: vendor._id } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    vendorId: vendor._id,
                    orderTime: { $gte: today }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        // Calculate average pickup time for the current hour
        const now = new Date();
        const startOfCurrentHour = new Date(now);
        startOfCurrentHour.setUTCMilliseconds(0);
        startOfCurrentHour.setUTCSeconds(0);
        startOfCurrentHour.setUTCMinutes(0);

        const endOfCurrentHour = new Date(startOfCurrentHour);
        endOfCurrentHour.setUTCHours(endOfCurrentHour.getUTCHours() + 1); // Set to start of next hour
        endOfCurrentHour.setUTCMilliseconds(-1); // Subtract 1ms to get to end of current hour

        const recentCompletedOrders = await Order.find({
            vendorId: vendor._id,
            status: 'picked up',
            pickupTime: { $gte: startOfCurrentHour, $lte: endOfCurrentHour } // Filter by pickupTime within the current hour
        });

        let calculatedAveragePickupTime = 10; // Default to 10 minutes

        if (recentCompletedOrders.length > 0) {
            const totalPickupDuration = recentCompletedOrders.reduce((sum, order) => {
                // Ensure acceptedTime and pickupTime are valid Dates before calculating
                if (order.acceptedTime instanceof Date && order.pickupTime instanceof Date) {
                    const durationMs = order.pickupTime.getTime() - order.acceptedTime.getTime();
                    // Use Math.max to ensure only non-negative durations are summed
                    return sum + Math.max(0, durationMs);
                }
                return sum;
            }, 0);

            if (totalPickupDuration < 0) {
                // This warning should be less frequent now that acceptedTime is being used
                console.warn('Total pickup duration is negative. This indicates an issue with order data where pickupTime is before acceptedTime.');
            }

            calculatedAveragePickupTime = Math.ceil(totalPickupDuration / recentCompletedOrders.length / (60 * 1000)); // Average in minutes, rounded up
        }

        // Assign the calculated average pickup time to the vendor object
        vendor.averagePickupTime = calculatedAveragePickupTime;

        res.render('admin/admin', {
            vendor,
            recentOrders,
            stats: {
                totalOrders,
                todayOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                todayRevenue: todayRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find vendor by email
        const vendor = await Vendor.findOne({ email: email.toLowerCase() });
        if (!vendor) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if vendor is active
        if (!vendor.isActive) {
            return res.status(401).json({ message: 'Your account has been deactivated' });
        }

        // Verify password (plain text comparison)
        if (password !== vendor.password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Return success response with redirect URL
        res.json({
            message: 'Login successful',
            redirectUrl: '/admin/admin'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const vendorId = req.user.id;

        const totalOrders = await Order.countDocuments({ vendorId });
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({
            vendorId,
            orderTime: { $gte: today }
        });

        const totalRevenue = await Order.aggregate([
            { $match: { vendorId: vendorId } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    vendorId: vendorId,
                    orderTime: { $gte: today }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        res.json({
            totalOrders,
            todayOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            todayRevenue: todayRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get recent orders
exports.getRecentOrders = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const recentOrders = await Order.find({ vendorId })
            .sort({ orderTime: -1 })
            .limit(5)
            .populate('userId', 'name email')
            .populate('items.menuItemId');
        
        res.json(recentOrders);
    } catch (error) {
        console.error('Recent orders error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all orders with pagination
exports.getAllOrders = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ vendorId })
            .sort({ orderTime: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.menuItemId')
            .populate('userId', 'name email');

        const total = await Order.countDocuments({ vendorId });

        res.json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalOrders: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Update vendor status
exports.updateVendorStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const vendorId = req.user.id;
        
        const vendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { 
                isActive: status === 'open' || status === 'busy',
                status: status
            },
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: 'Error updating vendor status', error: error.message });
    }
};

// Get vendor status
exports.getVendorStatus = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const vendor = await Vendor.findById(vendorId);
        
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({ status: vendor.status });
    } catch (error) {
        console.error('Vendor status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const vendorId = req.user.id;
        
        // Validate status
        const validStatuses = ['pending', 'preparing', 'ready for pickup', 'picked up', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find order and verify it belongs to this vendor
        const order = await Order.findOne({ _id: orderId, vendorId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status
        order.status = status;
        if (status === 'picked up') {
            order.pickupTime = new Date();
        } else if (status === 'preparing') {
            order.acceptedTime = new Date();
        }
        await order.save();

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a single order by ID
exports.getSingleOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const vendorId = req.user.id;

        const order = await Order.findOne({ _id: orderId, vendorId })
            .populate('userId', 'name email')
            .populate('items.menuItemId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found or does not belong to this vendor' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching single order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};