"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || "Failed to load society settings");
                } else {
                    setError("Failed to load society settings");
                }
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
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to save settings");
            } else {
                setError("Failed to save settings");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = society && (name !== society.name || address !== (society.address || ""));

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your society configuration.</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert>
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Basic information about your society</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Society Name</Label>
                                <Input
                                    placeholder="Enter society name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Textarea
                                    placeholder="Enter society address"
                                    rows={3}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Button
                onClick={handleSave}
                disabled={isLoading || isSaving || !hasChanges}
            >
                {isSaving ? "Saving..." : "Save Settings"}
            </Button>
        </div>
    );
}
