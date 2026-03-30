"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Invitation {
    id: number;
    email: string;
    role: string;
    code: string;
    used: boolean;
    used_by_name: string | null;
    created_by_name: string | null;
    created_at: string;
    expires_at: string | null;
}

export default function InvitationsPage() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        role: "resident",
    });

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            const res = await api.get('/invitations/list');
            setInvitations(res.data);
        } catch {
            setError("Failed to load invitations");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // ✅ Client-side validation
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/invitations/send', formData);
            setShowForm(false);
            setFormData({ email: "", role: "resident" });
            fetchInvitations();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to send invitation");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const revokeInvitation = async (id: number) => {
        if (!confirm("Revoke this invitation?")) return;
        try {
            await api.post(`/invitations/revoke/${id}`);
            fetchInvitations();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to revoke invitation");
            } else {
                setError("An unexpected error occurred");
            }
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Invitations</h1>
                    <p className="text-muted-foreground mt-1">Send invitations to new residents or staff</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Send Invitation"}
                </Button>
            </div>

            {/* ✅ Error display */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Send Invitation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="inv-email">Email Address *</Label>
                                <Input
                                    id="inv-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="resident@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="inv-role">Role *</Label>
                                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* ✅ Admin removed — use proper admin creation flow */}
                                        <SelectItem value="resident">Resident</SelectItem>
                                        <SelectItem value="guard">Guard</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : "Send Invitation"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {invitations.map((inv) => (
                    <Card key={inv.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{inv.email}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Sent {new Date(inv.created_at).toLocaleDateString()} by {inv.created_by_name || "Admin"}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline">{inv.role}</Badge>
                                    <Badge variant={inv.used ? "secondary" : "default"}>
                                        {inv.used ? "Used" : "Pending"}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {inv.code && (
                                <p className="text-sm font-mono bg-muted p-2 rounded">
                                    Code: {inv.code}
                                </p>
                            )}
                            {inv.expires_at && !inv.used && (
                                <p className="text-sm text-muted-foreground">
                                    Expires: {new Date(inv.expires_at).toLocaleDateString()}
                                </p>
                            )}
                            {inv.used_by_name && (
                                <p className="text-sm text-green-600">
                                    Used by: {inv.used_by_name}
                                </p>
                            )}
                            {!inv.used && (
                                <Button onClick={() => revokeInvitation(inv.id)} variant="destructive" size="sm">
                                    Revoke
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {invitations.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No invitations sent yet. Click &quot;+ Send Invitation&quot; to invite new members.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
