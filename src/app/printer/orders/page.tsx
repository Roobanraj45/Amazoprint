'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { getPrinterAssignedOrders, updatePrinterOrderStatus, downloadShiprocketInvoice } from "@/app/actions/order-actions";
import { uploadShipmentAttachment } from "@/app/actions/upload-actions";
import {
    IndianRupee,
    Eye,
    Loader2,
    Search,
    Filter,
    Package,
    Printer,
    Clock,
    CheckCircle2,
    Download,
    RefreshCw,
    AlertTriangle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Truck,
    Hourglass,
    Ban,
    Zap,
    BarChart3,
    UploadCloud,
    CalendarDays,
    SlidersHorizontal,
    TrendingUp,
    Layers,
    ArrowRight,
    FileText,
    Circle,
    PackageCheck,
    Activity,
    CreditCard,
    User2,
    MapPin,
    Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn, resolveImagePath } from '@/lib/utils';
import {
    format,
    isToday,
    isThisWeek,
    isThisMonth,
    startOfDay,
    endOfDay,
} from 'date-fns';

type Order = Awaited<ReturnType<typeof getPrinterAssignedOrders>>[0];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
    label: string; color: string; bg: string; icon: React.ReactNode; dot: string; actionLabel?: string;
}> = {
    pending: {
        label: 'Pending Approval',
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        icon: <Hourglass className="h-3 w-3" />,
        actionLabel: 'Accept & Start',
    },
    confirmed: {
        label: 'Confirmed',
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
        icon: <CheckCircle2 className="h-3 w-3" />,
        actionLabel: 'Begin QC',
    },
    quality_check: {
        label: 'Quality Check',
        color: 'text-purple-700 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
        icon: <Zap className="h-3 w-3" />,
        actionLabel: 'Start Production',
    },
    processing: {
        label: 'In Production',
        color: 'text-indigo-700 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500',
        icon: <RefreshCw className="h-3 w-3" />,
        actionLabel: 'Submit Verification',
    },
    under_verification: {
        label: 'Awaiting Verification',
        color: 'text-orange-750 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
        icon: <Clock className="h-3 w-3" />,
    },
    ready_to_ship: {
        label: 'Ready to Ship',
        color: 'text-violet-750 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
        dot: 'bg-violet-500',
        icon: <Package className="h-3 w-3" />,
        actionLabel: 'Ship Order',
    },
    shipped: {
        label: 'Dispatched',
        color: 'text-cyan-700 dark:text-cyan-400',
        bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
        dot: 'bg-cyan-500',
        icon: <Truck className="h-3 w-3" />,
    },
    delivered: {
        label: 'Completed',
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        icon: <PackageCheck className="h-3 w-3" />,
    },
    cancelled: {
        label: 'Cancelled',
        color: 'text-rose-700 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
        icon: <Ban className="h-3 w-3" />,
    },
};

const STATUS_FLOW: Record<string, string> = {
    pending: 'confirmed',
    confirmed: 'quality_check',
    quality_check: 'processing',
    processing: 'under_verification',
    ready_to_ship: 'shipped',
};

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string | null }) {
    const cfg = STATUS_CONFIG[status ?? ''] ?? {
        label: status ?? 'Unknown',
        color: 'text-slate-500',
        bg: 'bg-slate-100 border-slate-200',
        dot: 'bg-slate-400',
        icon: <Circle className="h-3 w-3" />,
    };
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border',
            cfg.color, cfg.bg
        )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, accent, icon, trend }: {
    title: string; value: string | number; sub: string; accent: string;
    icon: React.ReactNode; trend?: { label: string; color: string };
}) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group cursor-default",
            "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800"
        )}>
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", accent)} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{title}</p>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                </div>
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">{sub}</p>
                {trend && (
                    <div className={cn(
                        'mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        trend.color
                    )}>
                        <TrendingUp className="h-2.5 w-2.5" /> {trend.label}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Alert banner ──────────────────────────────────────────────────────────────
function AlertBanner({ type, title, message, onDismiss }: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string; message: string; onDismiss: () => void;
}) {
    const config = {
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
            title: 'text-emerald-800 dark:text-emerald-300',
            text: 'text-emerald-700 dark:text-emerald-400',
        },
        error: {
            bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
            icon: <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />,
            title: 'text-rose-800 dark:text-rose-300',
            text: 'text-rose-700 dark:text-rose-400',
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
            icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />,
            title: 'text-amber-800 dark:text-amber-300',
            text: 'text-amber-700 dark:text-amber-400',
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
            icon: <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />,
            title: 'text-blue-800 dark:text-blue-300',
            text: 'text-blue-700 dark:text-blue-400',
        },
    }[type];

    return (
        <div className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border animate-in slide-in-from-right-4 duration-300 shadow-lg',
            config.bg
        )}>
            {config.icon}
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold', config.title)}>{title}</p>
                <p className={cn('text-[11px] mt-0.5', config.text)}>{message}</p>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <XCircle className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Status advance confirm ────────────────────────────────────────────────────
