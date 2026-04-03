import webPush from 'web-push';
import fs from 'fs';
import path from 'path';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:developer@campusbites.test';

let vapidKeys: { publicKey: string, privateKey: string };

try {
    if (vapidPublicKey && vapidPrivateKey) {
        vapidKeys = { publicKey: vapidPublicKey, privateKey: vapidPrivateKey };
        webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
        console.log('[PUSH_SERVICE] Initialized successfully using environment variables.');
    } else {
        const VAPID_KEY_FILE = path.join(__dirname, '../../.vapid.json');
        if (fs.existsSync(VAPID_KEY_FILE)) {
            vapidKeys = JSON.parse(fs.readFileSync(VAPID_KEY_FILE, 'utf-8'));
        } else {
            vapidKeys = webPush.generateVAPIDKeys();
            fs.writeFileSync(VAPID_KEY_FILE, JSON.stringify(vapidKeys, null, 2));
        }

        webPush.setVapidDetails(
            vapidEmail,
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        console.log('[PUSH_SERVICE] Initialized using .vapid.json fallback.');
    }
} catch (error) {
    console.error('Failed to initialize VAPID keys for push notifications:', error);
}

export const getPublicKey = () => vapidKeys?.publicKey || '';

export const sendPushNotification = async (subscription: any, payload: any) => {
    if (!subscription || !vapidKeys) return;
    try {
        await webPush.sendNotification(
            subscription, 
            typeof payload === 'string' ? payload : JSON.stringify(payload)
        );
    } catch (err) {
        console.error('Error sending push notification', err);
    }
};
