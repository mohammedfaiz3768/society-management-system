"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

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

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    delivered: 'bg-green-100 text-green-700',
    collected: 'bg-blue-100 text-blue-700',
    returned: 'bg-slate-100 text-slate-600',
};

export default function DeliveryPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchDeliveries = async () => {
        setError("");
        try {
            // ✅ Correct endpoint
            const res = await api.get('/delivery?limit=50');
            setDeliveries(res.data);
        } catch {
            setError("Failed to load deliveries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDeliveries(); }, []);

    // ✅ Status update
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

    // ✅ Spinner inside layout
    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        // ✅ No p-6 — layout handles padding
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Delivery Tracking</h2>
                    <p className="text-sm text-muted-foreground">
                        Packages logged by guards at the gate.
                    </p>
                </div>
                <span className="text-sm text-muted-foreground">
                    {deliveries.length} total
                </span>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* ✅ Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by flat, name, company..."
                    className="pl-8"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="grid gap-4">
                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-sm text-muted-foreground">
                            {search ? "No deliveries match your search." : "No deliveries logged yet."}
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((delivery) => (
                        <Card key={delivery.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base">
                                            Flat {delivery.flat_number}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {delivery.recipient_name || "Resident"}
                                            {delivery.phone && ` · ${delivery.phone}`}
                                        </p>
                                    </div>
                                    {/* ✅ All statuses handled */}
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[delivery.status] || STATUS_STYLES.pending}`}>
                                        {delivery.status || "pending"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {delivery.item_description && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">Item:</span>{" "}
                                        {delivery.item_description}
                                    </p>
                                )}
                                {delivery.company && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">Company:</span>{" "}
                                        {delivery.company}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Logged: {new Date(delivery.created_at).toLocaleString()}
                                </p>

                                {/* ✅ Status action buttons */}
                                {delivery.status === "pending" && (
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={updatingId === delivery.id}
                                            onClick={() => updateStatus(delivery.id, "delivered")}
                                        >
                                            Mark Delivered
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={updatingId === delivery.id}
                                            onClick={() => updateStatus(delivery.id, "returned")}
                                        >
                                            Return
                                        </Button>
                                    </div>
                                )}
                                {delivery.status === "delivered" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2"
                                        disabled={updatingId === delivery.id}
                                        onClick={() => updateStatus(delivery.id, "collected")}
                                    >
                                        Mark Collected
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {!loading && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {deliveries.length} deliveries
                </p>
            )}
        </div>
    );
}