"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";

export default function SetupSocietyPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await api.post('/societies', { name, address });

            // Society created successfully, redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create society");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-gradient-to-br from-teal-900 to-cyan-700 px-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-linear-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Welcome!</CardTitle>
                    <CardDescription className="text-center">
                        Let's set up your society management system
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
                            <Label htmlFor="name">Society Name *</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="e.g., Green Valley Apartments"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Textarea
                                id="address"
                                placeholder="Enter society address"
                                rows={3}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Society & Continue"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
