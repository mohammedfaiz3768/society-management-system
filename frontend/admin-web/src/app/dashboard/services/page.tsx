"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, RefreshCw, Wrench, CheckCircle, Clock, Loader } from "lucide-react";

interface ServiceRequest {
    id: number;
    category: string;
    priority: string;
    description: string | null;
    status: string;
    flat_number: string | null;
    user_name: string;
    user_phone: string | null;
    staff_name: string | null;
    assigned_to: number | null;
    created_at: string;
    updated_at: string;
}

interface StaffMember { id: number; name: string; role: string; }

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    pending:     { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500', label: 'Pending' },
    in_progress: { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',   label: 'In Progress' },
    completed:   { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500',  label: 'Completed' },
    cancelled:   { bg: 'bg-white',   text: 'text-zinc-500',   dot: 'bg-zinc-400',  label: 'Cancelled' },
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
    low:    { bg: 'bg-slate-50', text: 'text-slate-500' },
    medium: { bg: 'bg-orange-50', text: 'text-orange-700' },
    high:   { bg: 'bg-red-50',    text: 'text-red-700' },
    urgent: { bg: 'bg-red-600',   text: 'text-slate-900' },
};

export default function ServicesPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const params: Record<string, string> = { limit: "100" };
            if (statusFilter !== "all") params.status = statusFilter;
            const [reqRes, staffRes] = await Promise.all([
                api.get("/services", { params }),
                api.get("/staff?limit=100"),
            ]);
            setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
            setStaff(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data?.staff ?? []);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to load service requests");
            else setError("Failed to load service requests");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await api.put(`/services/${id}/status`, { status });
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to update status");
        }
    };

    const handleAssignSubmit = async () => {
        if (!selectedRequest || !selectedStaffId) { setFormError("Please select a staff member"); return; }
        setIsSubmitting(true);
        setFormError("");
        try {
            await api.post("/services/assign", { request_id: selectedRequest.id, staff_id: parseInt(selectedStaffId) });
            setRequests(prev => prev.map(r =>
                r.id === selectedRequest.id
                    ? { ...r, assigned_to: parseInt(selectedStaffId), staff_name: staff.find(s => s.id === parseInt(selectedStaffId))?.name ?? null, status: "in_progress" }
                    : r
            ));
            setAssignDialogOpen(false);
            setSelectedRequest(null);
            setSelectedStaffId("");
        } catch (err) {
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message || "Failed to assign staff");
            else setFormError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = requests.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.user_name?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q) || r.flat_number?.includes(q) || r.description?.toLowerCase().includes(q);
    });

    const pending = requests.filter(r => r.status === "pending").length;
    const inProgress = requests.filter(r => r.status === "in_progress").length;
    const completed = requests.filter(r => r.status === "completed").length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Service Requests</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage maintenance and service requests from residents.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} className="border-slate-200 gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats chips */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-200 bg-yellow-50 text-yellow-700 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> {pending} Pending
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
                    <Loader className="w-3.5 h-3.5" /> {inProgress} In Progress
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> {completed} Completed
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                    <Input placeholder="Search resident, category, flat..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 border-slate-200" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Request cards */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 animate-pulse">
                            <div className="flex gap-3">
                                <div className="h-5 w-16 bg-slate-50 rounded-full" />
                                <div className="h-5 w-20 bg-slate-50 rounded-full" />
                            </div>
                            <div className="mt-3 h-4 w-3/4 bg-slate-50 rounded" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-500">
                        {search || statusFilter !== "all" ? "No requests match your filters." : "No service requests yet."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(req => {
                        const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                        const priCfg = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.medium;
                        return (
                            <div key={req.id} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-2 mb-2.5">
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} flex items-center gap-1.5`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                {statusCfg.label}
                                            </span>
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${priCfg.bg} ${priCfg.text}`}>
                                                {req.priority}
                                            </span>
                                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 capitalize">
                                                {req.category}
                                            </span>
                                        </div>
                                        {req.description && (
                                            <p className="text-sm text-slate-700 mb-2.5">{req.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <span>From: <span className="font-semibold text-slate-500">{req.user_name}</span></span>
                                            {req.flat_number && <span>Flat: <span className="font-semibold text-slate-500">{req.flat_number}</span></span>}
                                            {req.staff_name && <span>Assigned: <span className="font-semibold text-blue-600">{req.staff_name}</span></span>}
                                            <span>{new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                                        {req.status === "pending" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs border-slate-200 hover:border-emerald-300 hover:text-rose-600"
                                                onClick={() => { setSelectedRequest(req); setAssignDialogOpen(true); setFormError(""); setSelectedStaffId(""); }}
                                            >
                                                Assign Staff
                                            </Button>
                                        )}
                                        {req.status === "in_progress" && (
                                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(req.id, "completed")}>
                                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Done
                                            </Button>
                                        )}
                                        {req.status !== "cancelled" && req.status !== "completed" && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(req.id, "cancelled")}>
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && (
                <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-500">{filtered.length}</span> of <span className="font-semibold text-slate-500">{requests.length}</span> requests
                </p>
            )}

            {/* Assign Staff Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={open => { setAssignDialogOpen(open); if (!open) { setSelectedRequest(null); setFormError(""); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Staff Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {formError && (
                            <Alert variant="destructive">
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}
                        {selectedRequest && (
                            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-sm space-y-1">
                                <p className="font-semibold text-slate-900 capitalize">{selectedRequest.category} request</p>
                                {selectedRequest.description && <p className="text-slate-500 text-xs">{selectedRequest.description}</p>}
                                <p className="text-slate-500 text-xs">by {selectedRequest.user_name}</p>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>Select Staff Member</Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Choose staff..." /></SelectTrigger>
                                <SelectContent>
                                    {staff.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name} - {s.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full bg-rose-600 hover:bg-rose-600" onClick={handleAssignSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Assigning..." : "Assign & Start"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
