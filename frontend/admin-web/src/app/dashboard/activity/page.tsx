"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, User, FileText, CreditCard, AlertCircle, Clock } from "lucide-react";

interface ActivityItem {
    id: number;
    type: string;
    entity_type: string;
    title: string;
    description: string;
    user_name: string;
    created_at: string;
}

const LIMIT = 50;

function getIcon(type: string) {
    if (!type) return { icon: FileText, color: 'text-zinc-500', bg: 'bg-slate-50' };
    if (type.includes("poll")) return { icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' };
    if (type.includes("bill")) return { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100' };
    if (type.includes("complaint")) return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
    if (type.includes("user")) return { icon: User, color: 'text-blue-600', bg: 'bg-blue-100' };
    return { icon: FileText, color: 'text-zinc-500', bg: 'bg-slate-50' };
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

const ENTITY_DOT: Record<string, string> = {
    user: 'bg-blue-500', complaint: 'bg-amber-500', announcement: 'bg-rose-600',
    poll: 'bg-purple-500', visitor: 'bg-rose-600', sos: 'bg-red-500',
};

export default function ActivityPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const fetchActivities = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get(`/timeline/global?limit=${LIMIT}`);
            setActivities(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to load activity log");
            else setFetchError("Failed to load activity log");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchActivities();
    }, [user]);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Activity Log</h1>
                <p className="text-sm text-zinc-500 mt-0.5">System-wide audit trail of all major actions.</p>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 flex items-center gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-48 bg-slate-50 rounded" />
                                <div className="h-3 w-32 bg-slate-50 rounded" />
                            </div>
                            <div className="h-3 w-16 bg-slate-50 rounded" />
                        </div>
                    ))}
                </div>
            ) : activities.length === 0 ? (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-500">No activity recorded yet.</p>
                </div>
            ) : (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-zinc-50">
                    {activities.map((item) => {
                        const { icon: Icon, color, bg } = getIcon(item.type);
                        const dotColor = ENTITY_DOT[item.entity_type] || 'bg-zinc-400';
                        return (
                            <div key={item.id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/50 transition-colors">
                                <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                                    {item.description && (
                                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                            {item.entity_type}
                                        </span>
                                        <span className="text-xs text-slate-500">by {item.user_name || "System"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(item.created_at)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && activities.length > 0 && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{activities.length}</span> event{activities.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
