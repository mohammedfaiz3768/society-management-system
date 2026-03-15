import apiClient from './apiClient';

export const triggerSOS = async () => {
    const { data } = await apiClient.post('/sos/trigger', {
        latitude: 0, 
        longitude: 0
    });
    return data;
};
