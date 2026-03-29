/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiClock, FiCheckCircle, FiPackage, FiHome, FiCoffee, FiShoppingBag, FiBell, FiCalendar, FiMessageSquare, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../hooks/context/ToastContext';
import { FadeIn } from '../../components/animations/FadeIn';

interface OrderItem {
 id: number;
 menuItem: { id: number; name: string };
 quantity: number;
 price: number;
}

interface Order {
 id: number;
 totalAmount: number;
 status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
 payment_status: string;
 items: OrderItem[];
 outlet: { name: string };
 notes?: string;
 scheduledAt?: string;
 preparingAt?: string;
}

// --- ETA helpers ---
const AVG_PREP_SECONDS_PER_ITEM = 15 * 60; // 15 min per item quantity

const calcEtaSeconds = (order: Order): number => {
    if (!order.preparingAt) return 0;
    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const estimatedTotal = totalItems * AVG_PREP_SECONDS_PER_ITEM;
    const elapsed = Math.floor((Date.now() - new Date(order.preparingAt).getTime()) / 1000);
    return Math.max(0, estimatedTotal - elapsed);
};

const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return 'Almost ready!';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
};

const etaProgress = (order: Order): number => {
    if (!order.preparingAt) return 0;
    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const estimatedTotal = totalItems * AVG_PREP_SECONDS_PER_ITEM;
    const elapsed = Math.floor((Date.now() - new Date(order.preparingAt).getTime()) / 1000);
    return Math.min(100, Math.round((elapsed / estimatedTotal) * 100));
};

// --- Audio ---
const playNotificationSound = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Rising melody: C5 → E5 → G5
        [[523, 0], [659, 0.18], [784, 0.36]].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.45);
        });
    } catch { /* audio not available */ }
};

