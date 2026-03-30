"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, BarChart2, X } from "lucide-react";

interface PollOption {
    id: number;
    text: string;
    votes: number;
}

// ✅ Matches backend API response
interface Poll {
    id: number;
    question: string;
    closes_at: string | null;
    created_at: string;
    options?: PollOption[];
}

const EMPTY_FORM = {
    question: "",
    closes_at: "",
    options: ["", ""] as string[],
};

export default function PollsPage() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const resetForm = () => {
        setFormData({ ...EMPTY_FORM, options: ["", ""] });
        setFormError("");
    };

    const fetchPolls = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get('/polls?limit=20');
            setPolls(res.data);
        } catch {
            setFetchError("Failed to load polls. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPolls(); }, []);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        // ✅ Max 10 options — backend limit
        if (formData.options.length >= 10) return;
        setFormData({ ...formData, options: [...formData.options, ""] });
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 2) return;
        setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        const validOptions = formData.options.map(o => o.trim()).filter(Boolean);
        if (validOptions.length < 2) {
            setFormError("At least 2 non-empty options are required");
            return;
        }

        // ✅ Validate closes_at is in future if provided
        if (formData.closes_at && new Date(formData.closes_at) <= new Date()) {
            setFormError("Close date must be in the future");
            return;
        }

        setIsSubmitting(true);
        try {
            // ✅ Use correct field names matching backend
            await api.post('/polls', {
                question: formData.question,
                closes_at: formData.closes_at || undefined,
                options: validOptions,
            });
            resetForm();
            setIsDialogOpen(false);
            fetchPolls();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setFormError(err.response?.data?.message || "Failed to create poll");
            } else {
                setFormError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTotalVotes = (poll: Poll) =>
        poll.options?.reduce((sum, opt) => sum + Number(opt.votes), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Polls</h2>
                    <p className="text-sm text-muted-foreground">Engage with residents through community voting.</p>
                </div>

                {/* ✅ Reset form on close */}
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Create Poll</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Poll</DialogTitle>
                            <DialogDescription>Ask a question to the community.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="question">Question</Label>
                                <Input
                                    id="question"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="e.g., When should we hold the Annual Function?"
                                    required
                                />
                            </div>

                            {/* ✅ Close date field now visible */}
                            <div className="space-y-2">
                                <Label htmlFor="closes_at">
                                    Closes At
                                    <span className="text-muted-foreground font-normal text-xs ml-1">(optional)</span>
                                </Label>
                                <Input
                                    id="closes_at"
                                    type="datetime-local"
                                    value={formData.closes_at}
                                    onChange={(e) => setFormData({ ...formData, closes_at: e.target.value })}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Options</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {formData.options.length}/10
                                    </span>
                                </div>
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
                                {/* ✅ Disabled when at max */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addOption}
                                    disabled={formData.options.length >= 10}
                                    className="mt-1"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Option
                                </Button>
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

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-10 text-sm text-muted-foreground">
                        Loading polls...
                    </div>
                ) : polls.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-sm text-muted-foreground">
                        No polls yet. Create one to engage residents.
                    </div>
                ) : (
                    polls.map((poll) => {
                        const totalVotes = getTotalVotes(poll);
                        // ✅ Show poll status
                        const isActive = !poll.closes_at || new Date(poll.closes_at) > new Date();

                        return (
                            <Card key={poll.id} className={!isActive ? 'opacity-70' : ''}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start gap-2">
                                        {/* ✅ Use 'question' not 'title' */}
                                        <CardTitle className="text-sm font-medium leading-snug">{poll.question}</CardTitle>
                                        <BarChart2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </div>
                                    <CardDescription className="text-xs flex items-center gap-2">
                                        <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                                        {/* ✅ Active/closed status */}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {isActive ? 'Active' : 'Closed'}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2.5">
                                        {poll.options?.map((opt) => {
                                            const pct = totalVotes > 0
                                                ? Math.round((Number(opt.votes) / totalVotes) * 100)
                                                : 0;
                                            return (
                                                <div key={opt.id} className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-700">{opt.text}</span>
                                                        <span className="font-medium text-slate-900">{pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-600 rounded-full transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <p className="text-xs text-muted-foreground pt-1">
                                            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
                                        </p>
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