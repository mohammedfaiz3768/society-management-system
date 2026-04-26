"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pin, Trash2, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Notice {
    id: number;
    title: string;
    content: string;
    created_at: string;
    pinned: boolean;
    audience: string;
    created_by_name: string;
}

const LIMIT = 100;

const AUDIENCE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    all:     { label: 'All Residents', bg: 'bg-rose-50', text: 'text-rose-600' },
    owners:  { label: 'Owners',        bg: 'bg-purple-50', text: 'text-purple-700' },
    tenants: { label: 'Tenants',       bg: 'bg-rose-50',   text: 'text-rose-600' },
};

export default function NoticesPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ title: "", content: "", pinned: "false", audience: "all" });

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const resetForm = () => {
        setFormData({ title: "", content: "", pinned: "false", audience: "all" });
        setFormError("");
    };

    const fetchNotices = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get(`/notices?limit=${LIMIT}`);
            setNotices(res.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to load notices");
            } else {
                setFetchError("Failed to load notices");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotices();
    }, [user]);

    const handleCreateNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setIsSubmitting(true);
        try {
            await api.post('/notices', { ...formData, pinned: formData.pinned === "true" });
            setIsDialogOpen(false);
            resetForm();
            fetchNotices();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to create notice");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this notice?")) return;
        setActionError("");
        try {
            await api.delete(`/notices/${id}`);
            fetchNotices();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setActionError(err.response?.data?.message || "Failed to delete notice");
            } else {
                setActionError("Failed to delete notice");
            }
        }
    };

    const pinned = notices.filter(n => n.pinned);
    const unpinned = notices.filter(n => !n.pinned);
    const sorted = [...pinned, ...unpinned];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Notices</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Post important updates for your community.</p>
                </div>
                {user?.role === "admin" && (
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                                <Plus className="h-4 w-4" /> Post Notice
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>Create New Notice</DialogTitle>
                                <DialogDescription>Share important information with the community.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateNotice} className="space-y-4 py-2">
                                {formError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{formError}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="e.g. Lift Maintenance Scheduled"
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="content">Content</Label>
                                    <Textarea
                                        id="content"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                        placeholder="Enter the details..."
                                        className="min-h-[120px] resize-none border-slate-200"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Audience</Label>
                                        <Select value={formData.audience} onValueChange={(val) => setFormData({ ...formData, audience: val })}>
                                            <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Residents</SelectItem>
                                                <SelectItem value="owners">Owners Only</SelectItem>
                                                <SelectItem value="tenants">Tenants Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Pin to Top?</Label>
                                        <Select value={formData.pinned} onValueChange={(val) => setFormData({ ...formData, pinned: val })}>
                                            <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="false">No</SelectItem>
                                                <SelectItem value="true">Yes, Pin it</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-600">
                                        {isSubmitting ? "Posting..." : "Post Notice"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {(fetchError || actionError) && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError || actionError}</AlertDescription>
                </Alert>
            )}

            {/* Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                            <div className="h-4 w-3/4 bg-slate-50 rounded" />
                            <div className="space-y-1.5">
                                <div className="h-3 bg-slate-50 rounded w-full" />
                                <div className="h-3 bg-slate-50 rounded w-2/3" />
                            </div>
                        </div>
                    ))
                ) : sorted.length === 0 ? (
                    <div className="col-span-full py-16 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">No notices found</p>
                        <p className="text-xs text-slate-500">Post one to keep residents informed.</p>
                    </div>
                ) : (
                    sorted.map((notice) => {
                        const audienceCfg = AUDIENCE_CONFIG[notice.audience] || AUDIENCE_CONFIG.all;
                        return (
                            <div
                                key={notice.id}
                                className={`bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow ${notice.pinned ? 'border-l-4 border-l-rose-600' : ''}`}
                            >
                                <div className="p-4 flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-2.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {notice.pinned && (
                                                <Pin className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 fill-rose-600" />
                                            )}
                                            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{notice.title}</h3>
                                        </div>
                                        {user?.role === "admin" && (
                                            <button
                                                onClick={() => handleDelete(notice.id)}
                                                className="p-1.5 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                                        {notice.content}
                                    </p>
                                </div>
                                <div className="px-4 py-2.5 border-t border-slate-100 bg-white flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${audienceCfg.bg} ${audienceCfg.text}`}>
                                        {audienceCfg.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {!isLoading && notices.length > 0 && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{notices.length}</span> notice{notices.length !== 1 ? "s" : ""}
                    {pinned.length > 0 && <span className="ml-1">آ· {pinned.length} pinned</span>}
                </p>
            )}
        </div>
    );
}
