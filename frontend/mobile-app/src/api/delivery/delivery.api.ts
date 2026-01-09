import { apiClient } from '../client';

export interface DeliveryPass {
    id: number;
    company: string;
    pass_code: string;
    valid_until: string;
    used: boolean;
}

export const createDeliveryPass = async (company: string, description?: string): Promise<DeliveryPass> => {
    const response = await apiClient.post<DeliveryPass>('/delivery/pass', { company, description });
    return response.data;
}

export const getMyDeliveries = async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/delivery/history');
    return response.data;
}
