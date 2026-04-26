"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail, CheckCircle, Clock, XCircle } from "lucide-react";

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

const ROLE_CONFIG: Record<string, { bg: string; text: string }> = {
    admin:    { bg: 'bg-purple-50', text: 'text-purple-700' },
    guard:    { bg: 'bg-orange-50', text: 'text-orange-700' },
    staff:    { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    resident: { bg: 'bg-blue-50',   text: 'text-blue-700' },
};

export default function InvitationsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ email: "", role: "resident" });

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
            setInvitations(res.data.invitations ?? res.data);
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to load invitations");
            else setFetchError("Failed to load invitations");
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
        if (!emailRegex.test(formData.email)) { setFormError("Please enter a valid email address"); return; }
        setIsSubmitting(true);
        try {
            await api.post('/invitations', formData);
            setIsDialogOpen(false);
            resetForm();
            fetchInvitations();
        } catch (err) {
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message || "Failed to send invitation");
            else setFormError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const revokeInvitation = async (id: number) => {
        if (!confirm("Revoke this invitation?")) return;
        try {
            await api.delete(`/invitations/${id}`);
            fetchInvitations();
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to revoke invitation");
            else setFetchError("Failed to revoke invitation");
        }
    };

    const pending = invitations.filter(i => !i.used);
    const used = invitations.filter(i => i.used);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Invitations</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Send invitations to new residents or staff members.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Send Invitation
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Send Invitation</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-email">Email Address</Label>
                                <Input
                                    id="inv-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="resident@example.com"
                                    required
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-role">Role</Label>
                                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="resident">Resident</SelectItem>
                                        <SelectItem value="guard">Guard</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
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

            {/* Chips */}
            {!isLoading && (
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {pending.length} Pending
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {used.length} Used
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 animate-pulse">
                            <div className="flex justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-slate-50 rounded" />
                                    <div className="h-3 w-32 bg-slate-50 rounded" />
                                </div>
                                <div className="h-6 w-20 bg-slate-50 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : invitations.length === 0 ? (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">No invitations sent yet</p>
                    <p className="text-xs text-slate-500">Click &quot;Send Invitation&quot; to invite new members.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {invitations.map((inv) => {
                        const roleCfg = ROLE_CONFIG[inv.role] || ROLE_CONFIG.resident;
                        const isExpired = inv.expires_at && !inv.used && new Date(inv.expires_at) < new Date();
                        return (
                            <div key={inv.id} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4.5 h-4.5 text-zinc-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{inv.email}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Sent {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {inv.created_by_name && ` by ${inv.created_by_name}`}
                                            </p>
                                            {inv.used_by_name && (
                                                <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Used by {inv.used_by_name}
                                                </p>
                                            )}
                                            {isExpired && (
                                                <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> Expired
                                                </p>
                                            )}
                                            {inv.code && !inv.used && (
                                                <p className="text-xs font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded mt-1.5 inline-block">
                                                    {inv.code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleCfg.bg} ${roleCfg.text}`}>
                                            {inv.role}
                                        </span>
                                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${inv.used ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {inv.used ? 'Used' : 'Pending'}
                                        </span>
                                        {!inv.used && (
                                            <Button
                                                onClick={() => revokeInvitation(inv.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && invitations.length > 0 && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{invitations.length}</span> invitation{invitations.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
