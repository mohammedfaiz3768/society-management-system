"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";

export default function SetupSocietyPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ✅ Auth guard — redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // ✅ Show spinner while auth resolves
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // ✅ Client-side validation
        if (name.trim().length < 3) {
            setError("Society name must be at least 3 characters");
            return;
        }
        if (name.length > 100) {
            setError("Society name must be under 100 characters");
            return;
        }
        if (address.length > 300) {
            setError("Address must be under 300 characters");
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/societies', { name: name.trim(), address: address.trim() || undefined });

            // ✅ Full reload so AuthProvider re-fetches user with updated is_first_login
            window.location.href = '/dashboard';

        } catch (err) {
            // ✅ Typed error
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to create society");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 to-cyan-800 px-4">
            <Card className="w-full max-w-lg border border-zinc-200 shadow-sm">
                <CardHeader className="space-y-1 pb-4">
                    <div className="flex items-center justify-center mb-4">
                        {/* ✅ Fixed gradient class */}
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                    </CardTitle>
                    <CardDescription className="text-center">
                        Let's set up your society to get started
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Society Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="e.g., Green Valley Apartments"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={100}
                                required
                            />
                            {/* ✅ Character count hint */}
                            {name.length > 80 && (
                                <p className="text-xs text-zinc-400 text-right">{name.length}/100</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">
                                Address <span className="text-zinc-400 text-xs font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                id="address"
                                placeholder="Plot 45, Sector 12, Hyderabad"
                                rows={3}
                                maxLength={300}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            {address.length > 250 && (
                                <p className="text-xs text-zinc-400 text-right">{address.length}/300</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || name.trim().length < 3}
                        >
                            {isLoading ? "Creating..." : "Create Society & Continue →"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}