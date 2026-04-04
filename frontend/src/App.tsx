import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import React, { useState, Suspense, useEffect } from 'react';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [pathname]);
    return null;
}
import { useAuth } from './hooks/context/AuthContext';
import type { User } from './hooks/context/AuthContext';
const GameHubButton = React.lazy(() => import('./components/student/GameHub').then(m => ({ default: m.GameHubInline })));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const OutletList = React.lazy(() => import('./pages/student/OutletList'));
const OutletMenu = React.lazy(() => import('./pages/student/OutletMenu'));
const Cart = React.lazy(() => import('./pages/student/Cart'));
const OrderLiveStatus = React.lazy(() => import('./pages/student/OrderLiveStatus'));
const OrderHistory = React.lazy(() => import('./pages/student/OrderHistory'));
const Leaderboard = React.lazy(() => import('./pages/student/Leaderboard'));
const RestaurantsPage = React.lazy(() => import('./pages/student/RestaurantsPage'));
const Landing = React.lazy(() => import('./pages/public/Landing'));

const OwnerDashboard = React.lazy(() => import('./pages/owner/OwnerDashboard'));
const MenuManagement = React.lazy(() => import('./pages/owner/MenuManagement'));
const OwnerAnalytics = React.lazy(() => import('./pages/owner/OwnerAnalytics'));
const OwnerOrderHistory = React.lazy(() => import('./pages/owner/OwnerOrderHistory'));
const KitchenDisplay = React.lazy(() => import('./pages/owner/KitchenDisplay'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

import { FiLogOut, FiUser, FiZap, FiShoppingBag, FiMoon, FiSun, FiShoppingCart, FiServer, FiAward, FiCompass } from 'react-icons/fi';
import { useCart } from './hooks/context/CartContext';
import { useToast } from './hooks/context/ToastContext';
import { useTheme } from './hooks/context/ThemeContext';
import api from './services/api';
import confetti from 'canvas-confetti';
import ProfileModal from './components/common/ProfileModal';
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const HelpFAQ = React.lazy(() => import('./pages/public/HelpFAQ'));
const ContactUs = React.lazy(() => import('./pages/public/ContactUs'));
const PrivacyPolicy = React.lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/public/TermsOfService'));
const GameHub = React.lazy(() => import('./components/student/GameHub'));
const SecretPage = React.lazy(() => import('./pages/public/SecretPage'));
const BadgeHints = React.lazy(() => import('./pages/public/BadgeHints'));
const CommandPalette = React.lazy(() => import('./components/common/CommandPalette'));

import { useSocket } from './hooks/useSocket';

const Scene = React.lazy(() => import('./canvas/Scene').then(module => ({ default: module.Scene })));

const Header = React.memo(({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
    const { user, logout } = useAuth();
    const { items } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <header
            className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[60] w-[96%] max-w-5xl px-2 sm:px-3 py-2 sm:py-3 bg-[var(--glass-bg)] backdrop-blur-3xl border border-[var(--glass-border)] rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-300 flex items-center justify-between gap-2 md:gap-8"
            style={{ boxShadow: '0 4px 24px rgba(37,99,235,0.10), 0 1px 4px rgba(37,99,235,0.06)' }}
        >
            <Link
                to="/"
                className="flex items-center gap-0.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex-shrink-0 select-none"
                style={{
                    background: 'rgba(37,99,235,0.08)',
                    border: '1px solid rgba(37,99,235,0.18)',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    letterSpacing: '-0.03em',
                }}
            >
                <span style={{ color: 'var(--color-brand-500)' }}>Campus</span>
                <span style={{ color: 'var(--text-primary)' }}>Bites</span>
            </Link>

            {user?.role === 'STUDENT' && (
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-1 justify-center min-w-0">
                    <Link to="/" className="nav-icon-btn !p-2 sm:!p-2.5" title="Board">
                        <FiServer className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                    <Link to="/restaurants" className="nav-icon-btn !p-2 sm:!p-2.5" title="Explore">
                        <FiCompass className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                    <Link to="/orders/history" className="nav-icon-btn !p-2 sm:!p-2.5" title="History">
                        <FiShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                    <Link to="/leaderboard" className="nav-icon-btn !p-2 sm:!p-2.5 text-amber-500" title="Elite">
                        <FiAward className="w-4 h-4 sm:w-5 sm:h-5" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full border border-white dark:border-slate-900 animate-pulse-subtle"></div>
                    </Link>
                    <Link to="/cart" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-brand-500 rounded-full text-white font-black text-xs sm:text-sm shadow-xl shadow-brand-500/30 mx-1 relative transition-transform flex-shrink-0">
                        <FiShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline uppercase tracking-widest text-[10px] sm:text-xs">Cart</span>
                        {items.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-red-600 border-2 border-[var(--bg-card)] text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center rounded-full shadow-lg">
                                {items.length}
                            </span>
                        )}
                    </Link>
                    <Suspense fallback={null}>
                        <GameHubButton />
                    </Suspense>
                </div>
            )}

            <div className="flex items-center gap-1 sm:gap-1.5 bg-[var(--nav-pill-bg)] p-1 sm:p-1.5 md:p-2 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-[var(--glass-border)] flex-shrink-0">
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 sm:p-2.5 rounded-full text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm transition-transform" title="Shift View">
                    {darkMode ? <FiSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                {user ? (
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={(e) => {
                                if (e.detail === 2) {
                                    setIsProfileOpen(false);
                                    window.location.href = '/hints';
                                } else {
                                    setIsProfileOpen(true);
                                }
                            }} 
                            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden bg-brand-500/10 border-2 border-[var(--bg-card)] shadow-sm flex items-center justify-center transition-transform"
                            title="Double click for intel"
                        >
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt={user?.name || ''} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                                <FiUser className="text-brand-600 dark:text-brand-400 w-4 h-4" />
                            )}
                        </button>
                        <button onClick={logout} className="p-2 sm:p-2.5 text-red-500 rounded-full bg-[var(--bg-card)] shadow-sm transition-transform bg-red-50 dark:bg-red-500/10" title="Exit">
                            <FiLogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg">Join</Link>
                )}
            </div>
            
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </header>
    );
});

