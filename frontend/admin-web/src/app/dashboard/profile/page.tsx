"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, LogOut, CheckCircle, Mail } from "lucide-react";

interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: string;
    society_name?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user: authUser, isLoading: authLoading } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!authLoading && !authUser) router.push("/login");
    }, [authUser, authLoading, router]);

    useEffect(() => { if (authUser) fetchProfile(); }, [authUser]);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/auth/me");
            setProfile(response.data);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to load profile");
            else setError("Failed to load profile");
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.removeItem("admin_token");
        router.push("/login");
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
        if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
        setIsRequestingOtp(true);
        try {
            const response = await api.post("/auth/request-password-change-otp", { currentPassword });
            setOtpSent(true);
            setSuccess(response.data.message || "OTP sent to your email");
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to send OTP");
            else setError("An unexpected error occurred");
        } finally {
            setIsRequestingOtp(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!otp) { setError("Please enter OTP"); return; }
        setIsChangingPassword(true);
        try {
            const response = await api.post("/auth/verify-otp-change-password", { otp, newPassword });
            setSuccess(response.data.message || "Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setOtp("");
            setOtpSent(false);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to update password");
            else setError("An unexpected error occurred");
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Profile</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Manage your account and password.</p>
            </div>

            {/* Profile card */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-rose-600" />
                    <h2 className="text-sm font-semibold text-slate-800">Profile Information</h2>
                </div>
                <div className="p-6">
                    {isLoadingProfile ? (
                        <div className="space-y-4 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                                <div key={i}>
                                    <div className="h-3 w-16 bg-slate-50 rounded mb-2" />
                                    <div className="h-10 bg-slate-50 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Avatar + name row */}
                            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                                <div className="w-14 h-14 rounded-full bg-rose-600 flex items-center justify-center text-xl font-bold text-slate-900">
                                    {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{profile?.name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                                    {profile?.society_name && (
                                        <p className="text-xs text-rose-600 font-medium mt-0.5">{profile.society_name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Name</Label>
                                <Input value={profile?.name || ""} disabled className="border-slate-200 bg-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Email</Label>
                                <Input type="email" value={profile?.email || ""} disabled className="border-slate-200 bg-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Role</Label>
                                <Input value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ""} disabled className="border-slate-200 bg-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Change password card */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <h2 className="text-sm font-semibold text-slate-800">Change Password</h2>
                </div>
                <div className="p-6 space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" /> {success}
                        </div>
                    )}

                    {!otpSent ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Current Password</Label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    required
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">New Password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    required
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    className="border-slate-200"
                                />
                            </div>
                            <Button type="submit" className="bg-rose-600 hover:bg-rose-600" disabled={isRequestingOtp}>
                                {isRequestingOtp ? "Sending OTP..." : "Request OTP"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-rose-50 border border-emerald-200">
                                <Mail className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-rose-600">OTP sent to <span className="font-semibold">{profile?.email}</span>. Check your inbox.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Enter OTP</Label>
                                <Input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    inputMode="numeric"
                                    required
                                    className="border-slate-200 font-mono tracking-[0.4em] text-center text-lg"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" className="bg-rose-600 hover:bg-rose-600" disabled={isChangingPassword}>
                                    {isChangingPassword ? "Updating..." : "Update Password"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-slate-200"
                                    onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Account actions */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <h2 className="text-sm font-semibold text-slate-800">Account Actions</h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-zinc-500 mb-4">Logging out will clear your session and redirect you to the login page.</p>
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
