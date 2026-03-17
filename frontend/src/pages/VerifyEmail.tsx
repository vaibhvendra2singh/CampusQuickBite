import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { FadeIn } from '../components/animations/FadeIn';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verify = async () => {
            try {
                const response = await api.post('/auth/verify-email', { token });
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen w-full flex bg-transparent relative overflow-hidden font-sans items-center justify-center p-6">
            <FadeIn delay={0.1} direction="up" className="w-full max-w-md">
                <div className="bg-[var(--glass-bg)] backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-[var(--glass-border)] shadow-2xl text-center">
                    
                    <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-6 shadow-lg">
                        {status === 'loading' && <FiLoader className="text-brand-500 w-8 h-8 animate-spin" />}
                        {status === 'success' && <FiCheckCircle className="text-green-500 w-10 h-10" />}
                        {status === 'error' && <FiXCircle className="text-red-500 w-10 h-10" />}
                    </div>

                    <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
                        {status === 'loading' ? 'Verifying Email' : status === 'success' ? 'Email Verified' : 'Verification Failed'}
                    </h2>
                    
                    <p className="text-[var(--text-muted)] mb-8">
                        {status === 'loading' ? 'Please wait while we verify your email address...' : message}
                    </p>

                    {status !== 'loading' && (
                        <Link to="/login" className="btn-primary w-full flex justify-center py-3 px-4 font-semibold text-sm">
                            Go to Login
                        </Link>
                    )}
                </div>
            </FadeIn>
        </div>
    );
};

export default VerifyEmail;
