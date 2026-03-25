import axios from 'axios';

// ✅ Clean URL — just strip trailing slash, trust the env var
// NEXT_PUBLIC_API_BASE_URL should be set to your full API base e.g. https://api.unify.com/api
const API_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000/api' // ✅ correct port
).replace(/\/$/, '');

// ✅ Log active URL in development
if (process.env.NODE_ENV === 'development') {
    console.log('[api] Base URL:', API_URL);
}

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // ✅ 15s timeout — prevents infinite hangs
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // ✅ SSR guard — localStorage doesn't exist on server
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('admin_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                localStorage.removeItem('admin_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;