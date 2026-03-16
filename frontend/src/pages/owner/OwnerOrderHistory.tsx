/* eslint-disable @typescript-eslint/no-explicit-any */
 
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiClock, FiSearch, FiChevronLeft, FiChevronRight, FiCheckCircle, FiInfo, FiRefreshCcw, FiDownload, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useToast } from '../../hooks/context/ToastContext';

interface OrderItem {
 itemName: string;
 quantity: number;
 price: number;
}

interface OrderHistoryItem {
 id: number;
 studentName: string;
 studentEmail: string;
 items: OrderItem[];
 totalAmount: number;
 status: string;
 paymentStatus: string;
 createdAt: string;
 deliveryTimestamp: string | null;
}

const OwnerOrderHistory = () => {
 const { showToast } = useToast();
 const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(0);
 const [totalPages, setTotalPages] = useState(0);

 // Filters
 const [studentName, setStudentName] = useState('');
 const [status, setStatus] = useState('');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');

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
 } catch (err: any) {
 const errorMsg = err.response?.data?.error || 'Failed to load receipt image.';
 showToast(errorMsg, 'error');
 } finally {
 setDownloadingReceiptId(null);
 }
 };

 const downloadImageReceipt = () => {
 if (!receiptUrl) return;
 const a = document.createElement('a');
 a.href = receiptUrl;
 a.download = `CampusBite_Receipt_${downloadingReceiptId || 'order'}.png`;
 a.click();
 };

 const fetchOrders = async () => {
 setLoading(true);
 try {
 let endpoint = '/owner/orders/history';
 const params: any = { page, size: 10 };

 if (studentName || status || startDate || endDate) {
 endpoint = '/owner/orders/history/filter';
 if (studentName) params.studentName = studentName;
 if (status) params.status = status;
 if (startDate) params.startDate = new Date(startDate).toISOString();
 if (endDate) params.endDate = new Date(endDate).toISOString();
 }

 const response = await api.get(endpoint, { params });
 setOrders(response.data.content);
 setTotalPages(response.data.totalPages);
 } catch (error: any) {
 console.error('Failed to fetch order history', error);
 const msg = error.response?.data?.error || error.message || 'Failed to load order history';
 showToast(msg, 'error');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchOrders();
 }, [page]);

 const handleFilter = (e: React.FormEvent) => {
 e.preventDefault();
 setPage(0);
 fetchOrders();
 };

 const resetFilters = () => {
 setStudentName('');
 setStatus('');
 setStartDate('');
 setEndDate('');
 setPage(0);
 };

 const getStatusColor = (status: string) => {
 switch (status.toUpperCase()) {
 case 'COMPLETED': case 'DELIVERED': return 'text-green-500 bg-green-500/5 border-green-500/20';
 case 'PENDING': return 'text-slate-400 bg-slate-400/5 border-slate-400/20';
 case 'PREPARING': return 'text-yellow-500 bg-yellow-500/5 border-yellow-500/20';
 case 'READY': return 'text-blue-500 bg-blue-500/5 border-blue-500/20';
 case 'CANCELLED': return 'text-red-500 bg-red-500/5 border-red-500/20';
 default: return 'text-slate-400 bg-slate-400/5 border-slate-400/20';
 }
 };

 return (
 <div className="animate-none pb-40 px-6 max-w-7xl mx-auto pt-10">
 {/* Header */}
 <div className="mb-16">
 <Link to="/owner/dashboard" className="inline-flex items-center space-x-3 group text-slate-500  transition-all font-semibold uppercase tracking-wider text-[11px] bg-slate-100 dark:bg-slate-800/50 px-5 py-3 rounded-xl border border-transparent  mb-10 shadow-sm">
 <FiChevronLeft className="w-3.5 h-3.5 transition-" />
 <span>Back to Dashboard</span>
 </Link>

 <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center space-x-3">
 <span className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center w-fit">
 <FiClock className="mr-2" /> RECORDS
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
 Order History
 </h1>
 <p className="text-base font-medium text-slate-500 max-w-md leading-relaxed">Browse through your shop's previous transactions and completed handovers.</p>
 </div>
 <div className="bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 p-8 rounded-2xl shadow-sm">
 <p className="text-[11px] font-bold uppercase tracking-wider mb-2 opacity-80">TOTAL VOLUME</p>
 <p className="text-4xl font-bold tracking-tight">{orders.length * (page + 1)}+ <span className="text-sm font-medium opacity-60">items delivered</span></p>
 </div>
 </div>
 </div>

 {/* Filter Section */}
 <div className="bg-[var(--bg-card)] rounded-3xl border border-slate-200 dark:border-slate-800 p-10 mb-10 shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full -translate-y-24 translate-x-24 transition-all duration-150"></div>
 <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end relative z-10">
 <div className="space-y-3">
 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Student Name</label>
 <div className="relative">
 <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
 <input
 type="text"
 value={studentName}
 onChange={(e) => setStudentName(e.target.value)}
 className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-brand-500 transition-all p-4 pl-12 rounded-xl font-semibold text-base tracking-tight"
 placeholder="Search records..."
 />
 </div>
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</label>
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value)}
 className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-brand-500 transition-all p-4 rounded-xl font-semibold text-base tracking-tight appearance-none cursor-pointer"
 >
 <option value="">Everything</option>
 <option value="PENDING">PENDING</option>
 <option value="PREPARING">PREPARING</option>
 <option value="READY">READY</option>
 <option value="COMPLETED">COMPLETED</option>
 <option value="CANCELLED">CANCELLED</option>
 </select>
 </div>
 <div className="space-y-3">
 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Time Period</label>
 <div className="grid grid-cols-2 gap-3">
 <input
 type="datetime-local"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-brand-500 transition-all p-3 rounded-lg font-semibold text-[10px]"
 />
 <input
 type="datetime-local"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-brand-500 transition-all p-3 rounded-lg font-semibold text-[10px]"
 />
 </div>
 </div>
 <div className="flex space-x-3">
 <button type="submit" className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-xl font-bold uppercase tracking-wider text-[11px]  dark: transition-all shadow-sm">
 Apply
 </button>
 <button type="button" onClick={resetFilters} className="w-14 bg-slate-100 dark:bg-slate-800 text-slate-400  transition-all rounded-xl flex items-center justify-center border border-transparent shadow-sm">
 <FiRefreshCcw className="w-5 h-5" />
 </button>
 </div>
 </form>
 </div>

 {/* Table Section */}
 <div className="bg-[var(--bg-card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
 <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
 <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
 <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Basket</th>
 <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
 <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timeline</th>
 <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
 <th className="p-8 text-right opacity-0">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
 {loading ? (
 <tr>
 <td colSpan={7} className="p-32 text-center">
 <div className="flex flex-col items-center justify-center space-y-6">
 <FiRefreshCcw className="w-12 h-12 text-brand-500 animate-spin" />
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fetching records...</p>
 </div>
 </td>
 </tr>
 ) : orders.length === 0 ? (
 <tr>
 <td colSpan={7} className="p-32 text-center">
 <div className="flex flex-col items-center justify-center space-y-6 opacity-40">
 <FiInfo className="w-16 h-16 text-slate-300" />
 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No matching orders found.</p>
 </div>
 </td>
 </tr>
 ) : (
 orders.map((order) => (
 <tr key={order.id} className="group  dark: transition-colors">
 <td className="p-8">
 <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">#{order.id}</span>
 </td>
 <td className="p-8">
 <div className="flex flex-col">
 <span className="text-base font-bold text-[var(--text-primary)] tracking-tight mb-0.5">{order.studentName}</span>
 <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{order.studentEmail}</span>
 </div>
 </td>
 <td className="p-8">
 <div className="flex flex-wrap gap-1.5 max-w-xs">
 {order.items.map((item, i) => (
 <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 rounded-lg border border-transparent group- dark:group- transition-colors">
 {item.quantity}× {item.itemName}
 </span>
 ))}
 </div>
 </td>
 <td className="p-8">
 <div className="flex flex-col">
 <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight mb-1">₹{order.totalAmount.toFixed(0)}</span>
 <span className={`text-[9px] font-bold uppercase tracking-widest ${order.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-orange-500'}`}>
 {order.paymentStatus}
 </span>
 </div>
 </td>
 <td className="p-8">
 <div className="flex flex-col space-y-2">
 <div className="flex items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
 <FiClock className="mr-2 w-3.5 h-3.5" />
 {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </div>
 {order.deliveryTimestamp && (
 <div className="flex items-center text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
 <FiCheckCircle className="mr-2 w-3.5 h-3.5" />
 Handed over {new Date(order.deliveryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </div>
 )}
 </div>
 </td>
 <td className="p-8">
 <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-wider border rounded-lg ${getStatusColor(order.status)}`}>
 {order.status}
 </span>
 </td>
 <td className="p-8 text-right">
 <button
 onClick={() => handleViewReceipt(order.id)}
 disabled={downloadingReceiptId === order.id}
 className="w-12 h-12 bg-slate-900 border border-slate-800 text-white flex items-center justify-center rounded-xl  transition-all shadow-sm opacity-0 group-"
 title="View Receipt"
 >
 <FiDownload className="w-5 h-5 stroke-[2]" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
 Page {page + 1} of {totalPages || 1}
 </p>
 <div className="flex space-x-3">
 <button
 onClick={() => setPage(p => Math.max(0, p - 1))}
 disabled={page === 0 || loading}
 className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400   disabled:opacity-30 transition-all rounded-xl flex items-center justify-center shadow-sm"
 >
 <FiChevronLeft className="w-6 h-6 stroke-[2]" />
 </button>
 <button
 onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
 disabled={page >= totalPages - 1 || loading}
 className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400   disabled:opacity-30 transition-all rounded-xl flex items-center justify-center shadow-sm"
 >
 <FiChevronRight className="w-6 h-6 stroke-[2]" />
 </button>
 </div>
 </div>
 </div>

 {showReceiptModal && (
 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-none" onClick={() => setShowReceiptModal(false)}>
 <div className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-3xl shadow-2xl flex flex-col items-center p-12 overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
 <button
 onClick={() => setShowReceiptModal(false)}
 className="absolute top-6 right-6 w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center rounded-xl  transition-all"
 >
 <FiX className="w-6 h-6 stroke-[2]" />
 </button>
 <div className="text-center mb-10">
 <span className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">Verification</span>
 <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Order Receipt</h3>
 </div>
 <div className="w-full aspect-[3/4] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
 {receiptUrl ? <img loading="lazy" decoding="async" src={receiptUrl} alt="Receipt" className="w-full h-full object-contain p-4" /> : <div className="text-[10px] font-bold animate-pulse text-slate-300 uppercase tracking-widest">Loading...</div>}
 </div>
 <div className="flex w-full gap-4 mt-10">
 <button
 onClick={downloadImageReceipt}
 className="flex-1 bg-brand-500 text-white py-5 rounded-2xl font-bold uppercase tracking-wider text-[11px] shadow-lg  transition-all"
 >
 <FiDownload className="mr-2 inline w-4.5 h-4.5" /> Download
 </button>
 <button
 onClick={() => setShowReceiptModal(false)}
 className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px] rounded-2xl  dark: transition-all"
 >
 Dismiss
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default OwnerOrderHistory;
