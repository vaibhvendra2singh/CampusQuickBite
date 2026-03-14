/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/context/AuthContext';

const ResetPassword = () => {
 const { user } = useAuth();
 const navigate = useNavigate();

 const [oldPassword, setOldPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [message, setMessage] = useState('');
 const [error, setError] = useState('');

 const handleChangePassword = async (e: React.FormEvent) => {
 e.preventDefault();
 if (newPassword !== confirmPassword) {
 setError('New passwords do not match.');
 return;
 }

 try {
 await api.post('/auth/change-password', {
 oldPassword,
 newPassword
 });
 setMessage('Password updated successfully!');
 setError('');

 // Navigate back to their respective dashboard after 2s
 setTimeout(() => {
 const normalizedRole = user?.role === 'SHOP_OWNER' ? 'owner' : user?.role?.toLowerCase();
 if (normalizedRole === 'admin') navigate('/admin/dashboard');
 else if (normalizedRole === 'owner') navigate('/owner/dashboard');
 else navigate('/student/dashboard');
 }, 2000);

 } catch (err: any) {
 setError(err.response?.data?.error || 'Failed to update password');
 }
 };

 return (
 <div className="max-w-md mx-auto mt-20 p-8 card-modern text-slate-900 border border-slate-200">
 <h2 className="text-2xl font-bold mb-6 tracking-tight">Change Security Key</h2>
 {message && <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-100">{message}</div>}
 {error && <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-100">{error}</div>}

 <form onSubmit={handleChangePassword} className="space-y-5">
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Old Password</label>
 <input
 type="password"
 value={oldPassword}
 onChange={e => setOldPassword(e.target.value)}
 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none transition-all text-sm shadow-inner"
 required
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-brand-500 uppercase tracking-widest mb-2">New Password Key</label>
 <input
 type="password"
 value={newPassword}
 onChange={e => setNewPassword(e.target.value)}
 className="w-full p-4 bg-slate-50 border border-brand-200 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-sm font-semibold shadow-inner"
 required
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Confirm Identity Key</label>
 <input
 type="password"
 value={confirmPassword}
 onChange={e => setConfirmPassword(e.target.value)}
 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-500 outline-none transition-all text-sm shadow-inner"
 required
 />
 </div>
 <button type="submit" className="w-full py-4 mt-4 bg-brand-500 text-white text-sm font-bold uppercase tracking-widest rounded-xl shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-colors">
 Commit Changes
 </button>
 <div className="text-center mt-6">
 <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">Abort & Return</button>
 </div>
 </form>
 </div>
 );
};
export default ResetPassword;
