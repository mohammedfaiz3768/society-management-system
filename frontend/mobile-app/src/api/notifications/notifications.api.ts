import { apiClient } from '../client';

export interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;   // backend column is is_read
    read_at: string | null;
    created_at: string;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get<NotificationItem[]>('/notifications');
    return response.data;
}

export const markNotificationAsRead = async (id: number): Promise<void> => {
    // backend route: PATCH /:id/read
    await apiClient.patch(`/notifications/${id}/read`);
}

export const markAllNotificationsRead = async (): Promise<void> => {
    await apiClient.patch('/notifications/mark-all-read');
}
