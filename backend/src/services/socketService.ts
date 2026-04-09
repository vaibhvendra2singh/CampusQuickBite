import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { sendPushNotification } from './pushService';
import { sendFCMNotification } from './fcmService';
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
            .select('push_subscription, fcm_token')
            .eq('id', userId)
            .single();

        if (user) {
            // Priority 1: FCM (Native app feel)
            if (user.fcm_token) {
                await sendFCMNotification(user.fcm_token, {
                    title: 'Order Status Update',
                    body: message,
                    data: { url: '/orders', orderId: String(orderId) }
                });
                console.log(`FCM notification sent to user ${userId}`);
            } 
            // Priority 2: Web Push (Browser fallback)
            else if (user.push_subscription) {
                await sendPushNotification(user.push_subscription, {
                    title: 'Order Status Update',
                    body: message,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: 'order-update',
                    data: { url: '/orders' }
                });
                console.log(`Web push notification sent to user ${userId}`);
            }
        }
    } catch (err: any) {
        console.error('Failed to send push notification:', err.message);
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

export const notifyWalletUpdate = (userId: string, newBalance: number, amount: number, type: 'REFUND' | 'CREDIT') => {
    if (io) {
        const message = type === 'REFUND' 
            ? `₹${amount.toFixed(2)} Refunded to Wallet 💰`
            : `₹${amount.toFixed(2)} Credited to Wallet 💰`;
            
        console.log(`Emitting wallet_update to user ${userId}: ${message}`);
        io.to(userId).emit('wallet_update', {
            newBalance,
            amount,
            type,
            message
        });
    }
};
