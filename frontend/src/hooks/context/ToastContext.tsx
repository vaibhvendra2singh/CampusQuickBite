/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col space-y-4 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto glass-dark p-1 pr-6 rounded-2xl shadow-2xl flex items-center min-w-[300px] max-w-md animate-none border border-white/10 group bg-black/80 backdrop-blur-xl`}
                    >
                        <div className={`p-4 rounded-xl mr-4 ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' :
                            toast.type === 'error' ? 'bg-red-500/20 text-red-400' :
                                'bg-brand-500/20 text-brand-400'
                            }`}>
                            {toast.type === 'success' && <FiCheckCircle className="w-5 h-5" />}
                            {toast.type === 'error' && <FiAlertCircle className="w-5 h-5" />}
                            {toast.type === 'info' && <FiInfo className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 py-4">
                            <p className="text-sm font-medium text-white tracking-tight">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-2 text-white/20  transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
