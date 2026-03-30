/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/context/AuthContext';
import { useToast } from '../../hooks/context/ToastContext';
import { FiArrowLeft, FiClock, FiAlertTriangle, FiCheck, FiRefreshCw, FiZap, FiActivity } from 'react-icons/fi';

/** Classic Service Bell 'Ding' Effect (High-pitched metallic ring) */
const playKitchenAlert = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Bell hit frequencies (E6 and B6) create a striking metallic dissonance
        const frequencies = [1318.51, 1975.53, 2637.02];
        
        frequencies.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Sharp transient hit, long ring out
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1.5);
        });
    } catch { /* audio not supported */ }
};

interface OrderItem {
    id: number;
    menuItem: { name: string };
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    totalAmount: number;
    total_amount?: number;
    status: string;
    payment_status: string;
    createdAt: string;
    created_at?: string;
    items: OrderItem[];
    user?: { name: string };
    notes?: string;
    scheduledAt?: string;
}

interface Outlet {
    id: number;
    name: string;
}

const secondsSince = (dateStr: string): number => {
    try {
        return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    } catch {
        return 0;
    }
};

const formatElapsed = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const useElapsedSeconds = (dateStr: string) => {
    const [elapsed, setElapsed] = useState(() => secondsSince(dateStr));
    useEffect(() => {
        const id = setInterval(() => setElapsed(secondsSince(dateStr)), 1000);
        return () => clearInterval(id);
    }, [dateStr]);
    return elapsed;
};

const WARN_SECONDS = 15 * 60;

