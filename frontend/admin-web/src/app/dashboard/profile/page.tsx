"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

    useEffect(() => {
        if (authUser) fetchProfile();
    }, [authUser]);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/auth/me");
            setProfile(response.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to load profile");
            } else {
                setError("Failed to load profile");
            }
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

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsRequestingOtp(true);
        try {
            const response = await api.post("/auth/request-password-change-otp", { currentPassword });
            setOtpSent(true);
            setSuccess(response.data.message || "OTP sent to your email");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to send OTP");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsRequestingOtp(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!otp) {
            setError("Please enter OTP");
            return;
        }

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
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to update password");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Admin Profile</h2>
                <p className="text-muted-foreground">Manage your account and password.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoadingProfile ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={profile?.name || ""} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={profile?.email || ""} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input
                                    value={
                                        profile?.role
                                            ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                                            : ""
                                    }
                                    disabled
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <Alert>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {!otpSent ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isRequestingOtp}>
                                {isRequestingOtp ? "Sending OTP..." : "Request OTP"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    OTP sent to {profile?.email}. Please check your inbox.
                                </AlertDescription>
                            </Alert>
                            <div className="space-y-2">
                                <Label>Enter OTP</Label>
                                <Input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    inputMode="numeric"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" disabled={isChangingPassword}>
                                    {isChangingPassword ? "Updating..." : "Update Password"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp("");
                                        setError("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
                        {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
