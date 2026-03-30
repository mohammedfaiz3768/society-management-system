"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const ROLE_STYLES: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    guard: 'bg-orange-100 text-orange-800',
    staff: 'bg-yellow-100 text-yellow-800',
    resident: 'bg-blue-100 text-blue-800',
};

export default function ResidentsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [search, setSearch] = useState("");
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

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.includes(search) ||
        user.flat_number?.includes(search)
    );

    const resetForm = () => {
        setFormData({ name: "", email: "", phone: "", role: "resident", block: "", flat_number: "" });
        setFormError("");
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        // ✅ Client-side validation
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Residents</h2>
                    <p className="text-sm text-muted-foreground">Manage residents, guards and staff.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account. They can login via OTP.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Mohammed Faiz"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {/* ✅ Admin removed — use invitation system */}
                                            <SelectItem value="resident">Resident</SelectItem>
                                            <SelectItem value="guard">Guard</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    {/* ✅ Numeric only */}
                                    <Input
                                        id="phone"
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="10 digits"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="block">Block</Label>
                                    <Input
                                        id="block"
                                        placeholder="A"
                                        value={formData.block}
                                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="flat">Flat No</Label>
                                    <Input
                                        id="flat"
                                        placeholder="101"
                                        value={formData.flat_number}
                                        onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Creating..." : "Create User"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name, email, flat..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Fetch error */}
            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>{/* ✅ Fixed typo "Namge" */}
                            <TableHead>Contact</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                    {search ? "No users match your search." : "No users found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {/* ✅ Initial letter avatar */}
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <span className="truncate max-w-[120px]">{user.name || "Unknown"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm truncate max-w-[160px]">{user.email}</span>
                                            <span className="text-xs text-muted-foreground">{user.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {user.block && user.flat_number
                                            ? `${user.block}-${user.flat_number}`
                                            : user.flat_number || '—'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[user.role] || 'bg-slate-100 text-slate-700'}`}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Result count */}
            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    Showing {filteredUsers.length} of {users.length} users
                </p>
            )}
        </div>
    );
}