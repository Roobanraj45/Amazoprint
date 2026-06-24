'use client';

import { useState, useTransition } from "react";
import { assignOrderToFreelancerVerification } from "@/app/actions/verification-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, IndianRupee, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Mail, Trophy, Clock } from "lucide-react";
import { cn, resolveImagePath } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";

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
    const [isPending, startTransition] = useTransition();

    const activeVerification = existingVerifications.find(v => v.status === 'assigned' || v.status === 'pending');
    const completedVerifications = existingVerifications.filter(v => v.status === 'completed');

    // State for toggling edit mode
    const [isEditing, setIsEditing] = useState(false);

    // Inputs for assignment
    const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>("none");
    const [fee, setFee] = useState<string>("500.00");
    const [message, setMessage] = useState<string>("");

    const handleAssign = () => {
        if (selectedFreelancerId === "none") {
            toast({
                title: "Freelancer required",
                description: "Please select a freelancer to verify the design.",
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
                    selectedFreelancerId,
                    fee,
                    message.trim()
                );
                if (res.success) {
                    toast({
                        title: activeVerification ? "Assignment Updated" : "Design Sent for Verification",
                        description: activeVerification 
                            ? "The verification request assignment has been updated successfully."
                            : "The verification request has been successfully assigned to the freelancer."
                    });
                    setSelectedFreelancerId("none");
                    setFee("500.00");
                    setMessage("");
                    setIsEditing(false);
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

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Freelancer Review Assignment</span>
                {isPending && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
            </div>

            {/* Currently Active Verification Job (Only shown when not editing) */}
            {activeVerification && !isEditing ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-500 text-white rounded-md uppercase tracking-wider scale-95 shrink-0 shadow-sm">
                            {activeVerification.status}
                        </span>
                        {activeVerification.assignedAt && (
                            <span className="text-[8px] text-slate-400 font-bold">
                                Assigned: {format(new Date(activeVerification.assignedAt), 'dd MMM yyyy')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200/60 shadow-sm">
                            {activeVerification.freelancer?.profileImage ? (
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
                                {activeVerification.freelancer?.name || 'Assigned Designer'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                                <Mail size={11} className="text-slate-400" /> {activeVerification.freelancer?.email}
                            </p>
                        </div>
                    </div>

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
                                <MessageSquare className="w-3 h-3 text-slate-400" /> Sent Message
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
                                setSelectedFreelancerId(activeVerification.freelancerId || "none");
                                setFee(activeVerification.verificationFee);
                                setMessage(activeVerification.clientNotes || "");
                                setIsEditing(true);
                            }}
                            className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border-indigo-200/50 dark:border-indigo-800/50 transition-all shadow-sm"
                        >
                            Change Assignment
                        </Button>
                    </div>
                </div>
            ) : (
                /* Assignment / Edit Form */
                <div className="space-y-3">
                    <Select
                        value={selectedFreelancerId}
                        onValueChange={setSelectedFreelancerId}
                        disabled={isPending}
                    >
                        <SelectTrigger className="h-9 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <User size={14} className={cn(selectedFreelancerId === "none" ? "text-slate-300" : "text-primary")} />
                                <SelectValue placeholder="Select Freelance Reviewer" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-2xl">
                            <SelectItem value="none" className="text-[11px] font-bold text-slate-400">Unassigned</SelectItem>
                            {freelancers.map((f) => (
                                <SelectItem
                                    key={f.id}
                                    value={f.id}
                                    className="text-[11px] font-bold p-2"
                                >
                                    {f.name} {f.experienceYears ? `(${f.experienceYears} Yrs Exp)` : '(Exp N/A)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedFreelancerId !== "none" && (
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
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Instructions / Message to Designer</label>
                                <Textarea
                                    placeholder="Add any specific layout check instructions, size/bleeds guidelines or specific messages for the verification request..."
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
                                    className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-650 dark:bg-indigo-500 text-white hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={12} /> {activeVerification ? 'Update Assignment' : 'Send & Assign'}
                                        </>
                                    )}
                                </Button>
                                {activeVerification && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setSelectedFreelancerId("none");
                                            setFee("500.00");
                                            setMessage("");
                                        }}
                                        disabled={isPending}
                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
