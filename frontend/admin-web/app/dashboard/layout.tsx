'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [societyName, setSocietyName] = useState('Loading...');

    useEffect(() => {
        fetchSocietyInfo();
    }, []);

    const fetchSocietyInfo = async () => {
        try {
            const response = await api.get('/societies/me');
            setSocietyName(response.data.name);
        } catch (err) {
            console.error('Failed to fetch society info', err);
            setSocietyName('SMS Admin'); // Fallback
        }
    };
    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold">{societyName}</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <Link href="/dashboard" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Dashboard
                    </Link>

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">
                        Management
                    </div>
                    <Link href="/dashboard/residents" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Residents
                    </Link>
                    <Link href="/dashboard/staff" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Staff
                    </Link>
                    <Link href="/dashboard/parking" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Parking
                    </Link>

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">
                        Operations
                    </div>
                    <Link href="/dashboard/gate" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Gate & Visitors
                    </Link>
                    <Link href="/dashboard/complaints" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Complaints
                    </Link>

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">
                        Finance
                    </div>
                    <Link href="/dashboard/billing" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Billing & Invoices
                    </Link>
                    <Link href="/dashboard/maintenance" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Maintenance
                    </Link>

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">
                        Communication
                    </div>
                    <Link href="/dashboard/announcements" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Announcements
                    </Link>
                    <Link href="/dashboard/polls" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Polls
                    </Link>
                    <Link href="/dashboard/documents" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Documents
                    </Link>

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">
                        System
                    </div>
                    <Link href="/dashboard/activity" className="block px-4 py-2 rounded-md hover:bg-slate-800">
                        Activity Log
                    </Link>
                </nav>

                <Link href="/dashboard/profile" className="p-4 border-t border-slate-800 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                        <div>
                            <div className="text-sm font-medium">Admin User</div>
                            <div className="text-xs text-slate-400">View Profile</div>
                        </div>
                    </div>
                </Link>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-slate-800">Overview</h2>
                    {/* Header Actions */}
                    <div className="flex gap-4 items-center">
                        <Link href="/dashboard/notifications" className="text-slate-500 hover:text-slate-700 font-medium">
                            Notifications
                        </Link>
                        <Link href="/dashboard/settings" className="text-slate-500 hover:text-slate-700 font-medium">
                            Settings
                        </Link>
                        <Link href="/dashboard/profile" className="text-slate-500 hover:text-slate-700 font-medium">
                            Profile
                        </Link>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
