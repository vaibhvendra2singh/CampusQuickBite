/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
            // Validate the token is not expired (check client-side JWT expiry)
            try {
                const payload = JSON.parse(atob(storedToken.split('.')[1]));
                const isExpired = payload.exp * 1000 < Date.now();
                if (isExpired) {
                    console.log('Stored token is expired, clearing...');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsLoading(false);
                    return;
                }

                // Token not expired client-side — validate against backend
                api.get('/cart').then(() => {
                    // Token valid — restore session
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }).catch((err: any) => {
                    if (err.response?.status === 401 || err.response?.status === 403) {
                        console.log('Token rejected by backend, clearing session...');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    } else {
                        // Network error or server down — restore session anyway
                        setToken(storedToken);
                        setUser(JSON.parse(storedUser));
                    }
                }).finally(() => setIsLoading(false));
                return;
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User, newToken: string) => {
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const updateUser = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            updateUser,
            isAuthenticated: !!token,
            isLoading
        }}>
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
