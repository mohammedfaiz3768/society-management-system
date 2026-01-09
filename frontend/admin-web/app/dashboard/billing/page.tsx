'use client';

export default function BillingPage() {
    return (
        <div className="max-w-6xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Billing & Invoices</h1>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Total Collection</div>
                    <div className="text-3xl font-bold text-green-600">₹0</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">Pending</div>
                    <div className="text-3xl font-bold text-orange-500">₹0</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-slate-500 mb-1">This Month</div>
                    <div className="text-3xl font-bold text-slate-900">₹0</div>
                </div>
            </div>

            {/* Generate Invoice Button */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Invoices</h2>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800">
                        Generate Invoice
                    </button>
                </div>
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Invoice ID</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Resident</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-500">
                                    No invoices yet
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
