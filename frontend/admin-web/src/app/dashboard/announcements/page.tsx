"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Megaphone, Calendar, Bell } from "lucide-react";
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

export default function AnnouncementsPage() {
    const [list, setList] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({ title: "", message: "", type: "general" });

    const fetchList = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/announcements');
            setList(res.data);
        } catch (err) {
            console.error("Failed to fetch", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await api.post('/announcements', form);
            setIsDialogOpen(false);
            setForm({ title: "", message: "", type: "general" });
            fetchList();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to post");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this announcement?")) return;
        try {
            await api.delete(`/announcements/${id}`);
            fetchList();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
                    <p className="text-muted-foreground">Broadcast notices, events, and alerts to residents.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Announcement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General Notice</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                        <SelectItem value="emergency">Emergency</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="min-h-[100px]" required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Posting..." : "Post Announcement"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-10">Loading...</div>
                ) : list.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">No announcements yet.</div>
                ) : (
                    list.map((item) => (
                        <Card key={item.id} className="flex flex-col border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="uppercase text-[10px]">{item.type}</Badge>
                                    <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                                <CardTitle className="text-lg mt-2">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 text-sm text-slate-600 whitespace-pre-wrap">
                                {item.message}
                            </CardContent>
                            <CardFooter className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                                <span>Posted by {item.admin_name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(item.id)}>
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
