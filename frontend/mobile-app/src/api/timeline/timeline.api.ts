import { apiClient } from '../client';

export interface ActivityItem {
    id: number;
    type: string;
    entity_type: string;
    title: string;
    description: string;
    created_at: string;
}

export const getMyTimeline = async (): Promise<ActivityItem[]> => {
    const response = await apiClient.get<ActivityItem[]>('/timeline/my');
    return response.data;
}
