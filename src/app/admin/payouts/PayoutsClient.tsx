'use client';

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    CircleDollarSign, Search, Filter, X, CheckCircle2,
    AlertCircle, Clock, Trophy, Users, Landmark, FileCheck,
    CreditCard, Send, Copy, ExternalLink, ShieldCheck, Banknote,
    MessageSquareText, Info, Loader2, Sparkles, Receipt
} from "lucide-react";
import { format } from "date-fns";
import { resolveImagePath, cn } from "@/lib/utils";
import { disburseFreelancerPayout } from "@/app/actions/contest-actions";

interface BankDetail {
    id: string;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    branchName?: string | null;
    ifscCode: string;
    accountType?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
}

interface Winner {
    id: number;
    contestId: number;
    freelancerId: string;
    prizeAmount: string;
    rank: number | null;
    payoutStatus?: string | null;
    referenceNumber?: string | null;
    paymentMethod?: string | null;
    payoutNotes?: string | null;
    disbursedAt?: Date | string | null;
    createdAt?: Date | string | null;
    freelancer: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        profileImage?: string | null;
        bankDetails?: BankDetail[];
    };
}

interface Contest {
    id: number;
    userId: string;
    productId: number;
    productName: string;
    subProductId: number;
    subProductName: string;
    title: string;
    description: string | null;
    prizeAmount: string;
    maxFreelancers: number;
    entryFee: string | null;
    startDate: Date | string;
    endDate: Date | string;
    status: "active" | "completed" | "cancelled" | null;
    customisation: any;
    imageUrl: string | null;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
    user: {
        id: string;
        name: string;
        email: string;
    };
    winners: Winner[];
}

interface PayoutsClientProps {
    contests: Contest[];
}

interface PayoutTarget {
    contest: Contest;
    winner: Winner;
    amount: string;
}

