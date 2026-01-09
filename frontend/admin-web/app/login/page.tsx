"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, KeyRound } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Request OTP
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            const res = await api.post('/auth/admin-request-otp', { email });
            setSuccess(res.data.message || "OTP sent to your email");
            setOtpSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // Verify OTP and login
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            const res = await api.post('/auth/admin-verify-otp', { email, otp });

            if (res.data && res.data.token) {
                // Store token
                localStorage.setItem('admin_token', res.data.token);

                // Check if first login
                if (res.data.user.is_first_login) {
                    // Redirect to society setup
                    router.push('/setup-society');
                } else {
                    // Redirect to dashboard
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 px-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
                    <CardDescription className="text-center">
                        {otpSent ? "Enter the OTP sent to your email" : "Enter your email to receive OTP"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!otpSent ? (
                        // Email input form
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert className="bg-green-50 border-green-200">
                                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Sending OTP..." : "Request OTP"}
                            </Button>
                        </form>
                    ) : (
                        // OTP verification form
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
                                OTP sent to <strong>{email}</strong>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="otp">Enter OTP</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        className="pl-10"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp("");
                                        setError("");
                                    }}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isLoading}>
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
