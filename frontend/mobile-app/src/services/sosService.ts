import apiClient from './apiClient';

export const triggerSOS = async () => {
    // Assuming Backend: POST /sos/trigger
    const { data } = await apiClient.post('/sos/trigger', {
        latitude: 0, // Mock location
        longitude: 0
    });
    return data;
};
