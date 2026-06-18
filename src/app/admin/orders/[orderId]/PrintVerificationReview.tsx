'use client';

import { useState, useTransition } from "react";
import { reviewPrintVerification } from "@/app/actions/order-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { resolveImagePath, cn } from "@/lib/utils";
import { 
    CheckCircle2, XCircle, FileImage, FileVideo, Eye, Loader2, 
    AlertTriangle, ShieldCheck, HelpCircle, ArrowRight 
} from "lucide-react";
import Image from 'next/image';

interface PrintVerificationReviewProps {
    orderId: number;
    verificationFileUrl: string;
    verificationFileStatus: string;
    verificationRejectedReason?: string | null;
    orderStatus: string;
}

export function PrintVerificationReview({
    orderId,
    verificationFileUrl,
    verificationFileStatus,
    verificationRejectedReason,
    orderStatus
}: PrintVerificationReviewProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const isVideo = verificationFileUrl.match(/\.(mp4|webm|ogg|mov)$/i) || verificationFileUrl.includes("video");
    const isPendingReview = orderStatus === 'under_verification' && verificationFileStatus === 'submitted';

    const handleReview = (approve: boolean) => {
        if (!approve && !rejectionReason.trim()) {
            toast({
                title: "Reason required",
                description: "Please specify why you are rejecting this print job.",
                variant: "destructive"
            });
            return;
        }

        startTransition(async () => {
            try {
                const res = await reviewPrintVerification(orderId, approve, approve ? undefined : rejectionReason.trim());
                if (res.success) {
                    toast({
                        title: approve ? "Verification Approved" : "Verification Rejected",
                        description: approve 
                            ? "Order has been moved to 'Ready to Ship' stage." 
                            : "Order returned to production phase."
                    });
                    setShowRejectionForm(false);
                    setRejectionReason("");
                }
            } catch (err: any) {
                toast({
                    title: "Review failed",
                    description: err.message || "Something went wrong.",
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <>
            <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            {isVideo ? <FileVideo size={16} /> : <FileImage size={16} />}
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight">Print Quality Verification</CardTitle>
                            <CardDescription className="text-[11px] font-medium">Verify actual printed item quality uploaded by printer</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {/* Media Preview Container */}
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-950 flex items-center justify-center aspect-video max-h-64">
                        {isVideo ? (
                            <video 
                                controls 
                                className="w-full h-full object-contain" 
                                src={resolveImagePath(verificationFileUrl)}
                            />
                        ) : (
                            <div className="w-full h-full relative">
                                <Image 
                                    src={resolveImagePath(verificationFileUrl)} 
                                    alt="Print verification proof" 
                                    layout="fill"
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                        )}
                        
                        {!isVideo && (
                            <button 
                                onClick={() => setLightboxOpen(true)}
                                className="absolute right-3 bottom-3 h-8 w-8 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"
                                title="Enlarge Proof"
                            >
                                <Eye size={14} />
                            </button>
                        )}
                    </div>

                    {/* Status indicator banner */}
                    <div className={cn(
                        "p-3.5 rounded-2xl border text-xs flex items-start gap-2.5",
                        verificationFileStatus === 'approved' && "bg-emerald-50 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400",
                        verificationFileStatus === 'rejected' && "bg-rose-50 dark:bg-rose-950/15 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400",
                        verificationFileStatus === 'submitted' && "bg-orange-50 dark:bg-orange-950/15 border-orange-100 dark:border-orange-900/30 text-orange-700 dark:text-orange-400"
                    )}>
                        {verificationFileStatus === 'approved' && (
                            <>
                                <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                                <div>
                                    <p className="font-bold">Print Verification Approved</p>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500/80 mt-0.5">The print quality has been approved. The printer is allowed to ship this order.</p>
                                </div>
                            </>
                        )}
                        {verificationFileStatus === 'rejected' && (
                            <>
                                <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500 animate-pulse" />
                                <div>
                                    <p className="font-bold">Print Verification Rejected</p>
                                    <p className="text-[10px] text-rose-600 dark:text-rose-500/80 mt-0.5 font-semibold">Reason: <span className="font-normal">{verificationRejectedReason || "No details provided"}</span></p>
                                </div>
                            </>
                        )}
                        {verificationFileStatus === 'submitted' && (
                            <>
                                <HelpCircle className="h-4.5 w-4.5 shrink-0 text-orange-500 animate-bounce" />
                                <div>
                                    <p className="font-bold">Awaiting Quality Verification</p>
                                    <p className="text-[10px] text-orange-600 dark:text-orange-500/80 mt-0.5">Printer has submitted this proof. Please check the print details before permitting shipment.</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Review Actions Panel */}
                    {isPendingReview && (
                        <div className="space-y-3 pt-2">
                            {!showRejectionForm ? (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleReview(true)}
                                        disabled={isPending}
                                        className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all"
                                    >
                                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                        Approve Quality
                                    </Button>
                                    <Button
                                        onClick={() => setShowRejectionForm(true)}
                                        disabled={isPending}
                                        variant="outline"
                                        className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1.5"
                                    >
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                        Reject Quality
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rejection Feedback</label>
                                        <Textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Specify what issues need to be resolved (e.g. alignment issues, blur, wrong materials)..."
                                            className="text-[11px] font-medium rounded-xl border-slate-200 dark:border-zinc-800 focus:ring-rose-500/20 min-h-[60px] resize-none"
                                            disabled={isPending}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleReview(false)}
                                            disabled={isPending || !rejectionReason.trim()}
                                            className="flex-1 h-8 text-[9px] font-black uppercase tracking-wider rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                                        >
                                            {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                                            Confirm Rejection
                                        </Button>
                                        <Button
                                            onClick={() => { setShowRejectionForm(false); setRejectionReason(""); }}
                                            disabled={isPending}
                                            variant="outline"
                                            className="flex-1 h-8 text-[9px] font-black uppercase tracking-wider rounded-xl"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fullscreen Lightbox Modal */}
            {lightboxOpen && !isVideo && (
                <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4">
                    <div className="absolute inset-0 cursor-zoom-out" onClick={() => setLightboxOpen(false)} />
                    <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-200">
                        <Image
                            src={resolveImagePath(verificationFileUrl)}
                            alt="Full proof size"
                            layout="fill"
                            className="object-contain pointer-events-none"
                            unoptimized
                        />
                        <button 
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
