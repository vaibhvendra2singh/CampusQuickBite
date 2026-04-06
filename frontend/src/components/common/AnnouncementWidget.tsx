import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiBell, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

interface Announcement {
    id: number;
    title: string;
    message: string;
    target_role: string;
    created_at: string;
}

interface Props {
    /** Visually compact variant for the owner panel sidebar */
    compact?: boolean;
}

const AnnouncementWidget = ({ compact = false }: Props) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/announcements');
                setAnnouncements(res.data);
            } catch (error) {
                console.debug('Failed to load local announcements', error);
            }
        };
        fetch();
        const id = setInterval(fetch, 120_000);
        return () => clearInterval(id);
    }, []);

    const visible = announcements.filter(a => !dismissed.has(a.id));

    if (visible.length === 0) return null;

    return (
        <div className={`rounded-2xl border overflow-hidden ${compact
            ? 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5'
            : 'border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5'
            }`}>
            <button
                onClick={() => setIsExpanded(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-left"
            >
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
                        <FiBell className="relative text-amber-500 w-5 h-5" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                        Admin Announcements
                    </span>
                    <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full">
                        {visible.length}
                    </span>
                </div>
                {isExpanded
                    ? <FiChevronUp className="w-4 h-4 text-amber-500" />
                    : <FiChevronDown className="w-4 h-4 text-amber-500" />
                }
            </button>

            {isExpanded && (
                <div className={`space-y-2 px-4 pb-4 ${compact ? 'max-h-52 overflow-y-auto' : ''}`}>
                    {visible.map(a => (
                        <div
                            key={a.id}
                            className="relative bg-white dark:bg-slate-900/80 border border-amber-100 dark:border-amber-500/10 rounded-xl p-4 pr-9 shadow-sm"
                        >
                            <button
                                onClick={() => setDismissed(prev => new Set([...prev, a.id]))}
                                className="absolute top-3 right-3 text-slate-300  transition-colors"
                                title="Dismiss"
                            >
                                <FiX className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                                {a.title}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug font-medium">
                                {a.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                                {new Date(a.created_at).toLocaleDateString(undefined, {
                                    month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnnouncementWidget;
