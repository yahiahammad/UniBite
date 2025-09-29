const Order = require('../Models/orders'); 
const MenuItem = require('../Models/MenuItems');
const { getIO } = require('../socket'); 

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ userId })
            .sort({ orderTime: -1 })
            .populate('vendorId', 'name logoURL')
            .populate('items.menuItemId');

        
        const ordersWithReviewed = orders.map(order => {
            const o = order.toObject();
            if (typeof o.reviewed === 'undefined') o.reviewed = false;
            return o;
        });
        res.json(ordersWithReviewed);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


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

        
        const io = getIO();
        io.emit('order_status_updated', updatedOrder);

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('❌ Error in updateOrderStatus:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


exports.submitOrder = async (req, res) => {
    try {
        const { items, notes, paymentMethod } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Validate payment method
        const allowed = ['cash', 'credit'];
        const method = (paymentMethod || 'cash').toLowerCase();
        if (!allowed.includes(method)) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        const firstMenuItem = await MenuItem.findById(items[0].id);
        if (!firstMenuItem) {
            return res.status(400).json({ success: false, message: 'Invalid menu item' });
        }

        
        const userId = req.user ? req.user.id : null;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User must be logged in to place an order' });
        }
        
        
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
            vendorId: firstMenuItem.vendorId, 
            items: orderItems,
            totalPrice,
            notes: notes || '',
            status: 'pending',
            paymentStatus: 'unpaid',
            paymentMethod: method
        });

        await order.save();

        
        const populatedOrder = await Order.findById(order._id)
            .populate('vendorId', 'name _id') // Ensure _id is populated for vendorId
            .populate('items.menuItemId', 'name');

        
        const io = getIO();
        if (populatedOrder && populatedOrder.vendorId && populatedOrder.vendorId._id) {
            const roomName = `vendor_${populatedOrder.vendorId._id}`;
            io.to(roomName).emit('new_order', populatedOrder);
            console.log(`Emitted 'new_order' for order ${populatedOrder._id} to room ${roomName}`);
        } else {
            console.error('Vendor ID not found on populated order, cannot emit new_order to specific vendor.');
            console.error('Order details:', JSON.stringify(populatedOrder, null, 2));
            // Fallback or error handling if necessary, though this case should ideally not happen
            // For now, we prevent a global emit if the vendorId is missing.
        }

        
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