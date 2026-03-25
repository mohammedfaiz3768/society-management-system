"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/apiUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function InvitationsPage() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        role: "resident",
    });

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(buildApiUrl("invitations/list"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(buildApiUrl("invitations/send"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ email: "", role: "resident" });
                fetchInvitations();
                alert("Invitation sent successfully!");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const revokeInvitation = async (id: number) => {
        if (!confirm("Revoke this invitation?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch(buildApiUrl(`invitations/revoke/${id}`), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchInvitations();
        } catch (error) {
            console.error("Error:", error);
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

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Send Invitation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Email Address *</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="resident@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Role *</label>
                                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="resident">Resident</SelectItem>
                                        <SelectItem value="guard">Guard</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">Send Invitation</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {invitations.map((inv: any) => (
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
                            No invitations sent yet. Click "+ Send Invitation" to invite new members.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
