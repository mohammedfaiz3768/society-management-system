import apiClient from './apiClient';

export interface ResidentStats {
    flat: {
        id: number;
        flat_number: string;
        block: string;
        floor: number;
    } | null;
    complaints_open: number;
    services_open: number;
    today_visitors: number;
    notifications_unread: number;
    upcoming_events: any[]; 
    latest_announcements: any[]; 
}

export const getResidentStats = async (): Promise<ResidentStats> => {
    const response = await apiClient.get('/dashboard/resident');
    return response.data;
};
