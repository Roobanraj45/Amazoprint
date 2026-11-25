"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { updateProposalStatusAdmin } from "@/app/actions/proposal-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
    CheckCircle2, Clock, XCircle, 
    FileText, Factory, MapPin, Loader2 
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

export function ProposalsAdminClient({ initialProposals }: { initialProposals: Proposal[] }) {
    const [proposals, setProposals] = React.useState<Proposal[]>(initialProposals);
    const [activeTab, setActiveTab] = React.useState("all");
    const [processingId, setProcessingId] = React.useState<number | null>(null);
    const { toast } = useToast();

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
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold gap-1">
                        <CheckCircle2 size={11} /> Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold gap-1">
                        <XCircle size={11} /> Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold gap-1">
                        <Clock size={11} /> Pending Review
                    </Badge>
                );
        }
    };

    const totalCount = proposals.length;
    const pendingCount = proposals.filter(p => p.status === 'pending').length;
    const approvedCount = proposals.filter(p => p.status === 'approved').length;
    const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

    const filteredProposals = proposals.filter(prop => {
        if (activeTab === "all") return true;
        return prop.status === activeTab;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Printer Suggestions</h1>
                <p className="text-xs text-slate-500 font-medium mt-1">Review new foil styles, paper types, or custom sizes proposed by printers.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Proposals</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><FileText size={18} /></div>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Review</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{pendingCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Clock size={18} /></div>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Approved Options</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{approvedCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={18} /></div>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-5 flex items-center justify-between rounded-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rejected Proposals</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{rejectedCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"><XCircle size={18} /></div>
                </Card>
            </div>

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
                                        <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                            <th className="py-4 px-6">Printer Press</th>
                                            <th className="py-4 px-4">Option</th>
                                            <th className="py-4 px-4">Description</th>
                                            <th className="py-4 px-4">Status</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                                        {filteredProposals.map((prop) => (
                                            <tr key={prop.id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <Factory size={14} className="text-primary" />
                                                        <div>
                                                            <p className="font-bold">{prop.printer?.companyName || prop.printer?.fullName}</p>
                                                            <p className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin size={10} /> {prop.printer?.city || 'India'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="font-bold">{prop.title}</p>
                                                    <span className="text-[10px] capitalize text-slate-500">{prop.optionType.replace('_', ' ')}</span>
                                                </td>
                                                <td className="py-4 px-4 max-w-xs truncate text-slate-600">{prop.description}</td>
                                                <td className="py-4 px-4">{getStatusBadge(prop.status)}</td>
                                                <td className="py-4 px-6 text-right">
                                                    {prop.status === 'pending' && (
                                                        <div className="inline-flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                disabled={processingId === prop.id}
                                                                onClick={() => handleAction(prop.id, 'approved')}
                                                                className="rounded-xl h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                                            >
                                                                {processingId === prop.id ? <Loader2 size={13} className="animate-spin" /> : 'Approve'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={processingId === prop.id}
                                                                onClick={() => handleAction(prop.id, 'rejected')}
                                                                className="rounded-xl h-8 text-xs font-bold"
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-xs text-slate-500">
                                No proposals found in this category.
                            </div>
                        )}
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}
