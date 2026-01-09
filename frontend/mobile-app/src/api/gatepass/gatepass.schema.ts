import { z } from 'zod';

/**
 * Gate Pass Schemas
 * 
 * Architecture:
 * 1. GatePassSchema: Full entity from backend (includes system fields)
 * 2. CreateGatePassSchema: Client-side creation payload (omits system fields)
 * 3. UpdateGatePassSchema: For status updates (Guard marking entry/exit)
 * 
 * State Machine: PENDING → APPROVED → ENTERED → EXITED → EXPIRED
 */

// Enums
export const GatePassTypeEnum = z.enum(['Visitor', 'Delivery', 'Cab']);
export const GatePassStatusEnum = z.enum([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ENTERED',
    'EXITED',
    'EXPIRED',
]);

// Full Gate Pass Entity (from backend)
export const GatePassSchema = z.object({
    id: z.number(), // Backend uses integer IDs
    guest_name: z.string().min(1, 'Guest name is required'), // backend returns snake_case
    guest_phone: z.string().regex(/^\d{10}$/, 'Invalid phone number').nullable().optional(),
    type: z.string(), // Backend returns string
    status: z.string(), // Backend returns string
    valid_from: z.string(), // Backend returns ISO string
    valid_to: z.string(),
    qr_code: z.string().optional(),
    user_id: z.number(),
    vehicle_number: z.string().nullable().optional(),
    purpose: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    entry_time: z.string().nullable().optional(),
    exit_time: z.string().nullable().optional(),
    guard_id: z.number().nullable().optional(),
});

// Client-side creation schema (omit system-generated fields)
export const CreateGatePassSchema = z.object({
    guestName: z.string().min(1, 'Guest name is required'),
    guestPhone: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
    type: GatePassTypeEnum,
    validFrom: z.coerce.date(),
    validTo: z.coerce.date(),
    vehicleNumber: z.string().optional(),
    purpose: z.string().optional(),
});

// QR Verification Response
export const VerifyGatePassSchema = z.object({
    gatePass: GatePassSchema,
    isValid: z.boolean(),
    reason: z.string().nullable().optional(),
});

// Guard action payload
export const MarkEntryExitSchema = z.object({
    gatePassId: z.string().uuid(),
    action: z.enum(['ENTRY', 'EXIT']),
    timestamp: z.coerce.date().optional(),
});

// Type inference
export type GatePass = z.infer<typeof GatePassSchema>;
export type CreateGatePass = z.infer<typeof CreateGatePassSchema>;
export type VerifyGatePassResponse = z.infer<typeof VerifyGatePassSchema>;
export type MarkEntryExit = z.infer<typeof MarkEntryExitSchema>;
export type GatePassType = z.infer<typeof GatePassTypeEnum>;
export type GatePassStatus = z.infer<typeof GatePassStatusEnum>;
