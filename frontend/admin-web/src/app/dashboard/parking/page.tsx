"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
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
import { Plus, Car, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ParkingSlot {
    id: number;
    slot_number: string;
    type: string;
    status: string;
    flat_number?: string;
    owner_name?: string;
}

export default function ParkingPage() {
    const [slots, setSlots] = useState<ParkingSlot[]>([]);
    const [residents, setResidents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

    const [newSlot, setNewSlot] = useState({ slot_number: "", type: "resident" });
    const [assignData, setAssignData] = useState({ user_id: "" });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [slotsRes, userRes] = await Promise.all([
                api.get('/parking'),
                api.get('/users?role=resident')
            ]);
            setSlots(slotsRes.data);
            setResidents(userRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await api.post('/parking/slots', newSlot);
            setIsDialogOpen(false);
            setNewSlot({ slot_number: "", type: "resident" });
            fetchData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to create slot");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) return;
        setError("");
        setIsSubmitting(true);
        try {
            await api.post('/parking/assign', {
                slot_id: selectedSlot.id,
                user_id: assignData.user_id
            });
            setIsAssignOpen(false);
            setSelectedSlot(null);
            setAssignData({ user_id: "" });
            fetchData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to assign slot");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAssignDialog = (slot: ParkingSlot) => {
        setSelectedSlot(slot);
        setIsAssignOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Parking Management</h2>
                    <p className="text-muted-foreground">Manage parking slots and vehicle assignments.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                            <div className="space-y-2">
                                <Label>Slot Number</Label>
                                <Input value={newSlot.slot_number} onChange={e => setNewSlot({ ...newSlot, slot_number: e.target.value })} required placeholder="e.g. P-101" />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={newSlot.type} onValueChange={v => setNewSlot({ ...newSlot, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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

            <div className="rounded-md border bg-white">
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
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : slots.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">No slots found</TableCell></TableRow>
                        ) : (
                            slots.map(slot => (
                                <TableRow key={slot.id}>
                                    <TableCell className="font-medium">{slot.slot_number}</TableCell>
                                    <TableCell className="capitalize">{slot.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={slot.status === 'available' ? 'outline' : 'secondary'}>
                                            {slot.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{slot.owner_name || '-'}</TableCell>
                                    <TableCell>{slot.flat_number || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        {slot.status === 'available' && slot.type === 'resident' && (
                                            <Button variant="outline" size="sm" onClick={() => openAssignDialog(slot)}>
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

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Slot {selectedSlot?.slot_number}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignSlot} className="space-y-4 py-4">
                        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                        <div className="space-y-2">
                            <Label>Select Resident</Label>
                            <Select value={assignData.user_id} onValueChange={v => setAssignData({ user_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Select a resident" /></SelectTrigger>
                                <SelectContent>
                                    {residents.map((r: any) => (
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
