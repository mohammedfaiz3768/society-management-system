"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/apiUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SOSPage() {
    const [sosAlerts, setSOSAlerts] = useState([]);
    const [emergencyContacts, setEmergencyContacts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdminAlert, setShowAdminAlert] = useState(false);
    const [triggerBuzzer, setTriggerBuzzer] = useState(false);
    const [adminMessage, setAdminMessage] = useState("");

    useEffect(() => {
        fetchSOSAlerts();
        fetchEmergencyContacts();
    }, []);

    const fetchSOSAlerts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(buildApiUrl("sos/all"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSOSAlerts(data);
            }
        } catch (error) {
            console.error("Error fetching SOS alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmergencyContacts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(buildApiUrl("sos/emergency-contacts"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setEmergencyContacts(data.contacts);
            }
        } catch (error) {
            console.error("Error fetching emergency contacts:", error);
        }
    };

    const createAdminSOS = async () => {
        if (!adminMessage.trim()) {
            alert("Please enter an alert message");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await fetch(buildApiUrl("sos/create"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: adminMessage,
                    type: "general",
                    trigger_buzzer: triggerBuzzer,
                }),
            });

            setShowAdminAlert(false);
            setAdminMessage("");
            setTriggerBuzzer(false);
            fetchSOSAlerts();

            if (triggerBuzzer) {
                alert("🚨 Buzzer activated on all resident devices!");
            }
        } catch (error) {
            console.error("Error creating SOS:", error);
        }
    };

    const respondToSOS = async (id: number) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(buildApiUrl(`sos/respond/${id}`), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ response: "En route" }),
            });
            fetchSOSAlerts();
        } catch (error) {
            console.error("Error responding to SOS:", error);
        }
    };

    const resolveSOS = async (id: number) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(buildApiUrl(`sos/resolve/${id}`), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchSOSAlerts();
        } catch (error) {
            console.error("Error resolving SOS:", error);
        }
    };

    const callEmergencyService = (number: string, name: string) => {
        if (confirm(`Call ${name} at ${number}?`)) {
            window.location.href = `tel:${number}`;
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">🚨 SOS Emergency System</h1>
                    <p className="text-muted-foreground mt-1">Monitor and respond to emergencies</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="destructive">
                        {sosAlerts.filter((s: any) => s.status === "ACTIVE").length} Active
                    </Badge>
                    <Button variant="destructive" onClick={() => setShowAdminAlert(true)}>
                        + Create Admin Alert
                    </Button>
                </div>
            </div>

            {/* Emergency Contacts Card */}
            {emergencyContacts && (
                <Card className="border-red-200 bg-red-50/50">
                    <CardHeader>
                        <CardTitle className="text-red-600">Emergency Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.values(emergencyContacts).map((service: any) => (
                                <Button
                                    key={service.number}
                                    variant="outline"
                                    className="h-20 flex-col text-lg"
                                    onClick={() => callEmergencyService(service.number, service.name)}
                                >
                                    <span className="text-3xl mb-1">{service.icon}</span>
                                    <span className="text-sm font-normal">{service.name}</span>
                                    <span className="font-bold">{service.number}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Admin Alert Dialog */}
            <Dialog open={showAdminAlert} onOpenChange={setShowAdminAlert}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Emergency Alert</DialogTitle>
                        <DialogDescription>
                            Send an emergency alert to all residents. Optionally activate buzzer alarms.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <textarea
                            className="w-full p-3 border rounded-md"
                            placeholder="Enter emergency message..."
                            rows={4}
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                        />
                        <Alert>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="buzzer"
                                    checked={triggerBuzzer}
                                    onCheckedChange={(checked) => setTriggerBuzzer(checked as boolean)}
                                />
                                <div className="flex-1">
                                    <label htmlFor="buzzer" className="text-sm font-medium cursor-pointer">
                                        Activate Buzzer Alarm on All Resident Devices
                                    </label>
                                    <AlertDescription className="mt-1">
                                        This will trigger alarms even if the app is closed
                                    </AlertDescription>
                                </div>
                            </div>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdminAlert(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={createAdminSOS}>Send Alert</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SOS Alerts List */}
            <div className="grid gap-4">
                {sosAlerts.map((alert: any) => (
                    <Card key={alert.id} className={alert.status === "ACTIVE" ? "border-red-500 border-2" : ""}>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {alert.emergency_type && (
                                        <span className="text-2xl">
                                            {alert.emergency_type === "fire" && "🔥"}
                                            {alert.emergency_type === "medical" && "🚑"}
                                            {alert.emergency_type === "police" && "👮"}
                                            {alert.emergency_type === "general" && "🚨"}
                                        </span>
                                    )}
                                    SOS Alert - {alert.user_name || "Unknown"}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Flat: {alert.flat} {alert.block && `• Block ${alert.block}`} |
                                    {new Date(alert.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {alert.trigger_buzzer && (
                                    <Badge variant="destructive">BUZZER ON</Badge>
                                )}
                                <Badge variant={
                                    alert.status === "ACTIVE" ? "destructive" :
                                        alert.status === "RESPONDING" ? "default" : "secondary"
                                }>
                                    {alert.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {alert.message && (
                                <p className="text-sm">{alert.message}</p>
                            )}
                            {alert.emergency_service && (
                                <Badge variant="outline" className="text-sm">
                                    Service: {alert.emergency_service}
                                </Badge>
                            )}
                            {alert.location_lat && alert.location_lng && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    📍 <a
                                        href={`https://maps.google.com/?q=${alert.location_lat},${alert.location_lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline"
                                    >
                                        View Location on Map
                                    </a>
                                </div>
                            )}
                            {alert.status === "ACTIVE" && (
                                <div className="flex gap-2">
                                    <Button onClick={() => respondToSOS(alert.id)} size="sm">
                                        Respond
                                    </Button>
                                    <Button onClick={() => resolveSOS(alert.id)} variant="outline" size="sm">
                                        Resolve
                                    </Button>
                                </div>
                            )}
                            {alert.status === "RESPONDING" && (
                                <Button onClick={() => resolveSOS(alert.id)} variant="default" size="sm">
                                    Mark Resolved
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {sosAlerts.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No SOS alerts. All clear! 🟢
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
