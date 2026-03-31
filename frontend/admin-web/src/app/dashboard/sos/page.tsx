"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SOSAlert {
    id: number;
    user_name: string;
    flat: string;
    block: string;
    message: string;
    emergency_type: string;
    emergency_service: string;
    status: string;
    trigger_buzzer: boolean;
    location_lat: number | null;
    location_lng: number | null;
    created_at: string;
}

interface EmergencyService {
    name: string;
    number: string;
    icon: string;
}

const EMERGENCY_ICONS: Record<string, string> = {
    fire: "🔥",
    medical: "🚑",
    police: "👮",
    general: "🚨",
};

export default function SOSPage() {
    const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
    const [emergencyContacts, setEmergencyContacts] = useState<Record<string, EmergencyService> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAdminAlert, setShowAdminAlert] = useState(false);
    const [triggerBuzzer, setTriggerBuzzer] = useState(false);
    const [adminMessage, setAdminMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSOSAlerts = async () => {
        try {
            const res = await api.get('/sos/all');
            setSOSAlerts(res.data);
        } catch {
            setError("Failed to load SOS alerts");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmergencyContacts = async () => {
        try {
            const res = await api.get('/sos/emergency-contacts');
            setEmergencyContacts(res.data.contacts);
        } catch {
            // Silent — supplementary feature
        }
    };

    useEffect(() => {
        fetchSOSAlerts();
        fetchEmergencyContacts();

        // Auto-refresh every 30s — SOS is life-safety critical
        const interval = setInterval(fetchSOSAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const createAdminSOS = async () => {
        if (!adminMessage.trim()) {
            setError("Please enter an alert message");
            return;
        }
        if (adminMessage.length > 500) {
            setError("Message must be under 500 characters");
            return;
        }

        setIsSubmitting(true);
        setError("");
        try {
            await api.post('/sos/create', {
                message: adminMessage,
                type: "general",
                trigger_buzzer: triggerBuzzer,
            });
            setShowAdminAlert(false);
            setAdminMessage("");
            setTriggerBuzzer(false);
            fetchSOSAlerts();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to create SOS alert");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const respondToSOS = async (id: number) => {
        setError("");
        try {
            await api.post(`/sos/respond/${id}`);
            fetchSOSAlerts();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to respond");
            } else {
                setError("An unexpected error occurred");
            }
        }
    };

    const resolveSOS = async (id: number) => {
        setError("");
        try {
            await api.post(`/sos/resolve/${id}`);
            fetchSOSAlerts();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to resolve");
            } else {
                setError("An unexpected error occurred");
            }
        }
    };

    const callEmergencyService = (number: string, name: string) => {
        if (confirm(`Call ${name} at ${number}?`)) {
            window.location.href = `tel:${number}`;
        }
    };

    const activeCount = sosAlerts.filter(s => s.status === "ACTIVE").length;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center items-center py-16">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <span aria-hidden="true">🚨</span> SOS Emergency System
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitor and respond to emergencies · Auto-refreshes every 30s
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {activeCount > 0 && (
                        <Badge variant="destructive">{activeCount} Active</Badge>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => setShowAdminAlert(true)}>
                        + Create Alert
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Emergency Contacts */}
            {emergencyContacts && Object.keys(emergencyContacts).length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-red-600 text-sm font-medium">
                            Emergency Services — Click to Call
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.values(emergencyContacts).map((service) => (
                                <Button
                                    key={service.number}
                                    variant="outline"
                                    className="h-16 flex-col gap-1 border-red-200"
                                    onClick={() => callEmergencyService(service.number, service.name)}
                                >
                                    <span aria-hidden="true" className="text-xl">{service.icon}</span>
                                    <span className="text-xs">{service.name}</span>
                                    <span className="text-xs font-bold">{service.number}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Admin Alert Dialog */}
            <Dialog
                open={showAdminAlert}
                onOpenChange={(open) => {
                    setShowAdminAlert(open);
                    if (!open) {
                        setAdminMessage("");
                        setTriggerBuzzer(false);
                        setError("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Emergency Alert</DialogTitle>
                        <DialogDescription>
                            Send an emergency alert to all residents in the society.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Fixed: using shadcn Textarea */}
                        <Textarea
                            placeholder="Enter emergency message for all residents..."
                            rows={4}
                            maxLength={500}
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                        />
                        {adminMessage.length > 400 && (
                            <p className="text-xs text-muted-foreground text-right">
                                {adminMessage.length}/500
                            </p>
                        )}
                        <Alert>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="buzzer"
                                    checked={triggerBuzzer}
                                    onCheckedChange={(checked) => setTriggerBuzzer(checked as boolean)}
                                    className="mt-0.5"
                                />
                                <div>
                                    <label htmlFor="buzzer" className="text-sm font-medium cursor-pointer">
                                        Activate Buzzer Alarm on All Resident Devices
                                    </label>
                                    <AlertDescription className="mt-1 text-xs">
                                        This will trigger alarms even if the app is closed or in background
                                    </AlertDescription>
                                </div>
                            </div>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdminAlert(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={createAdminSOS}
                            disabled={isSubmitting || !adminMessage.trim()}
                        >
                            {isSubmitting ? "Sending..." : "Send Alert to All Residents"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SOS Alert Cards */}
            <div className="grid gap-4">
                {sosAlerts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <span aria-hidden="true">🟢</span> No SOS alerts. All clear!
                        </CardContent>
                    </Card>
                ) : (
                    sosAlerts.map((alert) => (
                        <Card
                            key={alert.id}
                            className={alert.status === "ACTIVE" ? "border-red-500 border-2" : ""}
                        >
                            <CardHeader className="flex flex-row justify-between items-start pb-2">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <span aria-hidden="true">
                                            {EMERGENCY_ICONS[alert.emergency_type] || "🚨"}
                                        </span>
                                        SOS — {alert.user_name || "Unknown"}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Flat {alert.flat}
                                        {alert.block && ` · Block ${alert.block}`}
                                        {" · "}
                                        {new Date(alert.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {alert.trigger_buzzer && (
                                        <Badge variant="destructive" className="text-xs">BUZZER</Badge>
                                    )}
                                    <Badge
                                        variant={
                                            alert.status === "ACTIVE" ? "destructive" :
                                                alert.status === "RESPONDING" ? "default" : "secondary"
                                        }
                                    >
                                        {alert.status}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {alert.message && (
                                    <p className="text-sm">{alert.message}</p>
                                )}
                                {alert.emergency_service && (
                                    <Badge variant="outline" className="text-xs">
                                        Service: {alert.emergency_service}
                                    </Badge>
                                )}

                                {/* Fixed: emoji wrapped in span — no lint warning */}
                                {alert.location_lat && alert.location_lng && (
                                    <div className="text-sm text-blue-600 flex items-center gap-1">
                                        <span aria-hidden="true">📍</span>
                                        <a
                                            href={`https://maps.google.com/?q=${alert.location_lat},${alert.location_lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline"
                                        >
                                            View Location on Maps
                                        </a>
                                    </div>
                                )}

                                {alert.status === "ACTIVE" && (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => respondToSOS(alert.id)}>
                                            Respond
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => resolveSOS(alert.id)}
                                        >
                                            Resolve
                                        </Button>
                                    </div>
                                )}

                                {alert.status === "RESPONDING" && (
                                    <Button size="sm" onClick={() => resolveSOS(alert.id)}>
                                        Mark Resolved ✓
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}