"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Download, Trash2, FolderOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Document {
    id: number;
    title: string;
    description: string;
    file_type: string;
    created_at: string;
}

const LIMIT = 100;

export default function DocumentsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [docs, setDocs] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionError, setActionError] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({ title: "", description: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    const resetForm = () => {
        setFormData({ title: "", description: "" });
        setSelectedFile(null);
        setUploadError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const fetchDocs = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get(`/documents?limit=${LIMIT}`);
            setDocs(res.data);
        } catch (err) {
            if (axios.isAxiosError(err)) setFetchError(err.response?.data?.message || "Failed to load documents");
            else setFetchError("Failed to load documents");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchDocs(); }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadError("");
        if (!selectedFile) { setUploadError("Please select a file"); return; }
        setIsSubmitting(true);
        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("file", selectedFile);
        try {
            await api.post('/documents', data, { headers: { "Content-Type": "multipart/form-data" } });
            setIsDialogOpen(false);
            resetForm();
            fetchDocs();
        } catch (err) {
            if (axios.isAxiosError(err)) setUploadError(err.response?.data?.message || "Failed to upload document");
            else setUploadError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this document?")) return;
        setActionError("");
        try {
            await api.delete(`/documents/${id}`);
            fetchDocs();
        } catch (err) {
            if (axios.isAxiosError(err)) setActionError(err.response?.data?.message || "Failed to delete document");
            else setActionError("Failed to delete document");
        }
    };

    const handleDownload = async (id: number, title: string, fileType: string) => {
        setActionError("");
        try {
            const response = await api.get(`/documents/${id}/download`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const ext = fileType?.split("/")[1];
            const filename = ext ? `${title}.${ext}` : title;
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            if (axios.isAxiosError(err)) setActionError(err.response?.data?.message || "Download failed");
            else setActionError("Download failed");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Documents</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Repository for society bylaws, notices, and forms.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-rose-600 hover:bg-rose-600 text-white gap-1.5 h-9">
                            <Plus className="h-4 w-4" /> Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            {uploadError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{uploadError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-1.5">
                                <Label>Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="border-slate-200"
                                    placeholder="e.g. Society Bylaws 2024"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Description <span className="text-slate-500 font-normal text-xs">(optional)</span></Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="resize-none border-slate-200"
                                    rows={2}
                                    placeholder="Brief description of this document..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>File</Label>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                    required
                                    className="border-slate-200"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-600" disabled={isSubmitting}>
                                {isSubmitting ? "Uploading..." : "Upload Document"}
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
            {actionError && (
                <Alert variant="destructive">
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            {/* Document grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 animate-pulse">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg mb-4" />
                            <div className="h-4 w-3/4 bg-slate-50 rounded mb-2" />
                            <div className="h-3 w-full bg-slate-50 rounded mb-1" />
                            <div className="h-3 w-2/3 bg-slate-50 rounded" />
                        </div>
                    ))}
                </div>
            ) : docs.length === 0 ? (
                <div className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 py-16 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No documents uploaded yet</p>
                    <p className="text-xs text-slate-500">Upload bylaws, forms, and notices for residents.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {docs.map((doc) => {
                        const ext = doc.file_type?.split("/")[1]?.toUpperCase() || "FILE";
                        return (
                            <div key={doc.id} className="bg-white shadow-sm border-slate-100 rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 text-zinc-500 bg-white">
                                        {ext}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-1">{doc.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-4">
                                    {doc.description || "No description"}
                                </p>
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8 text-xs border-slate-200 gap-1.5"
                                        onClick={() => handleDownload(doc.id, doc.title, doc.file_type)}
                                    >
                                        <Download className="h-3.5 w-3.5" /> Download
                                    </Button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="p-1.5 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Delete document"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && docs.length > 0 && (
                <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-500">{docs.length}</span> document{docs.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
