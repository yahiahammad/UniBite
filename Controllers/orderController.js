const Order = require('../Models/orders'); // Adjust the path if needed

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

        // For demo, assume user is authenticated and req.user is available
        const userId = req.user ? req.user.id : null;
        
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
            items: orderItems,
            totalPrice,
            notes: notes || '',
            status: 'pending',
            paymentStatus: 'unpaid'
        });

        await order.save();
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