const KDSCard = ({
    order,
    onAccept,
    onReady,
    onComplete,
    onCancel,
}: {
    order: Order;
    onAccept: (id: number) => void;
    onReady: (id: number) => void;
    onComplete: (id: number) => void;
    onCancel: (id: number) => void;
}) => {
    const dateStr = order.createdAt || order.created_at || '';
    const elapsed = useElapsedSeconds(dateStr);
    const isLate = elapsed >= WARN_SECONDS;
    const isPreparing = order.status?.toUpperCase() === 'PREPARING';
    const isPending = order.status?.toUpperCase() === 'PENDING';
    const isReady = order.status?.toUpperCase() === 'READY';

    const accentColor = isLate && (isPreparing || isPending)
        ? 'border-red-500 shadow-red-500/20'
        : isPreparing
        ? 'border-amber-400 shadow-amber-400/10'
        : isPending
        ? 'border-brand-500 shadow-brand-500/10'
        : isReady
        ? 'border-emerald-500 shadow-emerald-500/10'
        : 'border-[var(--border-color)]';

    const timerColor = isLate && (isPreparing || isPending)
        ? 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse'
        : isPreparing
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-[var(--text-muted)] bg-[var(--bg-input)] border-[var(--border-color)]';

    return (
        <div
            className={`relative flex flex-col border-2 rounded-[28px] shadow-xl overflow-hidden transition-all duration-500 ${accentColor}`}
            style={{ minHeight: '340px', backgroundColor: 'var(--bg-card)' }}
        >
            {/* Top accent bar */}
            <div
                className={`h-1.5 w-full ${
                    isLate && (isPreparing || isPending)
                        ? 'bg-red-500 animate-pulse'
                        : isPreparing
                        ? 'bg-amber-400'
                        : isPending
                        ? 'bg-brand-500'
                        : isReady
                        ? 'bg-emerald-500'
                        : 'bg-[var(--border-color)]'
                }`}
            />

            {/* Card Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span
                            className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-widest border"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-hover)',
                            }}
                        >
                            #{String(order.id).slice(-4)}
                        </span>
                        <span className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-widest border ${
                            isPending ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                            isPreparing ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                            isReady ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                            'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-color)]'
                        }`}>
                            {order.status?.replace('_', ' ')}
                        </span>
                        {order.payment_status === 'paid' && (
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                ✓ PAID
                            </span>
                        )}
                    </div>
                    <h3 className="text-2xl font-black tracking-tight truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {order.user?.name || 'Guest Customer'}
                    </h3>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-sm font-black tabular-nums ml-4 flex-shrink-0 ${timerColor}`}>
                    {isLate && (isPreparing || isPending) ? (
                        <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                        <FiClock className="w-4 h-4 flex-shrink-0" />
                    )}
                    {formatElapsed(elapsed)}
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 px-6 pb-4 space-y-2.5">
                {order.items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-brand-500/20 text-brand-500 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0">
                            {item.quantity}
                        </span>
                        <span className="font-bold text-lg tracking-tight truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {item.menuItem?.name || 'Item'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="mx-6 mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-amber-600 dark:text-amber-300 text-sm font-semibold italic leading-snug">
                        📝 {order.notes}
                    </p>
                </div>
            )}

            {/* Scheduled pickup */}
            {order.scheduledAt && (
                <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <FiClock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-600 dark:text-blue-300 text-xs font-black uppercase tracking-wider">
                        Pickup: {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="px-6 pb-6 pt-3 mt-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</span>
                    <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>₹{Number(order.totalAmount ?? order.total_amount ?? 0).toFixed(0)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 flex-wrap">
                    {isPending && (
                        <>
                            <button
                                onClick={() => onAccept(order.id)}
                                className="flex-1 py-3 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => onCancel(order.id)}
                                className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                            >
                                Reject
                            </button>
                        </>
                    )}
                    {isPreparing && (
                        <>
                            <button
                                onClick={() => onReady(order.id)}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
                            >
                                <FiCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                                Ready
                            </button>
                            <button
                                onClick={() => onCancel(order.id)}
                                className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                    {isReady && (
                        <button
                            onClick={() => onComplete(order.id)}
                            className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                            }}
                        >
                            Mark Delivered
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const KitchenDisplay = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [outlet, setOutlet] = useState<Outlet | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const prevCountRef = useRef<number | null>(null);
    const tabBlinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const triggerKitchenAlert = (count: number) => {
        playKitchenAlert();
        // Tab blink
        const original = document.title;
        let isOriginal = false;
        if (tabBlinkRef.current) clearInterval(tabBlinkRef.current);
        tabBlinkRef.current = setInterval(() => {
            document.title = isOriginal ? original : `🔔 ${count} New Order${count > 1 ? 's' : ''}! — KDS`;
            isOriginal = !isOriginal;
        }, 700);
        setTimeout(() => {
            if (tabBlinkRef.current) clearInterval(tabBlinkRef.current);
            document.title = original;
        }, 15000);
    };

    useEffect(() => {
        return () => {
            if (tabBlinkRef.current) clearInterval(tabBlinkRef.current);
        };
    }, []);

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsSyncing(true);
            const outletsRes = await api.get('/outlets');
            const myOutlet = outletsRes.data.find((o: any) =>
                String(o.owner?.id).toLowerCase() === String(user?.id).toLowerCase()
            );
            if (myOutlet) {
                setOutlet(myOutlet);
                const ordersRes = await api.get(`/orders/outlet/${myOutlet.id}`);
                const sorted = ordersRes.data
                    .filter((o: Order) => {
                        const s = o.status?.toUpperCase();
                        return s !== 'COMPLETED' && s !== 'CANCELLED';
                    })
                    .sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                setOrders(sorted);
            }
        } catch (err) {
            console.error('KDS fetch error', err);
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        const id = setInterval(() => fetchData(true), 15000);
        return () => clearInterval(id);
    }, [fetchData]);

    useEffect(() => {
        const active = orders.filter(o => o.status?.toUpperCase() === 'PENDING').length;
        if (prevCountRef.current !== null && active > prevCountRef.current) {
            triggerKitchenAlert(active);
        }
        prevCountRef.current = orders.filter(o => o.status?.toUpperCase() === 'PENDING').length;
    }, [orders]);

    const updateStatus = async (orderId: number, status: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            setOrders(prev => prev
                .map(o => o.id === orderId ? { ...o, status } : o)
                .filter(o => {
                    const s = o.status?.toUpperCase();
                    return s !== 'COMPLETED' && s !== 'CANCELLED';
                })
            );
            showToast(`Order #${String(orderId).slice(-4)} → ${status}`, 'success');
        } catch {
            showToast('Failed to update status', 'error');
        }
    };

    const cancelOrder = async (orderId: number) => {
        if (!window.confirm(`Cancel order #${String(orderId).slice(-4)}?`)) return;
        try {
            await api.put(`/orders/${orderId}/cancel`);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            showToast('Order cancelled', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to cancel', 'error');
        }
    };

    const pendingOrders = orders.filter(o => o.status?.toUpperCase() === 'PENDING');
    const preparingOrders = orders.filter(o => o.status?.toUpperCase() === 'PREPARING');
    const readyOrders = orders.filter(o => o.status?.toUpperCase() === 'READY');
    const lateOrders = preparingOrders.filter(o => secondsSince(o.createdAt || o.created_at || '') >= WARN_SECONDS);

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center rounded-3xl" style={{ backgroundColor: 'var(--bg-body)' }}>
                <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-6" />
                <p className="font-bold uppercase tracking-widest text-sm" style={{ color: 'var(--text-muted)' }}>Initializing Kitchen Display…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen rounded-2xl mt-2 mx-1 sm:mx-2 px-4 sm:px-6 md:px-8 pb-16" style={{ backgroundColor: 'var(--bg-body)' }}>
            {/* KDS Header */}
            <div className="sticky top-2 z-40 pt-3">
                <div
                    className="backdrop-blur-xl rounded-2xl px-5 py-3.5 shadow-lg"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 8px 32px var(--shadow-color)',
                    }}
                >
                    <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto flex-wrap">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/owner/dashboard"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                                style={{
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                }}
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
                                    <FiActivity className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest leading-none">Kitchen Display</p>
                                    <h1 className="font-black text-lg tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>{outlet?.name || 'KDS'}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {pendingOrders.length > 0 && (
                                <span className="px-4 py-2 bg-blue-500/15 border border-blue-500/30 text-blue-500 rounded-xl text-xs font-black uppercase tracking-widest">
                                    {pendingOrders.length} Pending
                                </span>
                            )}
                            {preparingOrders.length > 0 && (
                                <span className="px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-widest">
                                    {preparingOrders.length} Cooking
                                </span>
                            )}
                            {lateOrders.length > 0 && (
                                <span className="px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest animate-pulse">
                                    <FiAlertTriangle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                                    {lateOrders.length} Overdue
                                </span>
                            )}
                            {readyOrders.length > 0 && (
                                <span className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest">
                                    {readyOrders.length} Ready
                                </span>
                            )}
                            
                            <div className="hidden md:flex px-3 py-2 bg-slate-500/10 border border-slate-500/20 rounded-xl text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider items-center cursor-help" title="Click anywhere on the dashboard once to allow your browser to play the audio alerts.">
                                🔔 Click page for audio
                            </div>


                            <button
                                onClick={() => fetchData()}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                                style={{
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                }}
                            >
                                <FiRefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>



            <div className="max-w-screen-2xl mx-auto pt-6">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                        >
                            <FiZap className="w-10 h-10" style={{ color: 'var(--border-hover)' }} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>All Clear!</h2>
                        <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>No active orders right now. New orders will appear here instantly.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* PENDING */}
                        {pendingOrders.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 px-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                    <h2 className="font-black text-xl uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>New Orders</h2>
                                    <span className="px-3 py-1 bg-blue-500/15 border border-blue-500/20 text-blue-500 rounded-xl text-xs font-black">{pendingOrders.length}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {pendingOrders.map(order => (
                                        <KDSCard
                                            key={order.id}
                                            order={order}
                                            onAccept={(id) => updateStatus(id, 'PREPARING')}
                                            onReady={(id) => updateStatus(id, 'READY')}
                                            onComplete={(id) => updateStatus(id, 'COMPLETED')}
                                            onCancel={cancelOrder}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* PREPARING */}
                        {preparingOrders.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 px-1">
                                    <div className={`w-2.5 h-2.5 rounded-full ${lateOrders.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                                    <h2 className={`font-black text-xl uppercase tracking-wider ${lateOrders.length > 0 ? 'text-red-500' : ''}`}
                                        style={lateOrders.length === 0 ? { color: 'var(--text-primary)' } : undefined}
                                    >
                                        Cooking Now {lateOrders.length > 0 && `— ${lateOrders.length} Overdue!`}
                                    </h2>
                                    <span className={`px-3 py-1 rounded-xl text-xs font-black border ${lateOrders.length > 0 ? 'bg-red-500/15 border-red-500/20 text-red-500' : 'bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                        {preparingOrders.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {preparingOrders.map(order => (
                                        <KDSCard
                                            key={order.id}
                                            order={order}
                                            onAccept={(id) => updateStatus(id, 'PREPARING')}
                                            onReady={(id) => updateStatus(id, 'READY')}
                                            onComplete={(id) => updateStatus(id, 'COMPLETED')}
                                            onCancel={cancelOrder}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* READY */}
                        {readyOrders.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 px-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <h2 className="text-emerald-600 dark:text-emerald-400 font-black text-xl uppercase tracking-wider">Ready for Pickup</h2>
                                    <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black">{readyOrders.length}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {readyOrders.map(order => (
                                        <KDSCard
                                            key={order.id}
                                            order={order}
                                            onAccept={(id) => updateStatus(id, 'PREPARING')}
                                            onReady={(id) => updateStatus(id, 'READY')}
                                            onComplete={(id) => updateStatus(id, 'COMPLETED')}
                                            onCancel={cancelOrder}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenDisplay;
