"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react"; // ✅ removed unused icons
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Announcement {
    id: number;
    title: string;
    message: string;
    type: string;
    created_at: string;
    admin_name: string;
}

// ✅ Match backend VALID_TYPES exactly
const TYPES = [
    { value: "general", label: "General" },
    { value: "urgent", label: "Urgent" },
    { value: "maintenance", label: "Maintenance" },
    { value: "event", label: "Event" },
];

// ✅ Color coded by type
const TYPE_BORDER: Record<string, string> = {
    urgent: 'border-l-red-500',
    maintenance: 'border-l-yellow-500',
    event: 'border-l-blue-500',
    general: 'border-l-slate-300',
};

const TYPE_BADGE: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    maintenance: 'bg-yellow-100 text-yellow-700',
    event: 'bg-blue-100 text-blue-700',
    general: 'bg-slate-100 text-slate-600',
};

export default function AnnouncementsPage() {
    const [list, setList] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const [form, setForm] = useState({ title: "", message: "", type: "general" });

    const fetchList = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            // ✅ Paginate
            const res = await api.get('/announcements?limit=20');
            setList(res.data);
        } catch {
            setFetchError("Failed to load announcements. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchList(); }, []);

    const resetForm = () => {
        setForm({ title: "", message: "", type: "general" });
        setFormError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        // ✅ Length validation
        if (form.title.length > 150) {
            setFormError("Title must be under 150 characters");
            return;
        }
        if (form.message.length > 2000) {
            setFormError("Message must be under 2000 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/announcements', form);
            setIsDialogOpen(false);
            resetForm();
            fetchList();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to post announcement");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this announcement? Residents will no longer see it.")) return;
        setDeleteError("");
        try {
            await api.delete(`/announcements/${id}`);
            fetchList();
        } catch {
            // ✅ Inline error instead of alert()
            setDeleteError("Failed to delete. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Announcements</h2>
                    <p className="text-sm text-muted-foreground">Broadcast notices, events, and alerts to all residents.</p>
                </div>

                {/* ✅ Reset form on close */}
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" /> New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Announcement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Water supply interruption tomorrow"
                                    maxLength={150}
                                    required
                                />
                                {form.title.length > 120 && (
                                    <p className="text-xs text-muted-foreground text-right">{form.title.length}/150</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {/* ✅ Matches backend VALID_TYPES */}
                                        {TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="min-h-[100px]"
                                    placeholder="Write your announcement here..."
                                    maxLength={2000}
                                    required
                                />
                                {form.message.length > 1600 && (
                                    <p className="text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Posting..." : "Post Announcement"}
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

            {/* ✅ Inline delete error instead of alert() */}
            {deleteError && (
                <Alert variant="destructive">
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-10 text-sm text-muted-foreground">Loading...</div>
                ) : list.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground text-sm">
                        No announcements yet. Create one to notify residents.
                    </div>
                ) : (
                    list.map((item) => (
                        <Card key={item.id} className={`flex flex-col border-l-4 ${TYPE_BORDER[item.type] || 'border-l-slate-300'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    {/* ✅ Color coded badge per type */}
                                    <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full ${TYPE_BADGE[item.type] || 'bg-slate-100 text-slate-600'}`}>
                                        {item.type}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <CardTitle className="text-base mt-2">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                {item.message}
                            </CardContent>
                            <CardFooter className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                                <span>By {item.admin_name || 'Admin'}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleDelete(item.id)}
                                    title="Delete announcement"
                                >
                                    <Trash2 className="h-3 w-3 text-red-400" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}