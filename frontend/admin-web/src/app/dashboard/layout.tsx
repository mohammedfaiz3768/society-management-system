'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

const NAV_ITEMS = [
    {
        label: "Overview",
        links: [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/dashboard/activity", label: "Activity Log" },
            { href: "/dashboard/notifications", label: "Notifications" },
        ]
    },
    {
        label: "Management",
        links: [
            { href: "/dashboard/residents", label: "Residents" },
            { href: "/dashboard/flats", label: "Flats" },
            { href: "/dashboard/staff", label: "Staff" },
            { href: "/dashboard/parking", label: "Parking" },
            { href: "/dashboard/directory", label: "Directory" },
            { href: "/dashboard/invitations", label: "Invitations" },
        ]
    },
    {
        label: "Operations",
        links: [
            { href: "/dashboard/visitors", label: "Visitor Log" },
            { href: "/dashboard/gate", label: "Gate Passes (Overview)" },
            { href: "/dashboard/gate-passes", label: "Gate Passes (All)" },
            { href: "/dashboard/delivery", label: "Delivery" },
            { href: "/dashboard/services", label: "Service Requests" },
            { href: "/dashboard/complaints", label: "Complaints" },
            { href: "/dashboard/sos", label: "SOS Alerts" },
            { href: "/dashboard/emergency-alerts", label: "Emergency Alerts" },
        ]
    },
    {
        label: "Finance",
        links: [
            { href: "/dashboard/billing", label: "Billing & Invoices" },
            { href: "/dashboard/maintenance", label: "Maintenance" },
        ]
    },
    {
        label: "Communication",
        links: [
            { href: "/dashboard/announcements", label: "Announcements" },
            { href: "/dashboard/notices", label: "Notices" },
            { href: "/dashboard/polls", label: "Polls" },
            { href: "/dashboard/documents", label: "Documents" },
        ]
    },
];

function getPageTitle(pathname: string): string {
    const segment = pathname.split('/').pop() || 'dashboard';
    if (segment === 'dashboard') return 'Dashboard';
    return segment
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, logout } = useAuth();
    const [societyName, setSocietyName] = useState('');

    // ✅ Auth guard — redirect if not logged in
    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading, router]);

    // ✅ Fetch society name once
    useEffect(() => {
        if (!user) return;
        api.get('/societies/me')
            .then(res => setSocietyName(res.data.name))
            .catch(() => setSocietyName('UNIFY Admin'));
    }, [user]);

    // ✅ Active link check
    const isActive = (href: string) =>
        href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex h-screen bg-slate-100">
            {/* ✅ Sidebar hidden on mobile */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col flex-shrink-0">
                <div className="p-5 border-b border-slate-800">
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">UNIFY</div>
                    <h1 className="text-base font-semibold text-white truncate">
                        {societyName || 'Loading...'}
                    </h1>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map(section => (
                        <div key={section.label}>
                            <div className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {section.label}
                            </div>
                            {section.links.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${isActive(link.href)
                                            ? 'bg-slate-700 text-white font-medium'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* ✅ Real user name from auth context */}
                <div className="p-3 border-t border-slate-800 space-y-1">
                    <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{user.name || 'Admin'}</div>
                            <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        </div>
                    </Link>
                    {/* ✅ Logout button */}
                    <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto min-w-0">
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    {/* ✅ Dynamic page title from pathname */}
                    <h2 className="text-base font-semibold text-slate-800">
                        {getPageTitle(pathname)}
                    </h2>
                    <div className="flex gap-3 items-center">
                        <Link href="/dashboard/notifications" className="text-sm text-slate-500 hover:text-slate-700">
                            Notifications
                        </Link>
                        <Link href="/dashboard/settings" className="text-sm text-slate-500 hover:text-slate-700">
                            Settings
                        </Link>
                        <Link href="/dashboard/profile" className="text-sm text-slate-500 hover:text-slate-700">
                            Profile
                        </Link>
                    </div>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}