/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/context/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiAlertOctagon, FiHash } from 'react-icons/fi';
import { FadeIn } from '../components/animations/FadeIn';

const ENROLLMENT_REGEX = /^[a-zA-Z0-9]{8,12}$/;

const validateEnrollment = (value: string): string => {
    if (!value.trim()) return 'Enrollment number is required.';
    if (!ENROLLMENT_REGEX.test(value.trim()))
        return 'Must be 8–12 alphanumeric characters.';
    return '';
};

type LoginRole = 'STUDENT' | 'SHOP_OWNER';

const Login = () => {
    const [loginAs, setLoginAs] = useState<LoginRole>('STUDENT');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [enrollmentNumber, setEnrollmentNumber] = useState('');
    const [enrollmentError, setEnrollmentError] = useState('');
    const [enrollmentTouched, setEnrollmentTouched] = useState(false);
    const [error, setError] = useState('');
    const [banNotice, setBanNotice] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const saved = localStorage.getItem('enrollmentNumber');
        if (saved) setEnrollmentNumber(saved);

        const notice = localStorage.getItem('ban_notice');
        if (notice) {
            setBanNotice(notice);
            localStorage.removeItem('ban_notice');
        }
    }, []);

    useEffect(() => {
        if (enrollmentTouched && loginAs === 'STUDENT') {
            setEnrollmentError(validateEnrollment(enrollmentNumber));
        }
    }, [enrollmentNumber, enrollmentTouched, loginAs]);

    const handleRoleChange = useCallback((role: LoginRole) => {
        setLoginAs(role);
        setEnrollmentError('');
        setEnrollmentTouched(false);
        setError('');
    }, []);

    const handleEnrollmentBlur = useCallback(() => {
        setEnrollmentTouched(true);
        setEnrollmentError(validateEnrollment(enrollmentNumber));
    }, [enrollmentNumber]);

    const isStudent = loginAs === 'STUDENT';

    const isFormValid = useMemo(() => {
        if (!email || !password) return false;
        if (isStudent && !!validateEnrollment(enrollmentNumber)) return false;
        return true;
    }, [email, password, isStudent, enrollmentNumber]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (isStudent) {
            setEnrollmentTouched(true);
            const enrErr = validateEnrollment(enrollmentNumber);
            setEnrollmentError(enrErr);
            if (enrErr) return;
        }

        setError('');
        setIsLoading(true);

        try {
            const payload: Record<string, string> = { email, password };
            if (isStudent) payload.enrollmentNumber = enrollmentNumber.trim();

            const response = await api.post('/auth/login', payload);
            const { token, user } = response.data;

            if (isStudent) {
                localStorage.setItem('enrollmentNumber', enrollmentNumber.trim());
            }

            login(user, token);
            navigate('/');
        } catch (err: any) {
            if (err.response?.data?.error === 'ACCOUNT_NOT_VERIFIED') {
                setError('Your email is not verified. Please check your inbox for the verification link.');
            } else {
                setError(err.response?.data?.error || 'Sign in failed. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [email, password, enrollmentNumber, isStudent, login, navigate]);

    const inputClass = (hasError: boolean) =>
        `block w-full pl-11 pr-4 py-3 bg-[var(--bg-input)] border rounded-xl text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 transition-all text-sm ${
            hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                : 'border-[var(--border-color)] focus:border-brand-500 focus:ring-brand-500/10'
        }`;

    return (
        <div className="min-h-screen w-full flex bg-transparent relative overflow-hidden font-sans">
            <div className="flex w-full z-10">
                <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 xl:p-20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col h-full">
                        <FadeIn delay={0.1} direction="up">
                            <div className="mb-10" style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                                <span style={{ color: 'var(--color-brand-500)' }}>Campus</span>Bites
                            </div>
                            <h1 className="text-5xl xl:text-6xl font-black text-slate-800 dark:text-white tracking-tight leading-[1.1] mb-6 drop-shadow-md">
                                Campus<br />
                                <span className="text-brand-500">Bites</span>
                            </h1>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-md">Order Ahead</span>
                                <span className="text-sm text-gray-400 font-medium">Skip the Queue</span>
                            </div>
                            <p className="text-lg text-gray-400 max-w-sm leading-relaxed">
                                Browse menus, order from your phone, and pick up when it's ready.
                            </p>
                        </FadeIn>

                        <div className="mt-auto">
                            <FadeIn delay={0.2} direction="right">
                                <div className="space-y-1 border-l-4 border-brand-500 pl-5">
                                    <p className="text-slate-800 dark:text-white font-black text-3xl tracking-tight drop-shadow-sm">Zero wait time.</p>
                                    <p className="text-brand-600 dark:text-brand-400 font-black text-3xl tracking-tight drop-shadow-sm">More eating.</p>
                                    <p className="text-base text-slate-600 dark:text-gray-300 mt-3 font-medium">Simple campus dining</p>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-16 relative">
                    <FadeIn delay={0.3} direction="up" className="w-full max-w-md">
                        <div className="bg-[var(--glass-bg)] backdrop-blur-2xl p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-[var(--glass-border)] shadow-2xl">
                            <div className="mb-8">
                                <div className="lg:hidden mb-6 mx-auto text-center" style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                                    <span style={{ color: 'var(--color-brand-500)' }}>Campus</span>Bites
                                </div>
                                <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">Sign in</h2>
                                <p className="text-sm text-[var(--text-muted)]">Welcome back to Campus Bites</p>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Sign in as<span className="ml-1 text-red-500">*</span></p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleRoleChange('STUDENT')}
                                        className={`py-2.5 px-4 rounded-xl border font-semibold text-sm transition-all ${
                                            loginAs === 'STUDENT'
                                                ? 'border-brand-500 bg-brand-500/8 text-brand-500'
                                                : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        🎓 Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRoleChange('SHOP_OWNER')}
                                        className={`py-2.5 px-4 rounded-xl border font-semibold text-sm transition-all ${
                                            loginAs === 'SHOP_OWNER'
                                                ? 'border-brand-500 bg-brand-500/8 text-brand-500'
                                                : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        🏪 Shop Owner
                                    </button>
                                </div>
                            </div>

                            {banNotice && (
                                <div className="bg-red-600 text-white p-5 rounded-2xl text-sm font-bold flex items-center gap-4 border-2 border-red-700 shadow-xl mb-6 animate-[pulse_2s_infinite]">
                                    <FiAlertOctagon className="h-6 w-6 flex-shrink-0" />
                                    <div>
                                        <p className="uppercase tracking-widest text-[10px] opacity-80 mb-1">Account Restricted</p>
                                        <p>{banNotice}</p>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 border border-red-200 dark:border-red-500/20">
                                        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        <p>{error}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Email<span className="ml-1 text-red-500">*</span></label>
                                        <div className="relative">
                                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4.5 w-4.5" />
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

                                    <div>
                                        <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Password<span className="ml-1 text-red-500">*</span></label>
                                        <div className="relative">
                                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4.5 w-4.5" />
                                            <input
                                                type="password"
                                                required
                                                className={inputClass(false)}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {isStudent && (
                                        <div>
                                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                                                Enrollment Number
                                                <span className="ml-1 text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                                                <input
                                                    id="login-enrollment"
                                                    type="text"
                                                    maxLength={12}
                                                    className={inputClass(!!enrollmentError)}
                                                    placeholder="Enter your university enrollment number"
                                                    value={enrollmentNumber}
                                                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                                                    onBlur={handleEnrollmentBlur}
                                                    aria-describedby={enrollmentError ? 'login-enr-error' : undefined}
                                                    aria-invalid={!!enrollmentError}
                                                />
                                            </div>
                                            {enrollmentError && (
                                                <p
                                                    id="login-enr-error"
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

                                <div className="flex justify-end">
                                    <Link to="/forgot-password" className="text-sm font-medium text-brand-500 transition-colors">Forgot password?</Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !isFormValid}
                                    className="group w-full flex justify-center items-center py-3 px-4 btn-primary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : (
                                        <>
                                            Sign in
                                            <FiArrowRight className="ml-2 h-4 w-4 transition-" />
                                        </>
                                    )}
                                </button>

                                <div className="pt-6 text-center border-t border-[var(--border-color)]">
                                    <p className="text-sm text-[var(--text-muted)] mb-3">Don't have an account?</p>
                                    <Link to="/register" className="btn-secondary w-full justify-center">
                                        Create account
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </div>
    );
};

export default Login;
