/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiX, FiShoppingBag, FiRefreshCw, FiAlertTriangle, FiPrinter } from 'react-icons/fi';
import { useToast } from '../../hooks/context/ToastContext';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    availability: boolean;
    is_veg: boolean;
    stock?: number;
}

const MenuManagement = () => {
    const { outletId } = useParams<{ outletId: string }>();
    const { showToast } = useToast();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemIsVeg, setNewItemIsVeg] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editIsVeg, setEditIsVeg] = useState(true);

    const fetchMenu = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const res = await api.get(`/menu/${outletId}`);
            setMenuItems(res.data);
        } catch (error) {
            console.error("Failed to fetch menu", error);
            showToast("Unable to load the chef's index.", 'error');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        if (outletId) {
            fetchMenu();
        }
    }, [outletId]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName || !newItemPrice) return;
        try {
            const newItem = {
                name: newItemName,
                price: parseFloat(newItemPrice),
                availability: true,
                isVeg: newItemIsVeg
            };
            await api.post(`/menu?outletId=${outletId}`, newItem);
            setNewItemName('');
            setNewItemPrice('');
            setNewItemIsVeg(true);
            setIsAdding(false);
            showToast(`${newItem.name} is now on the board!`, 'success');
            fetchMenu();
        } catch (error: any) {
            showToast(error.response?.data?.error || "Couldn't save this creation.", 'error');
        }
    };

    const startEditing = (item: MenuItem) => {
        setEditingId(item.id);
        setEditName(item.name);
        setEditPrice(item.price.toString());
        setEditIsVeg(item.is_veg);
    };

    const handleUpdateItem = async (e: React.FormEvent | React.MouseEvent, id: string) => {
        e.preventDefault();
        try {
            const currentItem = menuItems.find(i => i.id === id);
            await api.put(`/menu/${id}`, {
                name: editName,
                price: parseFloat(editPrice),
                availability: currentItem?.availability,
                isVeg: editIsVeg
            });
            setEditingId(null);
            showToast("Recipe updated successfully.", 'success');
            fetchMenu(true);
        } catch (error: any) {
            showToast("Failed to sync changes.", 'error');
        }
    };

    const toggleAvailability = async (e: React.MouseEvent, item: MenuItem) => {
        e.stopPropagation();
        if (togglingIds.has(item.id)) return;
        setTogglingIds(prev => new Set([...prev, item.id]));

        const newAvailability = !item.availability;

        setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, availability: newAvailability } : m));

        try {
            await api.put(`/menu/${item.id}`, { availability: newAvailability });
            showToast(newAvailability ? '✅ Item is now AVAILABLE' : '⏸️ Item marked UNAVAILABLE', 'success');
        } catch (error: any) {
            setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, availability: item.availability } : m));
            const msg = error?.response?.data?.error || error?.message || 'Unknown error';
            console.error('Toggle availability failed:', msg, error?.response?.data);
            showToast(`Failed to update availability: ${msg}`, 'error');
        } finally {
            setTogglingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
        }
    };

    const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure about removing this dish?")) return;
        try {
            await api.delete(`/menu/${id}`);
            showToast("Dish removed from the index.", 'success');
            fetchMenu(true);
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-none relative pb-40 px-6">
            <div className="mb-16 pt-10">
                <Link to="/owner/dashboard" className="inline-flex items-center space-x-3 group text-slate-500  transition-all font-semibold uppercase tracking-wider text-[11px] bg-slate-100 dark:bg-slate-800/50 px-5 py-3 rounded-xl border border-transparent  mb-10 shadow-sm">
                    <FiArrowLeft className="w-3.5 h-3.5 transition-" />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <span className="px-3.5 py-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center w-fit border border-brand-500/10">
                                <FiShoppingBag className="mr-2" /> MENU
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                            Kitchen Menu
                        </h1>
                        <p className="text-base font-medium text-slate-500 max-w-md leading-relaxed">Customize your offerings, set prices, and manage daily availability.</p>
                    </div>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-brand-500 text-white pl-1.5 pr-8 py-1.5 rounded-2xl flex items-center group shadow-lg  transition-all ]"
                        >
                            <span className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-5 group- transition-">
                                <FiPlus className="w-6 h-6 stroke-[3]" />
                            </span>
                            <span className="font-bold uppercase tracking-wider text-[11px]">Add New Dish</span>
                        </button>
                    )}
                </div>
            </div>

            {isAdding && (
                <div className="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-10 mb-12 animate-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">New Listing</h3>
                        <button onClick={() => setIsAdding(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400  transition-colors border border-transparent shadow-sm">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleAddItem} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl outline-none focus:border-brand-500 transition-all font-semibold text-lg tracking-tight"
                                    placeholder="e.g. Garlic Cheese Toast"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={newItemPrice}
                                        onChange={e => setNewItemPrice(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl outline-none focus:border-brand-500 transition-all font-semibold text-lg tracking-tight"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                                    <button
                                        type="button"
                                        onClick={() => setNewItemIsVeg(!newItemIsVeg)}
                                        className={`w-full h-[60px] border rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm
 ${newItemIsVeg ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' : 'border-rose-500/20 text-rose-600 bg-rose-500/5'}`}
                                    >
                                        {newItemIsVeg ? 'Vegetarian' : 'Non-Veg'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 dark:bg-slate-800 text-white py-5 rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-lg  dark: transition-all ]">
                            Add to Menu
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <div key={item.id} className="group bg-[var(--bg-card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-8   transition-all duration-150 relative overflow-hidden">
                        {editingId === item.id ? (
                            <form onSubmit={(e) => handleUpdateItem(e, item.id)} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-500/30 p-3 rounded-xl font-bold text-base tracking-tight outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</label>
                                        <input
                                            type="number"
                                            required
                                            value={editPrice}
                                            onChange={e => setEditPrice(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-brand-500/30 p-3 rounded-xl font-bold text-base tracking-tight outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                                        <button
                                            type="button"
                                            onClick={() => setEditIsVeg(!editIsVeg)}
                                            className={`w-full h-[50px] border rounded-xl font-bold text-[9px] uppercase tracking-widest ${editIsVeg ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5' : 'border-rose-500/30 text-rose-600 bg-rose-500/5'}`}
                                        >
                                            {editIsVeg ? 'Veg' : 'Non-Veg'}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 bg-brand-500 text-white p-3 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center shadow-lg">
                                        Save Changes
                                    </button>
                                    <button type="button" onClick={() => setEditingId(null)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className={`w-12 h-12 border flex items-center justify-center rounded-xl font-bold text-lg transition-all duration-150 shadow-sm
 ${item.is_veg ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' : 'border-rose-500/20 text-rose-600 bg-rose-500/5'}`}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <button
                                        onClick={(e) => toggleAvailability(e, item)}
                                        className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all shadow-sm
 ${item.availability ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'}`}
                                    >
                                        {item.availability ? 'AVAILABLE' : 'OFFLINE'}
                                    </button>
                                </div>
                                <div className="mb-8 relative z-10">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mb-1 truncate group- transition-colors">{item.name}</h3>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">₹{item.price.toFixed(0)}</p>
                                    {item.stock !== undefined && item.stock <= 5 && (
                                        <div className="mt-2 flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg w-fit">
                                            <FiAlertTriangle className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">
                                                {item.stock === 0 ? 'Out of Stock' : `Only ${item.stock} left`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 opacity-0 group- transition-all relative z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                                        className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider  transition-all flex items-center justify-center space-x-2 shadow-sm"
                                    >
                                        <FiEdit2 className="w-3.5 h-3.5" /> <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); window.print(); }}
                                        className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl font-bold text-[10px] uppercase tracking-wider   transition-all flex items-center justify-center shadow-sm"
                                        title="Print Item Info"
                                    >
                                        <FiPrinter className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteItem(e, item.id)}
                                        className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl font-bold text-[10px] uppercase tracking-wider   transition-all flex items-center justify-center shadow-sm"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {isLoading && (
                <div className="fixed bottom-10 right-10 z-50">
                    <div className="bg-slate-900 border border-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-none">
                        <FiRefreshCw className="w-4 h-4 animate-spin text-brand-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Updating Menu...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
