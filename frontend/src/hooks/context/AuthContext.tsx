/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import api from '../../services/api';

export type Role = 'STUDENT' | 'SHOP_OWNER' | 'ADMIN';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    phoneNumber?: string;
    enrollmentNumber?: string;
    profilePic?: string;
    isFrozen?: boolean;
    isBanned?: boolean;
    hasShadowBadge?: boolean;
    hasCaffeineBadge?: boolean;
    hasGluttonBadge?: boolean;
    hasNightOwlBadge?: boolean;
    hasArcadeBadge?: boolean;
    hasExplorerBadge?: boolean;
    hasProGamerBadge?: boolean;
    hasCompletionistBadge?: boolean;
    hasHackerBadge?: boolean;
    xp?: number;
    tier?: string;
    walletBalance?: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
    updateUser: (userData: User) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                // Optimistically restore from cache immediately
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                setIsLoading(false); // Immediate entry!

                const payload = JSON.parse(atob(storedToken.split('.')[1]));
                // Silently refresh in background
                api.get(`/users/${payload.id}?t=${Date.now()}`).then(res => {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                }).catch((err: any) => {
                    console.error('Check: Background sync failed', err);
                    if (err.response?.status === 401 || err.response?.status === 403) {
                        logout();
                    }
                });
                return;
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const syncAuth = (e: StorageEvent) => {
            if (e.key === 'token' && !e.newValue) {
                setUser(null);
                setToken(null);
            }
            if (e.key === 'user' && e.newValue) {
                setUser(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', syncAuth);
        return () => window.removeEventListener('storage', syncAuth);
    }, []);

    const login = useCallback((userData: User, newToken: string) => {
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', newToken);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }, []);

    const updateUser = useCallback((userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
        isLoading
    }), [user, token, login, logout, updateUser, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
