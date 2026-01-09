'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ProfilePage() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data); // API returns user directly, not { user: ... }
        } catch (err) {
            console.error('Failed to fetch user info', err);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.removeItem('admin_token');
        router.push('/login');
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsRequestingOtp(true);

        try {
            const response = await api.post('/auth/request-password-change-otp', {
                currentPassword
            });
            setOtpSent(true);
            setSuccess(response.data.message || 'OTP sent to your email');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsRequestingOtp(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!otp) {
            setError('Please enter OTP');
            return;
        }

        setIsChangingPassword(true);

        try {
            const response = await api.post('/auth/verify-otp-change-password', {
                otp,
                newPassword
            });
            setSuccess(response.data.message || 'Password updated successfully');
            // Reset form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setOtp('');
            setOtpSent(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoadingUser) {
        return (
            <div className="max-w-4xl">
                <div className="text-center py-8">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Profile</h1>

            {/* Profile Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email || 'Loading...'}
                            disabled
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Role
                        </label>
                        <input
                            type="text"
                            value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Loading...'}
                            disabled
                            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
                        />
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Change Password</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                {!otpSent ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 characters)"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isRequestingOtp}
                            className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isRequestingOtp ? 'Sending OTP...' : 'Request OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
                            OTP sent to {user?.email}. Please check your inbox.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
                            >
                                {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setOtpSent(false);
                                    setOtp('');
                                    setError('');
                                }}
                                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Logout Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </div>
        </div>
    );
}
