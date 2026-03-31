"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Flat {
    id: number;
    flat_number: string;
    block: string;
    floor: string;
    owner_name: string | null;
    owner_phone: string | null;
}

const LIMIT = 200;

export default function FlatsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [flats, setFlats] = useState<Flat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({
        flat_number: "",
        block: "",
        floor: "",
    });

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const resetForm = () => {
        setFormData({ flat_number: "", block: "", floor: "" });
        setFormError("");
    };

    const fetchFlats = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get(`/flats?limit=${LIMIT}`);
            setFlats(res.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to load flats");
            } else {
                setFetchError("Failed to load flats");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchFlats();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!formData.flat_number.trim()) {
            setFormError("Flat number is required");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/flats', formData);
            setIsDialogOpen(false);
            resetForm();
            fetchFlats();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to add flat");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Flat Management</h2>
                    <p className="text-muted-foreground mt-1">Manage all flats in your society</p>
                </div>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Flat
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Flat</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
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
                    </DialogContent>
                </Dialog>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-3 flex justify-center items-center py-16">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : flats.length === 0 ? (
                    <Card className="col-span-3">
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No flats added yet. Click &quot;Add Flat&quot; to get started.
                        </CardContent>
                    </Card>
                ) : (
                    flats.map((flat) => (
                        <Card key={flat.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">
                                            {flat.flat_number}
                                            {flat.block && (
                                                <span className="text-muted-foreground text-base ml-2">
                                                    Block {flat.block}
                                                </span>
                                            )}
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
                                            <p className="text-sm text-muted-foreground">
                                                <span aria-hidden="true">📞</span> {flat.owner_phone}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No resident assigned</p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {!isLoading && flats.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {flats.length} flat{flats.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
