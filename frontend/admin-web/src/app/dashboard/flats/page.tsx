"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Home, UserPlus, Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Flat {
    id: number;
    flat_number: string;
    block: string;
    floor: string;
    owner_name: string | null;
    owner_phone: string | null;
}

interface Resident {
    id: number;
    name: string;
    email: string;
}

const LIMIT = 200;

export default function FlatsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [flats, setFlats] = useState<Flat[]>([]);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
    const [assignUserId, setAssignUserId] = useState("");
    const [assignError, setAssignError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ flat_number: "", block: "", floor: "" });

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const resetForm = () => { setFormData({ flat_number: "", block: "", floor: "" }); setFormError(""); };

    const fetchFlats = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const [flatsRes, usersRes] = await Promise.all([
                api.get(`/flats?limit=${LIMIT}`),
                api.get(`/users?role=resident&limit=${LIMIT}`),
            ]);
            setFlats(flatsRes.data);
            setResidents(usersRes.data);
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to load flats");
            else setFetchError("Failed to load flats");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchFlats(); }, [user]);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFlat || !assignUserId) return;
        setAssignError("");
        setIsSubmitting(true);
        try {
            await api.post('/flats/assign', { flat_id: selectedFlat.id, user_id: assignUserId });
            setIsAssignOpen(false);
            setSelectedFlat(null);
            setAssignUserId("");
            fetchFlats();
        } catch (err) {
            if (axios.isAxiosError(err)) setAssignError(err.response?.data?.message || "Failed to assign resident");
            else setAssignError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        if (!formData.flat_number.trim()) { setFormError("Flat number is required"); return; }
        setIsSubmitting(true);
        try {
            await api.post('/flats', formData);
            setIsDialogOpen(false);
            resetForm();
            fetchFlats();
        } catch (err) {
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message || "Failed to add flat");
            else setFormError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const occupiedCount = flats.filter(f => f.owner_name).length;
    const vacantCount = flats.filter(f => !f.owner_name).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Flat Management</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage all flats in your society.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Add Flat
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Flat</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Flat Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.flat_number}
                                        onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
                                        placeholder="101"
                                        maxLength={20}
                                        required
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Block</Label>
                                    <Input
                                        value={formData.block}
                                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                                        placeholder="A"
                                        maxLength={10}
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Floor</Label>
                                    <Input
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        placeholder="1"
                                        type="number"
                                        min={0}
                                        max={200}
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Flat"}
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
            {!isLoading && flats.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-semibold">
                        <Home className="w-3.5 h-3.5" /> {flats.length} Total
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {occupiedCount} Occupied
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {vacantCount} Vacant
                    </div>
                </div>
            )}

            {/* Flat grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 animate-pulse">
                            <div className="flex justify-between mb-3">
                                <div className="h-5 w-20 bg-slate-50 rounded" />
                                <div className="h-5 w-16 bg-slate-50 rounded-full" />
                            </div>
                            <div className="h-3.5 w-28 bg-slate-50 rounded mb-2" />
                            <div className="h-3 w-20 bg-slate-50 rounded" />
                        </div>
                    ))}
                </div>
            ) : flats.length === 0 ? (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-16 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <Home className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No flats added yet</p>
                    <p className="text-xs text-slate-500">Click &quot;Add Flat&quot; to get started.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    {flats.map((flat) => (
                        <div key={flat.id} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-slate-900">{flat.flat_number}</span>
                                        {flat.block && (
                                            <span className="text-xs text-slate-500 font-medium">Block {flat.block}</span>
                                        )}
                                    </div>
                                    {flat.floor && (
                                        <p className="text-xs text-slate-500 mt-0.5">Floor {flat.floor}</p>
                                    )}
                                </div>
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${flat.owner_name ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${flat.owner_name ? 'bg-blue-500' : 'bg-green-500'}`} />
                                    {flat.owner_name ? "Occupied" : "Vacant"}
                                </span>
                            </div>

                            {flat.owner_name ? (
                                <div className="space-y-1 pt-3 border-t border-zinc-50">
                                    <p className="text-sm font-semibold text-slate-800">{flat.owner_name}</p>
                                    {flat.owner_phone && (
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                            <Phone className="w-3 h-3" /> {flat.owner_phone}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="pt-3 border-t border-zinc-50">
                                    <p className="text-xs text-slate-500 mb-2">No resident assigned</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs border-emerald-200 text-rose-600 hover:bg-rose-50 gap-1"
                                        onClick={() => { setSelectedFlat(flat); setIsAssignOpen(true); }}
                                    >
                                        <UserPlus className="w-3 h-3" /> Assign Resident
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && flats.length > 0 && (
                <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-500">{flats.length}</span> flat{flats.length !== 1 ? "s" : ""}
                </p>
            )}

            {/* Assign Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={(open) => {
                setIsAssignOpen(open);
                if (!open) { setSelectedFlat(null); setAssignUserId(""); setAssignError(""); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Resident to Flat {selectedFlat?.flat_number}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssign} className="space-y-4 py-2">
                        {assignError && (
                            <Alert variant="destructive">
                                <AlertDescription>{assignError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-1.5">
                            <Label>Select Resident</Label>
                            <Select value={assignUserId} onValueChange={setAssignUserId}>
                                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select a resident" /></SelectTrigger>
                                <SelectContent>
                                    {residents.map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting || !assignUserId}>
                            {isSubmitting ? "Assigning..." : "Assign Resident"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
