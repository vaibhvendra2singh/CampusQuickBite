import React from 'react';
import { FiLock, FiStar, FiTerminal, FiCoffee, FiMoon, FiPackage, FiMonitor, FiCopy, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../hooks/context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const BadgeHints = () => {
    const { user, updateUser } = useAuth();
    const [copied, setCopied] = React.useState(false);

    // Sync fresh data on mount to catch any recently earned badges
    React.useEffect(() => {
        if (user?.id) {
            api.get(`/users/${user.id}?t=${Date.now()}`).then((res: any) => {
                if (res.data && updateUser) {
                    updateUser(res.data);
                }
            }).catch((e: any) => console.error('Failed hints sync:', e));
        }
    }, [user?.id, updateUser]);
    const handleCopy = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const text = "document.body.classList.add('unlocked');";
        
        try {
            // Priority 1: Modern Async Clipboard
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                handleSuccess();
                return;
            }
            throw new Error('Clipboard API unavailable');
        } catch (err) {
            // Priority 2: Traditional Selection Fallback
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "0";
                textArea.style.top = "0";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) handleSuccess();
            } catch (fallbackErr) {
                console.error('All copy methods failed', fallbackErr);
            }
        }
    };

    const handleSuccess = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in relative z-10">
            <div className="mb-12 text-center">
                <FiLock className="w-16 h-16 mx-auto text-brand-500 mb-6 drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4 tracking-tighter">Classified Intel</h1>
                <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                    You've found the secret dossier. Use these cryptic clues to uncover all hidden badges. 
                    Be warned: some require thinking outside the box.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <HintCard 
                    icon={<FiTerminal />}
                    title="Shadow Member" 
                    hint="Sometimes the most obvious path is the one you must type yourself. Seek the /secret." 
                    unlocked={user?.hasShadowBadge} 
                />
                <HintCard 
                    icon={<FiCoffee />}
                    title="Caffeine Addict" 
                    hint="We demand your absolute obedience. Read the exact bottom line of our legal pact to secure your survival." 
                    unlocked={user?.hasCaffeineBadge} 
                />
                <HintCard 
                    icon={<FiMonitor />}
                    title="Urban Explorer" 
                    hint="Restricted personnel only. You might want to ask the main search bar about Area 51." 
                    unlocked={user?.hasExplorerBadge} 
                />
                <HintCard 
                    icon={<FiStar />}
                    title="Arcade King" 
                    hint="We reserve all rights. Especially the rights to your appetite at the very bottom." 
                    unlocked={user?.hasArcadeBadge} 
                />
                <HintCard 
                    icon={<FiMoon />}
                    title="Night Owl" 
                    hint="The moon only shines for the hungry when the clock strikes past one, but before four. Look at your empty tray." 
                    unlocked={user?.hasNightOwlBadge} 
                />
                <HintCard 
                    icon={<FiPackage />}
                    title="The Glutton" 
                    hint="It takes a ridiculously large tray to attempt carrying 10 items at once." 
                    unlocked={user?.hasGluttonBadge} 
                />
                <HintCard 
                    icon={<FiTerminal />}
                    title="The Hacker" 
                    hint="A developer's console is required. The key lies in the document body. Add the class 'unlocked'." 
                    unlocked={user?.hasHackerBadge} 
                />
                <HintCard 
                    icon={<FiStar />}
                    title="Pro Gamer" 
                    hint="Dominance requires double digits on the scoreboard of any mini-game." 
                    unlocked={user?.hasProGamerBadge} 
                />
            </div>

            <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 mb-12 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                <h2 className="text-2xl font-black text-amber-500 mb-4 flex items-center gap-3">
                    <FiStar className="w-6 h-6 fill-amber-500" /> The Ultimate Ascension
                </h2>
                <p className="text-[var(--text-primary)] font-medium leading-relaxed">
                    Collecting all 8 fragments will cause your student profile and elite leaderboard ranking to pulsate with the fabled 
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 px-1">Golden Glow</span>, proving your absolute dominance over the campus. Only the elite reach this stage.
                </p>
            </div>

            <div className={`bg-black/90 backdrop-blur-xl border ${user?.hasHackerBadge ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-green-500/30'} rounded-3xl p-8 relative overflow-hidden group transition-all duration-500`}>
                <div className={`absolute inset-0 ${user?.hasHackerBadge ? 'bg-emerald-500/10' : 'bg-green-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none`}></div>
                
                {user?.hasHackerBadge && (
                    <div className="absolute top-4 right-6 px-3 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 rounded-full font-mono text-[10px] font-bold tracking-[0.2em] uppercase animate-pulse">
                        System Compromised
                    </div>
                )}

                <h2 className={`text-xl font-mono font-bold ${user?.hasHackerBadge ? 'text-emerald-400' : 'text-green-500'} mb-2 glitch-hover`}>
                    {user?.hasHackerBadge ? 'Access Granted: Root Console Active' : 'System Override Detected...'}
                </h2>
                <p className="font-mono text-green-400/70 text-sm leading-relaxed mb-4">
                    WARNING: There exists a state of total visual system override. A developer's console is required. The key lies in the document body. Add the class <code className="bg-green-900/40 text-green-300 px-2 py-0.5 rounded">'unlocked'</code> to unleash the raw auditory matrix.
                </p>
                <div 
                    onClick={() => handleCopy()}
                    className="p-4 bg-black/50 rounded-lg border border-green-900/50 flex items-center justify-between gap-4 group/code cursor-pointer hover:bg-green-500/5 transition-all duration-300"
                >
                    <code className="font-mono text-xs md:text-sm text-green-500 selection:bg-green-500 selection:text-black tracking-tight pointer-events-none">
                        document.body.classList.add('unlocked');
                    </code>
                    <button 
                        className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs font-mono pointer-events-none
                            ${copied 
                                ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                                : 'bg-green-900/40 text-green-500 hover:bg-green-500/20 border border-green-500/30'
                            }`}
                    >
                        {copied ? (
                            <>
                                <FiCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">COPIED</span>
                            </>
                        ) : (
                            <>
                                <FiCopy className="w-4 h-4" />
                                <span className="hidden sm:inline">COPY</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center">
                <Link to="/" className="btn-primary px-8 py-3">Back to Safety</Link>
            </div>
        </div>
    );
};

const HintCard = ({ title, hint, icon, unlocked }: { title: string, hint: string, icon: React.ReactNode, unlocked?: boolean }) => (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${unlocked ? 'bg-brand-500/10 border-brand-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'bg-[var(--glass-bg)] border-[var(--glass-border)]'}`}>
        <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${unlocked ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>
                {icon}
            </div>
            <h3 className={`font-bold text-lg ${unlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{title}</h3>
            {unlocked && <span className="ml-auto text-xs font-black uppercase tracking-widest text-brand-500 bg-brand-500/20 px-2 py-1 rounded-md">Found</span>}
        </div>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">{hint}</p>
    </div>
);

export default BadgeHints;
