import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * API Client Configuration
 * 
 * Architecture Decisions:
 * 1. Request Interceptor: Automatically injects JWT from SecureStore into every request
 * 2. Response Interceptor: Centralized error handling (401 → logout, network errors → user feedback)
 * 3. Timeout: 10s to prevent hanging requests on poor network
 */

// Base URL from environment (fallback to localhost for dev)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000/api';

// Create axios instance
export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request Interceptor
 * Retrieves JWT from SecureStore and attaches to Authorization header
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await SecureStore.getItemAsync('sms_auth_token');

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

/**
 * Response Interceptor
 * Handles global errors:
 * - 401: Unauthorized → Clear session and redirect to login
 * - 500: Server error → Show toast
 * - Network errors → Show connectivity message
 */
apiClient.interceptors.response.use(
    (response) => {
        // Success - return data directly
        return response;
    },
    async (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // TODO: Clear session and redirect to login
            // Example: useAuthStore.getState().logout();
            // Example: router.replace('/(auth)/login');
            console.warn('Unauthorized - session expired');

            // Clear stored token
            try {
                await SecureStore.deleteItemAsync('sms_auth_token');
            } catch (e) {
                console.error('Failed to clear token:', e);
            }
        }

        // Handle network errors
        if (!error.response) {
            console.error('Network error - no response from server');
            // TODO: Show toast notification
        }

        // Standardized error object
        const standardizedError = {
            message: (error.response?.data as any)?.message || error.message || 'An error occurred',
            status: error.response?.status,
            code: error.code,
        };

        return Promise.reject(standardizedError);
    }
);

export default apiClient;
