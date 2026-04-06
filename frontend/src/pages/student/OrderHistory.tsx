import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/context/AuthContext';
import { useToast } from '../../hooks/context/ToastContext';
import { FiArrowLeft, FiClock, FiCheckCircle, FiPackage, FiShoppingBag, FiCalendar, FiBox, FiDownload, FiStar, FiX } from 'react-icons/fi';
import RatingModal from '../../components/common/RatingModal';

interface OrderItem {
    id: number;
    menuItem: {
        id: number;
        name: string;
        price: number;
    };
    quantity: number;
}

interface Order {
    id: number;
    outlet: {
        id: number;
        name: string;
    };
    items: OrderItem[];
    totalAmount: number;
    status: string;
    paymentStatus?: string;
    createdAt: string;
    preparingAt?: string;
    deliveredAt?: string;
    readyAt?: string;
}

const TIMELINE_STEPS = [
    { key: 'PENDING', label: 'Order Placed', icon: '📝', description: 'Order received' },
    { key: 'PREPARING', label: 'Preparing', icon: '👨‍🍳', description: 'Restaurant is cooking' },
    { key: 'READY', label: 'Ready for Pickup', icon: '✅', description: 'Ready to be picked up' },
    { key: 'COMPLETED', label: 'Delivered', icon: '🎉', description: 'Order finished' },
];

