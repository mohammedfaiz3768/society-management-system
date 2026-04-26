"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, XCircle, Search, MessageSquare } from "lucide-react";

interface Complaint {
    id: number;
    title: string;
    description: string;
    status: 'PENDING' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    created_at: string;
    name: string;
    phone: string;
    admin_comment: string;
}

const STATUS_CONFIG = {
    PENDING:     { icon: Clock,         bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500',  label: 'Pending',     border: 'border-yellow-200' },
    OPEN:        { icon: Clock,         bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Open',        border: 'border-amber-200' },
    IN_PROGRESS: { icon: AlertCircle,   bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'In Progress', border: 'border-blue-200' },
    RESOLVED:    { icon: CheckCircle,   bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500',   label: 'Resolved',    border: 'border-green-200' },
    CLOSED:      { icon: XCircle,       bg: 'bg-white',   text: 'text-zinc-500',   dot: 'bg-zinc-400',   label: 'Closed',      border: 'border-slate-200' },
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

    const openCounts = complaints.filter(c => ['PENDING', 'OPEN', 'IN_PROGRESS'].includes(c.status)).length;

    const openUpdateDialog = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setUpdateError("");
        setStatusUpdate({ status: complaint.status, comment: complaint.admin_comment || "" });
    };

    const handleUpdateStatus = async () => {
        if (!selectedComplaint) return;
        if (!statusUpdate.status) { setUpdateError("Please select a status"); return; }
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
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Complaints</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Track and resolve resident issues.</p>
                </div>
                {openCounts > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        {openCounts} open {openCounts === 1 ? 'issue' : 'issues'}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by title or resident..."
                        className="pl-9 border-slate-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 border-slate-200">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
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

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-white">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Issue</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Resident</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-4"><div className="h-6 w-20 bg-slate-50 rounded-full animate-pulse" /></td>
                                    <td className="px-5 py-4"><div className="h-4 w-40 bg-slate-50 rounded animate-pulse" /></td>
                                    <td colSpan={3} />
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-14 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <MessageSquare className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">
                                            {search || filterStatus !== "all" ? "No complaints match your filters." : "No complaints found."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((c) => {
                                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.OPEN;
                                const Icon = cfg.icon;
                                return (
                                    <tr key={c.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 max-w-[200px]">
                                            <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-slate-700 font-medium">{c.name || '-'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{c.phone}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs border-slate-200 hover:border-emerald-300 hover:text-rose-600 transition-colors"
                                                onClick={() => openUpdateDialog(c)}
                                            >
                                                View & Update
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{filtered.length}</span> of <span className="font-semibold text-slate-500">{complaints.length}</span> complaints
                </p>
            )}

            {/* Update Dialog */}
            <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Update Complaint</DialogTitle>
                        <DialogDescription>Review the issue and update its status.</DialogDescription>
                    </DialogHeader>
                    {selectedComplaint && (
                        <div className="space-y-4 py-2">
                            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                                <p className="font-semibold text-slate-900">{selectedComplaint.title}</p>
                                <p className="text-sm text-slate-500 leading-relaxed">{selectedComplaint.description}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                                    <span className="font-medium text-slate-500">{selectedComplaint.name}</span>
                                    <span>آ·</span>
                                    <span>{selectedComplaint.phone}</span>
                                </div>
                            </div>
                            {updateError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{updateError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <Select value={statusUpdate.status} onValueChange={(val) => setStatusUpdate({ ...statusUpdate, status: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                        <SelectItem value="CLOSED">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Admin Comment <span className="text-slate-500 font-normal text-xs">(optional)</span>
                                </label>
                                <Textarea
                                    value={statusUpdate.comment}
                                    onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                                    placeholder="Add a resolution note..."
                                    maxLength={500}
                                    rows={3}
                                    className="resize-none"
                                />
                                {statusUpdate.comment.length > 400 && (
                                    <p className="text-xs text-slate-500 text-right">{statusUpdate.comment.length}/500</p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedComplaint(null)} disabled={isUpdating}>Cancel</Button>
                        <Button onClick={handleUpdateStatus} disabled={isUpdating || !statusUpdate.status} className="bg-rose-600 hover:bg-rose-600">
                            {isUpdating ? "Updating..." : "Update Status"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
