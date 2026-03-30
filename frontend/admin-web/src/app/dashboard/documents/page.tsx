"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, Download, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Document {
    id: number;
    title: string;
    description: string;
    file_type: string;
    created_at: string;
}

export default function DocumentsPage() {
    const [docs, setDocs] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fetchDocs = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/documents');
            setDocs(res.data);
        } catch (err) {
            console.error("Failed to fetch docs", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!selectedFile) {
            setError("Please select a file");
            return;
        }

        setIsSubmitting(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("file", selectedFile);

        try {
            await api.post('/documents', data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setIsDialogOpen(false);
            setFormData({ title: "", description: "" });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            fetchDocs();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to upload document");
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this document?")) return;
        try {
            await api.delete(`/documents/${id}`);
            fetchDocs();
        } catch (err) {
            alert("Failed to delete document");
        }
    };

    const handleDownload = async (id: number, title: string) => {
        try {
            const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', title); // or extract filename from header
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert("Download failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">Repository for society bylaws, notices, and forms.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>File</Label>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Uploading..." : "Upload"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-10">Loading documents...</div>
                ) : docs.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No documents uploaded yet.
                    </div>
                ) : (
                    docs.map((doc) => (
                        <Card key={doc.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <FileText className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <Badge variant="outline">{doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
                                </div>
                                <CardTitle className="mt-4 text-lg">{doc.title}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {doc.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => handleDownload(doc.id, doc.title)}>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
