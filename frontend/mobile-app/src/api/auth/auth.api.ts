import { apiClient } from '../client';
import { z } from 'zod';

export const SendOtpSchema = z.object({
    email: z.string().email(),
});

export const VerifyOtpSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
});

export const AuthResponseSchema = z.object({
    token: z.string(),
    user: z.object({
        id: z.number(),
        email: z.string().email(),
        role: z.enum(['resident', 'guard', 'admin']),
        name: z.string().nullish(),
        phone: z.string().nullish(),
        flat_number: z.string().nullish(),
    }),
});

export type SendOtpPayload = z.infer<typeof SendOtpSchema>;
export type VerifyOtpPayload = z.infer<typeof VerifyOtpSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type User = AuthResponse['user'];

export async function sendOtp(data: SendOtpPayload): Promise<{ message: string }> {
    const validated = SendOtpSchema.parse(data);
    const response = await apiClient.post<{ message: string }>('/auth/request-otp-email', validated);
    return response.data;
}

export async function verifyOtp(data: VerifyOtpPayload): Promise<AuthResponse> {
    const payload = { email: data.email, code: data.code };

    try {
        const validated = VerifyOtpSchema.parse(payload);
        const response = await apiClient.post<AuthResponse>('/auth/verify-otp-email', validated);
        return AuthResponseSchema.parse(response.data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error('Please enter a valid 6-digit code');
        }
        throw error;
    }
}

export async function getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return AuthResponseSchema.shape.user.parse(response.data.user);
}

export async function resendOtp(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/resend-otp', { email });
    return response.data;
}
