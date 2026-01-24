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

/**
 * Gate Pass API
 * 
 * Endpoints:
 * 1. getGatePasses: Fetch list with optional filters (status, type, date range)
 * 2. getGatePassById: Fetch single pass by ID
 * 3. createGatePass: Resident creates a new pass
 * 4. verifyGatePass: Guard scans QR code to validate
 * 5. markEntry: Guard marks visitor entry
 * 6. markExit: Guard marks visitor exit
 */

interface GatePassFilters {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Fetch all gate passes for current user
 * Filters: status (PENDING, APPROVED, etc.), type, date range
 */
export async function getGatePasses(filters?: GatePassFilters): Promise<GatePass[]> {
    const response = await apiClient.get<GatePass[]>('/gate-pass', {
        params: filters,
    });

    // Validate response with Zod
    const validated = response.data.map((pass) =>
        GatePassSchema.parse(pass)
    );

    return validated;
}

/**
 * Fetch single gate pass by ID
 */
/**
 * Fetch single gate pass by ID
 */
export async function getGatePassById(id: number): Promise<GatePass> {
    const response = await apiClient.get<GatePass>(`/gate-pass/${id}`); // Note: backend route is /api/gate-pass
    return GatePassSchema.parse(response.data);
}

/**
 * Create new gate pass (Resident)
 * Returns PENDING pass - requires admin/guard approval
 */
export async function createGatePass(data: CreateGatePass): Promise<GatePass> {
    // Validate input
    const validatedData = CreateGatePassSchema.parse(data);

    // Convert camelCase to snake_case for backend
    const backendPayload = {
        visitor_name: validatedData.guestName, // Backend expects visitor_name
        visitor_phone: validatedData.guestPhone, // Backend expects visitor_phone
        type: validatedData.type,
        valid_from: validatedData.validFrom.toISOString(),
        valid_to: validatedData.validTo.toISOString(),
        vehicle_number: validatedData.vehicleNumber || null,
        purpose: validatedData.purpose || null,
    };

    const response = await apiClient.post<GatePass>('/gate-pass/create', backendPayload);
    return GatePassSchema.parse(response.data);
}

/**
 * Verify gate pass via QR scan (Guard)
 * Returns pass details + validation result
 */
export async function verifyGatePass(qrData: string): Promise<VerifyGatePassResponse> {
    const response = await apiClient.post<VerifyGatePassResponse>('/gate-pass/verify', {
        qrData,
    });

    return VerifyGatePassSchema.parse(response.data);
}

/**
 * Mark entry (Guard)
 * Updates pass status to ENTERED and records timestamp
 */
export async function markEntry(gatePassId: number): Promise<GatePass> {
    const response = await apiClient.put<GatePass>(
        `/gate-pass/${gatePassId}/entry`
    );

    return GatePassSchema.parse(response.data);
}

/**
 * Mark exit (Guard)
 * Updates pass status to EXITED and records timestamp
 */
export async function markExit(gatePassId: number): Promise<GatePass> {
    const response = await apiClient.put<GatePass>(
        `/gate-pass/${gatePassId}/exit`
    );

    return GatePassSchema.parse(response.data);
}

/**
 * Delete gate pass (Resident - only if PENDING)
 */
export async function deleteGatePass(id: number): Promise<void> {
    await apiClient.delete(`/gate-pass/${id}`);
}
