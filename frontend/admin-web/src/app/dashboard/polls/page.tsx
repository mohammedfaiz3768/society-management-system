"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, BarChart2, X } from "lucide-react";

interface PollOption {
    id: number;
    text: string;
    votes: number;
}

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

const BAR_COLORS = [
    'bg-rose-600', 'bg-blue-500', 'bg-rose-600', 'bg-purple-500',
    'bg-pink-500', 'bg-amber-500', 'bg-green-500', 'bg-rose-500',
];

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
        if (validOptions.length < 2) { setFormError("At least 2 non-empty options are required"); return; }
        if (formData.closes_at && new Date(formData.closes_at) <= new Date()) { setFormError("Close date must be in the future"); return; }
        setIsSubmitting(true);
        try {
            await api.post('/polls', { question: formData.question, closes_at: formData.closes_at || undefined, options: validOptions });
            resetForm();
            setIsDialogOpen(false);
            fetchPolls();
        } catch (err) {
            if (axios.isAxiosError(err)) setFormError(err.response?.data?.message || "Failed to create poll");
            else setFormError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTotalVotes = (poll: Poll) =>
        poll.options?.reduce((sum, opt) => sum + Number(opt.votes), 0) || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Polls</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Engage residents through community voting.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Create Poll
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Poll</DialogTitle>
                            <DialogDescription>Ask a question to the community.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="question">Question</Label>
                                <Input
                                    id="question"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="e.g., When should we hold the Annual Function?"
                                    className="border-slate-200"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="closes_at">
                                    Closes At <span className="text-slate-500 font-normal text-xs">(optional)</span>
                                </Label>
                                <Input
                                    id="closes_at"
                                    type="datetime-local"
                                    value={formData.closes_at}
                                    onChange={(e) => setFormData({ ...formData, closes_at: e.target.value })}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Options</Label>
                                    <span className="text-xs text-slate-500">{formData.options.length}/10</span>
                                </div>
                                <div className="space-y-2">
                                    {formData.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={opt}
                                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                placeholder={`Option ${idx + 1}`}
                                                className="border-slate-200"
                                            />
                                            {formData.options.length > 2 && (
                                                <Button type="button" variant="ghost" size="icon" className="text-slate-500 hover:text-red-500" onClick={() => removeOption(idx)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addOption}
                                    disabled={formData.options.length >= 10}
                                    className="border-slate-200 text-slate-500"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Option
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-600">
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

            {/* Poll Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
                            <div className="h-4 w-3/4 bg-slate-50 rounded" />
                            <div className="space-y-2">
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className="space-y-1">
                                        <div className="flex justify-between">
                                            <div className="h-3 w-20 bg-slate-50 rounded" />
                                            <div className="h-3 w-8 bg-slate-50 rounded" />
                                        </div>
                                        <div className="h-2 bg-slate-50 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : polls.length === 0 ? (
                    <div className="col-span-full py-16 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                            <BarChart2 className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">No polls yet</p>
                        <p className="text-xs text-slate-500">Create one to engage your residents.</p>
                    </div>
                ) : (
                    polls.map((poll) => {
                        const totalVotes = getTotalVotes(poll);
                        const isActive = !poll.closes_at || new Date(poll.closes_at) > new Date();
                        return (
                            <div
                                key={poll.id}
                                className={`bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow ${!isActive ? 'opacity-70' : ''}`}
                            >
                                <div className="px-5 py-4 border-b border-slate-100">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-slate-900 text-sm leading-snug flex-1">{poll.question}</p>
                                        <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-zinc-500'}`}>
                                            {isActive ? 'Active' : 'Closed'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        {new Date(poll.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {poll.closes_at && (
                                            <span> آ· Closes {new Date(poll.closes_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    {poll.options?.map((opt, idx) => {
                                        const pct = totalVotes > 0 ? Math.round((Number(opt.votes) / totalVotes) * 100) : 0;
                                        const barColor = BAR_COLORS[idx % BAR_COLORS.length];
                                        return (
                                            <div key={opt.id} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-700 font-medium truncate max-w-[160px]">{opt.text}</span>
                                                    <span className="font-bold text-slate-900 ml-2">{pct}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-slate-500">{opt.votes} vote{opt.votes !== 1 ? 's' : ''}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="px-5 py-2.5 border-t border-slate-100 bg-white">
                                    <p className="text-xs font-semibold text-slate-500">
                                        {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
