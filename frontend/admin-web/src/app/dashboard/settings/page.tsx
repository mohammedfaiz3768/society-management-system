"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your society configuration.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Basic information about your society</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Society Name</Label>
                        <Input placeholder="Enter society name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea placeholder="Enter society address" rows={3} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                    <CardDescription>SMTP settings for outgoing emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>SMTP Server</Label>
                        <Input placeholder="smtp.gmail.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email Username</Label>
                        <Input type="email" placeholder="your-email@example.com" />
                    </div>
                </CardContent>
            </Card>

            <Button disabled>Save Settings</Button>
        </div>
    );
}
