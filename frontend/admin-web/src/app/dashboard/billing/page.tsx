'use client';

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

const STATUS_STYLES: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

function formatINR(amount: number) {
    return `₹${amount.toLocaleString('en-IN')}`;
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
            // Try admin endpoint first, fall back to personal invoices
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
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Billing & Invoices</h2>
                <p className="text-sm text-muted-foreground">
                    Invoices are auto-generated on the 1st of every month for all residents.
                </p>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Total Collected
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {isLoading ? '—' : formatINR(totalCollection)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Pending / Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">
                            {isLoading ? '—' : formatINR(totalPending)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {isLoading ? '—' : formatINR(thisMonthTotal)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{currentMonth}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search resident, flat, month..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>

            <div className="rounded-md border bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-sm font-medium">All Invoices</h3>
                    <p className="text-xs text-muted-foreground">Auto-generated monthly via cron job</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Resident</TableHead>
                            <TableHead>Flat</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Paid At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                    {search ? "No invoices match your search." : "No invoices yet. They are generated automatically on the 1st of each month."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="text-sm font-medium">
                                        {invoice.user_name || '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {invoice.resident_flat || '—'}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {invoice.month_year}
                                    </TableCell>
                                    <TableCell className="text-sm font-semibold">
                                        {formatINR(Number(invoice.amount))}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[invoice.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {invoice.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {invoices.length} invoices
                </p>
            )}
        </div>
    );
}
