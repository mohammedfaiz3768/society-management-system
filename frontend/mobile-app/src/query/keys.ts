/**
 * Query Key Factory
 * 
 * Centralized query key management for React Query.
 * 
 * Benefits:
 * 1. Type-safe query keys
 * 2. Easy cache invalidation (invalidate all gatePasses with queryKeys.gatePass.all)
 * 3. Prevents key conflicts across the app
 */

export const queryKeys = {
    // Authentication
    auth: {
        user: ['auth', 'user'] as const,
        session: ['auth', 'session'] as const,
    },

    // Gate Pass
    gatePass: {
        all: ['gate-pass'] as const,
        lists: () => [...queryKeys.gatePass.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.gatePass.lists(), filters] as const,
        details: () => [...queryKeys.gatePass.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.gatePass.details(), id] as const,
        verify: (qrData: string) => [...queryKeys.gatePass.all, 'verify', qrData] as const,
    },

    // Visitors
    visitor: {
        all: ['visitor'] as const,
        lists: () => [...queryKeys.visitor.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.visitor.lists(), filters] as const,
        details: () => [...queryKeys.visitor.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.visitor.details(), id] as const,
    },

    // Deliveries
    delivery: {
        all: ['delivery'] as const,
        lists: () => [...queryKeys.delivery.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.delivery.lists(), filters] as const,
    },

    // Complaints
    complaint: {
        all: ['complaint'] as const,
        lists: () => [...queryKeys.complaint.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.complaint.lists(), filters] as const,
        details: () => [...queryKeys.complaint.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.complaint.details(), id] as const,
    },

    // Billing
    billing: {
        all: ['billing'] as const,
        invoices: () => [...queryKeys.billing.all, 'invoices'] as const,
        invoice: (id: string) => [...queryKeys.billing.invoices(), id] as const,
        payments: () => [...queryKeys.billing.all, 'payments'] as const,
    },

    // Staff
    staff: {
        all: ['staff'] as const,
        my: () => [...queryKeys.staff.all, 'my'] as const,
        attendance: (staffId: string) => [...queryKeys.staff.all, 'attendance', staffId] as const,
    },

    // Community
    notice: {
        all: ['notice'] as const,
        lists: () => [...queryKeys.notice.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.notice.lists(), filters] as const,
    },

    event: {
        all: ['event'] as const,
        lists: () => [...queryKeys.event.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.event.lists(), filters] as const,
    },

    poll: {
        all: ['poll'] as const,
        active: () => [...queryKeys.poll.all, 'active'] as const,
    },

    // SOS
    sos: {
        all: ['sos'] as const,
        active: () => [...queryKeys.sos.all, 'active'] as const,
    },
} as const;
