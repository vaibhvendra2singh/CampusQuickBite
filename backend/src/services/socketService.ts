import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer) => {
    const allowedOrigins = process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:5173']
        : ['http://localhost:5173'];

    io = new SocketIOServer(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected to socket:', socket.id);

        socket.on('join_room', (userId: string) => {
            console.log(`User ${userId} joined their personal room`);
            socket.join(userId);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket first.');
    }
    return io;
};

export const notifyOrderUpdate = (userId: string, orderId: any, status: string) => {
    if (io) {
        console.log(`Emitting order_update to user ${userId} for order ${orderId}`);
        io.to(userId).emit('order_update', {
            orderId,
            status,
            message: `Your order #${orderId} is now ${status.toUpperCase()}!`
        });
    }
};

export const notifyAccountStatus = (userId: string, statusPayload: { isFrozen?: boolean, isBanned?: boolean, message?: string }) => {
    if (io) {
        console.log(`Emitting account_status_update to user ${userId}:`, statusPayload);
        io.to(userId).emit('account_status_update', statusPayload);
    }
};
export const notifyMenuUpdate = (outletId: string) => {
    if (io) {
        console.log(`Emitting menu_update for outlet ${outletId}`);
        io.emit('menu_update', { outletId });
    }
};
