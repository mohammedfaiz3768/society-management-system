'use client';

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GatePass {
    id: number;
    visitor_name: string;
    visitor_phone: string;
    flat_number: string;
    block: string;
    vehicle_number: string | null;
    valid_until: string;
    status: string;
    number_of_people?: number;
    created_at: string;
    purpose?: string;
}

type FilterType = "all" | "used" | "unused";

function getPassStatus(pass: GatePass) {
    if (pass.status === 'EXITED' || pass.status === 'USED') return 'used';
    if (pass.status === 'EXPIRED' || new Date(pass.valid_until) < new Date()) return 'expired';
    return 'active';
}

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    used: 'bg-blue-100 text-blue-800',
};

export default function GatePage() {
    const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUsed, setFilterUsed] = useState<FilterType>("all");

    const fetchGatePasses = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get('/gate-pass/admin/all', {
                params: { page: 1, limit: 50 }
            });
            const data = res.data;
            setGatePasses(data.gatePasses ?? (Array.isArray(data) ? data : []));
        } catch {
            setError("Failed to fetch gate passes");
            setGatePasses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGatePasses(); }, []);

    // ✅ Client-side filtering — search + status filter
    const filtered = gatePasses.filter(pass => {
        const status = getPassStatus(pass);
        const matchesFilter =
            filterUsed === "all" ||
            (filterUsed === "unused" && status === "active") ||
            (filterUsed === "used" && status === "used");

        const matchesSearch = !searchTerm ||
            pass.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pass.visitor_phone?.includes(searchTerm) ||
            pass.flat_number?.includes(searchTerm);

        return matchesFilter && matchesSearch;
    });

    // ✅ Derived stats
    const activeCount = gatePasses.filter(p => getPassStatus(p) === 'active').length;
    const todayCount = gatePasses.filter(p => {
        return new Date(p.created_at).toDateString() === new Date().toDateString();
    }).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Gate & Visitors</h2>
                <p className="text-sm text-muted-foreground">Monitor all gate passes and visitor activity.</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* ✅ Stats using Card components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Active Passes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Today&apos;s Visitors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Total Passes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{gatePasses.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* ✅ Search + filters using shadcn components */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search visitor, phone, flat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "unused", "used"] as FilterType[]).map((f) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filterUsed === f ? "default" : "outline"}
                            onClick={() => setFilterUsed(f)}
                        >
                            {f === "all" ? "All" : f === "unused" ? "Active" : "Used"}
                        </Button>
                    ))}
                </div>
                <Button size="sm" variant="outline" onClick={fetchGatePasses}>
                    Refresh
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Visitor</TableHead>
                            <TableHead>Flat</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>People</TableHead>
                            <TableHead>Valid Until</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                    {searchTerm || filterUsed !== "all" ? "No passes match your filters." : "No gate passes found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((pass) => {
                                const status = getPassStatus(pass);
                                return (
                                    <TableRow key={pass.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{pass.visitor_name}</div>
                                            <div className="text-xs text-muted-foreground">{pass.visitor_phone}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {pass.block && pass.flat_number
                                                ? `${pass.block}-${pass.flat_number}`
                                                : pass.flat_number || '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {pass.vehicle_number || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {pass.number_of_people || 1}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {/* ✅ Show date AND time — time matters for gate passes */}
                                            {new Date(pass.valid_until).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {/* ✅ Three status states: active, expired, used */}
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[status]}`}>
                                                {status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {!loading && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {gatePasses.length} passes
                </p>
            )}
        </div>
    );
}