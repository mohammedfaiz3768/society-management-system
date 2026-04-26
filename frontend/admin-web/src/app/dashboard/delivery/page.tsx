"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, PackageCheck, PackageX, RefreshCw, Truck } from "lucide-react";

interface Delivery {
    id: number;
    flat_number: string;
    recipient_name: string;
    phone: string;
    item_description: string;
    company: string;
    status: string;
    created_at: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    pending:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
    delivered: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Delivered' },
    collected: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Collected' },
    returned:  { bg: 'bg-white',  text: 'text-slate-500',  dot: 'bg-zinc-400',  label: 'Returned' },
};

export default function DeliveryPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchDeliveries = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get('/delivery?limit=50');
            setDeliveries(res.data);
        } catch {
            setError("Failed to load deliveries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDeliveries(); }, []);

    const updateStatus = async (id: number, status: string) => {
        setUpdatingId(id);
        try {
            await api.patch(`/delivery/${id}`, { status });
            fetchDeliveries();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to update status");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = deliveries.filter(d =>
        d.flat_number?.includes(search) ||
        d.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.company?.toLowerCase().includes(search.toLowerCase())
    );

    const pendingCount = deliveries.filter(d => d.status === 'pending').length;
    const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Delivery Tracking</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Packages logged by guards at the gate.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDeliveries} className="border-slate-200 gap-1.5">
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-200 bg-yellow-50 text-yellow-700 text-xs font-semibold">
                    <Package className="w-3.5 h-3.5" /> {pendingCount} Pending
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                    <PackageCheck className="w-3.5 h-3.5" /> {deliveredCount} Delivered
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-semibold">
                    <Truck className="w-3.5 h-3.5" /> {deliveries.length} Total
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search by flat, name, company..."
                    className="pl-9 border-slate-200"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Delivery cards */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 animate-pulse">
                            <div className="flex justify-between mb-3">
                                <div className="h-4 w-24 bg-slate-50 rounded" />
                                <div className="h-5 w-20 bg-slate-50 rounded-full" />
                            </div>
                            <div className="h-3.5 w-48 bg-slate-50 rounded mb-2" />
                            <div className="h-3 w-32 bg-slate-50 rounded" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <PackageX className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">
                        {search ? "No deliveries match your search." : "No deliveries logged yet."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((delivery) => {
                        const cfg = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.pending;
                        return (
                            <div key={delivery.id} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                                            <Package className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Flat {delivery.flat_number}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {delivery.recipient_name || "Resident"}
                                                {delivery.phone && <span> آ· {delivery.phone}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        {cfg.label}
                                    </span>
                                </div>

                                <div className="ml-13 space-y-1 pl-[52px]">
                                    {delivery.item_description && (
                                        <p className="text-sm text-slate-700">
                                            <span className="text-slate-500">Item:</span>{" "}{delivery.item_description}
                                        </p>
                                    )}
                                    {delivery.company && (
                                        <p className="text-sm text-slate-700">
                                            <span className="text-slate-500">Company:</span>{" "}{delivery.company}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500">
                                        Logged: {new Date(delivery.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>

                                    {delivery.status === "pending" && (
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                disabled={updatingId === delivery.id}
                                                onClick={() => updateStatus(delivery.id, "delivered")}
                                            >
                                                <PackageCheck className="w-3.5 h-3.5 mr-1" />
                                                Mark Delivered
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                                disabled={updatingId === delivery.id}
                                                onClick={() => updateStatus(delivery.id, "returned")}
                                            >
                                                Return
                                            </Button>
                                        </div>
                                    )}
                                    {delivery.status === "delivered" && (
                                        <div className="pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                                disabled={updatingId === delivery.id}
                                                onClick={() => updateStatus(delivery.id, "collected")}
                                            >
                                                Mark Collected
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && deliveries.length > 0 && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{filtered.length}</span> of <span className="font-semibold text-slate-500">{deliveries.length}</span> deliveries
                </p>
            )}
        </div>
    );
}
