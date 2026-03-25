"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/apiUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DeliveryPage() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(buildApiUrl("delivery/all"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDeliveries(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Delivery Tracking</h1>
                <Badge>{deliveries.length} Total</Badge>
            </div>

            <div className="grid gap-4">
                {deliveries.map((delivery: any) => (
                    <Card key={delivery.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">Flat {delivery.flat_number}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {delivery.recipient_name || "Resident"}
                                        {delivery.phone && ` • ${delivery.phone}`}
                                    </p>
                                </div>
                                <Badge variant={delivery.status === "delivered" ? "secondary" : "default"}>
                                    {delivery.status || "pending"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {delivery.item_description && (
                                    <p className="text-sm"><strong>Item:</strong> {delivery.item_description}</p>
                                )}
                                {delivery.company && (
                                    <p className="text-sm"><strong>Company:</strong> {delivery.company}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Logged: {new Date(delivery.created_at).toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {deliveries.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No deliveries logged yet
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
