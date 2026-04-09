import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/immersive.css';
import { AuthProvider } from './hooks/context/AuthContext';
import { ThemeProvider } from './hooks/context/ThemeContext';
import { ToastProvider } from './hooks/context/ToastContext';
import { CartProvider } from './hooks/context/CartContext';
import { NotificationProvider } from './hooks/context/NotificationContext';
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],
        tracesSampleRate: 1.0, 
        replaysSessionSampleRate: 0.1, 
        replaysOnErrorSampleRate: 1.0,
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
  <AuthProvider>
   <ThemeProvider>
    <ToastProvider>
     <NotificationProvider>
      <CartProvider>
       <App />
      </CartProvider>
     </NotificationProvider>
    </ToastProvider>
   </ThemeProvider>
  </AuthProvider>
 </React.StrictMode>,
);
