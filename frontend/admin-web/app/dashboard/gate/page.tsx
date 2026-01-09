'use client';

export default function GatePage() {
    return (
        <div className="max-w-6xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Gate & Visitors</h1>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Active Visitors</div>
                    <div className="text-3xl font-bold text-slate-900">0</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Today's Visitors</div>
                    <div className="text-3xl font-bold text-slate-900">0</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Pending Approvals</div>
                    <div className="text-3xl font-bold text-orange-500">0</div>
                </div>
            </div>

            {/* Active Visitors */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Active Visitors</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Visitor Name</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Flat</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Entry Time</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Purpose</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-500">
                                    No active visitors
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Visitor Logs */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Visitor Logs</h2>
                <div className="text-slate-500 text-center py-8">
                    No visitor logs yet
                </div>
            </div>
        </div>
    );
}
