"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Users, UserCheck, ShieldCheck, HardHat } from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    flat_number: string;
    block: string;
    created_at?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    admin:    { label: 'Admin',    bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
    guard:    { label: 'Guard',    bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
    staff:    { label: 'Staff',    bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
    resident: { label: 'Resident', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
};

const AVATAR_COLORS = [
    'bg-rose-600', 'bg-blue-500', 'bg-rose-600', 'bg-green-500',
    'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-rose-500',
];

function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function ResidentsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", role: "resident", block: "", flat_number: "",
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get('/users?limit=50');
            setUsers(res.data);
        } catch {
            setFetchError("Failed to load residents. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const filteredUsers = users.filter(user => {
        const matchRole = filterRole === "all" || user.role === filterRole;
        const matchSearch = !search ||
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.phone?.includes(search) ||
            user.flat_number?.includes(search);
        return matchRole && matchSearch;
    });

    const counts = {
        residents: users.filter(u => u.role === 'resident').length,
        guards: users.filter(u => u.role === 'guard').length,
        staff: users.filter(u => u.role === 'staff').length,
    };

    const resetForm = () => {
        setFormData({ name: "", email: "", phone: "", role: "resident", block: "", flat_number: "" });
        setFormError("");
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        if (!emailRegex.test(formData.email)) {
            setFormError("Please enter a valid email address");
            return;
        }
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            setFormError("Phone must be 10 digits");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/users', formData);
            resetForm();
            setIsDialogOpen(false);
            fetchUsers();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to create user");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Residents & Users</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage all residents, guards and staff.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[440px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>Create a user account. They can login via OTP.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="resident">Resident</SelectItem>
                                            <SelectItem value="guard">Guard</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="user@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="block">Block</Label>
                                    <Input id="block" placeholder="A" value={formData.block} onChange={(e) => setFormData({ ...formData, block: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="flat">Flat No</Label>
                                    <Input id="flat" placeholder="101" value={formData.flat_number} onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-600">
                                    {isSubmitting ? "Creating..." : "Create User"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stat chips */}
            <div className="flex flex-wrap gap-3">
                {[
                    { label: 'Residents', count: counts.residents, icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: 'Guards', count: counts.guards, icon: ShieldCheck, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                    { label: 'Staff', count: counts.staff, icon: HardHat, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                ].map(({ label, count, icon: Icon, color }) => (
                    <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {count} {label}
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search name, email, flat..."
                        className="pl-9 border-slate-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-36 border-slate-200">
                        <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="resident">Residents</SelectItem>
                        <SelectItem value="guard">Guards</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
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
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">User</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Unit</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-50 animate-pulse" />
                                            <div className="space-y-1.5">
                                                <div className="h-3 w-24 bg-slate-50 rounded animate-pulse" />
                                                <div className="h-2.5 w-16 bg-slate-50 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </td>
                                    <td colSpan={4} />
                                </tr>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <UserCheck className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">
                                            {search || filterRole !== "all" ? "No users match your filters." : "No users yet."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => {
                                const roleConfig = ROLE_CONFIG[user.role] || { label: user.role, bg: 'bg-white', text: 'text-slate-700', dot: 'bg-zinc-400' };
                                const bgColor = avatarColor(user.name || 'A');
                                return (
                                    <tr key={user.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full ${bgColor} flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0`}>
                                                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 truncate max-w-[140px]">{user.name || "Unknown"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-slate-700 truncate max-w-[160px]">{user.email}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{user.phone || '-'}</p>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-slate-700 text-xs">
                                            {user.block && user.flat_number
                                                ? `${user.block}-${user.flat_number}`
                                                : user.flat_number || <span className="text-slate-700">-</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleConfig.bg} ${roleConfig.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`} />
                                                {roleConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
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
                    Showing <span className="font-semibold text-slate-500">{filteredUsers.length}</span> of <span className="font-semibold text-slate-500">{users.length}</span> users
                </p>
            )}
        </div>
    );
}
