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
