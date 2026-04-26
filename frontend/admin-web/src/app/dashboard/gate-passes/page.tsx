"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Ticket, ChevronLeft, ChevronRight } from "lucide-react";

interface GatePass {
    id: number;
    visitor_name: string;
    visitor_phone: string;
    user_id: number;
    username: string;
    flat_number: string;
    block: string;
    vehicle_number: string | null;
    valid_until: string;
    used: boolean;
    number_of_people?: number;
    created_at: string;
}

export default function GatePassesPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUsed, setFilterUsed] = useState<"all" | "used" | "unused">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const fetchGatePasses = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const params: Record<string, string> = {
                page: currentPage.toString(),
                limit: "50",
                search: searchTerm,
            };
            if (filterUsed !== "all") params.used = filterUsed === "used" ? "true" : "false";
            const res = await api.get('/gate-pass/admin/all', { params });
            const data = res.data;
            setGatePasses(data.gatePasses ?? data ?? []);
            setTotalPages(data.pagination?.totalPages ?? 1);
            setTotal(data.pagination?.total ?? (data.gatePasses ?? data ?? []).length);
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to fetch gate passes");
            else setFetchError("Failed to fetch gate passes");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchGatePasses(); }, [user, currentPage, filterUsed]);

    const handleSearch = () => { setCurrentPage(1); fetchGatePasses(); };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-slate-900">Gate Passes</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Manage visitor gate passes across the society.</p>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            {/* Search + filter */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by visitor name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9 border-slate-200"
                    />
                </div>
                <Select value={filterUsed} onValueChange={(v) => { setFilterUsed(v as typeof filterUsed); setCurrentPage(1); }}>
                    <SelectTrigger className="w-36 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="unused">Unused</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleSearch} variant="outline" className="border-slate-200">
                    Search
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-white">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Visitor</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Resident</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vehicle</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">People</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valid Until</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-5 py-3.5">
                                        <div className="space-y-1.5">
                                            <div className="h-3.5 w-28 bg-slate-50 rounded animate-pulse" />
                                            <div className="h-3 w-20 bg-slate-50 rounded animate-pulse" />
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="space-y-1.5">
                                            <div className="h-3.5 w-24 bg-slate-50 rounded animate-pulse" />
                                            <div className="h-3 w-16 bg-slate-50 rounded animate-pulse" />
                                        </div>
                                    </td>
                                    <td colSpan={5} />
                                </tr>
                            ))
                        ) : gatePasses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Ticket className="w-8 h-8 text-slate-700" />
                                        <p className="text-sm text-slate-500">No gate passes found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            gatePasses.map((pass) => (
                                <tr key={pass.id} className="hover:bg-white/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="font-semibold text-slate-800">{pass.visitor_name}</div>
                                        <div className="text-xs text-slate-500">{pass.visitor_phone}</div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="text-slate-700">{pass.username}</div>
                                        <div className="text-xs text-slate-500">
                                            {pass.block && pass.flat_number ? `${pass.block}-${pass.flat_number}` : "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{pass.vehicle_number || "—"}</td>
                                    <td className="px-5 py-3.5 text-slate-500">{pass.number_of_people ?? 1}</td>
                                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                                        {new Date(pass.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {pass.used ? (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Used
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500">
                                        {new Date(pass.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        Showing <span className="font-semibold text-slate-500">{gatePasses.length}</span> of <span className="font-semibold text-slate-500">{total}</span> gate passes
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-slate-200 gap-1"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Prev
                            </Button>
                            <span className="text-xs text-zinc-500 px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-slate-200 gap-1"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
