/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/context/AuthContext';
import { FiCheck, FiMenu, FiClock, FiDollarSign, FiBarChart2, FiMaximize, FiX, FiActivity, FiAlertCircle, FiRefreshCw, FiTrendingUp, FiBell, FiBellOff, FiPrinter, FiTrash2, FiMessageSquare, FiMonitor } from 'react-icons/fi';
import { useToast } from '../../hooks/context/ToastContext';
import { Html5Qrcode } from 'html5-qrcode';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AnnouncementWidget from '../../components/common/AnnouncementWidget';

interface Outlet {
    id: number;
    name: string;
    location: string;
    is_open?: boolean;
    owner?: { id: number };
}

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

const OwnerDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [outlet, setOutlet] = useState<Outlet | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scannerLoading, setScannerLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [verificationOrder, setVerificationOrder] = useState<Order | null>(null);
    const [isDelivering, setIsDelivering] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [viewResetAt, setViewResetAt] = useState<Date | null>(null);

    const scanLockRef = useRef(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const prevOrderCountRef = useRef<number | null>(null);

    const logout = () => {
        window.location.href = '/login';
    };

    const fetchDashboardData = async () => {
        try {
            const outletsRes = await api.get('/outlets');
            const myOutlet = outletsRes.data.find((o: any) =>
                String(o.owner?.id).toLowerCase() === String(user?.id).toLowerCase()
            );

            if (myOutlet) {
                setOutlet(myOutlet);
                
                if (myOutlet.insights_reset_at) {
                    setViewResetAt(new Date(myOutlet.insights_reset_at));
                } else {
                    setViewResetAt(null);
                }

                const ordersRes = await api.get(`/orders/outlet/${myOutlet.id}`);
                setOrders(ordersRes.data.sort((a: Order, b: Order) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ));
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load dashboard", error);
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    const syncAllData = async () => {
        setIsSyncing(true);
        const startTime = Date.now();
        try {
            await fetchDashboardData();
            const duration = Date.now() - startTime;
            if (duration < 800) await new Promise(r => setTimeout(r, 800 - duration));
            showToast('Dashboard updated.', 'success');
        } catch (error) {
            showToast('Update failed.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleResetInsights = async () => {
        if (isResetting) return;
        setIsResetting(true);
        try {
            const res = await api.post('/owner/reset-insights');
            if (res.data.resetTime) {
                setViewResetAt(new Date(res.data.resetTime));
            }
            setShowResetModal(false);
            showToast('Insights data reset successfully', 'success');
        } catch (error: any) {
            showToast(
                error.response?.data?.error || 'Failed to reset insights. Please try again.',
                'error'
            );
        } finally {
            setIsResetting(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 15000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const activeCount = orders.filter(o => {
            const s = o.status?.toUpperCase();
            return s !== 'COMPLETED' && s !== 'CANCELLED';
        }).length;
        if (prevOrderCountRef.current !== null && activeCount > prevOrderCountRef.current && soundEnabled) {
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
            } catch { /* AudioContext not supported */ }
        }
        prevOrderCountRef.current = activeCount;
    }, [orders, soundEnabled]);

    const updateOrderStatus = async (orderId: string | number, newStatus: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            showToast(`Order #${orderId} is now ${newStatus}`, 'success');
        } catch (error) {
            console.error("Failed to update status", error);
            showToast("Failed to update order status.", 'error');
        }
    };

    const handleCancelOrder = async (orderId: string | number) => {
        if (window.confirm(`Cancel order #${orderId}?`)) {
            try {
                await api.put(`/orders/${orderId}/cancel`);
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
                showToast(`Order #${orderId} cancelled`, 'success');
            } catch (error: any) {
                showToast(error.response?.data?.error || "Failed to cancel order", 'error');
            }
        }
    };

    const toggleStatus = async () => {
        if (!outlet) return;
        try {
            const newStatus = !outlet.is_open;
            await api.put(`/outlets/${outlet.id}?ownerId=${user?.id}`, { is_open: newStatus });
            setOutlet({ ...outlet, is_open: newStatus });
            showToast(`Shop is now ${newStatus ? 'OPEN' : 'CLOSED'}`, 'success');
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleQrScan = async (token: string) => {
        if (!token || scanLockRef.current) return;
        scanLockRef.current = true;
        setScannerLoading(true);
        try {
            setIsScanning(false);
            const res = await api.post('/orders/verify', { token });
            const orderId = res.data.orderId;
            const orderRes = await api.get(`/orders/${orderId}`);
            setVerificationOrder(orderRes.data);
            showToast('Order verified!', 'success');
        } catch (error: any) {
            console.error('Verification failed', error);
            const errorMsg = error.response?.data?.error || 'Invalid QR code.';
            showToast(errorMsg, 'error');
        } finally {
            setScannerLoading(false);
            scanLockRef.current = false;
        }
    };

    const handleMarkAsDelivered = async (orderId: number) => {
        setIsDelivering(true);
        try {
            await api.put(`/orders/${orderId}/status`, { status: 'COMPLETED' });
            showToast('Order completed!', 'success');
            setVerificationOrder(null);
            fetchDashboardData();
        } catch (error: any) {
            console.error("Handover failed:", error);
            showToast(error.response?.data?.error || 'Failed to complete order', 'error');
        } finally {
            setIsDelivering(false);
        }
    };

    useEffect(() => {
        let html5QrCode: Html5Qrcode | null = null;
        if (isScanning) {
            html5QrCode = new Html5Qrcode("reader");
            const config = {
                fps: 10,
                disableFlip: false,
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdge * 0.8);
                    return { width: qrboxSize, height: qrboxSize };
                }
            };

            const cameraIdOrConfig = { facingMode: "environment" };

            html5QrCode.start(
                cameraIdOrConfig,
                config,
                (decodedText) => {
                    handleQrScan(decodedText);
                },
                () => { }
            ).catch(err => {
                console.error("Failed to start scanner", err);
                showToast("Cannot open camera", "error");
                setIsScanning(false);
            });
        }
        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, [isScanning]);

    if (isLoading && !outlet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center border-4 border-brand-100 animate-spin">
                    <FiActivity className="w-8 h-8" />
                </div>
                <p className="text-[var(--text-muted)] font-medium text-sm">Loading...</p>
            </div>
        );
    }

    if (!outlet) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 card-modern text-center">
                <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <FiAlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No Shop Found</h2>
                <p className="text-slate-500 mb-8">Your account is not linked to any shop. Please contact the admin.</p>
                <button
                    onClick={logout}
                    className="btn-primary w-full"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    const isToday = (dateStr: any) => {
        if (!dateStr) return false;
        try {
            const date = new Date(dateStr);
            const today = new Date();
            return date.toDateString() === today.toDateString();
        } catch (e) {
            return false;
        }
    };

    const displayOrders = viewResetAt
        ? orders.filter(o => {
              const ts = new Date(o.createdAt || o.created_at || 0);
              return ts > viewResetAt;
          })
        : orders;

    const activeOrders = displayOrders.filter(o => {
        const status = o.status?.toUpperCase();
        return status !== 'COMPLETED' && status !== 'CANCELLED';
    });

    const calculateOrderRevenue = (o: Order) => {
        const amount = Number(o.totalAmount ?? o.total_amount ?? 0);
        return isNaN(amount) ? 0 : amount;
    };

    const todaysOrders = displayOrders.filter(o => isToday(o.createdAt || o.created_at));
    const todaysRevenue = todaysOrders
        .filter(o => (o.status?.toUpperCase() === 'COMPLETED' || o.payment_status?.toLowerCase() === 'paid') && o.status?.toUpperCase() !== 'CANCELLED')
        .reduce((sum, o) => sum + calculateOrderRevenue(o), 0);

    const lifetimeRevenue = displayOrders
        .filter(o => (o.status?.toUpperCase() === 'COMPLETED' || o.payment_status?.toLowerCase() === 'paid') && o.status?.toUpperCase() !== 'CANCELLED')
        .reduce((sum, o) => sum + calculateOrderRevenue(o), 0);

    const completedTodayCount = todaysOrders.filter(o => o.status?.toUpperCase() === 'COMPLETED').length;

    const dailyMap = new Map<string, number>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }), 0);
    }
    displayOrders.filter(o => o.status?.toUpperCase() !== 'CANCELLED').forEach(o => {
        const rev = calculateOrderRevenue(o);
        const day = new Date(o.createdAt || o.created_at || '').toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) || 0) + rev);
    });
    const dailyData = Array.from(dailyMap, ([day, revenue]) => ({ day, revenue }));

    const itemMap = new Map<string, number>();
    displayOrders.filter(o => o.status?.toUpperCase() !== 'CANCELLED').forEach(o => o.items?.forEach(i => {
        const itemName = i.menuItem?.name || 'Unknown';
        itemMap.set(itemName, (itemMap.get(itemName) || 0) + i.quantity);
    }));
    const topItems = Array.from(itemMap, ([name, count]) => ({
        name: name?.length > 12 ? name.slice(0, 12) + '…' : (name || 'Item'),
        count
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    const statusMap = new Map<string, number>();
    displayOrders.forEach(o => {
        const s = o.status?.toUpperCase() || 'UNKNOWN';
        statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    const statusData = Array.from(statusMap, ([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

    const COLORS = {
        COMPLETED: '#10b981',
        READY: '#0070ff',
        PREPARING: '#f59e0b',
        PENDING: '#64748b',
        CANCELLED: '#ef4444'
    };

    return (
        <div className="animate-none pb-40 pt-12 md:pt-16">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 border-b border-slate-200 dark:border-slate-800 pb-10 gap-8">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <span className="px-4 py-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center">
                            <FiActivity className="mr-2 w-3.5 h-3.5" /> OVERVIEW
                        </span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">{outlet.location}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">{outlet.name}</h1>
                    <p className="text-base text-slate-500 max-w-lg leading-relaxed">Good to see you again. Here's a snapshot of how things are moving today.</p>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-5 lg:gap-x-4 lg:gap-y-5 w-full lg:w-auto">
                    <Link
                        to="/owner/kitchen"
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-slate-950 dark:bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                    >
                        <FiMonitor className="mr-2 w-4 h-4" /> Kitchen View
                    </Link>
                    <Link
                        to={`/owner/menu/${outlet.id}`}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold   transition-all shadow-sm"
                    >
                        <FiMenu className="mr-2 w-4 h-4" /> Menu
                    </Link>
                    <Link
                        to={`/owner/analytics/${outlet.id}`}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/10 rounded-xl text-xs font-semibold  dark: transition-all shadow-sm"
                    >
                        <FiBarChart2 className="mr-2 w-4 h-4" /> Insights
                    </Link>
                    <Link
                        to="/owner/orders/history"
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-500/10 rounded-xl text-xs font-semibold  dark: transition-all shadow-sm"
                    >
                        <FiClock className="mr-2 w-4 h-4" /> History
                    </Link>
                    <button
                        onClick={toggleStatus}
                        className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs font-semibold transition-all duration-150 shadow-md border ${outlet.is_open
                            ? 'bg-emerald-500 border-emerald-400 text-white '
                            : 'bg-rose-500 border-rose-400 text-white '
                            }`}
                    >
                        {outlet.is_open ? 'Shop Open' : 'Shop Closed'}
                    </button>
                    <button
                        onClick={() => setIsScanning(true)}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-brand-500 border border-brand-400 text-white rounded-xl text-xs font-semibold  transition-all shadow-md"
                    >
                        <FiMaximize className="mr-2 w-4 h-4" /> Verify QR
                    </button>
                    <button
                        onClick={syncAllData}
                        disabled={isSyncing}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-slate-800 border border-slate-800 text-white rounded-xl text-xs font-semibold  dark: transition-all shadow-md"
                    >
                        <FiRefreshCw className={`mr-2 w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={() => setSoundEnabled(v => !v)}
                        title={soundEnabled ? 'Mute new order alerts' : 'Unmute new order alerts'}
                        className={`flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs font-semibold transition-all shadow-md border ${soundEnabled
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20 '
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 '
                            }`}
                    >
                        {soundEnabled ? <FiBell className="mr-2 w-4 h-4" /> : <FiBellOff className="mr-2 w-4 h-4" />}
                        {soundEnabled ? 'Alerts On' : 'Alerts Off'}
                    </button>
                    <button
                        onClick={() => setShowResetModal(true)}
                        disabled={isResetting}
                        title="Clear analytics and dashboard view data"
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-6 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiTrash2 className="mr-2 w-4 h-4" />
                        Reset Insights
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <div
                    onClick={() => document.getElementById('live-orders')?.scrollIntoView({ behavior: 'smooth' })}
                    className="card-modern relative overflow-hidden group border border-slate-200 dark:border-slate-800 rounded-2xl bg-[var(--bg-card)] p-8 cursor-pointer  transition-all ] shadow-sm"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 transition-all duration-150"></div>
                    <div className="mb-6 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center">
                        <FiClock className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Active Orders</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{activeOrders.length}</p>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">Live Now</span>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 border-dashed pt-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Status</span>
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeOrders.length > 5 ? 'text-red-500' : activeOrders.length > 2 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {activeOrders.length === 0 ? 'Quiet' : activeOrders.length > 5 ? 'Steady Rain' : 'Gentle Flow'}
                            </span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Queue Size</span>
                            <span className="text-base font-bold text-[var(--text-primary)]">
                                {activeOrders.reduce((sum, o) => sum + (o.items?.reduce((isum, i) => isum + i.quantity, 0) || 0), 0)} items
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card-modern relative overflow-hidden group border border-slate-200 dark:border-slate-800 rounded-2xl bg-[var(--bg-card)] p-8  transition-all shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16 transition-all duration-150"></div>
                    <div className="mb-6 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center">
                        <FiDollarSign className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Today's Sales</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-emerald-500">₹</span>
                        <p className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{todaysRevenue.toLocaleString()}</p>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-400 font-medium">Tracking since midnight</p>
                </div>

                <div className="card-modern relative overflow-hidden group border border-slate-200 dark:border-slate-800 rounded-2xl bg-[var(--bg-card)] p-8  transition-all shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16 transition-all duration-150"></div>
                    <div className="mb-6 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Output</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-indigo-500">₹</span>
                        <p className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{lifetimeRevenue.toLocaleString()}</p>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-400 font-medium">All-time revenue</p>
                </div>

                <div className="card-modern relative overflow-hidden group border border-slate-200 dark:border-slate-800 rounded-2xl bg-[var(--bg-card)] p-8  transition-all shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16 transition-all duration-150"></div>
                    <div className="mb-6 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center">
                        <FiCheck className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Completed Today</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{completedTodayCount}</p>
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md">Succesful</span>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-400 font-medium">Orders marked done</p>
                </div>
            </div>

            <div className="mb-10">
                <AnnouncementWidget compact />
            </div>

            <div id="live-orders" className="mb-16 rounded-2xl bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-none" style={{ animationDelay: '0.1s' }}>
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse mr-3 shadow-md shadow-brand-500/30"></span>
                            Live Order Board
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Orders currently being prepared by your team</p>
                    </div>
                    <span className="px-4 py-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-brand-100 dark:border-brand-500/20 hidden sm:inline-block">
                        {activeOrders.length} {activeOrders.length === 1 ? 'Order' : 'Orders'} active
                    </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeOrders.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-800">
                                <FiCheck className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">Queue is Empty</h4>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto">Great job! All orders have been cleared for now.</p>
                        </div>
                    ) : (
                        activeOrders.map(order => (
                            <div key={order.id} className="p-8  dark: transition-all flex flex-col md:flex-row gap-8 md:items-center group/order">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <span className="text-[11px] font-black text-brand-700 dark:text-brand-300 uppercase tracking-[0.1em] px-3.5 py-1.5 bg-brand-50 dark:bg-brand-500/10 border-2 border-brand-100 dark:border-brand-500/30 rounded-full shadow-sm shadow-brand-500/10">
                                            Order #{order.id}
                                        </span>
                                        <h4 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                            {order.user?.name || 'Guest Customer'}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-2 ${order.payment_status === 'paid'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                                                    : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/30 shadow-sm shadow-orange-500/10'
                                                }`}>
                                                {order.payment_status?.toUpperCase() === 'PAID' ? '✓ PAID' : 'PENDING'}
                                            </span>
                                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                <FiClock className="w-3.5 h-3.5" />
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {order.scheduledAt && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-lg flex items-center gap-1.5 animate-pulse-subtle">
                                                <FiClock className="w-3 h-3" />
                                                PICKUP: {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[var(--text-primary)] text-xl mb-4 font-semibold tracking-tight leading-relaxed">
                                        {order.items?.map((item: any, idx) => (
                                            <span key={item.id || idx} className="inline-flex items-center">
                                                <span className="text-brand-500 mr-1.5">{item.quantity}×</span> {item.menuItem?.name || 'Dish'}
                                                {idx < (order.items?.length || 0) - 1 ? <span className="mx-3 text-slate-200 dark:text-slate-800 text-lg">•</span> : ''}
                                            </span>
                                        ))}
                                    </div>
                                    {order.notes && (
                                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl flex items-start gap-2 max-w-lg">
                                            <FiMessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 italic line-clamp-2">
                                                “{order.notes}”
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                            Value: <span className="text-[var(--text-primary)] font-bold">₹{order.totalAmount}</span>
                                        </div>
                                        <div className="h-1 w-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                        <div className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${order.status?.toUpperCase() === 'PREPARING'
                                                ? 'bg-brand-500 text-white border-brand-500 animate-pulse-subtle shadow-lg shadow-brand-500/20'
                                                : 'bg-brand-50 dark:bg-brand-500/10 text-brand-500 border-brand-100 dark:border-brand-500/20'
                                            }`}>
                                            {order.status?.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {order.status?.toUpperCase() === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                                className="px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-semibold  dark: transition-all shadow-sm"
                                            >
                                                Accept Order
                                            </button>
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 rounded-xl text-xs font-semibold  dark: transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {order.status?.toUpperCase() === 'PREPARING' && (
                                        <>
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                                className="px-6 py-3 bg-brand-500 text-white rounded-xl text-xs font-semibold  transition-all shadow-sm"
                                            >
                                                Ready for Pickup
                                            </button>
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 rounded-xl text-xs font-semibold  dark: transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {order.status?.toUpperCase() === 'READY' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                            className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold  transition-all shadow-sm"
                                        >
                                            Mark Delivered
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const w = window.open('', '_blank', 'width=400,height=600');
                                            if (!w) return;
                                            const items = order.items?.map((i: any) =>
                                                `<tr><td style="padding:4px 8px">${i.quantity}×</td><td style="padding:4px 8px">${i.menuItem?.name || 'Item'}</td><td style="padding:4px 8px;text-align:right">₹${(i.price * i.quantity).toFixed(0)}</td></tr>`
                                            ).join('') || '';
                                            w.document.write(`<!DOCTYPE html><html><head><title>Order #${order.id}</title><style>body{font-family:monospace;padding:20px;max-width:320px;margin:auto}hr{border:1px dashed #999}table{width:100%}th{border-bottom:1px solid #ccc;text-align:left;padding:4px 8px}@media print{body{padding:0}}</style></head><body>
                                                <h2 style="text-align:center;margin:0">ORDER TICKET</h2>
                                                <p style="text-align:center;margin:4px 0;font-size:12px">${outlet?.name || 'CampusBite'}</p>
                                                <hr/>
                                                <p><b>Order #${order.id}</b> &nbsp; ${order.status}</p>
                                                <p>Customer: ${order.user?.name || 'Guest'}</p>
                                                <p>Time: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                ${order.notes ? `<hr/><p style="margin:8px 0;"><b>Notes:</b> ${order.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
                                                <hr/>
                                                <table><thead><tr><th>Qty</th><th>Item</th><th style="text-align:right">Price</th></tr></thead><tbody>${items}</tbody></table>
                                                <hr/>
                                                <p style="text-align:right;font-size:16px"><b>Total: ₹${order.totalAmount}</b></p>
                                                <script>window.onload=()=>window.print()<\/script>
                                            </body></html>`);
                                            w.document.close();
                                        }}
                                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500  rounded-xl transition-all"
                                        title="Print Order Ticket"
                                    >
                                        <FiPrinter className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-32 space-y-16 mb-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-slate-100 dark:border-slate-800 pb-8">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500 border border-brand-500/20">
                                <FiBarChart2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Business Metrics</h3>
                        </div>
                        <p className="text-sm font-medium text-slate-500 ml-16">Understand your growth through real-time data trends</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card-modern p-10 bg-[var(--bg-card)] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full -translate-y-24 translate-x-24 transition-all duration-150"></div>
                        <div className="flex justify-between items-start mb-12 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Revenue Trend</p>
                                <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Weekly Performance</h4>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">Past 7 Days</div>
                        </div>
                        <div className="h-[350px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0070ff" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#0070ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: 'white' }}
                                        itemStyle={{ color: '#0070ff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#0070ff"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card-modern p-10 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-48 h-48 bg-brand-500/10 rounded-full -translate-y-24 -translate-x-24 transition-all duration-150"></div>
                        <div className="flex justify-between items-start mb-12 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-1">Fan Favorites</p>
                                <h4 className="text-xl font-bold text-white tracking-tight">Top 5 Items</h4>
                            </div>
                        </div>
                        <div className="h-[350px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topItems} layout="vertical" margin={{ left: 30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                                        width={110}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                                        contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', fontSize: '11px', padding: '15px', color: 'black' }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#0070ff"
                                        radius={[0, 10, 10, 0]}
                                        barSize={30}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/10 to-indigo-600/10 rounded-[2.5rem] blur-xl opacity-50 group- transition duration-150"></div>
                    <div className="relative card-modern bg-[var(--bg-card)] p-12 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Order Distribution</p>
                                <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-10 leading-tight">Status Overview</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {statusData.map((s, i) => {
                                        const color = COLORS[s.name as keyof typeof COLORS] || '#64748b';
                                        return (
                                            <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-l-4 transition-all shadow-sm" style={{ borderLeftColor: color }}>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{s.name}</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{s.value}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase">{s.value === 1 ? 'Order' : 'Orders'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="h-[400px] relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={100}
                                            outerRadius={140}
                                            dataKey="value"
                                            stroke="none"
                                            paddingAngle={8}
                                            animationBegin={200}
                                            animationDuration={1500}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={index} fill={COLORS[entry.name as keyof typeof COLORS] || '#64748b'} className=" transition-opacity" />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Volume</p>
                                    <p className="text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-none">{displayOrders.length}</p>
                                    <p className="text-[9px] font-bold text-brand-500 mt-2 tracking-widest uppercase">Total Orders</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {verificationOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-none" onClick={() => setVerificationOrder(null)}></div>
                    <div className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-3xl shadow-2xl overflow-hidden animate-none border border-slate-200 dark:border-slate-800">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-10">
                                <div className="space-y-2">
                                    <span className="px-3 py-1 bg-brand-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center w-fit">
                                        <FiCheck className="mr-2 w-3.5 h-3.5" /> Order Verified
                                    </span>
                                    <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Order #{verificationOrder.id}</h3>
                                    <p className="text-sm font-medium text-slate-400">Reserved for {verificationOrder.user?.name}</p>
                                </div>
                                <button
                                    onClick={() => setVerificationOrder(null)}
                                    className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400  transition-all"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 mb-10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-6">Basket Content</p>
                                <ul className="space-y-6">
                                    {verificationOrder.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center">
                                            <div className="flex items-center space-x-4">
                                                <span className="w-10 h-10 bg-white dark:bg-slate-800 text-[var(--text-primary)] flex items-center justify-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">{item.quantity}×</span>
                                                <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">{item.menuItem?.name}</span>
                                            </div>
                                            <span className="font-semibold text-base text-slate-400">₹{(item.price * item.quantity).toFixed(0)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 border-dashed flex justify-between items-baseline">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Final Amount</span>
                                    <span className="text-4xl font-bold text-brand-500 tracking-tight">₹{verificationOrder.totalAmount.toFixed(0)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleMarkAsDelivered(verificationOrder.id)}
                                disabled={isDelivering}
                                className="w-full bg-slate-900 dark:bg-slate-800 text-white py-6 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg  dark: transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {isDelivering ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-5 h-5 mr-3" />
                                        Hand Over Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showResetModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                        onClick={() => !isResetting && setShowResetModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-rose-400 to-rose-600" />

                        <div className="p-8">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-6">
                                <FiTrash2 className="w-7 h-7 text-rose-500" />
                            </div>

                            <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
                                Reset Insights Data?
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-2">
                                This will clear all analytics, charts, and live dashboard data from your current view.
                            </p>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-8">
                                <FiCheck className="w-4 h-4 flex-shrink-0" />
                                Your menu and order history will remain completely untouched.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    disabled={isResetting}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetInsights}
                                    disabled={isResetting}
                                    className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                                >
                                    {isResetting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <FiTrash2 className="w-4 h-4" />
                                            Confirm Reset
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isScanning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-none"></div>
                    <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-none border border-white/10">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center px-8">
                            <h3 className="text-slate-900 dark:text-white font-bold uppercase tracking-wider text-xs flex items-center">
                                <FiMaximize className="mr-3 text-brand-500 w-5 h-5" /> QR Verification
                            </h3>
                            <button onClick={() => setIsScanning(false)} className="text-slate-400  transition-all p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-10">
                            <div className="relative aspect-square bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center shadow-inner group">
                                {scannerLoading && (
                                    <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center gap-6">
                                        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
                                        <p className="text-white font-bold uppercase tracking-widest text-[10px]">Processing...</p>
                                    </div>
                                )}
                                <div id="reader" className="w-full h-full rounded-xl overflow-hidden grayscale"></div>
                                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/10 group- transition-all"></div>
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-500/40 animate-[scan_3s_linear_infinite]"></div>
                            </div>
                            <div className="mt-8 text-center">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Center the QR code within the frame</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
