import { apiClient } from '../client';

export interface FlatMember {
    id: number;
    name: string;
    phone: string;
    relation: string;
}

export interface MyFlat {
    id: number;
    flat_number: string;
    block: string;
    floor: number;
}

export const getMyFlat = async (): Promise<MyFlat> => {
    const response = await apiClient.get<MyFlat>('/flats/mine');
    return response.data;
}

export const getFamilyMembers = async (): Promise<FlatMember[]> => {
    const response = await apiClient.get<FlatMember[]>('/flats/members/mine');
    return response.data;
}

export const addFamilyMember = async (flatId: number, name: string, phone: string, relation: string): Promise<FlatMember> => {
    const response = await apiClient.post<FlatMember>('/flats/member', {
        flat_id: flatId,
        name,
        phone,
        relation
    });
    return response.data;
}
