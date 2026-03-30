"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface EmergencyAlert {
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    created_at: string;
}

// ✅ All four priorities visually distinct
const PRIORITY_STYLES: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-slate-100 text-slate-600',
};

const TYPE_STYLES: Record<string, string> = {
    FIRE: 'bg-red-50 text-red-600',
    MEDICAL: 'bg-blue-50 text-blue-600',
    SECURITY: 'bg-purple-50 text-purple-600',
    GENERAL: 'bg-slate-50 text-slate-600',
};

const EMPTY_FORM = {
    title: "", message: "", type: "GENERAL", priority: "HIGH",
};

export default function EmergencyAlertsPage() {
    const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(""); // ✅ separate from form error
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const resetForm = () => {
        setFormData({ ...EMPTY_FORM });
        setFormError("");
    };

    const fetchAlerts = async () => {
        setFetchError("");
        try {
            // ✅ Correct endpoint — GET /emergency
            const res = await api.get('/emergency?limit=20');
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

        if (formData.title.trim().length < 3) {
            setFormError("Title must be at least 3 characters");
            return;
        }
        if (formData.message.trim().length < 5) {
            setFormError("Message must be at least 5 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            // ✅ Correct endpoint — POST /emergency
            await api.post('/emergency', formData);
            resetForm();
            setIsDialogOpen(false);
            fetchAlerts();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to create alert");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ Spinner inside layout — not full page replacement
    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        // ✅ No p-6 — dashboard layout handles padding
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Emergency Alerts</h2>
                    <p className="text-sm text-muted-foreground">
                        Broadcast critical alerts to all residents instantly.
                    </p>
                </div>
                {/* ✅ Dialog instead of toggle form — consistent with other pages */}
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                            <Plus className="mr-2 h-4 w-4" /> Create Alert
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Emergency Alert</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="alert-title">Title</Label>
                                <Input
                                    id="alert-title"
                                    placeholder="e.g. Fire on 3rd floor — evacuate immediately"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    maxLength={200}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alert-message">Message</Label>
                                <Textarea
                                    id="alert-message"
                                    placeholder="Provide details about the emergency..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={4}
                                    maxLength={1000}
                                />
                                {formData.message.length > 800 && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        {formData.message.length}/1000
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GENERAL">General</SelectItem>
                                            <SelectItem value="FIRE">Fire</SelectItem>
                                            <SelectItem value="MEDICAL">Medical</SelectItem>
                                            <SelectItem value="SECURITY">Security</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(val) => setFormData({ ...formData, priority: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="CRITICAL">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                variant="destructive"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Sending..." : "Send Emergency Alert"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ✅ Fetch error separate from form error */}
            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4">
                {alerts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-sm text-muted-foreground">
                            No emergency alerts sent yet.
                        </CardContent>
                    </Card>
                ) : (
                    alerts.map((alert) => (
                        <Card
                            key={alert.id}
                            className={alert.priority === "CRITICAL" ? "border-red-400 border-2" : ""}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base">{alert.title}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(alert.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {/* ✅ All four priorities distinct */}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.LOW}`}>
                                            {alert.priority}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[alert.type] || TYPE_STYLES.GENERAL}`}>
                                            {alert.type}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}