export function PayoutsClient({ contests: initialContests }: PayoutsClientProps) {
    const { toast } = useToast();
    const [contestsList, setContestsList] = useState<Contest[]>(initialContests);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");

    // Modal state for disbursing payout
    const [payoutTarget, setPayoutTarget] = useState<PayoutTarget | null>(null);
    const [isDisbursing, setIsDisbursing] = useState(false);
    const [referenceNumber, setReferenceNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "upi" | "neft" | "imps" | "cheque" | "other">("bank_transfer");
    const [notes, setNotes] = useState("");
    const [sendNotification, setSendNotification] = useState(true);

    // Modal state for viewing receipt / payout details
    const [receiptTarget, setReceiptTarget] = useState<PayoutTarget | null>(null);

    // Open Disburse Dialog
    const openDisburseModal = (contest: Contest, winner: Winner, amount: string) => {
        setPayoutTarget({ contest, winner, amount });
        setReferenceNumber("");
        setPaymentMethod("bank_transfer");
        setNotes("");
        setSendNotification(true);
    };

    // Open Receipt Details Dialog
    const openReceiptModal = (contest: Contest, winner: Winner, amount: string) => {
        setReceiptTarget({ contest, winner, amount });
    };

    // Handle Form Submit for Payout Disbursement
    const handleSubmitPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payoutTarget) return;

        const trimmedRef = referenceNumber.trim();
        if (!trimmedRef) {
            toast({
                title: "Reference Number Required",
                description: "Please enter a valid Bank UTR, UPI Reference ID, or IMPS Transaction Number.",
                variant: "destructive"
            });
            return;
        }

        setIsDisbursing(true);
        try {
            const res = await disburseFreelancerPayout({
                contestId: payoutTarget.contest.id,
                winnerId: payoutTarget.winner.id,
                freelancerId: payoutTarget.winner.freelancerId,
                amount: Number(payoutTarget.amount),
                paymentMethod,
                referenceNumber: trimmedRef,
                notes: notes.trim() || undefined,
                sendNotification,
            });

            if (res.success) {
                // Update local state immediately
                setContestsList(prevList => prevList.map(c => {
                    if (c.id !== payoutTarget.contest.id) return c;
                    return {
                        ...c,
                        winners: c.winners.map(w => {
                            if (w.freelancerId !== payoutTarget.winner.freelancerId) return w;
                            return {
                                ...w,
                                payoutStatus: 'paid',
                                referenceNumber: trimmedRef,
                                paymentMethod,
                                payoutNotes: notes.trim() || null,
                                disbursedAt: new Date(),
                            };
                        })
                    };
                }));

                toast({
                    title: "Payout Disbursed Successfully 🎉",
                    description: `₹${Number(payoutTarget.amount).toLocaleString('en-IN')} sent to ${payoutTarget.winner.freelancer.name}. Reference: ${trimmedRef}${sendNotification ? ' (Notification & Message Sent)' : ''}`,
                });

                setPayoutTarget(null);
            }
        } catch (error: any) {
            toast({
                title: "Failed to Process Payout",
                description: error?.message || "An unexpected error occurred while saving payout.",
                variant: "destructive",
            });
        } finally {
            setIsDisbursing(false);
        }
    };

    // Filter logic
    const filteredContests = useMemo(() => {
        return contestsList.filter(contest => {
            const matchesSearch = !searchQuery.trim() ? true : (
                contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contest.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contest.winners.some(w =>
                    w.freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    w.freelancer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (w.referenceNumber && w.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                )
            );

            const allPaid = contest.winners.length > 0 && contest.winners.every(w => w.payoutStatus === 'paid');
            const nonePaid = contest.winners.length > 0 && contest.winners.every(w => w.payoutStatus !== 'paid');
            const partialPaid = !allPaid && !nonePaid;

            if (statusFilter === "all") return matchesSearch;
            if (statusFilter === "paid") return matchesSearch && allPaid;
            if (statusFilter === "pending") return matchesSearch && (nonePaid || partialPaid);
            return matchesSearch;
        });
    }, [contestsList, searchQuery, statusFilter]);

    // Financial Metrics
    const metrics = useMemo(() => {
        let totalCompleted = contestsList.length;
        let totalPrizeValue = 0;
        let totalDisbursed = 0;
        let totalPending = 0;

        contestsList.forEach(c => {
            c.winners.forEach(w => {
                const amount = Number(w.prizeAmount) || Number(c.prizeAmount) || 0;
                totalPrizeValue += amount;
                const isPaid = w.payoutStatus === 'paid';
                if (isPaid) {
                    totalDisbursed += amount;
                } else {
                    totalPending += amount;
                }
            });
        });

        return {
            totalCompleted,
            totalPrizeValue,
            totalDisbursed,
            totalPending
        };
    }, [contestsList]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard.`,
        });
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Hero Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 text-white p-8 sm:p-10 shadow-2xl border border-emerald-900/30">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 animate-pulse" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                                <Landmark className="w-3.5 h-3.5 mr-1.5 inline-block" />
                                Settlement & Disbursement Ledger
                            </Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Freelancer Payout Operations</h1>
                        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                            Track completed contest designs, capture bank transfer / UPI transaction reference numbers, and send automated notifications and disbursement messages directly to winning designers.
                        </p>
                    </div>

                    {/* Stats Summary Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto flex-shrink-0">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner">
                            <p className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.totalCompleted}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Closed Contests</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner">
                            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">₹{metrics.totalPrizeValue.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mt-1">Total Pool</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner">
                            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">₹{metrics.totalDisbursed.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-1">Disbursed</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner">
                            <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">₹{metrics.totalPending.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mt-1">Pending Transfer</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter controls */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <CircleDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Disbursement Filters</h2>
                    </div>
                    {searchQuery || statusFilter !== "all" ? (
                        <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} className="h-9 px-3 rounded-xl hover:bg-red-50 hover:text-red-600 text-destructive font-bold text-xs transition-colors">
                            <X className="w-4 h-4 mr-1.5" /> Clear Filters
                        </Button>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                    {/* Search Field */}
                    <div className="md:col-span-8 relative">
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by contest title, client name, designer name, or reference UTR..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 font-semibold text-sm shadow-inner"
                        />
                    </div>

                    {/* Status Dropdown */}
                    <div className="md:col-span-4">
                        <div className="flex gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl h-11">
                            <button
                                onClick={() => setStatusFilter("all")}
                                className={cn(
                                    "flex-1 text-center font-bold text-xs rounded-xl transition-all",
                                    statusFilter === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setStatusFilter("pending")}
                                className={cn(
                                    "flex-1 text-center font-bold text-xs rounded-xl transition-all",
                                    statusFilter === "pending" ? "bg-white dark:bg-slate-900 text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setStatusFilter("paid")}
                                className={cn(
                                    "flex-1 text-center font-bold text-xs rounded-xl transition-all",
                                    statusFilter === "paid" ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Paid
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Payouts Table */}
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
                    <CardTitle className="text-base font-bold">Contest Settlements</CardTitle>
                    <CardDescription className="text-xs">Manage individual freelancer rewards, capture UTR reference codes, and notify designers.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredContests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[80px] pl-6 font-bold text-[10px] uppercase text-slate-400">Contest ID</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">Campaign / Client</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">Tiers & Pools</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400 min-w-[360px]">Winning Designers & Payouts</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">Status</TableHead>
                                        <TableHead className="pr-6 text-right font-bold text-[10px] uppercase text-slate-400">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredContests.map((contest) => {
                                        const custom = contest.customisation || {};
                                        const tierName = custom.tierName || "Standard Tier";

                                        // Count paid vs unpaid winners
                                        const totalWinners = contest.winners.length;
                                        const paidWinnersCount = contest.winners.filter(w => w.payoutStatus === 'paid').length;
                                        const isFullyPaid = totalWinners > 0 && paidWinnersCount === totalWinners;
                                        const isPartiallyPaid = paidWinnersCount > 0 && paidWinnersCount < totalWinners;

                                        return (
                                            <TableRow key={contest.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                                                <TableCell className="pl-6 font-mono text-xs font-bold text-slate-400">
                                                    #{contest.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-xs text-slate-800 dark:text-slate-200">{contest.title}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">By Client: {contest.user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{contest.subProductName}</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Badge variant="secondary" className="px-1.5 py-0 text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold border-none uppercase rounded">{tierName}</Badge>
                                                            <span className="text-[10px] text-emerald-600 font-black">₹{Number(contest.prizeAmount).toLocaleString('en-IN')}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-3 py-4 max-w-[480px]">
                                                        {contest.winners.length > 0 ? (
                                                            contest.winners.map((winner) => {
                                                                const isPaid = winner.payoutStatus === 'paid';
                                                                const amount = Number(winner.prizeAmount) > 0 ? winner.prizeAmount : contest.prizeAmount;

                                                                return (
                                                                    <div key={winner.freelancerId} className={cn(
                                                                        "flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all",
                                                                        isPaid
                                                                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/50"
                                                                            : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/80"
                                                                    )}>
                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                            <Avatar className="h-8 w-8 rounded-xl ring-2 ring-white dark:ring-slate-800 shadow-sm">
                                                                                <AvatarImage src={winner.freelancer.profileImage ? resolveImagePath(winner.freelancer.profileImage) : ""} className="object-cover" />
                                                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl">
                                                                                    {winner.freelancer.name.charAt(0).toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="min-w-0">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate leading-tight">{winner.freelancer.name}</p>
                                                                                    <Badge className="text-[7px] font-black uppercase px-1 py-0 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-none rounded">
                                                                                        Rank #{winner.rank || 1}
                                                                                    </Badge>
                                                                                </div>
                                                                                <p className="text-[9px] font-semibold text-slate-400 truncate leading-none mt-0.5">{winner.freelancer.email}</p>
                                                                                
                                                                                {/* Reference Number Preview if Paid */}
                                                                                {isPaid && winner.referenceNumber && (
                                                                                    <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                                                        <Receipt className="w-3 h-3 flex-shrink-0" />
                                                                                        <span className="truncate">Ref: {winner.referenceNumber}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <div className="text-right">
                                                                                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹{Number(amount).toLocaleString('en-IN')}</p>
                                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Prize Reward</p>
                                                                            </div>
                                                                            
                                                                            {isPaid ? (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => openReceiptModal(contest, winner, amount)}
                                                                                    className="h-8 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1"
                                                                                >
                                                                                    <FileCheck className="w-3.5 h-3.5" />
                                                                                    <span>Receipt</span>
                                                                                </Button>
                                                                            ) : (
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => openDisburseModal(contest, winner, amount)}
                                                                                    className="h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1"
                                                                                >
                                                                                    <Banknote className="w-3.5 h-3.5" />
                                                                                    <span>Pay Out</span>
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                                <AlertCircle size={14} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">No winners assigned yet</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {isFullyPaid ? (
                                                        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full px-3 py-1">
                                                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Paid
                                                        </Badge>
                                                    ) : isPartiallyPaid ? (
                                                        <Badge className="bg-blue-500/10 hover:bg-blue-500/10 border border-blue-500/30 text-blue-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full px-3 py-1">
                                                            <Clock className="w-3 h-3 mr-1 inline" /> Partial ({paidWinnersCount}/{totalWinners})
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500/10 hover:bg-amber-500/10 border border-amber-500/30 text-amber-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full px-3 py-1">
                                                            <Clock className="w-3 h-3 mr-1 inline" /> Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    {contest.winners.length > 0 && !isFullyPaid && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                // Open disbursement for the first unpaid winner
                                                                const firstUnpaid = contest.winners.find(w => w.payoutStatus !== 'paid');
                                                                if (firstUnpaid) {
                                                                    const amount = Number(firstUnpaid.prizeAmount) > 0 ? firstUnpaid.prizeAmount : contest.prizeAmount;
                                                                    openDisburseModal(contest, firstUnpaid, amount);
                                                                }
                                                            }}
                                                            className="h-8 rounded-xl font-black text-[9px] uppercase border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
                                                        >
                                                            Process Payout
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 gap-4 bg-white dark:bg-slate-900">
                            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner">
                                <Landmark className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No Settlement Records</h3>
                                <p className="text-xs text-slate-500 max-w-sm mt-1">No completed contests match your active search terms or status criteria.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Modal: Disburse Payout (Capture Reference Number) ── */}
            <Dialog open={!!payoutTarget} onOpenChange={(open) => !open && !isDisbursing && setPayoutTarget(null)}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border-slate-200/80 dark:border-slate-800 shadow-2xl">
                    {payoutTarget && (
                        <form onSubmit={handleSubmitPayout} className="space-y-6">
                            <DialogHeader className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                        <Banknote className="w-3 h-3 mr-1 inline" /> Authorize Disbursement
                                    </Badge>
                                </div>
                                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    Capture Payout Reference & Disburse
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                                    Enter the bank settlement / UPI transaction reference number. This will mark the reward as disbursed and automatically notify the freelancer with full transfer details.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Contest & Winner Summary Box */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contest Campaign</p>
                                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{payoutTarget.contest.title}</p>
                                        <p className="text-[10px] font-semibold text-slate-500">{payoutTarget.contest.subProductName} • Contest #{payoutTarget.contest.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prize Amount</p>
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{Number(payoutTarget.amount).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                {/* Freelancer Pill */}
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="h-8 w-8 rounded-xl ring-1 ring-slate-200">
                                            <AvatarImage src={payoutTarget.winner.freelancer.profileImage ? resolveImagePath(payoutTarget.winner.freelancer.profileImage) : ""} />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs">
                                                {payoutTarget.winner.freelancer.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{payoutTarget.winner.freelancer.name}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 truncate">{payoutTarget.winner.freelancer.email}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 text-[9px] font-black uppercase">
                                        Rank #{payoutTarget.winner.rank || 1} Winner
                                    </Badge>
                                </div>

                                {/* Freelancer Bank Account Info if Available */}
                                {payoutTarget.winner.freelancer.bankDetails && payoutTarget.winner.freelancer.bankDetails.length > 0 ? (
                                    <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
                                        <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Registered Bank Account</span>
                                            {payoutTarget.winner.freelancer.bankDetails[0].isVerified && (
                                                <Badge className="bg-emerald-500/15 text-emerald-700 border-none text-[8px] font-black">Verified</Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[9px]">Account Holder:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{payoutTarget.winner.freelancer.bankDetails[0].accountHolderName}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[9px]">Bank & Branch:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{payoutTarget.winner.freelancer.bankDetails[0].bankName}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[9px]">Account Number:</span>
                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payoutTarget.winner.freelancer.bankDetails[0].accountNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[9px]">IFSC Code:</span>
                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payoutTarget.winner.freelancer.bankDetails[0].ifscCode}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[10px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                        <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
                                        <span>No bank account recorded on profile. Please ensure you have transferred funds to the designer's agreed UPI/bank account.</span>
                                    </div>
                                )}
                            </div>

                            {/* Form Input Fields */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                        <span>Transaction Reference / UTR Number <span className="text-red-500">*</span></span>
                                        <span className="text-[10px] font-normal text-slate-400">Required</span>
                                    </Label>
                                    <Input
                                        required
                                        placeholder="e.g. UTR9283749281, UPI/2026/893742, IMPS-984729"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-mono font-bold text-sm tracking-wide focus-visible:ring-emerald-500"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">Enter the official bank UTR or UPI transaction ID for verification & auditing.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Payment Method
                                        </Label>
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={(val: any) => setPaymentMethod(val)}
                                        >
                                            <SelectTrigger className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-bold text-xs">
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="bank_transfer">Bank Transfer (NEFT / RTGS)</SelectItem>
                                                <SelectItem value="imps">IMPS Instant Transfer</SelectItem>
                                                <SelectItem value="upi">UPI Direct Transfer</SelectItem>
                                                <SelectItem value="neft">NEFT Standard</SelectItem>
                                                <SelectItem value="cheque">Cheque / Direct Deposit</SelectItem>
                                                <SelectItem value="other">Other Settlement</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Admin Notes (Optional)
                                        </Label>
                                        <Input
                                            placeholder="e.g. Sent via Corporate Axis A/c"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-semibold text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Notification & Message Checkbox */}
                                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40">
                                    <input
                                        type="checkbox"
                                        id="send-notif"
                                        checked={sendNotification}
                                        onChange={(e) => setSendNotification(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <label htmlFor="send-notif" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        Send automatic in-app notification & chat message to the freelancer
                                        <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                                            The freelancer will receive a message with the UTR number, disbursed amount, and time stamp in their Support Chat & notification feed.
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isDisbursing}
                                    onClick={() => setPayoutTarget(null)}
                                    className="h-11 rounded-2xl font-bold text-xs uppercase px-5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isDisbursing || !referenceNumber.trim()}
                                    className="h-11 rounded-2xl font-black text-xs uppercase tracking-wider px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                                >
                                    {isDisbursing ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing Payout...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <Send className="w-3.5 h-3.5" />
                                            Confirm & Disburse ₹{Number(payoutTarget.amount).toLocaleString('en-IN')}
                                        </span>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Modal: View Payout Receipt / UTR Details ── */}
            <Dialog open={!!receiptTarget} onOpenChange={(open) => !open && setReceiptTarget(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-8 border-slate-200/80 dark:border-slate-800 shadow-2xl">
                    {receiptTarget && (
                        <div className="space-y-6">
                            <DialogHeader className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Disbursed & Settled
                                    </Badge>
                                </div>
                                <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                    Disbursement Receipt
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    Official payment voucher and reference code for contest reward settlement.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-4">
                                <div className="text-center pb-4 border-b border-slate-200/60 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disbursed Prize</p>
                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                        ₹{Number(receiptTarget.amount).toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-1">{receiptTarget.contest.title}</p>
                                </div>

                                <div className="space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Beneficiary:</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{receiptTarget.winner.freelancer.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Beneficiary Email:</span>
                                        <span className="font-medium text-slate-600 dark:text-slate-400">{receiptTarget.winner.freelancer.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Payment Mode:</span>
                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                                            {receiptTarget.winner.paymentMethod ? receiptTarget.winner.paymentMethod.replace('_', ' ') : 'Bank Transfer'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Settled On:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {receiptTarget.winner.disbursedAt ? format(new Date(receiptTarget.winner.disbursedAt), 'dd MMM yyyy, hh:mm a') : 'Recently'}
                                        </span>
                                    </div>

                                    {/* Highlighted Reference Number */}
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                                            Bank UTR / Payment Ref Number:
                                        </span>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-black text-sm text-emerald-900 dark:text-emerald-200 select-all">
                                                {receiptTarget.winner.referenceNumber || "REF-NOT-RECORDED"}
                                            </span>
                                            {receiptTarget.winner.referenceNumber && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(receiptTarget.winner.referenceNumber!, "Reference Number")}
                                                    className="h-7 px-2 text-emerald-700 hover:bg-emerald-500/20 rounded-lg text-xs"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {receiptTarget.winner.payoutNotes && (
                                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                            <span className="text-[9px] font-black uppercase text-slate-400 block">Admin Note:</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 italic">"{receiptTarget.winner.payoutNotes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    onClick={() => setReceiptTarget(null)}
                                    className="w-full h-11 rounded-2xl font-black text-xs uppercase bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    Close Receipt
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
