const { Server } = require('socket.io');
const Order = require('./Models/orders'); 
const { sendOrderStatusEmail } = require('./utils/emailService');
const User = require('./Models/User');

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

        socket.on('register_vendor', (vendorId) => {
            if (vendorId) {
                socket.join(`vendor_${vendorId}`);
                console.log(`Socket ${socket.id} joined room for vendor ${vendorId}`);
            } else {
                console.log(`Attempt to join vendor room with invalid vendorId by socket ${socket.id}`);
            }
        });
        
        socket.on('accept_order', async (data) => {
            try {
                const { orderId } = data;
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId,
                    { status: 'preparing' },
                    { new: true }
                ).populate('userId', 'email').populate('vendorId', 'name');

                if (updatedOrder) {
                    if (updatedOrder.userId && updatedOrder.userId.email) {
                        const restaurantName = updatedOrder.vendorId && updatedOrder.vendorId.name ? updatedOrder.vendorId.name : '';
                        const items = updatedOrder.items;
                        await sendOrderStatusEmail(updatedOrder.userId.email, updatedOrder._id, 'preparing', restaurantName, items);
                    }
                    io.emit('order_status_updated', updatedOrder);
                    console.log(`Order ${orderId} status updated to preparing.`);
                } else {
                    console.log(`Order ${orderId} not found.`);
                }
            } catch (error) {
                console.error('Error updating order status:', error);
            }
        });

        
        socket.on('cancel_order', async (data) => {
            try {
                const { orderId } = data;
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId,
                    { status: 'cancelled' },
                    { new: true }
                ).populate('userId', 'email').populate('vendorId', 'name');

                if (updatedOrder) {
                    if (updatedOrder.userId && updatedOrder.userId.email) {
                        const restaurantName = updatedOrder.vendorId && updatedOrder.vendorId.name ? updatedOrder.vendorId.name : '';
                        const items = updatedOrder.items;
                        await sendOrderStatusEmail(updatedOrder.userId.email, updatedOrder._id, 'cancelled', restaurantName, items);
                    }
                    io.emit('order_status_updated', updatedOrder);
                    console.log(`Order ${orderId} status updated to cancelled.`);
                } else {
                    console.log(`Order ${orderId} not found.`);
                }
            } catch (error) {
                console.error('Error updating order status to cancelled:', error);
            }
        });

        
        socket.on('ready_for_pickup', async (data) => {
            try {
                const { orderId } = data;
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId,
                    { status: 'ready for pickup' },
                    { new: true }
                ).populate('userId', 'email').populate('vendorId', 'name');

                if (updatedOrder) {
                    if (updatedOrder.userId && updatedOrder.userId.email) {
                        const restaurantName = updatedOrder.vendorId && updatedOrder.vendorId.name ? updatedOrder.vendorId.name : '';
                        const items = updatedOrder.items;
                        await sendOrderStatusEmail(updatedOrder.userId.email, updatedOrder._id, 'ready for pickup', restaurantName, items);
                    }
                    io.emit('order_status_updated', updatedOrder);
                    console.log(`Order ${orderId} status updated to ready for pickup.`);
                } else {
                    console.log(`Order ${orderId} not found.`);
                }
            } catch (error) {
                console.error('Error updating order status to ready for pickup:', error);
            }
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