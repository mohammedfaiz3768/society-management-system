"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, User, FileText, CreditCard, AlertCircle } from "lucide-react";

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
            const res = await api.get(`/timeline?limit=${LIMIT}`);
            setActivities(res.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to load activity log");
            } else {
                setFetchError("Failed to load activity log");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchActivities();
    }, [user]);

    const getIcon = (type: string) => {
        if (type.includes("poll")) return <Activity className="h-5 w-5 text-purple-500" />;
        if (type.includes("bill")) return <CreditCard className="h-5 w-5 text-green-500" />;
        if (type.includes("complaint")) return <AlertCircle className="h-5 w-5 text-red-500" />;
        if (type.includes("user")) return <User className="h-5 w-5 text-blue-500" />;
        return <FileText className="h-5 w-5 text-slate-500" />;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Activity Log</h2>
                <p className="text-muted-foreground">System-wide audit trail of all major actions.</p>
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
            ) : activities.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No activity recorded yet.</div>
            ) : (
                <div className="space-y-4">
                    {activities.map((item) => (
                        <Card key={item.id} className="p-4 flex flex-row items-center gap-4">
                            <div className="bg-slate-100 p-2 rounded-full">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{item.title}</p>
                                <p className="text-muted-foreground text-xs">{item.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                        {item.entity_type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        by {item.user_name || "System"}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(item.created_at).toLocaleString()}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && activities.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {activities.length} event{activities.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
