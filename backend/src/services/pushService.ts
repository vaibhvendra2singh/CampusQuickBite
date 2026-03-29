import webPush from 'web-push';
import fs from 'fs';
import path from 'path';

const VAPID_KEY_FILE = path.join(__dirname, '../../.vapid.json');
let vapidKeys: { publicKey: string, privateKey: string };

try {
    if (fs.existsSync(VAPID_KEY_FILE)) {
        vapidKeys = JSON.parse(fs.readFileSync(VAPID_KEY_FILE, 'utf-8'));
    } else {
        vapidKeys = webPush.generateVAPIDKeys();
        fs.writeFileSync(VAPID_KEY_FILE, JSON.stringify(vapidKeys, null, 2));
    }

    webPush.setVapidDetails(
        'mailto:developer@campusbites.test',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
} catch (error) {
    console.error('Failed to initialize VAPID keys for push notifications', error);
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
