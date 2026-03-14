/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import { useEffect, useState } from 'react';
import { FiAward, FiTrendingUp, FiStar, FiZap, FiShield } from 'react-icons/fi';
import api from '../../services/api';

interface LeaderboardUser {
 id: number;
 name: string;
 xp: number;
 tier: string;
 profilePic?: string;
}

const tierConfig: Record<string, { color: string, icon: any, label: string }> = {
 'ELECTRIC_BLUE': { color: 'text-brand-500 bg-brand-500/10 border-brand-500/30', icon: FiZap, label: 'Electric Blue' },
 'GOLD': { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', icon: FiStar, label: 'Gold' },
 'SILVER': { color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', icon: FiShield, label: 'Silver' },
 'BRONZE': { color: 'text-amber-700 bg-amber-700/10 border-amber-700/30', icon: FiAward, label: 'Bronze' }
};

const Leaderboard = () => {
 const [users, setUsers] = useState<LeaderboardUser[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchLeaderboard = async () => {
 try {
 const response = await api.get('/users/leaderboard');
 setUsers(response.data);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };
 fetchLeaderboard();
 const intervalId = setInterval(fetchLeaderboard, 15000);
 return () => clearInterval(intervalId);
 }, []);

 if (loading) return <div className="p-8 text-center text-[var(--text-muted)] animate-none font-medium text-sm">Loading leaderboard...</div>;

 return (
 <div className="max-w-4xl mx-auto p-6 md:p-12 animate-none">
 <div className="mb-10 text-center">
 <div className="w-12 h-12 bg-brand-50 text-brand-500 flex items-center justify-center rounded-2xl mx-auto shadow-sm mb-4">
 <FiTrendingUp className="w-6 h-6" />
 </div>
 <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
 Top <span className="text-brand-500">Students</span>
 </h1>
 <p className="text-sm text-[var(--text-muted)]">Campus loyalty ranking</p>
 </div>

 <div className="space-y-4">
 {users.length === 0 ? (
 <div className="text-center p-10 glass-panel text-[var(--text-muted)] font-medium text-sm">No data yet.</div>
 ) : (
 users.map((user, index) => {
 const tier = tierConfig[user.tier] || tierConfig['BRONZE'];
 const TierIcon = tier.icon;
 const isTop = index === 0;

 return (
 <div key={user.id} className={`group flex items-center p-5 rounded-2xl border transition-all duration-150 ${isTop ? 'bg-brand-50 dark:bg-brand-500/5 border-brand-500/50 shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-brand-500/50 hover:bg-[var(--bg-card-hover)]'}`}>
 <div className={`w-10 text-center text-xl font-bold ${isTop ? 'text-brand-500' : 'text-[var(--border-color)] group-hover:text-[var(--text-muted)]'}`}>
 #{index + 1}
 </div>
 <div className="mx-6 w-16 h-16 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
 {user.profilePic ? (
 <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
 ) : (
 <div className="text-lg font-bold text-[var(--text-muted)]">{user.name.charAt(0)}</div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className={`text-xl font-bold truncate ${isTop ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-primary)]'}`}>{user.name}</h3>
 <div className="flex items-center space-x-3 mt-1">
 <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center ${tier.color}`}>
 <TierIcon className="w-3 h-3 mr-1" />
 {tier.label}
 </div>
 </div>
 </div>
 <div className="text-right pl-4 border-l border-[var(--border-color)]">
 <p className="text-2xl font-bold text-[var(--text-primary)]">{user.xp}</p>
 <p className="text-xs text-[var(--text-muted)] font-medium">XP points</p>
 </div>
 </div>
 )
 })
 )}
 </div>
 </div>
 );
};

export default Leaderboard;
