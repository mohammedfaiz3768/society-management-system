// Utility to get API base URL from environment
export const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
};

// Helper for building full API URLs
export const buildApiUrl = (endpoint: string) => {
    const baseUrl = getApiUrl();
    const cleanBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${cleanBase}/${cleanEndpoint}`;
};
