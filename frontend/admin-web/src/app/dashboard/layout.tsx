'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import {
    LayoutDashboard, Activity, Bell, Users, Building2, UserCog, Car,
    BookOpen, Mail, UserCheck, Shield, Key, Package, Wrench,
    MessageSquare, AlertTriangle, Zap, CreditCard, Hammer,
    Megaphone, FileText, BarChart2, FileIcon, LogOut, Settings,
    ChevronRight, Home, Menu, X, Search, Sparkles
} from 'lucide-react';

type NavLink = { href: string; label: string; icon: React.ElementType; };
type NavSection = { label: string; links: NavLink[]; };

const NAV_ITEMS: NavSection[] = [
    {
        label: "Overview",
        links: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/dashboard/activity", label: "Activity Log", icon: Activity },
            { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
        ]
    },
    {
        label: "Management",
        links: [
            { href: "/dashboard/residents", label: "Residents", icon: Users },
            { href: "/dashboard/flats", label: "Flats", icon: Building2 },
            { href: "/dashboard/staff", label: "Staff", icon: UserCog },
            { href: "/dashboard/parking", label: "Parking", icon: Car },
            { href: "/dashboard/directory", label: "Directory", icon: BookOpen },
            { href: "/dashboard/invitations", label: "Invitations", icon: Mail },
        ]
    },
    {
        label: "Operations",
        links: [
            { href: "/dashboard/visitors", label: "Visitor Log", icon: UserCheck },
            { href: "/dashboard/gate", label: "Gate Passes", icon: Shield },
            { href: "/dashboard/gate-passes", label: "All Passes", icon: Key },
            { href: "/dashboard/delivery", label: "Delivery", icon: Package },
            { href: "/dashboard/services", label: "Services", icon: Wrench },
            { href: "/dashboard/complaints", label: "Complaints", icon: MessageSquare },
            { href: "/dashboard/sos", label: "SOS Alerts", icon: AlertTriangle },
            { href: "/dashboard/emergency-alerts", label: "Emergency Alerts", icon: Zap },
        ]
    },
    {
        label: "Finance",
        links: [
            { href: "/dashboard/billing", label: "Billing & Invoices", icon: CreditCard },
            { href: "/dashboard/maintenance", label: "Maintenance", icon: Hammer },
        ]
    },
    {
        label: "Communication",
        links: [
            { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
            { href: "/dashboard/notices", label: "Notices", icon: FileText },
            { href: "/dashboard/polls", label: "Polls", icon: BarChart2 },
            { href: "/dashboard/documents", label: "Documents", icon: FileIcon },
        ]
    },
];

function avatarInitial(name: string | undefined | null) {
    return name?.charAt(0)?.toUpperCase() || 'A';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, logout } = useAuth();
    const [societyName, setSocietyName] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user) return;
        api.get('/societies/me')
            .then(res => setSocietyName(res.data.name))
            .catch(() => setSocietyName('UNIFY Platform'));
    }, [user]);

    const isActive = (href: string) =>
        href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-3xl bg-white border border-white/50 flex items-center justify-center shadow-2xl"
                >
                    <Home className="w-8 h-8 text-rose-500" />
                </motion.div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-[#F5F5F7] text-slate-800 relative selection:bg-rose-500/20">

            {/* Ambient Background Glows */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-5%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-pink-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ── Pristine White Floating Sidebar ── */}
            <motion.aside
                initial={false}
                animate={{ x: sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : '-120%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`
                    fixed md:relative z-50 md:z-auto
                    w-[280px] h-[calc(100vh-32px)] my-4 ml-4 flex flex-col flex-shrink-0 rounded-[2.5rem]
                    bg-white/80 border border-white shadow-[0_8px_40px_rgba(0,0,0,0.03)] backdrop-blur-2xl
                `}
            >
                {/* Logo Area */}
                <div className="relative px-8 py-8 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <motion.div 
                            whileHover={{ rotate: 90, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center shadow-[0_8px_20px_rgba(244,63,94,0.3)] flex-shrink-0"
                        >
                            <Sparkles className="w-6 h-6 text-white" />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-slate-900 text-xl tracking-tight">
                                UN<span className="text-rose-500">IFY</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-1 tracking-widest font-medium uppercase" title={societyName}>
                                {societyName || 'SYSTEM'}
                            </div>
                        </div>
                        <button
                            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="relative flex-1 px-4 py-6 overflow-y-auto styled-scrollbar space-y-6">
                    {NAV_ITEMS.map((section, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={section.label}
                        >
                            <div className="px-4 pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                {section.label}
                            </div>
                            <div className="space-y-1">
                                {section.links.map(link => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                                relative flex items-center gap-3.5 px-4 py-2.5 rounded-[1.2rem] text-[13px] font-bold
                                                transition-all duration-300 group overflow-hidden
                                                ${active ? 'text-white shadow-[0_8px_20px_rgba(244,63,94,0.25)]' : 'text-slate-500 hover:text-slate-900'}
                                            `}
                                        >
                                            {/* Hover/Active Background */}
                                            {active && (
                                                <motion.div 
                                                    layoutId="sidebar-active"
                                                    className="absolute inset-0 bg-rose-500 rounded-[1.2rem]"
                                                />
                                            )}
                                            {!active && (
                                                <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.2rem]" />
                                            )}
                                            
                                            <Icon className={`w-[18px] h-[18px] flex-shrink-0 relative z-10 transition-transform duration-300 ${active ? 'text-white scale-110 drop-shadow-sm' : 'text-slate-400 group-hover:text-rose-500 group-hover:scale-110'}`} />
                                            <span className="truncate flex-1 relative z-10 tracking-wide">{link.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </nav>

                {/* Profile Footer */}
                <div className="p-4 border-t border-slate-100">
                    <div className="p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 group hover:bg-slate-50 transition-all duration-300 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Link href="/dashboard/profile" className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-400 p-[1px] shadow-sm">
                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-sm font-bold text-rose-600">
                                    {avatarInitial(user.name)}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-slate-900 truncate">{user.name || 'Admin'}</div>
                                <div className="text-[11px] text-slate-500 truncate mt-0.5 tracking-wide">{user.email}</div>
                            </div>
                        </Link>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/60 relative z-10">
                            <Link href="/dashboard/settings" className="flex-1 flex justify-center py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all shadow-sm">
                                <Settings className="w-4 h-4" />
                            </Link>
                            <button onClick={logout} className="flex-1 flex justify-center py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* ── Main Area ── */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10 scrollbar-hide">
                
                {/* Floating Glass Header */}
                <header className="px-4 py-4 md:px-8 flex-shrink-0 z-30">
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="h-[72px] rounded-[2rem] flex items-center justify-between px-6 bg-white/80 border border-white backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="hidden md:flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Current View</span>
                                <span className="text-lg font-extrabold text-slate-800 capitalize tracking-tight">{pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-[1.2rem] border border-slate-100 focus-within:border-rose-300 focus-within:ring-4 ring-rose-50 transition-all w-64 shadow-inner">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium" />
                            </div>
                            <Link
                                href="/dashboard/notifications"
                                className="relative w-11 h-11 flex items-center justify-center rounded-[1.2rem] bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-100 shadow-sm transition-all group overflow-hidden"
                            >
                                <Bell className="w-[18px] h-[18px] relative z-10 group-hover:rotate-12 transition-transform" />
                                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-white" />
                            </Link>
                        </div>
                    </motion.div>
                </header>

                {/* Animated Page Transitions */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 styled-scrollbar relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="min-h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
