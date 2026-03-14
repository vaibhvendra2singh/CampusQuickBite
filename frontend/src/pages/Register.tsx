/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/context/AuthContext';
import { FiMail, FiLock, FiUser, FiArrowRight } from 'react-icons/fi';

const Register = () => {
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [role, setRole] = useState('STUDENT');
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);

 const { login } = useAuth();
 const navigate = useNavigate();

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setIsLoading(true);

 try {
 const response = await api.post('/auth/register', { name, email, password, role });
 const { token, user } = response.data;

 login(user, token);
 navigate('/');
 } catch (err: any) {
 if (err.response?.data?.error) {
 setError(err.response.data.error);
 } else if (err.response?.data) {
 const msgs = Object.values(err.response.data).join(', ');
 setError(msgs || 'Registration failed. Please try again.');
 } else {
 setError('Registration failed. Please try again.');
 }
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen w-full flex bg-[var(--bg-primary)] relative overflow-hidden font-sans">
 <div className="flex w-full z-10 animate-none flex-row-reverse">
 {/* Right Panel */}
 <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 xl:p-20 relative overflow-hidden bg-[#0A0F1A]">
 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

 <div className="relative z-10 flex flex-col h-full">
 <div>
 <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-10 shadow-lg">
 <span className="text-xl font-bold text-white">CB</span>
 </div>
 <h1 className="text-5xl xl:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
 Join<br />
 <span className="text-brand-500">CampusBite</span>
 </h1>
 <div className="flex items-center gap-3 mb-8">
 <span className="px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-md">Get Started</span>
 <span className="text-sm text-gray-400 font-medium">Free forever</span>
 </div>
 <p className="text-lg text-gray-400 max-w-sm leading-relaxed">
 Create your account and start ordering from campus vendors in seconds.
 </p>
 </div>

 <div className="mt-auto">
 <div className="flex items-center gap-8 border-r-2 border-brand-500 pr-6 justify-end">
 <div className="text-right">
 <p className="text-white font-bold text-2xl tracking-tight">Free</p>
 <p className="text-sm text-gray-500">No strings attached</p>
 </div>
 <div className="w-px h-8 bg-gray-700"></div>
 <div className="text-right">
 <p className="text-brand-400 font-bold text-2xl tracking-tight">All outlets</p>
 <p className="text-sm text-gray-500">Every campus vendor</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Left Panel — Form */}
 <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[var(--bg-primary)]">
 <div className="w-full max-w-md animate-none" style={{ animationDelay:"0.1s" }}>
 <div className="mb-10">
 <div className="lg:hidden w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center mb-6 mx-auto">
 <span className="text-lg font-bold text-white">CB</span>
 </div>
 <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">Create account</h2>
 <p className="text-sm text-[var(--text-muted)]">Get started with CampusBite</p>
 </div>

 <form className="space-y-5" onSubmit={handleSubmit}>
 {error && (
 <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 border border-red-200 dark:border-red-500/20 animate-none">
 <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
 <p>{error}</p>
 </div>
 )}

 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Full name</label>
 <div className="relative">
 <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
 <input type="text" required className="block w-full pl-11 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-sm" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
 </div>
 </div>

 <div>
 <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Email</label>
 <div className="relative">
 <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
 <input type="email" required className="block w-full pl-11 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-sm" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
 </div>
 </div>

 <div>
 <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Password</label>
 <div className="relative">
 <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
 <input type="password" required minLength={6} className="block w-full pl-11 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-sm" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
 </div>
 </div>

 <div>
 <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Account type</label>
 <div className="grid grid-cols-2 gap-3">
 <button type="button" onClick={() => setRole('STUDENT')} className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${role === 'STUDENT' ? 'border-brand-500 bg-brand-500/8 text-brand-500' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-brand-500/40'}`}>
 Student
 </button>
 <button type="button" onClick={() => setRole('SHOP_OWNER')} className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${role === 'SHOP_OWNER' ? 'border-brand-500 bg-brand-500/8 text-brand-500' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-brand-500/40'}`}>
 Shop Owner
 </button>
 </div>
 </div>
 </div>

 <button type="submit" disabled={isLoading} className="group w-full flex justify-center items-center py-3 px-4 btn-primary text-sm font-semibold disabled:opacity-50 mt-2">
 {isLoading ? (
 <span className="flex items-center">
 <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Creating account...
 </span>
 ) : (
 <>
 Create account
 <FiArrowRight className="ml-2 h-4 w-4 transition-" />
 </>
 )}
 </button>

 <div className="text-center pt-6 border-t border-[var(--border-color)]">
 <p className="text-sm text-[var(--text-muted)]">
 Already have an account?{' '}
 <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600 transition-colors">Sign in</Link>
 </p>
 </div>
 </form>
 </div>
 </div>
 </div>
 </div>
 );
};

export default Register;
