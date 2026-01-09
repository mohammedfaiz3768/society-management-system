import { apiClient } from '../client';

export interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get<NotificationItem[]>('/notifications');
    return response.data;
}

export const markNotificationAsRead = async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
}

export const deleteNotification = async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
}
