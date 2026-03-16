import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/context/AuthContext';
import { useToast } from '../hooks/context/ToastContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.host}`;

export const useSocket = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const { showToast } = useToast();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Initialize socket connection
            const newSocket = io(SOCKET_URL);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                // Join person room for notifications
                newSocket.emit('join_room', user.id);
            });

            newSocket.on('order_update', (data: { orderId: string, status: string, message: string }) => {
                console.log('Received order update socket event:', data);

                // Show notification to user
                showToast(data.message, 'info');

                // Browser notification if permitted
                if (Notification.permission === 'granted') {
                    new Notification('CampusQuickBite Update', {
                        body: data.message,
                        icon: '/logo192.png' // Use project icon if available
                    });
                }
            });

            newSocket.on('account_status_update', (data: { isFrozen?: boolean, isBanned?: boolean, message?: string }) => {
                console.log('Received account status update:', data);
                if (data.message) {
                    showToast(data.message, data.isFrozen || data.isBanned ? 'error' : 'success');
                }

                // Update local context to reflect status change immediately
                updateUser({
                    ...user,
                    isFrozen: data.isFrozen ?? user.isFrozen,
                    isBanned: data.isBanned ?? user.isBanned
                });
            });

            // Request notification permission on first load
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [isAuthenticated, user, showToast, updateUser]);

    return socket;
};
