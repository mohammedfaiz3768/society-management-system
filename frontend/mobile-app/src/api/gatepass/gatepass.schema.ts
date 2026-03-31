import { z } from 'zod';

export const GatePassTypeEnum = z.enum(['Visitor', 'Delivery', 'Cab']);

// Matches the actual values used by the backend
export const GatePassStatusEnum = z.enum([
    'PENDING',
    'ENTERED',
    'EXITED',
    'EXPIRED',
    // legacy values kept for compatibility
    'APPROVED',
    'REJECTED',
    'USED',
]);

export const GatePassSchema = z.object({
    id: z.number(),
    society_id: z.number().optional(),
    user_id: z.number(),
    visitor_name: z.string(),
    visitor_phone: z.string().nullable().optional(),
    vehicle_number: z.string().nullable().optional(),
    purpose: z.string().nullable().optional(),
    qr_code: z.string(),
    valid_from: z.string().nullable().optional(),
    valid_until: z.string(),
    status: GatePassStatusEnum.optional(),
    used: z.boolean().optional(),
    entry_time: z.string().nullable().optional(),
    exit_time: z.string().nullable().optional(),
    guard_id: z.number().nullable().optional(),
    flat_number: z.string().nullable().optional(),
    block: z.string().nullable().optional(),
    number_of_people: z.number().optional().default(1),
    created_at: z.string(),
});

export const CreateGatePassSchema = z.object({
    guestName: z.string().min(1, 'Guest name is required'),
    guestPhone: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
    type: GatePassTypeEnum,
    validFrom: z.coerce.date(),
    validTo: z.coerce.date(),
    vehicleNumber: z.string().optional(),
    purpose: z.string().optional(),
    numberOfPeople: z.number().min(1).max(20).optional().default(1),
});

export const VerifyGatePassSchema = z.object({
    gatePass: GatePassSchema,
    isValid: z.boolean(),
    reason: z.string().nullable().optional(),
});

export const MarkEntryExitSchema = z.object({
    gatePassId: z.string().uuid(),
    action: z.enum(['ENTRY', 'EXIT']),
    timestamp: z.coerce.date().optional(),
});

export type GatePass = z.infer<typeof GatePassSchema>;
export type CreateGatePass = z.infer<typeof CreateGatePassSchema>;
export type VerifyGatePassResponse = z.infer<typeof VerifyGatePassSchema>;
export type MarkEntryExit = z.infer<typeof MarkEntryExitSchema>;
export type GatePassType = z.infer<typeof GatePassTypeEnum>;
export type GatePassStatus = z.infer<typeof GatePassStatusEnum>;
