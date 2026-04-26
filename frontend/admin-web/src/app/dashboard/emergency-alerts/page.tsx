"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Flame, Stethoscope, ShieldAlert, AlertOctagon, Zap } from "lucide-react";

interface EmergencyAlert {
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    created_at: string;
}

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    CRITICAL: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-400',   dot: 'bg-red-500 animate-pulse' },
    HIGH:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
    MEDIUM:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
    LOW:      { bg: 'bg-white',  text: 'text-slate-500',  border: 'border-slate-200',  dot: 'bg-zinc-400' },
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    FIRE:     { label: 'Fire',     icon: Flame,        color: 'text-red-600',    bg: 'bg-red-100' },
    MEDICAL:  { label: 'Medical',  icon: Stethoscope,  color: 'text-blue-600',   bg: 'bg-blue-100' },
    SECURITY: { label: 'Security', icon: ShieldAlert,  color: 'text-purple-600', bg: 'bg-purple-100' },
    GENERAL:  { label: 'General',  icon: AlertOctagon, color: 'text-amber-600',  bg: 'bg-amber-100' },
};

const EMPTY_FORM = { title: "", message: "", type: "GENERAL", priority: "HIGH" };

export default function EmergencyAlertsPage() {
    const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const resetForm = () => { setFormData({ ...EMPTY_FORM }); setFormError(""); };

    const fetchAlerts = async () => {
        setFetchError("");
        try {
            const res = await api.get('/emergency-alerts?limit=20');
            setAlerts(res.data);
        } catch {
            setFetchError("Failed to load emergency alerts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        if (formData.title.trim().length < 3) { setFormError("Title must be at least 3 characters"); return; }
        if (formData.message.trim().length < 5) { setFormError("Message must be at least 5 characters"); return; }
        setIsSubmitting(true);
        try {
            await api.post('/emergency-alerts', formData);
            resetForm();
            setIsDialogOpen(false);
            fetchAlerts();
        } catch (err) {
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message || "Failed to create alert");
            else setFormError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const criticalCount = alerts.filter(a => a.priority === 'CRITICAL').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
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
                            <Zap className="w-4 h-4 text-red-600" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Emergency Alerts</h1>
                    </div>
                    <p className="text-sm text-zinc-500">Broadcast critical alerts to all residents instantly.</p>
                </div>
                <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {criticalCount} Critical
                        </div>
                    )}
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700 text-slate-900 gap-1.5 h-9">
                                <Plus className="h-4 w-4" /> Create Alert
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Emergency Alert</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                                {formError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{formError}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-1.5">
                                    <Label htmlFor="alert-title">Title</Label>
                                    <Input
                                        id="alert-title"
                                        placeholder="e.g. Fire on 3rd floor — evacuate immediately"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        maxLength={200}
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="alert-message">Message</Label>
                                    <Textarea
                                        id="alert-message"
                                        placeholder="Provide details about the emergency..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        rows={4}
                                        maxLength={1000}
                                        className="resize-none border-slate-200"
                                    />
                                    {formData.message.length > 800 && (
                                        <p className="text-xs text-slate-500 text-right">{formData.message.length}/1000</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Type</Label>
                                        <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                            <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GENERAL">General</SelectItem>
                                                <SelectItem value="FIRE">Fire</SelectItem>
                                                <SelectItem value="MEDICAL">Medical</SelectItem>
                                                <SelectItem value="SECURITY">Security</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Priority</Label>
                                        <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                                            <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">Low</SelectItem>
                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                <SelectItem value="HIGH">High</SelectItem>
                                                <SelectItem value="CRITICAL">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                                    {isSubmitting ? "Sending..." : "Send Emergency Alert"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No emergency alerts</p>
                        <p className="text-xs text-slate-500">All quiet — no alerts have been sent.</p>
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const priCfg = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.LOW;
                        const typeCfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.GENERAL;
                        const TypeIcon = typeCfg.icon;
                        return (
                            <div
                                key={alert.id}
                                className={`bg-white shadow-sm border-slate-100 rounded-2xl border-l-4 border border-slate-200 ${priCfg.border} overflow-hidden hover:shadow-sm transition-shadow`}
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-2xl ${typeCfg.bg} flex items-center justify-center flex-shrink-0`}>
                                                <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{alert.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(alert.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${priCfg.bg} ${priCfg.text} flex items-center gap-1.5`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />
                                                {alert.priority}
                                            </span>
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                                                {typeCfg.label}
                                            </span>
                                        </div>
                                    </div>
                                    {alert.message && (
                                        <p className="mt-3 text-sm text-slate-500 bg-white rounded-lg px-3 py-2.5 leading-relaxed">
                                            {alert.message}
                                        </p>
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
