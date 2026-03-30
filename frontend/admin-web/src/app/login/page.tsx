"use client";

import { useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, KeyRound } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
    const { login } = useAuth(); // ✅ use AuthProvider login
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // ✅ Client-side email validation
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/admin-request-otp', { email });
            setSuccess(res.data.message || "OTP sent to your email");
            setOtpSent(true);
        } catch (err) {
            // ✅ Typed error — no `any`
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to send OTP");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await api.post('/auth/admin-verify-otp', { email, otp });

            if (res.data?.token) {
                // ✅ Use login() from AuthProvider — sets state and redirects
                // No localStorage.setItem needed here — AuthProvider handles it
                // No setTimeout — localStorage is synchronous
                login(res.data.token, res.data.user);

                // is_first_login handled by AuthProvider redirect logic
                // Or override here if needed:
                if (res.data.user?.is_first_login) {
                    window.location.href = '/setup-society';
                }
            } else {
                setError("Login failed: No token received");
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Invalid OTP. Please try again.");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
            <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="space-y-1 pb-4">
                    {/* ✅ UNIFY branding */}
                    <div className="text-center mb-2">
                        <span className="font-serif text-2xl tracking-tight text-zinc-900 dark:text-zinc-50">
                            UN<em className="italic text-blue-600">IFY</em>
                        </span>
                    </div>
                    <CardTitle className="text-xl font-semibold text-center">Admin Login</CardTitle>
                    <CardDescription className="text-center text-sm">
                        {otpSent
                            ? `Enter the OTP sent to ${email}`
                            : "Enter your admin email to receive an OTP"
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {!otpSent ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                                    <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Sending OTP..." : "Send OTP"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm">
                                OTP sent to <strong>{email}</strong>. Check your inbox.
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="otp">6-digit OTP</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric" // ✅ numeric keyboard on mobile
                                        pattern="[0-9]*"
                                        placeholder="123456"
                                        className="pl-10 tracking-widest text-center text-lg"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // ✅ numbers only
                                        required
                                        autoComplete="one-time-code"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isLoading || otp.length !== 6}>
                                    {isLoading ? "Verifying..." : "Verify & Login"}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}