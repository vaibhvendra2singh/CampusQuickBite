/* eslint-disable @typescript-eslint/no-explicit-any */


import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../hooks/context/CartContext';
import { FiMapPin, FiArrowLeft, FiShoppingBag, FiSearch, FiHeart, FiFilter, FiX, FiStar, FiPhone } from 'react-icons/fi';
import { FadeIn } from '../../components/animations/FadeIn';
import { useToast } from '../../hooks/context/ToastContext';
import { useAuth } from '../../hooks/context/AuthContext';
import RatingModal from '../../components/common/RatingModal';
import { useSocket } from '../../hooks/useSocket';

interface MenuItem {
    id: number;
    outlet_id: number;
    name: string;
    description: string;
    price: number;
    availability: boolean;
    image_url?: string;
    created_at?: string;
    is_veg?: boolean;
    isVeg?: boolean;
    average_rating?: number;
    rating_count?: number;
    stock?: number;
}

interface Outlet {
    id: number;
    name: string;
    location: string;
    is_open?: boolean;
    current_status?: 'FAST' | 'MODERATE' | 'BUSY';
    owner?: { id: number; email?: string; phone_number?: string };
}

const ALL_TAGS = ['Spicy', 'Healthy', 'Best Seller', 'Daily Special'];

const getFavorites = (): number[] => {
    try { return JSON.parse(localStorage.getItem('cqb-favorites') || '[]'); }
    catch { return []; }
};
const toggleFavorite = (id: number): number[] => {
    const favs = getFavorites();
    const updated = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    localStorage.setItem('cqb-favorites', JSON.stringify(updated));
    return updated;
};

