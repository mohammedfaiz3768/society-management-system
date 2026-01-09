import { apiClient } from '../client';

export interface MaintenanceBill {
    id: number;
    flat_number: string;
    month: number;
    year: number;
    amount: string;
    status: string;
    created_at: string;
}

export const getMyBills = async (): Promise<MaintenanceBill[]> => {
    const response = await apiClient.get<MaintenanceBill[]>('/maintenance/mine');
    return response.data;
}
