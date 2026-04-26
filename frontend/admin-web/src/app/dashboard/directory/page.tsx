"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Phone, Clock, Users, UserCog, BookUser } from "lucide-react";

interface Resident {
    id: number;
    name: string;
    phone: string | null;
    flat_number: string;
    block: string;
    members_count: number;
}

interface StaffMember {
    id: number;
    name: string;
    role: string;
    phone: string | null;
    shift_start?: string;
    shift_end?: string;
    status: string;
}

const AVATAR_COLORS = ['bg-rose-600', 'bg-rose-600', 'bg-purple-500', 'bg-orange-500', 'bg-blue-500'];
function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
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

    const filteredResidents = residents.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            item.name?.toLowerCase().includes(term) ||
            item.phone?.includes(searchTerm) ||
            String(item.flat_number || "").includes(searchTerm)
        );
    });

    const filteredStaff = staff.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            item.name?.toLowerCase().includes(term) ||
            item.role?.toLowerCase().includes(term) ||
            item.phone?.includes(searchTerm)
        );
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-slate-900">Society Directory</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Contact information for residents and staff.</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search by name, phone, or flat number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-slate-200"
                />
            </div>

            <Tabs defaultValue="residents" className="w-full">
                <TabsList className="bg-slate-50">
                    <TabsTrigger value="residents" className="gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Residents ({residents.length})
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="gap-1.5">
                        <UserCog className="w-3.5 h-3.5" /> Staff ({staff.length})
                    </TabsTrigger>
                </TabsList>

                {/* Residents Tab */}
                <TabsContent value="residents" className="mt-4">
                    {loading ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex-shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3.5 w-32 bg-slate-50 rounded" />
                                            <div className="h-3 w-20 bg-slate-50 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredResidents.length === 0 ? (
                        <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                                <BookUser className="w-6 h-6 text-slate-500" />
                            </div>
                            <p className="text-sm text-slate-500">
                                {searchTerm ? "No residents match your search." : "No residents found."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {filteredResidents.map((resident) => (
                                <div key={resident.id} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${avatarColor(resident.name)} flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0`}>
                                            {resident.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{resident.name}</p>
                                            <p className="text-xs text-slate-500">
                                                Flat {resident.flat_number}
                                                {resident.block && <span> آ· Block {resident.block}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    {(resident.phone || Number(resident.members_count) > 0) && (
                                        <div className="mt-3 pt-3 border-t border-zinc-50 space-y-1">
                                            {resident.phone && (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                    {resident.phone}
                                                </div>
                                            )}
                                            {Number(resident.members_count) > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {resident.members_count} family member{Number(resident.members_count) !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Staff Tab */}
                <TabsContent value="staff" className="mt-4">
                    {loading ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex-shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3.5 w-28 bg-slate-50 rounded" />
                                            <div className="h-3 w-16 bg-slate-50 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-14 flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                                <UserCog className="w-6 h-6 text-slate-500" />
                            </div>
                            <p className="text-sm text-slate-500">
                                {searchTerm ? "No staff match your search." : "No staff members found."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {filteredStaff.map((member) => (
                                <div key={member.id} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${avatarColor(member.name)} flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0`}>
                                            {member.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{member.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{member.role.replace(/_/g, ' ')}</p>
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${member.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-zinc-500'}`}>
                                            {member.status}
                                        </span>
                                    </div>
                                    {(member.phone || (member.shift_start && member.shift_end)) && (
                                        <div className="mt-3 pt-3 border-t border-zinc-50 space-y-1">
                                            {member.phone && (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                    {member.phone}
                                                </div>
                                            )}
                                            {member.shift_start && member.shift_end && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {member.shift_start} - {member.shift_end}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {!loading && (
                <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-500">{filteredResidents.length + filteredStaff.length}</span> results shown
                </p>
            )}
        </div>
    );
}
