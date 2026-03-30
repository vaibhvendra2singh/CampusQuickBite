import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface HeatmapOutlet {
    id: number;
    name: string;
    location: string;
    current_status?: 'FAST' | 'MODERATE' | 'BUSY';
    is_open?: boolean;
}

const STATUS_CONFIG = {
    FAST: {
        color: 'text-emerald-500',
        ringColor: 'ring-emerald-500/30',
        dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        waitLabel: 'FAST',
        emoji: '⚡'
    },
    MODERATE: {
        color: 'text-amber-400',
        ringColor: 'ring-amber-400/30',
        dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
        badgeBg: 'bg-amber-400/10 text-amber-500 border-amber-400/20',
        waitLabel: 'MOD',
        emoji: '⏳'
    },
    BUSY: {
        color: 'text-red-500',
        ringColor: 'ring-red-500/30',
        dotColor: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
        badgeBg: 'bg-red-500/10 text-red-500 border-red-500/20',
        waitLabel: 'BUSY',
        emoji: '🔥'
    }
};

const getVendorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const HeatmapNode = ({ outlet, compact }: { outlet: HeatmapOutlet, compact?: boolean }) => {
    const config = STATUS_CONFIG[outlet.current_status || 'FAST'];
    const headerSize = compact ? 'w-14 h-14' : 'w-24 h-24';
    const initialSize = compact ? 'text-sm' : 'text-2xl';
    const nameSize = compact ? 'text-[10px]' : 'text-xs';
    
    return (
        <Link to={`/outlets/${outlet.id}/menu`} className="flex flex-col items-center gap-1 group transition-all duration-150">
            <div className={`relative ${headerSize} rounded-full flex items-center justify-center border border-[var(--border-color)] group-hover:border-brand-500 transition-all bg-[var(--bg-card)]/80 shadow-md`}>
                <div className="z-10 bg-[var(--bg-input)] w-[85%] h-[85%] rounded-full flex items-center justify-center shadow-inner border border-[var(--border-color)]">
                    <span className={`${initialSize} font-black text-[var(--text-primary)] tracking-tight`}>
                        {getVendorInitials(outlet.name)}
                    </span>
                </div>
                {/* Status dot in corner */}
                <span className={`absolute ${compact ? '-bottom-0.5 -right-0.5 w-2.5 h-2.5' : 'bottom-0.5 right-0.5 w-4 h-4'} ${config.dotColor} rounded-full border-2 border-[var(--bg-card)]`} />
            </div>

            {/* Label */}
            <div className="text-center max-w-[80px]">
                <p className={`${nameSize} font-bold text-[var(--text-primary)] truncate leading-tight opacity-70`}>{outlet.name}</p>
            </div>

            {/* Compact Badge */}
            <span className={`px-2 py-0.5 rounded-full border ${config.badgeBg} ${compact ? 'text-[8px]' : 'text-[10px]'} font-black uppercase tracking-widest`}>
                {config.emoji} {config.waitLabel}
            </span>
        </Link>
    );
};

const CampusHeatmap = ({ outlets, compact = false }: { outlets: HeatmapOutlet[], compact?: boolean }) => {
    const openOutlets = useMemo(() => outlets.filter(o => o.is_open !== false), [outlets]);
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        if (outlets.length > 0) {
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    }, [outlets]);

    return (
        <div className={compact ? 'w-full' : 'mb-10'}>
            {!compact && (
                <div className="flex items-end justify-between mb-8 px-1">
                    <h2 className="text-4xl font-black text-[var(--text-primary)] uppercase">Campus <span className="text-brand-500">Radar</span></h2>
                </div>
            )}

            <div className={`relative ${compact ? '' : 'bg-[var(--bg-card)]/40 backdrop-blur-sm rounded-[3rem] border border-[var(--border-color)] p-8'}`}>
                <div className={`grid ${compact ? 'grid-cols-1 gap-5' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8'} relative z-10`}>
                    {openOutlets.map((outlet) => (
                        <HeatmapNode key={outlet.id} outlet={outlet} compact={compact} />
                    ))}
                </div>

                {/* Legend - Vertical for tight spaces */}
                <div className={`relative z-10 flex flex-col gap-2 mt-6 pt-4 border-t border-[var(--border-color)] ${compact ? 'opacity-60' : ''}`}>
                    {[
                        { color: 'bg-emerald-500', label: 'FAST (10M)' },
                        { color: 'bg-amber-400', label: 'MOD (15M)' },
                        { color: 'bg-red-500', label: 'BUSY (30M)' },
                    ].map((c) => (
                        <div key={c.label} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-30" />
                            <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{c.label}</span>
                        </div>
                    ))}
                    <div className="mt-2 text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center justify-between">
                        <span>● LIVE</span>
                        <span>AT {lastUpdated}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampusHeatmap;