const Layout = ({ children }: { children: React.ReactNode }) => {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuth();
    useSocket(); // Initialize real-time listeners

    const secretClicks = React.useRef(0);

    const handleSecretClick = React.useCallback(() => {
        secretClicks.current += 1;
        if (secretClicks.current >= 2) {
            window.location.href = '/secret';
            secretClicks.current = 0; // reset just in case
        }
    }, []);

    const [claimingArcade, setClaimingArcade] = React.useState(false);
    const { showToast } = useToast();
    const { updateUser } = useAuth();
    
    const handleArcadeClick = React.useCallback(async () => {
        if (!user || user.role !== 'STUDENT' || user.hasArcadeBadge || claimingArcade) return;
        setClaimingArcade(true);
        try {
            await api.post('/users/badge', { type: 'arcade' });
            const end = Date.now() + 2000;
            const colors = ['#ff007f', '#00e5ff', '#ffeb3b', '#cc00ff'];
            (function frame() {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: colors });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: colors });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
            if (updateUser) updateUser({ ...user, hasArcadeBadge: true });
            if (showToast) showToast('🕹️ Arcade King Badge Unlocked! (+40 XP)', 'success');
        } catch (err) {
            console.error(err);
        } finally {
            setClaimingArcade(false);
        }
    }, [user, claimingArcade, showToast, updateUser]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-700">
            <Header darkMode={isDark} setDarkMode={toggleTheme} />



            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-12 pb-16 pt-24 sm:pt-28 md:pt-32 relative z-0 isolation-auto transition-all duration-150">
                {children}
            </main>

            {user?.role === 'STUDENT' && (
                <React.Suspense fallback={null}>
                    <GameHub />
                    <CommandPalette />
                </React.Suspense>
            )}

            <footer className="py-10 md:py-12 bg-[var(--bg-footer)] border-t-[6px] md:border-t-[8px] border-brand-500 relative z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-12">
                        <div className="sm:col-span-2">
                            <div className="flex items-center space-x-3 mb-5 md:mb-8">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-xl shadow-brand-500/20">C</div>
                                <span className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter">Campus Bites</span>
                            </div>
                            <p className="text-base md:text-lg text-[var(--text-secondary)] font-medium leading-relaxed max-w-md">
                                We believe campus dining should be smooth. Skip the queues, grab your meal, and get back to what matters.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-5 md:mb-8 opacity-80">Navigate</h4>
                            <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-[var(--text-primary)] font-bold">
                                {(!user || user?.role === 'STUDENT') && (
                                    <>
                                        <li><Link to="/" className="inline-block transition-all duration-150">Daily Feed</Link></li>
                                        <li><Link to="/orders/history" className="inline-block transition-all duration-150">History</Link></li>
                                        <li><Link to="/leaderboard" className="inline-block transition-all duration-150">ELITE Board</Link></li>
                                    </>
                                )}
                                {user?.role === 'SHOP_OWNER' && (
                                    <>
                                        <li><Link to="/owner/dashboard" className="inline-block transition-all duration-150">Dashboard</Link></li>
                                        <li><Link to="/owner/kitchen" className="inline-block transition-all duration-150">Kitchen View</Link></li>
                                        <li><Link to="/owner/orders/history" className="inline-block transition-all duration-150">Order History</Link></li>
                                    </>
                                )}
                                {user?.role === 'ADMIN' && (
                                    <>
                                        <li><Link to="/admin/dashboard" className="inline-block transition-all duration-150">Admin Console</Link></li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-5 md:mb-8 opacity-80">Support</h4>
                            <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-[var(--text-primary)] font-bold">
                                <li><Link to="/help" className="inline-block transition-all duration-150">Get Help</Link></li>
                                <li><Link to="/contact" className="inline-block transition-all duration-150">Talk to us</Link></li>
                                <li><Link to="/privacy" className="inline-block transition-all duration-150">Privacy</Link></li>
                                <li><Link to="/terms" className="inline-block transition-all duration-150">Rules of Play</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="relative pt-8 md:pt-10 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
                        <p className="text-xs sm:text-sm font-black text-[var(--text-muted)] tracking-tight">&copy; {new Date().getFullYear()} Campus Bites. <span className="cursor-pointer hover:text-pink-500 transition-colors duration-500" onClick={handleArcadeClick}>All rights to your appetite.</span></p>
                        <div 
                            className="flex items-center space-x-3 bg-[var(--bg-card)] px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-[#00ff46] hover:bg-[#00ff46]/5 transition-all group select-none"
                            onClick={handleSecretClick}
                            title="System status"
                        >
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse group-hover:bg-[#00ff46] group-hover:shadow-[0_0_10px_#00ff46] transition-all"></span>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none group-hover:text-[#00ff46] transition-colors">Kitchens are Live</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) return (
        <div className="h-screen bg-transparent flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FiZap className="text-white w-8 h-8" />
            </div>
            <div className="flex flex-col items-center">
                <p className="text-lg font-bold text-[var(--text-primary)] mb-1">Loading</p>
                <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
            </div>
        </div>
    );

    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

    return <>{children}</>;
};

const FullScreenLoader = () => (
    <div className="h-screen bg-transparent flex flex-col items-center justify-center space-y-5">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg">
            <FiZap className="text-white w-8 h-8" />
        </div>
        <div className="flex flex-col items-center">
            <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">Campus Bites</p>
            <p className="text-sm text-[var(--text-muted)]">Loading your campus feed</p>
        </div>
    </div>
);

const useCyberAudioLogic = (user: User | null, updateUser: (u: User) => void, showToast: (m: string, s: 'success' | 'error' | 'info') => void) => {
    const isAwarding = React.useRef(false);

    useEffect(() => {
        let audioCtx: AudioContext | null = null;
        let isPlaying = false;
        let interval: ReturnType<typeof setInterval> | null = null;
        let masterGain: GainNode | null = null;

        const playCyberpunkTheme = () => {
            if (isPlaying) return;
            isPlaying = true;
            
            try {
                audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                masterGain = audioCtx.createGain();
                masterGain.gain.value = 0.15; // keep it subtle
                masterGain.connect(audioCtx.destination);
                
                // Arpeggio notes: E2, B2, E3, G3
                const baseFreqs = [82.41, 123.47, 164.81, 196.00]; 
                let step = 0;
                
                interval = setInterval(() => {
                    if (!audioCtx || !masterGain) return;
                    
                    const osc = audioCtx.createOscillator();
                    osc.type = 'sawtooth'; 
                    
                    const octaveMult = (step % 8 === 7) ? 2 : 1;
                    const detune = 1 + (Math.random() * 0.01 - 0.005);
                    const freq = baseFreqs[step % baseFreqs.length] * octaveMult * detune;
                    
                    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                    
                    const env = audioCtx.createGain();
                    env.connect(masterGain);
                    osc.connect(env);
                    
                    env.gain.setValueAtTime(0, audioCtx.currentTime);
                    env.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.02);
                    env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
                    
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.15);
                    step++;
                }, 140);
            } catch (err) {
                console.warn('AudioContext not supported or blocked', err);
            }
        };

        const stopCyberpunkTheme = () => {
            isPlaying = false;
            if (interval) clearInterval(interval);
            if (masterGain) {
                masterGain.gain.exponentialRampToValueAtTime(0.01, (audioCtx?.currentTime || 0) + 0.5);
            }
            if (audioCtx) {
                setTimeout(() => {
                    audioCtx?.close().catch(() => {});
                    audioCtx = null;
                }, 500);
            }
        };

        const handleHackerBadge = async () => {
            if (!user || user.role !== 'STUDENT' || user.hasHackerBadge || isAwarding.current) return;
            isAwarding.current = true;
            try {
                await api.post('/users/badge', { type: 'hacker' });
                // Visual Celebration
                const end = Date.now() + 1500;
                const colors = ['#00ff46', '#00e5ff', '#3b82f6'];
                (function frame() {
                    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: colors });
                    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: colors });
                    if (Date.now() < end) requestAnimationFrame(frame);
                }());

                updateUser({ ...user, hasHackerBadge: true });
                showToast('💻 The Hacker Badge Unlocked! System Decrypted (+75 XP)', 'success');
            } catch (err) {
                console.error('Failed to grant Hacker badge:', err);
            } finally {
                isAwarding.current = false;
            }
        };

        const checkClass = () => {
            if (document.body.classList.contains('unlocked')) {
                playCyberpunkTheme();
                handleHackerBadge();
            } else {
                stopCyberpunkTheme();
            }
        };

        checkClass();
        const observer = new MutationObserver(checkClass);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            observer.disconnect();
            stopCyberpunkTheme();
};
    }, [user, updateUser, showToast]);
};

