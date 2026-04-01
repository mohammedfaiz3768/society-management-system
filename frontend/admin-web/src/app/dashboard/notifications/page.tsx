"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff } from "lucide-react";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const LIMIT = 50;

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
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to load notifications");
            } else {
                setFetchError("Failed to load notifications");
            }
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
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to mark notifications as read");
            } else {
                setFetchError("Failed to mark notifications as read");
            }
        } finally {
            setIsMarkingRead(false);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground">Your activity notifications and system alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={handleMarkAllRead} disabled={isMarkingRead}>
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
                <div className="flex justify-center items-center py-16">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <BellOff className="h-10 w-10" />
                    <p>No notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                                n.is_read ? "bg-card" : "bg-blue-50 border-blue-100"
                            }`}
                        >
                            <div
                                className={`mt-0.5 p-1.5 rounded-full ${
                                    n.is_read ? "bg-muted" : "bg-blue-100"
                                }`}
                            >
                                <Bell
                                    className={`h-4 w-4 ${
                                        n.is_read ? "text-muted-foreground" : "text-blue-600"
                                    }`}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-medium">{n.title}</p>
                                    {!n.is_read && (
                                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-600 text-white hover:bg-blue-600">
                                            New
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{n.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(n.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && notifications.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                    {unreadCount > 0 ? `, ${unreadCount} unread` : ""}
                </p>
            )}
        </div>
    );
}
