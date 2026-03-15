import apiClient from './apiClient';

export interface GatePass {
    id: number;
    pass_code: string;
    visitor_name: string;
    visitor_type: string;
    status: string;
    valid_until: string;
}

export const createGatePass = async (data: { visitorName: string; type: string; validUntil: string }) => {
    const response = await apiClient.post('/gate-pass/create', data);
    return response.data; 
};

export const getMyPasses = async (): Promise<GatePass[]> => {
    const { data } = await apiClient.get('/gate-pass/my-passes');
    return data;
};
