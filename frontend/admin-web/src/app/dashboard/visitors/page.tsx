"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, RefreshCw, LogOut, UserCheck, Users, Clock } from "lucide-react";

interface Visitor {
    id: number;
    name: string;
    phone: string;
    purpose: string;
    flat_number: string;
    in_time: string;
    out_time: string | null;
    approved: boolean | null;
    resident_name: string | null;
}

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [exitingId, setExitingId] = useState<number | null>(null);

    const fetchVisitors = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await api.get("/visitors?limit=100");
            setVisitors(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to load visitors");
            else setError("Failed to load visitors");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

    const handleExit = async (id: number) => {
        if (!confirm("Mark this visitor as exited?")) return;
        setExitingId(id);
        try {
            await api.put(`/visitors/exit/${id}`);
            setVisitors(prev => prev.map(v => v.id === id ? { ...v, out_time: new Date().toISOString() } : v));
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to mark exit");
            else setError("Failed to mark exit");
        } finally {
            setExitingId(null);
        }
    };

    const filtered = visitors.filter(v => {
        if (!search) return true;
        const q = search.toLowerCase();
        return v.name?.toLowerCase().includes(q) || v.phone?.includes(q) || v.flat_number?.includes(q) || v.purpose?.toLowerCase().includes(q);
    });

    const insideNow = visitors.filter(v => !v.out_time).length;
    const todayCount = visitors.filter(v => new Date(v.in_time).toDateString() === new Date().toDateString()).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Visitor Log</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">All walk-in visitors logged by guards at the gate.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchVisitors} className="border-slate-200 gap-1.5">
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
                    <UserCheck className="w-3.5 h-3.5" />
                    {insideNow} Currently Inside
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {todayCount} Today
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    {visitors.length} Total Records
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search name, phone, flat..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 border-slate-200"
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-white">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Visitor</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Flat</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Purpose</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Entry</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-4">
                                        <div className="space-y-1.5">
                                            <div className="h-3.5 w-28 bg-slate-50 rounded animate-pulse" />
                                            <div className="h-3 w-20 bg-slate-50 rounded animate-pulse" />
                                        </div>
                                    </td>
                                    <td colSpan={5} />
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-14 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <UserCheck className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">
                                            {search ? "No visitors match your search." : "No visitor records found."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(visitor => (
                                <tr key={visitor.id} className="hover:bg-white/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <p className="font-semibold text-slate-800">{visitor.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{visitor.phone}</p>
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">{visitor.flat_number || '—'}</td>
                                    <td className="px-5 py-3.5 text-slate-500 max-w-[160px] truncate">{visitor.purpose || "—"}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500">
                                        {new Date(visitor.in_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {visitor.out_time ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-zinc-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                                Exited
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Inside
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        {!visitor.out_time ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={exitingId === visitor.id}
                                                onClick={() => handleExit(visitor.id)}
                                                className="h-7 text-xs border-slate-200 hover:border-red-300 hover:text-red-600 gap-1"
                                            >
                                                <LogOut className="h-3 w-3" />
                                                {exitingId === visitor.id ? "..." : "Exit"}
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-500">
                                                {new Date(visitor.out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{filtered.length}</span> of <span className="font-semibold text-slate-500">{visitors.length}</span> records
                </p>
            )}
        </div>
    );
}
