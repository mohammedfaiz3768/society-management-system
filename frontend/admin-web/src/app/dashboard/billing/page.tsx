'use client';

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Search, IndianRupee, TrendingUp, Clock, RefreshCw, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Invoice {
    id: number;
    amount: number;
    month_year: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    due_date: string | null;
    paid_at: string | null;
    created_at: string;
    user_name: string | null;
    resident_flat: string | null;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PAID:      { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Paid' },
    PENDING:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
    OVERDUE:   { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Overdue' },
    CANCELLED: { bg: 'bg-white',  text: 'text-zinc-500',  dot: 'bg-zinc-400',  label: 'Cancelled' },
};

function formatINR(amount: number) {
    return `Rs.${amount.toLocaleString('en-IN')}`;
}

export default function BillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [search, setSearch] = useState("");

    const fetchInvoices = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get('/invoices/all?limit=100');
            setInvoices(res.data);
        } catch {
            setFetchError("Failed to load invoices. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const filtered = invoices.filter(i => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            i.user_name?.toLowerCase().includes(q) ||
            i.resident_flat?.toLowerCase().includes(q) ||
            i.month_year?.includes(q) ||
            i.status?.toLowerCase().includes(q)
        );
    });

    const totalCollection = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.amount), 0);
    const totalPending = invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').reduce((s, i) => s + Number(i.amount), 0);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthTotal = invoices.filter(i => i.month_year === currentMonth).reduce((s, i) => s + Number(i.amount), 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Billing & Invoices</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Invoices are auto-generated on the 1st of every month for all residents.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchInvoices} className="border-slate-200 gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Collected</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{isLoading ? '-' : formatINR(totalCollection)}</p>
                    <p className="text-xs text-slate-500 mt-1">From paid invoices</p>
                </div>
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending / Overdue</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{isLoading ? '-' : formatINR(totalPending)}</p>
                    <p className="text-xs text-slate-500 mt-1">Awaiting payment</p>
                </div>
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                            <IndianRupee className="w-4 h-4 text-rose-600" />
                        </div>
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">This Month</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{isLoading ? '-' : formatINR(thisMonthTotal)}</p>
                    <p className="text-xs text-slate-500 mt-1">{currentMonth}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search resident, flat, month..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 border-slate-200"
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-rose-600" />
                        <h3 className="text-sm font-semibold text-slate-800">All Invoices</h3>
                    </div>
                    <p className="text-xs text-slate-500">Auto-generated monthly via cron job</p>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Resident</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Flat</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Month</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Due Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Paid At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-28 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-16 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-20 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-16 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-5 w-16 bg-slate-50 rounded-full animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-20 bg-slate-50 rounded animate-pulse" /></td>
                                    <td className="px-5 py-3.5"><div className="h-3.5 w-20 bg-slate-50 rounded animate-pulse" /></td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Receipt className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">
                                            {search ? "No invoices match your search." : "No invoices yet. They are generated automatically on the 1st of each month."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((invoice) => {
                                const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING;
                                return (
                                    <tr key={invoice.id} className="hover:bg-white/50 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{invoice.user_name || '-'}</td>
                                        <td className="px-5 py-3.5 text-slate-500">{invoice.resident_flat || '-'}</td>
                                        <td className="px-5 py-3.5 font-medium text-slate-700">{invoice.month_year}</td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-900">{formatINR(Number(invoice.amount))}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
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
                    Showing <span className="font-semibold text-slate-500">{filtered.length}</span> of <span className="font-semibold text-slate-500">{invoices.length}</span> invoices
                </p>
            )}
        </div>
    );
}
