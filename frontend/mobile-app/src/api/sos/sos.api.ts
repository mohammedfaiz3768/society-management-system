import { apiClient } from '../client';

export interface SosAlert {
    id: number;
    user_id: number;
    user_name: string;
    block: string | null;
    flat: string | null;
    location_lat: number | null;
    location_lng: number | null;
    message: string;
    emergency_type: string;
    emergency_service: string | null;
    status: 'ACTIVE' | 'RESPONDING' | 'RESOLVED';
    trigger_buzzer: boolean;
    auto_called: boolean;
    society_id: number;
    created_at: string;
    resolved_at: string | null;
}

export async function listSosAlerts(): Promise<SosAlert[]> {
    const response = await apiClient.get<SosAlert[]>('/sos/all');
    return response.data;
}

export async function respondToSos(sosId: number): Promise<void> {
    await apiClient.post(`/sos/respond/${sosId}`);
}

export async function resolveSos(sosId: number): Promise<void> {
    await apiClient.post(`/sos/resolve/${sosId}`);
}
