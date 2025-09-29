const Order = require('../Models/orders');
const MenuItem = require('../Models/MenuItems');
const Vendor = require('../Models/Vendor');
const jwt = require('jsonwebtoken');
const { sendOrderStatusEmail } = require('../utils/emailService');
const { getIO } = require('../socket');
const User = require('../Models/User');


exports.renderDashboard = async (req, res) => {
    try {
        const vendorId = req.user.id;
        
        
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        
        const recentOrders = await Order.find({ vendorId })
            .sort({ orderTime: -1 })
            .limit(20)
            .populate('userId', 'name email')
            .populate('items.menuItemId');

        
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

        
        const now = new Date();
        const startOfCurrentHour = new Date(now);
        startOfCurrentHour.setUTCMilliseconds(0);
        startOfCurrentHour.setUTCSeconds(0);
        startOfCurrentHour.setUTCMinutes(0);

        const endOfCurrentHour = new Date(startOfCurrentHour);
        endOfCurrentHour.setUTCHours(endOfCurrentHour.getUTCHours() + 1);
        endOfCurrentHour.setUTCMilliseconds(-1);

        const recentCompletedOrders = await Order.find({
            vendorId: vendor.id,
            status: 'picked up',
            pickupTime: { $gte: startOfCurrentHour, $lte: endOfCurrentHour }
        });

        let calculatedAveragePickupTime = 10;

        if (recentCompletedOrders.length > 0) {
            const totalPickupDuration = recentCompletedOrders.reduce((sum, order) => {
                if (order.acceptedTime instanceof Date && order.pickupTime instanceof Date) {
                    const durationMs = order.pickupTime.getTime() - order.acceptedTime.getTime();
                    return sum + Math.max(0, durationMs);
                }
                return sum;
            }, 0);

            calculatedAveragePickupTime = Math.ceil(totalPickupDuration / recentCompletedOrders.length / (60 * 1000));
        }

        vendor.averagePickupTime = calculatedAveragePickupTime;

        res.render('admin/dashboard', {
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


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        
        const vendor = await Vendor.findOne({ email: email.toLowerCase() });
        if (!vendor) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        
        if (!vendor.isActive) {
            return res.status(401).json({ message: 'Your account has been deactivated' });
        }

        
        if (password !== vendor.password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        
        const token = jwt.sign(
            { id: vendor._id, email: vendor.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 
        });

        
        res.json({
            message: 'Login successful',
            redirectUrl: '/admin/dashboard',
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


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


exports.getRecentOrders = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const limit =  10;
        const recentOrders = await Order.find({ vendorId })
            .sort({ orderTime: -1 })
            .limit(limit)
            .populate('userId', 'name email')
            .populate('items.menuItemId');
        
        res.json(recentOrders);
    } catch (error) {
        console.error('Recent orders error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getAllOrders = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;
        const q = (req.query.q || '').trim();

        // Base filter
        const filter = { vendorId };

        // If search query provided, build $or conditions
        if (q) {
            const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex special chars
            const orConditions = [
                { status: { $regex: regex } },
                { notes: { $regex: regex } },
                { 'items.nameAtOrder': { $regex: regex } },
                // Match partial ObjectId string (e.g., last 6 shown to vendor)
                { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: q, options: 'i' } } }
            ];

            // Attempt to match users by name/email and include their IDs in OR
            try {
                const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id').lean();
                if (matchingUsers && matchingUsers.length) {
                    orConditions.push({ userId: { $in: matchingUsers.map(u => u._id) } });
                }
            } catch (_) {
                // best-effort; ignore user lookup errors
            }

            filter.$or = orConditions;
        }

        const orders = await Order.find(filter)
            .sort({ orderTime: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.menuItemId')
            .populate('userId', 'name email');

        const total = await Order.countDocuments(filter);

        res.json({
            orders,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};


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


exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const vendorId = req.user.id;
        
        const validStatuses = ['pending', 'preparing', 'ready for pickup', 'picked up', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findOne({ _id: orderId, vendorId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        if (status === 'picked up') {
            order.pickupTime = new Date();
        } else if (status === 'preparing') {
            order.acceptedTime = new Date();
        }
        await order.save();

        // Email user for key status changes
        if (status === 'preparing' || status === 'cancelled' || status === 'ready for pickup') {
            await order.populate('userId', 'email');
            await order.populate('vendorId', 'name');
            const userEmail = order.userId?.email;
            const restaurantName = order.vendorId?.name || '';
            const items = order.items;
            if (userEmail) {
                try { await sendOrderStatusEmail(userEmail, order._id, status, restaurantName, items); } catch (e) { console.warn('Email send failed:', e.message); }
            }
        }

        // Emit to vendor room for live updates
        const io = getIO();
        const roomName = `vendor_${vendorId}`;
        io.to(roomName).emit('order_status_updated', order);

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


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