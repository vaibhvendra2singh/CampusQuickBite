/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../hooks/context/CartContext';
import { useAuth } from '../../hooks/context/AuthContext';
import { FiArrowLeft, FiClock, FiMessageSquare, FiPlus, FiMinus, FiShoppingBag, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { useToast } from '../../hooks/context/ToastContext';
import { FadeIn } from '../../components/animations/FadeIn';

const CAMPUS_TIMESLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM',
];

const Cart = () => {
    const { items, outletId, updateItemQuantity, clearCart, cartTotal, removeFromCart } = useCart();
    const { user, updateUser } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [orderNotes, setOrderNotes] = useState('');

    useEffect(() => {
        if (user?.id) {
            api.get(`/users/${user.id}`)
                .then(res => {
                    const isUserFrozen = res.data.isFrozen || res.data.is_frozen || false;
                    if (isUserFrozen !== user.isFrozen) {
                        updateUser({ ...user, isFrozen: isUserFrozen });
                    }
                })
                .catch(err => console.error('Status check failed', err));
        }
    }, [user?.id]);

    const parseTimeTo24h = (time12h: string) => {
        const [time, modifier] = time12h.split(' ');
        const [hoursStr, minutesStr] = time.split(':');
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const now = new Date();
        now.setHours(hours, minutes, 0, 0);
        return now.toISOString();
    };

    const handleCheckout = async () => {
        if (!outletId || items.length === 0) return;
        if (isScheduled && !selectedTime) {
            setError('Please pick a time so we know when to expect you.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const orderPayload: Record<string, unknown> = {
                outletId,
                items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                notes: orderNotes
            };
            if (isScheduled && selectedTime) {
                orderPayload.scheduledTime = parseTimeTo24h(selectedTime);
            }

            const orderRes = await api.post('/orders', orderPayload);
            const order = orderRes.data;

            const paymentPayload = {
                orderId: order.id,
                transactionId: `TXN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                amount: order.total_amount,
                paymentMethod: 'ONLINE'
            };
            await api.post('/payments', paymentPayload);

            clearCart();
            showToast('Order sent through! Get ready for your meal.', 'success');
            navigate(`/orders/${order.id}/status`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error;
            if (errorMsg === 'ACCOUNT_FROZEN') {
                setError('Your account is currently restricted from placing new orders. Please contact an administrator.');
                if (user) updateUser({ ...user, isFrozen: true });
            } else {
                setError(errorMsg || 'Something went wrong on our end. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0) {
        return (
            <FadeIn>
            <div className="human-container section-spacing">
                <div className="max-w-2xl mx-auto align-middle text-center mt-12 mb-20 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-2xl py-16 px-8 flex flex-col items-center rounded-3xl">
                    <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                        <FiShoppingBag className="w-10 h-10 text-brand-500" />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-[var(--text-primary)] mb-4">Your Cart is Empty</h2>
                    <p className="text-[var(--text-muted)] text-lg mb-8 max-w-md mx-auto">
                        Looks like you haven't added anything to your cart yet. Discover your next favorite meal!
                    </p>
                    <button onClick={() => navigate('/restaurants')} className="btn-primary px-8 py-3 text-lg shadow-xl shadow-brand-500/20  transition-all">
                        Browse Restaurants
                    </button>
                </div>
            </div>
            </FadeIn>
        );
    }

    return (
        <FadeIn delay={0.1}>
        <div className="human-container section-spacing relative z-10 py-10 mt-6 lg:mt-10">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/restaurants')}
                    className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]   transition-all shadow-sm"
                >
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-4xl lg:text-5xl font-heading font-black tracking-tighter text-[var(--text-primary)] mb-1">Your Cart</h1>
                    <p className="text-lg font-medium text-[var(--text-secondary)]">{items.length} item(s) hovering in orbit</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl flex gap-3 items-center bg-red-50 text-red-700 border border-red-200 shadow-sm animate-fade-in">
                    <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            )}

            {user?.isFrozen && (
                <div className="mb-6 p-4 rounded-xl flex gap-3 items-center bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-fade-in">
                    <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-semibold">
                        Your account is currently paused. You can browse, but new orders are restricted for now.
                    </p>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                <div className="flex-1 w-full space-y-6">
                    <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-0 border border-[var(--glass-border)] shadow-2xl">
                        <div className="flex flex-col divide-y divide-[var(--glass-border)]">
                            {items.map((item) => (
                                <div key={item.menuItemId} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4  dark: transition-colors">
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-[var(--text-primary)] mb-1">{item.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)] font-medium">₹{item.price.toFixed(2)} each</p>
                                    </div>
                                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                                        <div className="flex items-center border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] shadow-xs">
                                            <button
                                                onClick={() => {
                                                    if (item.quantity === 1) {
                                                        removeFromCart(item.menuItemId);
                                                    } else {
                                                        updateItemQuantity(item.id!, 'decrease');
                                                    }
                                                }}
                                                className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)]   transition-colors rounded-l-xl"
                                            >
                                                {item.quantity === 1 ? <FiTrash2 className="w-4 h-4" /> : <FiMinus className="w-4 h-4" />}
                                            </button>
                                            <span className="w-10 text-center font-mono-bold text-[var(--text-primary)]">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateItemQuantity(item.id!, 'increase')}
                                                className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)]   transition-colors rounded-r-xl"
                                            >
                                                <FiPlus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-right w-20">
                                            <p className="font-bold text-lg text-[var(--text-primary)]">₹{(item.price * item.quantity).toFixed(0)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-white/20 dark:bg-slate-900/20 flex justify-between items-center border-t border-[var(--glass-border)] backdrop-blur-md">
                            <span className="text-sm font-semibold text-[var(--text-muted)]">Room for dessert?</span>
                            <Link to={`/outlets/${outletId}/menu`} className="text-sm font-bold text-brand-500 flex items-center gap-1  transition-colors">
                                <FiPlus className="w-4 h-4" /> Add more items
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-3xl p-6 border border-[var(--glass-border)] shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                                    <FiClock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)]">Schedule Order</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Pick up your order later</p>
                                </div>
                                <div className="ml-auto">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={isScheduled} onChange={() => setIsScheduled(!isScheduled)} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                    </label>
                                </div>
                            </div>
                            {isScheduled && (
                                <div className="mt-4 pt-4 border-t border-[var(--border-color)] animate-fade-in">
                                    <select
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block p-3 outline-none"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                    >
                                        <option value="" disabled>Select a pickup time</option>
                                        {CAMPUS_TIMESLOTS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-3xl p-6 border border-[var(--glass-border)] shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
                                    <FiMessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)]">Any instructions?</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Add a note for the kitchen</p>
                                </div>
                            </div>
                            <textarea
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder="E.g., Extra spicy, no onions..."
                                rows={2}
                                className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm focus:border-sky-500 outline-none transition-colors resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[400px] flex-shrink-0">
                    <div className="bg-[var(--glass-bg)] backdrop-blur-2xl rounded-[2.5rem] border border-[var(--glass-border)] shadow-2xl sticky top-28 p-8">
                        <h3 className="text-2xl font-heading font-black tracking-tighter text-[var(--text-primary)] mb-6">Bill Details</h3>

                        <div className="space-y-4 mb-6 text-sm">
                            <div className="flex justify-between items-center text-[var(--text-secondary)]">
                                <span>Item Total</span>
                                <span className="font-semibold text-[var(--text-primary)]">₹{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[var(--text-secondary)]">
                                <span>Taxes & Handling</span>
                                <span className="font-semibold text-[var(--text-primary)]">₹0.00</span>
                            </div>
                        </div>

                        <div className="border-t border-[var(--border-color)] border-dashed pt-4 mb-8">
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-[var(--text-primary)]">To Pay</span>
                                <span className="text-2xl font-black text-brand-600">₹{cartTotal.toFixed(0)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing || user?.isFrozen}
                            className={`w-full py-4 rounded-xl font-bold text-base shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center ${user?.isFrozen || isProcessing
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-none shadow-none'
                                : 'btn-primary'
                                }`}
                        >
                            {user?.isFrozen ? (
                                'Account Paused'
                            ) : isProcessing ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </span>
                            ) : (
                                'Proceed to Checkout'
                            )}
                        </button>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-[var(--text-muted)] px-4">
                                By placing your order, you agree to our <span className="underline cursor-pointer">Terms of Service</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </FadeIn>
    );
};

export default Cart;
