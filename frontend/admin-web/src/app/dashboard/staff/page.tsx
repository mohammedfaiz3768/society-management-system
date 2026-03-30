"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search } from "lucide-react"; // ✅ removed unused Edit

interface Staff {
    id: number;
    name: string;
    phone: string;
    role: string;
    shift_start?: string;
    shift_end?: string;
    status: string;
    created_at: string;
}

const EMPTY_FORM = {
    name: "", phone: "", role: "security", shift_start: "", shift_end: ""
};

export default function StaffPage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const resetForm = () => {
        setFormData({ ...EMPTY_FORM });
        setFormError("");
    };

    const fetchStaff = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            // ✅ Paginate
            const res = await api.get('/staff?limit=50');
            setStaffList(res.data);
        } catch {
            setFetchError("Failed to load staff. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchStaff(); }, []);

    // ✅ Search includes phone
    const filtered = staffList.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setIsSubmitting(true);
        try {
            await api.post('/staff', formData);
            resetForm();
            setIsDialogOpen(false);
            fetchStaff();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to add staff");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Remove this staff member?")) return;
        setDeleteError("");
        try {
            await api.delete(`/staff/${id}`);
            fetchStaff();
        } catch {
            // ✅ Inline error instead of alert()
            setDeleteError("Failed to delete staff. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Staff Management</h2>
                    <p className="text-sm text-muted-foreground">Manage guards, cleaners, and other society staff.</p>
                </div>
                {/* ✅ Reset form on close */}
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Staff</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    placeholder="Ramu Kumar"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    {/* ✅ Numeric only */}
                                    <Input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="10 digits"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="security">Security Guard</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="cleaner">Cleaner</SelectItem>
                                            <SelectItem value="plumber">Plumber</SelectItem>
                                            <SelectItem value="electrician">Electrician</SelectItem>
                                            <SelectItem value="gardener">Gardener</SelectItem>
                                            <SelectItem value="lift_man">Lift Man</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Shift Start</Label>
                                    <Input type="time" value={formData.shift_start} onChange={e => setFormData({ ...formData, shift_start: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Shift End</Label>
                                    <Input type="time" value={formData.shift_end} onChange={e => setFormData({ ...formData, shift_end: e.target.value })} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Staff"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ✅ Error states */}
            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}
            {deleteError && (
                <Alert variant="destructive">
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, role, phone..."
                    className="pl-8"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                    {search ? "No staff match your search." : "No staff added yet."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(staff => (
                                <TableRow key={staff.id}>
                                    <TableCell className="font-medium text-sm">{staff.name}</TableCell>
                                    <TableCell className="capitalize text-sm">
                                        {/* ✅ Replace ALL underscores */}
                                        {staff.role.replace(/_/g, ' ')}
                                    </TableCell>
                                    <TableCell className="text-sm">{staff.phone || '—'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {staff.shift_start && staff.shift_end
                                            ? `${staff.shift_start} – ${staff.shift_end}`
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                                            {staff.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(staff.id)}
                                            title="Remove staff"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    {filtered.length} of {staffList.length} staff members
                </p>
            )}
        </div>
    );
}