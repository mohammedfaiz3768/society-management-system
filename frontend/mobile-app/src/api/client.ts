import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.5:5000/api';

console.log('----------------------------------------');
console.log('MOBILE APP CONFIG:');
console.log('BASE_URL:', BASE_URL);
console.log('----------------------------------------');

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const { useAuthStore } = require('../store/authStore');
            const token = useAuthStore.getState().token;

            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Failed to retrieve auth token:', error);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            console.warn('Unauthorized - session expired');

            try {
                await SecureStore.deleteItemAsync('sms_auth_token');
            } catch (e) {
                console.error('Failed to clear token:', e);
            }
        }

        if (!error.response) {
            console.error('Network error - no response from server');
            const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
            console.error('Full Request URL:', fullUrl);
            console.error('Error Details:', error.message);
        }

        if (error.response?.status === 401) {
            console.warn('Unauthorized - session expired. Logging out...');
            const { useAuthStore } = require('../store/authStore');
            useAuthStore.getState().logout();
        }

        const standardizedError = {
            message: (error.response?.data as any)?.message || error.message || 'An error occurred',
            status: error.response?.status,
            code: error.code,
        };

        return Promise.reject(standardizedError);
    }
);

export default apiClient;
