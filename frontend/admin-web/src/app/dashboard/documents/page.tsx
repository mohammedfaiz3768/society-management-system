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
import {
    Card,
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

    const [formData, setFormData] = useState({
        title: "",
        description: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
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
            if (axios.isAxiosError(err)) {
                setFetchError(err.response?.data?.message || "Failed to load documents");
            } else {
                setFetchError("Failed to load documents");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDocs();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadError("");

        if (!selectedFile) {
            setUploadError("Please select a file");
            return;
        }

        setIsSubmitting(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("file", selectedFile);

        try {
            await api.post('/documents', data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setIsDialogOpen(false);
            resetForm();
            fetchDocs();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setUploadError(err.response?.data?.message || "Failed to upload document");
            } else {
                setUploadError("An unexpected error occurred");
            }
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
            if (axios.isAxiosError(err)) {
                setActionError(err.response?.data?.message || "Failed to delete document");
            } else {
                setActionError("Failed to delete document");
            }
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
            if (axios.isAxiosError(err)) {
                setActionError(err.response?.data?.message || "Download failed");
            } else {
                setActionError("Download failed");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">Repository for society bylaws, notices, and forms.</p>
                </div>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}
                >
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
                            {uploadError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{uploadError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex justify-center items-center py-16">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
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
                                    <Badge variant="outline">
                                        {doc.file_type?.split("/")[1]?.toUpperCase() || "FILE"}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4 text-lg">{doc.title}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {doc.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleDownload(doc.id, doc.title, doc.file_type)}
                                >
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(doc.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>

            {!isLoading && docs.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    Showing {docs.length} document{docs.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
