import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL, // The Vite dev proxy intercepts this and forwards to localhost:5001
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle auth errors — clear stale token and redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMsg = error.response?.data?.error;
        const isBanned = errorMsg === 'ACCOUNT_BANNED';

        if (error.response?.status === 401) {
            const wasLoggedIn = !!localStorage.getItem('token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (isBanned) {
                localStorage.setItem('ban_notice', 'Your account has been restricted by an administrator.');
            }

            if (wasLoggedIn) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
