import { getContestWithSubmissions } from "@/app/actions/contest-actions";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { SubmissionPreview } from "./submission-preview";
import { getSession } from "@/lib/auth";
import { DeclareWinnerDialog } from "./DeclareWinnerDialog";
import { 
  Trophy, 
  Clock, 
  Coins, 
  Users, 
  Layout, 
  Calendar, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Scissors,
  Printer
} from "lucide-react";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { cardTextures, dieCuts } from "@/db/schema";

export default async function ClientContestDetailsPage({ params }: { params: { contestId: string }}) {
    const contestId = parseInt(params.contestId);
    if (isNaN(contestId)) {
        notFound();
    }
    
    const session = await getSession();
    if (!session) {
        notFound();
    }

    const contest = await getContestWithSubmissions(contestId);
    
    if (!contest) {
        notFound();
    }

    const submittedEntries = contest.participants.filter(p => p.submission || p.template);

    // Order Fulfillment & Winners declaration eligibility
    const order = contest.orders && contest.orders[0];
    const isOrdered = !!order;
    const orderedDesignId = order?.designId || null;
    const orderedTemplateId = order?.designUploadId || null;

    const canDeclareWinners = contest.status === 'active' && !isOrdered;
    const isCompleted = contest.status === 'completed';
    const winnersMap = new Map((contest.winners || []).map(w => [w.freelancerId, w.rank]));

    // Extract Customisations & Prepaid splitups
    const customisation = (contest.customisation as any) || {};
    const textureName = customisation.cardTexture?.name || "None";
    const shapeName = customisation.dieCut?.name || "None";

    const specsCost = Number(customisation.specsCost || 0);
    const printBaseCost = Number(customisation.printBaseCost || 0);
    const platformFee = Number(contest.entryFee || 0);
    const winnerPrize = Number(contest.prizeAmount || 0);
    const grandTotal = specsCost + platformFee + winnerPrize;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
            
            {/* Fulfillment Status Banner */}
            {isOrdered && (
                <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 shadow-inner flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse" /> ORDER FULFILLED
                        </h3>
                        <p className="text-xs font-semibold text-muted-foreground/90">
                            Prepaid print production has been successfully ordered and sent to our printing press partners.
                        </p>
                    </div>
                    <a
                        href="/client/orders"
                        className="text-xs font-extrabold px-4 py-2 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-md transition-all flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                    >
                        View Order Details <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Header, Winners & Submissions */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Hero Header Card */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/90 to-background/50 border border-border/80 p-6 sm:p-8 shadow-xl">
                        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2 items-center">
                                <Badge variant={isCompleted ? 'default' : 'secondary'} className="rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                                    Status: {contest.status}
                                </Badge>
                                {isOrdered && (
                                    <Badge className="bg-emerald-500 text-white rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                                        Fulfillment Complete
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{contest.title}</h1>
                                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">{contest.productName} — {contest.subProductName}</p>
                            </div>

                            {contest.description && (
                                <p className="text-xs font-semibold text-muted-foreground/80 bg-background/40 p-4 rounded-2xl border border-border/40 leading-relaxed">
                                    {contest.description}
                                </p>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                <div className="flex items-center gap-2.5 bg-background/50 p-3 rounded-2xl border border-border/50 shadow-sm">
                                    <div className="h-9 w-9 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                                        <Coins className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Prize Pool</p>
                                        <p className="text-xs font-black text-foreground">₹{Number(contest.prizeAmount).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 bg-background/50 p-3 rounded-2xl border border-border/50 shadow-sm">
                                    <div className="h-9 w-9 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Ends Date</p>
                                        <p className="text-xs font-black text-foreground">{format(new Date(contest.endDate), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 bg-background/50 p-3 rounded-2xl border border-border/50 shadow-sm col-span-2 sm:col-span-1">
                                    <div className="h-9 w-9 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Submissions</p>
                                        <p className="text-xs font-black text-foreground">{submittedEntries.length} Entries</p>
                                    </div>
                                </div>
                            </div>

                            {canDeclareWinners && (
                                <div className="pt-2 flex justify-end">
                                    <DeclareWinnerDialog contest={contest} submissions={submittedEntries} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Winners Panel */}
                    {isCompleted && contest.winners && contest.winners.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black tracking-wider text-muted-foreground uppercase">🏆 DECLARED WINNERS</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {contest.winners.map(winner => (
                                    <div key={winner.id} className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500">
                                            <Trophy size={24} className="animate-pulse" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-black text-sm text-foreground">
                                                {winner.rank === 1 ? '🥇 1st Place Champion' : winner.rank === 2 ? '🥈 2nd Place runner' : '🥉 3rd Place'}
                                            </p>
                                            <p className="text-xs font-bold text-amber-600/90">{winner.freelancer.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submissions Section */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-rose-500" /> Freelancer Submissions ({submittedEntries.length})
                        </h2>
                        
                        {submittedEntries.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {submittedEntries.map(participant => {
                                    const rank = winnersMap.get(participant.freelancer.id) || 0;
                                    const isThisSubmissionOrdered = 
                                        (participant.submission && participant.submission.id === orderedDesignId) ||
                                        (participant.template && participant.template.id === orderedTemplateId);
                                    return (
                                        <SubmissionPreview 
                                            key={participant.id} 
                                            contestId={contest.id}
                                            submission={participant.submission} 
                                            template={participant.template}
                                            freelancer={participant.freelancer} 
                                            client={contest.user}
                                            currentUser={session}
                                            rank={rank}
                                            isAlreadyOrdered={isOrdered}
                                            isThisSubmissionOrdered={!!isThisSubmissionOrdered}
                                            joinedAt={participant.joinedAt}
                                            isCompleted={isCompleted}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="rounded-3xl border-dashed border-border/80 p-8 text-center bg-card/45">
                                <CardContent className="space-y-2 p-0">
                                    <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/60 animate-bounce" />
                                    <p className="text-xs font-bold text-muted-foreground/80">No submissions have been uploaded for this contest yet.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right Column: Customisations & Prepaid Breakdown */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Launch Budget & Spec Breakdown panel */}
                    <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card to-background/30 p-6 shadow-xl space-y-6 sticky top-6">
                        
                        <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
                                <Printer className="w-4 h-4" /> Launched Brief & Specs
                            </h3>
                            <p className="text-[10px] font-semibold text-muted-foreground/90">
                                Comprehensive print customizations pre-paid for this contest
                            </p>
                        </div>

                        {/* Specs Sub-Breakdown */}
                        <div className="space-y-3 bg-background/50 p-4.5 rounded-2xl border border-border/50">
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
                                <Layout className="w-3.5 h-3.5 text-muted-foreground" /> Printing Parameters
                            </h4>
                            
                            <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-muted-foreground">Print Quantity</span>
                                    <span className="font-black text-foreground">{customisation.quantity || 100} units</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-muted-foreground">Pages / Sides</span>
                                    <span className="font-black text-foreground">{customisation.pages === 2 ? 'Double-Sided (2 Pages)' : 'Single-Sided (1 Page)'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-muted-foreground">Spot UV Finish</span>
                                    <span className="font-black text-foreground">{customisation.spotUv ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-muted-foreground" /> Card Texture
                                    </span>
                                    <span className="font-black text-foreground">{textureName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                                        <Scissors className="w-3 h-3 text-muted-foreground" /> Die-Cut Shape
                                    </span>
                                    <span className="font-black text-foreground">{shapeName}</span>
                                </div>

                                {customisation.addons && customisation.addons.length > 0 && (
                                    <div className="pt-2 border-t border-border/40 space-y-1">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Additional Add-ons</p>
                                        {customisation.addons.map((addon: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-[11px]">
                                                <span className="font-semibold text-muted-foreground/80">• {addon.name}</span>
                                                <span className="font-bold text-foreground">₹{Number(addon.price || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pricing Matrix Splitups */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
                                <Coins className="w-3.5 h-3.5 text-muted-foreground" /> Prepaid Payment Matrix
                            </h4>
                            
                            <div className="space-y-3 text-xs">
                                {/* Specifications Cost Sub-breakdown */}
                                {customisation.specsBreakdown && customisation.specsBreakdown.length > 0 ? (
                                    <div className="border-b border-border/40 pb-2.5 space-y-1.5 text-xs bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border">
                                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                                            <span>Base Printing ({customisation.quantity || 100} Units)</span>
                                            <span>₹{printBaseCost.toFixed(2)}</span>
                                        </div>
                                        {customisation.specsBreakdown.map((addon: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-muted-foreground pl-2 font-medium">
                                                <span>+ {addon.name}</span>
                                                <span>₹{Number(addon.totalAmount || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-black text-indigo-600 dark:text-indigo-400 pt-1.5 border-t border-dashed border-border/40">
                                            <span>Specifications Subtotal</span>
                                            <span>₹{specsCost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                        <span className="font-semibold text-muted-foreground">Specifications Printing</span>
                                        <span className="font-black text-foreground">₹{specsCost.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                    <span className="font-semibold text-muted-foreground">Platform matching fee</span>
                                    <span className="font-black text-foreground">₹{platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                    <span className="font-semibold text-rose-500">Winner prize pool escrow</span>
                                    <span className="font-black text-rose-500">₹{winnerPrize.toFixed(2)}</span>
                                </div>
                                
                                <div className="pt-3 flex justify-between items-center">
                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide text-[10px]">Grand aggregate total</span>
                                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Secure Seal Badging */}
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-2.5">
                            <div className="h-8 w-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                <Lock className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest">Prepaid Guarantee</p>
                                <p className="text-[8px] font-bold text-muted-foreground leading-none">Pre-authorized securely on launch</p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
