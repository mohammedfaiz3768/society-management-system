"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react"; // ✅ removed unused Receipt

interface Bill {
    id: number;
    flat_number: string;
    month: number;
    year: number;
    amount: string;
    status: string;
    created_at: string;
}

// ✅ All four statuses handled
const STATUS_STYLES: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();

const EMPTY_FORM = {
    flat_number: "",
    month: CURRENT_MONTH,
    year: CURRENT_YEAR,
    amount: "",
    notes: "",
};

export default function MaintenancePage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const resetForm = () => {
        setFormData({ ...EMPTY_FORM });
        setFormError("");
    };

    const fetchBills = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            // ✅ Paginate
            const res = await api.get('/maintenance?limit=50');
            setBills(res.data);
        } catch {
            setFetchError("Failed to load maintenance bills. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchBills(); }, []);

    const filteredBills = bills.filter(b =>
        b.flat_number.includes(search) ||
        b.status.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        // ✅ Validate amount
        if (!formData.amount || Number(formData.amount) <= 0) {
            setFormError("Amount must be greater than zero");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/maintenance', {
                ...formData,
                amount: Number(formData.amount),
            });
            // ✅ Reset form after success
            resetForm();
            setIsDialogOpen(false);
            fetchBills();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to create bill");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Stats
    const totalPending = bills
        .filter(b => b.status === 'PENDING' || b.status === 'OVERDUE')
        .reduce((sum, b) => sum + Number(b.amount), 0);
    const totalPaid = bills
        .filter(b => b.status === 'PAID')
        .reduce((sum, b) => sum + Number(b.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Maintenance Bills</h2>
                    <p className="text-sm text-muted-foreground">
                        Bills are auto-generated monthly. You can also create them manually.
                    </p>
                </div>
                {/* ✅ Reset on close */}
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Generate Bill</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Maintenance Bill</DialogTitle>
                            <DialogDescription>Create a bill for a specific flat.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Flat Number</Label>
                                    <Input
                                        placeholder="e.g. A-101"
                                        value={formData.flat_number}
                                        onChange={e => setFormData({ ...formData, flat_number: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="2000"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Month</Label>
                                    <Select
                                        value={formData.month.toString()}
                                        onValueChange={v => setFormData({ ...formData, month: Number(v) })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[...Array(12)].map((_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    {/* ✅ Min/max constraint */}
                                    <Input
                                        type="number"
                                        min={2020}
                                        max={2030}
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            {/* ✅ Notes textarea now rendered */}
                            <div className="space-y-2">
                                <Label>
                                    Notes
                                    <span className="text-muted-foreground font-normal text-xs ml-1">(optional)</span>
                                </Label>
                                <Textarea
                                    placeholder="e.g. Includes water charges"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Generating..." : "Generate Bill"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {/* Quick stats */}
            {!isLoading && bills.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Collected</p>
                        <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pending / Overdue</p>
                        <p className="text-xl font-bold text-orange-500">₹{totalPending.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            )}

            {/* ✅ Search bar — was missing from original */}
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by flat or status..."
                    className="pl-8"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Flat</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredBills.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                    {search ? "No bills match your search." : "No bills found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBills.map(bill => (
                                <TableRow key={bill.id}>
                                    <TableCell className="font-medium text-sm">{bill.flat_number}</TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(0, bill.month - 1).toLocaleString('default', { month: 'short' })} {bill.year}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {/* ✅ Formatted amount */}
                                        ₹{Number(bill.amount).toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell>
                                        {/* ✅ All 4 statuses handled */}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[bill.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {bill.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(bill.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    {filteredBills.length} of {bills.length} bills
                </p>
            )}
        </div>
    );
}