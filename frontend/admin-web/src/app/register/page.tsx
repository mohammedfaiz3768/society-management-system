"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { MailCheck, Home, ArrowRight, Building2, CheckCircle } from "lucide-react";

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
        if (!formData.society_name || formData.society_name.length < 3) return;
        try {
            const res = await api.get(`/registration/check-availability?name=${encodeURIComponent(formData.society_name)}`);
            setIsNameAvailable(res.data.available);
            setError(res.data.available ? "" : "Society name is already taken");
        } catch {
            // silent
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!emailRegex.test(formData.admin_email)) { setError("Please enter a valid email address"); return; }
        if (formData.admin_phone && !phoneRegex.test(formData.admin_phone)) { setError("Phone number must be 10 digits"); return; }
        if (formData.pincode && !pincodeRegex.test(formData.pincode)) { setError("Pincode must be 6 digits"); return; }
        if (isNameAvailable === false) { setError("Please choose a different society name"); return; }
        if (!formData.terms) { setError("Please accept the terms and conditions"); return; }

        setLoading(true);
        try {
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

    // â”€â”€ Success Step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (step === 2) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-4">
                <div className="w-full max-w-md bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-rose-600 to-rose-600 px-8 py-10 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                            <MailCheck className="w-8 h-8 text-slate-900" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Check Your Email</h2>
                        <p className="text-emerald-200 text-sm mt-1">
                            Sent to <span className="font-semibold text-slate-900">{formData.admin_email}</span>
                        </p>
                    </div>
                    <div className="p-8 space-y-5">
                        <p className="text-sm text-slate-500 text-center leading-relaxed">
                            Click the verification link to activate your society and start your 30-day free trial. The link expires in 24 hours.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                            Didn't receive it? Check your spam folder or click below to resend.
                        </div>
                        {resendSuccess && (
                            <div className="flex items-center gap-2 text-sm text-green-600 justify-center">
                                <CheckCircle className="w-4 h-4" /> Verification email resent!
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 border-slate-200" onClick={handleResend}>
                                Resend Email
                            </Button>
                            <Link href="/login" className="flex-1">
                                <Button variant="ghost" className="w-full">Back to Login</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // â”€â”€ Registration Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return (
        <div className="min-h-screen bg-white py-8 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Top brand */}
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-9 h-9 rounded-2xl bg-rose-600 flex items-center justify-center">
                        <Home className="w-4 h-4 text-slate-900" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                        UN<span className="text-rose-600 italic">IFY</span>
                    </span>
                </div>

                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Card header */}
                    <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-1">
                            <Building2 className="w-5 h-5 text-rose-600" />
                            <h1 className="text-xl font-bold text-slate-900">Register Your Society</h1>
                        </div>
                        <p className="text-sm text-zinc-500">Start your 30-day free trial. No credit card required.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Society Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Society Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="society_name">Society Name <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            id="society_name"
                                            name="society_name"
                                            required
                                            placeholder="e.g. Sunrise Apartments"
                                            value={formData.society_name}
                                            onChange={handleChange}
                                            onBlur={checkAvailability}
                                            className={
                                                isNameAvailable === true ? "border-green-400 focus:border-green-500" :
                                                isNameAvailable === false ? "border-red-400 focus:border-red-500" : "border-slate-200"
                                            }
                                        />
                                        {isNameAvailable === true && (
                                            <span className="absolute right-3 top-1/2 -tranzinc-y-1/2 text-green-600 text-xs font-semibold flex items-center gap-1">
                                                <CheckCircle className="w-3.5 h-3.5" /> Available
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="total_units">Total Flats / Units <span className="text-red-500">*</span></Label>
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
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                                <Input
                                    id="address"
                                    name="address"
                                    required
                                    placeholder="Plot 45, Sector 12"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                                    <Input id="city" name="city" required placeholder="Hyderabad" value={formData.city} onChange={handleChange} className="border-slate-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                                    <Input id="state" name="state" required placeholder="Telangana" value={formData.state} onChange={handleChange} className="border-slate-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="pincode">Pincode <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        required
                                        placeholder="500001"
                                        maxLength={6}
                                        inputMode="numeric"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Admin Contact */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pt-2">Admin Contact</h3>
                            <div className="space-y-1.5">
                                <Label htmlFor="admin_name">Your Full Name <span className="text-red-500">*</span></Label>
                                <Input id="admin_name" name="admin_name" required placeholder="Mohammed Faiz" value={formData.admin_name} onChange={handleChange} className="border-slate-200" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="admin_email">Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="admin_email"
                                        name="admin_email"
                                        type="email"
                                        required
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        value={formData.admin_email}
                                        onChange={handleChange}
                                        className="border-slate-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="admin_phone">Phone Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="admin_phone"
                                        name="admin_phone"
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="10-digit mobile number"
                                        maxLength={10}
                                        required
                                        value={formData.admin_phone}
                                        onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value.replace(/\D/g, '') })}
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                            <Checkbox
                                id="terms"
                                checked={formData.terms}
                                onCheckedChange={(checked) => setFormData({ ...formData, terms: checked as boolean })}
                                className="mt-0.5"
                            />
                            <label htmlFor="terms" className="text-sm text-slate-500 leading-relaxed cursor-pointer">
                                I agree to the <span className="text-rose-600 hover:underline cursor-pointer">terms and conditions</span> and <span className="text-rose-600 hover:underline cursor-pointer">privacy policy</span>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-rose-600 hover:bg-rose-600 text-white font-medium rounded-lg"
                            disabled={loading || isNameAvailable === false}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Creating Account...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Create Society Account <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="px-8 py-4 border-t border-slate-100 bg-white text-center">
                        <p className="text-sm text-zinc-500">
                            Already registered?{" "}
                            <Link href="/login" className="text-rose-600 hover:text-emerald-800 font-medium hover:underline">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
