"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/apiUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function FlatsPage() {
    const [flats, setFlats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
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
            const token = localStorage.getItem("token");
            const res = await fetch(buildApiUrl("flats/all"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setFlats(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(buildApiUrl("flats/create"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ flat_number: "", block: "", floor: "" });
                fetchFlats();
            }
        } catch (error) {
            console.error("Error:", error);
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

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Flat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Flat Number *</label>
                                    <Input
                                        value={formData.flat_number}
                                        onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
                                        placeholder="101"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Block</label>
                                    <Input
                                        value={formData.block}
                                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                                        placeholder="A"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Floor</label>
                                    <Input
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        placeholder="1"
                                        type="number"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Add Flat</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {flats.map((flat: any) => (
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
                            No flats added yet. Click "+ Add Flat" to get started.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
