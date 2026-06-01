'use client';


import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import {
    getAdminShipments,
    adminTrackShipment,
    adminCancelShipment,
    adminGenerateShipmentLabel,
    adminGenerateShipmentManifest,
    adminScheduleShipmentPickup,
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
    Factory,
    User,
    IndianRupee,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Shipment = Awaited<ReturnType<typeof getAdminShipments>>[0];

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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{title}</p>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">{sub}</p>
            </div>
        </div>
    );
}

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

function TrackingModal({
    isOpen, shipment, data, loading, onClose,
}: {
    isOpen: boolean; shipment: Shipment | null; data: any; loading: boolean; onClose: () => void;
}) {
    if (!isOpen || !shipment) return null;

    const tracking = data?.tracking_data || {};
    const shipmentTrack = tracking.shipment_track?.[0] || {};
    const trackScans = tracking.shipment_track_activities || [];
    const statusCfg = getStatusConfig(shipment.currentStatus || shipment.status);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-2xl p-6 max-w-lg w-full animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Track Shipment</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">
                    Order ID: <span className="font-bold text-slate-600 dark:text-zinc-300">#{shipment.orderId}</span> | AWB: <span className="font-bold text-slate-600 dark:text-zinc-300">{shipment.awbCode || 'Pending'}</span>
                </p>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                        <p className="text-xs font-bold text-slate-500">Fetching latest scans from Shiprocket API...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Header */}
                        <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-slate-100 dark:border-zinc-900 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Courier Partner</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{shipment.courierName || '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Expected Delivery</p>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {shipmentTrack.edd ? format(new Date(shipmentTrack.edd), 'dd MMM yyyy') : 'TBD'}
                                </p>
                            </div>
                            <div className="col-span-2 border-t border-slate-100 dark:border-zinc-900/50 pt-3 flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Current status</span>
                                <StatusPill status={shipmentTrack.current_status || shipment.currentStatus || shipment.status} />
                            </div>
                        </div>

                        {/* Scan Timeline */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Tracking Timeline</p>
                            {trackScans.length === 0 ? (
                                <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                                    <Clock className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-500">No scans received yet</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">The shipment might be awaiting courier pickup confirmation.</p>
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-slate-100 dark:border-zinc-900 ml-3 pl-5 space-y-5">
                                    {trackScans.map((scan: any, idx: number) => (
                                        <div key={idx} className="relative">
                                            {/* dot */}
                                            <div className={cn(
                                                "absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center",
                                                idx === 0 ? "bg-cyan-500 ring-4 ring-cyan-500/10" : "bg-slate-300 dark:bg-zinc-800"
                                            )} />
                                            <div>
                                                <p className={cn("text-xs font-bold", idx === 0 ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-400")}>
                                                    {scan.activity || scan.status}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {scan.location || 'Hub'} | {scan.date ? format(new Date(scan.date), 'dd MMM yyyy, h:mm a') : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Button variant="outline" className="w-full mt-6 rounded-2xl font-bold" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
}

function CancelModal({ isOpen, onClose, onConfirm, isPending }: {
    isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void; isPending: boolean;
}) {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-500 mb-4">
                    <Ban className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Cancel Shipment</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                    This action will cancel the order in Shiprocket and revert the printing status to <span className="font-bold text-slate-700 dark:text-zinc-200">In Production</span>.
                </p>

                <div className="space-y-1.5 mb-5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason for Cancellation</Label>
                    <Input
                        placeholder="e.g. Dimensions correction, printing delay..."
                        className="rounded-xl bg-slate-50 dark:bg-zinc-900 text-xs"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-2xl font-bold" onClick={onClose} disabled={isPending}>
                        Dismiss
                    </Button>
                    <Button
                        className="flex-1 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25"
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-950 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-500 mb-4">
                    <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Schedule Pickup Date & Time</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                    Select the preferred date and time for the courier pickup.
                </p>

                <div className="space-y-3 mb-5">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pickup Date</Label>
                        <Input
                            type="date"
                            className="rounded-xl bg-slate-50 dark:bg-zinc-900 text-xs"
                            value={date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pickup Time</Label>
                        <Input
                            type="time"
                            className="rounded-xl bg-slate-50 dark:bg-zinc-900 text-xs"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-2xl font-bold" onClick={onClose} disabled={isPending}>
                        Dismiss
                    </Button>
                    <Button
                        className="flex-1 rounded-2xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25"
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
                    'h-4 min-w-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center',
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

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

export default function AdminShippingReportPage() {
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
            const data = await getAdminShipments();
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
            const result = await adminTrackShipment(shipment.orderId);
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
            const result = await adminGenerateShipmentLabel(shipment.orderId);
            if (result.labelUrl) {
                window.open(result.labelUrl, '_blank');
                addAlert('success', 'Label Generated', `Shipping label ready for Order #${shipment.orderId}.`);
            } else {
                addAlert('warning', 'Label Not Available', 'Shiprocket returned no label URL.');
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
            const result = await adminGenerateShipmentManifest(shipment.orderId);
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
            await adminScheduleShipmentPickup(shipment.orderId, pickupDateStr);
            addAlert('success', 'Pickup Scheduled', `Pickup successfully scheduled for Order #${shipment.orderId}.`);
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
                await adminCancelShipment(orderId, reason);
                addAlert('success', 'Shipment Cancelled', `Shipment for Order #${orderId} has been cancelled.`);
                fetchShipments();
            } catch (err: any) {
                addAlert('error', 'Cancellation Failed', err.message || 'Could not cancel shipment.');
            } finally {
                setActionLoadingId(null);
            }
        });
    };

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
                        s.printerName,
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
            .sort((a, b) => {
                const statusA = a.currentStatus || a.status || '';
                const statusB = b.currentStatus || b.status || '';
                const weightA = STATUS_ORDER.indexOf(statusA) === -1 ? 99 : STATUS_ORDER.indexOf(statusA);
                const weightB = STATUS_ORDER.indexOf(statusB) === -1 ? 99 : STATUS_ORDER.indexOf(statusB);
                if (weightA !== weightB) {
                    return weightA - weightB;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [shipmentsList, searchQuery, statusFilter]);

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
        <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen p-2">

            {/* ── Tracking Modal */}
            <TrackingModal
                isOpen={trackingModal.isOpen}
                shipment={trackingModal.shipment}
                data={trackingModal.data}
                loading={trackingModal.loading}
                onClose={() => setTrackingModal({ isOpen: false, shipment: null, data: null, loading: false })}
            />

            {/* ── Cancellation Modal */}
            {cancelModal && (
                <CancelModal
                    isOpen={cancelModal.isOpen}
                    onClose={() => setCancelModal(null)}
                    onConfirm={handleCancelConfirm}
                    isPending={isPending}
                />
            )}

            {/* ── Schedule Pickup Modal */}
            <SchedulePickupModal
                isOpen={pickupModal.isOpen}
                onClose={() => setPickupModal({ isOpen: false, shipment: null })}
                onConfirm={handleSchedulePickupConfirm}
                isPending={isPending}
            />

            {/* ── Alerts */}
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

            {/* ── Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/30">
                            <Truck className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Shipping Reports (Shiprocket)</h1>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 ml-10">
                        Admin view of all order-wise shipments, track statuses, schedule pickups & download labels.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchShipments} disabled={isLoading} className="font-bold text-xs gap-1.5 rounded-xl">
                    <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                    Sync
                </Button>
            </div>

            {/* ── KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard
                    title="All Shipments"
                    value={stats.total}
                    sub="Overall orders registered"
                    accent="bg-gradient-to-br from-blue-500/5 to-cyan-500/10"
                    icon={<Boxes className="h-4 w-4 text-blue-500" />}
                />
                <KpiCard
                    title="AWB Assigned"
                    value={stats.awbAssigned}
                    sub="Couriers scheduled"
                    accent="bg-gradient-to-br from-indigo-500/5 to-purple-500/10"
                    icon={<Tag className="h-4 w-4 text-indigo-500" />}
                />
                <KpiCard
                    title="In Transit"
                    value={stats.inTransit}
                    sub="Dispatched & out"
                    accent="bg-gradient-to-br from-cyan-500/5 to-blue-500/10"
                    icon={<Truck className="h-4 w-4 text-cyan-500" />}
                />
                <KpiCard
                    title="Delivered"
                    value={stats.delivered}
                    sub="Successfully arrived"
                    accent="bg-gradient-to-br from-emerald-500/5 to-green-500/10"
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                />
                <KpiCard
                    title="Cancelled"
                    value={stats.cancelled}
                    sub="Reverted to press"
                    accent="bg-gradient-to-br from-rose-500/5 to-orange-500/10"
                    icon={<Ban className="h-4 w-4 text-rose-500" />}
                />
            </div>

            {/* ── Filters toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                    {statusChips.map(c => (
                        <FilterChip
                            key={c.value}
                            label={c.label}
                            active={statusFilter === c.value}
                            onClick={() => setStatusFilter(c.value)}
                            count={c.count}
                        />
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        placeholder="Search AWB, Order ID, printer, customer..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Shipments Table List */}
            {isLoading ? (
                <div className="rounded-2xl border border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 space-y-4">
                    {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-950 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-900 gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400">
                        <Truck className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm">No shipments matched search</p>
                    <p className="text-slate-400 text-xs mt-0.5">Adjust status chips or search parameters.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(shipment => {
                        const statusCfg = getStatusConfig(shipment.currentStatus || shipment.status);
                        const isActionLoading = actionLoadingId === shipment.id || actionLoadingId === shipment.orderId;
                        const productName = shipment.order?.directSellingProduct?.name || shipment.order?.product?.name || 'Unspecified Product';

                        return (
                            <div key={shipment.id} className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 group relative">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                    {/* Left segment */}
                                    <div className="space-y-2.5 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">Order #{shipment.orderId}</span>
                                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-0.5 rounded-full font-mono">
                                                AWB: {shipment.awbCode || 'Awaiting'}
                                            </span>
                                            <StatusPill status={shipment.currentStatus || shipment.status} />
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Assigned Partner Press</p>
                                                <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5 flex items-center gap-1.5">
                                                    <Factory className="h-3.5 w-3.5 text-blue-500" />
                                                    {shipment.printerName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Customer Details</p>
                                                <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5 flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-sky-500" />
                                                    {shipment.order?.user?.name || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Fulfillment Product</p>
                                                <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5 truncate max-w-[200px]" title={productName}>
                                                    {productName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Created date</p>
                                                <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5 flex items-center gap-1.5">
                                                    <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                                                    {shipment.createdAt ? format(new Date(shipment.createdAt), 'dd MMM yyyy') : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Panel */}
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 border-slate-100 dark:border-zinc-900 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                                        
                                        {/* AWB Assigned & Pickup Scheduling Action */}
                                        {shipment.awbCode && !['pickup_scheduled', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'rto_initiated'].includes(shipment.currentStatus || shipment.status || '') && (
                                            <Button
                                                onClick={() => setPickupModal({ isOpen: true, shipment })}
                                                disabled={isActionLoading}
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1.5 shadow-md shadow-amber-600/20"
                                            >
                                                {isActionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                                                Schedule Pickup
                                            </Button>
                                        )}

                                        {/* Tracking Action */}
                                        {shipment.awbCode && (
                                            <Button
                                                onClick={() => handleTrack(shipment)}
                                                disabled={isActionLoading}
                                                variant="outline"
                                                size="sm"
                                                className="border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1.5"
                                            >
                                                <Eye className="h-3.5 w-3.5 text-slate-400" />
                                                Track Status
                                            </Button>
                                        )}

                                        {/* Label Download */}
                                        {shipment.shipmentId && (
                                            <Button
                                                onClick={() => handleGenerateLabel(shipment)}
                                                disabled={isActionLoading}
                                                variant="outline"
                                                size="sm"
                                                className="border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1.5"
                                            >
                                                <Download className="h-3.5 w-3.5 text-indigo-400" />
                                                Label
                                            </Button>
                                        )}

                                        {/* Manifest Download */}
                                        {shipment.shipmentId && (
                                            <Button
                                                onClick={() => handleGenerateManifest(shipment)}
                                                disabled={isActionLoading}
                                                variant="outline"
                                                size="sm"
                                                className="border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1.5"
                                            >
                                                <FileText className="h-3.5 w-3.5 text-purple-400" />
                                                Manifest
                                            </Button>
                                        )}

                                        {/* Cancellation */}
                                        {['order_created', 'awb_assigned', 'pickup_scheduled'].includes(shipment.currentStatus || shipment.status || '') && (
                                            <Button
                                                onClick={() => setCancelModal({ isOpen: true, orderId: shipment.orderId })}
                                                disabled={isActionLoading}
                                                variant="ghost"
                                                size="sm"
                                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1.5"
                                            >
                                                <Ban className="h-3.5 w-3.5" />
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
