"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw, LogOut } from "lucide-react";

interface Visitor {
    id: number;
    name: string;
    phone: string;
    purpose: string;
    flat_number: string;
    in_time: string;
    out_time: string | null;
    approved: boolean | null;
    resident_name: string | null;
}

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [exitingId, setExitingId] = useState<number | null>(null);

    const fetchVisitors = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await api.get("/visitors?limit=100");
            setVisitors(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to load visitors");
            } else {
                setError("Failed to load visitors");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const handleExit = async (id: number) => {
        if (!confirm("Mark this visitor as exited?")) return;
        setExitingId(id);
        try {
            await api.put(`/visitors/exit/${id}`);
            setVisitors(prev =>
                prev.map(v => v.id === id ? { ...v, out_time: new Date().toISOString() } : v)
            );
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to mark exit");
            } else {
                setError("Failed to mark exit");
            }
        } finally {
            setExitingId(null);
        }
    };

    const filtered = visitors.filter(v => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            v.name?.toLowerCase().includes(q) ||
            v.phone?.includes(q) ||
            v.flat_number?.includes(q) ||
            v.purpose?.toLowerCase().includes(q)
        );
    });

    const insideNow = visitors.filter(v => !v.out_time).length;
    const todayCount = visitors.filter(v => {
        return new Date(v.in_time).toDateString() === new Date().toDateString();
    }).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Visitor Log</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    All walk-in visitors logged by guards at the gate.
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Currently Inside
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{insideNow}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Today's Visitors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Total Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-600">{visitors.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Refresh */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name, phone, flat..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={fetchVisitors}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Visitor</TableHead>
                            <TableHead>Flat</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Entry Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
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
                                    {search ? "No visitors match your search." : "No visitor records found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(visitor => (
                                <TableRow key={visitor.id}>
                                    <TableCell>
                                        <div className="font-medium text-sm">{visitor.name}</div>
                                        <div className="text-xs text-muted-foreground">{visitor.phone}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{visitor.flat_number}</TableCell>
                                    <TableCell className="text-sm max-w-[180px] truncate">
                                        {visitor.purpose || "—"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(visitor.in_time).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {visitor.out_time ? (
                                            <Badge variant="secondary">Exited</Badge>
                                        ) : (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                Inside
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {!visitor.out_time ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={exitingId === visitor.id}
                                                onClick={() => handleExit(visitor.id)}
                                            >
                                                <LogOut className="h-3 w-3 mr-1" />
                                                {exitingId === visitor.id ? "..." : "Exit"}
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(visitor.out_time).toLocaleTimeString()}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {visitors.length} records
                </p>
            )}
        </div>
    );
}
