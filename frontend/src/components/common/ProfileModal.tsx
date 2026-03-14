/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiMail, FiPhone, FiHash, FiUser, FiEdit3, FiSave, FiLoader, FiCamera, FiMapPin, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../hooks/context/ToastContext';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

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

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phoneNumber: user?.phoneNumber || '',
        enrollmentNumber: user?.enrollmentNumber || '',
        profilePic: user?.profilePic || '',
    });

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
            phoneNumber: user.phoneNumber || '',
            enrollmentNumber: user.enrollmentNumber || '',
            profilePic: user.profilePic || '',
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-none"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-none flex flex-col max-h-[90vh]">
                {/* Header Banner */}
                <div className="h-28 bg-brand-500 relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-700"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all z-20 backdrop-blur-md"
                    >
                        <FiX className="w-5 h-5" />
                    </button>

                    {/* Avatar Overlap */}
                    <div className="absolute bottom-0 left-6 translate-y-1/2 z-10">
                        <div className="p-1 bg-[var(--bg-primary)] rounded-full">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative shadow-sm group">
                                {(isEditing ? formData.profilePic : user.profilePic) ? (
                                    <img src={isEditing ? formData.profilePic : user.profilePic} alt={user.name} className="w-full h-full object-cover transition-all duration-150" />
                                ) : (
                                    <FiUser className="w-8 h-8 text-slate-400" />
                                )}
                                {isEditing && (
                                    <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FiCamera className="w-5 h-5 text-white" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto pt-14 pb-8 px-6 custom-scrollbar">
                    <div className="flex items-start justify-between mb-8">
                        <div className="space-y-1 text-left">
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
                            <div className="inline-flex items-center px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-brand-500/10">
                                {roleBadge}
                            </div>
                        </div>
                    </div>

                    {showAvatarPicker && isEditing && (
                        <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl animate-none border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Choose an Avatar</p>
                            <div className="grid grid-cols-4 gap-3">
                                {AVATAR_OPTIONS.map((url, idx) => (
                                    <button key={idx} onClick={() => selectAvatar(url)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${formData.profilePic === url ? 'border-brand-500 bg-brand-50' : 'border-transparent'}`}>
                                        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Details Card */}
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
                                    <InfoRow icon={FiHash} label="Enrollment ID" value={user.enrollmentNumber || 'Not Registered'} />
                                )
                            )}
                            <InfoRow icon={FiMail} label="Contact Email" value={user.email} />
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
                                <InfoRow icon={FiPhone} label="Mobile" value={user.phoneNumber || 'Add Phone'} />
                            )}
                        </div>

                        {/* Order History Link (for students) */}
                        {!isEditing && !isAdmin && !isOwner && (
                            <button
                                onClick={() => { onClose(); navigate('/orders/history'); }}
                                className="w-full flex items-center justify-between p-5 bg-slate-900 dark:bg-brand-500 text-white rounded-2xl hover:brightness-110 shadow-lg shadow-black/10 transition-all group ]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <FiShoppingBag className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider">History</span>
                                </div>
                                <FiArrowRight className=" transition-" />
                            </button>
                        )}
                    </div>

                    {/* Main Actions */}
                    <div className="flex gap-4 mt-8">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancel} disabled={isSaving} className="flex-1 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-all">Discard</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 text-[11px] font-bold text-white uppercase tracking-wider bg-brand-500 rounded-xl hover:bg-brand-600 transition-all shadow-lg flex items-center justify-center gap-2">
                                    {isSaving ? <FiLoader className="animate-spin" /> : <FiSave className="w-4 h-4" />}
                                    <span>{isSaving ? 'Updating...' : 'Save Settings'}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(true)} className="flex-1 py-4 text-[11px] font-bold text-brand-600 uppercase tracking-wider bg-brand-500/10 rounded-xl hover:bg-brand-500/20 transition-all flex items-center justify-center gap-2 border border-brand-500/10">
                                    <FiEdit3 className="w-4 h-4" /> Personalize
                                </button>
                                <button
                                    onClick={() => { onClose(); navigate('/change-password'); }}
                                    className="flex-1 py-4 text-[11px] font-bold text-rose-500 uppercase tracking-wider bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/10"
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
