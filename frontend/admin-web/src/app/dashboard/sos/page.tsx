"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Flame, Ambulance, ShieldAlert, Bell, MapPin, CheckCircle, Phone, Plus } from "lucide-react";

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

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    fire:    { icon: Flame,       color: 'text-red-600',    bg: 'bg-red-100',    label: 'Fire' },
    medical: { icon: Ambulance,   color: 'text-rose-600',   bg: 'bg-rose-100',   label: 'Medical' },
    police:  { icon: ShieldAlert, color: 'text-blue-600',   bg: 'bg-blue-100',   label: 'Police' },
    general: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Emergency' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    ACTIVE:     { label: 'Active',     bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500 animate-pulse' },
    RESPONDING: { label: 'Responding', bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
    RESOLVED:   { label: 'Resolved',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
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
            // silent
        }
    };

    useEffect(() => {
        fetchSOSAlerts();
        fetchEmergencyContacts();
        const interval = setInterval(fetchSOSAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const createAdminSOS = async () => {
        if (!adminMessage.trim()) { setError("Please enter an alert message"); return; }
        if (adminMessage.length > 500) { setError("Message must be under 500 characters"); return; }
        setIsSubmitting(true);
        setError("");
        try {
            await api.post('/sos/create', { message: adminMessage, type: "general", trigger_buzzer: triggerBuzzer });
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
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to respond");
            else setError("An unexpected error occurred");
        }
    };

    const resolveSOS = async (id: number) => {
        setError("");
        try {
            await api.post(`/sos/resolve/${id}`);
            fetchSOSAlerts();
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to resolve");
            else setError("An unexpected error occurred");
        }
    };

    const callEmergencyService = (number: string, name: string) => {
        if (confirm(`Call ${name} at ${number}?`)) window.location.href = `tel:${number}`;
    };

    const activeCount = sosAlerts.filter(s => s.status === "ACTIVE").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500">Loading SOS data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">SOS Emergency System</h1>
                    </div>
                    <p className="text-sm text-zinc-500">Monitor and respond to emergencies آ· Auto-refreshes every 30s</p>
                </div>
                <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {activeCount} Active
                        </div>
                    )}
                    <Button
                        onClick={() => setShowAdminAlert(true)}
                        className="bg-red-600 hover:bg-red-700 text-slate-900 gap-1.5 h-9"
                    >
                        <Plus className="w-4 h-4" /> Create Alert
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
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">Emergency Services - Tap to Call</p>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.values(emergencyContacts).map((service) => (
                            <button
                                key={service.number}
                                onClick={() => callEmergencyService(service.number, service.name)}
                                className="flex flex-col items-center gap-1 py-3 px-2 bg-white shadow-sm border-slate-100 border border-red-200 rounded-2xl hover:bg-red-50 hover:border-red-300 transition-colors"
                            >
                                <span className="text-xl">{service.icon}</span>
                                <span className="text-xs font-semibold text-slate-700">{service.name}</span>
                                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {service.number}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Alert Dialog */}
            <Dialog open={showAdminAlert} onOpenChange={(open) => { setShowAdminAlert(open); if (!open) { setAdminMessage(""); setTriggerBuzzer(false); setError(""); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Emergency Alert</DialogTitle>
                        <DialogDescription>Send an emergency alert to all residents in the society.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Textarea
                            placeholder="Enter emergency message for all residents..."
                            rows={4}
                            maxLength={500}
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                            className="resize-none border-slate-200"
                        />
                        {adminMessage.length > 400 && (
                            <p className="text-xs text-slate-500 text-right">{adminMessage.length}/500</p>
                        )}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <Checkbox
                                id="buzzer"
                                checked={triggerBuzzer}
                                onCheckedChange={(checked) => setTriggerBuzzer(checked as boolean)}
                                className="mt-0.5"
                            />
                            <div>
                                <label htmlFor="buzzer" className="text-sm font-semibold text-amber-900 cursor-pointer">
                                    Activate Buzzer Alarm on All Devices
                                </label>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Triggers alarms even if the app is closed or in background.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdminAlert(false)}>Cancel</Button>
                        <Button
                            onClick={createAdminSOS}
                            disabled={isSubmitting || !adminMessage.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? "Sending..." : "Send Alert to All Residents"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Cards */}
            <div className="space-y-3">
                {sosAlerts.length === 0 ? (
                    <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-green-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">All Clear</p>
                        <p className="text-xs text-slate-500">No SOS alerts at this time.</p>
                    </div>
                ) : (
                    sosAlerts.map((alert) => {
                        const typeCfg = TYPE_CONFIG[alert.emergency_type] || TYPE_CONFIG.general;
                        const statusCfg = STATUS_CONFIG[alert.status] || STATUS_CONFIG.RESOLVED;
                        const TypeIcon = typeCfg.icon;
                        const isActive = alert.status === "ACTIVE";
                        const isResponding = alert.status === "RESPONDING";

                        return (
                            <div
                                key={alert.id}
                                className={`bg-white shadow-sm border-slate-100 rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
                                    isActive ? 'border-red-400 shadow-sm shadow-red-100' : 'border-slate-200'
                                }`}
                            >
                                {isActive && (
                                    <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                                )}
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-2xl ${typeCfg.bg} flex items-center justify-center flex-shrink-0`}>
                                                <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-slate-900">
                                                        {alert.user_name || "Unknown"} - {typeCfg.label}
                                                    </p>
                                                    {alert.trigger_buzzer && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                            <Bell className="w-2.5 h-2.5" /> BUZZER
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Flat {alert.flat}{alert.block ? ` آ· Block ${alert.block}` : ""} آ·{" "}
                                                    {new Date(alert.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusCfg.bg} ${statusCfg.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    {alert.message && (
                                        <p className="mt-3 text-sm text-slate-700 bg-white rounded-lg px-3 py-2.5">{alert.message}</p>
                                    )}

                                    {alert.location_lat && alert.location_lng && (
                                        <a
                                            href={`https://maps.google.com/?q=${alert.location_lat},${alert.location_lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-emerald-800 font-medium"
                                        >
                                            <MapPin className="w-3.5 h-3.5" /> View on Maps
                                        </a>
                                    )}

                                    {(isActive || isResponding) && (
                                        <div className="mt-4 flex gap-2">
                                            {isActive && (
                                                <Button
                                                    size="sm"
                                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                                    onClick={() => respondToSOS(alert.id)}
                                                >
                                                    Respond
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-green-300 text-green-700 hover:bg-green-50"
                                                onClick={() => resolveSOS(alert.id)}
                                            >
                                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                Mark Resolved
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
