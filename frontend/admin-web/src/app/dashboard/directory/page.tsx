"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/apiUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DirectoryPage() {
    const [residents, setResidents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDirectory();
    }, []);

    const fetchDirectory = async () => {
        try {
            const token = localStorage.getItem("token");

            const [resRes, staffRes] = await Promise.all([
                fetch(buildApiUrl("directory/residents"), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(buildApiUrl("directory/staff"), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (resRes.ok) setResidents(await resRes.json());
            if (staffRes.ok) setStaff(await staffRes.json());
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = (data: any[]) => {
        if (!searchTerm) return data;
        return data.filter((item) =>
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.phone?.includes(searchTerm) ||
            item.flat_number?.toString().includes(searchTerm)
        );
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Society Directory</h1>
                <p className="text-muted-foreground mt-1">Contact information for residents and staff</p>
            </div>

            <Input
                placeholder="Search by name, phone, or flat number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
            />

            <Tabs defaultValue="residents" className="w-full">
                <TabsList>
                    <TabsTrigger value="residents">Residents ({residents.length})</TabsTrigger>
                    <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="residents" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {filterData(residents).map((resident: any) => (
                            <Card key={resident.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{resident.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Flat {resident.flat_number} {resident.block && `• Block ${resident.block}`}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <p className="text-sm">📞 {resident.phone || "N/A"}</p>
                                    {resident.members_count > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            👥 {resident.members_count} family members
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {filterData(residents).length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center text-muted-foreground">
                                No residents found
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="staff" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {filterData(staff).map((member: any) => (
                            <Card key={member.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{member.staff_name || member.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{member.staff_role || member.role}</p>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <p className="text-sm">📞 {member.phone || "N/A"}</p>
                                    {member.shift && <p className="text-sm">🕒 {member.shift}</p>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {filterData(staff).length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center text-muted-foreground">
                                No staff members found
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
