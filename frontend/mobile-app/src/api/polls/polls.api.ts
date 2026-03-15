import { apiClient } from '../client';
import { z } from 'zod';

export interface PollOption {
    id: number;
    text: string;
    votes: number;
}

export interface Poll {
    id: number;
    title: string;
    description: string;
    type: string;
    is_anonymous: boolean;
    end_date: string;
    created_at: string;
    options: PollOption[];
    user_voted_option_id?: number | null; 
}

export const getActivePolls = async (): Promise<Poll[]> => {
    const response = await apiClient.get<Poll[]>('/polls');
    return response.data;
}

export const votePoll = async (pollId: number, optionId: number): Promise<void> => {
    await apiClient.post(`/polls/${pollId}/vote`, { option_id: optionId });
}
