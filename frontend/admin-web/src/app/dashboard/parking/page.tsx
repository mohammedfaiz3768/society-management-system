"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Car, ParkingCircle, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ParkingSlot {
    id: number;
    slot_number: string;
    type: string;
    status: string;
    flat_number?: string;
    owner_name?: string;
}

interface Resident {
    id: number;
    name: string;
    flat_number: string;
}

const LIMIT = 200;

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    available:   { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Available' },
    occupied:    { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Occupied' },
    maintenance: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Maintenance' },
};

export default function ParkingPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [slots, setSlots] = useState<ParkingSlot[]>([]);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createError, setCreateError] = useState("");
    const [assignError, setAssignError] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
    const [newSlot, setNewSlot] = useState({ slot_number: "", type: "resident" });
    const [assignData, setAssignData] = useState({ user_id: "" });

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const resetNewSlot = () => { setNewSlot({ slot_number: "", type: "resident" }); setCreateError(""); };
    const resetAssign = () => { setAssignData({ user_id: "" }); setAssignError(""); setSelectedSlot(null); };

    const fetchData = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const [slotsRes, usersRes] = await Promise.all([
                api.get(`/parking?limit=${LIMIT}`),
                api.get(`/users?role=resident&limit=${LIMIT}`),
            ]);
            setSlots(slotsRes.data);
            setResidents(usersRes.data);
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to load parking data");
            else setFetchError("Failed to load parking data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchData(); }, [user]);

    const handleCreateSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError("");
        setIsSubmitting(true);
        try {
            await api.post('/parking/slots', newSlot);
            setIsDialogOpen(false);
            resetNewSlot();
            fetchData();
        } catch (err) {
            if (axios.isAxiosError(err)) setCreateError(err.response?.data?.message || "Failed to create slot");
            else setCreateError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) return;
        setAssignError("");
        setIsSubmitting(true);
        try {
            await api.post('/parking/assign', { slot_id: selectedSlot.id, user_id: assignData.user_id });
            setIsAssignOpen(false);
            resetAssign();
            fetchData();
        } catch (err) {
            if (axios.isAxiosError(err)) setAssignError(err.response?.data?.message || "Failed to assign slot");
            else setAssignError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableCount = slots.filter(s => s.status === 'available').length;
    const occupiedCount = slots.filter(s => s.status === 'occupied').length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Parking Management</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage parking slots and vehicle assignments.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetNewSlot(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Add Slot
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Parking Slot</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSlot} className="space-y-4 py-2">
                            {createError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{createError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <Label>Slot Number</Label>
                                <Input
                                    value={newSlot.slot_number}
                                    onChange={(e) => setNewSlot({ ...newSlot, slot_number: e.target.value })}
                                    required
                                    placeholder="e.g. P-101"
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Type</Label>
                                <Select value={newSlot.type} onValueChange={(v) => setNewSlot({ ...newSlot, type: v })}>
                                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="resident">Resident</SelectItem>
                                        <SelectItem value="visitor">Visitor</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Slot"}
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

            {/* Stat chips */}
            {!isLoading && (
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                        <ParkingCircle className="w-3.5 h-3.5" /> {availableCount} Available
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
                        <Car className="w-3.5 h-3.5" /> {occupiedCount} Occupied
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-semibold">
                        <Wrench className="w-3.5 h-3.5" /> {slots.length} Total
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-white">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Slot No</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assigned To</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Flat</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-16 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-20 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-5 w-20 bg-slate-50 rounded-full animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-24 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-12 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5" />
                                </tr>
                            ))
                        ) : slots.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ParkingCircle className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">No parking slots found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            slots.map((slot) => {
                                const cfg = STATUS_CONFIG[slot.status] || { bg: 'bg-white', text: 'text-slate-500', dot: 'bg-zinc-400', label: slot.status };
                                return (
                                    <tr key={slot.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-slate-800 font-mono">{slot.slot_number}</td>
                                        <td className="px-5 py-3.5 text-slate-500 capitalize">{slot.type}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">{slot.owner_name || "-"}</td>
                                        <td className="px-5 py-3.5 text-slate-500">{slot.flat_number || "-"}</td>
                                        <td className="px-5 py-3.5 text-right">
                                            {slot.status === "available" && slot.type === "resident" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs border-slate-200 hover:border-emerald-300 hover:text-rose-600"
                                                    onClick={() => { setSelectedSlot(slot); setIsAssignOpen(true); }}
                                                >
                                                    Assign
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && slots.length > 0 && (
                <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-500">{slots.length}</span> slot{slots.length !== 1 ? "s" : ""}
                </p>
            )}

            {/* Assign Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={(open) => { setIsAssignOpen(open); if (!open) resetAssign(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Slot {selectedSlot?.slot_number}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignSlot} className="space-y-4 py-2">
                        {assignError && (
                            <Alert variant="destructive">
                                <AlertDescription>{assignError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-1.5">
                            <Label>Select Resident</Label>
                            <Select value={assignData.user_id} onValueChange={(v) => setAssignData({ user_id: v })}>
                                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select a resident" /></SelectTrigger>
                                <SelectContent>
                                    {residents.map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.flat_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
                            {isSubmitting ? "Assigning..." : "Assign Slot"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
