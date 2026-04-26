"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, CheckCircle } from "lucide-react";

interface Society {
    id: number;
    name: string;
    address: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [society, setSociety] = useState<Society | null>(null);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchSociety = async () => {
            setIsLoading(true);
            setError("");
            try {
                const res = await api.get("/societies/me");
                const data: Society = res.data;
                setSociety(data);
                setName(data.name || "");
                setAddress(data.address || "");
            } catch (err) {
                if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to load society settings");
                else setError("Failed to load society settings");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSociety();
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        setError("");
        setSuccess("");
        try {
            const res = await api.put("/societies/me", { name, address });
            const updated: Society = res.data.society ?? res.data;
            setSociety(updated);
            setName(updated.name || name);
            setAddress(updated.address || address);
            setSuccess("Settings saved successfully.");
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || "Failed to save settings");
            else setError("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = society && (name !== society.name || address !== (society.address || ""));

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Manage your society configuration.</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> {success}
                </div>
            )}

            <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-rose-600" />
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">General Settings</h2>
                        <p className="text-xs text-zinc-500">Basic information about your society</p>
                    </div>
                </div>
                <div className="p-6 space-y-5">
                    {isLoading ? (
                        <div className="space-y-4 animate-pulse">
                            <div>
                                <div className="h-3 w-24 bg-slate-50 rounded mb-2" />
                                <div className="h-10 bg-slate-50 rounded-lg" />
                            </div>
                            <div>
                                <div className="h-3 w-16 bg-slate-50 rounded mb-2" />
                                <div className="h-20 bg-slate-50 rounded-lg" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Society Name</Label>
                                <Input
                                    placeholder="Enter society name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="border-slate-200 focus:border-rose-600"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-700">Address</Label>
                                <Textarea
                                    placeholder="Enter society address"
                                    rows={3}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="resize-none border-slate-200 focus:border-rose-600"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Button
                onClick={handleSave}
                disabled={isLoading || isSaving || !hasChanges}
                className="bg-rose-600 hover:bg-rose-600 text-white"
            >
                {isSaving ? "Saving..." : "Save Settings"}
            </Button>
        </div>
    );
}
