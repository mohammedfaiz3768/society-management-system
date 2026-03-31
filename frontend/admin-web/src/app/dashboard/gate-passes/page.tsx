"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

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
            if (filterUsed !== "all") {
                params.used = filterUsed === "used" ? "true" : "false";
            }
            const res = await api.get('/gate-pass', { params });
            const data = res.data;
            setGatePasses(data.gatePasses ?? data ?? []);
            setTotalPages(data.pagination?.totalPages ?? 1);
            setTotal(data.pagination?.total ?? (data.gatePasses ?? data ?? []).length);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to fetch gate passes");
            } else {
                setFetchError("Failed to fetch gate passes");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchGatePasses();
    }, [user, currentPage, filterUsed]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchGatePasses();
    };

    const statusBadge = (used: boolean) =>
        used ? (
            <Badge variant="secondary">Used</Badge>
        ) : (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
        );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Gate Passes</h2>
                <p className="text-muted-foreground">Manage visitor gate passes across the society</p>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by visitor name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={filterUsed}
                    onValueChange={(v) => {
                        setFilterUsed(v as typeof filterUsed);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="unused">Unused</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleSearch} variant="outline">
                    Search
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Visitor</TableHead>
                            <TableHead>Resident</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>People</TableHead>
                            <TableHead>Valid Until</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex justify-center items-center">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : gatePasses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No gate passes found
                                </TableCell>
                            </TableRow>
                        ) : (
                            gatePasses.map((pass) => (
                                <TableRow key={pass.id}>
                                    <TableCell>
                                        <div className="font-medium">{pass.visitor_name}</div>
                                        <div className="text-sm text-muted-foreground">{pass.visitor_phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{pass.username}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {pass.block && pass.flat_number
                                                ? `${pass.block}-${pass.flat_number}`
                                                : "N/A"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{pass.vehicle_number || "—"}</TableCell>
                                    <TableCell>{pass.number_of_people ?? 1}</TableCell>
                                    <TableCell>{new Date(pass.valid_until).toLocaleDateString()}</TableCell>
                                    <TableCell>{statusBadge(pass.used)}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(pass.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Showing {gatePasses.length} of {total} gate passes
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm px-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
