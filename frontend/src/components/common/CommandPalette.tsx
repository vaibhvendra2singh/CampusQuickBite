import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight, FiCommand, FiInfo, FiBox } from 'react-icons/fi';
import api from '../../services/api';
import { useCart } from '../../hooks/context/CartContext';
import { useToast } from '../../hooks/context/ToastContext';

interface GlobalItem {
    id: number;
    name: string;
    price: number;
    is_veg?: boolean;
    outlet_id: number;
    outlet_name: string;
    type: 'item' | 'restaurant';
}

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<GlobalItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    // Toggle logic with Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Fetch data and filter when open and querying
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
            return;
        }
        
        // Focus input after opening
        setTimeout(() => inputRef.current?.focus(), 50);

        const fetchData = async () => {
            if (query.trim().length === 0) {
                setItems([]);
                return;
            }
            setIsLoading(true);
            try {
                // Fetch all outlets (has menu items)
                const res = await api.get('/outlets');
                const results: GlobalItem[] = [];
                const searchLower = query.toLowerCase();

                res.data.forEach((outlet: any) => {
                    // Match restaurant name
                    if (outlet.name.toLowerCase().includes(searchLower)) {
                        results.push({
                            id: outlet.id,
                            name: outlet.name,
                            price: 0,
                            outlet_id: outlet.id,
                            outlet_name: outlet.name,
                            type: 'restaurant'
                        });
                    }
                    // Match items
                    if (outlet.menu_items) {
                        outlet.menu_items.forEach((item: any) => {
                            if (item.name.toLowerCase().includes(searchLower)) {
                                results.push({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    is_veg: item.is_veg,
                                    outlet_id: outlet.id,
                                    outlet_name: outlet.name,
                                    type: 'item'
                                });
                            }
                        });
                    }
                });
                
                // Sort to put restaurants first, then sort by exact match preference
                results.sort((a, b) => {
                    if (a.type !== b.type) return a.type === 'restaurant' ? -1 : 1;
                    return 0;
                });
                
                setItems(results.slice(0, 8)); // Max 8 results to keep it clean
            } catch (err) {
                console.error("Failed to fetch for command palette", err);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchData, 200);
        return () => clearTimeout(debounce);
    }, [isOpen, query]);

    // Handle Keyboard Selection
    useEffect(() => {
        const handleNavigation = (e: KeyboardEvent) => {
            if (!isOpen) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % (items.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + (items.length || 1)) % (items.length || 1));
            } else if (e.key === 'Enter' && items.length > 0) {
                e.preventDefault();
                executeAction(items[selectedIndex]);
            }
        };
        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, items, selectedIndex]);

    const executeAction = (item: GlobalItem) => {
        setIsOpen(false);
        if (item.type === 'restaurant') {
            navigate(`/outlets/${item.outlet_id}/menu`);
        } else {
            // Direct Add to Cart
            addToCart({
                menuItemId: item.id,
                name: item.name,
                price: item.price
            });
            showToast(`${item.name} added to cart via Quick Command!`, 'success');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            
            {/* Palette Box */}
            <div 
                className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* Search Input */}
                <div className="flex items-center px-4 py-4 border-b border-[var(--glass-border)] bg-[var(--bg-input)]">
                    <FiSearch className="w-6 h-6 text-brand-500 mr-3 animate-pulse" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Search any food, drink, or restaurant..."
                        className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-xl font-medium placeholder-[var(--text-muted)]"
                    />
                    <div className="flex items-center gap-1 ml-2 pointer-events-none">
                        <kbd className="px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded shadow-sm text-xs text-[var(--text-muted)] font-black">ESC</kbd>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="p-8 flex justify-center items-center text-[var(--text-muted)]">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-500 border-t-transparent mr-2" />
                        Scanning campus...
                    </div>
                )}

                {/* Results List */}
                {!isLoading && items.length > 0 && (
                    <ul className="max-h-[60vh] overflow-y-auto py-2">
                        {items.map((item, idx) => {
                            const isSelected = idx === selectedIndex;
                            return (
                                <li 
                                    key={`${item.type}-${item.id}`}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    onClick={() => executeAction(item)}
                                    className={`px-4 py-3 mx-2 my-1 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-[var(--hover-bg)] border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'restaurant' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                            {item.type === 'restaurant' ? <FiBox className="w-5 h-5" /> : (item.is_veg === false ? '🍗' : '🥬')}
                                        </div>
                                        <div>
                                            <h4 className={`font-black text-lg ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{item.name}</h4>
                                            <p className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1 uppercase tracking-widest">
                                                {item.type === 'restaurant' ? 'Restaurant' : item.outlet_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {item.type === 'item' && (
                                            <span className="font-black text-[var(--text-primary)] text-sm bg-[var(--bg-input)] px-2 py-1 rounded">₹{item.price}</span>
                                        )}
                                        {isSelected && <FiArrowRight className="w-4 h-4 text-brand-500 animate-[bounce-right_1s_infinite]" />}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* No Results */}
                {!isLoading && query.length > 0 && items.length === 0 && (
                    <div className="p-10 text-center">
                        <FiInfo className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                        <p className="text-[var(--text-primary)] font-bold text-lg mb-1">No matches found</p>
                        <p className="text-[var(--text-muted)] text-sm">Target out of bounds. Try searching for something else like 'Pasta'.</p>
                    </div>
                )}

                {/* Footer instructions */}
                <div className="bg-[var(--nav-pill-bg)] px-4 py-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><FiCommand/> + K to toggle</span>
                        <span className="flex items-center gap-1">↑↓ to navigate</span>
                        <span className="flex items-center gap-1">Enter to {items[selectedIndex]?.type === 'restaurant' ? 'open menu' : 'add to cart'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
