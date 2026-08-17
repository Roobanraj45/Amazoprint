'use client';

import { useState, useTransition } from "react";
import { assignPrinterToOrder, recordPrinterPayment } from "@/app/actions/order-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Printer, IndianRupee, Calendar, CreditCard, History, Crown, Sparkles, Calculator, Check, TrendingUp, Tag, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Printer {
    id: string;
    fullName: string;
    companyName: string | null;
    city: string | null;
    planName?: string | null;
}

interface PrinterPayment {
    id: string;
    amount: string;
    paymentDate: Date | string;
    paymentMethod: string;
    referenceNumber: string | null;
    notes: string | null;
}

export interface DirectSellingProductInfo {
    id: number;
    name: string;
    category?: string | null;
    basePrice?: string | number | null;
    costPrice?: string | number | null;
    sellingPrice?: string | number | null;
    sizes?: any;
}

interface PrinterAssignmentControlProps {
    orderId: number;
    currentPrinterId: string | null;
    currentPrintingAmount: string;
    printers: Printer[];
    printerPayments?: PrinterPayment[];
    directSellingProduct?: DirectSellingProductInfo | null;
    quantity?: number;
    selectedSize?: string | null;
    orderTotalAmount?: string | number | null;
}

export function PrinterAssignmentControl({ 
    orderId, 
    currentPrinterId, 
    currentPrintingAmount, 
    printers,
    printerPayments = [],
    directSellingProduct,
    quantity = 1,
    selectedSize,
    orderTotalAmount
}: PrinterAssignmentControlProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    
    // Calculate direct selling base price and suggestion
    const getDirectBasePrice = (): { unitBasePrice: number; sizeMatched: boolean; source: string } => {
        if (!directSellingProduct) return { unitBasePrice: 0, sizeMatched: false, source: 'none' };
        
        // 1. Check if size-specific base price or cost price exists
        if (selectedSize && directSellingProduct.sizes) {
            try {
                const parsedSizes = Array.isArray(directSellingProduct.sizes)
                    ? directSellingProduct.sizes
                    : typeof directSellingProduct.sizes === 'string' && directSellingProduct.sizes.trim().startsWith('[')
                        ? JSON.parse(directSellingProduct.sizes)
                        : [];
                
                const matched = parsedSizes.find((s: any) => {
                    if (typeof s === 'object' && s !== null) {
                        return (s.name || s.size || '').toLowerCase() === selectedSize.toLowerCase();
                    }
                    return false;
                });

                if (matched) {
                    const sizeBase = parseFloat(matched.basePrice || matched.costPrice || matched.price || '0');
                    if (!isNaN(sizeBase) && sizeBase > 0) {
                        return { unitBasePrice: sizeBase, sizeMatched: true, source: 'size' };
                    }
                }
            } catch (e) {
                console.error('Error parsing sizes for base price calculation', e);
            }
        }

        // 2. Base Price
        const rawBase = parseFloat(String(directSellingProduct.basePrice || '0'));
        if (!isNaN(rawBase) && rawBase > 0) {
            return { unitBasePrice: rawBase, sizeMatched: false, source: 'basePrice' };
        }

        // 3. Cost Price fallback
        const rawCost = parseFloat(String(directSellingProduct.costPrice || '0'));
        if (!isNaN(rawCost) && rawCost > 0) {
            return { unitBasePrice: rawCost, sizeMatched: false, source: 'costPrice' };
        }

        return { unitBasePrice: 0, sizeMatched: false, source: 'none' };
    };

    const { unitBasePrice, sizeMatched } = getDirectBasePrice();
    const orderQty = quantity || 1;
    const suggestedTotalPayout = unitBasePrice * orderQty;
    const totalOrderRevenue = parseFloat(String(orderTotalAmount || '0')) || (parseFloat(String(directSellingProduct?.sellingPrice || '0')) * orderQty);
    const estimatedPlatformMargin = totalOrderRevenue > suggestedTotalPayout ? totalOrderRevenue - suggestedTotalPayout : 0;
    const marginPercentage = totalOrderRevenue > 0 ? ((estimatedPlatformMargin / totalOrderRevenue) * 100).toFixed(0) : '0';

    // Core states
    const [selectedPrinter, setSelectedPrinter] = useState<string>(currentPrinterId || "none");
    const [amount, setAmount] = useState<string>(
        currentPrintingAmount && currentPrintingAmount !== "0.00" 
            ? currentPrintingAmount 
            : suggestedTotalPayout > 0 
                ? suggestedTotalPayout.toFixed(2) 
                : (currentPrintingAmount || "0.00")
    );
    const [advancePaid, setAdvancePaid] = useState<string>("0.00");
    const [advanceRefNumber, setAdvanceRefNumber] = useState<string>("");
    const [advancePaymentMethod, setAdvancePaymentMethod] = useState<string>("bank_transfer");
    const [advanceNotes, setAdvanceNotes] = useState<string>("");

    // Add installment payment states
    const [installmentAmount, setInstallmentAmount] = useState<string>("");
    const [refNumber, setRefNumber] = useState<string>("");
    const [paymentNotes, setPaymentNotes] = useState<string>("");

    // Calculate payouts totals
    const totalPaid = printerPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const printingCost = parseFloat(amount) || 0;
    const remainingBalance = printingCost - totalPaid;

    const handleApplySuggestedPayout = () => {
        if (suggestedTotalPayout > 0) {
            setAmount(suggestedTotalPayout.toFixed(2));
            toast({
                title: "Suggested Payout Applied",
                description: `Set printing payout to ₹${suggestedTotalPayout.toFixed(2)} based on base price ₹${unitBasePrice.toFixed(2)} × ${orderQty} units.`
            });
        }
    };

    const handleSaveAssignment = () => {
        const targetId = selectedPrinter === "none" ? null : selectedPrinter;
        const advVal = parseFloat(advancePaid) || 0;
        const costVal = parseFloat(amount) || 0;

        if (targetId && advVal > costVal) {
            toast({
                title: "Invalid advance amount",
                description: "Advance payment cannot exceed the total printing cost.",
                variant: "destructive"
            });
            return;
        }
        
        startTransition(async () => {
            try {
                const result = await assignPrinterToOrder(
                    orderId, 
                    targetId, 
                    targetId ? amount : "0.00",
                    targetId && advVal > 0 ? advancePaid : undefined,
                    advancePaymentMethod,
                    advanceRefNumber || undefined,
                    advanceNotes || undefined
                );
                if (result.success) {
                    toast({
                        title: "Assignment updated",
                        description: "Printer details saved successfully"
                    });
                    setAdvancePaid("0.00");
                    setAdvanceRefNumber("");
                    setAdvancePaymentMethod("bank_transfer");
                    setAdvanceNotes("");
                }
            } catch (error: any) {
                toast({
                    title: "Update failed",
                    description: error.message || "Failed to assign printer",
                    variant: "destructive"
                });
            }
        });
    };

    const handleAddInstallment = () => {
        const instVal = parseFloat(installmentAmount);
        if (isNaN(instVal) || instVal <= 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a positive amount.",
                variant: "destructive"
            });
            return;
        }

        if (instVal > remainingBalance) {
            toast({
                title: "Exceeds remaining balance",
                description: `Payment cannot exceed remaining balance of ₹${remainingBalance.toFixed(2)}`,
                variant: "destructive"
            });
            return;
        }

        startTransition(async () => {
            try {
                const result = await recordPrinterPayment({
                    orderId,
                    printerId: currentPrinterId!,
                    amount: installmentAmount,
                    paymentMethod: "bank_transfer",
                    referenceNumber: refNumber,
                    notes: paymentNotes
                });
                if (result.success) {
                    toast({
                        title: "Payment Recorded",
                        description: `Installment payout of ₹${instVal} successfully registered.`
                    });
                    setInstallmentAmount("");
                    setRefNumber("");
                    setPaymentNotes("");
                }
            } catch (error: any) {
                toast({
                    title: "Failed to record payment",
                    description: error.message || "Something went wrong.",
                    variant: "destructive"
                });
            }
        });
    };

    const hasAssignmentChanges = selectedPrinter !== (currentPrinterId || "none") || amount !== (currentPrintingAmount || "0.00");

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Printer Assignment</span>
                {isPending && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
            </div>
            
            <Select 
                value={selectedPrinter} 
                onValueChange={setSelectedPrinter}
                disabled={isPending}
            >
                <SelectTrigger className="h-9 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20">
                    <div className="flex items-center gap-2">
                        <Printer size={14} className={cn(selectedPrinter === "none" ? "text-slate-300" : "text-primary")} />
                        <SelectValue placeholder="Assign a printer" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-2xl">
                    <SelectItem value="none" className="text-[11px] font-bold text-slate-400">Unassigned</SelectItem>
                    {printers.map((printer) => (
                        <SelectItem 
                            key={printer.id} 
                            value={printer.id} 
                            className="text-[11px] font-bold p-1"
                        >
                            <div className={cn(
                                "flex flex-col w-full p-2 rounded-lg transition-all text-left",
                                printer.planName 
                                    ? "bg-amber-500/10 border-l-4 border-amber-500 pl-3 dark:bg-amber-500/20" 
                                    : ""
                            )}>
                                <div className="flex items-center justify-between gap-4 w-full">
                                    <div className="flex items-center gap-1.5">
                                        {printer.planName && <Crown size={12} className="text-amber-500 fill-amber-500 shrink-0 animate-pulse" />}
                                        <span className={cn(printer.planName ? "text-amber-950 dark:text-amber-300 font-black" : "")}>
                                            {printer.fullName}
                                        </span>
                                    </div>
                                    {printer.planName && (
                                        <span className="text-[7px] font-black px-2 py-0.5 bg-amber-500 text-white rounded uppercase tracking-widest scale-95 shrink-0 shadow-sm">
                                            {printer.planName}
                                        </span>
                                    )}
                                </div>
                                {printer.companyName && (
                                    <span className="text-[9px] text-slate-400 font-medium mt-1">
                                        {printer.companyName} {printer.city ? `(${printer.city})` : ''}
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Direct Selling Base Price & Payout Suggestion Card */}
            {directSellingProduct && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-800/50 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">
                            <Calculator size={13} className="text-indigo-600 dark:text-indigo-400" />
                            <span>Direct Selling Cost Suggestion</span>
                        </div>
                        {selectedSize && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                Size: {selectedSize}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Base Price / Unit</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-0.5 mt-0.5">
                                <IndianRupee size={10} className="text-slate-400" />
                                {unitBasePrice.toFixed(2)}
                            </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Order Quantity</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-0.5 mt-0.5">
                                {orderQty} {orderQty === 1 ? 'unit' : 'units'}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20">
                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Suggested Payout</span>
                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-0.5 mt-0.5">
                                <IndianRupee size={10} className="text-indigo-500" />
                                {suggestedTotalPayout.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {totalOrderRevenue > 0 && suggestedTotalPayout > 0 && (
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 px-1">
                            <span>Selling Total: ₹{totalOrderRevenue.toFixed(2)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-extrabold">
                                <TrendingUp size={10} />
                                Est. Margin: ₹{estimatedPlatformMargin.toFixed(2)} ({marginPercentage}%)
                            </span>
                        </div>
                    )}

                    {!currentPrinterId && suggestedTotalPayout > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleApplySuggestedPayout}
                            className="w-full h-7 text-[10px] font-bold bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-none gap-1.5 transition-all"
                        >
                            <Sparkles size={11} className="text-indigo-500" />
                            Apply Suggested Payout (₹{suggestedTotalPayout.toFixed(2)})
                        </Button>
                    )}
                </div>
            )}

            {selectedPrinter !== "none" && (
                <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Printing Cost (Payout)</label>
                            {suggestedTotalPayout > 0 && !currentPrinterId && (
                                <button
                                    type="button"
                                    onClick={handleApplySuggestedPayout}
                                    className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 flex items-center gap-0.5"
                                >
                                    <Sparkles size={9} />
                                    Use ₹{suggestedTotalPayout.toFixed(2)}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={isPending || !!currentPrinterId}
                                className="h-9 pl-8 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Show advance paid amount input only on initial assignment */}
                    {!currentPrinterId && (
                        <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Advance Payment (Optional)</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={advancePaid}
                                        onChange={(e) => setAdvancePaid(e.target.value)}
                                        disabled={isPending}
                                        className="h-9 pl-8 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 animate-in slide-in-from-top-1 duration-200">
                                {/* Reference Number */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Transaction Ref ID (Optional)</label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                        <Input
                                            type="text"
                                            placeholder="e.g. Transaction / UPI ID"
                                            value={advanceRefNumber}
                                            onChange={(e) => setAdvanceRefNumber(e.target.value)}
                                            disabled={isPending}
                                            className="h-8 pl-7 text-[10px] placeholder:text-[9px] font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-850 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                {/* Notes / Remarks */}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Notes (Optional)</label>
                                    <Input
                                        type="text"
                                        placeholder="Initial advance payment remarks"
                                        value={advanceNotes}
                                        onChange={(e) => setAdvanceNotes(e.target.value)}
                                        disabled={isPending}
                                        className="h-8 text-[10px] placeholder:text-[9px] font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-850 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!currentPrinterId && (
                <Button
                    onClick={handleSaveAssignment}
                    disabled={isPending || !hasAssignmentChanges}
                    className="w-full h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
                >
                    {isPending ? "Assigning..." : "Assign Printer & Cost"}
                </Button>
            )}

            {/* Display payments history, total paid, remaining balance if printer already assigned */}
            {currentPrinterId && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px]">
                        <div>
                            <span className="text-slate-400 font-bold block">TOTAL PAID</span>
                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-bold block">OUTSTANDING BALANCE</span>
                            <span className={cn(
                                "font-extrabold text-xs",
                                remainingBalance > 0 ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500"
                            )}>
                                ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Payments Timeline / History Ledger */}
                    {printerPayments.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5 text-slate-400" /> Payout History
                            </span>
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 no-scrollbar">
                                {printerPayments.map((p) => (
                                    <div key={p.id} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-350">₹{parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-[8px] text-slate-400 font-bold">
                                                {format(new Date(p.paymentDate), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                        {p.referenceNumber && (
                                            <p className="text-[8px] text-slate-400 font-mono">Ref: {p.referenceNumber}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form to add subsequent installment payments */}
                    {remainingBalance > 0 && (
                        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-2.5 transition-all duration-300 hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700/80">
                            {/* Decorative ambient background blur */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />
                            
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Record Installment
                                </span>
                                <span className="text-[8px] font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                    Bal: ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="space-y-2 relative z-10">
                                {/* Amount Input */}
                                <div className="space-y-0.5">
                                    <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Payout Amount (₹)</span>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="Enter amount..."
                                            value={installmentAmount}
                                            onChange={(e) => setInstallmentAmount(e.target.value)}
                                            disabled={isPending}
                                            className="h-8 pl-7 text-[10px] placeholder:text-[9px] font-bold rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 transition-all focus:border-emerald-500/50 focus:ring-emerald-500/10 dark:focus:border-emerald-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Transaction Ref ID Input */}
                                <div className="space-y-0.5">
                                    <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Transaction Ref ID</span>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input
                                            type="text"
                                            placeholder="e.g. TXN123456"
                                            value={refNumber}
                                            onChange={(e) => setRefNumber(e.target.value)}
                                            disabled={isPending}
                                            className="h-8 pl-7 text-[10px] placeholder:text-[9px] font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 transition-all focus:border-emerald-500/50 focus:ring-emerald-500/10 dark:focus:border-emerald-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Payment Notes Input */}
                                <div className="space-y-0.5">
                                    <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Internal Remarks / Notes</span>
                                    <Input
                                        type="text"
                                        placeholder="Add remarks..."
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        disabled={isPending}
                                        className="h-8 text-[10px] placeholder:text-[9px] font-semibold rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 transition-all focus:border-emerald-500/50 focus:ring-emerald-500/10 dark:focus:border-emerald-500/50"
                                    />
                                </div>

                                <Button
                                    onClick={handleAddInstallment}
                                    disabled={isPending || !installmentAmount}
                                    className="w-full h-8 rounded-lg text-[8.5px] font-bold uppercase tracking-wider bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Recording...
                                        </>
                                    ) : (
                                        "Register Payout"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
