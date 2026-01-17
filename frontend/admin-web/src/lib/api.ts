import axios from 'axios';

// Use environment variable for API URL with fallback for development
let API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Ensure API URL doesn't have a trailing slash
API_URL = API_URL.replace(/\/$/, "");

// Ensure API URL ends with /api (since backend routes are prefixed with /api)
if (!API_URL.endsWith('/api')) {
    API_URL += '/api';
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect to login if we're not already there
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                localStorage.removeItem('admin_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
