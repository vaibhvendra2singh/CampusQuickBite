import { useEffect, useState } from 'react';
import api from '../services/api';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            navigator.serviceWorker.register('/sw.js').then((reg) => {
                console.log('SW Registration succeeded.', reg);
                reg.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub);
                });
            }).catch(e => console.error('SW Registration failed', e));
        }
    }, []);

    const subscribe = async () => {
        if (!isSupported) {
            console.error('Push Notifications not supported by browser');
            return false;
        }

        const currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
        
        if (currentPermission !== 'granted') {
            console.warn('Push Notifications denied by user');
            return false;
        }

        try {
            const { data } = await api.get('/push/vapid-key');
            const publicVapidKey = data.publicKey;

            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            await api.post('/push/subscribe', {
                subscription
            });
            
            setIsSubscribed(true);
            return true;

        } catch (err) {
            console.error('Error during push subscription setup', err);
            return false;
        }
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        subscribe
    };
};
