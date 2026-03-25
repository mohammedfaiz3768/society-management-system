"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function ActivityPage() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/timeline/global?limit=50');
            setActivities(res.data);
        } catch (err) {
            console.error("Failed to fetch timeline", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const getIcon = (type: string) => {
        if (type.includes('poll')) return <Activity className="h-5 w-5 text-purple-500" />;
        if (type.includes('bill')) return <CreditCard className="h-5 w-5 text-green-500" />;
        if (type.includes('complaint')) return <AlertCircle className="h-5 w-5 text-red-500" />;
        if (type.includes('user')) return <User className="h-5 w-5 text-blue-500" />;
        return <FileText className="h-5 w-5 text-slate-500" />;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
                <p className="text-muted-foreground">System-wide audit trail of all major actions.</p>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-10">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No activity recorded yet.</div>
                ) : (
                    activities.map((item) => (
                        <Card key={item.id} className="p-4 flex flex-row items-center gap-4">
                            <div className="bg-slate-100 p-2 rounded-full">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{item.title}</p>
                                <p className="text-muted-foreground text-xs">{item.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0">{item.entity_type}</Badge>
                                    <span className="text-xs text-slate-400">by {item.user_name || 'System'}</span>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 whitespace-nowrap">
                                {new Date(item.created_at).toLocaleString()}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
