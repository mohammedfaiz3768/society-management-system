"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyEmailPage() {
    const params = useParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("");
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // ✅ Handle missing token immediately
        if (!params.token) {
            setStatus("error");
            setMessage("Invalid verification link — token is missing");
            return;
        }

        const token = params.token as string;

        // ✅ Validate token format before sending to API
        if (!/^[a-f0-9]{64}$/.test(token)) {
            setStatus("error");
            setMessage("Invalid verification link format");
            return;
        }

        verifyToken(token);
    }, [params.token]);

    // ✅ Countdown timer on success
    useEffect(() => {
        if (status !== "success") return;
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/login");
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status, router]);

    const verifyToken = async (token: string) => {
        try {
            // ✅ Use axios instance
            await api.get(`/registration/verify/${token}`);
            setStatus("success");
        } catch (err) {
            setStatus("error");
            if (axios.isAxiosError(err)) {
                setMessage(err.response?.data?.error || "Verification failed. The link may have expired.");
            } else {
                setMessage("Failed to verify email. Please try again.");
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
            <Card className="w-full max-w-md text-center border border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                    <div className="mx-auto mb-4 flex items-center justify-center h-14 w-14">
                        {/* ✅ Proper loading spinner */}
                        {status === "verifying" && (
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        {status === "success" && (
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {status === "error" && (
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <CardTitle className="text-xl">
                        {status === "verifying" && "Verifying Email"}
                        {status === "success" && "Email Verified!"}
                        {status === "error" && "Verification Failed"}
                    </CardTitle>
                    <CardDescription>
                        {status === "verifying" && "Please wait while we activate your society..."}
                        {status === "success" && `Redirecting to login in ${countdown}s...`}
                        {status === "error" && "Something went wrong with your verification link"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {status === "success" && (
                        <>
                            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-left">
                                <AlertDescription className="text-green-800 dark:text-green-300">
                                    Your society is now active and your 30-day free trial has started.
                                    Login with your email and request an OTP to get started.
                                </AlertDescription>
                            </Alert>
                            <Button className="w-full" onClick={() => router.push("/login")}>
                                Go to Login →
                            </Button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <Alert variant="destructive" className="text-left">
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.push("/register")}
                                >
                                    Register Again
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => router.push("/login")}
                                >
                                    Try Login
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}