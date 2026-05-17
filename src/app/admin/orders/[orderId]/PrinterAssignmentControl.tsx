'use client';

import { useState, useTransition } from "react";
import { assignPrinterToOrder } from "@/app/actions/order-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Printer } from "lucide-react";
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
    printers: Printer[];
}

export function PrinterAssignmentControl({ orderId, currentPrinterId, printers }: PrinterAssignmentControlProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [selectedPrinter, setSelectedPrinter] = useState<string>(currentPrinterId || "none");

    const handleAssign = (printerId: string) => {
        const targetId = printerId === "none" ? null : printerId;
        setSelectedPrinter(printerId);
        
        startTransition(async () => {
            try {
                const result = await assignPrinterToOrder(orderId, targetId);
                if (result.success) {
                    toast({
                        title: "Assignment updated",
                        description: "Printer assigned successfully"
                    });
                }
            } catch (error) {
                toast({
                    title: "Update failed",
                    description: "Failed to assign printer",
                    variant: "destructive"
                });
                setSelectedPrinter(currentPrinterId || "none");
            }
        });
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Printer assigned</span>
                {isPending && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
            </div>
            <Select 
                value={selectedPrinter} 
                onValueChange={handleAssign}
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
        </div>
    );
}
