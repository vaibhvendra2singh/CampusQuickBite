import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiMapPin, FiArrowRight, FiStar, FiSearch } from 'react-icons/fi';

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
    // Adding slight asymmetry and varied sizing based on index
    const isOdd = index % 2 !== 0;
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] flex-shrink-0 group/cat border-2 ${isSelected ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md rotate-1' : 'border-transparent bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:-rotate-1'} ${isOdd ? 'rounded-[2rem] rounded-tr-lg py-3 px-6' : 'rounded-[2rem] rounded-bl-lg py-2.5 px-5'}`}
        >
            <span className={`flex items-center justify-center w-10 h-10 rounded-full ${isSelected ? 'bg-[var(--bg-primary)]/20' : category.color} text-xl transition-all group-hover/cat:scale-110`}>
                {category.icon}
            </span>
            <span className={`font-semibold text-lg tracking-tight ${isSelected ? 'text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] group-hover/cat:text-[var(--text-primary)]'}`}>{category.name}</span>
        </button>
    );
};

const CategoryGallery = ({ selectedCategory, onSelectCategory }: { selectedCategory: string | null, onSelectCategory: (name: string) => void }) => {
    return (
        <div className="relative mb-16 px-4 md:px-0 mt-8">
            <div className="max-w-xl mb-6">
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight font-heading">What are you craving?</h2>
                <p className="text-[var(--text-muted)] text-lg mt-2 font-medium leading-relaxed">Pick a mood, we'll find the food. No rushing, just browsing.</p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
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

const CompactRestaurantListItem = ({ outlet }: { outlet: Outlet }) => {
    const image = getVendorImage(outlet.name, outlet.id);
    const waitTime = outlet.current_status === 'BUSY' ? 'Usually 30-45m' : outlet.current_status === 'MODERATE' ? 'About 15-20m' : 'Ready in 10-15m';

    const nameStr = outlet.name.toLowerCase();
    const isLogo = nameStr.includes('maggi') || nameStr.includes('chow') || nameStr.includes('snap') || nameStr.includes('southern');

    const brandColor = nameStr.includes('southern') ? 'bg-[#053d18]' : nameStr.includes('maggi') ? 'bg-[#bd0f22]' : 'bg-[var(--bg-card)]';

    return (
        <Link to={`/outlets/${outlet.id}/menu`} className="group flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-7 p-5 md:p-6 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-brand-500/40 rounded-[2rem] transition-all duration-150 hover:shadow-xl hover:shadow-[var(--shadow-color)] relative overflow-hidden">

            <div className={`w-full md:w-48 h-48 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden relative border border-[var(--border-color)] ${isLogo ? brandColor : 'bg-[var(--bg-card)]'}`}>
                <img src={image} loading="lazy" alt={outlet.name} className={`w-full h-full object-cover transition-all duration-150 ${isLogo ? 'object-contain scale-[0.65] p-2' : ''}`} />
                {!outlet.is_open && (
                    <div className="absolute inset-0 bg-[var(--bg-primary)]/70 backdrop-blur-sm z-10 flex items-center justify-center p-3 text-center">
                        <div className="bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                            Closed
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 pr-0 md:pr-6">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-brand-500 transition-colors truncate">
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
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] group-hover:text-brand-500 transition-colors">
                        <FiMapPin className="w-4 h-4" />
                        <span className="truncate">{outlet.location}</span>
                    </div>
                </div>
            </div>

            <div className="hidden md:flex flex-shrink-0 items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-brand-500 group-hover:border-brand-500 group-hover:text-white transition-all shadow-sm">
                    <FiArrowRight className="w-5 h-5" />
                </div>
            </div>
        </Link>
    );
};

const CompactRestaurantList = ({ outlets, title, description }: { outlets: Outlet[], title: string, description?: string }) => {
    return (
        <div className="mb-24 mt-16 max-w-4xl mx-auto px-4 md:px-0">
            <div className="mb-10">
                <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">{title}</h2>
                {description && <p className="text-lg text-[var(--text-secondary)]">{description}</p>}
            </div>

            <div className="flex flex-col gap-5">
                {outlets.map((outlet) => (
                    <CompactRestaurantListItem key={outlet.id} outlet={outlet} />
                ))}
            </div>
        </div>
    );
};

const GridFoodListItem = ({ item }: { item: TopFoodItem }) => {
    return (
        <Link to={`/outlets/${item.outlet_id}/menu`} className="group flex flex-col justify-between w-[220px] md:w-[260px] flex-shrink-0 p-5 p bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-[2rem] transition-all duration-150 hover:shadow-xl hover:shadow-[var(--shadow-color)] relative overflow-hidden snap-start">

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
                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-amber-500 transition-colors line-clamp-2 leading-tight mb-2">
                    {item.name}
                </h3>

                <p className="text-[var(--text-secondary)] text-xs mb-4 font-medium line-clamp-1">
                    From <span className="font-bold text-[var(--text-primary)] group-hover:underline">{item.outlet_name}</span>
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

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hidden md:block">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                    <FiArrowRight className="w-3 h-3" />
                </div>
            </div>
        </Link>
    );
};

const HomepageSections = ({ outlets }: { outlets: Outlet[] }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<string | null>(null); // NEW: quick filter pill state

    const topFoodItems = outlets
        .flatMap(outlet => (outlet.menu_items || []).map(item => ({ ...item, outlet_id: outlet.id, outlet_name: outlet.name })))
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 10);
    // Removed listRef and scroll function as per instruction

    const gridOutlets = outlets.filter(o => {
        const name = o.name.toLowerCase();
        const menuString = o.menu_items?.map(m => m.name.toLowerCase()).join(' ') || '';

        // 1. Text Search Filter
        if (searchTerm) {
            const st = searchTerm.toLowerCase();
            if (!name.includes(st) && !o.location.toLowerCase().includes(st) && !menuString.includes(st)) {
                return false;
            }
        }

        // 2. Quick Filter Pills 
        if (quickFilter) {
            if (quickFilter === 'Fast Delivery' && o.current_status === 'BUSY') return false;
            if (quickFilter === 'Top Rated' && (o.average_rating || 0) < 4.0) return false;
            if (quickFilter === 'Veg Only') {
                // Now using real backend menu data
                const servesMeat = o.menu_items?.some(m => m.is_veg === false);
                if (servesMeat) return false;
            }
        }

        // 3. Category Filter
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
                // Check if either the outlet name matches, OR any of its menu items match the category keywords
                if (!isMatch(name) && !isMatch(menuString)) return false;
            } else {
                // Fallback Hash for totally custom categories
                let hash = 0;
                const strId = String(o.id);
                for (let i = 0; i < strId.length; i++) hash = strId.charCodeAt(i) + ((hash << 5) - hash);
                if (Math.abs(hash) % CATEGORIES.length !== CATEGORIES.findIndex(c => c.name === selectedCategory)) return false;
            }
        }

        return true;
    });

    return (
        <>
            {/* Expressive, Humanized Hero Section with Glass Box */}
            <div className="relative mt-12 mb-20 px-8 py-12 md:p-16 max-w-4xl mx-auto flex flex-col bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3.5rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/5 rounded-full translate-y-24 -translate-x-24 blur-3xl opacity-30"></div>

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                        <span className="relative flex h-2 w-2">
                            <span className=" absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Kitchens are active</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight text-[var(--text-primary)] font-heading">
                        Order ahead. Skip the line.
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-xl leading-relaxed">
                        Connect with campus vendors so your food is ready when you are. Simple, honest, and built for you.
                    </p>

                    <div className="relative max-w-2xl group mb-8">
                        <div className="relative flex items-center bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[2.5rem] rounded-tl-xl p-2 shadow-sm focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 transition-all duration-150 hover:shadow-md">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-input)] ml-2 text-[var(--text-muted)]">
                                <FiSearch className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Craving a burger? Feeling like tea?"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-5 py-4 text-lg font-medium"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="pr-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Conversational Filter Chips */}
                    <div className="flex flex-wrap items-center gap-3">
                        {['Only the fastest ⚡', 'Highly rated ⭐', 'Pure veg 🥬'].map(filter => {
                            const internalFilter = filter === 'Only the fastest ⚡' ? 'Fast Delivery' : filter === 'Highly rated ⭐' ? 'Top Rated' : 'Veg Only';
                            const isActive = quickFilter === internalFilter;

                            return (
                                <button
                                    key={filter}
                                    onClick={() => setQuickFilter(isActive ? null : internalFilter)}
                                    className={`px-5 py-2.5 rounded-[2rem] text-base font-medium transition-all duration-150 ease-out ${isActive
                                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md rotate-[-2deg]'
                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] border border-[var(--border-color)] '
                                        }`}
                                >
                                    {filter} {isActive && <span className="ml-1 opacity-70">×</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-0">
                <CategoryGallery
                    selectedCategory={selectedCategory}
                    onSelectCategory={(name) => setSelectedCategory(name === selectedCategory ? null : name)}
                />
            </div>

            <div className="my-12 h-px w-full max-w-4xl mx-auto bg-slate-300 dark:bg-slate-700"></div>

            {/* A warm intro to the top places using the new narrative layout */}
            {topFoodItems.length > 0 && (
                <div className="mb-20 mt-16 max-w-4xl mx-auto px-4 md:px-0">
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">Campus Favorites</h2>
                        <p className="text-lg text-[var(--text-secondary)] font-medium">The highest-rated items everyone is ordering right now.</p>
                    </div>

                    <div className="flex gap-4 w-full overflow-x-auto pb-8 pt-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {topFoodItems.map((item) => (
                            <GridFoodListItem key={`${item.outlet_id}-${item.id}`} item={item as TopFoodItem} />
                        ))}
                    </div>
                </div>
            )}

            <div className="my-12 h-px w-full max-w-4xl mx-auto bg-slate-300 dark:bg-slate-700"></div>

            <CompactRestaurantList
                outlets={gridOutlets}
                title={selectedCategory ? `Spots for ${selectedCategory}` : "Explore all venues"}
                description={selectedCategory ? "Filtered down to match your craving." : "A curated list of all available kitchens, just for you."}
            />

            {gridOutlets.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-lg text-[var(--text-muted)]">No vendors found for this category.</p>
                    <button onClick={() => setSelectedCategory(null)} className="mt-4 text-brand-500 font-semibold hover:underline">Clear Filter</button>
                </div>
            )}
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
        <div className="animate-none space-y-4 pb-20 mt-4 max-w-[1240px] mx-auto px-2">
            <HomepageSections outlets={outlets} />
            <div className="text-center pt-10 pb-20">
                <p className="text-[var(--text-muted)] font-medium">You've reached the end of the list</p>
            </div>
        </div>
    );
};

export default OutletList;
