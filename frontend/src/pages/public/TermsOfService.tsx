import { useState } from 'react';
import { useAuth } from '../../hooks/context/AuthContext';
import { useToast } from '../../hooks/context/ToastContext';
import api from '../../services/api';
import confetti from 'canvas-confetti';

const TermsOfService = () => {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [claiming, setClaiming] = useState(false);

    const handleCoffeeClick = async () => {
        if (!user) {
            showToast("Log in to collect this hidden badge!", "info");
            return;
        }
        if (claiming || user?.hasCaffeineBadge || user.role !== 'STUDENT') return;
        setClaiming(true);
        try {
            await api.post('/users/badge', { type: 'caffeine' });
            updateUser({ ...user, hasCaffeineBadge: true });
            const colors = ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3'];
            confetti({ particleCount: 250, spread: 360, origin: { x: 0.5, y: 0.5 }, startVelocity: 40, colors });
            setTimeout(() => confetti({ particleCount: 200, spread: 360, origin: { x: 0.5, y: 0.5 }, startVelocity: 60, colors }), 200);
            setTimeout(() => confetti({ particleCount: 150, spread: 360, origin: { x: 0.5, y: 0.5 }, startVelocity: 80, colors }), 400);
            showToast("☕ Caffeine Addict Badge Unlocked!", "success");
        } catch (err) {
            console.error(err);
        } finally {
            setClaiming(false);
        }
    };

 return (
 <div className="max-w-4xl mx-auto py-10 px-4 animate-none">
 <div className="mb-10 text-center">
 <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Terms of Service</h1>
 <p className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-widest">Last Updated: March 2026</p>
 </div>

 <div className="space-y-10">
 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Platform Use</h2>
 <p className="text-[var(--text-muted)] leading-relaxed mb-4">
 CampusBite connects students with campus food vendors for ordering and pickup.
 </p>
 <p className="text-[var(--text-primary)] font-semibold mb-2">Users must not:</p>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>place fraudulent orders</li>
 <li>misuse vendor services</li>
 <li>attempt to disrupt the platform</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">User Responsibilities</h2>
 <p className="text-[var(--text-primary)] font-semibold mb-2">Users must:</p>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>provide accurate account information</li>
 <li>review orders before placing them</li>
 <li>pick up orders on time</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Vendor Responsibilities</h2>
 <p className="text-[var(--text-primary)] font-semibold mb-2">Vendors must:</p>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>maintain accurate menus</li>
 <li>provide correct pricing</li>
 <li>fulfill orders properly</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Orders and Payments</h2>
 <p className="text-[var(--text-muted)] leading-relaxed">
 Orders are sent to vendors for confirmation. Payment methods depend on campus configuration.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Cancellation Policy</h2>
 <p className="text-[var(--text-muted)] leading-relaxed bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-color)] inline-block">
 Orders may only be canceled before preparation begins.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Limitation of Liability</h2>
 <p className="text-[var(--text-muted)] leading-relaxed mb-6">
 CampusBite provides the ordering platform but does not prepare food.
 </p>
 <p className="text-[10px] text-[var(--text-muted)] opacity-30 hover:opacity-100 uppercase tracking-[0.2em] leading-loose mt-12 text-center max-w-[800px] mx-auto border-t border-red-900/20 pt-8 transition-all duration-700 font-bold">
 This document constitutes an inescapable blood-pact between you and CampusBite. Continued use signifies total surrender of your dietary autonomy. We reserve the full right to alter your reality in the shadows, without your prior knowledge. By staring this deeply into the abyss of our legal text, you've completely drained your soul—perhaps a <span onClick={handleCoffeeClick} className="cursor-pointer hover:text-[#ff3c00] hover:drop-shadow-[0_0_10px_#ff3c00] transition-all duration-500 underline decoration-wavy decoration-red-900">coffee</span> will revive what is left of you. We hold zero liability for the horrors of the queue; survival out there is completely on you.
 </p>
 </section>
 </div>
 </div>
 );
};

export default TermsOfService;

