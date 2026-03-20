/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const requestToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        
        setLoading(true);
        setMessage('');
        setError('');
        
        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('Token generated (check server console).');
            setError('');
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to request token');
            setMessage('');
        } finally {
            setLoading(false);
        }
    };

    const verifyTokenAndReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        
        setLoading(true);
        setMessage('');
        setError('');
        
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setMessage('Password successfully reset! Redirecting to login...');
            setError('');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
            setMessage('');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-[100] pointer-events-auto">
            <div className="max-w-md w-full p-8 card-modern border border-[var(--border-color)] shadow-2xl rounded-[2.5rem] bg-[var(--glass-bg)] backdrop-blur-2xl">
                <h2 className="text-3xl font-bold mb-6 text-[var(--text-primary)] tracking-tight">Recover Access</h2>
                {message && <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-100">{message}</div>}
                {error && <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-100">{error}</div>}

                {step === 1 && (
                    <form onSubmit={requestToken} className="space-y-5 animate-none">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Registered Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-sm font-semibold text-[var(--text-primary)]"
                                placeholder="user@campus.edu"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-4 btn-primary text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-colors shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-600'}`}
                        >
                            {loading ? 'Sending...' : 'Send Reset Token'}
                        </button>
                        <div className="text-center mt-6">
                            <button type="button" onClick={() => navigate('/login')} className="text-sm font-semibold text-[var(--text-secondary)] hover:text-brand-500 transition-colors">Return to Login</button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={verifyTokenAndReset} className="space-y-5 animate-none">
                        <p className="text-sm text-[var(--text-secondary)] mb-4 font-medium">Please enter the security token you received along with your new password.</p>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Security Token (UUID)</label>
                            <input
                                type="text"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                className="w-full p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-sm font-mono text-[var(--text-primary)]"
                                placeholder="xxxxxxxx-xxxx-xxxx..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2">New Password Required</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-sm font-semibold text-[var(--text-primary)]"
                                placeholder="Enter modern secure key"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-4 bg-brand-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-colors shadow-xl shadow-brand-500/20 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-600'}`}
                        >
                            {loading ? 'Processing...' : 'Confirm Reset'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
export default ForgotPassword;
