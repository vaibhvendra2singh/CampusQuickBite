import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { sendPushNotification } from './pushService';
import { supabase } from '../config/supabase';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer) => {
    const allowedOrigins = process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:5173']
        : ['http://localhost:5173'];

    io = new SocketIOServer(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);

                // Allow local development
                const isLocalIP = origin.match(/^https?:\/\/(127\.0\.0\.1|localhost|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+(:\d+)?$/);
                if (isLocalIP) return callback(null, true);

                // Get configured URLs and strip trailing slashes
                const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
                const corsOrigin = process.env.CORS_ORIGIN?.replace(/\/$/, '');
                const cleanOrigin = origin.replace(/\/$/, '');

                if ((frontendUrl && cleanOrigin === frontendUrl) || (corsOrigin && cleanOrigin === corsOrigin)) {
                    return callback(null, true);
                }

                callback(new Error('Not allowed by CORS'));
            },
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

export const notifyOrderUpdate = async (userId: string, orderId: any, status: string) => {
    const message = `Your order #${String(orderId).slice(-4)} is now ${status.toUpperCase()}!`;
    
    if (io) {
        console.log(`Emitting order_update to user ${userId} for order ${orderId}`);
        io.to(userId).emit('order_update', {
            orderId,
            status,
            message
        });
    }

    try {
        const { data: user } = await supabase
            .from('users')
            .select('push_subscription')
            .eq('id', userId)
            .single();

        if (user && user.push_subscription) {
            await sendPushNotification(user.push_subscription, {
                title: 'Order Status Update',
                body: message,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'order-update',
                data: { url: '/orders' }
            });
            console.log(`Push notification sent to user ${userId}`);
        }
    } catch (err: any) {
        if (!err.message?.includes('push_subscription')) {
             console.error('Failed to send push notification:', err.message);
        }
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
