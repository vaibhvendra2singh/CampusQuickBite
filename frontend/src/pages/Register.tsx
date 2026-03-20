/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/context/AuthContext';
import { FiMail, FiLock, FiUser, FiArrowRight, FiHash } from 'react-icons/fi';
import { FadeIn } from '../components/animations/FadeIn';

// --- Validation helpers ---
const ENROLLMENT_REGEX = /^[a-zA-Z0-9]{8,12}$/;

const validateEnrollment = (value: string): string => {
    if (!value.trim()) return 'Enrollment number is required.';
    if (!ENROLLMENT_REGEX.test(value.trim()))
        return 'Must be 8–12 alphanumeric characters.';
    return '';
};

interface FieldTouched {
    enrollmentNumber: boolean;
}

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [enrollmentNumber, setEnrollmentNumber] = useState('');
    const [enrollmentError, setEnrollmentError] = useState('');
    const [touched, setTouched] = useState<FieldTouched>({ enrollmentNumber: false });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = Registration, 2 = OTP
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Real-time enrollment validation (only after field is touched)
    useEffect(() => {
        if (touched.enrollmentNumber) {
            setEnrollmentError(validateEnrollment(enrollmentNumber));
        }
    }, [enrollmentNumber, touched.enrollmentNumber]);

    const handleEnrollmentBlur = useCallback(() => {
        setTouched(prev => ({ ...prev, enrollmentNumber: true }));
        setEnrollmentError(validateEnrollment(enrollmentNumber));
    }, [enrollmentNumber]);

    // Derived: show enrollment field only for STUDENT role
    const isStudent = role === 'STUDENT';

    // Derived: overall form validity
    const isFormValid = useMemo(() => {
        if (!name || !email || password.length < 6) return false;
        if (isStudent && !!validateEnrollment(enrollmentNumber)) return false;
        return true;
    }, [name, email, password, isStudent, enrollmentNumber]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Force-show enrollment error on submit attempt (students only)
        if (isStudent) {
            setTouched({ enrollmentNumber: true });
            const enrErr = validateEnrollment(enrollmentNumber);
            setEnrollmentError(enrErr);
            if (enrErr) return;
        }

        setError('');
        setIsLoading(true);

        try {
            const payload: Record<string, string> = { name, email, password, role };
            if (isStudent) payload.enrollmentNumber = enrollmentNumber.trim();

            const response = await api.post('/auth/register', payload);

            if (response.data.requiresVerification) {
                setMessage(response.data.message);
                setStep(2);
            } else {
                const { token, user } = response.data;
                if (isStudent) {
                    localStorage.setItem('enrollmentNumber', enrollmentNumber.trim());
                }
                login(user, token);
                navigate('/');
            }
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
    }, [name, email, password, role, enrollmentNumber, isStudent, login, navigate]);

    const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/verify-otp', { email, otp });
            if (isStudent) {
                localStorage.setItem('enrollmentNumber', enrollmentNumber.trim());
            }
            setMessage('Account verified successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [email, otp, isStudent, enrollmentNumber, navigate]);

    const handleResendOtp = useCallback(async () => {
        if (resendLoading) return;
        setResendLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/auth/resend-otp', { email });
            setMessage(response.data.message || 'New verification code sent!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend code');
        } finally {
            setResendLoading(false);
        }
    }, [email, resendLoading]);

    const handleRoleChange = useCallback((newRole: string) => {
        setRole(newRole);
        // Reset enrollment state when switching roles
        if (newRole !== 'STUDENT') {
            setEnrollmentNumber('');
            setEnrollmentError('');
            setTouched({ enrollmentNumber: false });
        }
    }, []);

    // --- Shared input class builder ---
    const inputClass = (hasError: boolean) =>
        `block w-full pl-11 pr-4 py-3 bg-[var(--bg-input)] border rounded-xl text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 transition-all text-sm ${
            hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                : 'border-[var(--border-color)] focus:border-brand-500 focus:ring-brand-500/10'
        }`;

    return (
        <div className="min-h-screen w-full flex bg-transparent relative overflow-hidden font-sans">
            <div className="flex w-full z-10 flex-row-reverse">
                {/* Right Panel */}
                <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 xl:p-20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col h-full">
                        <FadeIn delay={0.1} direction="up">
                            <div>
                                <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-10 shadow-lg">
                                    <span className="text-xl font-bold text-white">CB</span>
                                </div>
                                <h1 className="text-5xl xl:text-6xl font-black text-slate-800 dark:text-white tracking-tight leading-[1.1] mb-6 drop-shadow-md">
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
                        </FadeIn>

                        <div className="mt-auto">
                            <FadeIn delay={0.2} direction="left">
                                <div className="flex items-center gap-8 border-r-2 border-brand-500 pr-6 justify-end">
                                    <div className="text-right">
                                        <p className="text-slate-800 dark:text-white font-black text-3xl tracking-tight drop-shadow-sm">Free</p>
                                        <p className="text-sm font-medium text-slate-600 dark:text-gray-300">No strings attached</p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-700"></div>
                                    <div className="text-right">
                                        <p className="text-brand-600 dark:text-brand-400 font-black text-3xl tracking-tight drop-shadow-sm">All outlets</p>
                                        <p className="text-sm font-medium text-slate-600 dark:text-gray-300">Every campus vendor</p>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>

                {/* Left Panel — Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
                    <FadeIn delay={0.3} direction="up" className="w-full max-w-md">
                        <div className="bg-[var(--glass-bg)] backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-[var(--glass-border)] shadow-2xl">
                            <div className="mb-10">
                                <div className="lg:hidden w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center mb-6 mx-auto">
                                    <span className="text-lg font-bold text-white">CB</span>
                                </div>
                                <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">Create account</h2>
                                <p className="text-sm text-[var(--text-muted)]">Get started with CampusBite</p>
                            </div>

                            {step === 1 ? (
                                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 border border-red-200 dark:border-red-500/20">
                                            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {/* Full Name */}
                                        <div>
                                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Full name<span className="ml-1 text-red-500">*</span></label>
                                            <div className="relative">
                                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                                                <input
                                                    type="text"
                                                    required
                                                    className={inputClass(false)}
                                                    placeholder="Your name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Email<span className="ml-1 text-red-500">*</span></label>
                                            <div className="relative">
                                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                                                <input
                                                    type="email"
                                                    required
                                                    className={inputClass(false)}
                                                    placeholder="you@college.edu"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Password<span className="ml-1 text-red-500">*</span></label>
                                            <div className="relative">
                                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                                                <input
                                                    type="password"
                                                    required
                                                    minLength={6}
                                                    className={inputClass(false)}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Account Type */}
                                        <div>
                                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Account type<span className="ml-1 text-red-500">*</span></label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRoleChange('STUDENT')}
                                                    className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${role === 'STUDENT' ? 'border-brand-500 bg-brand-500/8 text-brand-500' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
                                                >
                                                    Student
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRoleChange('SHOP_OWNER')}
                                                    className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${role === 'SHOP_OWNER' ? 'border-brand-500 bg-brand-500/8 text-brand-500' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
                                                >
                                                    Shop Owner
                                                </button>
                                            </div>
                                        </div>

                                        {/* Enrollment Number — only for students */}
                                        {isStudent && (
                                            <div>
                                                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                                                    Enrollment Number
                                                    <span className="ml-1 text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                                                    <input
                                                        id="register-enrollment"
                                                        type="text"
                                                        maxLength={12}
                                                        className={inputClass(!!enrollmentError)}
                                                        placeholder="Enter your university enrollment number"
                                                        value={enrollmentNumber}
                                                        onChange={(e) => setEnrollmentNumber(e.target.value)}
                                                        onBlur={handleEnrollmentBlur}
                                                        aria-describedby={enrollmentError ? 'register-enr-error' : undefined}
                                                        aria-invalid={!!enrollmentError}
                                                    />
                                                </div>
                                                {enrollmentError && (
                                                    <p
                                                        id="register-enr-error"
                                                        role="alert"
                                                        className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1"
                                                    >
                                                        <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        {enrollmentError}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || !isFormValid}
                                        className="group w-full flex justify-center items-center py-3 px-4 btn-primary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-2 transition-opacity"
                                    >
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
                                            <Link to="/login" className="text-brand-500 font-medium transition-colors">Sign in</Link>
                                        </p>
                                    </div>
                                </form>
                            ) : (
                                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                                    {message && (
                                        <div className="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm font-medium border border-green-200 dark:border-green-500/20">
                                            {message}
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-200 dark:border-red-500/20">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] block text-center">Enter 6-digit Code</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            required
                                            className="block w-full px-4 py-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl text-center text-3xl font-bold tracking-[0.5em] text-brand-500 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-inner"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <p className="text-xs text-[var(--text-muted)] text-center pt-2">
                                            We've sent a code to <span className="font-semibold text-[var(--text-primary)]">{email}</span>
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 btn-primary text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-brand-500/20 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify & Complete'}
                                    </button>

                                    <div className="text-center pt-4">
                                        <button
                                            type="button"
                                            disabled={resendLoading}
                                            onClick={handleResendOtp}
                                            className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors disabled:opacity-50"
                                        >
                                            {resendLoading ? 'Sending...' : "Didn't receive code? Resend"}
                                        </button>
                                    </div>

                                    <div className="text-center pt-4 border-t border-[var(--border-color)]">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            ← Back to registration
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </FadeIn>
                </div>
            </div>
        </div>
    );
};

export default Register;
