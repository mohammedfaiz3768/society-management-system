"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { MailCheck } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;
const pincodeRegex = /^[0-9]{6}$/;

export default function RegisterSocietyPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendSuccess, setResendSuccess] = useState(false);
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
        terms: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === "society_name") setIsNameAvailable(null);
    };

    const checkAvailability = async () => {
        // ✅ Minimum 3 chars before checking
        if (!formData.society_name || formData.society_name.length < 3) return;
        try {
            // ✅ Use axios instance — consistent with rest of app
            const res = await api.get(`/registration/check-availability?name=${encodeURIComponent(formData.society_name)}`);
            setIsNameAvailable(res.data.available);
            setError(res.data.available ? "" : "Society name is already taken");
        } catch {
            // Silent — don't block user on availability check failure
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // ✅ Client-side validation
        if (!emailRegex.test(formData.admin_email)) {
            setError("Please enter a valid email address");
            return;
        }
        if (formData.admin_phone && !phoneRegex.test(formData.admin_phone)) {
            setError("Phone number must be 10 digits");
            return;
        }
        if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
            setError("Pincode must be 6 digits");
            return;
        }
        if (isNameAvailable === false) {
            setError("Please choose a different society name");
            return;
        }
        if (!formData.terms) {
            setError("Please accept the terms and conditions");
            return;
        }

        setLoading(true);
        try {
            // ✅ Use axios instance
            await api.post('/registration/register', formData);
            setStep(2);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || "Registration failed. Please try again.");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendSuccess(false);
        try {
            await api.post('/registration/resend-verification', { email: formData.admin_email });
            setResendSuccess(true);
        } catch {
            setError("Failed to resend verification email. Please try again.");
        }
    };

    // ── Success Step ────────────────────────────────────────────────────────
    if (step === 2) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
                <Card className="w-full max-w-md text-center border border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-4">
                            {/* ✅ Proper icon */}
                            <MailCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle>Check Your Email</CardTitle>
                        <CardDescription>
                            We sent a verification link to <strong>{formData.admin_email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-zinc-500">
                            Click the link to activate your society and start your 30-day free trial.
                            The link expires in 24 hours.
                        </p>
                        <Alert>
                            <AlertDescription className="text-xs">
                                Didn't receive it? Check your spam folder or resend below.
                            </AlertDescription>
                        </Alert>
                        {resendSuccess && (
                            <p className="text-sm text-green-600">Verification email resent!</p>
                        )}
                    </CardContent>
                    <CardFooter className="justify-center gap-3">
                        {/* ✅ Calls resend endpoint — doesn't reload page */}
                        <Button variant="outline" onClick={handleResend}>
                            Resend Email
                        </Button>
                        <Link href="/login">
                            <Button variant="ghost">Back to Login</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // ── Registration Form ────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
            <Card className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                    <div className="mb-2">
                        <span className="font-serif text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
                            UN<em className="italic text-blue-600">IFY</em>
                        </span>
                    </div>
                    <CardTitle className="text-xl">Register Your Society</CardTitle>
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

                        {/* Society Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                Society Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="society_name">Society Name</Label>
                                    <div className="relative">
                                        <Input
                                            id="society_name"
                                            name="society_name"
                                            required
                                            placeholder="society name"
                                            value={formData.society_name}
                                            onChange={handleChange}
                                            onBlur={checkAvailability}
                                            className={
                                                isNameAvailable === true ? "border-green-500" :
                                                    isNameAvailable === false ? "border-red-500" : ""
                                            }
                                        />
                                        {isNameAvailable === true && (
                                            <span className="absolute right-3 top-2.5 text-green-500 text-xs font-medium">Available ✓</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="total_units">Total Flats / Units</Label>
                                    <Input
                                        id="total_units"
                                        name="total_units"
                                        type="number"
                                        min={1}
                                        max={10000}
                                        required
                                        placeholder="120"
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
                                    placeholder="Plot 45, Sector 12"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" required placeholder="city" value={formData.city} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" name="state" required placeholder="State" value={formData.state} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        required
                                        placeholder="500001"
                                        maxLength={6}
                                        inputMode="numeric"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Admin Contact */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                Admin Contact
                            </h3>
                            <div className="space-y-2">
                                <Label htmlFor="admin_name">Your Full Name</Label>
                                <Input id="admin_name" name="admin_name" required placeholder="Admin Name" value={formData.admin_name} onChange={handleChange} />
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
                                        autoComplete="email"
                                        value={formData.admin_email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin_phone">Phone Number</Label>
                                    {/* ✅ Numeric keyboard, numbers only */}
                                    <Input
                                        id="admin_phone"
                                        name="admin_phone"
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="10-digit number"
                                        maxLength={10}
                                        required
                                        value={formData.admin_phone}
                                        onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start space-x-2 pt-2">
                            <Checkbox
                                id="terms"
                                checked={formData.terms}
                                onCheckedChange={(checked) => setFormData({ ...formData, terms: checked as boolean })}
                            />
                            <label htmlFor="terms" className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed cursor-pointer">
                                I agree to the terms and conditions and privacy policy
                            </label>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading || isNameAvailable === false}>
                            {loading ? "Creating Account..." : "Create Society Account"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <p className="text-sm text-zinc-500">
                        Already registered?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Login here
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}