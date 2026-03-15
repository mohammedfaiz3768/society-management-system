import apiClient from './apiClient';

export interface Event {
    id: number;
    title: string;
    description: string;
    event_date: string;
    location: string;
    organizer_name: string;
}

export const getEvents = async (): Promise<Event[]> => {
    const { data } = await apiClient.get('/events');
    return data;
};
