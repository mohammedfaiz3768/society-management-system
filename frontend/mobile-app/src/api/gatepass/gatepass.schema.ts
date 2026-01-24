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
    id: z.number(),
    society_id: z.number().optional(),
    user_id: z.number(),
    visitor_name: z.string().min(1, 'Visitor name is required'),
    visitor_phone: z.string().nullable().optional(),
    vehicle_number: z.string().nullable().optional(),
    purpose: z.string().nullable().optional(),
    qr_code: z.string(),
    valid_until: z.string(), // Database has valid_until, not valid_from/valid_to
    used: z.boolean().optional(),
    created_at: z.string(),
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