// --- ETA Live Timer component ---
const ETACountdown = ({ order }: { order: Order }) => {
    const [remaining, setRemaining] = useState(() => calcEtaSeconds(order));
    const [progress, setProgress] = useState(() => etaProgress(order));

    useEffect(() => {
        const id = setInterval(() => {
            setRemaining(calcEtaSeconds(order));
            setProgress(etaProgress(order));
        }, 1000);
        return () => clearInterval(id);
    }, [order]);

    const isOverdue = remaining === 0;

    return (
        <div
            className="rounded-2xl p-5 border mb-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: isOverdue ? 'rgb(34 197 94 / 0.3)' : 'var(--border-color)' }}
        >
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-input)' }}
                >
                    <FiClock className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        Estimated Ready In
                    </p>
                    <p
                        className={`text-2xl font-black tabular-nums tracking-tight ${isOverdue ? 'text-emerald-500' : 'text-brand-500'}`}
                    >
                        {formatCountdown(remaining)}
                    </p>
                </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
                <div
                    className={`h-2 rounded-full transition-all duration-1000 ${isOverdue ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Started cooking</span>
                <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{progress}% done</span>
            </div>
        </div>
    );
};

const OrderLiveStatus = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { showToast } = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);
    const prevStatusRef = useRef<string | null>(null);

    // Tab title blink for status changes
    const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTabBlink = (message: string) => {
        let isOriginal = false;
        const original = 'CampusBites — Order Status';
        if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        blinkIntervalRef.current = setInterval(() => {
            document.title = isOriginal ? original : `🔔 ${message}`;
            isOriginal = !isOriginal;
        }, 800);
        setTimeout(() => {
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
            document.title = original;
        }, 12000);
    };

    useEffect(() => {
        document.title = 'CampusBites — Order Status';
        return () => {
            document.title = 'CampusBites';
            if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
        };
    }, []);

    const fetchOrder = useCallback(async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            const newOrder = response.data;

            if (prevStatusRef.current && prevStatusRef.current !== newOrder.status) {
                playNotificationSound();
                const statusLabels: Record<string, string> = {
                    'PREPARING': '👨‍🍳 Preparing your food',
                    'READY': '✅ Ready for Pickup!',
                    'COMPLETED': '🎉 Order Completed',
                    'CANCELLED': '❌ Order Cancelled'
                };
                const label = statusLabels[newOrder.status.toUpperCase()] || `Status: ${newOrder.status}`;
                showToast(label, newOrder.status.toUpperCase() === 'CANCELLED' ? 'error' : 'success');
                startTabBlink(label);

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('CampusBites', {
                        body: label,
                        icon: '/favicon.ico',
                    });
                }
            }
            prevStatusRef.current = newOrder.status;
            setOrder(newOrder);

            if (newOrder.status.toUpperCase() === 'READY' && !qrToken) {
                try {
                    const tokenRes = await api.get(`/orders/${newOrder.id}/token`);
                    setQrToken(tokenRes.data.token);
                } catch (err) {
                    console.error('Failed to fetch secure QR token', err);
                }
            } else if (newOrder.status.toUpperCase() !== 'READY') {
                setQrToken(null);
            }
        } catch (error) {
            console.error('Failed to fetch order', error);
        } finally {
            setIsLoading(false);
        }
    }, [orderId, qrToken, showToast]);

    useEffect(() => {
        fetchOrder();
        const intervalId = setInterval(fetchOrder, 10000);
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        return () => clearInterval(intervalId);
    }, [orderId, fetchOrder]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>Loading order status...</p>
            </div>
        );
    }

    if (!order) return (
        <div className="text-center font-semibold mt-32 text-lg p-8 rounded-2xl border max-w-md mx-auto"
            style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            Order not found
        </div>
    );

    const steps = [
        { key: 'PENDING', label: 'Order Placed', icon: FiClock, desc: 'Waiting for restaurant' },
        { key: 'PREPARING', label: 'Preparing', icon: FiCoffee, desc: 'Cooking your food' },
        { key: 'READY', label: 'Ready for Pickup', icon: FiPackage, desc: 'Pick up at counter' },
        { key: 'COMPLETED', label: 'Delivered', icon: FiCheckCircle, desc: 'Order finished' },
    ];

    const statusMap: Record<string, number> = {
        'PENDING': 0, 'PREPARING': 1, 'READY': 2, 'COMPLETED': 3
    };

    const currentStepIndex = statusMap[order.status.toUpperCase()] ?? 0;
    const isPreparing = order.status.toUpperCase() === 'PREPARING';
    const qrData = qrToken || '';

    return (
        <FadeIn delay={0.1}>
            <div className="max-w-5xl mx-auto py-8 px-6 pb-24 relative z-10">
                <div
                    className="backdrop-blur-2xl rounded-[3rem] overflow-hidden shadow-2xl"
                    style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                >
                    <div className="p-8 md:p-14">
                        <div className="flex flex-col lg:flex-row justify-between gap-12">
                            {/* Left: Status stepper */}
                            <div className="flex-1 space-y-6">
                                <div className="pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Order Status
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                        Tracking order at <span className="text-brand-500 font-semibold">{order.outlet.name}</span>
                                    </p>
                                </div>

                                {/* Scheduled pickup banner */}
                                {order.scheduledAt && (
                                    <div
                                        className="flex items-center gap-3 px-5 py-4 rounded-2xl border"
                                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgb(234 179 8 / 0.3)' }}
                                    >
                                        <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <FiCalendar className="w-4 h-4 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">Scheduled Pickup</p>
                                            <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                                                {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>
                                                    · {new Date(order.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Notes banner */}
                                {order.notes && (
                                    <div
                                        className="flex items-start gap-3 px-5 py-4 rounded-2xl border"
                                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgb(14 165 233 / 0.3)' }}
                                    >
                                        <div className="w-9 h-9 bg-sky-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <FiMessageSquare className="w-4 h-4 text-sky-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-0.5">Your Note to Kitchen</p>
                                            <p className="text-sm font-medium italic" style={{ color: 'var(--text-secondary)' }}>"{order.notes}"</p>
                                        </div>
                                    </div>
                                )}

                                {/* ETA Countdown (only when PREPARING) */}
                                {isPreparing && order.preparingAt && (
                                    <ETACountdown order={order} />
                                )}

                                {order.status.toUpperCase() === 'CANCELLED' ? (
                                    <div className="p-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-center border border-red-200 dark:border-red-500/20">
                                        <FiAlertTriangle className="w-8 h-8 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold mb-1">Order Cancelled</h3>
                                        <p className="text-sm opacity-80">This order has been cancelled.</p>
                                    </div>
                                ) : (
                                    <div className="relative max-w-sm">
                                        {/* Vertical progress line */}
                                        <div
                                            className="absolute left-[1.1rem] top-6 bottom-6 w-0.5 rounded-full overflow-hidden"
                                            style={{ backgroundColor: 'var(--border-color)' }}
                                        >
                                            <div
                                                className="w-full bg-brand-500 transition-all duration-700 ease-out"
                                                style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                            />
                                        </div>

                                        <div className="space-y-8 relative z-10">
                                            {steps.map((step, index) => {
                                                const isPassed = currentStepIndex >= index;
                                                const isCurrent = currentStepIndex === index;
                                                const Icon = step.icon;
                                                return (
                                                    <div key={index} className="flex items-start">
                                                        <div className={`
                                                            flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300
                                                            ${isPassed ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)]'}
                                                            ${isCurrent ? 'ring-4 ring-brand-500/20' : ''}
                                                        `}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div className="ml-5 pt-0.5">
                                                            <p className={`font-bold text-base leading-tight mb-0.5 transition-colors duration-300 ${isCurrent ? 'text-brand-500' : isPassed ? '' : ''}`}
                                                                style={{ color: isCurrent ? undefined : isPassed ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                                            >
                                                                {step.label}
                                                                {isCurrent && <span className="ml-2 px-2 py-0.5 bg-brand-500 text-white text-[10px] font-semibold rounded-md">Now</span>}
                                                            </p>
                                                            <p className={`text-xs ${isPassed ? 'text-brand-500' : 'text-[var(--text-muted)]'}`}>
                                                                {step.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Order summary card */}
                            <div className="lg:w-72 space-y-6 pt-6 lg:pt-0">
                                <div
                                    className="backdrop-blur-xl p-8 rounded-3xl shadow-xl"
                                    style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                                >
                                    <div className="flex justify-between items-start mb-5" style={{ color: 'var(--text-primary)' }}>
                                        <div>
                                            <p className="text-xs opacity-60 mb-1">Order</p>
                                            <p className="text-2xl font-bold">#{order.id}</p>
                                        </div>
                                        {order.status.toUpperCase() === 'READY' && qrToken && (
                                            <button
                                                onClick={() => setShowQR(!showQR)}
                                                className={`px-4 py-2 font-bold text-xs rounded-xl border transition-all shadow-sm ${showQR ? 'bg-brand-500 text-white border-brand-500 shadow-brand-500/20' : ''}`}
                                                style={!showQR ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' } : undefined}
                                            >
                                                {showQR ? 'Hide QR' : 'Show QR'}
                                            </button>
                                        )}
                                    </div>

                                    {showQR && qrToken && (
                                        <div className="mb-5 flex flex-col items-center w-full">
                                            <div className="bg-white p-4 rounded-2xl shadow-xl inline-block relative overflow-hidden">
                                                <QRCodeSVG value={qrData} size={200} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={true} />
                                                <div className="absolute top-2 right-2 bg-brand-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded tracking-tighter uppercase">Secure Token</div>
                                            </div>
                                            <p className="text-[10px] opacity-50 mt-3 text-center font-medium">Auto-refreshes for security</p>
                                        </div>
                                    )}

                                    <div className="space-y-2.5 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <FiBell className="mr-2 text-brand-500 w-3.5 h-3.5 flex-shrink-0" /> Notifications on
                                        </div>
                                        <div className="flex items-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <FiClock className="mr-2 text-brand-500 w-3.5 h-3.5 flex-shrink-0" /> Live updates every 10s
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="backdrop-blur-xl rounded-3xl p-6 shadow-xl"
                                    style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                                >
                                    <div className="flex items-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                                        <FiShoppingBag className="mr-2 w-4 h-4" />
                                        <h4 className="font-semibold text-sm">Order summary</h4>
                                    </div>
                                    <ul className="space-y-3 mb-5">
                                        {order.items.map(item => (
                                            <li key={item.id} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className="w-6 h-6 flex items-center justify-center font-semibold text-xs rounded-md border"
                                                        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                                    >
                                                        {item.quantity}x
                                                    </span>
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.menuItem.name}</span>
                                                </div>
                                                <span className="font-medium" style={{ color: 'var(--text-muted)' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pt-4 border-t flex justify-between items-end" style={{ borderColor: 'var(--border-color)' }}>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</span>
                                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>₹{order.totalAmount.toFixed(0)}</span>
                                    </div>
                                </div>

                                <div className="text-center pt-2">
                                    <Link to="/" className="inline-flex items-center font-medium text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
                                        <FiHome className="mr-2 w-4 h-4" />
                                        Back to outlets
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FadeIn>
    );
};

export default OrderLiveStatus;
