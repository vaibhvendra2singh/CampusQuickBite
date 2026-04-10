import React, { createContext, useContext, useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '../../firebase/config';
import { useAuth } from './AuthContext';
import api from '../../services/api';
import { useToast } from './ToastContext';

interface NotificationContextType {
  fcmToken: string | null;
  notification: any | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const setupNotifications = async () => {
      if (user) {
        const token = await requestForToken();
        if (token) {
          setFcmToken(token);
          try {
            await api.post(`/push/register-fcm`, { token });
            console.log('FCM token registered with backend');
          } catch (error) {
            console.error('Failed to register FCM token with backend', error);
          }
        }
      }
    };

    setupNotifications();
  }, [user]);

  useEffect(() => {
    const listener = onMessageListener();
    if (listener) {
      listener
        .then((payload: any) => {
          setNotification(payload);
          showToast(`${payload.notification.title}: ${payload.notification.body}`, 'info');
        })
        .catch((err) => console.log('Listener failed: ', err));
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ fcmToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
