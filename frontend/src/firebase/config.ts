import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = import.meta.env.VITE_FIREBASE_API_KEY ? initializeApp(firebaseConfig) : null;

let messaging: any = null;

const initMessaging = async () => {
    if (app && typeof window !== 'undefined') {
        try {
            const supported = await isSupported();
            if (supported) {
                messaging = getMessaging(app);
            }
        } catch (err) {
            console.warn("FCM not supported in this environment", err);
        }
    }
};

initMessaging();

export const requestForToken = async () => {
  try {
    if (!messaging) {
      await initMessaging();
    }

    if (typeof window === 'undefined' || !('Notification' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission === "granted" && messaging) {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      if (token) {
        console.log("FCM Token:", token);
        return token;
      } else {
        console.log("No registration token available. Request permission to generate one.");
      }
    }
  } catch (err) {
    console.error("An error occurred while retrieving token.", err);
  }
  return null;
};

export const onMessageListener = async () => {
  // Wait a bit for initialization if it's still null
  if (!messaging) {
    await initMessaging();
  }
  
  return new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export default app;
