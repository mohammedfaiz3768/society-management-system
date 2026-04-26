'use client';

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Search, RefreshCw, CheckCircle2, Clock, Users, DoorOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GatePass {
    id: number;
    visitor_name: string;
    visitor_phone: string;
    flat_number: string;
    block: string;
    vehicle_number: string | null;
    valid_until: string;
    status: string;
    number_of_people?: number;
    created_at: string;
    purpose?: string;
}

type FilterType = "all" | "used" | "unused";

function getPassStatus(pass: GatePass) {
    if (pass.status === 'EXITED' || pass.status === 'USED') return 'used';
    if (pass.status === 'EXPIRED' || new Date(pass.valid_until) < new Date()) return 'expired';
    return 'active';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    active:  { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Active' },
    expired: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Expired' },
    used:    { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Used' },
};

export default function GatePage() {
    const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUsed, setFilterUsed] = useState<FilterType>("all");

    const fetchGatePasses = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get('/gate-pass/admin/all', {
                params: { page: 1, limit: 50 }
            });
            const data = res.data;
            setGatePasses(data.gatePasses ?? (Array.isArray(data) ? data : []));
        } catch {
            setError("Failed to fetch gate passes");
            setGatePasses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGatePasses(); }, []);

    const filtered = gatePasses.filter(pass => {
        const status = getPassStatus(pass);
        const matchesFilter =
            filterUsed === "all" ||
            (filterUsed === "unused" && status === "active") ||
            (filterUsed === "used" && status === "used");

        const matchesSearch = !searchTerm ||
            pass.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pass.visitor_phone?.includes(searchTerm) ||
            pass.flat_number?.includes(searchTerm);

        return matchesFilter && matchesSearch;
    });

    const activeCount = gatePasses.filter(p => getPassStatus(p) === 'active').length;
    const todayCount = gatePasses.filter(p => {
        return new Date(p.created_at).toDateString() === new Date().toDateString();
    }).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Gate & Visitors</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Monitor all gate passes and visitor activity.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchGatePasses} className="border-slate-200 gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stat chips */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {activeCount} Active
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-rose-50 text-rose-600 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> {todayCount} Today
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5" /> {gatePasses.length} Total
                </div>
            </div>

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search visitor, phone, flat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 border-slate-200"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "unused", "used"] as FilterType[]).map((f) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filterUsed === f ? "default" : "outline"}
                            className={filterUsed === f ? "bg-rose-600 hover:bg-rose-600 text-white" : "border-slate-200"}
                            onClick={() => setFilterUsed(f)}
                        >
                            {f === "all" ? "All" : f === "unused" ? "Active" : "Used"}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-white">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Visitor</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Flat</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vehicle</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">People</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valid Until</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-3.5">
                                        <div className="space-y-1.5">
                                            <div className="h-3.5 w-32 bg-slate-50 rounded animate-pulse" />
                                            <div className="h-3 w-24 bg-slate-50 rounded animate-pulse" />
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-16 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-20 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-8 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-28 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-5 w-16 bg-slate-50 rounded-full animate-pulse" /></td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-14 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <DoorOpen className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">
                                            {searchTerm || filterUsed !== "all" ? "No passes match your filters." : "No gate passes found."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((pass) => {
                                const status = getPassStatus(pass);
                                const cfg = STATUS_CONFIG[status];
                                return (
                                    <tr key={pass.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-slate-800">{pass.visitor_name}</div>
                                            <div className="text-xs text-slate-500">{pass.visitor_phone}</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 font-medium">
                                            {pass.block && pass.flat_number
                                                ? `${pass.block}-${pass.flat_number}`
                                                : pass.flat_number || '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                                            {pass.vehicle_number || '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">
                                            {pass.number_of_people || 1}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-zinc-500">
                                            {new Date(pass.valid_until).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{filtered.length}</span> of <span className="font-semibold text-slate-500">{gatePasses.length}</span> passes
                </p>
            )}
        </div>
    );
}
