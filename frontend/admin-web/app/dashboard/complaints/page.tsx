"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface Complaint {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'resolved' | 'rejected';
    created_at: string;
    name: string; // user name
    phone: string;
    admin_comment: string;
}

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [statusUpdate, setStatusUpdate] = useState<{ status: string, comment: string }>({ status: '', comment: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchComplaints = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/complaints');
            setComplaints(res.data);
        } catch (err) {
            console.error("Failed to fetch complaints", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleUpdateStatus = async () => {
        if (!selectedComplaint) return;
        setIsUpdating(true);
        try {
            await api.put(`/complaints/${selectedComplaint.id}`, {
                status: statusUpdate.status,
                admin_comment: statusUpdate.comment
            });
            fetchComplaints();
            setSelectedComplaint(null);
        } catch (err) {
            console.error("Failed to update complaint", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const openUpdateDialog = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setStatusUpdate({
            status: complaint.status,
            comment: complaint.admin_comment || ""
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Complaints by Residents</h2>
                    <p className="text-muted-foreground">Track and resolve resident issues.</p>
                </div>
            </div>

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
                                <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : complaints.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No complaints found.</TableCell>
                            </TableRow>
                        ) : (
                            complaints.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell>
                                        <div className={`flex items-center gap-2 capitalize
                                            ${c.status === 'resolved' ? 'text-green-600' :
                                                c.status === 'rejected' ? 'text-red-600' :
                                                    'text-amber-600'}`}>
                                            {c.status === 'resolved' && <CheckCircle className="h-4 w-4" />}
                                            {c.status === 'rejected' && <AlertCircle className="h-4 w-4" />}
                                            {c.status === 'pending' && <Clock className="h-4 w-4" />}
                                            {c.status}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{c.title}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{c.name}</span>
                                            <span className="text-xs text-muted-foreground">{c.phone}</span>
                                        </div>
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Complaint Status</DialogTitle>
                        <DialogDescription>
                            Review the issue and update its status.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedComplaint && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                                <div className="font-semibold">{selectedComplaint.title}</div>
                                <p>{selectedComplaint.description}</p>
                                <div className="text-xs text-muted-foreground mt-2">
                                    Reported by {selectedComplaint.name} ({selectedComplaint.phone})
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    value={statusUpdate.status}
                                    onValueChange={(val) => setStatusUpdate({ ...statusUpdate, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Comment</label>
                                <Textarea
                                    value={statusUpdate.comment}
                                    onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                                    placeholder="Add a note about the resolution..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedComplaint(null)}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                            {isUpdating ? "Updating..." : "Update Status"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
