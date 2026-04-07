import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/context/AuthContext';
import { useToast } from '../hooks/context/ToastContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5001' : `http://${window.location.host}`);

export const useSocket = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const { showToast } = useToast();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            const newSocket = io(SOCKET_URL);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                newSocket.emit('join_room', user.id);
            });

            newSocket.on('order_update', (data: { orderId: string, status: string, message: string }) => {
                console.log('Received order update socket event:', data);

                showToast(data.message, 'info');

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('CampusQuickBite Update', {
                        body: data.message,
                        icon: '/logo192.png'
                    });
                }
            });

            newSocket.on('account_status_update', (data: { isFrozen?: boolean, isBanned?: boolean, message?: string }) => {
                console.log('Received account status update:', data);
                if (data.message) {
                    showToast(data.message, data.isFrozen || data.isBanned ? 'error' : 'success');
                }

                updateUser({
                    ...user,
                    isFrozen: data.isFrozen ?? user.isFrozen,
                    isBanned: data.isBanned ?? user.isBanned
                });
            });
            
            newSocket.on('wallet_update', (data: { newBalance: number, amount: number, message: string }) => {
                console.log('Received wallet update:', data);
                showToast(data.message, 'success');
                if (user) {
                    updateUser({ ...user, walletBalance: data.newBalance });
                }
            });

            if ('Notification' in window && Notification.permission === 'default') {
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
