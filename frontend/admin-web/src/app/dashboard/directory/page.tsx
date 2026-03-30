"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search } from "lucide-react";

interface Resident {
    id: number;
    name: string;
    phone: string | null; // ✅ null when non-admin views
    flat_number: string;
    block: string;
    members_count: number;
}

// ✅ Matches actual backend response
interface StaffMember {
    id: number;
    name: string;
    role: string;
    phone: string | null;
    shift_start?: string;
    shift_end?: string;
    status: string;
}

export default function DirectoryPage() {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDirectory = async () => {
        try {
            const [resRes, staffRes] = await Promise.all([
                api.get('/directory/residents'),
                api.get('/directory/staff'),
            ]);
            setResidents(resRes.data);
            setStaff(staffRes.data);
        } catch {
            setError("Failed to load directory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDirectory(); }, []);

    const filterResidents = (data: Resident[]) => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(item =>
            item.name?.toLowerCase().includes(term) ||
            item.phone?.includes(searchTerm) ||
            String(item.flat_number || "").includes(searchTerm)
        );
    };

    const filterStaff = (data: StaffMember[]) => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(item =>
            item.name?.toLowerCase().includes(term) ||
            item.role?.toLowerCase().includes(term) ||
            item.phone?.includes(searchTerm)
        );
    };

    // ✅ Spinner inside layout
    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const filteredResidents = filterResidents(residents);
    const filteredStaff = filterStaff(staff);

    return (
        // ✅ No p-6
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Society Directory</h2>
                <p className="text-sm text-muted-foreground">
                    Contact information for residents and staff.
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* ✅ Search with icon — consistent with other pages */}
            <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, phone, or flat number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>

            <Tabs defaultValue="residents" className="w-full">
                <TabsList>
                    <TabsTrigger value="residents">
                        Residents ({residents.length})
                    </TabsTrigger>
                    <TabsTrigger value="staff">
                        Staff ({staff.length})
                    </TabsTrigger>
                </TabsList>

                {/* Residents Tab */}
                <TabsContent value="residents" className="mt-4">
                    {filteredResidents.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-sm text-muted-foreground">
                                {searchTerm ? "No residents match your search." : "No residents found."}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {filteredResidents.map((resident) => (
                                <Card key={resident.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{resident.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Flat {resident.flat_number}
                                            {resident.block && ` · Block ${resident.block}`}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        {/* ✅ Only show phone if not null — backend hides for non-admins */}
                                        {resident.phone && (
                                            <p className="text-sm flex items-center gap-1.5">
                                                <span aria-hidden="true">📞</span>
                                                {resident.phone}
                                            </p>
                                        )}
                                        {Number(resident.members_count) > 0 && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span aria-hidden="true">👥</span>
                                                {resident.members_count} family member{Number(resident.members_count) !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Staff Tab */}
                <TabsContent value="staff" className="mt-4">
                    {filteredStaff.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-sm text-muted-foreground">
                                {searchTerm ? "No staff match your search." : "No staff members found."}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {filteredStaff.map((member) => (
                                <Card key={member.id}>
                                    <CardHeader className="pb-2">
                                        {/* ✅ No more staff_name/staff_role fallback — clean interface */}
                                        <CardTitle className="text-base">{member.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {member.role.replace(/_/g, ' ')}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        {member.phone && (
                                            <p className="text-sm flex items-center gap-1.5">
                                                <span aria-hidden="true">📞</span>
                                                {member.phone}
                                            </p>
                                        )}
                                        {/* ✅ shift_start/shift_end instead of shift */}
                                        {member.shift_start && member.shift_end && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span aria-hidden="true">🕒</span>
                                                {member.shift_start} – {member.shift_end}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {!loading && (
                <p className="text-xs text-muted-foreground">
                    {filteredResidents.length + filteredStaff.length} results shown
                </p>
            )}
        </div>
    );
}