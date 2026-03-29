import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/context/AuthContext';
import { useToast } from '../../hooks/context/ToastContext';
import { FiMapPin, FiArrowRight, FiStar, FiSearch, FiAlertOctagon } from 'react-icons/fi';
import { FadeIn } from '../../components/animations/FadeIn';
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
    for (let i = 0; i < strId.length; i++) {
        hash = strId.charCodeAt(i) + ((hash << 5) - hash);
    }
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
        <div className="relative mb-10 sm:mb-16 px-2 sm:px-4 md:px-0 mt-6 sm:mt-8">
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
        <Link to={`/outlets/${outlet.id}/menu`} className="contain-content group flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-7 p-5 md:p-6 bg-[var(--bg-card)] border border-[var(--border-color)]  rounded-[2rem] transition-all duration-150   relative overflow-hidden">

            <div className={`w-full md:w-48 h-48 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden relative border border-[var(--border-color)] ${isLogo ? brandColor : 'bg-[var(--bg-card)]'}`}>
                <img src={image} loading="lazy" decoding="async" alt={outlet.name} className={`w-full h-full object-cover transition-all duration-150 ${isLogo ? 'object-contain scale-[0.85]' : ''}`} />
                {!outlet.is_open && (
                    <div className="absolute inset-0 bg-[var(--bg-card)]/70 backdrop-blur-sm z-10 flex items-center justify-center p-3 text-center">
                        <div className="bg-[var(--text-primary)] text-[var(--bg-card)] text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                            Closed
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 pr-0 md:pr-6">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight group- transition-colors truncate">
                        {outlet.name}
                    </h3>
                    {outlet.average_rating && outlet.average_rating > 4.5 && (
                        <div className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 flex-shrink-0">
                            <FiStar className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Favorite
                        </div>
                    )}
                </div>

                <p className="text-[var(--text-secondary)] text-base mb-4 line-clamp-2 md:line-clamp-1">
                    A familiar spot for {nameStr.includes('maggi') ? 'comfort noodles' : nameStr.includes('southern') ? 'crispy dosas' : 'quick bites'} near {outlet.location}.
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
                    {outlet.average_rating && (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                <FiStar className="w-3 h-3" />
                            </span>
                            <span className="font-bold">{outlet.average_rating.toFixed(1)}</span>
                        </div>
                    )}
                    {outlet.average_rating && <span className="text-[var(--text-muted)] opacity-50">•</span>}
                    <span className="text-slate-600 dark:text-slate-400 font-bold">{waitTime}</span>
                    <span className="text-[var(--text-muted)] opacity-50">•</span>
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] group- transition-colors">
                        <FiMapPin className="w-4 h-4" />
                        <span className="truncate">{outlet.location}</span>
                    </div>
                </div>
            </div>

            <div className="hidden md:flex flex-shrink-0 items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group- group- group- transition-all shadow-sm">
                    <FiArrowRight className="w-5 h-5" />
                </div>
            </div>
        </Link>
    );
});

