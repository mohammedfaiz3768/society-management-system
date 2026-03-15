import { apiClient } from '../client';
import {
    GatePass,
    GatePassSchema,
    CreateGatePass,
    CreateGatePassSchema,
    VerifyGatePassResponse,
    VerifyGatePassSchema,
    MarkEntryExit,
} from './gatepass.schema';

interface GatePassFilters {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
}

export async function getGatePasses(filters?: GatePassFilters): Promise<GatePass[]> {
    const response = await apiClient.get<GatePass[]>('/gate-pass', {
        params: filters,
    });

    const validated = response.data.map((pass) =>
        GatePassSchema.parse(pass)
    );

    return validated;
}

export async function getGatePassById(id: number): Promise<GatePass> {
    const response = await apiClient.get<GatePass>(`/gate-pass/${id}`); 
    return GatePassSchema.parse(response.data);
}

export async function createGatePass(data: CreateGatePass): Promise<GatePass> {
    const validatedData = CreateGatePassSchema.parse(data);

    const backendPayload = {
        visitor_name: validatedData.guestName, 
        visitor_phone: validatedData.guestPhone, 
        type: validatedData.type,
        valid_from: validatedData.validFrom.toISOString(),
        valid_to: validatedData.validTo.toISOString(),
        vehicle_number: validatedData.vehicleNumber || null,
        purpose: validatedData.purpose || null,
        number_of_people: validatedData.numberOfPeople || 1,
    };

    const response = await apiClient.post<GatePass>('/gate-pass/create', backendPayload);
    return GatePassSchema.parse(response.data);
}

export async function verifyGatePass(qrData: string): Promise<VerifyGatePassResponse> {
    const response = await apiClient.post<VerifyGatePassResponse>('/gate-pass/verify', {
        qrData,
    });

    return VerifyGatePassSchema.parse(response.data);
}

export async function markEntry(gatePassId: number): Promise<GatePass> {
    const response = await apiClient.put<GatePass>(
        `/gate-pass/${gatePassId}/entry`
    );

    return GatePassSchema.parse(response.data);
}

export async function markExit(gatePassId: number): Promise<GatePass> {
    const response = await apiClient.put<GatePass>(
        `/gate-pass/${gatePassId}/exit`
    );

    return GatePassSchema.parse(response.data);
}

export async function deleteGatePass(id: number): Promise<void> {
    await apiClient.delete(`/gate-pass/${id}`);
}
