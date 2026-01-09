import apiClient from './apiClient';

export interface Notice {
    id: number;
    title: string;
    body: string;
    created_at: string;
}

export const getNotices = async (): Promise<Notice[]> => {
    const { data } = await apiClient.get('/notices');
    return data;
};
