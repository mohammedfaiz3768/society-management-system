"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/apiUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyEmailPage() {
    const params = useParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (params.token) {
            verifyToken(params.token as string);
        }
    }, [params.token]);

    const verifyToken = async (token: string) => {
        try {
            const res = await fetch(buildApiUrl(`registration/verify/${token}`));
            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage("Email verified successfully! Redirecting to login...");
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setStatus("error");
                setMessage(data.error || "Verification failed");
            }
        } catch (err) {
            setStatus("error");
            setMessage("Failed to verify email. Please try again.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto text-4xl mb-4 text-primary">
                        {status === "verifying" && "..."}
                    </div>
                    <CardTitle>Email Verification</CardTitle>
                    <CardDescription>
                        {status === "verifying" && "Please wait while we verify your email..."}
                        {status === "success" && "Verification Successful!"}
                        {status === "error" && "Verification Failed"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === "success" && (
                        <Alert className="bg-green-50 text-green-800 border-green-200">
                            <AlertDescription>
                                Your society is now active. You have been granted a 30-day free trial.
                            </AlertDescription>
                        </Alert>
                    )}

                    {status === "error" && (
                        <Alert variant="destructive">
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}

                    {status === "success" && (
                        <Button className="w-full" onClick={() => router.push("/login")}>
                            Go to Login
                        </Button>
                    )}

                    {status === "error" && (
                        <Button variant="outline" className="w-full" onClick={() => router.push("/register")}>
                            Back to Registration
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
