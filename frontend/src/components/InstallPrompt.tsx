import React, { useState, useEffect } from 'react';
import { IoDownloadOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-8 md:bottom-8 md:w-80"
                >
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white text-2xl">
                                <IoDownloadOutline />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Install CampusQuickBite</h3>
                                <p className="text-white/60 text-xs">Fast access & real push notifications</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleInstall}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                            >
                                Install
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-white/40 hover:text-white text-[10px] text-center"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
