'use client';

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { assignOrderToFreelancerVerification } from "@/app/actions/verification-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, User, IndianRupee, MessageSquare, 
    CheckCircle2, Sparkles, Mail, UserCheck, Globe 
} from "lucide-react";
import { cn, resolveImagePath } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { FreelancerDirectoryDialog, FreelancerProfile } from "./FreelancerDirectoryDialog";

interface Freelancer {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    experienceYears: number | null;
}

interface Verification {
    id: number;
    title: string;
    verificationFee: string;
    status: 'pending' | 'assigned' | 'completed' | 'cancelled';
    freelancerId: string | null;
    freelancerFeedback: string | null;
    clientNotes: string | null;
    assignedAt: Date | string | null;
    completedAt: Date | string | null;
    createdAt: Date | string;
    freelancer?: {
        name: string;
        email: string;
        profileImage: string | null;
    } | null;
}

interface FreelancerVerificationControlProps {
    orderId: number;
    freelancers: Freelancer[];
    existingVerifications?: Verification[];
}

export function FreelancerVerificationControl({
    orderId,
    freelancers,
    existingVerifications = []
}: FreelancerVerificationControlProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const activeVerification = existingVerifications.find(v => v.status === 'assigned' || v.status === 'pending');
    const completedVerifications = existingVerifications.filter(v => v.status === 'completed');

    // State for toggling edit mode
    const [isEditing, setIsEditing] = useState(false);

    // Dialog state
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    // Assignment state
    const [assignmentType, setAssignmentType] = useState<'public' | 'direct'>(
        activeVerification ? (activeVerification.freelancerId ? 'direct' : 'public') : 'public'
    );
    const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(
        activeVerification && activeVerification.freelancer 
            ? {
                id: activeVerification.freelancerId!,
                name: activeVerification.freelancer.name,
                email: activeVerification.freelancer.email,
                profileImage: activeVerification.freelancer.profileImage,
                experienceYears: null,
              }
            : null
    );

    const [fee, setFee] = useState<string>("500.00");
    const [message, setMessage] = useState<string>("");

    // Sync state when activeVerification changes
    useEffect(() => {
        if (activeVerification) {
            setAssignmentType(activeVerification.freelancerId ? 'direct' : 'public');
            setSelectedFreelancer(activeVerification.freelancer 
                ? {
                    id: activeVerification.freelancerId!,
                    name: activeVerification.freelancer.name,
                    email: activeVerification.freelancer.email,
                    profileImage: activeVerification.freelancer.profileImage,
                    experienceYears: null,
                  }
                : null
            );
            setFee(activeVerification.verificationFee);
            setMessage(activeVerification.clientNotes || "");
        } else {
            setAssignmentType('public');
            setSelectedFreelancer(null);
            setFee("500.00");
            setMessage("");
        }
    }, [activeVerification]);

    const handleAssign = () => {
        if (assignmentType === 'direct' && !selectedFreelancer) {
            toast({
                title: "Designer selection required",
                description: "Please select a freelance designer to assign directly, or choose Post Publicly.",
                variant: "destructive"
            });
            return;
        }

        const feeVal = parseFloat(fee);
        if (isNaN(feeVal) || feeVal <= 0) {
            toast({
                title: "Invalid bounty fee",
                description: "Please enter a valid positive bounty fee.",
                variant: "destructive"
            });
            return;
        }

        startTransition(async () => {
            try {
                const res = await assignOrderToFreelancerVerification(
                    orderId,
                    assignmentType === 'direct' ? selectedFreelancer?.id || null : null,
                    fee,
                    message.trim()
                );
                if (res.success) {
                    toast({
                        title: activeVerification ? "Assignment Updated" : "Design Sent for Verification",
                        description: activeVerification 
                            ? "The verification request assignment has been updated successfully."
                            : "The verification request has been successfully assigned."
                    });
                    setIsEditing(false);
                    router.refresh();
                }
            } catch (err: any) {
                toast({
                    title: "Assignment failed",
                    description: err.message || "Failed to assign design verification.",
                    variant: "destructive"
                });
            }
        });
    };

    const getVerificationStatus = () => {
        if (activeVerification) {
            if (activeVerification.status === 'assigned') {
                return { label: 'Review in Progress', color: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30' };
            }
            return { label: 'Awaiting Freelancer', color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' };
        } else if (completedVerifications.length > 0) {
            return { label: 'Verified & Approved', color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' };
        }
        return { label: 'Not Initiated', color: 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700' };
    };

    const statusBadge = getVerificationStatus();

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Freelancer Review Assignment</span>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md", statusBadge.color)}>
                        {statusBadge.label}
                    </Badge>
                    {isPending && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </div>
            </div>

            {/* Currently Active Verification Job (Only shown when not editing) */}
            {activeVerification && !isEditing ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-500 text-white rounded-md uppercase tracking-wider scale-95 shrink-0 shadow-sm">
                            {activeVerification.freelancerId ? 'Direct Assignment' : 'Public Pool'}
                        </span>
                        {activeVerification.assignedAt && (
                            <span className="text-[8px] text-slate-400 font-bold">
                                Assigned: {format(new Date(activeVerification.assignedAt), 'dd MMM yyyy')}
                            </span>
                        )}
                    </div>

                    {activeVerification.freelancer ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200/60 shadow-sm">
                                {activeVerification.freelancer.profileImage ? (
                                    <Image
                                        src={resolveImagePath(activeVerification.freelancer.profileImage)}
                                        alt={activeVerification.freelancer.name}
                                        width={40}
                                        height={40}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-indigo-500" />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                                    {activeVerification.freelancer.name}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                                    <Mail size={11} className="text-slate-400" /> {activeVerification.freelancer.email}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200/60 shadow-sm">
                                <Globe className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                                    Public Verification Job
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium">
                                    Available to all certified freelancers in the pool.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 bg-white/60 dark:bg-slate-900/50 p-2.5 rounded-xl border border-indigo-50/50 dark:border-indigo-950 text-[10px]">
                        <div>
                            <span className="text-slate-400 font-bold block">VERIFICATION BOUNTY</span>
                            <span className="font-extrabold text-xs text-slate-850 dark:text-slate-200">₹{parseFloat(activeVerification.verificationFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-bold block">CURRENT STAGE</span>
                            <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">Reviewing Design</span>
                        </div>
                    </div>

                    {activeVerification.clientNotes && (
                        <div className="space-y-0.5 text-[10px]">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-slate-400" /> Instructions
                            </span>
                            <div className="p-2 bg-white/30 dark:bg-slate-900/20 rounded-lg border border-indigo-50/20 text-slate-600 dark:text-slate-350 italic">
                                "{activeVerification.clientNotes}"
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-1">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                                setIsEditing(true);
                            }}
                            className="h-7 px-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg border border-slate-200 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600 transition-all duration-300 shadow-sm"
                        >
                            Change Assignment
                        </Button>
                    </div>
                </div>
            ) : (
                /* Assignment / Edit Form */
                <div className="space-y-4">
                    
                    {/* Assignment Type Selector Cards (matching client screen style) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div 
                            onClick={() => setAssignmentType('public')}
                            className={cn(
                                "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 bg-card/60 backdrop-blur-md",
                                assignmentType === 'public'
                                    ? "border-emerald-500/30 bg-emerald-500/[0.02] shadow-sm ring-1 ring-emerald-500/10"
                                    : "border-border/60 hover:border-slate-400/40 hover:bg-slate-500/5"
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <Globe className={cn("w-4.5 h-4.5", assignmentType === 'public' ? "text-emerald-500" : "text-slate-400")} />
                                {assignmentType === 'public' && (
                                    <Badge className="bg-emerald-500 text-white font-extrabold uppercase text-[7px] tracking-widest px-1.5 py-0">Active</Badge>
                                )}
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-foreground">Post Publicly</h4>
                                <p className="text-[8px] text-muted-foreground font-semibold leading-tight">
                                    Open to all freelancers.
                                </p>
                            </div>
                        </div>

                        <div 
                            onClick={() => setAssignmentType('direct')}
                            className={cn(
                                "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 bg-card/60 backdrop-blur-md",
                                assignmentType === 'direct'
                                    ? "border-violet-500/30 bg-violet-500/[0.02] shadow-sm ring-1 ring-violet-500/10"
                                    : "border-border/60 hover:border-slate-400/40 hover:bg-slate-500/5"
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <UserCheck className={cn("w-4.5 h-4.5", assignmentType === 'direct' ? "text-violet-500" : "text-slate-400")} />
                                {assignmentType === 'direct' && (
                                    <Badge className="bg-violet-600 text-white font-extrabold uppercase text-[7px] tracking-widest px-1.5 py-0">Active</Badge>
                                )}
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-foreground">Assign Directly</h4>
                                <p className="text-[8px] text-muted-foreground font-semibold leading-tight">
                                    Select specific designer.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Direct Assignment Selection Summary or Button */}
                    {assignmentType === 'direct' && (
                        <div className="space-y-2">
                            {selectedFreelancer ? (
                                <div className="flex items-center justify-between p-3 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 shadow-inner gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-violet-500/20">
                                            {selectedFreelancer.profileImage ? (
                                                <img 
                                                    src={resolveImagePath(selectedFreelancer.profileImage)} 
                                                    alt={selectedFreelancer.name} 
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <User className="w-5 h-5 text-violet-500" />
                                            )}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-black text-foreground">{selectedFreelancer.name}</h4>
                                            <p className="text-[9px] text-slate-400 font-bold truncate max-w-[150px]">{selectedFreelancer.email}</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFreelancer(null)}
                                        className="h-7 rounded-lg font-bold text-[9px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 uppercase tracking-wider"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCatalogOpen(true)}
                                    className="w-full h-11 border-dashed border-violet-500/30 hover:border-violet-500/60 bg-violet-500/[0.01] hover:bg-violet-500/[0.04] text-violet-600 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs transition-all"
                                >
                                    <UserCheck className="w-4 h-4" /> Browse Elite Freelance Directory
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Verification Bounty (₹)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="500.00"
                                    value={fee}
                                    onChange={(e) => setFee(e.target.value)}
                                    disabled={isPending}
                                    className="h-9 pl-8 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Instructions / Message</label>
                            <Textarea
                                placeholder="Add instructions or specifications for this verification..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={isPending}
                                rows={3}
                                className="text-[10px] leading-relaxed placeholder:text-[9px] font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20 resize-none min-h-[60px]"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleAssign}
                                disabled={isPending}
                                className="flex-1 h-9 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600 transition-all duration-300 shadow-sm flex items-center justify-center gap-1"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={12} className="text-indigo-500" /> {activeVerification ? 'Update Assignment' : 'Send & Assign'}
                                    </>
                                )}
                            </Button>
                            {activeVerification && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                    }}
                                    disabled={isPending}
                                    className="h-9 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 hover:border-slate-300 dark:border-zinc-700 dark:hover:border-zinc-600 transition-all duration-300 shadow-sm"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Freelancer Portfolio Selection Dialog */}
            <FreelancerDirectoryDialog 
                isOpen={isCatalogOpen} 
                onOpenChange={setIsCatalogOpen} 
                onSelectFreelancer={(f) => {
                    setSelectedFreelancer({
                        id: f.id,
                        name: f.name,
                        email: f.email,
                        profileImage: f.profileImage || null,
                        experienceYears: f.experienceYears || null,
                    });
                }}
            />

            {/* Completed Verifications Timeline */}
            {completedVerifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed Design Audits
                    </span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                        {completedVerifications.map((v) => (
                            <div key={v.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-slate-700 dark:text-slate-350">
                                            {v.freelancer?.name || 'Freelancer'}
                                        </span>
                                    </div>
                                    <span className="text-[8px] text-slate-450 font-bold">
                                        {v.completedAt ? format(new Date(v.completedAt), 'dd MMM yyyy') : 'N/A'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[7.5px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-wider block">Freelancer Feedback</span>
                                    <p className="text-[10px] text-slate-650 dark:text-slate-300 font-semibold bg-emerald-500/5 dark:bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/10 italic">
                                        "{v.freelancerFeedback || 'Perfect. Design is print-ready!'}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
