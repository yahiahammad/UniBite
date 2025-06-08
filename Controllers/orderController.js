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
        const { cart } = req.body;
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        // For demo, assume user is authenticated and req.user is available
        const userId = req.user ? req.user.id : null;
        // For now, vendorId is not handled (could be per item or per cart)
        // Calculate total
        let totalPrice = 0;
        const items = cart.map(item => {
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
            items,
            totalPrice,
            notes: cart.map(i => i.notes).filter(Boolean).join(' | ')
        });
        await order.save();
        res.json({ success: true, orderId: order._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting order', error: error.message });
    }
};
