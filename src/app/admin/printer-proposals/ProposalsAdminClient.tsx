"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { updateProposalStatusAdmin } from "@/app/actions/proposal-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
    Sparkles, CheckCircle2, Clock, XCircle, IndianRupee, 
    FileText, Factory, MapPin, Mail, Loader2, Image as ImageIcon, Eye 
} from "lucide-react";

interface PrinterProfile {
    fullName: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    city: string | null;
}

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
    printer: PrinterProfile;
}

interface ProposalsAdminClientProps {
    initialProposals: Proposal[];
}

export function ProposalsAdminClient({ initialProposals }: ProposalsAdminClientProps) {
    const [proposals, setProposals] = React.useState<Proposal[]>(initialProposals);
    const [activeTab, setActiveTab] = React.useState("all");
    const [processingId, setProcessingId] = React.useState<number | null>(null);
    const { toast } = useToast();

    // Lightbox gallery preview
    const [previewImages, setPreviewImages] = React.useState<string[] | null>(null);

    const handleAction = (proposalId: number, status: 'approved' | 'rejected') => {
        setProcessingId(proposalId);
        React.startTransition(async () => {
            try {
                const res = await updateProposalStatusAdmin(proposalId, status);
                if (res.success) {
                    toast({
                        title: `Proposal ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                        description: `The option suggestion has been successfully ${status}.`,
                    });
                    // Update state
                    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status, updatedAt: new Date() } : p));
                }
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Action Failed",
                    description: error.message || "Failed to update suggestion status.",
                });
            } finally {
                setProcessingId(null);
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

    const getCategoryBadge = (cat: string) => {
        return (
            <Badge variant="outline" className="border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 capitalize font-medium text-[10px] px-2">
                {cat.replace('_', ' ')}
            </Badge>
        );
    };

    // Calculate metrics
    const totalCount = proposals.length;
    const pendingCount = proposals.filter(p => p.status === 'pending').length;
    const approvedCount = proposals.filter(p => p.status === 'approved').length;
    const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

    // Filtered suggestions
    const filteredProposals = proposals.filter(prop => {
        if (activeTab === "all") return true;
        return prop.status === activeTab;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Printer Suggestions</h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">Review new foil styles, paper types, or custom sizes proposed by printers.</p>
                </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Proposals</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <FileText size={18} />
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Review</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{pendingCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Clock size={18} />
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Approved Options</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{approvedCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rejected Proposals</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{rejectedCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <XCircle size={18} />
                    </div>
                </Card>
            </div>

            {/* Filter Tabs & Ledger */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <CardHeader className="p-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight">Suggestions Ledger</CardTitle>
                            <CardDescription className="text-xs font-medium">Verify production capabilities of registered print houses</CardDescription>
                        </div>
                        <TabsList className="bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 self-start sm:self-center">
                            <TabsTrigger value="all" className="rounded-lg text-xs font-bold px-3 py-1">All</TabsTrigger>
                            <TabsTrigger value="pending" className="rounded-lg text-xs font-bold px-3 py-1">Pending</TabsTrigger>
                            <TabsTrigger value="approved" className="rounded-lg text-xs font-bold px-3 py-1">Approved</TabsTrigger>
                            <TabsTrigger value="rejected" className="rounded-lg text-xs font-bold px-3 py-1">Rejected</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        {filteredProposals.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/10 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                            <th className="py-4 px-6 md:px-8">Printer Press</th>
                                            <th className="py-4 px-6">Option Details</th>
                                            <th className="py-4 px-6">Category</th>
                                            <th className="py-4 px-6">Technical Description</th>
                                            <th className="py-4 px-6">Est. Cost Addon</th>
                                            <th className="py-4 px-6">Date Proposed</th>
                                            <th className="py-4 px-6">Status</th>
                                            <th className="py-4 px-6 md:px-8 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                                        {filteredProposals.map((prop) => (
                                            <tr key={prop.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/5 transition-colors">
                                                {/* Printer Details */}
                                                <td className="py-4 px-6 md:px-8">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                            <Factory size={13} className="text-slate-400" />
                                                            {prop.printer.companyName || prop.printer.fullName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                            <MapPin size={11} /> {prop.printer.city || "N/A"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                            <Mail size={11} /> {prop.printer.email}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Title & reference images */}
                                                <td className="py-4 px-6">
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

                                                {/* Category */}
                                                <td className="py-4 px-6">
                                                    {getCategoryBadge(prop.optionType)}
                                                </td>

                                                {/* Technical Specs */}
                                                <td className="py-4 px-6 max-w-xs truncate text-slate-500 font-medium" title={prop.description}>
                                                    {prop.description}
                                                </td>

                                                {/* Cost */}
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

                                                {/* Proposed Date */}
                                                <td className="py-4 px-6 text-slate-500 font-medium">
                                                    {prop.createdAt ? format(new Date(prop.createdAt), 'dd MMM yyyy') : 'N/A'}
                                                </td>

                                                {/* Status */}
                                                <td className="py-4 px-6">
                                                    {getStatusBadge(prop.status)}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 md:px-8 text-right">
                                                    {prop.status === 'pending' ? (
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => handleAction(prop.id, 'rejected')}
                                                                disabled={processingId === prop.id}
                                                                className="h-8 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold"
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Button 
                                                                size="sm"
                                                                onClick={() => handleAction(prop.id, 'approved')}
                                                                disabled={processingId === prop.id}
                                                                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-md shadow-emerald-600/10"
                                                            >
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-medium italic">
                                                            Reviewed on {prop.updatedAt ? format(new Date(prop.updatedAt), 'dd MMM') : 'N/A'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6">
                                <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-3 animate-pulse" />
                                <h4 className="font-bold text-slate-700 dark:text-slate-300">No suggestions in this category</h4>
                                <p className="text-slate-400 text-[11px] mt-1">
                                    All suggestions submitted by print presses will appear here for verification.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Tabs>
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