const CompactRestaurantList = ({ outlets, title, description, searchTerm }: { outlets: Outlet[], title: string, description?: string, searchTerm?: string }) => {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [claiming, setClaiming] = React.useState(false);

    const handleArea51Click = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            showToast('Log in first to explore classified areas.', 'info');
            return;
        }
        if (claiming || user?.hasExplorerBadge || user.role !== 'STUDENT') return;
        setClaiming(true);
        try {
            await api.post('/users/badge', { type: 'explorer' });
            
            // Hacker matrix rain effect
            const end = Date.now() + 2500;
            const colors = ['#00ff00', '#113311', '#55ff55'];
            (function frame() {
                confetti({
                    particleCount: 8,
                    angle: 270,
                    spread: 180,
                    origin: { x: Math.random(), y: 0 },
                    colors: colors,
                    shapes: ['square'],
                    scalar: 0.8,
                    gravity: 0.8,
                    ticks: 200,
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());

            updateUser({ ...user, hasExplorerBadge: true });
            showToast('🚨 SECURITY BREACH... wait, you unlocked the 🕵️ Urban Explorer Badge!', 'success');
        } catch (error) {
            console.error(error);
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="mb-16 sm:mb-24 mt-10 sm:mt-16 max-w-4xl mx-auto px-2 sm:px-4 md:px-0">
            <div className="mb-6 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">{title}</h2>
                {description && <p className="text-base sm:text-lg text-[var(--text-secondary)]">{description}</p>}
            </div>

            <div className="flex flex-col gap-5">
                {outlets.map((outlet) => (
                    <CompactRestaurantListItem key={outlet.id} outlet={outlet} />
                ))}

                {(searchTerm?.toLowerCase().includes('area 51') || searchTerm?.toLowerCase().includes('classified') || searchTerm?.toLowerCase().includes('staff') || searchTerm?.toLowerCase().includes('area51')) && (
                <div onClick={handleArea51Click} className="contain-content group flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-7 p-5 md:p-6 bg-[#0a0f12] border border-red-900/50 rounded-[2rem] transition-all duration-150 cursor-pointer relative overflow-hidden hover:border-red-500/80 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] mt-10">
                    <div className="w-full md:w-48 h-48 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden relative border border-red-900 bg-black">
                        <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-3 text-center transition-all group-hover:bg-red-900/60">
                            <FiAlertOctagon className="w-8 h-8 text-red-500 mb-2 animate-pulse" />
                            <div className="bg-red-500 text-white text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                                CLASSIFIED
                            </div>
                        </div>
                    </div>
                
                    <div className="flex-1 min-w-0 pr-0 md:pr-6">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-black text-red-50 tracking-tight truncate filter drop-shadow-[0_0_8px_rgba(255,0,0,0.3)]">
                                Area 51 Kitchen (Staff Only)
                            </h3>
                        </div>
                
                        <p className="text-red-400/70 text-base mb-4 font-mono text-xs sm:text-sm tracking-tight leading-relaxed">
                            WARNING: Unauthorized access strictly prohibited. Violators will be expelled.
                        </p>
                
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
                            <span className="text-red-600 font-bold uppercase tracking-widest text-[10px]">Level 4 Clearance Required</span>
                            <span className="text-red-900 opacity-50">•</span>
                            <div className="flex items-center gap-1.5 text-red-500/50 transition-colors">
                                <FiMapPin className="w-4 h-4" />
                                <span className="truncate filter blur-[2px] select-none">Basement Level 3</span>
                            </div>
                        </div>
                    </div>
                </div>
                )}

            </div>
        </div>
    );
};

const GridFoodListItem = React.memo(({ item }: { item: TopFoodItem }) => {
    return (
        <Link to={`/outlets/${item.outlet_id}/menu`} className="contain-content group flex flex-col justify-between w-[220px] md:w-[260px] flex-shrink-0 p-5 p bg-[var(--bg-card)] border border-[var(--border-color)]  rounded-[2rem] transition-all duration-150   relative overflow-hidden snap-start">

            <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 flex-shrink-0 rounded-2xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-3xl shadow-inner border border-amber-100 dark:border-amber-800/50">
                    {item.is_veg === false ? '🍕' : '🥗'}
                </div>
                {item.is_veg !== undefined && (
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                )}
            </div>

            <div className="flex-1">
                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight group- transition-colors line-clamp-2 leading-tight mb-2">
                    {item.name}
                </h3>

                <p className="text-[var(--text-secondary)] text-xs mb-4 font-medium line-clamp-1">
                    From <span className="font-bold text-[var(--text-primary)] group-">{item.outlet_name}</span>
                </p>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 mt-auto">
                <div className="flex items-center gap-2 text-sm font-medium">
                    {item.price !== undefined && (
                        <span className="text-[var(--text-primary)] font-black text-lg tracking-tight">₹{item.price}</span>
                    )}
                </div>

                <div className="flex items-center">
                    {item.average_rating ? (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                <FiStar className="w-3 h-3 fill-amber-500 text-amber-500" />
                            </span>
                            <span className="font-black text-sm">{item.average_rating.toFixed(1)}</span>
                        </div>
                    ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-input)] px-2.5 py-1.5 rounded-lg">New</span>
                    )}
                </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group- transition-opacity duration-150 hidden md:block">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                    <FiArrowRight className="w-3 h-3" />
                </div>
            </div>
        </Link>
    );
});

