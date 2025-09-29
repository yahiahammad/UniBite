const { Server } = require('socket.io');
const Order = require('./Models/orders'); 
const { sendOrderStatusEmail } = require('./utils/emailService');

let io;

function init(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*', 
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('✅ A user connected with socket ID:', socket.id);

        socket.on('register_vendor', async (vendorId) => {
            if (vendorId) {
                const room = `vendor_${vendorId}`;
                socket.data.vendorId = String(vendorId);
                socket.join(room);
                console.log(`Socket ${socket.id} joined room ${room}`);
                socket.emit('vendor_registered', { room });

                // Best-effort: send any recent pending orders (last 3 minutes) to ensure popup visibility after reconnects
                try {
                    const since = new Date(Date.now() - 3 * 60 * 1000);
                    const missed = await Order.find({
                        vendorId: vendorId,
                        status: 'pending',
                        orderTime: { $gte: since }
                    })
                    .sort({ orderTime: 1 })
                    .populate('items.menuItemId', 'name price')
                    .populate('userId', 'name email');

                    if (Array.isArray(missed) && missed.length) {
                        missed.forEach(order => socket.emit('new_order', order));
                        console.log(`Resent ${missed.length} recent pending orders to socket ${socket.id}`);
                    }
                } catch (err) {
                    console.warn('Failed to send recent pending orders to vendor', vendorId, err.message);
                }
            } else {
                console.log(`Attempt to join vendor room with invalid vendorId by socket ${socket.id}`);
                socket.emit('vendor_register_error', { message: 'Invalid vendorId' });
            }
        });
        
        async function updateOrderStatusSafely(socket, orderId, newStatus) {
            try {
                const vendorId = socket.data.vendorId;
                if (!vendorId) {
                    socket.emit('order_error', { orderId, message: 'Unauthorized: vendor not registered' });
                    return;
                }

                // Verify the order belongs to this vendor
                const filter = { _id: orderId, vendorId };
                const updatedOrder = await Order.findOneAndUpdate(
                    filter,
                    { status: newStatus },
                    { new: true }
                ).populate('userId', 'email').populate('vendorId', 'name');

                if (!updatedOrder) {
                    socket.emit('order_error', { orderId, message: 'Order not found or not owned by this vendor' });
                    return;
                }

                if (updatedOrder.userId && updatedOrder.userId.email) {
                    const restaurantName = updatedOrder.vendorId && updatedOrder.vendorId.name ? updatedOrder.vendorId.name : '';
                    const items = updatedOrder.items;
                    try {
                        await sendOrderStatusEmail(updatedOrder.userId.email, updatedOrder._id, newStatus, restaurantName, items);
                    } catch (e) {
                        console.warn('Email send failed for order', updatedOrder._id.toString(), e.message);
                    }
                }

                const room = `vendor_${updatedOrder.vendorId._id ? updatedOrder.vendorId._id.toString() : updatedOrder.vendorId.toString()}`;
                io.to(room).emit('order_status_updated', updatedOrder);
                socket.emit('order_updated', { orderId, status: newStatus });
                console.log(`Order ${orderId} status updated to ${newStatus} and emitted to room ${room}.`);
            } catch (error) {
                console.error('Error updating order status:', error);
                socket.emit('order_error', { orderId, message: 'Internal server error' });
            }
        }

        socket.on('accept_order', async (data) => {
            const { orderId } = data || {};
            await updateOrderStatusSafely(socket, orderId, 'preparing');
        });

        socket.on('cancel_order', async (data) => {
            const { orderId } = data || {};
            await updateOrderStatusSafely(socket, orderId, 'cancelled');
        });

        socket.on('ready_for_pickup', async (data) => {
            const { orderId } = data || {};
            await updateOrderStatusSafely(socket, orderId, 'ready for pickup');
        });

        socket.on('disconnect', () => {
            console.log('❌ User disconnected with socket ID:', socket.id);
        });
    });
    
    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
}

module.exports = {
    init,
    getIO,
};