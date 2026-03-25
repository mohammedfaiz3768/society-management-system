import api from './api';

// ✅ Use the configured axios instance everywhere
// This ensures auth headers, timeout, and 401 redirect are always applied

export const get = (endpoint: string) => api.get(endpoint);
export const post = (endpoint: string, data?: unknown) => api.post(endpoint, data);
export const put = (endpoint: string, data?: unknown) => api.put(endpoint, data);
export const patch = (endpoint: string, data?: unknown) => api.patch(endpoint, data);
export const del = (endpoint: string) => api.delete(endpoint);

// Keep buildApiUrl only if needed for non-axios use cases (file downloads etc.)
export const buildApiUrl = (endpoint: string): string => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000/api')
        .replace(/\/$/, '');
    const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${base}/${clean}`;
};