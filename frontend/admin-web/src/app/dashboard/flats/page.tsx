"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Flat {
    id: number;
    flat_number: string;
    block: string;
    floor: string;
    owner_name: string | null;
    owner_phone: string | null;
}

export default function FlatsPage() {
    const [flats, setFlats] = useState<Flat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        flat_number: "",
        block: "",
        floor: "",
    });

    useEffect(() => {
        fetchFlats();
    }, []);

    const fetchFlats = async () => {
        try {
            const res = await api.get('/flats/all');
            setFlats(res.data);
        } catch {
            setError("Failed to load flats");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // ✅ Client-side validation
        if (!formData.flat_number.trim()) {
            setError("Flat number is required");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/flats/create', formData);
            setShowForm(false);
            setFormData({ flat_number: "", block: "", floor: "" });
            fetchFlats();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to add flat");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Flat Management</h1>
                    <p className="text-muted-foreground mt-1">Manage all flats in your society</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Add Flat"}
                </Button>
            </div>

            {/* ✅ Error display */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Flat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="flat-number">Flat Number *</Label>
                                    <Input
                                        id="flat-number"
                                        value={formData.flat_number}
                                        onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
                                        placeholder="101"
                                        maxLength={20}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="flat-block">Block</Label>
                                    <Input
                                        id="flat-block"
                                        value={formData.block}
                                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                                        placeholder="A"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="flat-floor">Floor</Label>
                                    <Input
                                        id="flat-floor"
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        placeholder="1"
                                        type="number"
                                        min={0}
                                        max={200}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Flat"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {flats.map((flat) => (
                    <Card key={flat.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">
                                        {flat.flat_number}
                                        {flat.block && <span className="text-muted-foreground text-base ml-2">Block {flat.block}</span>}
                                    </CardTitle>
                                    {flat.floor && (
                                        <p className="text-sm text-muted-foreground mt-1">Floor {flat.floor}</p>
                                    )}
                                </div>
                                <Badge variant={flat.owner_name ? "default" : "secondary"}>
                                    {flat.owner_name ? "Occupied" : "Vacant"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {flat.owner_name ? (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{flat.owner_name}</p>
                                    {flat.owner_phone && (
                                        <p className="text-sm text-muted-foreground">📞 {flat.owner_phone}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No resident assigned</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {flats.length === 0 && (
                    <Card className="col-span-3">
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No flats added yet. Click &quot;+ Add Flat&quot; to get started.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
