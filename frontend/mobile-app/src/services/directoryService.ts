import apiClient from './apiClient';

export interface Resident {
    id: number;
    name: string;
    block: string;
    flat_number: string;
    phone: string; // Maybe masked
}

export const getDirectory = async (): Promise<Resident[]> => {
    const { data } = await apiClient.get('/directory/residents');
    return data;
};
