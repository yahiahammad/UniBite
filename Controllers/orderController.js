const Order = require('../Models/orders'); // Adjust the path if needed
const MenuItem = require('../Models/MenuItems');
const { getIO } = require('../socket'); // Import the getIO function
// Controller to get all orders for the current user
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ userId })
            .sort({ orderTime: -1 })
            .populate('vendorId', 'name')
            .populate('items.menuItemId');

        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Controller to update order status
exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Emit an event to notify clients about the status update
        const io = getIO();
        io.emit('order_status_updated', updatedOrder);

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('❌ Error in updateOrderStatus:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Controller to submit a new order
exports.submitOrder = async (req, res) => {
    try {
        const { items, notes } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Get the first item to determine the vendor
        const firstMenuItem = await MenuItem.findById(items[0].id);
        if (!firstMenuItem) {
            return res.status(400).json({ success: false, message: 'Invalid menu item' });
        }

        // For demo, assume user is authenticated and req.user is available
        const userId = req.user ? req.user.id : null;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User must be logged in to place an order' });
        }
        
        // Calculate total
        let totalPrice = 0;
        const orderItems = items.map(item => {
            totalPrice += item.price * item.quantity;
            return {
                menuItemId: item.id,
                quantity: item.quantity,
                nameAtOrder: item.name,
                priceAtOrder: item.price,
            };
        });

        const order = new Order({
            userId: userId,
            vendorId: firstMenuItem.vendorId, // Use the vendor ID from the first menu item
            items: orderItems,
            totalPrice,
            notes: notes || '',
            status: 'pending',
            paymentStatus: 'unpaid'
        });

        await order.save();

        // Populate vendor and item details before sending back
        const populatedOrder = await Order.findById(order._id)
            .populate('vendorId', 'name')
            .populate('items.menuItemId', 'name');

        // Emit the new order to the vendor's room
        const io = getIO();
        io.emit('new_order', populatedOrder);

        // Send confirmation back to the user
        res.json({ success: true, orderId: order._id });
    } catch (error) {
        console.error('Error submitting order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting order', 
            error: error.message 
        });
    }
};
