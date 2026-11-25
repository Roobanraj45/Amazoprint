"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { createProposal } from "@/app/actions/proposal-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { 
    Plus, CheckCircle2, Clock, XCircle, 
    IndianRupee, Layers, Loader2 
} from "lucide-react";

interface Proposal {
    id: number;
    title: string;
    description: string;
    optionType: string;
    estimatedCost: string | null;
    status: string;
    images?: string[] | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

interface DesignOptionsClientProps {
    initialProposals: Proposal[];
}

export function DesignOptionsClient({ initialProposals }: DesignOptionsClientProps) {
    const [proposals, setProposals] = React.useState<Proposal[]>(initialProposals);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isPending, startTransition] = React.useTransition();
    const [uploading, setUploading] = React.useState(false);
    const { toast } = useToast();

    const [title, setTitle] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [cost, setCost] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [files, setFiles] = React.useState<FileList | null>(null);

    const totalCount = proposals.length;
    const pendingCount = proposals.filter(p => p.status === 'pending').length;
    const approvedCount = proposals.filter(p => p.status === 'approved').length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !category || !description.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill in all required fields.",
            });
            return;
        }

        setUploading(true);
        const uploadedUrls: string[] = [];

        try {
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("folder", "proposals");

                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        throw new Error(`Failed to upload ${file.name}`);
                    }

                    const uploadData = await uploadRes.json();
                    if (uploadData.success && uploadData.url) {
                        uploadedUrls.push(uploadData.url);
                    }
                }
            }
        } catch (uploadError: any) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: uploadError.message || "Failed to upload reference images.",
            });
            setUploading(false);
            return;
        }

        setUploading(false);

        startTransition(async () => {
            try {
                const res = await createProposal({
                    title,
                    optionType: category,
                    description,
                    estimatedCost: cost ? Number(cost) : undefined,
                    images: uploadedUrls
                });

                if (res.success) {
                    toast({
                        title: "Proposal Submitted",
                        description: "Your design option suggestion has been successfully submitted to admin.",
                    });
                    
                    const newProp: Proposal = {
                        id: Date.now(),
                        title,
                        description,
                        optionType: category,
                        estimatedCost: cost || null,
                        images: uploadedUrls,
                        status: 'pending',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    setProposals([newProp, ...proposals]);

                    setTitle("");
                    setCategory("");
                    setCost("");
                    setDescription("");
                    setFiles(null);
                    setIsDialogOpen(false);
                }
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Submission Failed",
                    description: error.message || "Something went wrong.",
                });
            }
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold gap-1">
                        <CheckCircle2 size={11} /> Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold gap-1">
                        <XCircle size={11} /> Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold gap-1">
                        <Clock size={11} /> Pending Review
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-8 pb-20 animate-in fade-in duration-700">
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-tight border border-white/10">
                            <Layers className="w-3 h-3 text-primary animate-pulse" />
                            Propose New Options
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Design &amp; Texture Proposals</h1>
                        <p className="text-slate-400 font-medium text-[11px] max-w-xl">
                            Tell us about new foil colors, paper weights, laminations, or custom shapes that your press can output so we can add them to our design canvas.
                        </p>
                    </div>

                    <div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl h-11 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 gap-2 px-5">
                                    <Plus size={16} /> Propose New Option
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] bg-slate-900 text-white border-slate-800 rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-black tracking-tight">Suggest Design Feature</DialogTitle>
                                    <DialogDescription className="text-slate-400 text-xs font-medium">
                                        Submit details about new finishes, foils, textures, or dies you have available for production.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="text-xs font-bold text-slate-300">Option Name / Title <span className="text-rose-500">*</span></Label>
                                        <Input 
                                            id="title" 
                                            placeholder="e.g. Holographic Rainbow Foil, 400gsm Kraft Paper" 
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-300">Category <span className="text-rose-500">*</span></Label>
                                            <Select value={category} onValueChange={setCategory} required>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                                                    <SelectItem value="foil">Metallic Foil</SelectItem>
                                                    <SelectItem value="texture">Paper/Card Texture</SelectItem>
                                                    <SelectItem value="die_cut">Die Cut Shape</SelectItem>
                                                    <SelectItem value="lamination">Lamination</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="cost" className="text-xs font-bold text-slate-300">Est. Extra Cost (₹)</Label>
                                            <Input 
                                                id="cost" 
                                                type="number"
                                                min="0"
                                                placeholder="Optional"
                                                value={cost}
                                                onChange={e => setCost(e.target.value)}
                                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="text-xs font-bold text-slate-300">Description &amp; Specifications <span className="text-rose-500">*</span></Label>
                                        <Textarea 
                                            id="description" 
                                            placeholder="Describe paper GSM, finish feel, durability..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl min-h-[90px]"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-300">Reference Images</Label>
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={e => setFiles(e.target.files)}
                                            className="bg-white/5 border-white/10 text-slate-300 rounded-xl"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl text-slate-300">
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isPending || uploading} className="rounded-xl bg-primary text-white font-bold px-5">
                                            {(isPending || uploading) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            Submit Proposal
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="relative flex gap-4 pt-5 mt-5 border-t border-white/10 text-xs font-bold">
                    <span className="text-slate-300">Total: {totalCount}</span>
                    <span className="text-amber-300">Pending: {pendingCount}</span>
                    <span className="text-emerald-300">Approved: {approvedCount}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proposals.map((prop) => (
                    <Card key={prop.id} className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <Badge variant="outline" className="text-[10px] capitalize mb-1.5">
                                        {prop.optionType.replace('_', ' ')}
                                    </Badge>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{prop.title}</h3>
                                </div>
                                {getStatusBadge(prop.status)}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{prop.description}</p>
                            {prop.images && prop.images.length > 0 && (
                                <div className="flex gap-2">
                                    {prop.images.map((img, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img key={i} src={img} alt={prop.title} className="w-12 h-12 rounded-lg object-cover border" />
                                    ))}
                                </div>
                            )}
                            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-400">
                                <span>{prop.createdAt ? format(new Date(prop.createdAt), 'dd MMM yyyy') : 'Just now'}</span>
                                {prop.estimatedCost && (
                                    <span className="font-bold text-slate-700 flex items-center">
                                        <IndianRupee size={11} />{prop.estimatedCost}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