function ConfirmStatusDialog({
    isOpen, order, from, to, onClose, onConfirm, isPending,
}: {
    isOpen: boolean; order: Order; from: string; to: string;
    onClose: () => void;
    onConfirm: (
        dimensions?: { length: number; breadth: number; height: number; weight: number },
        attachmentsUrl?: string,
        customShipping?: { courierName: string; awbCode: string }
    ) => void;
    isPending: boolean;
}) {
    const [length, setLength] = useState(15);
    const [breadth, setBreadth] = useState(15);
    const [height, setHeight] = useState(10);
    const [weight, setWeight] = useState(0.5);

    const [shippingMethod, setShippingMethod] = useState<'shiprocket' | 'custom'>('shiprocket');
    const [courierName, setCourierName] = useState('');
    const [awbCode, setAwbCode] = useState('');

    const [attachmentsUrl, setAttachmentsUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    if (!isOpen) return null;
    const fromCfg = STATUS_CONFIG[from];
    const toCfg = STATUS_CONFIG[to];
    const isShipped = to === 'shipped';
    const isVerification = to === 'under_verification';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadShipmentAttachment(formData);
            if (res.success && res.url) {
                setAttachmentsUrl(res.url);
            } else {
                setUploadError(res.error || 'Upload failed');
            }
        } catch (err: any) {
            setUploadError(err.message || 'Error uploading file');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirm = () => {
        if (isShipped) {
            if (shippingMethod === 'custom') {
                if (!courierName.trim() || !awbCode.trim()) {
                    setUploadError('Please enter both the Courier Partner name and the AWB/Tracking ID.');
                    return;
                }
                onConfirm(undefined, attachmentsUrl || undefined, { courierName: courierName.trim(), awbCode: awbCode.trim() });
            } else {
                if (!attachmentsUrl) {
                    setUploadError('Please upload an image or video of the shipment package before confirming.');
                    return;
                }
                onConfirm({ length, breadth, height, weight }, attachmentsUrl, undefined);
            }
        } else if (isVerification) {
            if (!attachmentsUrl) {
                setUploadError('Please upload an image or video of the printed items for verification.');
                return;
            }
            onConfirm(undefined, attachmentsUrl, undefined);
        } else {
            onConfirm();
        }
    };
    // Parse customisation
    let parsedCustomisation: any = null;
    try {
        const raw = order.design?.customisation || (order as any).customisation;
        parsedCustomisation = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { }

    const pages = parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double Sided' : 'Single Sided';
    const dimensions = `${order.design?.width || order.designUpload?.width || 'N/A'} × ${order.design?.height || order.designUpload?.height || 'N/A'} mm`;
    const lamination = parsedCustomisation?.lamination || 'None';
    const spotUv = parsedCustomisation?.spotUv ? 'Yes' : 'No';
    const foil = parsedCustomisation?.foilName || parsedCustomisation?.foil || (parsedCustomisation?.foilId ? `Foil #${parsedCustomisation.foilId}` : 'None');

    return (
        <>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 print:hidden">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
                <div className={cn(
                    "relative bg-white dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-2xl p-6 w-full animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-y-auto",
                    (isShipped || isVerification) ? "max-w-lg" : "max-w-md"
                )}>
                    {/* Header Pills */}
                    <div className="flex items-center justify-center gap-3 mb-6 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-2xl w-fit mx-auto border border-slate-100 dark:border-zinc-900">
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all', fromCfg?.color, fromCfg?.bg)}>
                            {fromCfg?.icon} {fromCfg?.label}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all', toCfg?.color, toCfg?.bg)}>
                            {toCfg?.icon} {toCfg?.label}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-1">
                        {isVerification ? 'Submit Print Verification' : 'Update Order Status'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 text-center mb-6">
                        {isVerification ? (
                            <>Upload a photo or video of the finished print for order <span className="font-extrabold text-blue-600 dark:text-blue-400">#{order.id}</span>.</>
                        ) : (
                            <>Advance <span className="font-extrabold text-blue-600 dark:text-blue-400">Order #{order.id}</span> to <span className={cn('font-black', toCfg?.color)}>{toCfg?.label}</span>?</>
                        )}
                    </p>

                    {isVerification && (order as any).verificationRejectedReason && (
                        <div className="flex gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-[11px] text-rose-700 dark:text-rose-400 font-medium mb-4">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 animate-pulse" />
                            <div>
                                <span className="font-bold">Previous Verification Rejected:</span> {(order as any).verificationRejectedReason}
                            </div>
                        </div>
                    )}

                    {isShipped && (
                        <div className="space-y-5 mb-6 border-t border-slate-100 dark:border-zinc-900 pt-5">
                            
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.print()}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/25 text-blue-600 dark:text-blue-400 font-extrabold h-11 transition-all shadow-sm"
                            >
                                <Printer className="h-4 w-4 text-blue-500" />
                                Print Shipping Label & Packing Slip
                            </Button>

                            {/* Elegant Shipping & Order Details Card */}
                            <div className="rounded-2xl border border-slate-100 dark:border-zinc-900 overflow-hidden bg-gradient-to-b from-slate-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950 shadow-sm">
                                {/* Destination Section */}
                                <div className="p-4 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3 text-rose-500" /> Destination Address
                                    </p>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <User2 className="h-3.5 w-3.5 text-slate-400" />
                                            <p className="font-bold text-slate-800 dark:text-zinc-200">
                                                Recipient: <span className="font-medium text-slate-600 dark:text-zinc-400">{order.user.name}</span>
                                            </p>
                                        </div>
                                        {order.user.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                <p className="font-bold text-slate-800 dark:text-zinc-200">
                                                    Phone: <span className="font-medium text-slate-600 dark:text-zinc-400">{order.user.phone}</span>
                                                </p>
                                            </div>
                                        )}
                                        {order.shippingAddress && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                <p className="font-bold text-slate-800 dark:text-zinc-200 leading-relaxed">
                                                    Address: <span className="font-medium text-slate-600 dark:text-zinc-400">
                                                        {(() => {
                                                            const addr = order.shippingAddress as any;
                                                            return [addr?.addressLine1, addr?.addressLine2, addr?.city, addr?.state, addr?.zip, addr?.country]
                                                                .filter(Boolean).join(', ');
                                                        })()}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Specifications & Payout Section */}
                                <div className="p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-900/10 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                        <Package className="h-3 w-3 text-indigo-500" /> Order Specifications
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-zinc-200">
                                                Product: <span className="font-medium text-slate-600 dark:text-zinc-400 block truncate max-w-[200px]" title={order.directSellingProduct?.name || order.product?.name}>{order.directSellingProduct?.name || order.product?.name || 'Unspecified Product'}</span>
                                            </p>
                                            <p className="font-bold text-slate-800 dark:text-zinc-200">
                                                Quantity: <span className="font-semibold text-slate-600 dark:text-zinc-400">{order.quantity} pcs</span>
                                            </p>
                                            <p className="font-bold text-slate-800 dark:text-zinc-200">
                                                Payout: <span className="font-black text-emerald-600 dark:text-emerald-400">₹{parseFloat(order.printingAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1 border-l border-slate-200/60 dark:border-zinc-800/80 pl-3">
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold">
                                                Sides: <span className="font-normal">{pages}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold">
                                                Size: <span className="font-normal">{dimensions}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold">
                                                Lamination: <span className="font-normal">{lamination}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Method Selector */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Shipping Method</p>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => { setShippingMethod('shiprocket'); setUploadError(null); }}
                                        className={cn(
                                            "py-1.5 text-xs font-bold rounded-lg transition-all",
                                            shippingMethod === 'shiprocket'
                                                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
                                        )}
                                    >
                                        Shiprocket (Admin Approval)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShippingMethod('custom'); setUploadError(null); }}
                                        className={cn(
                                            "py-1.5 text-xs font-bold rounded-lg transition-all",
                                            shippingMethod === 'custom'
                                                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
                                        )}
                                    >
                                        Custom Courier (Direct Ship)
                                    </button>
                                </div>
                            </div>

                            {shippingMethod === 'shiprocket' ? (
                                <>
                                    {/* Informative Tip Box */}
                                    <div className="flex gap-2.5 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                                        <Zap className="h-4 w-4 shrink-0 text-blue-500" />
                                        <div>
                                            <span className="font-bold">Shiprocket Automation:</span> Confirming this state registers the shipment, creates a ready-to-ship order inside Shiprocket, and generates your tracking AWB.
                                        </div>
                                    </div>

                                    {/* Shiprocket Package Details Inputs */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Package Outer Dimensions</p>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Length (cm)</label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                                                    value={length} 
                                                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)} 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Breadth (cm)</label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                                                    value={breadth} 
                                                    onChange={(e) => setBreadth(parseFloat(e.target.value) || 0)} 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Height (cm)</label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                                                    value={height} 
                                                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} 
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Weight (kg)</label>
                                                <Input 
                                                    type="number" 
                                                    step="0.01"
                                                    className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                                                    value={weight} 
                                                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Informative Tip Box */}
                                    <div className="flex gap-2.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                        <PackageCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                                        <div>
                                            <span className="font-bold">Direct Dispatched:</span> Fill the courier partner and tracking details below. The order will be immediately marked as Shipped without requiring admin approval.
                                        </div>
                                    </div>

                                    {/* Custom Courier Details Inputs */}
                                    <div className="space-y-3.5">
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="custom-courier" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Courier Partner Name <span className="text-rose-500 font-bold">*</span></Label>
                                            <Input
                                                id="custom-courier"
                                                type="text"
                                                placeholder="e.g. BlueDart, DTDC, Professional, Self"
                                                className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                                                value={courierName}
                                                onChange={(e) => setCourierName(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="custom-awb" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">AWB / Tracking Number <span className="text-rose-500 font-bold">*</span></Label>
                                            <Input
                                                id="custom-awb"
                                                type="text"
                                                placeholder="e.g. AWB12345678"
                                                className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                                                value={awbCode}
                                                onChange={(e) => setAwbCode(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Shipment Proof Upload */}
                            <div className="space-y-2 border-t border-slate-100 dark:border-zinc-900 pt-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                    Shipment Package Proof (Image or Video) {shippingMethod === 'shiprocket' && <span className="text-rose-500 font-bold">*</span>}
                                </p>
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition relative">
                                    <input 
                                        type="file" 
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        disabled={uploading || isPending}
                                    />
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-1.5 py-2">
                                            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                                            <p className="text-xs text-slate-550 dark:text-zinc-400 font-bold">Uploading proof...</p>
                                        </div>
                                    ) : attachmentsUrl ? (
                                        <div className="flex flex-col items-center gap-1.5 py-1">
                                            <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-bounce" />
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Proof Uploaded Successfully!</p>
                                            <p className="text-[10px] text-slate-400 truncate max-w-[250px]">{attachmentsUrl.split('/').pop()}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 py-2">
                                            <UploadCloud className="h-6 w-6 text-slate-400" />
                                            <p className="text-xs text-slate-550 dark:text-zinc-400 font-bold">Click or drag image/video here</p>
                                            <p className="text-[9px] text-slate-400">Supported formats: JPG, PNG, MP4 (Max 50MB)</p>
                                        </div>
                                    )}
                                </div>
                                {uploadError && (
                                    <p className="text-xs text-rose-500 font-bold mt-1">{uploadError}</p>
                                )}
                            </div>

                        </div>
                    )}

                    {isVerification && (
                        <div className="space-y-4 mb-6 border-t border-slate-100 dark:border-zinc-900 pt-5">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                    Printed Item Proof (Image or Video) <span className="text-rose-500 font-bold">*</span>
                                </p>
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-6 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition relative">
                                    <input 
                                        type="file" 
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        disabled={uploading || isPending}
                                    />
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-1.5 py-2">
                                            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                                            <p className="text-xs text-slate-550 dark:text-zinc-400 font-bold">Uploading verification file...</p>
                                        </div>
                                    ) : attachmentsUrl ? (
                                        <div className="flex flex-col items-center gap-1.5 py-1">
                                            <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-bounce" />
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">File Uploaded Successfully!</p>
                                            <p className="text-[10px] text-slate-400 truncate max-w-[250px]">{attachmentsUrl.split('/').pop()}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 py-2 text-center">
                                            <UploadCloud className="h-6 w-6 text-slate-400" />
                                            <p className="text-xs text-slate-550 dark:text-zinc-400 font-bold">Click or drag print proof here</p>
                                            <p className="text-[9px] text-slate-400">Upload high-res photo or video of printed material</p>
                                        </div>
                                    )}
                                </div>
                                {uploadError && (
                                    <p className="text-xs text-rose-500 font-bold mt-1">{uploadError}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <Button variant="outline" className="flex-1 rounded-2xl font-bold h-11" onClick={onClose} disabled={isPending || uploading}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 rounded-2xl font-bold h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
                            onClick={handleConfirm}
                            disabled={isPending || uploading}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Update'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Printable Packing Slip & Shipping Label */}
            {isShipped && (
                <div className="hidden print:block p-8 bg-white text-black font-sans w-full max-w-[800px] mx-auto text-sm leading-relaxed">
                    {/* Header: Logo & Company Address */}
                    <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl font-black tracking-tight text-black">AMAZOPRINT</span>
                                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Return & Fulfillment Center</p>
                            <p className="text-xs text-slate-700 max-w-sm font-semibold">
                                No.21/2, Udayarpalayam, Attur Mainroad, Udayarpalayam, Thammampatti - 636113, Tamilnadu, India.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-600 font-bold space-y-1">
                            <p><span className="text-slate-400">GSTIN:</span> 33BNLPK5597H1ZJ</p>
                            <p><span className="text-slate-400">Email:</span> support@amazoprint.com</p>
                            <p><span className="text-slate-400">Phone:</span> +91 94983 38053 / 81110 63111</p>
                        </div>
                    </div>

                    {/* Packing Slip Details Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 border-y border-slate-200 py-2">
                            Shipping Label & Packing Slip
                        </h2>
                    </div>

                    {/* Addresses: Sender & Receiver */}
                    <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-slate-200">
                        {/* FROM: Sender details */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Sender (Return Address)
                            </h3>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-800 font-semibold">
                                <p className="font-extrabold text-sm text-slate-955">AMAZOPRINT</p>
                                <p>No.21/2, Udayarpalayam, Attur Mainroad</p>
                                <p>Udayarpalayam, Thammampatti - 636113</p>
                                <p>Tamilnadu, India.</p>
                                <p className="pt-2 font-bold text-slate-505">Ph: +91 94983 38053</p>
                            </div>
                        </div>

                        {/* TO: Receiver details */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Recipient (Deliver To)
                            </h3>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-800 font-semibold">
                                <p className="font-extrabold text-sm text-slate-955">{order.user.name}</p>
                                {order.shippingAddress ? (
                                    <>
                                        <p>{(order.shippingAddress as any).addressLine1}</p>
                                        {(order.shippingAddress as any).addressLine2 && <p>{(order.shippingAddress as any).addressLine2}</p>}
                                        <p>
                                            {[(order.shippingAddress as any).city, (order.shippingAddress as any).state, (order.shippingAddress as any).zip].filter(Boolean).join(', ')}
                                        </p>
                                        {(order.shippingAddress as any).country && <p>{(order.shippingAddress as any).country}</p>}
                                    </>
                                ) : (
                                    <p className="italic text-slate-400 font-medium">No address provided</p>
                                )}
                                {order.user.phone && <p className="pt-2 font-bold text-slate-505">Ph: {order.user.phone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Order Information & Carrier details */}
                    <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-slate-200 text-xs">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Order Context
                            </h3>
                            <div className="space-y-1.5 font-medium text-slate-800">
                                <p><span className="font-bold text-slate-500">Order ID:</span> #{order.id}</p>
                                <p><span className="font-bold text-slate-500">Order Date:</span> {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy, h:mm a') : 'N/A'}</p>
                                <p><span className="font-bold text-slate-500">Print Payout:</span> ₹{parseFloat(order.printingAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Shipment Carrier Details
                            </h3>
                            <div className="space-y-1.5 font-medium text-slate-800">
                                {shippingMethod === 'custom' ? (
                                    <>
                                        <p><span className="font-bold text-slate-500">Shipping Method:</span> Custom Courier</p>
                                        <p><span className="font-bold text-slate-500">Courier Name:</span> {courierName || 'Not specified'}</p>
                                        <p><span className="font-bold text-slate-500">AWB/Tracking ID:</span> {awbCode || 'Not generated'}</p>
                                    </>
                                ) : (
                                    <>
                                        <p><span className="font-bold text-slate-500">Shipping Method:</span> Shiprocket Automation</p>
                                        <p><span className="font-bold text-slate-500">Dimensions:</span> {length} × {breadth} × {height} cm</p>
                                        <p><span className="font-bold text-slate-500">Weight:</span> {weight} kg</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Item Specifications */}
                    <div className="space-y-3 mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Item Specifications
                        </h3>
                        <table className="w-full text-left border-collapse border border-slate-200">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-700">
                                    <th className="p-3">Product Name</th>
                                    <th className="p-3 text-center">Qty</th>
                                    <th className="p-3 text-center">Sides</th>
                                    <th className="p-3 text-center">Dimensions</th>
                                    <th className="p-3 text-center">Lamination</th>
                                    <th className="p-3 text-center">Spot UV</th>
                                    <th className="p-3 text-center">Foil</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                                <tr>
                                    <td className="p-3 font-bold text-slate-900">
                                        {order.directSellingProduct?.name || order.product?.name || 'Unspecified Product'}
                                    </td>
                                    <td className="p-3 text-center font-bold">{order.quantity} pcs</td>
                                    <td className="p-3 text-center">{pages}</td>
                                    <td className="p-3 text-center">{dimensions}</td>
                                    <td className="p-3 text-center">{lamination}</td>
                                    <td className="p-3 text-center">{spotUv}</td>
                                    <td className="p-3 text-center">{foil}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Declaration */}
                    <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8 border-t border-dashed border-slate-300">
                        Thank you for ordering with Amazoprint
                    </div>
                </div>
            )}
        </>
    );
}


// ── Spec chip ─────────────────────────────────────────────────────────────────
function SpecChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={cn(
            'flex flex-col gap-0.5 p-3 rounded-xl border',
            highlight
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'
        )}>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</span>
            <span className={cn('font-black text-xs', highlight ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-zinc-200')}>
                {value || '—'}
            </span>
        </div>
    );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border whitespace-nowrap flex items-center gap-1.5",
                active
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-600"
            )}
        >
            {label}
            {count !== undefined && (
                <span className={cn(
                    'h-4 min-w-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center',
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-100 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-48 bg-slate-100 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-6 w-24 bg-slate-100 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-zinc-800" />
                ))}
            </div>
        </div>
    );
}
// ── Invoice Download Button ────────────────────────────────────────────────────
function InvoiceDownloadButton({ orderId }: { orderId: number }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await downloadShiprocketInvoice(orderId);
            if (result.invoiceUrl) {
                window.open(result.invoiceUrl, '_blank');
            } else {
                setError('Invoice not available yet. The order may not have been dispatched via Shiprocket.');
            }
        } catch (err: any) {
            setError(err.message || 'Could not download invoice.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <Button
                onClick={handleClick}
                disabled={loading}
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1.5"
            >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {loading ? 'Fetching...' : 'Download Invoice'}
            </Button>
            {error && (
                <p className="text-[9px] text-rose-500 font-bold max-w-[200px]">{error}</p>
            )}
        </div>
    );
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({
    order,
    onStatusAdvance,
    advancingId,
}: {
    order: Order;
    onStatusAdvance: (order: Order) => void;
    advancingId: number | null;
}) {
    const [expanded, setExpanded] = useState(false);

    const statusCfg = STATUS_CONFIG[order.orderStatus ?? ''] ?? STATUS_CONFIG['pending'];
    const nextStatus = STATUS_FLOW[order.orderStatus ?? ''];
    const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;

    const isOverdue = order.orderStatus === 'pending' && order.printerAssignedAt &&
        (Date.now() - new Date(order.printerAssignedAt).getTime()) / 3600000 > 6;

    const productName = order.directSellingProduct?.name || order.product?.name || 'Unspecified Product';

    // Parse customisation
    let parsedCustomisation: any = null;
    try {
        const raw = order.design?.customisation || (order as any).customisation;
        parsedCustomisation = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { }

    const pages = parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double Sided' : 'Single Sided';
    const dimensions = `${order.design?.width || order.designUpload?.width || 'N/A'} × ${order.design?.height || order.designUpload?.height || 'N/A'} mm`;
    const spotUv = parsedCustomisation?.spotUv ? 'Yes' : 'No';
    const foil = parsedCustomisation?.foilName || parsedCustomisation?.foil || (parsedCustomisation?.foilId ? `Foil #${parsedCustomisation.foilId}` : 'None');
    const dieCut = parsedCustomisation?.dieCut ? `Shape #${parsedCustomisation.dieCut}` : 'Standard';
    const lamination = parsedCustomisation?.lamination || 'None';

    const handlePreviewDesign = () => {
        if (order.design) {
            const DPI = 300;
            const MM_TO_PX = DPI / 25.4;
            const design = order.design;
            const productForCanvas = {
                id: design.productSlug, name: design.name, description: '', imageId: '',
                width: Math.round(Number(design.width) * MM_TO_PX),
                height: Math.round(Number(design.height) * MM_TO_PX),
                type: '',
            };
            const isMultiPage = Array.isArray(design.elements) && Array.isArray(design.elements[0]);
            const renderPages = isMultiPage
                ? (design.elements as any[][]).map((els, i) => ({ elements: els, background: (design.background as any[])[i] }))
                : [{ elements: design.elements as any[], background: design.background as any }];
            localStorage.setItem('pdf_render_data', JSON.stringify({ pages: renderPages, product: productForCanvas, guides: (design.guides as any[]) || [], bleed: 18, safetyMargin: 18 }));
            window.open('/pdf-render', '_blank');
        } else if (order.designUpload) {
            window.open(resolveImagePath(order.designUpload.filePath), '_blank');
        }
    };

    return (
        <div className={cn(
            'rounded-2xl border transition-all duration-300 overflow-hidden bg-white dark:bg-zinc-900 group',
            isOverdue
                ? 'border-amber-300 dark:border-amber-800 shadow-amber-100 dark:shadow-amber-950/20 shadow-lg'
                : 'border-slate-200 dark:border-zinc-800 hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-zinc-900/60'
        )}>
            {/* Overdue banner */}
            {isOverdue && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider">
                    <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                    Action Overdue — Waiting &gt;6 hours for your approval
                </div>
            )}

            {/* Main row */}
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Order icon */}
                    <div className={cn(
                        'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px] text-white shadow-md',
                        order.orderStatus === 'processing' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30' :
                            order.orderStatus === 'shipped' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30' :
                                order.orderStatus === 'delivered' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' :
                                    isOverdue ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30' :
                                        'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-700/30'
                    )}>
                        #{order.id}
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[200px]" title={productName}>
                                {productName}
                            </h3>
                            <StatusPill status={order.orderStatus} />
                            {order.contestId && (
                                <span className="text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                                    Contest
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
                            <span className="flex items-center gap-1">
                                <User2 className="h-3 w-3" /> {order.user.name}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black text-[10px] border border-indigo-500/10">
                                <Layers className="h-3 w-3" /> {order.quantity} pcs
                            </span>
                            <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {format(new Date(order.createdAt), 'dd MMM yyyy, h:mm a')}
                            </span>
                        </div>
                    </div>

                    {/* Amount + action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Printing amount (what printer earns) */}
                        <div className="text-right">
                            <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-0.5 justify-end">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {parseFloat(order.printingAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Payout</p>
                            {(() => {
                                const paymentsList = (order as any).printerPayments || [];
                                const totalPaid = paymentsList.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
                                const balance = parseFloat(order.printingAmount || '0') - totalPaid;
                                if (totalPaid > 0) {
                                    return (
                                        <div className="text-[10px] space-y-0.5">
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">Paid: ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                            <p className={cn("font-bold", balance > 0 ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500")}>
                                                Bal: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        {/* Advance status button */}
                        {nextCfg && nextStatus && (
                            <button
                                onClick={() => onStatusAdvance(order)}
                                disabled={advancingId === order.id}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all duration-200',
                                    'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 hover:bg-blue-700',
                                    'disabled:opacity-60 disabled:cursor-not-allowed'
                                )}
                            >
                                {advancingId === order.id
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : nextCfg.icon
                                }
                                {statusCfg.actionLabel}
                            </button>
                        )}
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {expanded ? 'Collapse' : 'Job Specs'}
                        </button>
                    </div>
                </div>

                {/* Quick stats grid */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-zinc-900 rounded-xl p-3 border border-violet-200 dark:border-violet-900/60 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">Your Payout</p>
                        <p className="text-sm font-black text-violet-700 dark:text-violet-300">
                            ₹{parseFloat(order.printingAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-zinc-550 font-medium mt-0.5">Total contract rate</p>
                    </div>
                    {(() => {
                        const paymentsList = (order as any).printerPayments || [];
                        const totalPaid = paymentsList.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
                        const balance = parseFloat(order.printingAmount || '0') - totalPaid;
                        return (
                            <div className={cn(
                                "rounded-xl p-3 border shadow-sm",
                                balance > 0 
                                    ? "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/10 dark:to-zinc-900 border-amber-200 dark:border-amber-900/60"
                                    : "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/10 dark:to-zinc-900 border-emerald-200 dark:border-emerald-900/60"
                            )}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Payout Balance</p>
                                <p className={cn(
                                    "text-sm font-black",
                                    balance > 0 ? "text-amber-605 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[9px] text-slate-400 dark:text-zinc-550 font-medium mt-0.5">
                                    {balance > 0 ? `${((totalPaid / (parseFloat(order.printingAmount || '1') || 1)) * 100).toFixed(0)}% paid` : 'Fully settled'}
                                </p>
                            </div>
                        );
                    })()}
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Assigned At</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                            {order.printerAssignedAt ? format(new Date(order.printerAssignedAt), 'dd MMM') : '—'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                            {order.printerAssignedAt ? format(new Date(order.printerAssignedAt), 'h:mm a') : 'Not set'}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Est. Delivery</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                            {order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'dd MMM') : '—'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                            {order.trackingNumber ? `Track: ${order.trackingNumber}` : 'No tracking yet'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Expanded specs */}
            <div className={cn(
                'overflow-hidden transition-all duration-300',
                expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            )}>
                <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
                    <div className="p-5 space-y-4">
                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                            <Link href={`/printer/orders/${order.id}`}>
                                <Button size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white gap-1.5">
                                    <Eye className="h-3.5 w-3.5" /> Full Job Sheet
                                </Button>
                            </Link>
                            {order.designUpload && (
                                <a href={resolveImagePath(order.designUpload.filePath)} download>
                                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200 gap-1.5">
                                        <Download className="h-3.5 w-3.5 text-slate-400" /> Download File
                                    </Button>
                                </a>
                            )}
                            {order.design && (
                                <Button
                                    onClick={handlePreviewDesign}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200 gap-1.5"
                                >
                                    <FileText className="h-3.5 w-3.5 text-slate-400" /> Generate PDF
                                </Button>
                            )}
                            {/* Shiprocket Invoice Download — only for shipped orders */}
                            {order.orderStatus === 'shipped' && order.trackingNumber && (
                                <InvoiceDownloadButton orderId={order.id} />
                            )}
                        </div>

                        {/* Print specs grid */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Print Specifications</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                <SpecChip label="Print Sides" value={pages} highlight={pages === 'Double Sided'} />
                                <SpecChip label="Dimensions" value={dimensions} />
                                <SpecChip label="Spot UV" value={spotUv} highlight={spotUv === 'Yes'} />
                                <SpecChip label="Foil" value={foil} highlight={foil !== 'None'} />
                                <SpecChip label="Die Cut" value={dieCut} highlight={dieCut !== 'Standard'} />
                                <SpecChip label="Lamination" value={lamination} highlight={lamination !== 'None'} />
                            </div>
                        </div>

                        {/* Customer & shipping */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Customer Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 p-3">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Name</p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{order.user.name}</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 p-3">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{order.user.email}</p>
                                </div>
                                {order.user.phone && (
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 p-3">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{order.user.phone}</p>
                                    </div>
                                )}
                                {order.shippingAddress && (
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 p-3 sm:col-span-2 lg:col-span-3">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Shipping Address</p>
                                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                            {(() => {
                                                const addr = order.shippingAddress as any;
                                                return [addr?.addressLine1, addr?.addressLine2, addr?.city, addr?.state, addr?.zip, addr?.country]
                                                    .filter(Boolean).join(', ');
                                            })()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payout History Ledger */}
                        {((order as any).printerPayments && (order as any).printerPayments.length > 0) && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Payout History</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {(order as any).printerPayments.map((p: any) => (
                                        <div key={p.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between gap-1">
                                            <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                                                <span>₹{parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                <span className="text-[9px] text-slate-400 font-bold">{format(new Date(p.paymentDate), 'dd MMM yyyy')}</span>
                                            </div>
                                            {p.referenceNumber && (
                                                <p className="text-[9px] font-mono text-slate-400">Ref: {p.referenceNumber}</p>
                                            )}
                                            {p.notes && (
                                                <p className="text-[9px] text-slate-500 italic font-medium">{p.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PrinterOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [advancingId, setAdvancingId] = useState<number | null>(null);

    // Alerts
    const [alerts, setAlerts] = useState<Array<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>>([]);
    const addAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        const id = Date.now();
        setAlerts(a => [...a, { id, type, title, message }]);
        setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 5000);
    }, []);

    // Confirm dialog
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean; order: Order; from: string; to: string;
    } | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('assigned_newest');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPrinterAssignedOrders();
            setOrders(data);
        } catch (err: any) {
            addAlert('error', 'Failed to load orders', err.message || 'Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [addAlert]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Status advance
    const handleStatusAdvance = (order: Order) => {
        const nextStatus = STATUS_FLOW[order.orderStatus ?? ''];
        if (!nextStatus) return;
        setConfirmDialog({ isOpen: true, order, from: order.orderStatus ?? '', to: nextStatus });
    };

    const handleConfirmAdvance = (
        dimensions?: { length: number; breadth: number; height: number; weight: number },
        attachmentsUrl?: string,
        customShipping?: { courierName: string; awbCode: string }
    ) => {
        if (!confirmDialog) return;
        const { order, to } = confirmDialog;
        setAdvancingId(order.id);
        setConfirmDialog(null);

        startTransition(async () => {
            try {
                await updatePrinterOrderStatus(order.id, to, dimensions, attachmentsUrl, customShipping);
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, orderStatus: to } : o));
                const toCfg = STATUS_CONFIG[to];
                addAlert('success', 'Status Updated!',
                    `Order #${order.id} advanced to ${toCfg?.label ?? to}.`);
            } catch (err: any) {
                addAlert('error', 'Update Failed', err.message || 'Could not update order status.');
            } finally {
                setAdvancingId(null);
            }
        });
    };

    // Filter + sort
    const filtered = useMemo(() => {
        return orders.filter(order => {
            // Search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const hit = [
                    order.id.toString(),
                    order.user.name,
                    order.user.email,
                    order.product?.name,
                    order.directSellingProduct?.name,
                ].some(f => f?.toLowerCase().includes(q));
                if (!hit) return false;
            }

            // Status
            if (statusFilter !== 'all' && order.orderStatus !== statusFilter) return false;

            // Date
            if (dateFilter !== 'all') {
                if (!order.printerAssignedAt) {
                    return false;
                }
                const assigned = new Date(order.printerAssignedAt);
                if (dateFilter === 'today' && !isToday(assigned)) return false;
                if (dateFilter === 'this_week' && !isThisWeek(assigned)) return false;
                if (dateFilter === 'this_month' && !isThisMonth(assigned)) return false;
                if (dateFilter === 'custom' && startDate && endDate) {
                    const s = startOfDay(new Date(startDate));
                    const e = endOfDay(new Date(endDate));
                    if (assigned < s || assigned > e) return false;
                }
            }

            return true;
        });
    }, [orders, searchQuery, statusFilter, dateFilter, startDate, endDate]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (sortBy === 'assigned_newest') {
                const timeA = a.printerAssignedAt ? new Date(a.printerAssignedAt).getTime() : 0;
                const timeB = b.printerAssignedAt ? new Date(b.printerAssignedAt).getTime() : 0;
                if (timeA !== timeB) return timeB - timeA;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortBy === 'assigned_oldest') {
                const timeA = a.printerAssignedAt ? new Date(a.printerAssignedAt).getTime() : Infinity;
                const timeB = b.printerAssignedAt ? new Date(b.printerAssignedAt).getTime() : Infinity;
                if (timeA !== timeB) return timeA - timeB;
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === 'payout_high') return parseFloat(b.printingAmount || '0') - parseFloat(a.printingAmount || '0');
            return 0;
        });
    }, [filtered, sortBy]);

    // KPI stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.orderStatus === 'pending').length,
        processing: orders.filter(o => o.orderStatus === 'processing').length,
        shipped: orders.filter(o => o.orderStatus === 'shipped').length,
        delivered: orders.filter(o => o.orderStatus === 'delivered').length,
        overdue: orders.filter(o =>
            o.orderStatus === 'pending' && o.printerAssignedAt &&
            (Date.now() - new Date(o.printerAssignedAt).getTime()) / 3600000 > 6
        ).length,
        totalPayout: orders.reduce((sum, o) => sum + parseFloat(o.printingAmount || '0'), 0),
        todayOrders: orders.filter(o => o.printerAssignedAt && isToday(new Date(o.printerAssignedAt))).length,
    };

    const timeChips = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Custom', value: 'custom' },
    ];

    const statusChips = [
        { label: 'All Jobs', value: 'all', count: stats.total },
        { label: 'Pending', value: 'pending', count: stats.pending },
        { label: 'In Production', value: 'processing', count: stats.processing },
        { label: 'Dispatched', value: 'shipped', count: stats.shipped },
        { label: 'Completed', value: 'delivered', count: stats.delivered },
    ];

    const hasFilters = searchQuery || statusFilter !== 'all' || dateFilter !== 'all';

    return (
        <div className="space-y-6 min-h-screen p-6 lg:p-8 max-w-[1600px] mx-auto pb-20">

            {/* ── Confirm dialog */}
            {confirmDialog && (
                <ConfirmStatusDialog
                    isOpen={confirmDialog.isOpen}
                    order={confirmDialog.order}
                    from={confirmDialog.from}
                    to={confirmDialog.to}
                    onClose={() => setConfirmDialog(null)}
                    onConfirm={handleConfirmAdvance}
                    isPending={isPending}
                />
            )}

            {/* ── Floating alerts */}
            {alerts.length > 0 && (
                <div className="fixed top-28 right-4 z-[9999] w-full max-w-sm space-y-2">
                    {alerts.map(alert => (
                        <AlertBanner
                            key={alert.id}
                            type={alert.type}
                            title={alert.title}
                            message={alert.message}
                            onDismiss={() => setAlerts(a => a.filter(x => x.id !== alert.id))}
                        />
                    ))}
                </div>
            )}

            {/* Wrap standard page content so it hides on print */}
            <div className="space-y-6 print:hidden">
                {/* ── Page header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <Package className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Order Queue</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 ml-10">
                        Manage your assigned print jobs, track amounts & update production status
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); setStartDate(''); setEndDate(''); }}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold"
                        >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Clear
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(f => !f)}
                        className={cn('font-bold text-xs gap-1.5 rounded-xl', showFilters && 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 text-blue-600')}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filters
                        {hasFilters && <span className="h-4 w-4 rounded-full bg-blue-600 text-[9px] text-white flex items-center justify-center font-black">!</span>}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchOrders}
                        disabled={isLoading}
                        className="font-bold text-xs gap-1.5 rounded-xl"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                        Sync
                    </Button>
                </div>
            </div>

            {/* ── KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
                <div className="xl:col-span-2">
                    <KpiCard
                        title="Total Payout"
                        value={`₹${stats.totalPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        sub="Your total earnings"
                        accent="bg-gradient-to-br from-emerald-500/5 to-teal-500/10"
                        icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
                        trend={stats.todayOrders > 0 ? { label: `+${stats.todayOrders} today`, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' } : undefined}
                    />
                </div>
                <KpiCard
                    title="All Jobs"
                    value={stats.total}
                    sub="Total assigned"
                    accent="bg-gradient-to-br from-blue-500/5 to-indigo-500/10"
                    icon={<Package className="h-4 w-4 text-blue-500" />}
                />
                <KpiCard
                    title="Pending"
                    value={stats.pending}
                    sub="Awaiting action"
                    accent="bg-gradient-to-br from-amber-500/5 to-orange-500/10"
                    icon={<Hourglass className="h-4 w-4 text-amber-500" />}
                    trend={stats.overdue > 0 ? { label: `${stats.overdue} overdue!`, color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' } : undefined}
                />
                <KpiCard
                    title="In Production"
                    value={stats.processing}
                    sub="Currently printing"
                    accent="bg-gradient-to-br from-indigo-500/5 to-purple-500/10"
                    icon={<Printer className="h-4 w-4 text-indigo-500" />}
                />
                <KpiCard
                    title="Dispatched"
                    value={stats.shipped}
                    sub="Shipped orders"
                    accent="bg-gradient-to-br from-cyan-500/5 to-blue-500/10"
                    icon={<Truck className="h-4 w-4 text-cyan-500" />}
                />
                <KpiCard
                    title="Completed"
                    value={stats.delivered}
                    sub="Delivered orders"
                    accent="bg-gradient-to-br from-emerald-500/5 to-green-500/10"
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                />
                <KpiCard
                    title="Today's Jobs"
                    value={stats.todayOrders}
                    sub="New today"
                    accent="bg-gradient-to-br from-purple-500/5 to-violet-500/10"
                    icon={<Activity className="h-4 w-4 text-purple-500" />}
                />
            </div>

            {/* ── Overdue alert banner */}
            {stats.overdue > 0 && !isLoading && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                            {stats.overdue} order{stats.overdue !== 1 ? 's' : ''} overdue — waiting {'>'}6 hours for your approval!
                        </p>
                        <p className="text-[12px] text-rose-700 dark:text-rose-400 mt-0.5">
                            Delayed responses affect your press partner rating. Please review and accept immediately.
                        </p>
                    </div>
                    <button
                        onClick={() => { setStatusFilter('pending'); setDateFilter('all'); }}
                        className="shrink-0 text-[11px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors"
                    >
                        Review Now
                    </button>
                </div>
            )}

            {/* ── Filters panel */}
            <div className={cn(
                'overflow-hidden transition-all duration-300 rounded-2xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800',
                showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-0'
            )}>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">Advanced Filters</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="space-y-1.5 lg:col-span-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Order ID, customer name, email or product..."
                                    className="pl-9 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Production Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Jobs</SelectItem>
                                    <SelectItem value="pending">Pending Approval</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="quality_check">Quality Check</SelectItem>
                                    <SelectItem value="processing">In Production</SelectItem>
                                    <SelectItem value="shipped">Dispatched</SelectItem>
                                    <SelectItem value="delivered">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Sort */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sort By</Label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="assigned_newest">Newest Assigned</SelectItem>
                                    <SelectItem value="assigned_oldest">Oldest Assigned</SelectItem>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="payout_high">My Payout ↓</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Custom date */}
                    {dateFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From</Label>
                                <Input type="date" className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm"
                                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">To</Label>
                                <Input type="date" className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm"
                                    value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Toolbar: Status chips + date chips + search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                {/* Status filter chips */}
                <div className="flex flex-wrap gap-1.5">
                    {statusChips.map(chip => (
                        <FilterChip
                            key={chip.value}
                            label={chip.label}
                            active={statusFilter === chip.value}
                            onClick={() => setStatusFilter(chip.value)}
                            count={chip.count}
                        />
                    ))}
                </div>
                <div className="flex-1" />
                {/* Date chips */}
                <div className="flex flex-wrap gap-1.5">
                    {timeChips.map(c => (
                        <FilterChip
                            key={c.value}
                            label={c.label}
                            active={dateFilter === c.value}
                            onClick={() => {
                                setDateFilter(c.value);
                                if (c.value !== 'custom') { setStartDate(''); setEndDate(''); }
                            }}
                        />
                    ))}
                </div>
                {/* Quick search */}
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        placeholder="Quick search..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Summary bar */}
            {!isLoading && (
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                            Showing <span className="font-black text-slate-700 dark:text-zinc-200">{sorted.length}</span> of{' '}
                            <span className="font-black text-slate-700 dark:text-zinc-200">{orders.length}</span> jobs
                        </span>
                    </div>
                    {filtered.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                            <IndianRupee className="h-3 w-3" />
                            Filtered payout: ₹{filtered.reduce((s, o) => s + parseFloat(o.printingAmount || '0'), 0)
                                .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    )}
                    {hasFilters && (
                        <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                            Filtered
                        </span>
                    )}
                </div>
            )}

            {/* ── Order cards */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Package className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-700 dark:text-zinc-300 text-base">No orders found</p>
                        <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">
                            {hasFilters ? 'Try adjusting your filters or date range' : 'No orders have been assigned to you yet'}
                        </p>
                    </div>
                    {hasFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-bold text-xs"
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); }}
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusAdvance={handleStatusAdvance}
                            advancingId={advancingId}
                        />
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