function App() {
    const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
    const { showToast } = useToast();
    useCyberAudioLogic(user, updateUser, showToast); // Check for unlocked terminal class on mount

    if (isLoading) {
        return <FullScreenLoader />;
    }

    return (
        <div className="html-overlay min-h-screen flex flex-col">
            <React.Suspense fallback={null}>
                <Scene />
            </React.Suspense>
            <Router>
                <ScrollToTop />
                <React.Suspense fallback={<FullScreenLoader />}>
                        <Routes>
                                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
                            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/change-password" element={
                                <ProtectedRoute>
                                    <Layout><ResetPassword /></Layout>
                                </ProtectedRoute>
                            } />

                            <Route path="/help" element={<Layout><HelpFAQ /></Layout>} />
                            <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
                            <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                            <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
                            <Route path="/secret" element={<SecretPage />} />
                            <Route path="/hints" element={<Layout><BadgeHints /></Layout>} />


                            <Route path="/" element={
                                isAuthenticated ? (
                                    <Layout>
                                        {user?.role === 'STUDENT' ? <OutletList /> :
                                            user?.role === 'SHOP_OWNER' ? <Navigate to="/owner/dashboard" replace /> :
                                                <Navigate to="/admin/dashboard" replace />}
                                    </Layout>
                                ) : (
                                    <Landing />
                                )
                            } />

                            <Route path="/restaurants" element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <Layout><RestaurantsPage /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/outlets/:outletId/menu" element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <Layout><OutletMenu /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/cart" element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <Layout><Cart /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/orders/history" element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <Layout><OrderHistory /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/orders/:orderId/status" element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <Layout><OrderLiveStatus /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/leaderboard" element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <Layout><Leaderboard /></Layout>
                                </ProtectedRoute>
                            } />


                            <Route path="/owner/dashboard" element={
                                <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
                                    <Layout><OwnerDashboard /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/owner/menu/:outletId" element={
                                <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
                                    <Layout><MenuManagement /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/owner/analytics/:outletId" element={
                                <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
                                    <Layout><OwnerAnalytics /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/owner/orders/history" element={
                                <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
                                    <Layout><OwnerOrderHistory /></Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/owner/kitchen" element={
                                <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
                                    <Layout><KitchenDisplay /></Layout>
                                </ProtectedRoute>
                            } />

                            <Route path="/admin/dashboard" element={
                                <ProtectedRoute allowedRoles={['ADMIN']}>
                                    <Layout><AdminDashboard /></Layout>
                                </ProtectedRoute>
                            } />

                            <Route path="/unauthorized" element={
                                <div className="min-h-[70vh] flex flex-col items-center justify-center animate-none px-6">
                                    <div className="w-40 h-40 bg-red-50 rounded-[4rem] flex items-center justify-center mb-10 border-4 border-red-100 shadow-xl">
                                        <FiLogOut className="w-20 h-20 text-red-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-3">Access Denied</h2>
                                    <p className="text-[var(--text-muted)] text-base text-center max-w-md leading-relaxed">Your account doesn't have permission to access this section.</p>
                                    <div className="flex space-x-4 mt-8">
                                        <button 
                                            onClick={() => window.location.href = '/'} 
                                            className="btn-primary px-8 py-3"
                                        >
                                            Take Me Home
                                        </button>
                                        <button 
                                            onClick={() => { logout(); window.location.href = '/login'; }} 
                                            className="btn-secondary px-8 py-3 text-red-500 border-red-200 dark:border-red-500/20"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            } />

                    </Routes>
                </React.Suspense>
            </Router>
        </div>
    );
}

export default App;
