'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import {
    getPrinterShipments,
    trackPrinterShipment,
    cancelPrinterShipment,
    generateShipmentLabel,
    generateShipmentManifest,
    schedulePrinterPickup,
} from '@/app/actions/order-actions';
import {
    Truck,
    Package,
    Search,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Loader2,
    Eye,
    Tag,
    FileText,
    Ban,
    MapPin,
    Clock,
    CalendarDays,
    Activity,
    ExternalLink,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Download,
    Boxes,
    Navigation,
    Circle,
    PackageCheck,
    SlidersHorizontal,
    BarChart3,
    TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Shipment = Awaited<ReturnType<typeof getPrinterShipments>>[0];

// ── Status config ─────────────────────────────────────────────────────────────
const SHIPMENT_STATUS_CONFIG: Record<string, {
    label: string; color: string; bg: string; dot: string; icon: React.ReactNode;
}> = {
    order_created: {
        label: 'Order Created',
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
        icon: <Package className="h-3 w-3" />,
    },
    awb_assigned: {
        label: 'AWB Assigned',
        color: 'text-indigo-700 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500',
        icon: <Tag className="h-3 w-3" />,
    },
    pickup_scheduled: {
        label: 'Pickup Scheduled',
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        icon: <Clock className="h-3 w-3" />,
    },
    in_transit: {
        label: 'In Transit',
        color: 'text-cyan-700 dark:text-cyan-400',
        bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
        dot: 'bg-cyan-500',
        icon: <Truck className="h-3 w-3" />,
    },
    out_for_delivery: {
        label: 'Out for Delivery',
        color: 'text-purple-700 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
        icon: <Navigation className="h-3 w-3" />,
    },
    delivered: {
        label: 'Delivered',
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
    rto_initiated: {
        label: 'RTO Initiated',
        color: 'text-orange-700 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
        icon: <AlertTriangle className="h-3 w-3" />,
    },
};

function getStatusConfig(status: string | null) {
    return SHIPMENT_STATUS_CONFIG[status ?? ''] ?? {
        label: status?.replace(/_/g, ' ') ?? 'Unknown',
        color: 'text-slate-500 dark:text-zinc-400',
        bg: 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800',
        dot: 'bg-slate-400',
        icon: <Circle className="h-3 w-3" />,
    };
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string | null }) {
    const cfg = getStatusConfig(status);
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
function KpiCard({ title, value, sub, accent, icon }: {
    title: string; value: string | number; sub: string; accent: string; icon: React.ReactNode;
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
            icon: <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />,
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
                <p className={cn('text-[11px] mt-0.5 break-words', config.text)}>{message}</p>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <XCircle className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Tracking Detail Modal ─────────────────────────────────────────────────────
function TrackingModal({ isOpen, onClose, trackingData, isLoading, shipment }: {
    isOpen: boolean;
    onClose: () => void;
    trackingData: any;
    isLoading: boolean;
    shipment: Shipment | null;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-cyan-500" />
                            Shipment Tracking
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <XCircle className="h-5 w-5" />
                        </button>
                    </div>
                    {shipment && (
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-slate-600 dark:text-zinc-400">
                                Order #{shipment.orderId}
                            </span>
                            {shipment.awbCode && (
                                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    AWB: {shipment.awbCode}
                                </span>
                            )}
                            {shipment.courierName && (
                                <span className="text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/30 px-2 py-1 rounded-lg text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                                    {shipment.courierName}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                            <p className="text-sm text-slate-500 font-medium">Fetching tracking info from Shiprocket...</p>
                        </div>
                    ) : trackingData ? (
                        <div className="space-y-5">
                            {/* Status summary */}
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Status</p>
                                    <StatusPill status={trackingData.currentStatus} />
                                </div>
                                {trackingData.estimatedDelivery && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Est. Delivery</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{trackingData.estimatedDelivery}</p>
                                    </div>
                                )}
                            </div>

                            {/* Activity timeline */}
                            {trackingData.activities && trackingData.activities.length > 0 ? (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Scan Activities</p>
                                    <div className="relative">
                                        <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-zinc-700" />
                                        <div className="space-y-3">
                                            {trackingData.activities.map((act: any, i: number) => (
                                                <div key={i} className="flex gap-3 relative">
                                                    <div className={cn(
                                                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0 z-10 border-2",
                                                        i === 0
                                                            ? "bg-cyan-500 border-cyan-500"
                                                            : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                                                    )}>
                                                        {i === 0 && <Circle className="h-2 w-2 text-white fill-white" />}
                                                    </div>
                                                    <div className="flex-1 pb-3">
                                                        <p className={cn(
                                                            "text-xs font-bold",
                                                            i === 0 ? "text-cyan-700 dark:text-cyan-400" : "text-slate-700 dark:text-zinc-300"
                                                        )}>
                                                            {act.activity || act.sr_status_label || act.status || 'Activity'}
                                                        </p>
                                                        {act.location && (
                                                            <p className="text-[11px] text-slate-500 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                                                                <MapPin className="h-3 w-3" /> {act.location}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-0.5">
                                                            {act.date || act['sr-status-date'] || ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-sm text-slate-400">
                                    No scan activities available yet.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-sm text-slate-400">
                            No tracking data available.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                    {shipment?.trackingUrl && (
                        <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View on Shiprocket
                        </a>
                    )}
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl font-bold ml-auto">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Cancel Confirm Modal ──────────────────────────────────────────────────────
function CancelConfirmModal({ isOpen, onClose, onConfirm, isPending, orderId }: {
    isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void; isPending: boolean; orderId: number;
}) {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                        <Ban className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Cancel Shipment</h3>
                        <p className="text-[11px] text-slate-500">Order #{orderId}</p>
                    </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4">
                    This will cancel the Shiprocket shipment and revert the order status back to <span className="font-bold text-indigo-600">In Production</span>.
                </p>

                <div className="space-y-1.5 mb-5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cancellation Reason</Label>
                    <Input
                        placeholder="Enter reason for cancellation..."
                        className="rounded-xl"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={onClose} disabled={isPending}>
                        Go Back
                    </Button>
                    <Button
                        className="flex-1 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25"
                        onClick={() => onConfirm(reason)}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Shipment'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SchedulePickupModal({ isOpen, onClose, onConfirm, isPending }: {
    isOpen: boolean; onClose: () => void; onConfirm: (dateTime: string) => void; isPending: boolean;
}) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    const [date, setDate] = useState(defaultDate);
    const [time, setTime] = useState('11:00');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Schedule Pickup Date & Time</h3>
                        <p className="text-[11px] text-slate-500">Choose preferred timing</p>
                    </div>
                </div>

                <div className="space-y-3 mb-5">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pickup Date</Label>
                        <Input
                            type="date"
                            className="rounded-xl"
                            value={date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pickup Time</Label>
                        <Input
                            type="time"
                            className="rounded-xl"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={onClose} disabled={isPending}>
                        Dismiss
                    </Button>
                    <Button
                        className="flex-1 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25"
                        onClick={() => onConfirm(`${date}T${time}`)}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                    </Button>
                </div>
            </div>
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
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/25"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-cyan-400 hover:text-cyan-600"
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
function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-100 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-48 bg-slate-100 dark:bg-zinc-800 rounded" />
            </div>
            <div className="h-6 w-24 bg-slate-100 dark:bg-zinc-800 rounded-full" />
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PrinterShipmentsPage() {
    const [shipmentsList, setShipmentsList] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    // Alerts
    const [alerts, setAlerts] = useState<Array<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>>([]);
    const addAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        const id = Date.now();
        setAlerts(a => [...a, { id, type, title, message }]);
        setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 6000);
    }, []);

    // Tracking modal
    const [trackingModal, setTrackingModal] = useState<{ isOpen: boolean; shipment: Shipment | null; data: any; loading: boolean }>({
        isOpen: false, shipment: null, data: null, loading: false,
    });

    // Cancel modal
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; orderId: number } | null>(null);

    // Pickup scheduling modal state
    const [pickupModal, setPickupModal] = useState<{ isOpen: boolean; shipment: Shipment | null }>({
        isOpen: false,
        shipment: null,
    });

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch
    const fetchShipments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPrinterShipments();
            setShipmentsList(data);
        } catch (err: any) {
            addAlert('error', 'Failed to load shipments', err.message || 'Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [addAlert]);

    useEffect(() => { fetchShipments(); }, [fetchShipments]);

    // Actions
    const handleTrack = async (shipment: Shipment) => {
        setTrackingModal({ isOpen: true, shipment, data: null, loading: true });
        try {
            const result = await trackPrinterShipment(shipment.orderId);
            setTrackingModal(prev => ({ ...prev, data: result, loading: false }));
            fetchShipments(); // refresh status
        } catch (err: any) {
            setTrackingModal(prev => ({ ...prev, loading: false }));
            addAlert('error', 'Tracking Failed', err.message || 'Could not fetch tracking data.');
        }
    };

    const handleGenerateLabel = async (shipment: Shipment) => {
        setActionLoadingId(shipment.id);
        try {
            const result = await generateShipmentLabel(shipment.orderId);
            if (result.labelUrl) {
                window.open(result.labelUrl, '_blank');
                addAlert('success', 'Label Generated', `Shipping label ready for Order #${shipment.orderId}.`);
            } else {
                addAlert('warning', 'Label Not Available', 'Shiprocket returned no label URL. The shipment may not be ready yet.');
            }
            fetchShipments();
        } catch (err: any) {
            addAlert('error', 'Label Generation Failed', err.message || 'Could not generate label.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleGenerateManifest = async (shipment: Shipment) => {
        setActionLoadingId(shipment.id);
        try {
            const result = await generateShipmentManifest(shipment.orderId);
            if (result.manifestUrl) {
                window.open(result.manifestUrl, '_blank');
                addAlert('success', 'Manifest Generated', `Manifest ready for Order #${shipment.orderId}.`);
            } else {
                addAlert('warning', 'Manifest Not Available', 'Shiprocket returned no manifest URL.');
            }
            fetchShipments();
        } catch (err: any) {
            addAlert('error', 'Manifest Generation Failed', err.message || 'Could not generate manifest.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSchedulePickupConfirm = async (pickupDateStr: string) => {
        const shipment = pickupModal.shipment;
        if (!shipment) return;
        setPickupModal({ isOpen: false, shipment: null });
        setActionLoadingId(shipment.id);
        try {
            await schedulePrinterPickup(shipment.orderId, pickupDateStr);
            addAlert('success', 'Pickup Scheduled', `Pickup has been successfully scheduled for Order #${shipment.orderId}.`);
            fetchShipments();
        } catch (err: any) {
            addAlert('error', 'Schedule Pickup Failed', err.message || 'Could not schedule pickup.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancelConfirm = (reason: string) => {
        if (!cancelModal) return;
        const { orderId } = cancelModal;
        setCancelModal(null);
        setActionLoadingId(orderId);

        startTransition(async () => {
            try {
                await cancelPrinterShipment(orderId, reason);
                addAlert('success', 'Shipment Cancelled', `Shipment for Order #${orderId} has been cancelled.`);
                fetchShipments();
            } catch (err: any) {
                addAlert('error', 'Cancellation Failed', err.message || 'Could not cancel shipment.');
            } finally {
                setActionLoadingId(null);
            }
        });
    };

    const filtered = useMemo(() => {
        const STATUS_ORDER = ['order_created', 'awb_assigned', 'pickup_scheduled', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'rto_initiated'];

        return shipmentsList
            .filter(s => {
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const hit = [
                        s.orderId.toString(),
                        s.awbCode,
                        s.courierName,
                        s.shiprocketOrderId,
                        s.order?.user?.name,
                        s.order?.product?.name,
                        s.order?.directSellingProduct?.name,
                    ].some(f => f?.toLowerCase().includes(q));
                    if (!hit) return false;
                }
                if (statusFilter !== 'all') {
                    const effectiveStatus = s.currentStatus || s.status;
                    if (effectiveStatus !== statusFilter) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [shipmentsList, searchQuery, statusFilter]);

    // Stats
    const stats = {
        total: shipmentsList.length,
        awbAssigned: shipmentsList.filter(s => (s.currentStatus || s.status) === 'awb_assigned').length,
        inTransit: shipmentsList.filter(s => ['in_transit', 'out_for_delivery', 'pickup_scheduled'].includes(s.currentStatus || s.status || '')).length,
        delivered: shipmentsList.filter(s => (s.currentStatus || s.status) === 'delivered').length,
        cancelled: shipmentsList.filter(s => (s.currentStatus || s.status) === 'cancelled').length,
    };

    const statusChips = [
        { label: 'All', value: 'all', count: stats.total },
        { label: 'AWB Assigned', value: 'awb_assigned', count: stats.awbAssigned },
        { label: 'In Transit', value: 'in_transit', count: stats.inTransit },
        { label: 'Delivered', value: 'delivered', count: stats.delivered },
        { label: 'Cancelled', value: 'cancelled', count: stats.cancelled },
    ];

    return (
        <div className="space-y-6 min-h-screen p-6 lg:p-8 max-w-[1600px] mx-auto pb-20">

            {/* Tracking modal */}
            <TrackingModal
                isOpen={trackingModal.isOpen}
                onClose={() => setTrackingModal({ isOpen: false, shipment: null, data: null, loading: false })}
                trackingData={trackingModal.data}
                isLoading={trackingModal.loading}
                shipment={trackingModal.shipment}
            />

            {/* Cancel modal */}
            {cancelModal && (
                <CancelConfirmModal
                    isOpen={cancelModal.isOpen}
                    onClose={() => setCancelModal(null)}
                    onConfirm={handleCancelConfirm}
                    isPending={isPending}
                    orderId={cancelModal.orderId}
                />
            )}

            {/* Schedule Pickup Modal */}
            <SchedulePickupModal
                isOpen={pickupModal.isOpen}
                onClose={() => setPickupModal({ isOpen: false, shipment: null })}
                onConfirm={handleSchedulePickupConfirm}
                isPending={isPending}
            />

            {/* Floating alerts */}
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

            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/30">
                            <Truck className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Shipping Report</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 ml-10">
                        Track, manage, and download labels for all your Shiprocket shipments
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchShipments}
                    disabled={isLoading}
                    className="font-bold text-xs gap-1.5 rounded-xl"
                >
                    <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                    Sync
                </Button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard
                    title="Total Shipments"
                    value={stats.total}
                    sub="All time shipments"
                    accent="bg-gradient-to-br from-blue-500/5 to-indigo-500/10"
                    icon={<Boxes className="h-4 w-4 text-blue-500" />}
                />
                <KpiCard
                    title="AWB Assigned"
                    value={stats.awbAssigned}
                    sub="Awaiting pickup"
                    accent="bg-gradient-to-br from-indigo-500/5 to-purple-500/10"
                    icon={<Tag className="h-4 w-4 text-indigo-500" />}
                />
                <KpiCard
                    title="In Transit"
                    value={stats.inTransit}
                    sub="On the way"
                    accent="bg-gradient-to-br from-cyan-500/5 to-blue-500/10"
                    icon={<Truck className="h-4 w-4 text-cyan-500" />}
                />
                <KpiCard
                    title="Delivered"
                    value={stats.delivered}
                    sub="Successfully delivered"
                    accent="bg-gradient-to-br from-emerald-500/5 to-green-500/10"
                    icon={<PackageCheck className="h-4 w-4 text-emerald-500" />}
                />
                <KpiCard
                    title="Cancelled"
                    value={stats.cancelled}
                    sub="Cancelled shipments"
                    accent="bg-gradient-to-br from-rose-500/5 to-pink-500/10"
                    icon={<Ban className="h-4 w-4 text-rose-500" />}
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
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
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        placeholder="Search AWB, order, courier..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Summary */}
            {!isLoading && (
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        Showing <span className="font-black text-slate-700 dark:text-zinc-200">{filtered.length}</span> of{' '}
                        <span className="font-black text-slate-700 dark:text-zinc-200">{shipmentsList.length}</span> shipments
                    </span>
                </div>
            )}

            {/* Shipments Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                {/* Table header */}
                <div className="hidden lg:grid lg:grid-cols-[80px_1fr_140px_140px_140px_120px_200px] gap-2 px-5 py-3 bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Order</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Customer / Product</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">AWB Code</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Courier</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Actions</span>
                </div>

                {isLoading ? (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Truck className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-700 dark:text-zinc-300 text-base">No shipments found</p>
                            <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">
                                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Shipments will appear here once orders are dispatched'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {filtered.map(shipment => {
                            const effectiveStatus = shipment.currentStatus || shipment.status;
                            const statusCfg = getStatusConfig(effectiveStatus);
                            const productName = shipment.order?.directSellingProduct?.name || shipment.order?.product?.name || 'Print Order';
                            const isCancelled = effectiveStatus === 'cancelled';
                            const isActionLoading = actionLoadingId === shipment.id;

                            return (
                                <div
                                    key={shipment.id}
                                    className={cn(
                                        "lg:grid lg:grid-cols-[80px_1fr_140px_140px_140px_120px_200px] gap-2 items-center px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors",
                                        isCancelled && "opacity-60"
                                    )}
                                >
                                    {/* Order ID */}
                                    <div className="flex items-center gap-2 lg:gap-0 mb-2 lg:mb-0">
                                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                                            #{shipment.orderId}
                                        </div>
                                    </div>

                                    {/* Customer / Product */}
                                    <div className="min-w-0 mb-2 lg:mb-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{productName}</p>
                                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                                            {shipment.order?.user?.name || 'Customer'} • Qty: {shipment.order?.quantity || '-'}
                                        </p>
                                    </div>

                                    {/* AWB Code */}
                                    <div className="mb-2 lg:mb-0">
                                        {shipment.awbCode ? (
                                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                                                {shipment.awbCode}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-slate-400 italic">Pending</span>
                                        )}
                                    </div>

                                    {/* Courier */}
                                    <div className="mb-2 lg:mb-0">
                                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">
                                            {shipment.courierName || '—'}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="mb-2 lg:mb-0">
                                        <StatusPill status={effectiveStatus} />
                                    </div>

                                    {/* Date */}
                                    <div className="mb-2 lg:mb-0">
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                                            {shipment.createdAt ? format(new Date(shipment.createdAt), 'dd MMM yy') : '—'}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {shipment.createdAt ? format(new Date(shipment.createdAt), 'h:mm a') : ''}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {/* Track */}
                                        <button
                                            onClick={() => handleTrack(shipment)}
                                            disabled={isActionLoading}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors disabled:opacity-50"
                                            title="Track Shipment"
                                        >
                                            <MapPin className="h-3 w-3" /> Track
                                        </button>

                                        {/* Label */}
                                        <button
                                            onClick={() => handleGenerateLabel(shipment)}
                                            disabled={isActionLoading || isCancelled}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors disabled:opacity-50"
                                            title="Generate Label"
                                        >
                                            {isActionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tag className="h-3 w-3" />}
                                            Label
                                        </button>

                                        {/* Manifest */}
                                        <button
                                            onClick={() => handleGenerateManifest(shipment)}
                                            disabled={isActionLoading || isCancelled}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50"
                                            title="Generate Manifest"
                                        >
                                            <FileText className="h-3 w-3" /> Manifest
                                        </button>

                                        {/* Schedule Pickup */}
                                        {shipment.awbCode && !['pickup_scheduled', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'rto_initiated'].includes(effectiveStatus || '') && (
                                            <button
                                                onClick={() => setPickupModal({ isOpen: true, shipment })}
                                                disabled={isActionLoading || isCancelled}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                                                title="Schedule Pickup"
                                            >
                                                {isActionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                                                Schedule Pickup
                                            </button>
                                        )}

                                        {/* Existing label/manifest downloads */}
                                        {shipment.labelUrl && (
                                            <a
                                                href={shipment.labelUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                                                title="Download Label"
                                            >
                                                <Download className="h-3 w-3" />
                                            </a>
                                        )}

                                        {/* Cancel */}
                                        {!isCancelled && effectiveStatus !== 'delivered' && (
                                            <button
                                                onClick={() => setCancelModal({ isOpen: true, orderId: shipment.orderId })}
                                                disabled={isActionLoading}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50"
                                                title="Cancel Shipment"
                                            >
                                                <Ban className="h-3 w-3" /> Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
