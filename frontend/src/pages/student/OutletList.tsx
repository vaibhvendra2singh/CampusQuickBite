import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiSearch, FiMapPin, FiStar, FiArrowRight, FiX, FiShield } from 'react-icons/fi';
import { FadeIn } from '../../components/animations/FadeIn';
import CampusHeatmap from '../../components/student/CampusHeatmap';
import { useAuth } from '../../hooks/context/AuthContext';
import { useToast } from '../../hooks/context/ToastContext';
import MatrixRain from '../../components/animations/MatrixRain';
import confetti from 'canvas-confetti';

interface TopFoodItem {
    id: number;
    name: string;
    is_veg?: boolean;
    price?: number;
    average_rating?: number;
    outlet_id: number;
    outlet_name: string;
}

interface Outlet {
    id: number;
    name: string;
    location: string;
    average_rating?: number;
    rating_count?: number;
    is_open?: boolean;
    owner?: { id: number };
    current_status?: 'FAST' | 'MODERATE' | 'BUSY';
    menu_items?: { id: number, name: string, is_veg?: boolean, price?: number, average_rating?: number }[];
}

const CATEGORIES = [
    { name: 'North Indian', icon: '🥘', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' },
    { name: 'Pizza', icon: '🍕', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' },
    { name: 'Burgers', icon: '🍔', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' },
    { name: 'Chinese', icon: '🍜', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200' },
    { name: 'Desserts', icon: '🍰', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200' },
    { name: 'Momos', icon: '🥟', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' },
    { name: 'South Indian', icon: '🍛', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' },
];

const getVendorImage = (outletName: string, id: number | string) => {
    const nameStr = outletName.toLowerCase();
    if (nameStr.includes('maggi')) return '/vendors/img1.jpg';
    if (nameStr.includes('southern')) return '/vendors/img2.jpg';
    if (nameStr.includes('chow')) return '/vendors/img3.jpg';
    if (nameStr.includes('snap')) return '/vendors/img4.jpg';

    const images = [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&q=80'
    ];
    let hash = 0;
    const strId = String(id);
    for (let i = 0; i < strId.length; i++) hash = strId.charCodeAt(i) + ((hash << 5) - hash);
    return images[Math.abs(hash) % images.length];
};

const CategoryPill = ({ category, isSelected, onClick, index }: { category: { name: string, icon: string, color: string }, isSelected: boolean, onClick: () => void, index: number }) => {
    const isOdd = index % 2 !== 0;
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 sm:gap-3 transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] flex-shrink-0 group/cat border-2 ${isSelected ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-card)] shadow-md rotate-1' : 'border-transparent bg-[var(--bg-card)]  text-[var(--text-primary)] '} ${isOdd ? 'rounded-[2rem] rounded-tr-lg py-2 sm:py-3 px-4 sm:px-6' : 'rounded-[2rem] rounded-bl-lg py-2 sm:py-2.5 px-3 sm:px-5'}`}
        >
            <span className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${isSelected ? 'bg-[var(--bg-card)]/20' : category.color} text-lg sm:text-xl transition-all group-hover/cat:scale-110`}>
                {category.icon}
            </span>
            <span className={`font-semibold text-sm sm:text-lg tracking-tight ${isSelected ? 'text-[var(--bg-card)]' : 'text-[var(--text-secondary)] group-hover/cat:text-[var(--text-primary)]'}`}>{category.name}</span>
        </button>
    );
};

const CategoryGallery = ({ selectedCategory, onSelectCategory }: { selectedCategory: string | null, onSelectCategory: (name: string) => void }) => {
    return (
        <div className="relative mb-10 sm:mb-16 mt-6 sm:mt-8">
            <div className="max-w-xl mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight font-heading">What are you craving?</h2>
                <p className="text-[var(--text-muted)] text-base sm:text-lg mt-2 font-medium leading-relaxed">Pick a mood, we'll find the food.</p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-4 pt-2">
                {CATEGORIES.map((cat, idx) => (
                    <CategoryPill
                        key={cat.name}
                        category={cat}
                        index={idx}
                        isSelected={selectedCategory === cat.name}
                        onClick={() => onSelectCategory(cat.name)}
                    />
                ))}
            </div>
        </div>
    );
};

const CompactRestaurantListItem = React.memo(({ outlet }: { outlet: Outlet }) => {
    const image = getVendorImage(outlet.name, outlet.id);
    const waitTime = outlet.current_status === 'BUSY' ? 'Usually 30-45m' : outlet.current_status === 'MODERATE' ? 'About 15-20m' : 'Ready in 10-15m';

    const nameStr = outlet.name.toLowerCase();
    const isLogo = nameStr.includes('maggi') || nameStr.includes('chow') || nameStr.includes('snap') || nameStr.includes('southern');
    const brandColor = nameStr.includes('southern') ? 'bg-[#053d18]' : (nameStr.includes('maggi') || nameStr.includes('chow') || nameStr.includes('snap')) ? 'bg-white' : 'bg-[var(--bg-card)]';

    return (
        <Link to={`/outlets/${outlet.id}/menu`} className="contain-content group flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-7 p-5 md:p-6 bg-[var(--bg-card)] border border-[var(--border-color)]  rounded-[2rem] transition-all duration-150   relative overflow-hidden hover:border-brand-500 shadow-sm">
            <div className={`w-full md:w-36 h-36 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden relative border border-[var(--border-color)] ${isLogo ? brandColor : 'bg-[var(--bg-card)]'}`}>
                <img src={image} loading="lazy" decoding="async" alt={outlet.name} className={`w-full h-full object-cover transition-all duration-150 ${isLogo ? 'object-contain scale-[0.85]' : ''}`} />
            </div>

            <div className="flex-1 min-w-0 pr-0 md:pr-6">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight group- transition-colors truncate">
                        {outlet.name}
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] group- transition-colors uppercase tracking-widest text-[10px] font-black">
                        <FiMapPin className="w-4 h-4" />
                        <span className="truncate">{outlet.location}</span>
                    </div>
                    <span className="text-[var(--text-muted)] opacity-50">•</span>
                    <span className="text-brand-500 dark:text-brand-400 font-black uppercase tracking-widest text-[10px]">{waitTime}</span>
                </div>
            </div>

            <div className="hidden md:flex flex-shrink-0 items-center justify-center">
                <FiArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-brand-500 transition-colors" />
            </div>
        </Link>
    );
});

const GridFoodListItem = React.memo(({ item }: { item: TopFoodItem }) => {
    return (
        <Link to={`/outlets/${item.outlet_id}/menu`} className="contain-content group flex flex-col justify-between w-[220px] md:w-[260px] flex-shrink-0 p-5 bg-[var(--bg-card)] border border-[var(--border-color)]  rounded-[2rem] transition-all duration-150   relative overflow-hidden snap-start hover:border-brand-500">
            <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 flex-shrink-0 rounded-2xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-3xl shadow-inner border border-amber-100 dark:border-amber-800/50">
                    {item.is_veg === false ? '🥩' : '🥗'}
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight group- transition-colors line-clamp-2 leading-tight mb-2">
                    {item.name}
                </h3>
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] mb-4">From {item.outlet_name}</p>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 mt-auto">
                <span className="text-brand-500 font-extrabold text-lg tracking-tight">₹{item.price}</span>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <FiStar className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="font-black text-sm">{item.average_rating?.toFixed(1) || '0.0'}</span>
                </div>
            </div>
        </Link>
    );
});

const HomepageSections = ({ outlets }: { outlets: Outlet[] }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [quickFilter, setQuickFilter] = useState<string | null>(null);
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [showMatrix, setShowMatrix] = useState(false);
    const [isClaimingExplorer, setIsClaimingExplorer] = useState(false);

    const isSecretTerm = useMemo(() => {
        const t = searchTerm.toLowerCase().trim();
        return t === 'area 51' || t === 'classified' || t === 'staff';
    }, [searchTerm]);

    const handleExplorerClick = async () => {
        if (!user || user.role !== 'STUDENT' || user.hasExplorerBadge || isClaimingExplorer) return;
        
        setIsClaimingExplorer(true);
        setShowMatrix(true);
        
        try {
            await api.post('/users/badge', { type: 'explorer' });
            
            // Visual Celebration
            const end = Date.now() + 2000;
            const colors = ['#10b981', '#059669', '#34d399'];
            (function frame() {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: colors });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: colors });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());

            if (updateUser) updateUser({ ...user, hasExplorerBadge: true });
            if (showToast) showToast('🚨 Urban Explorer Badge Unlocked! (+50 XP)', 'success');
        } catch (err) {
            console.error(err);
        } finally {
            setIsClaimingExplorer(false);
        }
    };

    const topFoodItems = useMemo(() => outlets
        .flatMap(outlet => (outlet.menu_items || []).map(item => ({ ...item, outlet_id: outlet.id, outlet_name: outlet.name })))
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 10), [outlets]);

    const finalOutlets = useMemo(() => outlets.filter(o => {
        const name = o.name.toLowerCase();
        const searchTermMatches = !searchTerm || name.includes(searchTerm.toLowerCase()) || o.menu_items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const quickFilterMatches = !quickFilter || (quickFilter === 'Fast Delivery' && o.current_status !== 'BUSY');
        
        let categoryMatches = true;
        if (selectedCategory) {
            const cat = selectedCategory.toLowerCase();
            const keywords: Record<string, string[]> = {
                'north indian': ['thali', 'paneer', 'roti', 'dal', 'paratha', 'chole', 'kulcha', 'biryani', 'masala'],
                'south indian': ['dosa', 'idli', 'vada', 'sambar', 'uttapam', 'southern', 'coconut', 'chutney'],
                'chinese': ['noodles', 'chow', 'manchurian', 'fried rice', 'schezwan', 'chinese', 'dimsum'],
                'pizza': ['pizza', 'pasta', 'italian', 'cheese', 'garlic bread'],
                'burgers': ['burger', 'sandwich', 'fries', 'patty', 'bun'],
                'desserts': ['cake', 'ice cream', 'pastry', 'shake', 'beverage', 'dessert', 'sweet'],
                'momos': ['momo', 'dimsum', 'dumpling']
            };
            
            const catKeywords = keywords[cat] || [cat];
            const nameMatches = catKeywords.some(k => name.includes(k));
            const menuMatches = o.menu_items?.some(item => {
                const iName = item.name.toLowerCase();
                return catKeywords.some(k => iName.includes(k));
            });
            
            categoryMatches = nameMatches || (menuMatches ?? false);
        }

        return searchTermMatches && quickFilterMatches && categoryMatches;
    }), [outlets, searchTerm, quickFilter, selectedCategory]);

    return (
        <div className="relative w-full min-h-screen">
            {showMatrix && <MatrixRain onComplete={() => setShowMatrix(false)} duration={3500} />}
            
            {/* RADAR WIDGET - TOTAL LEFT HUD */}
            <aside className="fixed left-6 top-32 bottom-10 w-[160px] hidden xl:block z-[60] overflow-y-auto custom-scrollbar" style={{ maskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)' }}>
                <FadeIn delay={0.2} direction="right">
                    <div className="bg-[var(--bg-card)]/30 backdrop-blur-3xl rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/40">
                            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] opacity-80">Campus Radar</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest opacity-80">Live Signal</span>
                            </div>
                        </div>
                        <div className="p-2 flex-1">
                            <CampusHeatmap outlets={outlets} compact />
                        </div>
                    </div>
                </FadeIn>
            </aside>

            {/* MAIN CONTENT AREA - CENTERED */}
            <main className="w-full max-w-4xl mx-auto px-4 py-12 sm:py-20 relative z-10">
                {/* Hero Header */}
                <div className="w-full text-center mb-16">
                    <FadeIn delay={0.1}>
                        <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black text-[var(--text-primary)] leading-[0.9] tracking-tighter mb-6">
                            Bigger than hunger.<br />
                            <span className="text-brand-500 drop-shadow-md">Closer than a line.</span>
                        </h1>
                        <p className="text-xl text-[var(--text-muted)] font-medium max-w-2xl mx-auto leading-relaxed">
                            Skip the wait. Real-time patterns, instant clicks, and zero friction for SRM campus.
                        </p>
                    </FadeIn>
                </div>

                {/* Search Bar - Center Aligned */}
                <div className="w-full max-w-2xl mx-auto mb-20">
                    <div className={`relative flex flex-col bg-[var(--bg-card)]/40 backdrop-blur-2xl border border-[var(--border-color)] p-2 shadow-2xl transition-all duration-500 overflow-hidden ${searchTerm ? 'rounded-[2.5rem]' : 'rounded-full'}`}>
                        <div className="flex items-center w-full">
                            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-brand-500 text-white ml-2 shadow-xl shadow-brand-500/20 group-hover:scale-105 transition-transform">
                                <FiSearch className="w-6 h-6" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search restaurants or dishes..."
                                value={searchTerm}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] px-6 py-6 text-xl font-bold placeholder:text-[var(--text-secondary)] placeholder:opacity-50"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="mr-6 p-2 hover:bg-brand-500/10 rounded-full text-[var(--text-muted)] transition-colors">
                                    <FiX className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {/* Real-time Integrated Results - PUSHING CONTENT DOWN */}
                        {searchTerm && isInputFocused && (
                            <div className="w-full p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent mb-6 opacity-50" />
                                
                                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto px-2 custom-scrollbar pb-6">
                                    {/* Secret Kitchen Section */}
                                    {isSecretTerm && (
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4 px-4">Restricted Personnel Only</p>
                                            <div 
                                                onClick={handleExplorerClick}
                                                className="flex items-center gap-5 p-4 bg-red-500/10 dark:bg-red-500/5 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 rounded-3xl transition-all group cursor-pointer animate-pulse-subtle shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                            >
                                                <div className="w-14 h-14 flex-shrink-0 bg-red-500 rounded-2xl p-2.5 shadow-lg flex items-center justify-center text-white">
                                                    <FiShield className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-black text-lg text-red-500 uppercase tracking-tight">Area 51 Kitchen (Staff Only)</p>
                                                        <FiArrowRight className="text-red-500 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                    <p className="text-xs text-red-500 font-bold tracking-tight">CLASSIFIED ASSET • [RESTRICTED ACCESS]</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Restaurants Section */}
                                    {finalOutlets.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-4 px-4">Venues Found</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {finalOutlets.slice(0, 4).map(o => (
                                                    <Link key={o.id} to={`/outlets/${o.id}/menu`} className="flex items-center gap-5 p-4 bg-white/5 dark:bg-black/20 hover:bg-brand-500/10 border border-transparent hover:border-brand-500/20 rounded-3xl transition-all group">
                                                        <div className="w-14 h-14 flex-shrink-0 bg-white rounded-2xl p-2.5 shadow-md overflow-hidden flex items-center justify-center">
                                                            <img 
                                                                src={getVendorImage(o.name, o.id)} 
                                                                alt={o.name}
                                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-black text-lg text-[var(--text-primary)] group-hover:text-brand-500 transition-colors uppercase tracking-tight">{o.name}</p>
                                                                <FiArrowRight className="text-brand-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                                                            </div>
                                                            <p className="text-xs text-[var(--text-muted)] font-bold tracking-tight">{o.location} • {o.current_status === 'BUSY' ? '⚠️ High Traffic' : '⚡ Instant Orders'}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Food Items Section */}
                                    {(() => {
                                        const foodResults = outlets.flatMap(o => (o.menu_items || []).filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(i => ({ ...i, outlet_id: o.id, outlet_name: o.name }))).slice(0, 6);
                                        return foodResults.length > 0 ? (
                                            <div>
                                                <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-4 px-4">Menu Items</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {foodResults.map(item => (
                                                        <Link key={`${item.outlet_id}-${item.id}`} to={`/outlets/${item.outlet_id}/menu`} className="flex items-center gap-4 p-4 bg-white/5 dark:bg-black/20 hover:bg-brand-500/10 border border-transparent hover:border-brand-500/20 rounded-3xl transition-all group">
                                                            <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-inner flex items-center justify-center">
                                                                <span className="text-xl">🍟</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[var(--text-primary)] leading-tight">{item.name}</p>
                                                                <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest mt-1">₹{item.price} • {item.outlet_name}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-3 mt-10">
                        {['Fast Delivery ⚡', 'Top Rated ⭐'].map(filter => {
                            const filterVal = filter.split(' ')[0];
                            const isActive = quickFilter === filterVal;
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setQuickFilter(isActive ? null : filterVal)}
                                    className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 ${isActive ? 'bg-brand-500 text-white border-brand-500 shadow-2xl shadow-brand-500/40 ring-4 ring-brand-500/10' : 'bg-white/5 border border-[var(--border-color)] text-[var(--text-muted)] hover:border-brand-500/50 hover:bg-brand-500/5 backdrop-blur-sm'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-brand-500'} animate-pulse`} />
                                    {filter}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Favorites Shelf */}
                {topFoodItems.length > 0 && (
                    <div className="w-full mb-20">
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-8">Trending Near You</h2>
                        <div className="flex gap-4 overflow-x-auto pb-6 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {topFoodItems.map(item => (
                                <GridFoodListItem key={`${item.outlet_id}-${item.id}`} item={item as TopFoodItem} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories */}
                <div className="w-full mb-20">
                    <CategoryGallery selectedCategory={selectedCategory} onSelectCategory={(name) => setSelectedCategory(selectedCategory === name ? null : name)} />
                </div>

                {/* Restaurant List */}
                <div className="w-full">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-10">Explore All Venues</h2>
                    <div className="flex flex-col gap-6 w-full">
                        {finalOutlets.map(o => (
                            <CompactRestaurantListItem key={o.id} outlet={o} />
                        ))}
                    </div>
                </div>

                {finalOutlets.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-2xl font-black text-[var(--text-muted)]">No vendors found in this orbit.</p>
                        <button onClick={() => { setSearchTerm(''); setQuickFilter(null); setSelectedCategory(null); }} className="mt-8 px-8 py-3 bg-brand-500 rounded-full text-white font-black hover:scale-105 transition-transform shadow-xl">Reset Scanners</button>
                    </div>
                )}
            </main>
        </div>
    );
};

const OutletList = () => {
    const [outlets, setOutlets] = useState<Outlet[]>(() => {
        const cached = localStorage.getItem('cached_outlets');
        return cached ? JSON.parse(cached) : [];
    });
    const [isLoading, setIsLoading] = useState(!outlets.length);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/outlets');
                const data = [...res.data].reverse();
                setOutlets(data);
                localStorage.setItem('cached_outlets', JSON.stringify(data));
            } catch (err) { 
                console.error(err); 
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading && !outlets.length) return (
        <div className="pt-40 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
            <p className="font-black animate-pulse text-[var(--text-muted)] tracking-widest uppercase text-xs">Scanning Campus...</p>
        </div>
    );

    return (
        <div className="pb-20 animate-none">
            <HomepageSections outlets={outlets} />
        </div>
    );
};

export default OutletList;
