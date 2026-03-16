import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiStar, FiClock, FiSearch, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import AnnouncementWidget from '../../components/common/AnnouncementWidget';

interface Outlet {
    id: number;
    name: string;
    location: string;
    average_rating?: number;
    is_open?: boolean;
    current_status?: 'FAST' | 'MODERATE' | 'BUSY';
}

const getVendorImage = (name: string, id: number) => {
    const nameStr = name.toLowerCase();
    if (nameStr.includes('maggi')) return '/vendors/img1.jpg';
    if (nameStr.includes('southern')) return '/vendors/img2.jpg';
    if (nameStr.includes('chow')) return '/vendors/img3.jpg';
    if (nameStr.includes('snap')) return '/vendors/img4.jpg';

    const images = [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop&q=80',
    ];
    let hash = 0;
    const strId = String(id);
    for (let i = 0; i < strId.length; i++) {
        hash = strId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return images[Math.abs(hash) % images.length];
};

const RestaurantsPage = () => {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');

    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const response = await api.get('/outlets');
                setOutlets(response.data);
            } catch (error) {
                console.error("Failed to fetch outlets:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOutlets();
    }, []);

    const filteredAndSortedOutlets = outlets
        .filter(outlet =>
            outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            outlet.location.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'rating') {
                return (b.average_rating || 0) - (a.average_rating || 0);
            }
            return a.name.localeCompare(b.name);
        });

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6 mt-4">
                <div className="h-10 bg-[var(--bg-input)] rounded-xl w-64 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 mt-4 animate-none pb-32">
            {/* Header Section */}
            <div className="mb-12">
                <Link to="/" className="inline-flex items-center text-sm font-bold text-[var(--text-muted)]  transition-all mb-8 group">
                    <FiArrowLeft className="mr-2 transition-all duration-150" />
                    Back to explore
                </Link>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3">Campus Favorites</h1>
                <p className="text-[var(--text-secondary)] text-lg md:text-xl font-medium max-w-2xl text-natural">
                    Everything from quick mid-lecture bites to proper dinner spots. Find your favorite booth on campus.
                </p>
            </div>

            {/* Admin Announcements */}
            <div className="mb-10">
                <AnnouncementWidget />
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col md:flex-row gap-6 mb-16 items-center">
                <div className="relative flex-1 w-full">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Craving something specific?"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none text-[var(--text-primary)] font-semibold transition-all shadow-sm placeholder:text-[var(--text-muted)] opacity-90 focus:opacity-100"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-sm font-bold text-[var(--text-muted)] whitespace-nowrap hidden lg:block">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'rating' | 'name')}
                        className="w-full md:w-auto bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] px-6 py-4 rounded-2xl outline-none font-bold focus:border-brand-500 transition-all shadow-sm cursor-pointer appearance-none "
                    >
                        <option value="rating">Top Rated</option>
                        <option value="name">Alphabetical</option>
                    </select>
                </div>
            </div>

            {/* Grid Layout */}
            {filteredAndSortedOutlets.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]">
                    <p className="text-xl text-[var(--text-muted)] font-medium">No restaurants found matching"{searchTerm}"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {filteredAndSortedOutlets.map(outlet => {
                        const image = getVendorImage(outlet.name, outlet.id);
                        const waitTime = outlet.current_status === 'BUSY' ? '30-45 mins' : outlet.current_status === 'MODERATE' ? '15-20 mins' : '10-15 mins';
                        const nameStr = outlet.name.toLowerCase();

                        let imageStyles = 'object-cover object-center';
                        let containerColor = 'bg-[var(--bg-input)]';

                        if (nameStr.includes('maggi') || nameStr.includes('chow') || nameStr.includes('snap') || nameStr.includes('southern')) {
                            imageStyles = 'object-contain scale-[0.85]';
                            if (nameStr.includes('southern')) containerColor = 'bg-[#053d18]';
                            else if (nameStr.includes('maggi')) containerColor = 'bg-[#bd0f22]';
                            else containerColor = 'bg-white';
                        }

                        return (
                            <div key={outlet.id} className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm   transition-all duration-150 flex flex-col">
                                <div className={`relative aspect-[16/9] ${containerColor} overflow-hidden`}>
                                    <img
                                        src={image}
                                        alt={outlet.name}
                                        className={`w-full h-full transition-all duration-150 ${imageStyles}`}
                                    />
                                    {!outlet.is_open && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">Closed</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] group- transition-colors line-clamp-1">{outlet.name}</h3>
                                            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md text-xs font-bold">
                                                <FiStar className="w-3.5 h-3.5 fill-current" />
                                                {outlet.average_rating ? outlet.average_rating.toFixed(1) : 'New'}
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-[var(--text-muted)] line-clamp-1 mb-4 border-b border-[var(--border-color)] pb-4">
                                            Quick Bites, Beverages, Snacks
                                        </p>
                                        <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)] mb-6">
                                            <div className="flex items-center gap-1.5">
                                                <FiMapPin className="text-[var(--text-muted)] w-4 h-4" />
                                                <span className="truncate max-w-[120px]">{outlet.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <FiClock className="text-[var(--text-muted)] w-4 h-4" />
                                                <span>{waitTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/outlets/${outlet.id}/menu`}
                                        className="block w-full text-center py-3 bg-[var(--bg-input)]  text-[var(--text-primary)]  font-bold rounded-xl transition-all duration-150"
                                    >
                                        View Menu
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RestaurantsPage;
