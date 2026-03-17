import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import React, { useState } from 'react';
import { useAuth } from './hooks/context/AuthContext';
import { CartProvider } from './hooks/context/CartContext';
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

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

import { FiLogOut, FiUser, FiZap, FiShoppingBag, FiMoon, FiSun, FiShoppingCart, FiServer, FiAward, FiCompass } from 'react-icons/fi';
import { useCart } from './hooks/context/CartContext';
import { ToastProvider } from './hooks/context/ToastContext';
import { ThemeProvider, useTheme } from './hooks/context/ThemeContext';
import ProfileModal from './components/common/ProfileModal';
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const HelpFAQ = React.lazy(() => import('./pages/public/HelpFAQ'));
const ContactUs = React.lazy(() => import('./pages/public/ContactUs'));
const PrivacyPolicy = React.lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/public/TermsOfService'));
const GameHub = React.lazy(() => import('./components/student/GameHub'));

import { useSocket } from './hooks/useSocket';
import { ReactLenis } from 'lenis/react';

// Lazy load the 3D scene because it includes heavy three.js logic
const Scene = React.lazy(() => import('./canvas/Scene').then(module => ({ default: module.Scene })));

const Header = React.memo(({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
    const { user, logout } = useAuth();
    const { items } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <header className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-5xl px-3 py-3 bg-[var(--glass-bg)] backdrop-blur-3xl border border-[var(--glass-border)] rounded-[2.5rem] shadow-2xl transition-all duration-300 flex items-center justify-between gap-4 md:gap-8">
            <Link to="/" className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full font-black text-white shadow-xl shadow-brand-500/20 flex-shrink-0 transition-transform">
                <span className="text-xl md:text-2xl tracking-tighter">CB</span>
            </Link>

            {user?.role === 'STUDENT' && (
                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto hide-scrollbar flex-1 justify-center">
                    <Link to="/" className="p-3 md:p-4 bg-[var(--bg-input)] rounded-full text-[var(--text-secondary)] font-bold text-sm shadow-inner transition-colors" title="Board">
                        <FiServer className="w-5 h-5 md:w-6 md:h-6 opacity-80" />
                    </Link>
                    <Link to="/restaurants" className="p-3 md:p-4 bg-[var(--bg-input)] rounded-full text-[var(--text-secondary)] font-bold text-sm shadow-inner transition-colors" title="Explore">
                        <FiCompass className="w-5 h-5 md:w-6 md:h-6 opacity-80" />
                    </Link>
                    <Link to="/orders/history" className="p-3 md:p-4 bg-[var(--bg-input)] rounded-full text-[var(--text-secondary)] font-bold text-sm shadow-inner transition-colors" title="History">
                        <FiShoppingBag className="w-5 h-5 md:w-6 md:h-6 opacity-80" />
                    </Link>
                    <Link to="/leaderboard" className="p-3 md:p-4 bg-[var(--bg-input)] rounded-full text-amber-500 font-bold text-sm shadow-inner transition-colors relative" title="Elite">
                        <FiAward className="w-5 h-5 md:w-6 md:h-6" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse-subtle"></div>
                    </Link>
                    <Link to="/cart" className="flex items-center gap-3 px-6 py-3.5 md:py-4 bg-brand-500 rounded-full text-white font-black text-sm shadow-xl shadow-brand-500/30 mx-2 relative transition-transform flex-shrink-0">
                        <FiShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="hidden md:inline uppercase tracking-widest text-xs">Checkout</span>
                        {items.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 md:w-7 md:h-7 bg-red-600 border-2 border-[var(--bg-card)] text-white text-[10px] md:text-xs font-black flex items-center justify-center rounded-full shadow-lg">
                                {items.length}
                            </span>
                        )}
                    </Link>
                </div>
            )}

            <div className="flex items-center gap-2 bg-[var(--bg-input)] p-1.5 md:p-2 rounded-[2rem] shadow-inner flex-shrink-0 mr-1">
                <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 md:p-3 rounded-full text-[var(--text-secondary)] bg-[var(--bg-card)] shadow-sm transition-transform" title="Shift View">
                    {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                </button>

                {user ? (
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-brand-500/10 border-2 border-[var(--bg-card)] shadow-sm flex items-center justify-center transition-transform">
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt={user?.name || ''} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                                <FiUser className="text-brand-600 dark:text-brand-400 w-5 h-5" />
                            )}
                        </button>
                        <button onClick={logout} className="p-2.5 md:p-3 text-red-500 rounded-full bg-[var(--bg-card)] shadow-sm transition-transform pr-3 bg-red-50 dark:bg-red-500/10" title="Exit">
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="px-6 py-2.5 md:py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full font-black text-sm uppercase tracking-widest shadow-lg ml-2">Join In</Link>
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

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-700">
            <Header darkMode={isDark} setDarkMode={toggleTheme} />

            <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-40 relative z-10 transition-all duration-150">
                {children}
            </main>

            {/* Mini Games — Student only */}
            {user?.role === 'STUDENT' && (
                <React.Suspense fallback={null}>
                    <GameHub />
                </React.Suspense>
            )}

            {/* Footer */}
            <footer className="py-24 pb-48 lg:pb-24 bg-slate-950 border-t-[12px] border-brand-500">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        {/* Brand Column */}
                        <div className="md:col-span-2">
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/20">C</div>
                                <span className="text-3xl font-black text-white tracking-tighter">CampusBite</span>
                            </div>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
                                We believe campus dining should be smooth. Skip the queues, grab your meal, and get back to what matters. Handcrafted for Bennett.
                            </p>
                        </div>

                        {/* Navigation */}
                        <div>
                            <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-8 opacity-80">Navigate</h4>
                            <ul className="space-y-4 text-base text-slate-300 font-bold">
                                <li><Link to="/" className=" inline-block transition-all duration-150">Daily Feed</Link></li>
                                <li><Link to="/orders/history" className=" inline-block transition-all duration-150">History</Link></li>
                                <li><Link to="/leaderboard" className=" inline-block transition-all duration-150">ELITE Board</Link></li>
                            </ul>
                        </div>

                        {/* Help & Legal */}
                        <div>
                            <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-8 opacity-80">Support</h4>
                            <ul className="space-y-4 text-base text-slate-300 font-bold">
                                <li><Link to="/help" className=" inline-block transition-all duration-150">Get Help</Link></li>
                                <li><Link to="/contact" className=" inline-block transition-all duration-150">Talk to us</Link></li>
                                <li><Link to="/privacy" className=" inline-block transition-all duration-150">Privacy</Link></li>
                                <li><Link to="/terms" className=" inline-block transition-all duration-150">Rules of Play</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-sm font-black text-slate-600 tracking-tight">&copy; {new Date().getFullYear()} CampusBite. All rights to your appetite.</p>
                        <div className="flex items-center space-x-3 bg-slate-900/50 px-5 py-2.5 rounded-2xl border border-slate-800/50">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Kitchens are Live</p>
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
            <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1">CampusBite</p>
            <p className="text-sm text-[var(--text-muted)]">Loading your campus feed</p>
        </div>
    </div>
);

function App() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    if (isLoading) {
        return <FullScreenLoader />;
    }

    return (
        <ThemeProvider>
            <ToastProvider>
                <CartProvider>
                    <ReactLenis root>
                        <React.Suspense fallback={null}>
                            <Scene />
                        </React.Suspense>
                        <div className="html-overlay min-h-screen flex flex-col">
                            <Router>
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

                            {/* Public Informational Routes */}
                            <Route path="/help" element={<Layout><HelpFAQ /></Layout>} />
                            <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
                            <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                            <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />

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

                            {/* Student Routes */}
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


                            {/* Owner Routes */}
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

                            {/* Admin Routes */}
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
                                        <Link to="/" className="btn-primary px-8 py-3">Go Home</Link>
                                        <button onClick={() => { logout(); window.location.href = '/login'; }} className="btn-secondary px-8 py-3 text-red-500 border-red-200  dark:border-red-500/20 dark:">Sign Out</button>
                                    </div>
                                </div>
                            } />

                                    <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </React.Suspense>
                            </Router>
                        </div>
                    </ReactLenis>
                </CartProvider>
            </ToastProvider>
        </ThemeProvider >
    );
}

export default App;
