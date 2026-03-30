"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, XCircle, Search } from "lucide-react";

interface Complaint {
    id: number;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    created_at: string;
    name: string;
    phone: string;
    admin_comment: string;
}

const STATUS_CONFIG = {
    OPEN: { icon: Clock, color: 'text-amber-600', label: 'Open' },
    IN_PROGRESS: { icon: AlertCircle, color: 'text-blue-600', label: 'In Progress' },
    RESOLVED: { icon: CheckCircle, color: 'text-green-600', label: 'Resolved' },
    CLOSED: { icon: XCircle, color: 'text-gray-500', label: 'Closed' },
} as const;

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [statusUpdate, setStatusUpdate] = useState({ status: '', comment: '' });
    const [updateError, setUpdateError] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const fetchComplaints = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get('/complaints?limit=50');
            setComplaints(res.data);
        } catch {
            setFetchError("Failed to load complaints. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchComplaints(); }, []);

    const filtered = complaints.filter(c => {
        const matchesStatus = filterStatus === "all" || c.status === filterStatus;
        const matchesSearch = !search ||
            c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.name?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const openUpdateDialog = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setUpdateError("");
        setStatusUpdate({ status: complaint.status, comment: complaint.admin_comment || "" });
    };

    const handleUpdateStatus = async () => {
        if (!selectedComplaint) return;

        // ✅ Validate status is set
        if (!statusUpdate.status) {
            setUpdateError("Please select a status");
            return;
        }

        setIsUpdating(true);
        setUpdateError("");
        try {
            await api.put(`/complaints/${selectedComplaint.id}`, {
                status: statusUpdate.status,
                admin_comment: statusUpdate.comment || undefined,
            });
            fetchComplaints();
            setSelectedComplaint(null);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setUpdateError(err.response?.data?.message || "Failed to update complaint");
            } else {
                setUpdateError("An unexpected error occurred");
            }
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Complaints</h2>
                <p className="text-sm text-muted-foreground">Track and resolve resident issues.</p>
            </div>

            {/* ✅ Search + filter bar */}
            <div className="flex gap-3 items-center">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or resident..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Resident</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                    {search || filterStatus !== "all" ? "No complaints match your filters." : "No complaints found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((c) => {
                                const config = STATUS_CONFIG[c.status] || STATUS_CONFIG.OPEN;
                                const Icon = config.icon;
                                return (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            {/* ✅ Distinct icon per status */}
                                            <div className={`flex items-center gap-1.5 text-sm ${config.color}`}>
                                                <Icon className="h-4 w-4" />
                                                <span className="capitalize">{config.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{c.title}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{c.name || '—'}</div>
                                            <div className="text-xs text-muted-foreground">{c.phone}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" onClick={() => openUpdateDialog(c)}>
                                                View & Update
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {complaints.length} complaints
                </p>
            )}

            {/* Update Dialog */}
            <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Complaint</DialogTitle>
                        <DialogDescription>Review the issue and update its status.</DialogDescription>
                    </DialogHeader>

                    {selectedComplaint && (
                        <div className="space-y-4 py-2">
                            <div className="p-4 bg-muted rounded-lg text-sm space-y-1.5">
                                <div className="font-semibold">{selectedComplaint.title}</div>
                                <p className="text-muted-foreground">{selectedComplaint.description}</p>
                                <div className="text-xs text-muted-foreground pt-1">
                                    By {selectedComplaint.name} · {selectedComplaint.phone}
                                </div>
                            </div>

                            {updateError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{updateError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    value={statusUpdate.status}
                                    onValueChange={(val) => setStatusUpdate({ ...statusUpdate, status: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                        <SelectItem value="CLOSED">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Admin Comment
                                    <span className="text-muted-foreground font-normal ml-1 text-xs">(optional)</span>
                                </label>
                                <Textarea
                                    value={statusUpdate.comment}
                                    onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                                    placeholder="Add a note about the resolution..."
                                    maxLength={500}
                                    rows={3}
                                />
                                {statusUpdate.comment.length > 400 && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        {statusUpdate.comment.length}/500
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedComplaint(null)} disabled={isUpdating}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={isUpdating || !statusUpdate.status}>
                            {isUpdating ? "Updating..." : "Update Status"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}