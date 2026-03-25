"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/apiUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterSocietyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);

    const [formData, setFormData] = useState({
        society_name: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        total_units: "",
        admin_name: "",
        admin_email: "",
        admin_phone: "",
        terms: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === "society_name") setIsNameAvailable(null);
    };

    const checkAvailability = async () => {
        if (!formData.society_name) return;
        try {
            const res = await fetch(buildApiUrl(`registration/check-availability?name=${encodeURIComponent(formData.society_name)}`));
            const data = await res.json();
            setIsNameAvailable(data.available);
            if (!data.available) setError("Society name is already taken");
            else setError("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.terms) {
            setError("Please accept the terms and conditions");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(buildApiUrl("registration/register"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            setStep(2); // Success step
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl font-bold text-green-600">@</span>
                        </div>
                        <CardTitle>Verify Your Email</CardTitle>
                        <CardDescription>
                            We've sent a verification link to <strong>{formData.admin_email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-6">
                            Please check your inbox and click the link to activate your society account and start your free trial.
                        </p>
                        <Alert>
                            <AlertDescription>
                                Link expires in 24 hours. Check spam folder if not received.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Resend Email
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Register Your Society</CardTitle>
                    <CardDescription>
                        Start your 30-day free trial. No credit card required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Society Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="society_name">Society Name</Label>
                                    <div className="relative">
                                        <Input
                                            id="society_name"
                                            name="society_name"
                                            required
                                            value={formData.society_name}
                                            onChange={handleChange}
                                            onBlur={checkAvailability}
                                            className={isNameAvailable === true ? "border-green-500" : isNameAvailable === false ? "border-red-500" : ""}
                                        />
                                        {isNameAvailable === true && (
                                            <span className="absolute right-3 top-2.5 text-green-500 text-sm font-bold">OK</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="total_units">Total Flats/Units</Label>
                                    <Input
                                        id="total_units"
                                        name="total_units"
                                        type="number"
                                        required
                                        value={formData.total_units}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        name="state"
                                        required
                                        value={formData.state}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        required
                                        value={formData.pincode}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium">Admin Contact</h3>
                            <div className="space-y-2">
                                <Label htmlFor="admin_name">Your Full Name</Label>
                                <Input
                                    id="admin_name"
                                    name="admin_name"
                                    required
                                    value={formData.admin_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin_email">Email Address</Label>
                                    <Input
                                        id="admin_email"
                                        name="admin_email"
                                        type="email"
                                        required
                                        placeholder="you@example.com"
                                        value={formData.admin_email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin_phone">Phone Number</Label>
                                    <Input
                                        id="admin_phone"
                                        name="admin_phone"
                                        required
                                        value={formData.admin_phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <Checkbox
                                id="terms"
                                checked={formData.terms}
                                onCheckedChange={(checked) => setFormData({ ...formData, terms: checked as boolean })}
                            />
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I agree to the terms and conditions and privacy policy
                            </label>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Society Account"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-500">
                        Already registered? <Link href="/login" className="text-blue-600 hover:underline">Login here</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
