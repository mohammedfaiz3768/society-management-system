"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw } from "lucide-react";

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

interface StaffMember {
    id: number;
    name: string;
    role: string;
}

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    completed: "bg-green-100 text-green-800 hover:bg-green-100",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
};

const PRIORITY_STYLES: Record<string, string> = {
    low: "bg-slate-100 text-slate-600 hover:bg-slate-100",
    medium: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    high: "bg-red-100 text-red-700 hover:bg-red-100",
    urgent: "bg-red-600 text-white hover:bg-red-600",
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
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to load service requests");
            } else {
                setError("Failed to load service requests");
            }
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await api.put(`/services/${id}/status`, { status });
            setRequests(prev =>
                prev.map(r => r.id === id ? { ...r, status } : r)
            );
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to update status");
            }
        }
    };

    const handleAssignSubmit = async () => {
        if (!selectedRequest || !selectedStaffId) {
            setFormError("Please select a staff member");
            return;
        }
        setIsSubmitting(true);
        setFormError("");
        try {
            await api.post("/services/assign", {
                request_id: selectedRequest.id,
                staff_id: parseInt(selectedStaffId),
            });
            setRequests(prev =>
                prev.map(r =>
                    r.id === selectedRequest.id
                        ? {
                            ...r,
                            assigned_to: parseInt(selectedStaffId),
                            staff_name: staff.find(s => s.id === parseInt(selectedStaffId))?.name ?? null,
                            status: "in_progress",
                        }
                        : r
                )
            );
            setAssignDialogOpen(false);
            setSelectedRequest(null);
            setSelectedStaffId("");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to assign staff");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = requests.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            r.user_name?.toLowerCase().includes(q) ||
            r.category?.toLowerCase().includes(q) ||
            r.flat_number?.includes(q) ||
            r.description?.toLowerCase().includes(q)
        );
    });

    const pending = requests.filter(r => r.status === "pending").length;
    const inProgress = requests.filter(r => r.status === "in_progress").length;
    const completed = requests.filter(r => r.status === "completed").length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Service Requests</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage maintenance and service requests from residents.
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{completed}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search resident, category, flat..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
            </div>

            {/* Cards */}
            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center text-sm text-muted-foreground">
                        {search || statusFilter !== "all"
                            ? "No requests match your filters."
                            : "No service requests yet."}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(req => (
                        <Card key={req.id}>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <Badge className={PRIORITY_STYLES[req.priority] || PRIORITY_STYLES.medium}>
                                                {req.priority}
                                            </Badge>
                                            <Badge variant="outline" className="capitalize">
                                                {req.category}
                                            </Badge>
                                            <Badge className={STATUS_STYLES[req.status] || STATUS_STYLES.pending}>
                                                {req.status.replace("_", " ")}
                                            </Badge>
                                        </div>

                                        {req.description && (
                                            <p className="text-sm text-slate-700 mb-2">{req.description}</p>
                                        )}

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span>From: <strong className="text-slate-700">{req.user_name}</strong></span>
                                            {req.flat_number && <span>Flat: <strong>{req.flat_number}</strong></span>}
                                            {req.staff_name && <span>Assigned: <strong className="text-blue-600">{req.staff_name}</strong></span>}
                                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                                        {req.status === "pending" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setAssignDialogOpen(true);
                                                    setFormError("");
                                                    setSelectedStaffId("");
                                                }}
                                            >
                                                Assign Staff
                                            </Button>
                                        )}
                                        {req.status === "in_progress" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleStatusChange(req.id, "completed")}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                Mark Done
                                            </Button>
                                        )}
                                        {req.status !== "cancelled" && req.status !== "completed" && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleStatusChange(req.id, "cancelled")}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {requests.length} requests
                </p>
            )}

            {/* Assign Staff Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={open => {
                setAssignDialogOpen(open);
                if (!open) { setSelectedRequest(null); setFormError(""); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Staff Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {formError && (
                            <Alert variant="destructive">
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}
                        {selectedRequest && (
                            <div className="p-3 bg-slate-50 rounded-md text-sm">
                                <p className="font-medium capitalize">{selectedRequest.category} request</p>
                                <p className="text-muted-foreground">{selectedRequest.description}</p>
                                <p className="text-muted-foreground text-xs mt-1">by {selectedRequest.user_name}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Select Staff Member</Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose staff..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name} — {s.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleAssignSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Assigning..." : "Assign & Start"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
