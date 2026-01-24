import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/keys';
import {
    getGatePasses,
    getGatePassById,
    createGatePass,
    verifyGatePass,
    markEntry,
    markExit,
    deleteGatePass,
} from './gatepass.api';
import type { CreateGatePass } from './gatepass.schema';

/**
 * React Query Hooks for Gate Pass
 * 
 * Architecture:
 * - useGatePassList: Fetch list with filters (supports polling for real-time updates)
 * - useGatePassDetail: Fetch single pass (with auto-refresh for status changes)
 * - useCreateGatePass: Create new pass with optimistic UI
 * - useVerifyGatePass: Guard-side QR verification
 * - useMarkEntry/Exit: Guard actions
 */

interface GatePassFilters {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Fetch gate pass list
 * Options: refetchInterval for polling (useful for QR status polling)
 */
export function useGatePassList(filters?: GatePassFilters, options?: { pollingInterval?: number }) {
    return useQuery({
        queryKey: queryKeys.gatePass.list(filters),
        queryFn: () => getGatePasses(filters),
        refetchInterval: options?.pollingInterval, // Enable polling if needed
    });
}

/**
 * Fetch single gate pass by ID
 * Useful for detail view with status polling
 */
export function useGatePassDetail(id: number | undefined, options?: { enabled?: boolean; pollingInterval?: number }) {
    return useQuery({
        queryKey: queryKeys.gatePass.detail(id?.toString() ?? ''),
        queryFn: () => getGatePassById(id!),
        enabled: (options?.enabled ?? true) && !!id,
        refetchInterval: options?.pollingInterval, // Poll for status updates (PENDING → APPROVED)
    });
}

/**
 * Create gate pass (Resident)
 * Invalidates list cache on success
 */
export function useCreateGatePass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateGatePass) => createGatePass(data),
        onSuccess: () => {
            // Invalidate all gate pass lists
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.lists() });
        },
    });
}

/**
 * Verify gate pass (Guard)
 * Used during QR scan
 */
export function useVerifyGatePass() {
    return useMutation({
        mutationFn: (qrData: string) => verifyGatePass(qrData),
    });
}

/**
 * Mark entry (Guard)
 */
export function useMarkEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gatePassId: number) => markEntry(gatePassId),
        onSuccess: (data) => {
            // Update cache for this specific pass
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.detail(data.id.toString()) });
            // Invalidate lists (to update counts)
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.lists() });
        },
    });
}

/**
 * Mark exit (Guard)
 */
export function useMarkExit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gatePassId: number) => markExit(gatePassId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.detail(data.id.toString()) });
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.lists() });
        },
    });
}

/**
 * Delete gate pass (Resident - only PENDING)
 */
export function useDeleteGatePass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteGatePass(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.lists() });
        },
    });
}
