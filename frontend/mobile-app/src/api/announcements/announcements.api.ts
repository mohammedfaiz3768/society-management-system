import { apiClient } from '../client';

export interface Announcement {
    id: number;
    title: string;
    message: string;
    type: string;
    created_at: string;
    admin_name: string;
}

export const getAnnouncements = async (): Promise<Announcement[]> => {
    const response = await apiClient.get<Announcement[]>('/announcements');
    return response.data;
}
