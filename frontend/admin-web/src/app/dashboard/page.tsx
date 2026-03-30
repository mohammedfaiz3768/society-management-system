'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
    users: { residents: number; guards: number; admins: number };
    flats: number;
    staff: number;
    complaints_open: number;
    services_open: number;
    emergencies_open: number;
    upcoming_events: number;
    today_visitors: number;
    active_polls: number;
    documents_total: number;
    announcements_total: number;
}

interface ActivityItem {
    id: string;
    action: string;
    entity_type: string;
    details: string;
    created_at: string;
    user_name: string;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    api.get('/dashboard/admin-stats'),
                    api.get('/timeline?limit=5'),
                ]);
                setStats(statsRes.data);
                setActivity(activityRes.data);
            } catch {
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <div className="h-8 bg-slate-100 rounded animate-pulse mb-2" />
                                <div className="h-4 bg-slate-50 rounded animate-pulse w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-48">
                <p className="text-slate-500 text-sm">{error}</p>
            </div>
        );
    }

    const kpis = [
        { label: "Residents", value: stats?.users.residents ?? 0, icon: "👥", href: "/dashboard/residents" },
        { label: "Total Flats", value: stats?.flats ?? 0, icon: "🏢", href: "/dashboard/flats" },
        { label: "Staff Members", value: stats?.staff ?? 0, icon: "👷", href: "/dashboard/staff" },
        { label: "Open Complaints", value: stats?.complaints_open ?? 0, icon: "⚠️", href: "/dashboard/complaints", alert: (stats?.complaints_open ?? 0) > 0 },
        { label: "Open Services", value: stats?.services_open ?? 0, icon: "🔧", href: "/dashboard/gate" },
        { label: "Today Visitors", value: stats?.today_visitors ?? 0, icon: "🚶", href: "/dashboard/gate" },
        { label: "Active Polls", value: stats?.active_polls ?? 0, icon: "📊", href: "/dashboard/polls" },
        { label: "Emergencies Open", value: stats?.emergencies_open ?? 0, icon: "🚨", href: "/dashboard/emergency-alerts", alert: (stats?.emergencies_open ?? 0) > 0 },
    ];

    return (
        <div className="space-y-8">

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpis.map(({ label, value, icon, href, alert }) => (
                    <Link key={label} href={href}>
                        <Card className={`hover:shadow-md transition-shadow cursor-pointer ${alert ? 'border-orange-300' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-slate-500">{label}</CardTitle>
                                <span className="text-base">{icon}</span>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${alert ? 'text-orange-600' : 'text-slate-900'}`}>
                                    {value}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                        <Link href="/dashboard/activity" className="text-xs text-blue-600 hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {activity.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
                        ) : (
                            <div className="space-y-3">
                                {activity.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{item.action}</p>
                                            {item.details && (
                                                <p className="text-slate-500 text-xs truncate">{item.details}</p>
                                            )}
                                            {item.user_name && (
                                                <p className="text-slate-400 text-xs">by {item.user_name}</p>
                                            )}
                                        </div>
                                        <div className="text-slate-400 text-xs flex-shrink-0">
                                            {timeAgo(item.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: "Add Resident", href: "/dashboard/residents" },
                                { label: "New Announcement", href: "/dashboard/announcements" },
                                { label: "Create Poll", href: "/dashboard/polls" },
                                { label: "View SOS Alerts", href: "/dashboard/sos" },
                                { label: "Manage Flats", href: "/dashboard/flats" },
                                { label: "Send Invites", href: "/dashboard/invitations" },
                            ].map(({ label, href }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="block px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors text-center"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}