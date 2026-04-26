"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Home, ArrowRight } from "lucide-react";

export default function SetupSocietyPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-[3px] border-rose-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (name.trim().length < 3) { setError("Society name must be at least 3 characters"); return; }
        if (name.length > 100) { setError("Society name must be under 100 characters"); return; }
        if (address.length > 300) { setError("Address must be under 300 characters"); return; }

        setIsLoading(true);
        try {
            await api.post('/societies', { name: name.trim(), address: address.trim() || undefined });
            window.location.href = '/dashboard';
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to create society");
            else setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left decorative panel */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0f172a] p-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center">
                        <Home className="w-5 h-5 text-slate-900" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                        UN<span className="text-emerald-400 italic">IFY</span>
                    </span>
                </div>
                <div className="space-y-4">
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Your account is ready. Now set up your society to start managing residents, flats, and more.
                    </p>
                    {[
                        "Add residents and manage flats",
                        "Track visitors and gate passes",
                        "Broadcast announcements",
                        "Handle complaints & maintenance",
                    ].map(f => (
                        <div key={f} className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            </div>
                            {f}
                        </div>
                    ))}
                </div>
                <div />
            </div>

            {/* Right - form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                            <Building2 className="w-7 h-7 text-rose-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">Let's set up your society to get started.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                                Society Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="e.g., Green Valley Apartments"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={100}
                                required
                                className="h-11 border-slate-200 focus:border-rose-600"
                            />
                            {name.length > 80 && (
                                <p className="text-xs text-slate-500 text-right">{name.length}/100</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                                Address <span className="text-slate-500 font-normal text-xs">(optional)</span>
                            </Label>
                            <Textarea
                                id="address"
                                placeholder="Plot 45, Sector 12, Hyderabad"
                                rows={3}
                                maxLength={300}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="resize-none border-slate-200 focus:border-rose-600"
                            />
                            {address.length > 250 && (
                                <p className="text-xs text-slate-500 text-right">{address.length}/300</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-rose-600 hover:bg-rose-600 text-white font-medium"
                            disabled={isLoading || name.trim().length < 3}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Create Society & Continue <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
