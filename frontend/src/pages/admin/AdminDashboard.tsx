/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
    FiPlus, FiMapPin, FiUser, FiSettings, FiX, FiShoppingBag, FiEdit3,
    FiPhone, FiMail, FiBarChart2, FiShield, FiRefreshCw, FiActivity,
    FiCheckCircle, FiDatabase, FiAlertCircle, FiArrowRight, FiDownload,
    FiHardDrive, FiUsers, FiBell, FiStar, FiZap, FiSearch, FiLock, FiUnlock,
    FiPause, FiTrendingUp, FiTrash2, FiChevronDown, FiChevronRight, FiExternalLink, FiUserX, FiAlertTriangle
} from 'react-icons/fi';

import { createPortal } from 'react-dom';
import { useToast } from '../../hooks/context/ToastContext';
import { useAuth } from '../../hooks/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import nukeSiren from '../../assets/sounds/nuke_siren.mp3';


interface Outlet {
    id: string;
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    is_open?: boolean;
    owner?: { id: string, name: string, email: string, phoneNumber?: string, profilePic?: string };
}

interface OutletStats {
    menuItems: number;
    totalOrders: number;
    totalRevenue: number;
    activeOrders: number;
}

const AdminDashboard = () => {
    const { showToast } = useToast();
    const { user: currentUser, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'outlets' | 'users' | 'orders' | 'announcements' | 'reviews'>('outlets');

    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [outletStats, setOutletStats] = useState<Record<string, OutletStats>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [users, setUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    const [globalOrders, setGlobalOrders] = useState<any[]>([]);
    const [orderHeatmap, setOrderHeatmap] = useState<any[]>([]);
    const [isOrdersLoading, setIsOrdersLoading] = useState(false);

    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', target_role: 'all' });

    const [reviews, setReviews] = useState<any[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);

    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [orderSearch, setOrderSearch] = useState('');
    const [resetAt, setResetAt] = useState<Date | null>(null);
    const [showAllTimeOrders, setShowAllTimeOrders] = useState(false);
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [orderOutletFilter, setOrderOutletFilter] = useState('all');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [selectedStudentForModal, setSelectedStudentForModal] = useState<any | null>(null);

    const [showResetXPModal, setShowResetXPModal] = useState(false);
    const [nukeStage, setNukeStage] = useState(0); // 0=hidden, 1=warning 1, 2=warning 2, 3=password
    const [nukePassword, setNukePassword] = useState('');
    const [isNukeLoading, setIsNukeLoading] = useState(false);
    const sirenRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(nukeSiren);
        audio.loop = true;
        audio.volume = 0.8;
        audio.preload = 'auto';
        sirenRef.current = audio;

        return () => {
             if (sirenRef.current) {
                sirenRef.current.pause();
                sirenRef.current = null;
             }
        };
    }, []);

    useEffect(() => {
        if (nukeStage === 0 || nukeStage === 3) {
            // Stop Siren when closed or when on password stage
            if (sirenRef.current) {
                sirenRef.current.pause();
                sirenRef.current.currentTime = 0;
            }
        }
    }, [nukeStage]);





    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [newLat, setNewLat] = useState('');
    const [newLng, setNewLng] = useState('');
    const [newOwnerName, setNewOwnerName] = useState('');
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [newOwnerPassword, setNewOwnerPassword] = useState('');

    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [isEditingOutlet, setIsEditingOutlet] = useState(false);
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editLat, setEditLat] = useState('');
    const [editLng, setEditLng] = useState('');

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const fetchUsers = async () => {
        setIsUsersLoading(true);
        try {
            const response = await api.get('/users');
            console.log('[AdminDashboard] Users API returned:', response.data?.length, 'users');
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error: any) {
            console.error("Failed to load users:", error.response?.data || error.message);
            showToast(`Failed to load users: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setIsUsersLoading(false);
        }
    };

    const exportUsersCSV = () => {
        if (users.length === 0) { showToast('No users to export', 'error'); return; }
        const headers = ['Name', 'Email', 'Role', 'Enrollment Number', 'Status', 'Joined'];
        const rows = users.map((u: any) => [
            u.name, u.email, u.role,
            u.enrollmentNumber || u.enrollment_number || '',
            u.isBanned ? 'BANNED' : u.isFrozen ? 'FROZEN' : 'ACTIVE',
            new Date(u.createdAt).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `campusbite_users_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        showToast(`Exported ${users.length} users to CSV`, 'success');
    };

    const bulkAction = async (action: 'freeze' | 'unfreeze' | 'ban' | 'unban') => {
        if (selectedUsers.size === 0) { showToast('Select at least one user', 'error'); return; }
        const field = (action === 'ban' || action === 'unban') ? 'is_banned' : 'is_frozen';
        const value = action === 'ban' || action === 'freeze';
        const safeIds = [...selectedUsers].filter((id: string) => {
            const u = users.find((u: any) => u.id === id);
            return u && u.role?.toLowerCase() !== 'admin';
        });
        if (safeIds.length === 0) { showToast('No non-admin users selected', 'error'); return; }
        try {
            await Promise.all(safeIds.map((id: string) => api.put(`/users/${id}/status`, { field, value })));
            showToast(`${action} applied to ${safeIds.length} user(s)`, 'success');
            setSelectedUsers(new Set());
            fetchUsers();
        } catch { showToast('Bulk action failed', 'error'); }
    };

    const fetchGlobalOrders = async () => {
        setIsOrdersLoading(true);
        try {
            const [ordersRes, statsRes, meRes] = await Promise.all([
                api.get('/orders'),
                api.get('/orders/admin/stats/heatmap'),
                currentUser?.id ? api.get(`/users/${currentUser.id}`) : Promise.resolve({ data: {} })
            ]);
            
            const resetTime = meRes.data?.adminInsightsResetAt ? new Date(meRes.data.adminInsightsResetAt) : null;
            setResetAt(resetTime);
            setGlobalOrders(ordersRes.data);
            setOrderHeatmap(statsRes.data);
        } catch (error) {
            console.error("Failed to load global orders", error);
        } finally {
            setIsOrdersLoading(false);
        }
    };

    const getVisibleOrders = () => {
        return globalOrders.filter(o => 
            showAllTimeOrders || !resetAt || new Date(o.createdAt || o.created_at || 0) > resetAt
        ).filter(o =>
            !orderSearch ||
            String(o.id).includes(orderSearch) ||
            o.outlets?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
            o.user?.enrollment_number?.toLowerCase().includes(orderSearch.toLowerCase())
        ).filter(o =>
            orderStatusFilter === 'all' || o.status?.toLowerCase() === orderStatusFilter
        ).filter(o =>
            orderOutletFilter === 'all' || String(o.outlets?.id) === orderOutletFilter || String(o.outlet_id) === orderOutletFilter
        );
    };

    const exportOrdersCSV = () => {
        const visibleOrders = getVisibleOrders();
        if (visibleOrders.length === 0) { showToast('No orders to export', 'error'); return; }
        const headers = ['Order ID', 'Date', 'Outlet', 'Student Name', 'Enrollment Number', 'Status', 'Total Amount', 'Items'];
        const rows = visibleOrders.map((o: any) => [
            `#${o.id}`,
            new Date(o.createdAt || o.created_at || Date.now()).toLocaleString(),
            o.outlets?.name || o.outlet?.name || '',
            o.user?.name || o.users?.name || '',
            o.user?.enrollment_number || '',
            o.status?.toUpperCase(),
            o.total_amount || o.totalAmount || 0,
            (o.items || o.order_items || []).map((i: any) => `${i.quantity}x ${i.menuItem?.name || i.menu_items?.name || i.item_name || 'Item'}`).join(' | ')
        ]);
        const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `campusbite_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        showToast(`Exported ${visibleOrders.length} orders to CSV`, 'success');
    };

    const handleResetAdminInsights = async () => {
        try {
            const response = await api.post('/users/admin/reset-insights');
            setResetAt(new Date(response.data.resetAt));
            showToast('Admin Dispatcher Insights reset successfully.', 'success');
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Failed to reset insights.';
            showToast(errorMsg, 'error');
        }
    };

    const handleResetAllXP = () => setShowResetXPModal(true);
    const executeResetXP = async () => {
        try {
            await api.post('/users/admin/reset-xp');
            showToast('All Student XP has been successfully reset to zero.', 'success');
        } catch (err: any) {
            const errorMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Failed to reset student XP';
            showToast(errorMsg, 'error');
        } finally {
            setShowResetXPModal(false);
        }
    };

    const handleNukeDatabase = () => {
        setNukeStage(1);
        if (sirenRef.current) {
            sirenRef.current.currentTime = 0;
            sirenRef.current.play().catch(e => {
                console.warn('[NUKE_SOUND] UI Click play failed:', e);
                // Last ditch: recover on next click
                const retry = () => { sirenRef.current?.play(); document.removeEventListener('click', retry); };
                document.addEventListener('click', retry);
            });
        }
    };



    const executeNukeDatabase = async () => {
        if (!nukePassword) {
            showToast('Administrator password required for manual override.', 'error');
            return;
        }
        setIsNukeLoading(true);

        // PLAY THE BOOM
        const explosion = new Audio('https://www.myinstants.com/media/sounds/nuclear-explosion.mp3');
        explosion.preload = 'auto';
        explosion.crossOrigin = 'anonymous';
        explosion.volume = 1.0;
        explosion.play().catch(() => {});




        try {
            await api.post('/users/admin/nuke-database', { password: nukePassword });

            showToast('DATABASE COMPLETELY WIPED.', 'success');
            setTimeout(() => window.location.reload(), 2000); // Reload entire system
        } catch (err: any) {
            const errorMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Wipe sequence aborted - Security handshake failed.';
            showToast(errorMsg, 'error');
            setNukeStage(0);
        } finally {
            setIsNukeLoading(false);
            setNukePassword('');
        }
    };



    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements');
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Failed to load announcements", error);
        }
    };

    const fetchReviews = async () => {
        setIsReviewsLoading(true);
        try {
            const response = await api.get('/ratings/admin/feed');
            setReviews(response.data);
        } catch (error) {
            console.error("Failed to load reviews", error);
        } finally {
            setIsReviewsLoading(false);
        }
    };

    const fetchOutlets = async () => {
        try {
            const response = await api.get('/outlets');
            const outletsData = Array.isArray(response.data) ? response.data : [];
            setOutlets(outletsData);
            
            const statsMap: Record<string, OutletStats> = {};
            
            // Parallelize stats fetching for all outlets to prevent dashboard hang
            await Promise.all(outletsData.map(async (outlet: Outlet) => {
                try {
                    const [menuRes, ordersRes] = await Promise.all([
                        api.get(`/menu/outlet/${outlet.id}`).catch(() => ({ data: [] })),
                        api.get(`/orders/outlet/${outlet.id}`).catch(() => ({ data: [] })),
                    ]);
                    
                    const allOrders = ordersRes.data || [];
                    const resetAt = (outlet as any).insights_reset_at ? new Date((outlet as any).insights_reset_at) : null;
                    
                    const orders = resetAt 
                        ? allOrders.filter((o: any) => new Date(o.createdAt || o.created_at || 0) > resetAt)
                        : allOrders;

                    statsMap[outlet.id] = {
                        menuItems: menuRes.data?.length || 0,
                        totalOrders: orders.length,
                        totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.totalAmount || o.total_amount || 0), 0),
                        activeOrders: orders.filter((o: any) => !['completed', 'cancelled'].includes(o.status)).length,
                    };
                } catch (err) {
                    console.error(`[AdminDashboard] Failed stats for outlet ${outlet.id}:`, err);
                    statsMap[outlet.id] = { menuItems: 0, totalOrders: 0, totalRevenue: 0, activeOrders: 0 };
                }
            }));
            
            setOutletStats(statsMap);
        } catch (error) {
            console.error("Failed to load outlets:", error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (activeTab === 'outlets') fetchOutlets();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'orders') fetchGlobalOrders();
        if (activeTab === 'announcements') fetchAnnouncements();
        if (activeTab === 'reviews') fetchReviews();

        // BUG-007 FIX: The interval only re-fetches the lightweight outlet list.
        // Full per-outlet stats (2×N sub-requests) are NOT re-triggered every 30s;
        // they are computed on tab switch or manual sync to prevent an N+1 DDoS pattern.
        const interval = setInterval(() => {
            if (activeTab === 'outlets') {
                api.get('/outlets')
                    .then(r => { if (Array.isArray(r.data)) setOutlets(r.data); })
                    .catch(() => {});
            }
            if (activeTab === 'orders') fetchGlobalOrders();
        }, 30000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const handleRefresh = async () => {
        setIsSyncing(true);
        try {
            if (activeTab === 'outlets') await fetchOutlets();
            if (activeTab === 'users') await fetchUsers();
            if (activeTab === 'orders') await fetchGlobalOrders();
            if (activeTab === 'announcements') await fetchAnnouncements();
            if (activeTab === 'reviews') await fetchReviews();
            showToast('System synchronization complete.', 'success');
        } catch (error) {
            showToast('Synchronization failed.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddOutlet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newLocation || !newLat || !newLng || !newOwnerName || !newOwnerEmail || !newOwnerPassword) {
            showToast('All Outlet and Owner details are required.', 'error');
            return;
        }
        try {
            await api.post('/outlets', {
                name: newName,
                location: newLocation,
                latitude: parseFloat(newLat),
                longitude: parseFloat(newLng),
                ownerName: newOwnerName,
                ownerEmail: newOwnerEmail,
                ownerPassword: newOwnerPassword
            });
            setNewName(''); setNewLocation(''); setNewLat(''); setNewLng('');
            setNewOwnerName(''); setNewOwnerEmail(''); setNewOwnerPassword('');
            setIsAdding(false);
            fetchOutlets();
            showToast('Outlet registered successfully.', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.error || "Failed to create outlet.", 'error');
        }
    };

    const openSettings = (outlet: Outlet) => {
        setSelectedOutlet(outlet);
        setEditName(outlet.name);
        setEditLocation(outlet.location);
        setEditLat(outlet.latitude?.toString() || '');
        setEditLng(outlet.longitude?.toString() || '');
        setIsEditingOutlet(false);
    };

    const handleSaveOutlet = async () => {
        if (!selectedOutlet) return;
        try {
            await api.put(`/outlets/${selectedOutlet.id}?ownerId=${selectedOutlet.owner?.id}`, {
                name: editName,
                location: editLocation,
                latitude: parseFloat(editLat),
                longitude: parseFloat(editLng),
            });
            showToast('Outlet configuration updated.', 'success');
            setSelectedOutlet(null);
            setIsEditingOutlet(false);
            fetchOutlets();
        } catch (error) {
            showToast('Critical: Settings update failed.', 'error');
        }
    };

    const handleDeleteOutlet = async () => {
        if (!selectedOutlet) return;
        if (!confirm(`DELETE OUTLET: Are you sure you want to delete"${selectedOutlet.name}"?`)) return;
        try {
            await api.delete(`/outlets/${selectedOutlet.id}`);
            showToast(`Outlet ${selectedOutlet.id} deleted successfully.`, 'success');
            setSelectedOutlet(null);
            fetchOutlets();
        } catch (error) {
            showToast('Failed to delete outlet. Please check active orders.', 'error');
        }
    };

    const handleToggleUserStatus = async (userId: string, type: 'is_banned' | 'is_frozen', value: boolean) => {
        try {
            await api.put(`/users/${userId}/status`, { [type]: value });
            showToast(`User status updated.`, 'success');
            fetchUsers();
        } catch (error) {
            showToast('Failed to update user status.', 'error');
        }
    };

    const handleUpdateUserRole = async (userId: string, role: string) => {
        try {
            await api.put(`/users/${userId}/role`, { role });
            showToast(`User role updated to ${role}.`, 'success');
            fetchUsers();
        } catch (error) {
            showToast('Failed to update user role.', 'error');
        }
    };

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/announcements', newAnnouncement);
            showToast('Announcement broadcasted!', 'success');
            setNewAnnouncement({ title: '', message: '', target_role: 'all' });
            fetchAnnouncements();
        } catch (err: any) {
            const errorMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Failed to post announcement.';
            showToast(errorMsg, 'error');
        }
    };

    const handleDeleteAnnouncement = async (id: number) => {
        try {
            await api.delete(`/announcements/${id}`);
            showToast('Announcement removed.', 'success');
            fetchAnnouncements();
        } catch (err: any) {
            const errorMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Failed to delete announcement.';
            showToast(errorMsg, 'error');
        }
    };

    const handleToggleReviewVisibility = async (id: number, isHidden: boolean) => {
        console.log(`Toggling visibility for review ${id} to ${isHidden}`);
        try {
            const res = await api.put(`/ratings/${id}/visibility`, { is_hidden: isHidden });
            console.log('Toggle visibility response:', res.data);
            showToast(isHidden ? 'Review hidden.' : 'Review visible.', 'success');
            fetchReviews();
        } catch (error: any) {
            console.error('Toggle visibility error:', error?.response?.data || error.message);
            showToast('Failed to toggle review visibility.', 'error');
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            showToast(`Order status updated to ${status}.`, 'success');
            fetchGlobalOrders();
        } catch (error) {
            showToast('Failed to update order status.', 'error');
        }
    };

    const totalRevenue = Object.values(outletStats).reduce((s, o) => s + o.totalRevenue, 0);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                if (isUsersLoading) return (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <FiActivity className="w-12 h-12 text-brand-500 animate-spin" />
                        <p className="text-sm font-bold text-slate-400">Fetching user directory...</p>
                    </div>
                );
                return (
                    <div className="space-y-8 animate-none">
                        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 mb-12">
                            <div className="relative flex-1 max-w-2xl group">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 group- transition-colors z-10 w-5 h-5 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search student directory by name or ID..."
                                    className="input-field pl-12 h-12 text-base md:text-sm shadow-sm  focus:shadow-lg transition-all"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                                {userSearch && (
                                    <button
                                        onClick={() => setUserSearch('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300  transition-colors"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center space-x-4 text-sm font-bold text-slate-700 dark:text-slate-200 bg-brand-50/80 dark:bg-brand-500/10 px-4 py-2.5 rounded-xl border border-brand-100 dark:border-brand-500/20 shadow-sm transition-all animate-none">
                                    <FiUsers className="text-brand-600 dark:text-brand-400 w-4 h-4" />
                                    <span>{users.length} Total Registered Users</span>
                                </div>
                                <button
                                    onClick={exportUsersCSV}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl  transition-all shadow-md group-"
                                >
                                    <FiDownload className="w-4 h-4" /> Export CSV
                                </button>
                                {selectedUsers.size > 0 && (
                                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                                        <span className="text-xs font-black text-amber-700">{selectedUsers.size} selected</span>
                                        <button onClick={() => bulkAction('freeze')} className="text-[10px] font-black px-2 py-1 bg-orange-500 text-white rounded-md">Freeze All</button>
                                        <button onClick={() => bulkAction('unfreeze')} className="text-[10px] font-black px-2 py-1 bg-blue-500 text-white rounded-md">Unfreeze All</button>
                                        <button onClick={() => bulkAction('ban')} className="text-[10px] font-black px-2 py-1 bg-red-500 text-white rounded-md">Ban All</button>
                                        <button onClick={() => bulkAction('unban')} className="text-[10px] font-black px-2 py-1 bg-green-500 text-white rounded-md">Unban All</button>
                                        <button onClick={() => setSelectedUsers(new Set())} className="text-[10px] text-slate-400 "><FiX className="w-3 h-3" /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card-modern overflow-hidden p-0 border border-[var(--border-color)]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                                        <tr>
                                            <th className="px-4 py-4">
                                        <input type="checkbox"
                                                    // BUG-003 FIX: Exclude both admin accounts AND the current
                                                    // logged-in user (self) from the selectable set, so the
                                                    // checked state and selectedUsers.size are always in sync.
                                                    checked={(() => {
                                                        const selectable = users.filter(
                                                            (u: any) => u.role !== 'admin' && u.id !== currentUser?.id
                                                        );
                                                        return selectable.length > 0 &&
                                                            selectedUsers.size === selectable.length &&
                                                            selectable.every((u: any) => selectedUsers.has(u.id));
                                                    })()}
                                                    onChange={e => {
                                                        const selectable = users.filter(
                                                            (u: any) => u.role !== 'admin' && u.id !== currentUser?.id
                                                        );
                                                        setSelectedUsers(
                                                            e.target.checked
                                                                ? new Set(selectable.map((u: any) => u.id))
                                                                : new Set()
                                                        );
                                                    }}
                                                    className="w-4 h-4 accent-brand-500"
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Enrollment ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {users.filter(u =>
                                            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                                            u.enrollmentNumber?.toLowerCase().includes(userSearch.toLowerCase()) ||
                                            u.enrollment_number?.toLowerCase().includes(userSearch.toLowerCase())
                                        ).map(user => {
                                            const isAdminAccount = user.role === 'admin';
                                            const isSelf = user.id === currentUser?.id;
                                            const isProtected = isAdminAccount || isSelf;
                                            return (
                                                <tr key={user.id} className={` transition-colors group ${selectedUsers.has(user.id) ? 'bg-brand-50/10' : ''} ${isProtected ? 'opacity-75' : ''}`}>
                                                    <td className="px-4 py-4">
                                                        <input type="checkbox"
                                                            checked={selectedUsers.has(user.id)}
                                                            disabled={isProtected}
                                                            onChange={e => {
                                                                if (isProtected) return;
                                                                const next = new Set(selectedUsers);
                                                                e.target.checked ? next.add(user.id) : next.delete(user.id);
                                                                setSelectedUsers(next);
                                                            }}
                                                            className={`w-4 h-4 accent-brand-500 ${isProtected ? 'cursor-not-allowed opacity-30' : ''}`}
                                                            title={isProtected ? 'Admin accounts cannot be modified' : ''}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isProtected ? 'bg-indigo-100 text-indigo-600' : 'bg-brand-100 text-brand-600'}`}>
                                                                {user.name[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-[var(--text-primary)]">{user.name}</p>
                                                                <p className="text-[10px] text-[var(--text-muted)] font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{user.enrollment_number || 'N/A'}</td>
                                                    <td className="px-6 py-4">
                                                        {isProtected ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <FiShield className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span className="text-sm font-bold text-indigo-600">
                                                                    {isSelf ? 'System Admin (You)' : 'System Admin'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                                                className="bg-transparent text-sm font-bold text-brand-600 outline-none cursor-pointer "
                                                            >
                                                                <option value="student">Student</option>
                                                                <option value="owner">Outlet Owner</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold">
                                                        {isProtected ? (
                                                            <span className="text-indigo-500 bg-indigo-50 px-2 py-1 rounded">PROTECTED</span>
                                                        ) : user.isBanned ? (
                                                            <span className="text-red-500 bg-red-50 px-2 py-1 rounded">BANNED</span>
                                                        ) : user.isFrozen ? (
                                                            <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded">FROZEN</span>
                                                        ) : (
                                                            <span className="text-green-500 bg-green-50 px-2 py-1 rounded">ACTIVE</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        {isProtected ? (
                                                            <div className="flex items-center justify-end">
                                                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                                                                    <FiShield className="w-3 h-3" /> Protected
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end space-x-2 transition-all">
                                                                {user.isBanned ? (
                                                                    <button
                                                                        onClick={() => handleToggleUserStatus(user.id, 'is_banned', false)}
                                                                        className="p-2 rounded-lg border bg-green-500 text-white border-green-500 shadow-sm transition-all "
                                                                        title="Unban User"
                                                                    >
                                                                        <FiUnlock className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleToggleUserStatus(user.id, 'is_banned', true)}
                                                                        className="p-2 rounded-lg border text-red-500 border-red-100  transition-all"
                                                                        title="Ban User"
                                                                    >
                                                                        <FiLock className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleToggleUserStatus(user.id, 'is_frozen', !user.isFrozen)}
                                                                    className={`p-2 rounded-lg border transition-all ${user.isFrozen ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'text-orange-500 border-orange-100 '}`}
                                                                    title={user.isFrozen ? 'Unfreeze User' : 'Freeze User'}
                                                                >
                                                                    <FiPause className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'orders':
                if (isOrdersLoading) return (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <FiRefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-sm font-bold text-slate-400">Loading campus-wide order data...</p>
                    </div>
                );
                return (
                    <div className="space-y-12 animate-none">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8">
                                <div className="card-modern p-8 h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-bold flex items-center">
                                            <FiZap className="mr-3 text-orange-500" /> Active Load Heatmap
                                        </h3>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-card)] px-2 py-1 rounded">Real-time</span>
                                    </div>
                                    <div className="space-y-6">
                                        {orderHeatmap.map(stat => (
                                            <div key={stat.outletId} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{stat.name}</span>
                                                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{stat.activeCount} Active Orders</span>
                                                </div>
                                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                                    <div style={{ width: `${(stat.pending / (stat.activeCount || 1)) * 100}%` }} className="bg-orange-400 h-full transition-all duration-1000"></div>
                                                    <div style={{ width: `${(stat.preparing / (stat.activeCount || 1)) * 100}%` }} className="bg-blue-500 h-full transition-all duration-1000 border-l border-white/20"></div>
                                                    <div style={{ width: `${(stat.ready / (stat.activeCount || 1)) * 100}%` }} className="bg-green-500 h-full transition-all duration-1000 border-l border-white/20"></div>
                                                </div>
                                                <div className="flex items-center space-x-6 pt-1">
                                                    <div className="flex items-center text-[10px] font-bold text-orange-500 uppercase tracking-tighter">
                                                        <span className="w-2 h-2 rounded-full bg-orange-400 mr-1.5"></span> {stat.pending} Pending
                                                    </div>
                                                    <div className="flex items-center text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span> {stat.preparing} Preparing
                                                    </div>
                                                    <div className="flex items-center text-[10px] font-bold text-green-500 uppercase tracking-tighter">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> {stat.ready} Ready
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="card-modern !bg-brand-500 text-white p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group- transition-transform duration-500"></div>
                                    <FiActivity className="w-10 h-10 mb-6 text-brand-100 relative z-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-100 mb-3 relative z-10 opacity-90">Campus-Wide Load</p>
                                    <h4 className="text-6xl font-black tracking-tighter mb-4 relative z-10">
                                        {orderHeatmap.reduce((s, h) => s + h.activeCount, 0)}
                                    </h4>
                                    <p className="text-sm font-bold text-white leading-relaxed relative z-10">
                                        Real-time dispatcher view shows active orders being processed across all campus nodes.
                                    </p>
                                </div>
                                <div className="card-modern bg-[var(--bg-card)] p-6 border border-[var(--border-color)] shadow-sm flex-1 overflow-hidden">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center">
                                        <FiUsers className="mr-2" /> Recent Community Members
                                    </h4>
                                    <div className="space-y-3">
                                        {users.slice(0, 5).map(u => (
                                            <div key={u.id} className="flex items-center justify-between group/user">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-[10px] border border-brand-100 group-hover/user:bg-brand-500 group-hover/user:text-white transition-all">
                                                        {u.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 leading-none mb-1">{u.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-medium">@{u.role}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-300 group-hover/user:text-slate-500 transition-colors">
                                                    {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-modern bg-[var(--bg-card)] p-6 border border-[var(--border-color)] shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-2">Service Health Status</h4>
                                    <p className="text-xs font-semibold text-green-600 flex items-center">
                                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-heartbeat"></span> ALL SYSTEMS NOMINAL
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <h3 className="text-xl font-bold flex items-center">
                                        <FiShoppingBag className="mr-3 text-brand-500" /> Dispatcher View
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                        <select 
                                            className="px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] cursor-pointer focus:outline-brand-500 font-medium"
                                            value={orderOutletFilter}
                                            onChange={e => setOrderOutletFilter(e.target.value)}
                                        >
                                            <option value="all">All Outlets</option>
                                            {outlets.map(out => <option key={out.id} value={out.id}>{out.name}</option>)}
                                        </select>

                                        <select 
                                            className="px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] cursor-pointer focus:outline-brand-500 font-medium capitalize"
                                            value={orderStatusFilter}
                                            onChange={e => setOrderStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="placed">Placed</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="ready">Ready</option>
                                            <option value="completed">Completed/Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        
                                        <button 
                                            onClick={exportOrdersCSV}
                                            className="ml-2 flex flex-shrink-0 items-center px-4 py-2 text-xs font-bold bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition border border-green-200"
                                        >
                                            <FiDownload className="mr-2" /> Export Ledger
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-color)]">
                                    <div className="flex rounded-lg overflow-hidden border border-brand-100 shadow-sm">
                                    <button 
                                        onClick={() => setShowAllTimeOrders(false)}
                                        className={`px-3 py-1.5 text-xs font-bold transition-colors ${!showAllTimeOrders ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Current View
                                    </button>
                                    <button 
                                        onClick={() => setShowAllTimeOrders(true)}
                                        className={`px-3 py-1.5 text-xs font-bold transition-colors ${showAllTimeOrders ? 'bg-brand-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        All-Time History
                                    </button>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (confirm('Are you sure you want to reset your Dispatcher View? This will hide all current orders from the summary view without permanently deleting any data.')) {
                                            handleResetAdminInsights();
                                        }
                                    }}
                                    className="ml-2 flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm"
                                    title="Reset Insights (Shift View)"
                                >
                                    <FiRefreshCw className="w-4 h-4" />
                                </button>
                                <div className="relative flex-1 max-w-sm ml-auto group">
                                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 w-4 h-4 transition-colors z-10" />
                                    <input
                                        type="text"
                                        placeholder="Order ID, Student, Enrollment or Outlet..."
                                        value={orderSearch}
                                        onChange={e => setOrderSearch(e.target.value)}
                                        className="input-field pl-10"
                                    />
                                    {orderSearch && (
                                        <button
                                            onClick={() => setOrderSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300  transition-colors"
                                        >
                                            <FiX className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-modern p-0 overflow-hidden border border-[var(--border-color)]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                        <thead className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Order ID</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Outlet</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Student</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Enroll No</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Amount</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {getVisibleOrders().map(order => (
                                                <React.Fragment key={order.id}>
                                                <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                    <td className="px-6 py-4 text-sm font-bold text-brand-600 cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                                                        <div className="flex items-center gap-2 hover:underline">
                                                            {expandedOrderId === order.id ? <FiChevronDown className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                                            #{order.id.toString().slice(-4)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">{order.outlets?.name}</td>
                                                    <td className="px-6 py-4">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedStudentForModal(order.user || order.users); }}
                                                            className="text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1.5"
                                                        >
                                                            {order.user?.name || 'Unknown'} 
                                                            <FiExternalLink className="w-3 h-3 opacity-50" />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-500 font-mono tracking-tight">{order.user?.enrollment_number || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-orange-100 text-orange-700 animate-pulse'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">₹{order.total_amount}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                                disabled={order.status === 'completed'}
                                                                className={`p-2 rounded-lg transition-colors border ${order.status === 'completed' ? 'text-slate-500 bg-[var(--bg-body)] border-[var(--border-color)] cursor-not-allowed' : 'text-green-500 border-green-100'}`}
                                                                title="Force Complete Override"
                                                            >
                                                                <FiCheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                                                disabled={order.status === 'cancelled'}
                                                                className={`p-2 rounded-lg transition-colors border ${order.status === 'cancelled' ? 'text-slate-500 bg-[var(--bg-body)] border-[var(--border-color)] cursor-not-allowed' : 'text-red-500 border-red-100'}`}
                                                                title="Force Cancel Override"
                                                            >
                                                                <FiX className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedOrderId === order.id && (
                                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-t border-[var(--border-color)]">
                                                        <td colSpan={7} className="px-8 py-4">
                                                            <div className="pl-4 border-l-2 border-brand-500 my-1">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Order Summary</p>
                                                                <ul className="space-y-1.5 text-sm font-medium text-[var(--text-primary)]">
                                                                    {(order.items || order.order_items || []).map((item: any) => (
                                                                        <li key={item.id} className="flex items-center text-xs">
                                                                            <span className="w-8 font-black text-slate-500">{item.quantity}x</span> 
                                                                            <span>{item.itemName || item.item_name || item.menuItem?.name || item.menu_items?.name || 'Unknown Item'}</span>
                                                                            <div className="ml-auto flex items-center gap-4">
                                                                                <span className="text-slate-400 font-mono">@ ₹{parseFloat(item.price || item.menuItems?.price || '0').toFixed(2)}</span>
                                                                                <span className="font-bold text-slate-700 w-16 text-right">₹{(parseFloat(item.price || item.menuItems?.price || '0') * item.quantity).toFixed(2)}</span>
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                {order.notes && (
                                                                    <div className="mt-3 bg-brand-50 text-brand-800 p-2.5 rounded text-xs">
                                                                        <span className="font-bold mr-2">Note:</span> {order.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 flex justify-between items-center border-t border-[var(--border-color)] text-sm">
                                    <div className="flex items-center gap-8">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Count</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 text-lg">{getVisibleOrders().length} Orders</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenue</span>
                                            <span className="font-bold text-green-600 text-lg">₹{getVisibleOrders().reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount || o.total_amount || 0)), 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400">Showing filtered results</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'announcements':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-none">
                        <div className="lg:col-span-5">
                            <div className="card-modern p-8 sticky top-24">
                                <div className="flex items-center space-x-3 mb-8">
                                    <FiBell className="w-8 h-8 text-brand-500 animate-bounce" />
                                    <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">New Broadcast</h3>
                                </div>
                                <form onSubmit={handlePostAnnouncement} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Broadcast Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newAnnouncement.title}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            className="input-field"
                                            placeholder="System Maintenance, Sale Info, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Announcement Message</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={newAnnouncement.message}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                            className="input-field resize-none py-4"
                                            placeholder="Details of the announcement..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Target Audience</label>
                                        <select
                                            value={newAnnouncement.target_role}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_role: e.target.value })}
                                            className="input-field cursor-pointer"
                                        >
                                            <option value="all">Everyone</option>
                                            <option value="student">Students Only</option>
                                            <option value="owner">Outlet Owners Only</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-primary w-full py-4 text-sm font-bold group">
                                        Deploy Update <FiZap className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="lg:col-span-7 space-y-6">
                            <h3 className="text-xl font-bold flex items-center mb-4">
                                <FiRefreshCw className="mr-3 text-brand-500" /> Active Broadcasts
                            </h3>
                            {announcements.length === 0 ? (
                                <div className="p-12 text-center card-modern border-dashed border-2 flex flex-col items-center justify-center space-y-4">
                                    <FiBell className="w-12 h-12 text-slate-200" />
                                    <p className="text-slate-500 font-medium">No active system-wide announcements.</p>
                                </div>
                            ) : (
                                announcements.map(anno => (
                                    <div key={anno.id} className="card-modern relative border-l-4 border-l-brand-500 p-6 flex justify-between items-start group">
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h4 className="font-bold text-lg text-[var(--text-primary)]">{anno.title}</h4>
                                                <span className="px-2 py-0.5 bg-slate-100 text-[var(--text-muted)] rounded text-[9px] font-black uppercase tracking-widest">Target: {anno.target_role}</span>
                                            </div>
                                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{anno.message}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-2 flex items-center">
                                                <FiActivity className="mr-1.5 w-3 h-3" /> Broadcasted on {new Date(anno.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this announcement?')) {
                                                    handleDeleteAnnouncement(anno.id);
                                                }
                                            }}
                                            className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Announcement"
                                        >
                                            <FiTrash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'reviews':
                if (isReviewsLoading) return (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <FiStar className="w-12 h-12 text-yellow-500 animate-spin" />
                        <p className="text-sm font-bold text-slate-400">Analyzing system reviews...</p>
                    </div>
                );
                return (
                    <div className="space-y-8 animate-none">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold flex items-center">
                                <FiStar className="mr-3 text-yellow-500" /> Review & Rating Audit
                            </h3>
                            <div className="text-sm font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] px-4 py-2 rounded-lg border border-[var(--border-color)]">
                                Total Reviews Analyzed: {reviews.length}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reviews.map(review => (
                                <div key={review.id} className={`card-modern transition-all duration-300 relative ${review.is_hidden ? 'opacity-50 grayscale bg-slate-50 border-dashed' : ''}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {review.user?.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">{review.user?.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-widest">{review.user?.enrollment_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center bg-yellow-50 text-yellow-600 px-2 py-1 rounded text-xs font-black">
                                            <FiStar className="mr-1 fill-current" /> {review.rating_value}
                                        </div>
                                    </div>

                                    <p className="text-sm font-medium text-[var(--text-primary)] italic bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] mb-6">
                                        "{review.comment || 'No comment provided'}"
                                    </p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                            <span>Outlet Target</span>
                                            <span className="text-[var(--text-primary)]">{review.outlet?.name || 'N/A'}</span>
                                        </div>
                                        {review.menu_item && (
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                                <span>Menu Item</span>
                                                <span className="text-[var(--text-primary)]">{review.menu_item.name}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-1">
                                            <span>Posted</span>
                                            <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleReviewVisibility(review.id, !review.is_hidden)}
                                        className={`w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${review.is_hidden
                                            ? 'bg-green-100 text-green-700 '
                                            : 'bg-red-50 text-red-600 '
                                            }`}
                                    >
                                        {review.is_hidden ? 'Restore Review' : 'Flag & Moderate'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'outlets':
            default:
                return (
                    <div className="animate-none">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                            <div className="card-modern relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -translate-y-16 translate-x-16 transition-all duration-150"></div>
                                <div className="p-4 w-12 h-12 rounded-xl bg-brand-50 text-brand-600 mb-6 flex items-center justify-center shadow-sm">
                                    <FiActivity className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Active Outlets</p>
                                <p className="text-4xl font-bold text-[var(--text-primary)]">{outlets.length}</p>
                            </div>
                            <div className="card-modern relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16 transition-all duration-150"></div>
                                <div className="p-4 w-12 h-12 rounded-xl bg-green-50 text-green-600 mb-6 flex items-center justify-center shadow-sm">
                                    <FiCheckCircle className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Total Sales</p>
                                <div className="flex items-baseline space-x-1">
                                    <span className="text-xl font-semibold text-green-500">₹</span>
                                    <p className="text-4xl font-bold text-[var(--text-primary)]">{totalRevenue.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="card-modern relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16 transition-all duration-150"></div>
                                <div className="p-4 w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-6 flex items-center justify-center shadow-sm">
                                    <FiShoppingBag className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Total Orders</p>
                                <p className="text-4xl font-bold text-[var(--text-primary)]">{Object.values(outletStats).reduce((s, o) => s + o.totalOrders, 0)}</p>
                            </div>
                            <div className="card-modern bg-brand-50/50 border-brand-100 group relative overflow-hidden flex flex-col items-center text-center justify-center  cursor-pointer" onClick={() => setIsSettingsModalOpen(true)}>
                                <FiSettings className="w-8 h-8 mb-3 text-brand-500 group- transition-all duration-150" />
                                <span className="font-semibold text-brand-700 uppercase tracking-widest text-xs">System Settings</span>
                            </div>
                        </div>

                        <div className="mb-24">
                            <div className="flex justify-between items-end mb-8 border-b border-[var(--border-color)] pb-4">
                                <h2 className="text-xl font-bold flex items-center text-[var(--text-primary)]">
                                    <FiDatabase className="mr-3 text-brand-500" /> Outlet Directory
                                </h2>
                                {!isAdding && (
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="btn-secondary"
                                    >
                                        <FiPlus className="mr-2" /> Register New Outlet
                                    </button>
                                )}
                            </div>

                            {isAdding && (
                                <div className="card-modern mb-16 animate-none p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold flex items-center text-[var(--text-primary)]">
                                            <FiPlus className="mr-3 text-brand-500" /> Register Outlet
                                        </h3>
                                        <button onClick={() => setIsAdding(false)} className="text-[var(--text-muted)]  p-2 transition-colors">
                                            <FiX className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddOutlet} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-12 lg:col-span-6">
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Outlet name</label>
                                            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="input-field" placeholder="Outlet name" />
                                        </div>
                                        <div className="md:col-span-12 lg:col-span-6">
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Location details</label>
                                            <input type="text" required value={newLocation} onChange={e => setNewLocation(e.target.value)} className="input-field" placeholder="E.g. Food Court, Ground Floor" />
                                        </div>
                                        <div className="md:col-span-12 lg:col-span-3">
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Latitude</label>
                                            <input type="number" step="any" required value={newLat} onChange={e => setNewLat(e.target.value)} className="input-field" placeholder="28.4506" />
                                        </div>
                                        <div className="md:col-span-12 lg:col-span-3">
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Longitude</label>
                                            <input type="number" step="any" required value={newLng} onChange={e => setNewLng(e.target.value)} className="input-field" placeholder="77.5838" />
                                        </div>
                                        <div className="md:col-span-12 lg:col-span-4">
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Owner Name</label>
                                            <input type="text" required value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)} className="input-field" placeholder="John Doe" />
                                        </div>
                                        <div className="md:col-span-12 lg:col-span-4">
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Owner Email</label>
                                            <input type="email" required value={newOwnerEmail} onChange={e => setNewOwnerEmail(e.target.value)} className="input-field" placeholder="owner@example.com" />
                                        </div>
                                        <div className="md:col-span-12 lg:col-span-4">
                                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">Temporary Password</label>
                                            <input type="password" required value={newOwnerPassword} onChange={e => setNewOwnerPassword(e.target.value)} className="input-field" placeholder="••••••••" />
                                        </div>
                                        <div className="md:col-span-12 mt-4">
                                            <button type="submit" className="btn-primary w-full">Register Outlet</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(() => {
                                    const topOutletId = outlets.length > 0
                                        ? outlets.reduce((top, o) =>
                                            (outletStats[o.id]?.totalRevenue || 0) > (outletStats[top.id]?.totalRevenue || 0) ? o : top
                                            , outlets[0]).id
                                        : null;
                                    return outlets.map((outlet) => {
                                        const stats = outletStats[outlet.id] || { menuItems: 0, totalOrders: 0, totalRevenue: 0, activeOrders: 0 };
                                        const isTopEarner = outlet.id === topOutletId && (outletStats[outlet.id]?.totalRevenue || 0) > 0;
                                        return (
                                            <div key={outlet.id} className={`card-modern group  transition-all border relative overflow-hidden cursor-pointer ${isTopEarner ? 'border-amber-300 dark:border-amber-500/30 ring-1 ring-amber-300/60' : 'border-[var(--border-color)]'}`} onClick={() => setSelectedOutlet(outlet)}>
                                                {isTopEarner && (
                                                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow-lg">
                                                        <FiTrendingUp className="w-3 h-3" /> Top Earner
                                                    </div>
                                                )}
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -translate-y-12 translate-x-12 transition-all duration-150"></div>

                                                <div className="flex md:flex-row flex-col gap-6 relative z-10">
                                                    <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center font-bold text-xl shadow-sm transition-">
                                                        {outlet.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{outlet.name}</h3>
                                                                <p className="text-sm text-[var(--text-muted)] flex items-center">
                                                                    <FiMapPin className="mr-1 inline" /> {outlet.location}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openSettings(outlet); }}
                                                                className="p-2 text-[var(--text-muted)]  transition-colors"
                                                            >
                                                                <FiSettings className="w-5 h-5" />
                                                            </button>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {outlet.owner ? (
                                                                <div className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center">
                                                                    <FiUser className="mr-1.5" /> Owner: {outlet.owner.name}
                                                                </div>
                                                            ) : (
                                                                <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center border border-orange-200">
                                                                    <FiAlertCircle className="mr-1.5" /> No Owner Assigned
                                                                </div>
                                                            )}
                                                            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center border ${outlet.is_open !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200 animate-pulse'}`}>
                                                                Status: {outlet.is_open !== false ? 'Open' : 'Closed'}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border-color)]">
                                                            <div className="text-center">
                                                                <p className="text-xl font-bold text-[var(--text-primary)]">{stats.menuItems}</p>
                                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Menu</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xl font-bold text-[var(--text-primary)]">{stats.totalOrders}</p>
                                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Orders</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xl font-bold text-brand-500">₹{stats.totalRevenue.toLocaleString()}</p>
                                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Revenue</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                })()}
                            </div>
                        </div>

                        {outlets.length > 0 && Object.keys(outletStats).length > 0 && (
                            <div className="mt-32">
                                <div className="flex items-center space-x-3 mb-12 border-b border-[var(--border-color)] pb-4">
                                    <FiBarChart2 className="w-8 h-8 text-brand-500" />
                                    <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">System Information Index</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="card-modern p-8">
                                        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-6">Revenue Allocation</h4>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={outlets.map(o => ({ name: o.name.length > 10 ? o.name.slice(0, 10) + '…' : o.name, revenue: outletStats[o.id]?.totalRevenue || 0 }))}>
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                                <Tooltip cursor={{ fill: 'rgba(0,112,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }} />
                                                <Bar dataKey="revenue" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="card-modern p-8">
                                        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-6">Transaction Load</h4>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={outlets.map(o => ({ name: o.name.length > 10 ? o.name.slice(0, 10) + '…' : o.name, orders: outletStats[o.id]?.totalOrders || 0 }))}>
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }} />
                                                <Bar dataKey="orders" fill="var(--text-primary)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center border-4 border-brand-100 animate-spin">
                    <FiActivity className="w-8 h-8" />
                </div>
                <p className="text-[var(--text-muted)] font-medium text-sm">Loading dashboard metadata...</p>
            </div>
        );
    }

    return (
        <div className="animate-none pb-32 pt-12 md:pt-16">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-12 border-b-8 border-brand-500 pb-12">
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-md uppercase tracking-wider">Management</span>
                        <span className="text-[var(--text-muted)] text-xs font-medium">Administrator</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">Admin Dashboard</h2>
                    <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-full text-xs font-semibold flex items-center shadow-sm border border-brand-100 dark:border-brand-500/30">
                            <FiShield className="mr-1.5" /> System Administrator
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end space-y-3">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleResetAllXP}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-colors shadow-sm"
                        >
                            Reset Student XP
                        </button>
                        <button
                            onClick={handleNukeDatabase}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors shadow-sm flex items-center group"
                        >
                            <FiAlertCircle className="mr-1.5 group-hover:animate-pulse" /> Nuke Database
                        </button>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="btn-secondary min-w-[120px]"
                    >
                        <FiRefreshCw className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        System Refresh
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-20 p-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                <button
                    onClick={() => setActiveTab('outlets')}
                    className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'outlets' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : ' text-[var(--text-muted)]'}`}
                >
                    <FiDatabase className="mr-2" /> Outlets
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : ' text-[var(--text-muted)]'}`}
                >
                    <FiUsers className="mr-2" /> User Directory
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : ' text-[var(--text-muted)]'}`}
                >
                    <FiZap className="mr-2" /> Command Center
                </button>
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'announcements' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : ' text-[var(--text-muted)]'}`}
                >
                    <FiBell className="mr-2" /> Global Alerts
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'reviews' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : ' text-[var(--text-muted)]'}`}
                >
                    <FiStar className="mr-2" /> Review Audit
                </button>
            </div>

            {renderTabContent()}

            <div className="mt-20 pt-12 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
                    <span>CampusQuickBite v2.0 • Admin Control Subsystem</span>
                    <span>System Status: <span className="text-green-500">NOMINAL</span></span>
                </div>
            </div>

            {selectedOutlet && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-none" onClick={() => setSelectedOutlet(null)}>
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-none" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 block">Outlet Configuration</span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedOutlet.name}</h3>
                            </div>
                            <button onClick={() => setSelectedOutlet(null)} className="p-2 text-slate-400  dark:  dark: rounded-full transition-colors">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Outlet Details</h4>
                                    <button onClick={() => setIsEditingOutlet(!isEditingOutlet)} className="text-brand-500  transition-colors">
                                        <FiEdit3 className="w-5 h-5" />
                                    </button>
                                </div>

                                {isEditingOutlet ? (
                                    <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Outlet name</label>
                                            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location details</label>
                                            <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                                        </div>
                                        <button onClick={handleSaveOutlet} className="btn-primary w-full">Save Configuration</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                                            <FiMapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Coordinates</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedOutlet.location}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Owner details</h4>
                                {selectedOutlet.owner ? (
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                                        <div className="relative z-10 flex items-center space-x-5">
                                            <div className="w-14 h-14 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-sm">
                                                {selectedOutlet.owner.profilePic ? (
                                                    <img loading="lazy" decoding="async" src={selectedOutlet.owner.profilePic} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiUser className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">{selectedOutlet.owner.name}</p>
                                                <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-widest">ID: {selectedOutlet.owner.id.split('-')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700/50 relative z-10">
                                            <div className="flex items-center space-x-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                <FiMail className="w-4 h-4 text-slate-400" />
                                                <span>{selectedOutlet.owner.email}</span>
                                            </div>
                                            {selectedOutlet.owner.phoneNumber && (
                                                <div className="flex items-center space-x-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                    <FiPhone className="w-4 h-4 text-slate-400" />
                                                    <span>{selectedOutlet.owner.phoneNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-orange-50 dark:bg-orange-500/10 text-orange-600 font-semibold border border-orange-200 dark:border-orange-500/20 rounded-xl text-xs flex items-center">
                                        <FiUser className="w-5 h-5 mr-3" /> NO OWNER ASSIGNED
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-[var(--border-color)]">
                                <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">Danger zone</h4>
                                <button onClick={handleDeleteOutlet} className="w-full py-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-red-500/30 text-red-500 font-semibold text-sm   transition-all">Delete outlet</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isSettingsModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[var(--bg-card)]/80 backdrop-blur-sm" onClick={() => setIsSettingsModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden animate-none border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center">
                                <FiSettings className="mr-3 text-brand-500" /> System Settings
                            </h3>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)]   transition-colors">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start space-x-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                    <FiActivity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">System Health</h4>
                                    <p className="text-xs text-slate-500 font-medium">All core services and outlets are operating normally. Database is stable.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-between p-4 bg-[var(--bg-input)]  border border-[var(--border-color)] rounded-xl transition-colors group" onClick={() => { localStorage.clear(); showToast('Local cache wiped. Reloading UI.', 'success'); setTimeout(() => window.location.reload(), 1000); setIsSettingsModalOpen(false); }}>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 border border-[var(--border-color)] rounded-lg text-[var(--text-muted)] group-hover:bg-brand-500 group-hover:text-white transition-colors bg-[var(--bg-card)]">
                                            <FiHardDrive className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">Reset local cache</span>
                                    </div>
                                    <FiArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button className="w-full flex items-center justify-between p-4 bg-[var(--bg-input)]  border border-[var(--border-color)] rounded-xl transition-colors group" onClick={() => {
                                    const csvHeader = 'Outlet Name,Location,Total Orders,Total Revenue\n';
                                    const csvData = outlets.map(o => `"${o.name}","${o.location}",${outletStats[o.id]?.totalOrders || 0},${outletStats[o.id]?.totalRevenue || 0}`).join('\n');
                                    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a'); a.href = url; a.download = 'campusbite-system-report.csv'; a.click(); URL.revokeObjectURL(url);
                                    showToast('System report generated & downloaded.', 'success'); setIsSettingsModalOpen(false);
                                }}>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 border border-[var(--border-color)] rounded-lg text-[var(--text-muted)] group-hover:bg-brand-500 group-hover:text-white transition-colors bg-[var(--bg-primary)]">
                                            <FiDownload className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">Export system report (CSV)</span>
                                    </div>
                                    <FiArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button className="w-full flex items-center justify-between p-4 bg-red-50  dark:bg-red-500/10 dark: border border-red-100 dark:border-red-500/20 rounded-xl transition-colors text-red-600 dark:text-red-400 group" onClick={() => { showToast('Emergency refresh initiated - reloading.', 'error'); handleRefresh(); setIsSettingsModalOpen(false); }}>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 border border-red-200 dark:border-red-500/30 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                                            <FiRefreshCw className="w-4 h-4 group-hover:animate-spin" />
                                        </div>
                                        <span className="text-sm font-bold">Restart connection links</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {selectedStudentForModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStudentForModal(null)}></div>
                    <div className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden border border-[var(--border-color)] animate-none" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 flex items-center justify-center font-black text-xl uppercase shadow-sm border border-brand-200 dark:border-brand-500/30">
                                    {selectedStudentForModal.name?.[0] || '?'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] leading-none mb-1">
                                        {selectedStudentForModal.name}
                                    </h3>
                                    <p className="text-xs font-bold text-[var(--text-muted)] font-mono tracking-wider">
                                        {selectedStudentForModal.enrollment_number || 'No Enroll No'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudentForModal(null)} className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 bg-[var(--bg-body)] space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-3">
                                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Contact</span>
                                <span className="font-bold text-[var(--text-primary)]">{selectedStudentForModal.email}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-3">
                                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Joined</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {new Date(selectedStudentForModal.createdAt || selectedStudentForModal.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <div className="pt-2">
                                <button 
                                    onClick={async () => {
                                        try {
                                            const isBanned = selectedStudentForModal.isBanned || selectedStudentForModal.is_banned;
                                            await api.put(`/users/${selectedStudentForModal.id}/status`, { field: 'is_banned', value: !isBanned });
                                            showToast(`User ${isBanned ? 'unbanned' : 'banned'} successfully`, 'success');
                                            setSelectedStudentForModal({ ...selectedStudentForModal, is_banned: !isBanned, isBanned: !isBanned });
                                            fetchGlobalOrders(); 
                                        } catch (e) {
                                            showToast('Action failed', 'error');
                                        }
                                    }}
                                    className={`w-full py-3.5 rounded-xl border-2 font-black text-sm uppercase tracking-wider transition-all ${(selectedStudentForModal.isBanned || selectedStudentForModal.is_banned) ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-500/30 hover:bg-orange-100' : 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-200 dark:border-red-500/30 hover:bg-red-100'}`}
                                >
                                    <div className="flex items-center justify-center">
                                        <FiUserX className="w-5 h-5 mr-2" />
                                        {(selectedStudentForModal.isBanned || selectedStudentForModal.is_banned) ? 'Lift Account Ban' : 'Ban Account'}
                                    </div>
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!window.confirm(`⚠️ Remove ALL badges and reset XP to 0 for "${selectedStudentForModal.name}"? This cannot be undone.`)) return;
                                        try {
                                            const response = await api.delete(`/users/${selectedStudentForModal.id}/badges`);
                                            showToast(`🚫 All badges revoked for ${selectedStudentForModal.name}`, 'success');
                                            
                                            // Handle local context sync if admin revoked themselves
                                            const isSelf = currentUser && String(selectedStudentForModal.id) === String(currentUser.id);
                                            if (isSelf && updateUser && response.data?.user) {
                                                console.log('[AdminPanel] Correcting current admin session with fresh badges data from DB...');
                                                updateUser(response.data.user);
                                            }

                                            // Re-fetch all lists to stay in sync
                                            fetchUsers();
                                            fetchGlobalOrders();
                                            setSelectedStudentForModal(null);
                                        } catch (e: any) {
                                            showToast(e?.response?.data?.error || 'Failed to revoke badges', 'error');
                                        }
                                    }}
                                    className="w-full mt-3 py-3.5 rounded-xl border-2 font-black text-sm uppercase tracking-wider transition-all bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 hover:bg-purple-100 dark:hover:bg-purple-500/20 flex items-center justify-center gap-2"
                                >
                                    🏅 Revoke All Badges
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showResetXPModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-none" onClick={() => setShowResetXPModal(false)}>
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-none" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center bg-orange-50 border-b border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20">
                            <FiAlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-orange-900 dark:text-orange-400 mb-2">Reset Student XP</h3>
                            <p className="text-orange-700/80 text-sm font-semibold">Start of a new season/semester</p>
                        </div>
                        <div className="p-8 pb-10">
                            <p className="text-[var(--text-primary)] font-medium text-center mb-8">
                                Are you sure you want to reset ALL Student XP to zero? This action marks the start of a new competitive semester and <strong className="text-orange-600">cannot be undone</strong>.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowResetXPModal(false)} className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={executeResetXP} className="flex-1 py-3 px-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all">Yes, Reset XP</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {nukeStage > 0 && createPortal(
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-red-900/80 backdrop-blur-md animate-none" onClick={() => !isNukeLoading && setNukeStage(0)}>
                    <div className="bg-[var(--bg-body)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-none border-4 border-red-500/30" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center bg-red-50 border-b border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
                            <FiAlertTriangle className={`w-20 h-20 text-red-500 mx-auto mb-4 ${isNukeLoading ? 'animate-spin' : 'animate-pulse'}`} />
                            <h3 className="text-3xl font-black text-red-600 mb-2">
                                {nukeStage === 1 ? "SYSTEM WIPE WARNING" : nukeStage === 2 ? "FINAL WARNING" : "SECURITY OVERRIDE"}
                            </h3>
                            <p className="text-red-500/80 text-sm font-black uppercase tracking-widest">
                                {isNukeLoading ? 'Executing Wipe...' : 'Highly Destructive Action'}
                            </p>
                        </div>
                        <div className="p-8 pb-10">
                            {nukeStage === 1 ? (
                                <>
                                    <p className="text-[var(--text-primary)] font-bold text-center mb-6 leading-relaxed">
                                        You are about to permanently delete <strong className="text-red-500 uppercase">all orders, sales data, cart items, and transactions</strong> across the entire app. Student XP will also be zeroed.
                                    </p>
                                    <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-lg mb-8 border border-red-100 dark:border-red-500/20">
                                        <p className="text-xs text-red-600 dark:text-red-400 font-bold text-center">Your Menu Items, Outlets, and Users will NOT be deleted.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setNukeStage(0)} className="flex-1 py-4 px-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 transition-colors uppercase">Cancel</button>
                                        <button onClick={() => setNukeStage(2)} className="flex-1 py-4 px-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 shadow-xl shadow-red-500/40 transition-all uppercase">Proceed</button>
                                    </div>
                                </>
                            ) : nukeStage === 2 ? (
                                <>
                                    <p className="text-[var(--text-primary)] font-bold text-center mb-8 leading-relaxed text-lg">
                                        This is your final warning. Are you absolutely sure you want to completely Nuke everything?
                                    </p>
                                    <div className="flex flex-col gap-4">
                                        <button onClick={() => setNukeStage(3)} className="w-full py-5 px-4 bg-red-600 text-white text-lg font-black rounded-xl hover:bg-red-700 shadow-xl shadow-red-600/40 transition-all uppercase">
                                            Confirm & Proceed to Auth
                                        </button>
                                        <button onClick={() => setNukeStage(0)} className="w-full py-4 px-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 transition-colors uppercase">
                                            Nevermind, Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-[var(--text-primary)] font-bold text-center mb-6 leading-relaxed">
                                        Enter your <strong className="text-slate-900 dark:text-white">Administrator Password</strong> to authorize the manual database override.
                                    </p>
                                    <div className="space-y-6">
                                        <input 
                                            type="password"
                                            autoFocus
                                            placeholder="Admin Password"
                                            value={nukePassword}
                                            onChange={(e) => setNukePassword(e.target.value)}
                                            className="w-full bg-[var(--bg-input)] border-2 border-red-200 dark:border-red-900/30 rounded-xl p-4 text-center text-lg font-black tracking-[0.3em] focus:border-red-500 outline-none transition-all"
                                            onKeyDown={(e) => e.key === 'Enter' && executeNukeDatabase()}
                                        />
                                        <div className="flex gap-4">
                                            <button 
                                                disabled={isNukeLoading}
                                                onClick={() => setNukeStage(0)} 
                                                className="flex-1 py-4 px-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 transition-colors uppercase disabled:opacity-50"
                                            >
                                                Abort
                                            </button>
                                            <button 
                                                disabled={isNukeLoading || !nukePassword}
                                                onClick={executeNukeDatabase} 
                                                className="flex-1 py-4 px-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 shadow-xl shadow-red-600/40 transition-all uppercase flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {isNukeLoading ? <FiRefreshCw className="animate-spin" /> : <FiLock />} Verify & Nuke
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminDashboard;
