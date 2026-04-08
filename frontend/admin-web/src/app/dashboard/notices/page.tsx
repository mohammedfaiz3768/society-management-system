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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Pin, Trash2 } from "lucide-react";
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
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        pinned: "false",
        audience: "all",
    });

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
            await api.post('/notices', {
                ...formData,
                pinned: formData.pinned === "true",
            });
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Notices</h2>
                    <p className="text-muted-foreground">Post updates for residents.</p>
                </div>
                {user?.role === "admin" && (
                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Post Notice
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                                <DialogTitle>Create New Notice</DialogTitle>
                                <DialogDescription>
                                    Share important information with the community.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateNotice} className="space-y-4 py-4">
                                {formError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{formError}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="e.g. Lift Maintenance Scheduled"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="body">Content</Label>
                                    <Textarea
                                        id="content"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                        placeholder="Enter the details..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Audience</Label>
                                        <Select
                                            value={formData.audience}
                                            onValueChange={(val) =>
                                                setFormData({ ...formData, audience: val })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select audience" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Residents</SelectItem>
                                                <SelectItem value="owners">Owners Only</SelectItem>
                                                <SelectItem value="tenants">Tenants Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pin to Top?</Label>
                                        <Select
                                            value={formData.pinned}
                                            onValueChange={(val) =>
                                                setFormData({ ...formData, pinned: val })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="false">No</SelectItem>
                                                <SelectItem value="true">Yes, Pin it</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Posting..." : "Post Notice"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {actionError && (
                <Alert variant="destructive">
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex justify-center items-center py-16">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notices.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No notices found.
                    </div>
                ) : (
                    notices.map((notice) => (
                        <div
                            key={notice.id}
                            className={`p-4 rounded-lg border bg-card text-card-foreground shadow-sm ${
                                notice.pinned ? "border-l-4 border-l-primary" : ""
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                                    {notice.pinned && <Pin className="h-3 w-3 fill-current" />}
                                    {notice.title}
                                </h3>
                                {user?.role === "admin" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(notice.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap line-clamp-3">
                                {notice.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                                <span className="capitalize">{notice.audience}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!isLoading && notices.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {notices.length} notice{notices.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
