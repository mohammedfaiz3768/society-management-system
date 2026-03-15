export const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
};

export const buildApiUrl = (endpoint: string) => {
    const baseUrl = getApiUrl();
    const cleanBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${cleanBase}/${cleanEndpoint}`;
};
