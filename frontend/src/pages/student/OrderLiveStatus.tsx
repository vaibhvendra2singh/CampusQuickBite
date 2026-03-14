/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiClock, FiCheckCircle, FiPackage, FiHome, FiCoffee, FiShoppingBag, FiBell } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../hooks/context/ToastContext';

interface OrderItem {
 id: number;
 menuItem: {
 id: number;
 name: string;
 };
 quantity: number;
 price: number;
}

interface Order {
 id: number;
 totalAmount: number;
 status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
 payment_status: string;
 items: OrderItem[];
 outlet: {
 name: string;
 };
}

const playNotificationSound = () => {
 try {
 const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
 const oscillator = audioCtx.createOscillator();
 const gainNode = audioCtx.createGain();
 oscillator.connect(gainNode);
 gainNode.connect(audioCtx.destination);
 oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
 oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
 oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
 gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
 gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
 oscillator.start(audioCtx.currentTime);
 oscillator.stop(audioCtx.currentTime + 0.5);
 } catch {
 console.log('Audio not available');
 }
};

const OrderLiveStatus = () => {
 const { orderId } = useParams<{ orderId: string }>();
 const { showToast } = useToast();
 const [order, setOrder] = useState<Order | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [qrToken, setQrToken] = useState<string | null>(null);
 const [showQR, setShowQR] = useState(false);
 const prevStatusRef = useRef<string | null>(null);

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
 showToast(statusLabels[newOrder.status.toUpperCase()] || `Status: ${newOrder.status}`, newOrder.status.toUpperCase() === 'CANCELLED' ? 'error' : 'success');

 if ('Notification' in window && Notification.permission === 'granted') {
 new Notification('CampusBite', {
 body: statusLabels[newOrder.status] || `Order #${orderId} status: ${newOrder.status}`,
 icon: '/favicon.ico',
 });
 }
 }
 prevStatusRef.current = newOrder.status;
 setOrder(newOrder);

 // Verify orderId is available for QR
 if (newOrder.status.toUpperCase() === 'READY' && !qrToken) {
 try {
 const tokenRes = await api.get(`/orders/${newOrder.id}/token`);
 setQrToken(tokenRes.data.token);
 } catch (err) {
 console.error("Failed to fetch secure QR token", err);
 }
 } else if (newOrder.status.toUpperCase() !== 'READY') {
 setQrToken(null);
 }
 } catch (error) {
 console.error("Failed to fetch order", error);
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
 <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
 <div className="w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
 <p className="text-[var(--text-muted)] font-medium text-sm">Loading order status...</p>
 </div>
 );
 }

 if (!order) return <div className="text-center text-red-500 font-semibold mt-32 text-lg bg-red-50 dark:bg-red-500/10 p-8 rounded-2xl border border-red-200 dark:border-red-500/20 max-w-md mx-auto">Order not found</div>;

 const steps = [
 { key: 'PENDING', label: 'Order Placed', icon: FiClock, desc: 'Waiting for restaurant' },
 { key: 'PREPARING', label: 'Preparing', icon: FiCoffee, desc: 'Cooking your food' },
 { key: 'READY', label: 'Ready for Pickup', icon: FiPackage, desc: 'Pick up at counter' },
 { key: 'COMPLETED', label: 'Delivered', icon: FiCheckCircle, desc: 'Order finished' },
 ];

 const statusMap: Record<string, number> = {
 'PENDING': 0,
 'PREPARING': 1,
 'READY': 2,
 'COMPLETED': 3
 };

 const currentStepIndex = statusMap[order.status.toUpperCase()] ?? 0;
 const qrData = qrToken || '';

 return (
 <div className="max-w-5xl mx-auto py-8 animate-none px-6 pb-24">
 <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
 <div className="p-6 md:p-10">
 <div className="flex flex-col lg:flex-row justify-between gap-12">
 {/* Tracker Section */}
 <div className="flex-1 space-y-8">
 <div className="pb-6 border-b border-[var(--border-color)]">
 <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">Order status</h2>
 <p className="text-sm text-[var(--text-muted)]">Tracking order at <span className="text-brand-500 font-semibold">{order.outlet.name}</span></p>
 </div>

 {order.status.toUpperCase() === 'CANCELLED' ? (
 <div className="p-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-center border border-red-200 dark:border-red-500/20 animate-none">
 <FiCheckCircle className="w-8 h-8 mx-auto mb-3" />
 <h3 className="text-lg font-bold mb-1">Order cancelled</h3>
 <p className="text-sm opacity-80">This order has been cancelled.</p>
 </div>
 ) : (
 <div className="relative max-w-sm">
 <div className="absolute left-[1.1rem] top-6 bottom-6 w-0.5 bg-[var(--border-color)] rounded-full overflow-hidden">
 <div
 className="w-full bg-brand-500 transition-all duration-150 ease-out"
 style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
 ></div>
 </div>

 <div className="space-y-8 relative z-10">
 {steps.map((step, index) => {
 const isPassed = currentStepIndex >= index;
 const isCurrent = currentStepIndex === index;
 const Icon = step.icon;

 return (
 <div key={index} className="flex items-start">
 <div className={`
 flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border-2 transition-all duration-150
 ${isPassed ? 'bg-brand-500 border-brand-500 text-white shadow-md' : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)]'}
 ${isCurrent ? 'ring-4 ring-brand-500/20' : ''}
 `}>
 <Icon className="h-4 w-4" />
 </div>
 <div className="ml-5 pt-0.5">
 <p className={`font-bold text-base leading-tight mb-0.5 transition-colors duration-150 ${isCurrent ? 'text-brand-500' : isPassed ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
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

 {/* Sidebar Section */}
 <div className="lg:w-72 space-y-5 pt-6 lg:pt-0">
 <div className="bg-[var(--text-primary)] text-[var(--bg-primary)] p-6 rounded-2xl">
 <div className="flex justify-between items-start mb-5">
 <div>
 <p className="text-xs opacity-60 mb-1">Order</p>
 <p className="text-2xl font-bold">#{order.id}</p>
 </div>
 {order.status.toUpperCase() === 'READY' && qrToken && (
 <button
 onClick={() => setShowQR(!showQR)}
 className={`px-3 py-1.5 font-semibold text-xs rounded-lg border transition-all ${showQR ? 'bg-brand-500 text-white border-brand-500' : 'bg-transparent text-[var(--bg-primary)] border-white/20 hover:border-brand-500'}`}
 >
 {showQR ? 'Hide QR' : 'Show QR'}
 </button>
 )}
 </div>

 {showQR && (
 <div className="mb-5 animate-none flex flex-col items-center w-full">
 <div className="bg-white p-4 rounded-2xl shadow-xl inline-block relative overflow-hidden group">
 <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <QRCodeSVG
 value={qrData}
 size={220}
 bgColor="#ffffff"
 fgColor="#000000"
 level="H" // Higher error correction for blurry cameras
 includeMargin={true}
 />
 <div className="absolute top-2 right-2 bg-brand-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded tracking-tighter uppercase">Secure Token</div>
 </div>
 <p className="text-[10px] opacity-50 mt-3 text-center font-medium">Auto-refreshes for security</p>
 </div>
 )}

 <div className="space-y-2.5 pt-4 border-t border-white/10">
 <div className="flex items-center text-xs opacity-60">
 <FiBell className="mr-2 text-brand-500 w-3.5 h-3.5" /> Notifications on
 </div>
 <div className="flex items-center text-xs opacity-60">
 <FiClock className="mr-2 text-brand-500 w-3.5 h-3.5" /> Live updates
 </div>
 </div>
 </div>

 <div className="bg-[var(--bg-input)] rounded-2xl p-5 border border-[var(--border-color)]">
 <div className="flex items-center mb-4 text-[var(--text-muted)]">
 <FiShoppingBag className="mr-2 w-4 h-4" />
 <h4 className="font-semibold text-sm">Order summary</h4>
 </div>
 <ul className="space-y-3 mb-5">
 {order.items.map(item => (
 <li key={item.id} className="flex justify-between items-center text-sm">
 <div className="flex items-center gap-2.5">
 <span className="w-6 h-6 bg-[var(--bg-card)] text-[var(--text-primary)] flex items-center justify-center font-semibold text-xs rounded-md border border-[var(--border-color)]">{item.quantity}x</span>
 <span className="font-medium text-[var(--text-primary)]">{item.menuItem.name}</span>
 </div>
 <span className="text-[var(--text-muted)] font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
 </li>
 ))}
 </ul>
 <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-end">
 <span className="text-xs text-[var(--text-muted)]">Total</span>
 <span className="text-2xl font-bold text-[var(--text-primary)]">₹{order.totalAmount.toFixed(0)}</span>
 </div>
 </div>

 <div className="text-center pt-2">
 <Link to="/" className="group inline-flex items-center text-[var(--text-muted)] hover:text-brand-500 transition-all font-medium text-sm">
 <FiHome className="mr-2 transition-" />
 Back to outlets
 </Link>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default OrderLiveStatus;

