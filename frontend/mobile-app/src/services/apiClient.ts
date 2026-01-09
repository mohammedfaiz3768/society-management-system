import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Dynamically set URL based on environment
// Android Emulator uses 10.0.2.2. iOS uses localhost. 
// For physical devices, you'd need the LAN IP (e.g., 192.168.x.x)
const DEV_API_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: DEV_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
apiClient.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle 401 (Logout)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Logic to trigger logout in store (handled via event or callback usually)
            console.log('Unauthorized - Token likely expired');
            SecureStore.deleteItemAsync('auth_token');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
