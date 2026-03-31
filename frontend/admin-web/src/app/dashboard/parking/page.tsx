"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    const resetNewSlot = () => {
        setNewSlot({ slot_number: "", type: "resident" });
        setCreateError("");
    };

    const resetAssign = () => {
        setAssignData({ user_id: "" });
        setAssignError("");
        setSelectedSlot(null);
    };

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
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to load parking data");
            } else {
                setFetchError("Failed to load parking data");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

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
            if (axios.isAxiosError(err)) {
                setCreateError(err.response?.data?.message || "Failed to create slot");
            } else {
                setCreateError("An unexpected error occurred");
            }
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
            await api.post('/parking/assign', {
                slot_id: selectedSlot.id,
                user_id: assignData.user_id,
            });
            setIsAssignOpen(false);
            resetAssign();
            fetchData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setAssignError(err.response?.data?.message || "Failed to assign slot");
            } else {
                setAssignError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAssignDialog = (slot: ParkingSlot) => {
        setSelectedSlot(slot);
        setIsAssignOpen(true);
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "available":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>;
            case "occupied":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Occupied</Badge>;
            case "maintenance":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Maintenance</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Parking Management</h2>
                    <p className="text-muted-foreground">Manage parking slots and vehicle assignments.</p>
                </div>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetNewSlot();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Slot
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Parking Slot</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSlot} className="space-y-4 py-4">
                            {createError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{createError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label>Slot Number</Label>
                                <Input
                                    value={newSlot.slot_number}
                                    onChange={(e) => setNewSlot({ ...newSlot, slot_number: e.target.value })}
                                    required
                                    placeholder="e.g. P-101"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={newSlot.type}
                                    onValueChange={(v) => setNewSlot({ ...newSlot, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="resident">Resident</SelectItem>
                                        <SelectItem value="visitor">Visitor</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
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

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Slot No</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Flat</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex justify-center items-center">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : slots.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No slots found
                                </TableCell>
                            </TableRow>
                        ) : (
                            slots.map((slot) => (
                                <TableRow key={slot.id}>
                                    <TableCell className="font-medium">{slot.slot_number}</TableCell>
                                    <TableCell className="capitalize">{slot.type}</TableCell>
                                    <TableCell>{statusBadge(slot.status)}</TableCell>
                                    <TableCell>{slot.owner_name || "—"}</TableCell>
                                    <TableCell>{slot.flat_number || "—"}</TableCell>
                                    <TableCell className="text-right">
                                        {slot.status === "available" && slot.type === "resident" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openAssignDialog(slot)}
                                            >
                                                Assign
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && slots.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {slots.length} slot{slots.length !== 1 ? "s" : ""}
                </p>
            )}

            <Dialog
                open={isAssignOpen}
                onOpenChange={(open) => {
                    setIsAssignOpen(open);
                    if (!open) resetAssign();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Slot {selectedSlot?.slot_number}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignSlot} className="space-y-4 py-4">
                        {assignError && (
                            <Alert variant="destructive">
                                <AlertDescription>{assignError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label>Select Resident</Label>
                            <Select
                                value={assignData.user_id}
                                onValueChange={(v) => setAssignData({ user_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a resident" />
                                </SelectTrigger>
                                <SelectContent>
                                    {residents.map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.flat_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Assigning..." : "Assign Slot"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
