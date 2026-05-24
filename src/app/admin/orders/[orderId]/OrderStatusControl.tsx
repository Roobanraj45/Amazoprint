'use client';

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/order-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusControlProps {
    orderId: number;
    currentStatus: string;
    currentTrackingNumber?: string | null;
    currentEstimatedDeliveryDate?: string | null;
    currentActualDeliveryDate?: string | null;
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-500', defaultMsg: 'Order state reverted to pending' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-blue-500', defaultMsg: 'Order confirmed and ready for processing' },
    { value: 'quality_check', label: 'Quality Check', color: 'text-indigo-500', defaultMsg: 'Order design and materials are undergoing pre-press quality check' },
    { value: 'processing', label: 'In Production', color: 'text-orange-500', defaultMsg: 'Order has been sent to production' },
    { value: 'shipped', label: 'Shipped', color: 'text-purple-500', defaultMsg: 'Order has been dispatched' },
    { value: 'delivered', label: 'Delivered', color: 'text-emerald-500', defaultMsg: 'Order successfully delivered to customer' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-500', defaultMsg: 'Order has been cancelled' },
    { value: 'refunded', label: 'Refunded', color: 'text-gray-500', defaultMsg: 'Order has been refunded' },
];

export function OrderStatusControl({ 
    orderId, 
    currentStatus,
    currentTrackingNumber,
    currentEstimatedDeliveryDate,
    currentActualDeliveryDate
}: OrderStatusControlProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<string>(currentStatus);
    const [notes, setNotes] = useState<string>("");
    
    const [trackingNumber, setTrackingNumber] = useState<string>(currentTrackingNumber || "");
    const [estDeliveryDate, setEstDeliveryDate] = useState<string>(currentEstimatedDeliveryDate || "");
    const [actDeliveryDate, setActDeliveryDate] = useState<string>(currentActualDeliveryDate || "");

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        
        const option = STATUS_OPTIONS.find(opt => opt.value === newStatus);
        if (option) {
            setNotes(option.defaultMsg);
        }

        if (newStatus === 'delivered' && !actDeliveryDate) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            setActDeliveryDate(`${yyyy}-${mm}-${dd}`);
        }
    };

    const handleUpdate = () => {
        startTransition(async () => {
            try {
                const finalTracking = status === 'shipped' || status === 'delivered' ? trackingNumber : undefined;
                const finalEstDate = status === 'shipped' || status === 'delivered' ? estDeliveryDate : undefined;
                const finalActDate = status === 'delivered' ? actDeliveryDate : undefined;

                const result = await updateOrderStatus(
                    orderId,
                    status,
                    notes,
                    finalTracking,
                    finalEstDate,
                    finalActDate
                );

                if (result.success) {
                    toast({
                        title: "Status updated",
                        description: `Order status changed to ${status.replace(/_/g, ' ')}`
                    });
                    setNotes("");
                }
            } catch (error: any) {
                toast({
                    title: "Update failed",
                    description: error.message || "Failed to update order status",
                    variant: "destructive"
                });
            }
        });
    };

    const hasChanges = status !== currentStatus || 
        (status === 'shipped' && trackingNumber !== (currentTrackingNumber || "")) ||
        (status === 'shipped' && estDeliveryDate !== (currentEstimatedDeliveryDate || "")) ||
        (status === 'delivered' && actDeliveryDate !== (currentActualDeliveryDate || "")) ||
        notes.trim() !== "";

    const selectedOption = STATUS_OPTIONS.find(opt => opt.value === status);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Workflow Stage</span>
                    {isPending && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </div>
                <Select 
                    value={status} 
                    onValueChange={handleStatusChange}
                    disabled={isPending}
                >
                    <SelectTrigger className="h-9 text-[11px] font-bold rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-all focus:ring-primary/20">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full bg-current", selectedOption?.color || "text-slate-400")} />
                            <SelectValue placeholder="Select order status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-2xl">
                        {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-[11px] font-bold">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full bg-current", opt.color)} />
                                    <span>{opt.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {status !== currentStatus || notes !== "" ? (
                <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Log Comments / Notes</span>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter description/reasons for this update..."
                            className="text-[11px] font-medium rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary/20 min-h-[60px] resize-none"
                            disabled={isPending}
                        />
                    </div>

                    {(status === 'shipped' || status === 'delivered') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tracking Number</span>
                                <Input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="e.g. TRK123456"
                                    className="h-8 text-[11px] font-semibold rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary/20"
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Delivery Date</span>
                                <Input
                                    type="date"
                                    value={estDeliveryDate}
                                    onChange={(e) => setEstDeliveryDate(e.target.value)}
                                    className="h-8 text-[11px] font-semibold rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary/20"
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    )}

                    {status === 'delivered' && (
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Actual Delivery Date</span>
                            <Input
                                type="date"
                                value={actDeliveryDate}
                                onChange={(e) => setActDeliveryDate(e.target.value)}
                                className="h-8 text-[11px] font-semibold rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary/20"
                                disabled={isPending}
                            />
                        </div>
                    )}

                    <Button
                        onClick={handleUpdate}
                        disabled={isPending || !hasChanges}
                        className="w-full h-8 text-[10px] font-black uppercase tracking-wider rounded-xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
                    >
                        {isPending ? (
                            "Saving Stage Update..."
                        ) : (
                            "Apply Status Change"
                        )}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
