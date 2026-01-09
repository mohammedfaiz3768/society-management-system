import { apiClient } from '../client';

export interface DirectoryUser {
    id: number;
    name: string;
    phone: string;
    flat_number?: string;
    block?: string;
    role: string;
}

export interface Staff {
    id: number;
    name: string;
    phone: string;
    role: string;
    shift_start?: string;
    shift_end?: string;
}

export const getResidentDirectory = async (): Promise<DirectoryUser[]> => {
    const response = await apiClient.get<DirectoryUser[]>('/directory/residents');
    return response.data;
}

export const getStaffDirectory = async (): Promise<Staff[]> => {
    const response = await apiClient.get<Staff[]>('/directory/staff');
    return response.data;
}
