// socket.js
const { Server } = require('socket.io');
const Order = require('./Models/orders'); // Import the Order model

let io;

function init(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Be more specific in production
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('✅ A user connected with socket ID:', socket.id);

        // Listen for 'accept_order' event from a client
        socket.on('accept_order', async (data) => {
            try {
                const { orderId } = data;
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId,
                    { status: 'preparing' }, // Set the status to 'preparing'
                    { new: true }
                ).populate('vendorId', 'name').populate('items.menuItemId', 'name');

                if (updatedOrder) {
                    // Emit an event to all clients that the order status has been updated
                    io.emit('order_status_updated', updatedOrder);
                    console.log(`Order ${orderId} status updated to preparing.`);
                } else {
                    // Handle case where order is not found
                    // You can emit an error back to the sender
                    console.log(`Order ${orderId} not found.`);
                }
            } catch (error) {
                console.error('Error updating order status:', error);
                // Optionally, emit an error event back to the client
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