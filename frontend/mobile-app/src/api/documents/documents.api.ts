import { apiClient } from '../client';

export interface Document {
    id: number;
    title: string;
    description: string;
    file_path: string;
    file_type: string;
    created_at: string;
}

export const getDocuments = async (): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>('/documents');
    return response.data;
}

export const downloadDocumentUrl = (id: number): string => {
    return `${apiClient.defaults.baseURL}/documents/${id}/download`;
}
