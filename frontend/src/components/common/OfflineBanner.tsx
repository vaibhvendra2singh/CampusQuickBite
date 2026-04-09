import { useState, useEffect } from 'react';
import { FiWifiOff } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineBanner = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-brand-500 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
                >
                    <FiWifiOff className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">You are currently offline. Some features may be unavailable.</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineBanner;
