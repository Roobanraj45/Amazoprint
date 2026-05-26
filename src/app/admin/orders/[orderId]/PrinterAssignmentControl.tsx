'use client';

import { useState, useTransition } from "react";
import { assignPrinterToOrder } from "@/app/actions/order-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Printer, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface Printer {
    id: string;
    fullName: string;
    companyName: string | null;
    city: string | null;
}

interface PrinterAssignmentControlProps {
    orderId: number;
    currentPrinterId: string | null;
    currentPrintingAmount: string;
    printers: Printer[];
}

export function PrinterAssignmentControl({ orderId, currentPrinterId, currentPrintingAmount, printers }: PrinterAssignmentControlProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [selectedPrinter, setSelectedPrinter] = useState<string>(currentPrinterId || "none");
    const [amount, setAmount] = useState<string>(currentPrintingAmount || "0.00");

    const handleSave = () => {
        const targetId = selectedPrinter === "none" ? null : selectedPrinter;
        
        startTransition(async () => {
            try {
                const result = await assignPrinterToOrder(orderId, targetId, targetId ? amount : "0.00");
                if (result.success) {
                    toast({
                        title: "Assignment updated",
                        description: "Printer and cost saved successfully"
                    });
                }
            } catch (error) {
                toast({
                    title: "Update failed",
                    description: "Failed to assign printer",
                    variant: "destructive"
                });
            }
        });
    };

    const hasChanges = selectedPrinter !== (currentPrinterId || "none") || amount !== (currentPrintingAmount || "0.00");

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Printer assignment</span>
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
                        <SelectItem key={printer.id} value={printer.id} className="text-[11px] font-bold">
                            <div className="flex flex-col">
                                <span>{printer.fullName}</span>
                                {printer.companyName && (
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        {printer.companyName} {printer.city ? `(${printer.city})` : ''}
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedPrinter !== "none" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Printing Cost (Payout)</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isPending}
                            className="h-9 pl-8 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20"
                        />
                    </div>
                </div>
            )}

            <Button
                onClick={handleSave}
                disabled={isPending || !hasChanges}
                className="w-full h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
            >
                {isPending ? "Saving..." : "Save Assignment"}
            </Button>
        </div>
    );
}
