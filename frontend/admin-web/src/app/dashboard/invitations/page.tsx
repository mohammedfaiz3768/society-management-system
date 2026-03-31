"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

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

const LIMIT = 100;

export default function InvitationsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        role: "resident",
    });

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const resetForm = () => {
        setFormData({ email: "", role: "resident" });
        setFormError("");
    };

    const fetchInvitations = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get(`/invitations?limit=${LIMIT}`);
            setInvitations(res.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to load invitations");
            } else {
                setFetchError("Failed to load invitations");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchInvitations();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!emailRegex.test(formData.email)) {
            setFormError("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/invitations', formData);
            setIsDialogOpen(false);
            resetForm();
            fetchInvitations();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to send invitation");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const revokeInvitation = async (id: number) => {
        if (!confirm("Revoke this invitation?")) return;
        try {
            await api.delete(`/invitations/${id}/revoke`);
            fetchInvitations();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to revoke invitation");
            } else {
                setFetchError("Failed to revoke invitation");
            }
        }
    };

    const roleBadgeClass = (role: string) => {
        switch (role) {
            case "admin": return "bg-purple-100 text-purple-800 hover:bg-purple-100";
            case "guard": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            case "staff": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            default: return "bg-gray-100 text-gray-800 hover:bg-gray-100"; // resident
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Invitations</h2>
                    <p className="text-muted-foreground mt-1">Send invitations to new residents or staff</p>
                </div>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Send Invitation
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Send Invitation</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
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
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                                >
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
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : "Send Invitation"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : invitations.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                        No invitations sent yet. Click &quot;Send Invitation&quot; to invite new members.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {invitations.map((inv) => (
                        <Card key={inv.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{inv.email}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Sent {new Date(inv.created_at).toLocaleDateString()} by{" "}
                                            {inv.created_by_name || "Admin"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className={roleBadgeClass(inv.role)}>{inv.role}</Badge>
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
                                    <p className="text-sm text-green-600">Used by: {inv.used_by_name}</p>
                                )}
                                {!inv.used && (
                                    <Button
                                        onClick={() => revokeInvitation(inv.id)}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        Revoke
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && invitations.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {invitations.length} invitation{invitations.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
