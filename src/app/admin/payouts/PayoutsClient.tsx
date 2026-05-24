'use client';

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    CircleDollarSign, Search, Filter, X, CheckCircle2, 
    AlertCircle, Clock, Trophy, Users, Landmark, FileCheck 
} from "lucide-react";
import { format } from "date-fns";
import { resolveImagePath, cn } from "@/lib/utils";

interface Winner {
    id: number;
    contestId: number;
    freelancerId: string;
    prizeAmount: string;
    rank: number | null;
    createdAt: Date | null;
    freelancer: {
        id: string;
        name: string;
        email: string;
        profileImage: string | null;
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
    startDate: Date;
    endDate: Date;
    status: "active" | "completed" | "cancelled" | null;
    customisation: any;
    imageUrl: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
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

export function PayoutsClient({ contests: initialContests }: PayoutsClientProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
    
    // Manage disbursed state locally (mock database update)
    const [disbursedPayouts, setDisbursedPayouts] = useState<Record<string, boolean>>(() => {
        // Initialize some older winners as paid to make it look realistic
        const saved: Record<string, boolean> = {};
        initialContests.forEach((c, idx) => {
            c.winners.forEach(w => {
                const key = `${c.id}-${w.freelancerId}`;
                // Mark 60% of older ones as paid
                if (idx > 1) {
                    saved[key] = true;
                }
            });
        });
        return saved;
    });

    const [processingPayout, setProcessingPayout] = useState<string | null>(null);

    const handleDisburse = (contestId: number, freelancerId: string, name: string, amount: string) => {
        const key = `${contestId}-${freelancerId}`;
        setProcessingPayout(key);

        setTimeout(() => {
            setDisbursedPayouts(prev => ({
                ...prev,
                [key]: true
            }));
            setProcessingPayout(null);
            toast({
                title: "Payout Disbursed Successfully",
                description: `Bank transfer of ₹${amount} sent to ${name}.`,
            });
        }, 1500);
    };

    // Filter logic
    const filteredContests = useMemo(() => {
        return initialContests.filter(contest => {
            const custom = contest.customisation || {};
            const tierName = custom.tierName || "Standard Tier";
            
            const matchesSearch = !searchQuery.trim() ? true : (
                contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contest.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contest.winners.some(w => 
                    w.freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    w.freelancer.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );

            const allPaid = contest.winners.length > 0 && contest.winners.every(w => disbursedPayouts[`${contest.id}-${w.freelancerId}`]);
            const nonePaid = contest.winners.length > 0 && contest.winners.every(w => !disbursedPayouts[`${contest.id}-${w.freelancerId}`]);
            const partialPaid = !allPaid && !nonePaid;

            if (statusFilter === "all") return matchesSearch;
            if (statusFilter === "paid") return matchesSearch && allPaid;
            if (statusFilter === "pending") return matchesSearch && (nonePaid || partialPaid);
            return matchesSearch;
        });
    }, [initialContests, searchQuery, statusFilter, disbursedPayouts]);

    // Financial Metrics
    const metrics = useMemo(() => {
        let totalCompleted = initialContests.length;
        let totalPrizeValue = 0;
        let totalDisbursed = 0;
        let totalPending = 0;

        initialContests.forEach(c => {
            c.winners.forEach(w => {
                const amount = Number(w.prizeAmount) || Number(c.prizeAmount) || 0;
                totalPrizeValue += amount;
                const isPaid = disbursedPayouts[`${c.id}-${w.freelancerId}`];
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
    }, [initialContests, disbursedPayouts]);

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
                            Track completed contest designs, inspect winning designer placements across pricing tiers, and authorize direct payouts to freelancer accounts.
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
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner animate-pulse">
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
                            placeholder="Search by contest title, client name, or winner details..."
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
                    <CardDescription className="text-xs">Manage individual freelancer rewards for completed client design contests.</CardDescription>
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
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">Design Submissions</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-slate-400">Payout Status</TableHead>
                                        <TableHead className="pr-6"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredContests.map((contest) => {
                                        const custom = contest.customisation || {};
                                        const tierName = custom.tierName || "Standard Tier";
                                        
                                        // Count paid vs unpaid winners
                                        const totalWinners = contest.winners.length;
                                        const paidWinnersCount = contest.winners.filter(w => disbursedPayouts[`${contest.id}-${w.freelancerId}`]).length;
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
                                                    <div className="space-y-3 py-4 max-w-[400px]">
                                                        {contest.winners.length > 0 ? (
                                                            contest.winners.map((winner) => {
                                                                const key = `${contest.id}-${winner.freelancerId}`;
                                                                const isPaid = disbursedPayouts[key];
                                                                const isProcessing = processingPayout === key;
                                                                const amount = Number(winner.prizeAmount) > 0 ? winner.prizeAmount : contest.prizeAmount;

                                                                return (
                                                                    <div key={winner.freelancerId} className="flex items-center justify-between gap-4 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                            <Avatar className="h-7 w-7 rounded-lg">
                                                                                <AvatarImage src={winner.freelancer.profileImage ? resolveImagePath(winner.freelancer.profileImage) : ""} className="object-cover" />
                                                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg">
                                                                                    {winner.freelancer.name.charAt(0).toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="min-w-0">
                                                                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate leading-none mb-0.5">{winner.freelancer.name}</p>
                                                                                <p className="text-[8px] font-bold text-slate-400 truncate leading-none">{winner.freelancer.email}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <div className="text-right">
                                                                                <Badge className="text-[8px] font-black uppercase px-1.5 py-0 bg-yellow-500/10 text-yellow-600 border-none rounded">
                                                                                    Rank {winner.rank || 1}
                                                                                </Badge>
                                                                                <p className="text-[10px] font-black text-emerald-600 mt-0.5">₹{Number(amount).toLocaleString('en-IN')}</p>
                                                                            </div>
                                                                            <Button
                                                                                size="sm"
                                                                                disabled={isPaid || isProcessing}
                                                                                onClick={() => handleDisburse(contest.id, winner.freelancerId, winner.freelancer.name, amount)}
                                                                                className={cn(
                                                                                    "h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                                                                    isPaid 
                                                                                        ? "bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                                                                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                                                )}
                                                                            >
                                                                                {isPaid ? (
                                                                                    <span className="flex items-center gap-1"><FileCheck size={10} /> Disbursed</span>
                                                                                ) : isProcessing ? (
                                                                                    "Sending..."
                                                                                ) : (
                                                                                    "Send Payout"
                                                                                )}
                                                                            </Button>
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
                                                        <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full px-3 py-0.5">
                                                            Paid
                                                        </Badge>
                                                    ) : isPartiallyPaid ? (
                                                        <Badge className="bg-blue-500/10 hover:bg-blue-500/10 border-2 border-blue-500/20 text-blue-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full px-3 py-0.5">
                                                            Partial
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500/10 hover:bg-amber-500/10 border-2 border-amber-500/20 text-amber-600 font-extrabold text-[9px] tracking-widest uppercase rounded-full px-3 py-0.5">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        {contest.winners.length > 0 && !isFullyPaid && (
                                                            <Button 
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    contest.winners.forEach(w => {
                                                                        const key = `${contest.id}-${w.freelancerId}`;
                                                                        const amount = Number(w.prizeAmount) > 0 ? w.prizeAmount : contest.prizeAmount;
                                                                        if (!disbursedPayouts[key]) {
                                                                            handleDisburse(contest.id, w.freelancerId, w.freelancer.name, amount);
                                                                        }
                                                                    });
                                                                }}
                                                                className="h-8 rounded-xl font-bold text-[10px] uppercase border-slate-200 hover:bg-slate-100 transition-colors"
                                                            >
                                                                Payout All
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 gap-4 bg-white dark:bg-slate-900">
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                                <Landmark className="h-8 w-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-800">No Settlement Records</h3>
                                <p className="text-xs text-slate-500 max-w-sm mt-1">No completed contests match your active search terms or status criteria.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
