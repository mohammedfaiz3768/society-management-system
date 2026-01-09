import apiClient from './apiClient';

export interface Poll {
    id: number;
    title: string;
    description: string;
    type: string;
    is_anonymous: boolean;
    created_at: string;
    end_date: string;
    expires_at?: string; // keeping for backward compatibility if needed, but end_date is primary
    options: { id: number; text: string; votes: number }[];
    user_voted?: boolean; // Backend should ideally tell us if we voted
}

export const getActivePolls = async (): Promise<Poll[]> => {
    const { data } = await apiClient.get('/polls');
    return data;
};

export const votePoll = async (pollId: number, optionId: number) => {
    const { data } = await apiClient.post(`/polls/${pollId}/vote`, { optionId });
    return data;
};
