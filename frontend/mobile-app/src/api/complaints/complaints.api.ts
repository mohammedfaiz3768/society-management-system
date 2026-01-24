import { apiClient } from '../client';

export interface Complaint {
    id: string;
    user_id: string;
    society_id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    admin_comment?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateComplaintData {
    title: string;
    description: string;
}

export const createComplaint = async (data: CreateComplaintData): Promise<Complaint> => {
    const response = await apiClient.post<Complaint>('/complaints', data);
    return response.data;
};

export const getMyComplaints = async (): Promise<Complaint[]> => {
    const response = await apiClient.get<Complaint[]>('/complaints/mine');
    return response.data;
};
