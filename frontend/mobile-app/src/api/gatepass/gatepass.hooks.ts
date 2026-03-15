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

interface GatePassFilters {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
}

export function useGatePassList(filters?: GatePassFilters, options?: { pollingInterval?: number }) {
    return useQuery({
        queryKey: queryKeys.gatePass.list(filters),
        queryFn: () => getGatePasses(filters),
        refetchInterval: options?.pollingInterval, 
    });
}

export function useGatePassDetail(id: number | undefined, options?: { enabled?: boolean; pollingInterval?: number }) {
    return useQuery({
        queryKey: queryKeys.gatePass.detail(id?.toString() ?? ''),
        queryFn: () => getGatePassById(id!),
        enabled: (options?.enabled ?? true) && !!id,
        refetchInterval: options?.pollingInterval, 
    });
}

export function useCreateGatePass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateGatePass) => createGatePass(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.lists() });
        },
    });
}

export function useVerifyGatePass() {
    return useMutation({
        mutationFn: (qrData: string) => verifyGatePass(qrData),
    });
}

export function useMarkEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gatePassId: number) => markEntry(gatePassId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.detail(data.id.toString()) });
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.lists() });
        },
    });
}

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

export function useDeleteGatePass() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteGatePass(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gatePass.lists() });
        },
    });
}
