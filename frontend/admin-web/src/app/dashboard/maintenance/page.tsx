"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Receipt } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Bill {
    id: number;
    flat_number: string;
    month: number;
    year: number;
    amount: string;
    status: string;
    created_at: string;
}

export default function MaintenancePage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        flat_number: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: "",
        notes: ""
    });

    const fetchBills = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/maintenance');
            setBills(res.data);
        } catch (err) {
            console.error("Failed to fetch bills", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await api.post('/maintenance', {
                ...formData,
                amount: Number(formData.amount)
            });
            setIsDialogOpen(false);
            fetchBills();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create bill");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBills = bills.filter(b =>
        b.flat_number.includes(search) || b.status.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Maintenance</h2>
                    <p className="text-muted-foreground">Manage monthly maintenance bills.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Generate Bill
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Maintenance Bill</DialogTitle>
                            <DialogDescription>Create a bill for a flat.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Flat Number</Label>
                                    <Input
                                        value={formData.flat_number}
                                        onChange={e => setFormData({ ...formData, flat_number: e.target.value })}
                                        required
                                        placeholder="e.g. 101"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount (₹)</Label>
                                    <Input
                                        type="number"
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
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
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
                                    <Input
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Generating..." : "Generate"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Flat</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : filteredBills.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">No bills found</TableCell></TableRow>
                        ) : (
                            filteredBills.map(bill => (
                                <TableRow key={bill.id}>
                                    <TableCell className="font-medium">{bill.flat_number}</TableCell>
                                    <TableCell>{new Date(0, bill.month - 1).toLocaleString('default', { month: 'short' })} {bill.year}</TableCell>
                                    <TableCell>₹{bill.amount}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${bill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {bill.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{new Date(bill.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