const HomepageSections = ({ outlets }: { outlets: Outlet[] }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<string | null>(null); // NEW: quick filter pill state
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchTerm && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [searchTerm]);

    const topFoodItems = useMemo(() => outlets
        .flatMap(outlet => (outlet.menu_items || []).map(item => ({ ...item, outlet_id: outlet.id, outlet_name: outlet.name })))
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 10), [outlets]);

    const gridOutlets = useMemo(() => {
        return outlets.filter(o => {
        const name = o.name.toLowerCase();
        const menuString = o.menu_items?.map(m => m.name.toLowerCase()).join(' ') || '';

        if (searchTerm) {
            const st = searchTerm.toLowerCase();
            if (!name.includes(st) && !o.location.toLowerCase().includes(st) && !menuString.includes(st)) {
                return false;
            }
        }

        if (quickFilter) {
            if (quickFilter === 'Fast Delivery' && o.current_status === 'BUSY') return false;
            if (quickFilter === 'Top Rated' && (o.average_rating || 0) < 4.0) return false;
            if (quickFilter === 'Veg Only') {
                const servesMeat = o.menu_items?.some(m => m.is_veg === false);
                if (servesMeat) return false;
            }
        }

        if (selectedCategory) {
            const cat = selectedCategory.toLowerCase();

            const isMatch = (str: string) => {
                if (cat === 'pizza') return str.includes('pizza') || str.includes('italian');
                if (cat === 'chinese' || cat === 'momos') return str.includes('chow') || str.includes('chinese') || str.includes('asian') || str.includes('noodle') || str.includes('momo') || str.includes('manchurian');
                if (cat === 'south indian') return str.includes('southern') || str.includes('dosa') || str.includes('idli') || str.includes('vada');
                if (cat === 'burgers') return str.includes('burger') || str.includes('fast');
                if (cat === 'north indian') return str.includes('dhaba') || str.includes('punjabi') || str.includes('maggi') || str.includes('chole') || str.includes('paratha') || str.includes('tikka');
                if (cat === 'desserts') return str.includes('sweet') || str.includes('ice') || str.includes('choco') || str.includes('cookie');
                return false;
            };

            const isKnownMapped = ['pizza', 'chinese', 'momos', 'south indian', 'burgers', 'north indian', 'desserts'].includes(cat);
            if (isKnownMapped) {
                if (!isMatch(name) && !isMatch(menuString)) return false;
            } else {
                let hash = 0;
                const strId = String(o.id);
                for (let i = 0; i < strId.length; i++) hash = strId.charCodeAt(i) + ((hash << 5) - hash);
                if (Math.abs(hash) % CATEGORIES.length !== CATEGORIES.findIndex(c => c.name === selectedCategory)) return false;
            }
        }

        return true;
    });
    }, [outlets, searchTerm, quickFilter, selectedCategory]);

    return (
        <>
            <div className="relative min-h-[80vh] sm:min-h-[85vh] flex flex-col justify-center px-4 sm:px-6 md:px-8 max-w-7xl mx-auto z-10 overscroll-none py-8 sm:py-0">
                <FadeIn delay={0.1}>
                    <h1 className="text-[clamp(2.5rem,10vw,7rem)] font-black text-[var(--text-primary)] mb-4 sm:mb-6 drop-shadow-lg leading-[0.95] tracking-tight">
                        Bigger<br/>than hunger.
                        <span className="block text-brand-500 opacity-100 mt-2 drop-shadow-md">Closer than a line.</span>
                    </h1>
                </FadeIn>
                
                <FadeIn delay={0.3}>
                    <p className="text-base sm:text-lg md:text-xl text-[var(--text-primary)] mb-8 sm:mb-12 max-w-3xl font-bold drop-shadow-md">
                        Connect with campus vendors so your food is ready when you are.
                    </p>
                </FadeIn>

                <FadeIn delay={0.5} className="w-full max-w-2xl relative z-20">
                    <div className="relative flex items-center bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-[2rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 shadow-2xl focus-within:ring-4 focus-within:ring-brand-500/20 transition-all duration-300">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-brand-500 text-white ml-1 sm:ml-2 shadow-lg flex-shrink-0">
                            <FiSearch className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <input
                            type="text"
                            placeholder="Craving something? Search here..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] px-3 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="pr-4 sm:pr-6 text-[var(--text-muted)] transition-colors font-bold uppercase tracking-widest text-xs sm:text-sm flex-shrink-0">
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-6 ml-2">
                        {['Fast Delivery ⚡', 'Top Rated ⭐', 'Veg Only 🥬'].map(filter => {
                            const internalFilter = filter.replace(/ ⭐| ⚡| 🥬/, '');
                            const isActive = quickFilter === internalFilter;

                            return (
                                <button
                                    key={filter}
                                    onClick={() => setQuickFilter(isActive ? null : internalFilter)}
                                    className={`px-6 py-3 rounded-[2rem] text-sm font-bold tracking-wide transition-all duration-300 ${isActive
                                        ? 'bg-brand-500 text-white shadow-lg rotate-[-2deg] scale-105'
                                        : 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--text-primary)] border border-[var(--glass-border)]  dark: '
                                        }`}
                                >
                                    {filter} {isActive && <span className="ml-1 opacity-70">×</span>}
                                </button>
                            );
                        })}
                    </div>
                </FadeIn>
            </div>

            <FadeIn delay={0.2} direction="up" fullWidth>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 z-20 relative bg-[var(--bg-card)]/40 backdrop-blur-sm rounded-[3rem] sm:rounded-[4rem] pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 mt-8 sm:mt-10 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-20px_40px_rgba(0,0,0,0.2)]">
                    <CategoryGallery
                        selectedCategory={selectedCategory}
                        onSelectCategory={(name) => setSelectedCategory(name === selectedCategory ? null : name)}
                    />
                </div>
            </FadeIn>

            {topFoodItems.length > 0 && (
                <FadeIn delay={0.1} fullWidth>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 mt-4 sm:mt-6 mb-4 sm:mb-6 z-20 relative bg-[var(--bg-card)]/40 backdrop-blur-sm rounded-[3rem] sm:rounded-[4rem] py-8 sm:py-10">
                        <div className="mb-8 sm:mb-12">
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[var(--text-primary)] tracking-tighter mb-4">Campus<br/>Favorites</h2>
                        </div>

                        <div className="flex gap-6 w-full overflow-x-auto pb-12 pt-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 -mx-4">
                            {topFoodItems.map((item) => (
                                <div key={`${item.outlet_id}-${item.id}`} className="snap-center drop-shadow-2xl">
                                    <GridFoodListItem item={item as TopFoodItem} />
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            )}

            <FadeIn delay={0.1} fullWidth>
                <div ref={resultsRef} className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 mt-4 sm:mt-6 pb-20 sm:pb-32 pt-10 sm:pt-16 z-20 relative bg-[var(--bg-card)]/40 backdrop-blur-sm rounded-[3rem] sm:rounded-[4rem]">
                    <CompactRestaurantList
                        outlets={gridOutlets}
                        title={selectedCategory ? `Spots for ${selectedCategory}` : "Explore all venues"}
                        description={selectedCategory ? "Filtered down to match your craving." : "A curated list of all available kitchens, just for you."}
                        searchTerm={searchTerm}
                    />

                    {gridOutlets.length === 0 && (
                        <div className="text-center py-24">
                            <p className="text-2xl font-bold text-[var(--text-muted)]">No vendors found in this orbit.</p>
                            <button onClick={() => { setSelectedCategory(null); setQuickFilter(null); setSearchTerm(''); }} className="mt-8 px-8 py-4 bg-brand-500 rounded-full text-white font-black  transition-transform shadow-xl">Reset Scanners</button>
                        </div>
                    )}
                </div>
            </FadeIn>
        </>
    );
};

const OutletList = () => {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const outletRes = await api.get('/outlets');
                const sortedOutlets = [...outletRes.data].reverse();
                setOutlets(sortedOutlets);
            } catch (error) {
                console.error("Failed to fetch outlets", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-12 animate-pulse mt-4 max-w-[1240px] mx-auto px-4">
                <div className="h-8 bg-[var(--bg-card)] rounded-lg w-64 mb-6 border border-[var(--border-color)]"></div>
                <div className="flex gap-6 overflow-hidden pb-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex-shrink-0"></div>)}
                </div>

                <div className="my-10 h-px w-full bg-[var(--border-color)]"></div>

                <div className="h-8 bg-[var(--bg-card)] rounded-lg w-80 mb-6 border border-[var(--border-color)]"></div>
                <div className="flex gap-6 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-[320px] aspect-[4/3] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex-shrink-0"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (outlets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-none max-w-[1240px] mx-auto min-h-[50vh]">
                <div className="w-24 h-24 bg-[var(--bg-input)] rounded-[2rem] rounded-tl-sm flex items-center justify-center mb-8 rotate-3">
                    <FiMapPin className="w-10 h-10 text-[var(--text-secondary)]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-4 font-heading tracking-tight">Looks a bit empty here</h2>
                <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto leading-relaxed">
                    We're currently setting up the campus dining network. Hang tight, good food is on the horizon.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-none space-y-4 pb-10 mt-4 max-w-[1240px] mx-auto px-2">
            <HomepageSections outlets={outlets} />
            <div className="text-center pt-4 pb-10">
                <p className="text-[var(--text-muted)] font-medium">You've reached the end of the list</p>
            </div>
        </div>
    );
};

export default OutletList;
