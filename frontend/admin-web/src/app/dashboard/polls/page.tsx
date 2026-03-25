"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, BarChart2, Trash2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface PollOption {
    id: number;
    text: string;
    votes: number;
}

interface Poll {
    id: number;
    title: string;
    description: string;
    type: string;
    is_anonymous: boolean;
    end_date: string;
    created_at: string;
    options?: PollOption[];
}

export default function PollsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "single",
        is_anonymous: false,
        end_date: "",
        options: ["", ""] // Start with 2 empty options
    });

    const fetchPolls = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/polls');
            setPolls(res.data);
        } catch (err) {
            console.error("Failed to fetch polls", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, []);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, ""] });
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 2) return;
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const validOptions = formData.options.filter(o => o.trim() !== "");
        if (validOptions.length < 2) {
            setError("At least 2 valid options are required");
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post('/polls', {
                ...formData,
                options: validOptions
            });
            setFormData({
                title: "",
                description: "",
                type: "single",
                is_anonymous: false,
                end_date: "",
                options: ["", ""]
            });
            setIsDialogOpen(false);
            fetchPolls();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create poll");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTotalVotes = (poll: Poll) => {
        return poll.options?.reduce((sum, opt) => sum + Number(opt.votes), 0) || 0;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Polls</h2>
                    <p className="text-muted-foreground">Engage with residents through voting.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Poll
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Poll</DialogTitle>
                            <DialogDescription>
                                Ask a question to the community.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="title">Question/Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Annual Function Date?"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Description (Optional)</Label>
                                <Input
                                    id="desc"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Options</Label>
                                {formData.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input
                                            value={opt}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        {formData.options.length > 2 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
                                    <Plus className="mr-2 h-4 w-4" /> Add Option
                                </Button>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="anonymous"
                                    checked={formData.is_anonymous}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                                />
                                <Label htmlFor="anonymous">Anonymous Voting</Label>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Creating..." : "Launch Poll"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-10">Loading polls...</div>
                ) : polls.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No active polls found. Create one to get started.
                    </div>
                ) : (
                    polls.map((poll) => {
                        const totalVotes = getTotalVotes(poll);
                        return (
                            <Card key={poll.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{poll.title}</CardTitle>
                                        <BarChart2 className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <CardDescription>{new Date(poll.created_at).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {poll.options?.map((opt) => {
                                            const percentage = totalVotes > 0 ? Math.round((Number(opt.votes) / totalVotes) * 100) : 0;
                                            return (
                                                <div key={opt.id} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span>{opt.text}</span>
                                                        <span className="font-medium">{percentage}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-slate-900 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-2 text-xs text-muted-foreground flex justify-between">
                                            <span>Total Votes: {totalVotes}</span>
                                            {poll.is_anonymous && <Badge variant="secondary">Anonymous</Badge>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
