'use client';

import { useState, useEffect } from "react";
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

export default function GatePage() {
    const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterUsed, setFilterUsed] = useState<"all" | "used" | "unused">("all");

    useEffect(() => {
        fetchGatePasses();
    }, [filterUsed]);

    const fetchGatePasses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: "1",
                limit: "100",
                search: searchTerm,
            });

            if (filterUsed !== "all") {
                params.append("used", filterUsed === "used" ? "true" : "false");
            }

            const token = localStorage.getItem("token");
            const response = await fetch(`/api/gate-pass/admin/all?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch gate passes");

            const data = await response.json();
            setGatePasses(data.gatePasses || []);
        } catch (error) {
            console.error("Error fetching gate passes:", error);
            setGatePasses([]);
        } finally {
            setLoading(false);
        }
    };

    const activeCount = gatePasses.filter(p => !p.used && new Date(p.valid_until) > new Date()).length;
    const todayCount = gatePasses.filter(p => {
        const created = new Date(p.created_at);
        const today = new Date();
        return created.toDateString() === today.toDateString();
    }).length;

    return (
        <div className="max-w-6xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Gate & Visitors</h1>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Active Visitors</div>
                    <div className="text-3xl font-bold text-slate-900">{activeCount}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Today's Visitors</div>
                    <div className="text-3xl font-bold text-slate-900">{todayCount}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Total Gate Passes</div>
                    <div className="text-3xl font-bold text-orange-500">{gatePasses.length}</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by visitor name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchGatePasses()}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterUsed("all")}
                            className={`px-4 py-2 rounded-lg font-medium ${filterUsed === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterUsed("unused")}
                            className={`px-4 py-2 rounded-lg font-medium ${filterUsed === "unused" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterUsed("used")}
                            className={`px-4 py-2 rounded-lg font-medium ${filterUsed === "used" ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-700"
                                }`}
                        >
                            Used
                        </button>
                    </div>
                    <button
                        onClick={fetchGatePasses}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Gate Passes Table */}
            <div className="bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold p-6 border-b">All Gate Passes</h2>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : gatePasses.length === 0 ? (
                        <div className="text-slate-500 text-center py-12">
                            No gate passes found
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Visitor</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Resident/Flat</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Vehicle</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">People</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Valid Until</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {gatePasses.map((pass) => (
                                    <tr key={pass.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-900">{pass.visitor_name}</div>
                                            <div className="text-sm text-gray-500">{pass.visitor_phone}</div>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            <div className="text-gray-900">{pass.username}</div>
                                            <div className="text-gray-500">
                                                {pass.block && pass.flat_number ? `${pass.block}-${pass.flat_number}` : "N/A"}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            {pass.vehicle_number || "-"}
                                        </td>
                                        <td className="py-3 px-4">
                                            {pass.number_of_people && pass.number_of_people > 1 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {pass.number_of_people}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-500">1</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            {new Date(pass.valid_until).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            {pass.used ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Used
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
