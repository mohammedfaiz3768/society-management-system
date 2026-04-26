"use client";

import { useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, KeyRound, ArrowRight, Home, Shield } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
    const { login } = useAuth();
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
                login(res.data.token, res.data.user);
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
        <div className="min-h-screen flex bg-white">
            {/* Left panel - branding */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0f172a] p-10">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center">
                            <Home className="w-5 h-5 text-slate-900" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            UN<span className="text-emerald-400 italic">IFY</span>
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                        Society management,<br />simplified.
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Manage residents, handle complaints, track visitors, and keep your community running smoothly - all in one place.
                    </p>
                </div>
                <div className="space-y-3">
                    {[
                        "Resident & flat management",
                        "Visitor & gate pass tracking",
                        "Announcements & polls",
                        "Billing & maintenance",
                    ].map(f => (
                        <div key={f} className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            </div>
                            {f}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-8 h-8 rounded-2xl bg-rose-600 flex items-center justify-center">
                            <Home className="w-4 h-4 text-slate-900" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                            UN<span className="text-rose-600 italic">IFY</span>
                        </span>
                    </div>

                    <div className="mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-rose-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {otpSent ? `OTP sent to ${email}` : "Sign in to your admin panel"}
                        </p>
                    </div>

                    {!otpSent ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="py-2.5">
                                    <AlertDescription className="text-sm">{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="pl-10 h-11 border-slate-200 focus:border-rose-600 focus:ring-rose-600"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 bg-rose-600 hover:bg-rose-600 text-white font-medium rounded-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Sending OTP...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Send OTP <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="py-2.5">
                                    <AlertDescription className="text-sm">{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                                    {success}
                                </div>
                            )}
                            <div className="px-4 py-3 rounded-lg bg-rose-50 border border-emerald-200 text-rose-600 text-sm">
                                Check your inbox at <strong>{email}</strong> for a 6-digit code.
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="otp" className="text-sm font-medium text-slate-700">One-time password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="123456"
                                        className="pl-10 h-11 tracking-[0.4em] text-center text-lg font-mono border-slate-200 focus:border-rose-600"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        required
                                        autoComplete="one-time-code"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-11 border-slate-200"
                                    onClick={() => { setOtpSent(false); setOtp(""); setError(""); setSuccess(""); }}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-11 bg-rose-600 hover:bg-rose-600 text-white font-medium"
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Verifying...
                                        </span>
                                    ) : "Verify & Login"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
