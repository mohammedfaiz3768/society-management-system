import { apiClient } from '../client';

export interface PollOption {
    id: number;
    text: string;
    votes: number;
}

export interface Poll {
    id: number;
    question: string;   // backend returns "question", not "title"
    closes_at: string | null;
    created_at: string;
    options: PollOption[];
}

export const getActivePolls = async (): Promise<Poll[]> => {
    const response = await apiClient.get<Poll[]>('/polls');
    return response.data;
}

export const votePoll = async (pollId: number, optionId: number): Promise<void> => {
    await apiClient.post(`/polls/${pollId}/vote`, { option_id: optionId });
}
