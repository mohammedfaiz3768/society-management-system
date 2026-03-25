'use client';

export default function SettingsPage() {
    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

            {/* General Settings */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">General Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Society Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter society name"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Address
                        </label>
                        <textarea
                            placeholder="Enter society address"
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Email Settings */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Email Configuration</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            SMTP Server
                        </label>
                        <input
                            type="text"
                            placeholder="smtp.gmail.com"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Username
                        </label>
                        <input
                            type="email"
                            placeholder="your-email@example.com"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-lg shadow p-6">
                <button className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800">
                    Save Settings
                </button>
            </div>
        </div>
    );
}
