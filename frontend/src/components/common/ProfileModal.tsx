/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiMail, FiPhone, FiHash, FiUser, FiEdit3, FiSave, FiLoader, FiCamera, FiMapPin, FiShoppingBag, FiArrowRight, FiZap, FiStar, FiShield, FiAward } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../hooks/context/ToastContext';


interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const tierConfig: Record<string, { color: string, icon: any, label: string }> = {
    'ELECTRIC_BLUE': { color: 'text-brand-500 bg-brand-500/10 border-brand-500/30', icon: FiZap, label: 'Electric Blue' },
    'GOLD': { color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', icon: FiStar, label: 'Gold' },
    'SILVER': { color: 'text-gray-400 bg-gray-400/10 border-gray-400/30', icon: FiShield, label: 'Silver' },
    'BRONZE': { color: 'text-amber-700 bg-amber-700/10 border-amber-700/30', icon: FiAward, label: 'Bronze' }
};

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jade',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy',
];

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [shopAddress, setShopAddress] = useState('');
    const isOwner = user?.role === 'SHOP_OWNER';
    const isAdmin = user?.role === 'ADMIN';
    const hasAllBadges = user?.hasShadowBadge && user?.hasCaffeineBadge && user?.hasGluttonBadge && user?.hasNightOwlBadge && user?.hasArcadeBadge && user?.hasExplorerBadge && user?.hasProGamerBadge && user?.hasHackerBadge;

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phoneNumber: user?.phoneNumber || (user as any)?.phone_number || '',
        enrollmentNumber: user?.enrollmentNumber || (user as any)?.enrollment_number || '',
        profilePic: user?.profilePic || (user as any)?.profile_pic || '',
    });

    // CRITICAL FIX: Refresh user data every time the modal is opened
    // This handles admin overrides (like revokes) that happen in other tabs
    useEffect(() => {
        if (isOpen && user?.id) {
            api.get(`/users/${user.id}?t=${Date.now()}`).then(res => {
                if (res.data) {
                    console.log('[DEBUG] Fresh profile loaded, syncing state...');
                    updateUser(res.data);
                }
            }).catch(e => console.error('Failed cross-tab profile sync:', e));
        }
    }, [isOpen, user?.id, updateUser]);

    useEffect(() => {
        if (isOwner && user) {
            api.get('/outlets').then(res => {
                const myOutlet = res.data.find((o: any) => o.owner?.id === user.id);
                if (myOutlet) setShopAddress(myOutlet.location || '');
            }).catch(() => { });
        }
    }, [isOwner, user]);

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await api.put(`/users/${user.id}`, {
                ...user,
                ...formData
            });
            updateUser(response.data);
            showToast('Profile updated successfully! 🎉', 'success');
            setIsEditing(false);
            setShowAvatarPicker(false);
        } catch (error: any) {
            console.error('Failed to update profile', error);
            const errorMessage = error.response?.data?.error || 'Failed to update profile. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user.name,
            phoneNumber: user.phoneNumber || (user as any).phone_number || '',
            enrollmentNumber: user.enrollmentNumber || (user as any).enrollment_number || '',
            profilePic: user.profilePic || (user as any).profile_pic || '',
        });
        setIsEditing(false);
        setShowAvatarPicker(false);
    };

    const selectAvatar = (url: string) => {
        setFormData({ ...formData, profilePic: url });
        setShowAvatarPicker(false);
    };

    const roleBadge = isAdmin ? 'Admin' : isOwner ? 'Shop Owner' : 'Student';

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className={`bg-[var(--bg-card)] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-none flex flex-col max-h-[90vh] ${hasAllBadges ? 'animate-profile-glow border-2' : ''}`}>
                <div className="h-28 bg-brand-500 relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-700"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 bg-white/10  text-white rounded-xl flex items-center justify-center transition-all z-20 backdrop-blur-md"
                    >
                        <FiX className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-0 left-6 translate-y-[150%] z-10">
                        <div className="p-1 bg-[var(--bg-card)] rounded-full text-left">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative shadow-sm group">
                                {(isEditing ? formData.profilePic : user.profilePic) ? (
                                    <img loading="lazy" decoding="async" src={isEditing ? formData.profilePic : user.profilePic} alt={user.name} className="w-full h-full object-cover transition-all duration-150" />
                                ) : (
                                    <FiUser className="w-8 h-8 text-slate-400" />
                                )}
                                {isEditing && (
                                    <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group- transition-opacity">
                                        <FiCamera className="w-5 h-5 text-white" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pt-12 pb-8 px-6 custom-scrollbar">
                    <div className="flex items-start justify-between mb-8">
                        <div className="space-y-1 text-left pl-28">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="text-2xl font-bold text-[var(--text-primary)] bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2 border border-brand-500/20 focus:border-brand-500 outline-none w-full shadow-sm"
                                    placeholder="Your Display Name"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{user.name}</h2>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                                <div className="inline-flex items-center px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-brand-500/10">
                                    {roleBadge}
                                </div>
                                {user.role === 'STUDENT' && (
                                    <>
                                        <div className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${tierConfig[user.tier || 'BRONZE'].color}`}>
                                            {React.createElement(tierConfig[user.tier || 'BRONZE'].icon, { className: "w-3 h-3 mr-1" })}
                                            {tierConfig[user.tier || 'BRONZE'].label}
                                        </div>
                                        {user.hasShadowBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-[#1a1a1a] text-[#00ff46] text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[#00ff46]/40 shadow-[0_0_10px_rgba(0,255,70,0.15)] glitch-hover">
                                                👾 Shadow Agent
                                            </div>
                                        )}
                                        {user.hasCaffeineBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-amber-950/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-500/30">
                                                ☕ Caffeine Addict
                                            </div>
                                        )}
                                        {user.hasGluttonBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-red-950/20 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-500/30">
                                                🍔 The Glutton
                                            </div>
                                        )}
                                        {user.hasNightOwlBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-indigo-950/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-indigo-500/30">
                                                🌙 Night Owl
                                            </div>
                                        )}
                                        {user.hasArcadeBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-pink-950/20 text-pink-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-pink-500/30">
                                                🕹️ Arcade King
                                            </div>
                                        )}
                                        {user.hasExplorerBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-emerald-950/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-500/30">
                                                🕵️ Urban Explorer
                                            </div>
                                        )}
                                        {user.hasProGamerBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-cyan-950/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-cyan-500/30">
                                                🏆 Pro Gamer
                                            </div>
                                        )}

                                        {user.hasHackerBadge && (
                                            <div className="inline-flex items-center px-3 py-1 bg-emerald-950/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.15)] glitch-hover">
                                                🖥️ The Hacker
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {showAvatarPicker && isEditing && (
                        <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl animate-none border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Choose an Avatar</p>
                            <div className="grid grid-cols-4 gap-3">
                                {AVATAR_OPTIONS.map((url, idx) => (
                                    <button key={idx} onClick={() => selectAvatar(url)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${formData.profilePic === url ? 'border-brand-500 bg-brand-50' : 'border-transparent'}`}>
                                        <img loading="lazy" decoding="async" src={url} alt="Avatar" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                            {isOwner && <InfoRow icon={FiMapPin} label="Shop Location" value={shopAddress || 'Not Assigned'} />}
                            {!isOwner && !isAdmin && (
                                isEditing ? (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Enrollment ID</p>
                                        <input
                                            type="text"
                                            value={formData.enrollmentNumber}
                                            onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                                            className="w-full text-base font-semibold bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-brand-500 transition-all font-mono"
                                        />
                                    </div>
                                ) : (
                                    <InfoRow
                                        icon={FiHash}
                                        label="Enrollment ID"
                                        value={user.enrollmentNumber || (user as any).enrollment_number || 'Not Registered'}
                                    />
                                )
                            )}
                            <InfoRow icon={FiMail} label="Contact Email" value={user.email} />
                            {!isOwner && !isAdmin && (
                                <div className="bg-brand-500/5 p-4 rounded-2xl border border-brand-500/20 flex flex-col items-center justify-center space-y-1">
                                    <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Available Balance</p>
                                    <p className="text-3xl font-black text-[var(--text-primary)]">₹{user.walletBalance?.toFixed(2) || '0.00'}</p>
                                </div>
                            )}
                            {isEditing ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Primary Phone</p>
                                    <input
                                        type="text"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full text-base font-semibold bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-brand-500 transition-all"
                                    />
                                </div>
                            ) : (
                                <InfoRow
                                    icon={FiPhone}
                                    label="Mobile"
                                    value={user.phoneNumber || (user as any).phone_number || 'Add Phone'}
                                />
                            )}
                        </div>

                        {!isEditing && !isAdmin && !isOwner && (
                            <>


                                <button
                                    onClick={() => { onClose(); navigate('/orders/history'); }}
                                    className="w-full flex items-center justify-between p-5 bg-slate-900 dark:bg-brand-500 text-white rounded-2xl shadow-lg shadow-black/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <FiShoppingBag className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider">History</span>
                                    </div>
                                    <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex gap-4 mt-8">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancel} disabled={isSaving} className="flex-1 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 rounded-xl  transition-all">Discard</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 text-[11px] font-bold text-white uppercase tracking-wider bg-brand-500 rounded-xl  transition-all shadow-lg flex items-center justify-center gap-2">
                                    {isSaving ? <FiLoader className="animate-spin" /> : <FiSave className="w-4 h-4" />}
                                    <span>{isSaving ? 'Updating...' : 'Save Settings'}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(true)} className="flex-1 py-4 text-[11px] font-bold text-brand-600 uppercase tracking-wider bg-brand-500/10 rounded-xl  transition-all flex items-center justify-center gap-2 border border-brand-500/10">
                                    <FiEdit3 className="w-4 h-4" /> Personalize
                                </button>
                                <button
                                    onClick={() => { onClose(); navigate('/change-password'); }}
                                    className="flex-1 py-4 text-[11px] font-bold text-rose-500 uppercase tracking-wider bg-rose-500/10 rounded-xl  transition-all border border-rose-500/10"
                                >
                                    Security
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-center gap-4 group">
        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-brand-500 flex-shrink-0 transition-all border border-slate-100 dark:border-slate-800 shadow-sm">
            <Icon className="w-5 h-5" />
        </div>
        <div className="text-left overflow-hidden">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{label}</p>
            <p className="text-base font-bold text-[var(--text-primary)] truncate tracking-tight">{value}</p>
        </div>
    </div>
);

export default ProfileModal;