const OrderHistory = () => {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | number | null>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ menuItemId?: number; menuItemName?: string; outletId?: number; outletName?: string } | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                if (user) {
                    const response = await api.get(`/orders/user/${user.id}`);
                    const sortedOrders = response.data.sort((a: Order, b: Order) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    setOrders(sortedOrders);
                }
            } catch (error: unknown) {
                console.error("Failed to fetch order history", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
        const intervalId = setInterval(fetchOrders, 15000);
        return () => clearInterval(intervalId);
    }, [user]);

    const TIMELINE_STEPS_LOWER = ['pending', 'preparing', 'ready', 'completed'];
    const getStatusIndex = (order: Order) => {
        const { status, preparingAt, readyAt, deliveredAt } = order;
        if (status?.toUpperCase() === 'CANCELLED') {
            if (deliveredAt) return 3;
            if (readyAt) return 2;
            if (preparingAt) return 1;
            return 0;
        }
        return TIMELINE_STEPS_LOWER.indexOf(status?.toLowerCase());
    };

    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);

    const handleViewReceipt = async (orderId: number) => {
        setDownloadingReceiptId(orderId);
        try {
            const res = await api.get(`/orders/${orderId}/receipt-image`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            setReceiptUrl(url);
            setShowReceiptModal(true);
        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to load receipt image.';
            showToast(errorMsg, 'error');
        } finally {
            setDownloadingReceiptId(null);
        }
    };

    const downloadImageReceipt = () => {
        if (!receiptUrl) return;
        const a = document.createElement('a');
        a.href = receiptUrl;
        a.download = `CampusBite_Receipt_${expandedOrder || 'order'}.png`;
        a.click();
    };

    const handleNightOwl = async () => {
        const hour = new Date().getHours();
        if (hour >= 1 && hour < 4 && user && !user.hasNightOwlBadge) {
            try {
                await api.post('/users/badge', { type: 'night_owl' });
                if (updateUser) updateUser({ ...user, hasNightOwlBadge: true });
                showToast('🌙 Night Owl Badge Unlocked! Late night hunger is real. (+20 XP)', 'success');
            } catch (err: unknown) {
                if ((err as any).response?.status === 409 && updateUser) {
                    updateUser({ ...user, hasNightOwlBadge: true });
                }
            }
        } else if (hour < 1 || hour >= 4) {
            showToast("The moon isn't quite right. Try again deep in the night (1 AM - 4 AM).", 'info');
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto py-24 space-y-8 animate-pulse px-6">
                <div className="h-4 bg-[var(--bg-input)] rounded-full w-32"></div>
                <div className="h-16 bg-[var(--bg-input)] rounded-3xl w-64"></div>
                {[1, 2].map(i => <div key={i} className="h-56 bg-[var(--bg-input)] rounded-[2.5rem] border-2 border-[var(--border-color)]"></div>)}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-none relative pb-40 px-6">
            <Link to="/restaurants" className="group inline-flex items-center text-[var(--text-muted)]  transition-all font-black text-sm uppercase tracking-widest mb-10">
                <FiArrowLeft className="mr-2 transition-all duration-150" />
                Back to explore
            </Link>

            <div className="mb-12">
                <h2 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-none mb-3">Order History</h2>
                <div className="flex items-center gap-3">
                    <div className="h-1 w-12 bg-brand-500 rounded-full"></div>
                    <p className="text-lg font-bold text-brand-500">Your journey of flavors, all in one place.</p>
                </div>
            </div>

            <div className="space-y-10">
                {orders.map((order) => {
                    const currentStepIdx = getStatusIndex(order);
                    const isCancelled = order.status?.toUpperCase() === 'CANCELLED';
                    const isExpanded = expandedOrder === order.id;
                    const isCompleted = order.status?.toUpperCase() === 'COMPLETED';

                    return (
                        <div key={order.id} className="bg-[var(--bg-card)] rounded-[2.5rem] border-2 border-[var(--border-color)] overflow-hidden  shadow-sm transition-all duration-150 group">
                            <div className="flex flex-col lg:flex-row divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[var(--border-color)]">
                                <div className="flex-1 p-8 space-y-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-500/10 transition-all duration-150">
                                                <FiShoppingBag className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{order.outlet.name}</h3>
                                                    {isCompleted && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem({ outletId: order.outlet.id, outletName: order.outlet.name });
                                                                setIsRatingModalOpen(true);
                                                            }}
                                                            className="flex items-center px-3 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 "
                                                        >
                                                            <FiStar className="mr-1.5 w-3 h-3 fill-current" /> Rate Kitchen
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-muted)] mt-1">
                                                    <FiCalendar className="text-brand-500 w-4 h-4" />
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    <span className="opacity-30">•</span>
                                                    <FiClock className="text-brand-500 w-4 h-4" />
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--bg-input)] px-5 py-2.5 rounded-2xl border-2 border-[var(--border-color)] text-center min-w-[120px]">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Receipt ID</p>
                                            <p className="text-sm font-black text-[var(--text-primary)] tracking-tight">#{order.id}</p>
                                        </div>
                                    </div>

                                    {order.status.toUpperCase() === 'CANCELLED' ? (
                                        <div className="px-6 py-4 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-4 border-2 border-red-100 dark:border-red-500/10">
                                            <FiX className="w-6 h-6 flex-shrink-0" />
                                            <div>
                                                <p className="font-black text-lg tracking-tight leading-none mb-1">Order cancelled</p>
                                                {(order.paymentStatus || (order as { payment_status?: string }).payment_status)?.toUpperCase() === 'PAID' && (
                                                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest text-brand-500">Refund on its way.</p>
                                                )}
                                                {(order.paymentStatus || (order as { payment_status?: string }).payment_status)?.toUpperCase() === 'REFUNDED' && (
                                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                                                        <FiCheckCircle className="w-3.5 h-3.5" /> Refunded to Wallet
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : order.status?.toUpperCase() === 'READY' && (
                                        <div className="px-6 py-4 bg-green-50 dark:bg-green-500/5 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-4 border-2 border-green-100 dark:border-green-500/10 shadow-lg shadow-green-500/5">
                                            <FiCheckCircle className="w-6 h-6 flex-shrink-0" />
                                            <div>
                                                <p className="font-black text-lg tracking-tight leading-none mb-1">It's ready!</p>
                                                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Head over with order #{order.id}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 border-2 border-[var(--border-color)]">
                                        <ul className="space-y-4">
                                            {order.items.filter((item: OrderItem) => item.menuItem?.name).map((item: OrderItem, idx: number) => (
                                                <li key={idx} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <span className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-950 text-[var(--text-primary)] font-black text-sm rounded-xl border-2 border-[var(--border-color)] shadow-sm">{item.quantity}</span>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-[var(--text-primary)] text-lg tracking-tight">{item.menuItem.name}</span>
                                                            {isCompleted && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedItem({ menuItemId: item.menuItem.id, menuItemName: item.menuItem.name });
                                                                        setIsRatingModalOpen(true);
                                                                    }}
                                                                    className="mt-1 flex items-center w-fit px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400   transition-all rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20"
                                                                >
                                                                    <FiStar className="mr-1.5 w-3 h-3 fill-current" /> Rate item
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-xl text-[var(--text-primary)] tracking-tight">₹{(item.menuItem.price * item.quantity).toFixed(0)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <button
                                            onClick={() => handleViewReceipt(order.id)}
                                            disabled={downloadingReceiptId === order.id}
                                            className="px-6 py-3 bg-[var(--bg-card)] text-[var(--text-primary)] font-black text-xs uppercase tracking-widest rounded-xl border-2 border-[var(--border-color)]   transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <FiDownload className="w-4 h-4" /> {downloadingReceiptId === order.id ? 'Loading...' : 'View Receipt'}
                                        </button>
                                        <button
                                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                            className={`px-6 py-3 font-black text-xs uppercase tracking-widest rounded-xl border-2 transition-all flex items-center gap-2 ${isExpanded ? 'border-brand-500 text-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/5' : 'border-[var(--border-color)] text-[var(--text-muted)]  '}`}
                                        >
                                            {isExpanded ? 'Close Timeline' : 'View Timeline'}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-8 pt-8 border-t-2 border-[var(--border-color)] border-dashed animate-none">
                                            <div className="space-y-6">
                                                {(isCancelled ? [...TIMELINE_STEPS.slice(0, currentStepIdx + 1), { key: 'CANCELLED', label: 'Order Cancelled', icon: '❌', description: 'This order was cancelled' }] : TIMELINE_STEPS).map((step, idx, arr) => {
                                                    const isCancelledStep = step.key === 'CANCELLED';
                                                    const isActive = isCancelledStep ? true : idx <= currentStepIdx;
                                                    const isCurrent = isCancelledStep ? true : idx === currentStepIdx;
                                                    
                                                    return (
                                                        <div key={step.key} className="flex items-start group/step">
                                                            <div className="flex flex-col items-center mr-6">
                                                                <div className={`w-10 h-10 flex items-center justify-center text-xl rounded-2xl transition-all duration-150 border-2 ${isActive
                                                                    ? isCurrent ? (isCancelledStep ? 'bg-red-500 border-red-500 text-white' : 'bg-brand-500 border-brand-500 text-white shadow-xl shadow-brand-500/30 scale-110') : 'bg-brand-500/20 border-brand-500/40 text-brand-500'
                                                                    : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)]'
                                                                    }`}>
                                                                    <span>{step.icon}</span>
                                                                </div>
                                                                {idx < arr.length - 1 && (
                                                                    <div className={`w-1 h-10 mt-2 rounded-full transition-all duration-150 ${isActive ? (isCancelledStep ? 'bg-red-500' : 'bg-brand-500 shadow-sm shadow-brand-500/50') : 'bg-[var(--border-color)]'}`}></div>
                                                                )}
                                                            </div>
                                                            <div className="pt-1.5">
                                                                <div className="flex items-center gap-3">
                                                                    <p className={`font-black text-lg tracking-tight ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                                                                        {step.label}
                                                                    </p>
                                                                    {isCurrent && !isCancelledStep && (
                                                                        <span className="px-3 py-1 bg-brand-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-brand-500/20 animate-pulse">Live</span>
                                                                    )}
                                                                    {isCancelledStep && (
                                                                        <span className="px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20">Final</span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-sm font-bold mt-1 ${isCancelledStep ? 'text-red-500' : (isActive ? 'text-brand-500' : 'text-[var(--text-muted)]')}`}>{step.description}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="lg:w-72 p-8 bg-slate-50 dark:bg-slate-900/30 flex flex-col justify-between group- dark:group- transition-colors">
                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">Live Status</p>
                                            <div className={`text-center py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest border-2 shadow-sm ${isCancelled ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                : currentStepIdx >= 3 ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                                                    : 'bg-brand-500/10 border-brand-500/20 text-brand-500'
                                                }`}>
                                                {order.status}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Total Paid</p>
                                            <p className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">₹{order.totalAmount.toFixed(0)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-10">
                                        {!isCancelled && !isCompleted ? (
                                            <Link
                                                to={`/orders/${order.id}/status`}
                                                className="w-full flex items-center justify-center gap-3 py-4 bg-brand-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-500/20  transition-all"
                                            >
                                                <FiBox className="w-5 h-5" /> Track It
                                            </Link>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] py-3 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest italic bg-[var(--bg-card)]">
                                                <FiCheckCircle className="w-4 h-4" /> Good Times
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {orders.length === 0 && (
                    <div className="py-24 text-center bg-[var(--bg-card)] rounded-[3rem] border-2 border-[var(--border-color)] border-dashed">
                        <div 
                            onClick={handleNightOwl}
                            className="w-20 h-20 bg-brand-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 text-brand-500 rotate-12 group transition-all hover:scale-110 hover:rotate-0 cursor-pointer active:scale-95"
                        >
                            <FiPackage className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] mb-3 tracking-tight">Blank Page?</h3>
                        <p className="text-base font-medium text-[var(--text-muted)] mb-10 max-w-xs mx-auto">No orders found. Your stomach must be feeling a bit lonely!</p>
                        <Link to="/restaurants" className="bg-brand-500 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest  shadow-xl shadow-brand-500/20 inline-block">Explore Menus</Link>
                    </div>
                )}
            </div>

            {selectedItem && (
                <RatingModal
                    isOpen={isRatingModalOpen}
                    onClose={() => setIsRatingModalOpen(false)}
                    menuItemId={selectedItem.menuItemId}
                    menuItemName={selectedItem.menuItemName}
                    outletId={selectedItem.outletId}
                    outletName={selectedItem.outletName}
                />
            )}

            {showReceiptModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-none">
                    <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-[2.5rem] border-2 border-[var(--border-color)] shadow-2xl flex flex-col items-center p-8 space-y-6 border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setShowReceiptModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-[var(--bg-input)] border-2 border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]   transition-all"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Your Receipt</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1">Order Proof</p>
                        </div>
                        <div className="w-full aspect-[3/4] bg-white rounded-3xl border-2 border-[var(--border-color)] overflow-hidden shadow-inner">
                            {receiptUrl && <img loading="lazy" decoding="async" src={receiptUrl} alt="Receipt" className="w-full h-full object-contain" />}
                        </div>
                        <div className="flex w-full gap-4">
                            <button onClick={downloadImageReceipt} className="flex-1 bg-brand-500 text-white py-4 rounded-[1.25rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2  shadow-xl shadow-brand-500/10">
                                <FiDownload className="w-5 h-5" /> Download
                            </button>
                            <button onClick={() => setShowReceiptModal(false)} className="flex-1 bg-[var(--bg-input)] text-[var(--text-primary)] py-4 rounded-[1.25rem] font-black text-sm uppercase tracking-widest border-2 border-[var(--border-color)]  transition-all">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