const OutletMenu = () => {
    const { outletId } = useParams<{ outletId: string }>();
    const { showToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [outlet, setOutlet] = useState<Outlet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const socket = useSocket();

    const handleReportStatus = async (status: 'FAST' | 'MODERATE' | 'BUSY') => {
        if (!user) {
            showToast('Login required to report wait times.', 'error');
            return;
        }
        try {
            const res = await api.post(`/outlets/${outletId}/status`, { status });
            setOutlet(res.data);
            showToast('Wait time reported. Thanks for helping the campus!', 'success');
        } catch (error) {
            console.error('Failed to report status', error);
            showToast('Could not report wait time. Try again later.', 'error');
        }
    };

    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [priceSort, setPriceSort] = useState<'none' | 'low' | 'high'>('none');
    const [favorites, setFavorites] = useState<number[]>(getFavorites());
    const [showFavsOnly, setShowFavsOnly] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { addToCart, items: cartItems } = useCart();

    const [personalRecs, setPersonalRecs] = useState<MenuItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [menuRes, outletRes] = await Promise.all([
                    api.get(`/menu/${outletId}`),
                    api.get(`/outlets/${outletId}`)
                ]);
                setMenuItems(menuRes.data);
                setOutlet(outletRes.data);

                if (user) {
                    try {
                        const recsRes = await api.get('/analytics/recommendations/personal');
                        const outletItemsMap = new Map(menuRes.data.map((i: MenuItem) => [i.id, i]));
                        const mappedRecs = recsRes.data
                            .map((r: { id: number }) => outletItemsMap.get(r.id))
                            .filter(Boolean);
                        setPersonalRecs(mappedRecs as MenuItem[]);
                    } catch { console.error("Recs error"); }
                }

            } catch (error) {
                console.error("Failed to fetch menu data", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (outletId) {
            fetchData();

            if (socket) {
                const handleMenuUpdate = (data: { outletId: string }) => {
                    if (data.outletId === outletId) {
                        console.log("Real-time menu update received via socket for outlet:", outletId);
                        fetchData();
                    }
                };
                socket.on('menu_update', handleMenuUpdate);
                return () => socket.off('menu_update', handleMenuUpdate);
            }

            const intervalId = setInterval(fetchData, 30000); // Backoff to 30s since we have socket now
            return () => clearInterval(intervalId);
        }
    }, [outletId, user, socket]);

    const toggleFilter = (tag: string) => {
        setActiveFilters(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleToggleFav = (id: number, name: string) => {
        const updated = toggleFavorite(id);
        setFavorites(updated);
        showToast(updated.includes(id) ? `❤️ ${name} added to favorites!` : `${name} removed from favorites`, updated.includes(id) ? 'success' : 'info');
    };

    const handleAddToCart = async (item: MenuItem) => {
        if (outlet?.is_open === false) {
            showToast('This outlet is currently closed', 'error');
            return;
        }
        try {
            await addToCart({ menuItemId: item.id, name: item.name, price: item.price });
            showToast(`${item.name} added to cart`, 'success');

            try {
                const upsellRes = await api.get(`/analytics/recommendations/upsell/${item.id}`);
                const upsells = upsellRes.data;
                if (upsells && upsells.length > 0) {
                    const topUpsell = upsells[0];
                    const validAtOutlet = menuItems.find(m => m.id === topUpsell.id);
                    if (validAtOutlet) {
                        setTimeout(() => {
                            showToast(`💡 Smart Suggestion: People usually pair ${item.name} with ${topUpsell.name}`, 'info');
                        }, 1500);
                    }
                }
            } catch {
            }

        } catch (err: unknown) {
            if ((err as { response?: { status?: number } }).response?.status === 403 || (err as { response?: { status?: number } }).response?.status === 401 || !user) {
                navigate('/login');
                showToast('Please sign in to order', 'error');
            } else {
                showToast('Failed to add item. Please try again.', 'error');
            }
        }
    };

    const filteredItems = useMemo(() => {
        let items = menuItems;
        if (searchQuery.trim()) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (activeFilters.includes('Vegetarian')) {
            items = items.filter(item => item.is_veg ?? item.isVeg);
        }
        if (showFavsOnly) {
            items = items.filter(item => favorites.includes(item.id));
        }
        if (priceSort === 'low') items = [...items].sort((a, b) => a.price - b.price);
        if (priceSort === 'high') items = [...items].sort((a, b) => b.price - a.price);
        
        return items;
    }, [menuItems, searchQuery, activeFilters, showFavsOnly, priceSort, favorites]);


    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto py-12 space-y-6 animate-pulse px-6">
                <div className="h-5 bg-[var(--bg-input)] rounded-lg w-24"></div>
                <div className="h-8 bg-[var(--bg-input)] rounded-lg w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)]"></div>)}
                </div>
            </div>
        );
    }

    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const hasActiveFilters = searchQuery || activeFilters.length > 0 || showFavsOnly || priceSort !== 'none';

    return (
        <div className="max-w-6xl mx-auto animate-none relative pb-32 sm:pb-48 px-3 sm:px-5 md:px-6">
            <div className="mb-10">
                <Link to="/restaurants" className="group inline-flex items-center text-[var(--text-muted)]  transition-all font-bold text-sm">
                    <FiArrowLeft className="mr-2 transition-all duration-150" />
                    Back to all outlets
                </Link>
            </div>

            {outlet?.is_open === false && (
                <div className="mb-8 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-5 rounded-2xl flex items-center gap-4 border border-red-200/50 dark:border-red-500/20 shadow-sm animate-none">
                    <FiX className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <p className="font-black text-sm uppercase tracking-wider">Kitchen's Closed</p>
                        <p className="text-xs font-medium opacity-80">This vendor isn't taking orders right now. Check back in a bit!</p>
                    </div>
                </div>
            )}

            <FadeIn delay={0.1}>
            <div className="relative mb-12 sm:mb-16 md:mb-20 mt-4 p-5 sm:p-8 md:p-12 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3.5rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/5 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-10">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex md:hidden w-12 h-12 bg-brand-500 text-white items-center justify-center text-xl font-black rounded-2xl shadow-xl shadow-brand-500/20">
                                {outlet?.name.charAt(0)}
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] leading-none">{outlet?.name}</h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-8">
                            <div className="flex items-center text-[var(--text-secondary)] text-sm font-bold bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-color)] shadow-sm">
                                <FiMapPin className="mr-2 w-4 h-4 text-brand-500 flex-shrink-0" />
                                {outlet?.location}
                            </div>

                            {outlet?.owner && (
                                <div className="flex items-center gap-3">
                                    {outlet.owner.phone_number && (
                                        <a href={`tel:${outlet.owner.phone_number}`} className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900  dark: px-4 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-800   shadow-sm">
                                            <FiPhone className="mr-2 w-4 h-4" /> Call
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setIsRatingModalOpen(true)}
                                        className="flex items-center text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20  dark: px-4 py-2 rounded-xl transition-all border border-amber-200 dark:border-amber-800 shadow-sm"
                                    >
                                        <FiStar className="mr-2 w-4 h-4 fill-current" /> Rate
                                    </button>
                                </div>
                            )}
                        </div>

                    <div className="p-4 sm:p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[1.5rem] sm:rounded-[2rem] shadow-sm max-w-sm">
                            <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-4">How's the queue?</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleReportStatus('FAST')} className={`flex-1 py-3 border-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${outlet?.current_status === 'FAST' ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' : 'border-[var(--border-color)] text-[var(--text-secondary)]  '}`}>FAST</button>
                                <button onClick={() => handleReportStatus('MODERATE')} className={`flex-1 py-3 border-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${outlet?.current_status === 'MODERATE' ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' : 'border-[var(--border-color)] text-[var(--text-secondary)]  '}`}>MODERATE</button>
                                <button onClick={() => handleReportStatus('BUSY')} className={`flex-1 py-3 border-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${outlet?.current_status === 'BUSY' ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-[var(--border-color)] text-[var(--text-secondary)]  '}`}>BUSY</button>
                            </div>
                        </div>

                    </div>
                    <div className="hidden md:flex w-24 h-24 bg-brand-500 text-white items-center justify-center text-4xl font-black rounded-[2rem] shadow-2xl shadow-brand-500/30 rotate-3  transition-all duration-150">
                        {outlet?.name.charAt(0)}
                    </div>
                </div>
            </div>
            </FadeIn>

            <div className="mb-8 sm:mb-12 relative max-w-2xl">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4.5 h-4.5" />
                    <input type="text" placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 rounded-xl outline-none transition-all font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
                </div>
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] ">
                        <FiX className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="mb-10 sm:mb-16">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${isFilterOpen || hasActiveFilters ? 'bg-[var(--text-primary)] text-[var(--bg-card)] border-[var(--text-primary)]' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] '}`}
                    >
                        <FiFilter className="w-4 h-4" />
                        {hasActiveFilters ? 'Filters Applied' : 'Filters'}
                    </button>
                    {hasActiveFilters && (
                        <button onClick={() => { setSearchQuery(''); setActiveFilters([]); setShowFavsOnly(false); setPriceSort('none'); setIsFilterOpen(false); }} className="text-xs font-bold text-red-500  px-3 py-1.5 rounded-lg transition-all">
                            Clear Filters
                        </button>
                    )}
                </div>

                {isFilterOpen && (
                    <div className="animate-none bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm mb-8 space-y-6">

                        <div>
                            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Sort by Price</h4>
                            <div className="flex gap-3">
                                <button onClick={() => setPriceSort('none')} className={`px-4 py-2 text-xs font-semibold border rounded-lg transition-all ${priceSort === 'none' ? 'bg-[var(--text-primary)] text-[var(--bg-card)] border-[var(--text-primary)]' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] '}`}>Default</button>
                                <button onClick={() => setPriceSort('low')} className={`px-4 py-2 text-xs font-semibold border rounded-lg transition-all ${priceSort === 'low' ? 'bg-[var(--text-primary)] text-[var(--bg-card)] border-[var(--text-primary)]' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] '}`}>Low to High</button>
                                <button onClick={() => setPriceSort('high')} className={`px-4 py-2 text-xs font-semibold border rounded-lg transition-all ${priceSort === 'high' ? 'bg-[var(--text-primary)] text-[var(--bg-card)] border-[var(--text-primary)]' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] '}`}>High to Low</button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Quick Filters</h4>
                            <div className="flex gap-3">
                                <button onClick={() => setShowFavsOnly(!showFavsOnly)} className={`px-4 py-2 text-xs font-semibold border rounded-lg transition-all flex items-center gap-1.5 ${showFavsOnly ? 'bg-pink-500 border-pink-500 text-white' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)]  '}`}>
                                    <FiHeart className={`w-3.5 h-3.5 ${showFavsOnly ? 'fill-current' : ''}`} />
                                    <span>Saved</span>
                                </button>
                                <button onClick={() => toggleFilter('Vegetarian')} className={`px-4 py-2 text-xs font-semibold border rounded-lg transition-all flex items-center gap-1.5 ${activeFilters.includes('Vegetarian') ? 'bg-green-500 border-green-500 text-white' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)]  '}`}>
                                    <span className="w-2 h-2 rounded-full bg-current"></span>
                                    <span>Veg Only</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Categories</h4>
                            <div className="flex flex-wrap gap-2">
                                {ALL_TAGS.filter(t => t !== 'Vegetarian').map(tag => (
                                    <button key={tag} onClick={() => toggleFilter(tag)} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${activeFilters.includes(tag) ? 'bg-brand-500 border-brand-500 text-white' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)]  '}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{filteredItems.length} items</h3>
            </div>

            {personalRecs.length > 0 && !searchQuery && activeFilters.length === 0 && (
                <div className="mb-8">
                    <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Based on your orders</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">Items you might like</p>
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                        {personalRecs.map(item => (
                            <div key={`rec-${item.id}`} className="min-w-[220px] bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)]  transition-colors">
                                <h4 className="font-semibold text-sm text-[var(--text-primary)] line-clamp-1">{item.name}</h4>
                                <div className="flex items-center justify-between mt-2.5">
                                    <span className="text-base font-bold text-[var(--text-primary)]">₹{item.price.toFixed(0)}</span>
                                    <button onClick={() => handleAddToCart(item)} className="text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-md   transition-colors">Add</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-20">
                {menuItems.length === 0 ? (
                    <div className="col-span-3 text-center py-24 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] border-dashed">
                        <div className="w-20 h-20 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiSearch className="text-[var(--text-muted)] w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3 tracking-tight">Nothing on the stove yet</h3>
                        <p className="text-[var(--text-muted)] font-medium text-base">This outlet hasn't posted their menu. Check back soon!</p>
                    </div>
                ) : filteredItems.length === 0 && (
                    <div className="col-span-3 text-center py-20">
                        <p className="text-[var(--text-muted)] font-bold text-lg">No matches for those filters.</p>
                    </div>
                )}

                {Object.entries(
                    filteredItems.reduce((acc, item) => {
                        let cat = 'Main Menu';
                        let displayDesc = item.description;

                        if (item.description && item.description.startsWith('Category: ')) {
                            cat = item.description.replace('Category: ', '').trim();
                            displayDesc = '';
                        }

                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push({ ...item, displayDesc });
                        return acc;
                    }, {} as Record<string, any[]>)
                ).map(([category, items]) => (
                    <div key={category} className="animate-none">
                        {category !== 'Main Menu' && (
                            <div className="flex items-center mb-10">
                                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase">{category}</h2>
                                <div className="h-0.5 bg-[var(--border-color)] flex-1 ml-8 opacity-40"></div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                            {items.map((item, index) => (
                                <FadeIn key={item.id} delay={index < 6 ? 0.05 * (index % 3) : 0} direction="up" className="h-full contain-paint">
                                <div className={`contain-content group h-full bg-[var(--glass-bg)] backdrop-blur-md rounded-[2rem] border border-[var(--glass-border)] overflow-hidden flex flex-col transition-colors duration-200 ${!item.availability ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                    <div className="p-7 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {(() => { const isVeg = item.is_veg ?? item.isVeg; return (<span className={`inline-block w-3.5 h-3.5 border-2 rounded-sm ${isVeg ? 'border-green-600' : 'border-red-600'}`}><span className={`block w-1.5 h-1.5 m-0.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span></span>); })()}
                                                    {!item.availability ? <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-500/5 px-2 py-1 rounded-md">Currently Unavailable</span> :
                                                        (item.stock !== undefined && item.stock <= 0) ? <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/5 px-2 py-1 rounded-md">Sold Out</span> : null}
                                                </div>
                                                <h3 className="font-black text-lg text-[var(--text-primary)] tracking-tight leading-tight mb-2 transition-colors">{item.name}</h3>
                                                {item.average_rating ? (
                                                    <div className="flex items-center gap-1.5 text-amber-500 mb-2">
                                                        <FiStar className="fill-amber-500 w-3.5 h-3.5" />
                                                        <span className="text-xs font-black">{item.average_rating}</span>
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">({item.rating_count} reviews)</span>
                                                    </div>
                                                ) : (<span className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-2 block opacity-70">Newly Added</span>)}
                                                {item.displayDesc && <p className="text-[var(--text-secondary)] text-sm mt-3 line-clamp-2 font-medium leading-relaxed">{item.displayDesc}</p>}
                                            </div>
                                            <button onClick={(e) => { e.preventDefault(); handleToggleFav(item.id, item.name); }} className={`w-10 h-10 flex-shrink-0 rounded-xl border-2 flex items-center justify-center transition-all ${favorites.includes(item.id) ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20' : 'border-[var(--border-color)] text-[var(--text-muted)]  '}`}>
                                                <FiHeart className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>
                                        <div className="mt-auto pt-6 border-t border-[var(--border-color)] border-dashed flex items-center justify-between">
                                            <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">₹{item.price.toFixed(0)}</span>
                                            <button onClick={() => handleAddToCart(item)} disabled={!item.availability || (item.stock !== undefined && item.stock <= 0) || outlet?.is_open === false} className={`px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl ${!item.availability || (item.stock !== undefined && item.stock <= 0) || outlet?.is_open === false ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)] shadow-none' : 'bg-brand-500 text-white   shadow-brand-500/20'}`}>
                                                {outlet?.is_open === false ? 'Closed' : !item.availability ? 'Unavailable' : (item.stock === undefined || item.stock > 0) ? 'ADD' : 'Out of Stock'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {cartItemCount > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xl z-50 animate-none">
                    <div className="bg-slate-950 rounded-[2rem] p-5 shadow-2xl flex items-center justify-between text-white border border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="relative w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/20">
                                <FiShoppingBag className="w-6 h-6 text-white" />
                                <span className="absolute -top-2 -right-2 bg-white text-slate-950 w-6 h-6 flex items-center justify-center text-[10px] font-black rounded-full border-4 border-slate-950">{cartItemCount}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest leading-none mb-1">Items in bag</p>
                                <p className="text-2xl font-black tracking-tighter leading-none">₹{cartTotal.toFixed(0)}</p>
                            </div>
                        </div>
                        <Link to="/cart" className="bg-brand-500 text-white px-8 py-3.5 rounded-[1.25rem] font-black text-sm  shadow-xl shadow-brand-500/10 transition-all">Go to Checkout</Link>
                    </div>
                </div>
            )}

            {outlet && (
                <RatingModal
                    isOpen={isRatingModalOpen}
                    onClose={() => setIsRatingModalOpen(false)}
                    outletId={outlet.id}
                    outletName={outlet.name}
                    onRatingSubmitted={() => {
                        showToast(`Thanks for rating ${outlet.name}!`, 'success');
                    }}
                />
            )}
        </div>
    );
};

export default OutletMenu;
