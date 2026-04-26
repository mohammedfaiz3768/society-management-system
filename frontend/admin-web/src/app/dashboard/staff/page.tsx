"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Search, UserCog } from "lucide-react";

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

const EMPTY_FORM = { name: "", phone: "", role: "security", shift_start: "", shift_end: "" };

const AVATAR_COLORS = ['bg-rose-600', 'bg-rose-600', 'bg-purple-500', 'bg-orange-500', 'bg-blue-500'];
function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

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

    const resetForm = () => { setFormData({ ...EMPTY_FORM }); setFormError(""); };

    const fetchStaff = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get('/staff?limit=50');
            setStaffList(res.data);
        } catch {
            setFetchError("Failed to load staff. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchStaff(); }, []);

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
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message || "Failed to add staff");
            else setFormError("An unexpected error occurred");
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
            setDeleteError("Failed to delete staff. Please try again.");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Staff Management</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage guards, cleaners, and other society staff.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <Label>Full Name</Label>
                                <Input placeholder="Ramu Kumar" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="border-slate-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Phone</Label>
                                    <Input type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} className="border-slate-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Role</Label>
                                    <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
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
                                <div className="space-y-1.5">
                                    <Label>Shift Start</Label>
                                    <Input type="time" value={formData.shift_start} onChange={e => setFormData({ ...formData, shift_start: e.target.value })} className="border-slate-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Shift End</Label>
                                    <Input type="time" value={formData.shift_end} onChange={e => setFormData({ ...formData, shift_end: e.target.value })} className="border-slate-200" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Staff"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {(fetchError || deleteError) && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError || deleteError}</AlertDescription>
                </Alert>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                <Input placeholder="Search by name, role, phone..." className="pl-9 border-slate-200" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-white">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Staff Member</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phone</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shift</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-50 animate-pulse" />
                                            <div className="h-3.5 w-28 bg-slate-50 rounded animate-pulse" />
                                        </div>
                                    </td>
                                    <td colSpan={5} />
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <UserCog className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">
                                            {search ? "No staff match your search." : "No staff added yet."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(staff => {
                                const bgColor = avatarColor(staff.name);
                                return (
                                    <tr key={staff.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full ${bgColor} flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0`}>
                                                    {staff.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-semibold text-slate-800">{staff.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 capitalize">{staff.role.replace(/_/g, ' ')}</td>
                                        <td className="px-5 py-3.5 text-slate-500">{staff.phone || '-'}</td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                                            {staff.shift_start && staff.shift_end ? `${staff.shift_start} - ${staff.shift_end}` : '-'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${staff.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-zinc-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'active' ? 'bg-green-500' : 'bg-zinc-400'}`} />
                                                {staff.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => handleDelete(staff.id)}
                                                className="p-1.5 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Remove staff"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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
                    <span className="font-semibold text-slate-500">{filtered.length}</span> of <span className="font-semibold text-slate-500">{staffList.length}</span> staff members
                </p>
            )}
        </div>
    );
}
