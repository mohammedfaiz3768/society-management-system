'use client';

import { useState } from 'react';

export default function NotificationsPage() {
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('all');

    const handleSend = async () => {
        // TODO: Implement send notification API call
        alert(`Sending notification to ${target}: ${message}`);
        setMessage('');
    };

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Notifications</h1>

            {/* Send Notification Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Send Notification</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Target
                        </label>
                        <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        >
                            <option value="all">All Residents</option>
                            <option value="block_a">Block A</option>
                            <option value="block_b">Block B</option>
                            <option value="block_c">Block C</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter notification message"
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!message}
                        className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
                    >
                        Send Notification
                    </button>
                </div>
            </div>

            {/* Notification History */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Notification History</h2>
                <div className="text-slate-500 text-center py-8">
                    No notifications sent yet
                </div>
            </div>
        </div>
    );
}
