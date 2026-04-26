"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, IndianRupee, TrendingUp, Clock, FileText } from "lucide-react";

interface Bill {
    id: number;
    flat_number: string;
    month: number;
    year: number;
    amount: string;
    status: string;
    created_at: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PAID:      { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Paid' },
    PENDING:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
    OVERDUE:   { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Overdue' },
    CANCELLED: { bg: 'bg-white',  text: 'text-zinc-500',  dot: 'bg-zinc-400',  label: 'Cancelled' },
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

    const resetForm = () => { setFormData({ ...EMPTY_FORM }); setFormError(""); };

    const fetchBills = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
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
        if (!formData.amount || Number(formData.amount) <= 0) {
            setFormError("Amount must be greater than zero");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/maintenance', { ...formData, amount: Number(formData.amount) });
            resetForm();
            setIsDialogOpen(false);
            fetchBills();
        } catch (err) {
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message || "Failed to create bill");
            else setFormError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPending = bills.filter(b => b.status === 'PENDING' || b.status === 'OVERDUE').reduce((sum, b) => sum + Number(b.amount), 0);
    const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + Number(b.amount), 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Maintenance Bills</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Bills are auto-generated monthly. You can also create them manually.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Generate Bill
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Maintenance Bill</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Flat Number</Label>
                                    <Input
                                        placeholder="e.g. A-101"
                                        value={formData.flat_number}
                                        onChange={e => setFormData({ ...formData, flat_number: e.target.value })}
                                        required
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Amount (Rs.)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="2000"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Month</Label>
                                    <Select value={formData.month.toString()} onValueChange={v => setFormData({ ...formData, month: Number(v) })}>
                                        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[...Array(12)].map((_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Year</Label>
                                    <Input
                                        type="number"
                                        min={2020}
                                        max={2030}
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>
                                    Notes <span className="text-slate-500 font-normal text-xs">(optional)</span>
                                </Label>
                                <Textarea
                                    placeholder="e.g. Includes water charges"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="resize-none border-slate-200"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
                                {isSubmitting ? "Generating..." : "Generate Bill"}
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

            {/* Stats */}
            {!isLoading && bills.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Collected</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">Rs.{totalPaid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending / Overdue</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">Rs.{totalPending.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search by flat or status..."
                    className="pl-9 border-slate-200"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-white">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Flat</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Period</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-16 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-20 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-16 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-5 w-16 bg-slate-50 rounded-full animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-20 bg-slate-50 rounded animate-pulse" /></td>
                                </tr>
                            ))
                        ) : filteredBills.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">
                                            {search ? "No bills match your search." : "No bills found."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredBills.map(bill => {
                                const cfg = STATUS_CONFIG[bill.status] || STATUS_CONFIG.PENDING;
                                return (
                                    <tr key={bill.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{bill.flat_number}</td>
                                        <td className="px-5 py-3.5 text-slate-500">
                                            {new Date(0, bill.month - 1).toLocaleString('default', { month: 'short' })} {bill.year}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                                            <div className="flex items-center gap-1">
                                                <IndianRupee className="w-3 h-3 text-zinc-500" />
                                                {Number(bill.amount).toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                    <span className="font-semibold text-slate-500">{filteredBills.length}</span> of <span className="font-semibold text-slate-500">{bills.length}</span> bills
                </p>
            )}
        </div>
    );
}
