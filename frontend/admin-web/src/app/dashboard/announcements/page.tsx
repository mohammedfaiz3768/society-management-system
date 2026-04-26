"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Megaphone, Zap, Wrench, Calendar, Info } from "lucide-react";

interface Announcement {
    id: number;
    title: string;
    message: string;
    type: string;
    created_at: string;
    admin_name: string;
}

const TYPES = [
    { value: "general", label: "General" },
    { value: "urgent", label: "Urgent" },
    { value: "maintenance", label: "Maintenance" },
    { value: "event", label: "Event" },
];

const TYPE_CONFIG: Record<string, { bg: string; border: string; badge: string; text: string; icon: React.ElementType; dot: string }> = {
    urgent:      { bg: 'bg-red-50',    border: 'border-l-red-500',    badge: 'bg-red-100 text-red-700',     text: 'text-red-600',    icon: Zap,      dot: 'bg-red-500' },
    maintenance: { bg: 'bg-amber-50',  border: 'border-l-amber-500',  badge: 'bg-amber-100 text-amber-700', text: 'text-amber-600',  icon: Wrench,   dot: 'bg-amber-500' },
    event:       { bg: 'bg-blue-50',   border: 'border-l-blue-500',   badge: 'bg-blue-100 text-blue-700',   text: 'text-blue-600',   icon: Calendar, dot: 'bg-blue-500' },
    general:     { bg: 'bg-white',  border: 'border-l-zinc-400',  badge: 'bg-slate-50 text-slate-500', text: 'text-zinc-500',  icon: Info,     dot: 'bg-zinc-400' },
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
        if (form.title.length > 150) { setFormError("Title must be under 150 characters"); return; }
        if (form.message.length > 2000) { setFormError("Message must be under 2000 characters"); return; }
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
            setDeleteError("Failed to delete. Please try again.");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Broadcast notices, events, and alerts to all residents.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Create Announcement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <Label>Title</Label>
                                <Input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Water supply interruption tomorrow"
                                    maxLength={150}
                                    required
                                />
                                {form.title.length > 120 && (
                                    <p className="text-xs text-slate-500 text-right">{form.title.length}/150</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Message</Label>
                                <Textarea
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="min-h-[120px] resize-none"
                                    placeholder="Write your announcement here..."
                                    maxLength={2000}
                                    required
                                />
                                {form.message.length > 1600 && (
                                    <p className="text-xs text-slate-500 text-right">{form.message.length}/2000</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
                                {isSubmitting ? "Posting..." : "Post Announcement"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {(fetchError || deleteError) && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError || deleteError}</AlertDescription>
                </Alert>
            )}

            {/* Cards grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                            <div className="flex justify-between">
                                <div className="h-5 w-16 bg-slate-50 rounded-full" />
                                <div className="h-4 w-20 bg-slate-50 rounded" />
                            </div>
                            <div className="h-5 w-3/4 bg-slate-50 rounded" />
                            <div className="space-y-1.5">
                                <div className="h-3 bg-slate-50 rounded w-full" />
                                <div className="h-3 bg-slate-50 rounded w-2/3" />
                            </div>
                        </div>
                    ))
                ) : list.length === 0 ? (
                    <div className="col-span-full py-16 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                            <Megaphone className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">No announcements yet</p>
                        <p className="text-xs text-slate-500">Create one to notify all residents.</p>
                    </div>
                ) : (
                    list.map((item) => {
                        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
                        const Icon = cfg.icon;
                        return (
                            <div
                                key={item.id}
                                className={`bg-white shadow-sm border-slate-100 rounded-2xl border-l-4 border border-slate-200 ${cfg.border} flex flex-col overflow-hidden hover:shadow-md transition-shadow`}
                            >
                                <div className="p-4 flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
                                            <Icon className="w-3 h-3" />
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-slate-500 flex-shrink-0">
                                            {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-wrap">{item.message}</p>
                                </div>
                                <div className="px-4 py-2.5 border-t border-slate-100 bg-white flex items-center justify-between">
                                    <span className="text-xs text-slate-500">By {item.admin_name || 'Admin'}</span>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
