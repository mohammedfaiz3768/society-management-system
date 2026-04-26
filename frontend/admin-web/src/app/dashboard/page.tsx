'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { motion, Variants } from "framer-motion";
import {
    Users, Building2, UserCog, AlertCircle, Wrench,
    UserCheck, BarChart2, Zap, ArrowRight, Clock,
    TrendingUp, Activity, ChevronRight, Megaphone, Mail, ShieldAlert
} from "lucide-react";

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

const ENTITY_CONFIG: Record<string, { color: string; dot: string }> = {
    user:         { color: 'text-sky-500', dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]' },
    complaint:    { color: 'text-amber-500', dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' },
    announcement: { color: 'text-emerald-500', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    poll:         { color: 'text-blue-500', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' },
    visitor:      { color: 'text-violet-500', dot: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]' },
    sos:          { color: 'text-rose-600', dot: 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)] animate-pulse' },
    default:      { color: 'text-slate-400', dot: 'bg-slate-400' },
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } }
};

function StatCard({
    label, value, icon: Icon, href, alert = false, sub,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    href: string;
    alert?: boolean;
    sub?: string;
}) {
    return (
        <motion.div variants={itemVariants}>
            <Link
                href={href}
                className={`group relative overflow-hidden rounded-[2rem] bg-white border p-6 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-1.5
                ${alert ? 'border-rose-100 shadow-[0_8px_30px_rgba(244,63,94,0.06)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.12)] hover:border-rose-200' 
                        : 'border-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-slate-100'}`}
            >
                <div className="flex items-start justify-between relative z-10">
                    <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.15] group-hover:rotate-3
                        ${alert ? 'bg-rose-50 text-rose-500 shadow-inner' : 'bg-slate-50 text-slate-600 shadow-inner group-hover:text-rose-500 group-hover:bg-rose-50'}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                        <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 ${alert ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-500'}`} />
                    </div>
                </div>

                <div className="relative z-10 mt-2">
                    <p className="text-[2.5rem] leading-none font-extrabold tracking-tight text-slate-800">
                        {value}
                    </p>
                    <p className="text-[13px] text-slate-500 font-bold mt-2 tracking-wide">{label}</p>
                    {sub && <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest bg-slate-50 inline-block px-2 py-0.5 rounded-md">{sub}</p>}
                </div>
            </Link>
        </motion.div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    api.get('/dashboard/admin'),
                    api.get('/timeline/global?limit=6'),
                ]);
                setStats(statsRes.data);
                setActivity(activityRes.data);
            } catch {
                // Ignore map to graceful loading error ui
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-rose-500 rounded-full animate-spin shadow-lg" />
            </div>
        );
    }

    const hasAlerts = (stats?.complaints_open ?? 0) > 0 || (stats?.emergencies_open ?? 0) > 0;

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 max-w-[1400px] mx-auto pt-2"
        >
            {/* Header Area */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h1>
                    <p className="text-sm font-semibold tracking-wide text-slate-500 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                        Live Metrics
                    </p>
                </div>
                {hasAlerts && (
                    <motion.div
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Link href="/dashboard/emergency-alerts" className="flex items-center gap-2.5 px-5 py-2.5 rounded-[1.2rem] bg-rose-50 text-rose-600 font-bold text-sm border border-rose-100 hover:bg-rose-100 transition-all shadow-sm group">
                            <ShieldAlert className="w-[18px] h-[18px] text-rose-500 group-hover:scale-110 transition-transform" />
                            Security Alerts
                        </Link>
                    </motion.div>
                )}
            </motion.div>

            {/* KPI Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Residents" value={stats?.users.residents ?? 0} icon={Users} href="/dashboard/residents" />
                <StatCard label="Registered Flats" value={stats?.flats ?? 0} icon={Building2} href="/dashboard/flats" />
                <StatCard label="Active Staff" value={stats?.staff ?? 0} icon={UserCog} href="/dashboard/staff" />
                <StatCard
                    label="Open Complaints" value={stats?.complaints_open ?? 0} icon={AlertCircle} href="/dashboard/complaints"
                    alert={(stats?.complaints_open ?? 0) > 0}
                />
                
                <StatCard
                    label="Pending Services" value={stats?.services_open ?? 0} icon={Wrench} href="/dashboard/services"
                />
                <StatCard label="Today's Visitors" value={stats?.today_visitors ?? 0} icon={UserCheck} href="/dashboard/visitors" sub="View Log" />
                <StatCard label="Active Polls" value={stats?.active_polls ?? 0} icon={BarChart2} href="/dashboard/polls" />
                <StatCard
                    label="Emergency Status" value={stats?.emergencies_open ?? 0} icon={Zap} href="/dashboard/emergency-alerts"
                    alert={(stats?.emergencies_open ?? 0) > 0}
                />
            </motion.div>

            {/* Bottom Section */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Cyber Activity Log -> Premium Clean Log */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden group">
                    <div className="px-8 py-6 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recent Activity</h2>
                        </div>
                        <Link href="/dashboard/activity" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors bg-slate-50 hover:bg-rose-50 px-4 py-2.5 rounded-xl">
                            Full Log <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    
                    <div className="p-4 pt-1 relative z-10">
                        {activity.length === 0 ? (
                            <div className="py-16 text-center">
                                <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">Everything is quiet. No recent events.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {activity.map((item) => {
                                    const cfg = ENTITY_CONFIG[item.entity_type] || ENTITY_CONFIG.default;
                                    return (
                                        <div key={item.id} className="flex items-start gap-5 p-4 rounded-[1.5rem] hover:bg-slate-50 transition-colors">
                                            <div className="relative flex-shrink-0 mt-1.5">
                                                <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-bold text-slate-800 leading-tight">
                                                    {item.action}
                                                </p>
                                                {item.details && (
                                                    <p className="text-[13px] text-slate-500 font-medium mt-1 line-clamp-1">{item.details}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-3">
                                                    {item.user_name && (
                                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg">
                                                            <UserCog className="w-3 h-3" />
                                                            {item.user_name}
                                                        </span>
                                                    )}
                                                    <span className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {timeAgo(item.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Operations Terminal -> Clean Action Panel */}
                <motion.div variants={itemVariants} className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden relative border border-slate-700">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />
                    
                    <div className="relative px-8 py-6 border-b border-slate-700/50 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-rose-400" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Quick Actions</h2>
                    </div>
                    
                    <div className="relative p-6 flex flex-col gap-3">
                        {[
                            { label: "Register Resident", href: "/dashboard/residents", icon: Users },
                            { label: "Post Announcement", href: "/dashboard/announcements", icon: Megaphone },
                            { label: "Launch System Poll", href: "/dashboard/polls", icon: BarChart2 },
                            { label: "Manage Facilities", href: "/dashboard/flats", icon: Building2 },
                            { label: "Send Invitations", href: "/dashboard/invitations", icon: Mail },
                        ].map(({ label, href, icon: Icon }, i) => (
                            <Link
                                key={label}
                                href={href}
                                className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-rose-400/30 hover:shadow-[0_4px_20px_rgba(244,63,94,0.1)] transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:border-rose-400/30 transition-colors">
                                        <Icon className="w-4 h-4 text-slate-300 group-hover:text-rose-300 transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{label}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                    <ChevronRight className="w-4 h-4 text-rose-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

            </motion.div>
        </motion.div>
    );
}
