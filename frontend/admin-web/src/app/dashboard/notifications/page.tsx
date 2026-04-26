"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, BellOff, CheckCheck } from "lucide-react";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const LIMIT = 50;

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isMarkingRead, setIsMarkingRead] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get(`/notifications?limit=${LIMIT}`);
            setNotifications(res.data);
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to load notifications");
            else setFetchError("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const handleMarkAllRead = async () => {
        setIsMarkingRead(true);
        setFetchError("");
        try {
            await api.patch('/notifications/mark-all-read');
            fetchNotifications();
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to mark as read");
            else setFetchError("Failed to mark as read");
        } finally {
            setIsMarkingRead(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Your activity notifications and system alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        disabled={isMarkingRead}
                        className="border-slate-200 gap-1.5"
                    >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {isMarkingRead ? "Marking..." : `Mark All Read (${unreadCount})`}
                    </Button>
                )}
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 flex gap-4 animate-pulse">
                            <div className="w-9 h-9 rounded-2xl bg-slate-50 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-48 bg-slate-50 rounded" />
                                <div className="h-3 w-64 bg-slate-50 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <BellOff className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">No notifications yet</p>
                    <p className="text-xs text-slate-500">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                                n.is_read ? "bg-white shadow-sm border-slate-100 border-slate-200" : "bg-rose-50 border-emerald-200"
                            }`}
                        >
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-slate-50' : 'bg-rose-100'}`}>
                                <Bell className={`h-4 w-4 ${n.is_read ? 'text-slate-500' : 'text-rose-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                                    {!n.is_read && (
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-600 text-white">New</span>
                                    )}
                                </div>
                                <p className="text-sm text-zinc-500">{n.message}</p>
                            </div>
                            <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(n.created_at)}</span>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && notifications.length > 0 && (
                <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-500">{notifications.length}</span> notification{notifications.length !== 1 ? "s" : ""}
                    {unreadCount > 0 && <span> آ· <span className="text-rose-600 font-semibold">{unreadCount} unread</span></span>}
                </p>
            )}
        </div>
    );
}
