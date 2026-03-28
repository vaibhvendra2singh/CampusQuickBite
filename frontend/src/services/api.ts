import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL,
    withCredentials: true, // Crucial for receiving/sending HttpOnly cookies (refreshToken)
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        if (response.data && response.data.success && response.data.data !== undefined) {
            return {
                ...response,
                data: response.data.data
            };
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.data && !error.response.data.error && error.response.data.message) {
            error.response.data.error = error.response.data.message;
        }

        const errorMsg = error.response?.data?.error;
        const isBanned = errorMsg === 'ACCOUNT_BANNED';

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshRes = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
                const { token } = refreshRes.data.data;

                localStorage.setItem('token', token);
                api.defaults.headers.common.Authorization = `Bearer ${token}`;
                originalRequest.headers.Authorization = `Bearer ${token}`;

                processQueue(null, token);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                const wasLoggedIn = !!localStorage.getItem('token');
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (isBanned) {
                    localStorage.setItem('ban_notice', 'Your account has been restricted by an administrator.');
                }

                if (wasLoggedIn) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if ((error.response?.status === 403 || isBanned) && !originalRequest._retry) {
             if (isBanned) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.setItem('ban_notice', 'Your account has been restricted by an administrator.');
                window.location.href = '/login';
             }
        }

        return Promise.reject(error);
    }
);

export default api;
