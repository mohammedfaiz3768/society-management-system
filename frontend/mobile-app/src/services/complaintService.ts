import apiClient from './apiClient';

export interface Complaint {
    id: number;
    title: string;
    description: string;
    category: string;
    current_status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
}

export const getMyComplaints = async (): Promise<Complaint[]> => {
    const { data } = await apiClient.get('/complaints/my-complaints');
    return data;
};

export const createComplaint = async (data: { title: string; description: string; category: string }) => {
    const response = await apiClient.post('/complaints/create', data);
    return response.data;
};
