import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
 BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { FiArrowLeft, FiActivity, FiDollarSign, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';

interface AnalyticsData {
 summary: {
 totalRevenue: number;
 totalOrders: number;
 avgOrderValue: number;
 };
 revenueTrend: Array<{ date: string, revenue: number, orders: number }>;
 popularItems: Array<{ name: string, quantity: number, revenue: number }>;
 peakHours: Array<{ hour: string, orders: number }>;
}

const OwnerAnalytics = () => {
 const { outletId } = useParams<{ outletId: string }>();
 const [data, setData] = useState<AnalyticsData | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
 const fetchAnalytics = async () => {
 try {
 const res = await api.get(`/analytics/${outletId}`);
 setData(res.data);
 } catch (error) {
 console.error('Failed to fetch analytics', error);
 } finally {
 setIsLoading(false);
 }
 };
 fetchAnalytics();
 }, [outletId]);

 if (isLoading) {
 return (
 <div className="max-w-7xl mx-auto p-8 animate-pulse space-y-12 pt-20">
 <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] w-64"></div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
 <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
 <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
 <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[3rem]"></div>
 </div>
 <div className="h-[500px] bg-slate-100 dark:bg-slate-800 rounded-[3rem] w-full"></div>
 </div>
 );
 }

 if (!data) return <div className="p-20 text-center font-black text-4xl">No data available. Get your first order!</div>;

 return (
 <div className="max-w-7xl mx-auto pb-40 px-6 animate-none pt-10">
 {/* Header */}
 <div className="mb-16">
 <Link to="/owner/dashboard" className="inline-flex items-center space-x-3 group text-slate-500 hover:text-brand-500 transition-all font-semibold uppercase tracking-wider text-[11px] bg-slate-100 dark:bg-slate-800/50 px-5 py-3 rounded-xl border border-transparent hover:border-brand-500/20 mb-10 shadow-sm">
 <FiArrowLeft className="w-3.5 h-3.5 transition-" />
 <span>Back to Dashboard</span>
 </Link>

 <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center space-x-3">
 <span className="px-3.5 py-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center w-fit border border-brand-500/10">
 <FiActivity className="mr-2" /> INSIGHTS
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
 Business Performance
 </h1>
 <p className="text-base font-medium text-slate-500 max-w-md leading-relaxed">A detailed breakdown of your sales trends and customer preferences.</p>
 </div>
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
 <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden group shadow-sm">
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-6">
 <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-xl border border-emerald-500/20 transition-">
 <FiDollarSign className="w-6 h-6 stroke-[2]" />
 </div>
 </div>
 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
 <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">₹{data.summary.totalRevenue.toLocaleString()}</h3>
 </div>
 </div>

 <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 group shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-xl border border-blue-500/20 transition-">
 <FiShoppingBag className="w-6 h-6 stroke-[2]" />
 </div>
 </div>
 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Orders Received</p>
 <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{data.summary.totalOrders}</h3>
 </div>

 <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 group shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div className="w-12 h-12 bg-brand-500/10 text-brand-500 flex items-center justify-center rounded-xl border border-brand-500/20 transition-">
 <FiTrendingUp className="w-6 h-6 stroke-[2]" />
 </div>
 </div>
 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Average Order</p>
 <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">₹{data.summary.avgOrderValue.toFixed(0)}</h3>
 </div>
 </div>

 {/* Charts Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Revenue Trend */}
 <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 lg:col-span-2 shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -translate-y-32 translate-x-32 transition-all duration-150"></div>
 <div className="flex items-center justify-between mb-10 relative z-10">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Growth Tracking</p>
 <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Sales Over Time</h4>
 </div>
 <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
 <div className="w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(0,112,255,0.4)]"></div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Revenue</span>
 </div>
 </div>
 <div className="h-[400px] w-full relative z-10">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#0070FF" stopOpacity={0.2} />
 <stop offset="95%" stopColor="#0070FF" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border-color)" opacity={0.3} />
 <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="600" axisLine={false} tickLine={false} dy={10} />
 <YAxis stroke="#94a3b8" fontSize={10} fontWeight="600" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} dx={-10} />
 <Tooltip
 contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: 'white', fontSize: '11px' }}
 itemStyle={{ color: '#0070FF', fontWeight: '700' }}
 />
 <Area type="monotone" dataKey="revenue" stroke="#0070FF" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Popular Items */}
 <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
 <div className="flex items-center justify-between mb-10">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-1">Fan Favorites</p>
 <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Most Popular</h4>
 </div>
 </div>
 <div className="h-[350px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={data.popularItems} layout="vertical" margin={{ left: 10 }}>
 <XAxis type="number" hide />
 <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={11} fontWeight="600" axisLine={false} tickLine={false} width={100} />
 <Tooltip
 cursor={{ fill: 'rgba(0,112,255,0.02)', radius: 8 }}
 contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: 'white', fontSize: '11px' }}
 />
 <Bar dataKey="quantity" radius={[0, 8, 8, 0]} barSize={24} animationDuration={1500}>
 {data.popularItems.map((_, index) => (
 <Cell key={`cell-${index}`} fill={index === 0 ? '#0070FF' : '#64748b'} opacity={1 - (index * 0.12)} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Peak Hours */}
 <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
 <div className="flex items-center justify-between mb-10">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-1">Pace Tracking</p>
 <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Peak Hours</h4>
 </div>
 </div>
 <div className="h-[350px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={data.peakHours} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
 <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border-color)" opacity={0.3} />
 <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} fontWeight="600" axisLine={false} tickLine={false} dy={10} />
 <YAxis stroke="#94a3b8" fontSize={10} fontWeight="600" axisLine={false} tickLine={false} dx={-10} />
 <Tooltip
 contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: 'white', fontSize: '11px' }}
 />
 <Line type="monotone" dataKey="orders" stroke="#0070FF" strokeWidth={4} dot={{ r: 4, fill: '#0070FF', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7, strokeWidth: 0 }} animationDuration={1500} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 </div>
 );
};

export default OwnerAnalytics;
