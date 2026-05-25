"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { createProposal } from "@/app/actions/proposal-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    Sparkles, Plus, FileText, CheckCircle2, Clock, XCircle, 
    IndianRupee, Layers, Loader2, Image as ImageIcon, Eye
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

    // Form states
    const [title, setTitle] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [cost, setCost] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [files, setFiles] = React.useState<FileList | null>(null);

    // Lightbox / Image Preview state
    const [previewImages, setPreviewImages] = React.useState<string[] | null>(null);

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

                    // Reset form & close
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
                        <Clock size={11} className="animate-spin duration-3000" /> Pending Review
                    </Badge>
                );
        }
    };

    const getCategoryBadge = (cat: string) => {
        return (
            <Badge variant="outline" className="border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 capitalize font-medium text-[10px] px-2.5">
                {cat.replace('_', ' ')}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-8 pb-20 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-tight border border-white/10">
                            <Layers className="w-3 h-3 text-primary animate-pulse" />
                            Propose New Options
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Design & Texture Proposals</h1>
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
                                                    <SelectItem value="die_cut">Die Cut / Shape</SelectItem>
                                                    <SelectItem value="lamination">Lamination</SelectItem>
                                                    <SelectItem value="other">Other Finishes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="cost" className="text-xs font-bold text-slate-300">Estimated Cost Add-on (Optional)</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                <Input 
                                                    id="cost" 
                                                    type="number"
                                                    placeholder="0.00" 
                                                    value={cost}
                                                    onChange={e => setCost(e.target.value)}
                                                    className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="images" className="text-xs font-bold text-slate-300">Reference Images (Multiple)</Label>
                                        <Input 
                                            id="images" 
                                            type="file" 
                                            multiple 
                                            accept="image/*"
                                            onChange={e => setFiles(e.target.files)}
                                            className="bg-white/5 border-white/10 text-white rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-white file:uppercase hover:file:bg-primary/90 cursor-pointer text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="text-xs font-bold text-slate-300">Technical Details / Description <span className="text-rose-500">*</span></Label>
                                        <Textarea 
                                            id="description" 
                                            placeholder="Provide technical specs, sheet dimensions, minimum weight, curing times, or printing setup rules." 
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            rows={3}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="pt-2 flex justify-end gap-3">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={() => setIsDialogOpen(false)}
                                            className="rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-white"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isPending || uploading}
                                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider gap-2"
                                        >
                                            {(isPending || uploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Submit Option
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Suggestions</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Review</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Approved Options</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{approvedCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </Card>
            </div>

            {/* Table of proposals */}
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-6 md:p-8 pb-4">
                    <CardTitle className="text-base font-bold tracking-tight">Proposed Options Ledger</CardTitle>
                    <CardDescription className="text-xs font-medium">History of design features proposed by your print press</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {proposals.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                        <th className="py-4 px-6 md:px-8">Option Detail</th>
                                        <th className="py-4 px-6">Category</th>
                                        <th className="py-4 px-6">Technical Description</th>
                                        <th className="py-4 px-6">Est. Cost Addon</th>
                                        <th className="py-4 px-6">Date Proposed</th>
                                        <th className="py-4 px-6 md:px-8 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                                    {proposals.map((prop) => (
                                        <tr key={prop.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                                            <td className="py-4 px-6 md:px-8">
                                                <div className="space-y-1.5">
                                                    <span className="font-black text-slate-800 dark:text-slate-100 block">{prop.title}</span>
                                                    {prop.images && prop.images.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                            {prop.images.map((imgUrl, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    onClick={() => setPreviewImages(prop.images || null)}
                                                                    className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 cursor-zoom-in hover:scale-105 transition-transform bg-white flex items-center justify-center relative group"
                                                                >
                                                                    <img src={imgUrl} alt={`ref-${i}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                                        <Eye size={10} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {getCategoryBadge(prop.optionType)}
                                            </td>
                                            <td className="py-4 px-6 max-w-xs truncate text-slate-500 font-medium" title={prop.description}>
                                                {prop.description}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                                                {prop.estimatedCost ? (
                                                    <span className="flex items-center gap-0.5">
                                                        <IndianRupee size={12} className="opacity-75" />
                                                        {prop.estimatedCost}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-medium italic">Standard / Inherent</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 font-medium">
                                                {prop.createdAt ? format(new Date(prop.createdAt), 'dd MMM yyyy') : 'N/A'}
                                            </td>
                                            <td className="py-4 px-6 md:px-8 text-right">
                                                {getStatusBadge(prop.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6">
                            <Sparkles className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-3 animate-pulse" />
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">No suggestions submitted yet</h4>
                            <p className="text-slate-400 text-[11px] mt-1 max-w-sm mx-auto">
                                Propose new specialties like specialized die-cut configurations or premium metal leaf colors to start offering them to customers.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Premium Lightbox Modal for reference images */}
            {previewImages && (
                <Dialog open={!!previewImages} onOpenChange={(open) => !open && setPreviewImages(null)}>
                    <DialogContent className="sm:max-w-[700px] bg-slate-900 border-slate-800 text-white rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <ImageIcon size={14} /> Reference Gallery
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto p-1 no-scrollbar">
                            {previewImages.map((imgUrl, i) => (
                                <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                                    <img src={imgUrl} alt={`preview-${i}`} className="w-full h-full object-contain" />
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
