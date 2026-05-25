"use client";

import * as React from "react";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { updatePrinterOrderStatus } from "@/app/actions/order-actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OrderStatusDropdownProps {
    orderId: number;
    initialStatus: string;
}

const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-slate-500' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
    { value: 'quality_check', label: 'Quality Check', color: 'bg-amber-500' },
    { value: 'processing', label: 'Processing', color: 'bg-indigo-500' },
    { value: 'shipped', label: 'Shipped', color: 'bg-emerald-500' },
];

export function OrderStatusDropdown({ orderId, initialStatus }: OrderStatusDropdownProps) {
    const [status, setStatus] = React.useState(initialStatus);
    const [isPending, startTransition] = React.useTransition();
    const { toast } = useToast();

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        startTransition(async () => {
            try {
                const res = await updatePrinterOrderStatus(orderId, newStatus);
                if (res.success) {
                    toast({
                        title: "Status Updated",
                        description: `Order status changed to ${newStatus.replace(/_/g, ' ')} successfully.`,
                    });
                } else {
                    throw new Error("Failed to update status");
                }
            } catch (error: any) {
                setStatus(status); // Revert status
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message || "Failed to update order status.",
                });
            }
        });
    };

    const currentOption = statusOptions.find(o => o.value === status) || statusOptions[0];

    return (
        <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Workflow stage</span>
            <div className="relative min-w-[150px]">
                <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white rounded-xl h-10 px-3 hover:bg-white/10 transition-colors focus:ring-0 focus:ring-offset-0">
                        <SelectValue>
                            <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${currentOption.color} shrink-0`} />
                                <span className="text-xs font-bold tracking-tight capitalize">{currentOption.label}</span>
                            </span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                        {statusOptions.map((opt) => (
                            <SelectItem 
                                key={opt.value} 
                                value={opt.value} 
                                className="focus:bg-slate-800 focus:text-white rounded-lg py-2 px-3 text-xs font-medium cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                    <span>{opt.label}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {isPending && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}
