import admin from 'firebase-admin';

let isInitialized = false;

export const initFCM = () => {
  if (isInitialized) return;

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountString) {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isInitialized = true;
      console.log('[FCM_SERVICE] Initialized successfully.');
    } else {
      console.warn('[FCM_SERVICE] FIREBASE_SERVICE_ACCOUNT not found in environment. FCM notifications will be disabled.');
    }
  } catch (error) {
    console.error('[FCM_SERVICE] Failed to initialize Firebase Admin:', error);
  }
};

export const sendFCMNotification = async (token: string, payload: { title: string, body: string, data?: any }) => {
  if (!isInitialized) return;

  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
    token: token,
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[FCM_SERVICE] Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('[FCM_SERVICE] Error sending message:', error);
    throw error;
  }
};
