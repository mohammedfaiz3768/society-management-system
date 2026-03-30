'use client';

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Invoice {
    id: number;
    amount: number;
    month_year: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    due_date: string | null;
    paid_at: string | null;
    created_at: string;
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

    const fetchInvoices = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get('/invoices?limit=50');
            setInvoices(res.data);
        } catch {
            setFetchError("Failed to load invoices. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    // ✅ Derive stats from real data
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const totalCollection = invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + Number(i.amount), 0);
    const totalPending = invoices
        .filter(i => i.status === 'PENDING' || i.status === 'OVERDUE')
        .reduce((sum, i) => sum + Number(i.amount), 0);
    const thisMonth = invoices
        .filter(i => i.month_year === currentMonth)
        .reduce((sum, i) => sum + Number(i.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Billing & Invoices</h2>
                    <p className="text-sm text-muted-foreground">
                        Invoices are auto-generated on the 1st of every month.
                    </p>
                </div>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {/* ✅ Real stats derived from invoice data */}
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
                            {isLoading ? '—' : formatINR(thisMonth)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{currentMonth}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Table */}
            <div className="rounded-md border bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-sm font-medium">Invoices</h3>
                    <p className="text-xs text-muted-foreground">
                        Auto-generated monthly via cron job
                    </p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
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
                                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                    No invoices yet. They are generated automatically on the 1st of each month.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                        #{invoice.id}
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
                                        {invoice.due_date
                                            ? new Date(invoice.due_date).toLocaleDateString()
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {invoice.paid_at
                                            ? new Date(invoice.paid_at).toLocaleDateString()
                                            : '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && invoices.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {invoices.length} invoices
                </p>
            )}
        </div>
    );
}