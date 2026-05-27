'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { getPrinters, updatePrinterApproval } from '@/app/actions/printer-actions';
import { toggleBankVerification } from '@/app/actions/bank-actions';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
    Loader2,
    Building2,
    Search,
    SlidersHorizontal,
    XCircle,
    RefreshCw,
    CheckCircle2,
    Landmark,
    AlertTriangle,
    Ban,
    Clock,
    IndianRupee,
    Printer,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Package,
    Star,
    TrendingUp,
    ShieldCheck,
    ShieldX,
    Eye,
    Filter,
    ChevronDown,
    ChevronUp,
    Zap,
    BarChart3,
    Users,
    Activity,
    FileText,
    ExternalLink,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Printer = Awaited<ReturnType<typeof getPrinters>>[0];

// ── Status config ────────────────────────────────────────────────────────────
const PRINTER_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; dot: string }> = {
    approved: {
        label: 'Approved',
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    pending: {
        label: 'Pending Review',
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        icon: <Clock className="h-3.5 w-3.5" />,
    },
    rejected: {
        label: 'Rejected',
        color: 'text-rose-700 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
        icon: <Ban className="h-3.5 w-3.5" />,
    },
};

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string | null }) {
    const s = status ?? 'pending';
    const cfg = PRINTER_STATUS[s] ?? PRINTER_STATUS['pending'];
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border',
            cfg.color, cfg.bg
        )}>
            <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, accent, icon, trend }: {
    title: string; value: string | number; sub: string; accent: string; icon: React.ReactNode; trend?: string;
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
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <TrendingUp className="h-2.5 w-2.5" /> {trend}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Alert banner ──────────────────────────────────────────────────────────────
function AlertBanner({ type, title, message, onDismiss }: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onDismiss: () => void;
}) {
    const config = {
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
            title: 'text-emerald-800 dark:text-emerald-300',
            text: 'text-emerald-700 dark:text-emerald-400',
        },
        error: {
            bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
            icon: <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
            title: 'text-rose-800 dark:text-rose-300',
            text: 'text-rose-700 dark:text-rose-400',
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
            icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
            title: 'text-amber-800 dark:text-amber-300',
            text: 'text-amber-700 dark:text-amber-400',
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
            icon: <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
            title: 'text-blue-800 dark:text-blue-300',
            text: 'text-blue-700 dark:text-blue-400',
        },
    }[type];

    return (
        <div className={cn(
            'flex items-start gap-3 p-4 rounded-2xl border animate-in slide-in-from-top-2 duration-300',
            config.bg
        )}>
            {config.icon}
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold', config.title)}>{title}</p>
                <p className={cn('text-[12px] mt-0.5', config.text)}>{message}</p>
            </div>
            <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
            >
                <XCircle className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isPending,
    printerName,
    newStatus,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
    printerName: string;
    newStatus: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className={cn(
                    'h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4',
                    newStatus ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-rose-100 dark:bg-rose-950/40'
                )}>
                    {newStatus
                        ? <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        : <ShieldX className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                    }
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white text-center mb-2">
                    {newStatus ? 'Approve Press Partner?' : 'Revoke Approval?'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 text-center mb-6">
                    {newStatus
                        ? `${printerName} will be able to accept and process orders immediately.`
                        : `${printerName} will lose access to new orders. Existing assignments will remain.`
                    }
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl font-bold"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        className={cn(
                            'flex-1 rounded-xl font-bold',
                            newStatus
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25'
                                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25'
                        )}
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (newStatus ? 'Approve' : 'Revoke')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Bank Verification Toggle ──────────────────────────────────────────────────
function BankVerificationToggle({
    bankDetail,
    onVerificationChange
}: {
    bankDetail: { id: string; isVerified: boolean };
    onVerificationChange: (bankDetailsId: string, isVerified: boolean) => void;
}) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (isVerified: boolean) => {
        startTransition(async () => {
            try {
                await toggleBankVerification(bankDetail.id, isVerified);
                onVerificationChange(bankDetail.id, isVerified);
                toast({
                    title: 'Verification Status Updated',
                    description: `Bank details verification status updated successfully.`,
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error updating verification',
                    description: error.message,
                });
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${bankDetail.isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-500'}`}>
                {isPending ? 'Updating...' : bankDetail.isVerified ? 'Verified' : 'Unverified'}
            </span>
            <Switch
                checked={bankDetail.isVerified}
                onCheckedChange={handleToggle}
                disabled={isPending}
                className="data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500 shadow-sm scale-90"
            />
        </div>
    );
}

// ── Printer card ──────────────────────────────────────────────────────────────
function PrinterCard({
    printer,
    onApprovalChange,
    onBankVerificationChange,
}: {
    printer: Printer;
    onApprovalChange: (id: string, newVal: boolean) => void;
    onBankVerificationChange: (printerId: string, bankDetailsId: string, isVerified: boolean) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const totalPayout = printer.priceLists?.length ?? 0;

    const initials = (printer.companyName || printer.fullName || 'PP')
        .split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('');

    const statusKey = printer.isApproved ? 'approved' : (printer.status || 'pending');

    return (
        <div className={cn(
            'rounded-2xl border transition-all duration-300 overflow-hidden group bg-white dark:bg-zinc-900',
            printer.isApproved
                ? 'border-slate-200 dark:border-zinc-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-zinc-900'
                : 'border-amber-200 dark:border-amber-900/50 hover:shadow-lg hover:shadow-amber-100/50'
        )}>
            {/* Header */}
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={cn(
                        'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm',
                        printer.isApproved
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-zinc-700 dark:to-zinc-600 text-slate-600 dark:text-zinc-300'
                    )}>
                        {initials}
                    </div>

                    {/* Name & status */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight truncate">
                                {printer.companyName || printer.fullName}
                            </h3>
                            <StatusPill status={statusKey} />
                            {!printer.isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700">
                                    <Ban className="h-2.5 w-2.5" /> Inactive
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
                            {printer.email && (
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {printer.email}
                                </span>
                            )}
                            {printer.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {printer.phone}
                                </span>
                            )}
                            {(printer.city || printer.state) && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {[printer.city, printer.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Approval toggle */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => onApprovalChange(printer.id, !printer.isApproved)}
                        >
                            <span className={cn(
                                'text-[10px] font-black uppercase tracking-wider',
                                printer.isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'
                            )}>
                                {printer.isApproved ? 'Approved' : 'Approve'}
                            </span>
                            <Switch
                                id={`approve-${printer.id}`}
                                checked={printer.isApproved ?? false}
                                onCheckedChange={(val) => onApprovalChange(printer.id, val)}
                                aria-label={`Toggle approval for ${printer.companyName || printer.fullName}`}
                                className="data-[state=checked]:bg-emerald-600"
                            />
                        </div>
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                        >
                            {expanded ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> Details</>}
                        </button>
                    </div>
                </div>

                {/* Quick stats row */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Catalogs</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{totalPayout}</p>
                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">uploaded files</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">GST No.</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white font-mono truncate">
                            {printer.gstNumber || '—'}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">registration</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Last Login</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                            {printer.lastLogin ? format(new Date(printer.lastLogin), 'dd MMM') : '—'}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">
                            {printer.lastLogin ? format(new Date(printer.lastLogin), 'h:mm a') : 'Never logged in'}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-slate-100 dark:border-zinc-800">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Joined</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                            {printer.createdAt ? format(new Date(printer.createdAt), 'dd MMM') : '—'}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">
                            {printer.createdAt ? format(new Date(printer.createdAt), 'yyyy') : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            <div className={cn(
                'overflow-hidden transition-all duration-300',
                expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
            )}>
                <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
                    <div className="p-5 space-y-5">
                        {/* Full details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Contact Name</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{printer.fullName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Username</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-mono">@{printer.username}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Postal Code</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{printer.postalCode || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Full Address</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                                    {[printer.address, printer.city, printer.state, printer.country].filter(Boolean).join(', ') || '—'}
                                </p>
                            </div>
                            {printer.workDescription && (
                                <div className="space-y-1 sm:col-span-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Work Description</p>
                                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{printer.workDescription}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Account Status</p>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        'text-sm font-bold',
                                        printer.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    )}>
                                        {printer.isActive ? 'Active' : 'Deactivated'}
                                    </span>
                                    <span className="text-slate-300 dark:text-zinc-600">·</span>
                                    <span className={cn(
                                        'text-sm font-bold',
                                        printer.emailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                    )}>
                                        {printer.emailVerified ? 'Email Verified' : 'Email Unverified'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Login Attempts</p>
                                <p className={cn(
                                    'text-sm font-bold',
                                    (printer.loginAttempts ?? 0) >= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-200'
                                )}>
                                    {printer.loginAttempts ?? 0} attempt{(printer.loginAttempts ?? 0) !== 1 ? 's' : ''}
                                    {(printer.loginAttempts ?? 0) >= 5 && (
                                        <span className="ml-1 text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                                            Account may be locked
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Agreements</p>
                                <div className="flex items-center gap-2">
                                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border',
                                        printer.acceptPrivacyPolicy
                                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                            : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                                    )}>Privacy {printer.acceptPrivacyPolicy ? '✓' : '✗'}</span>
                                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border',
                                        printer.acceptTermsConditions
                                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                            : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                                    )}>Terms {printer.acceptTermsConditions ? '✓' : '✗'}</span>
                                </div>
                            </div>
                        </div>

                        {printer.bankDetails && printer.bankDetails.length > 0 && (
                            <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                        <Landmark className="w-3.5 h-3.5 text-indigo-500" /> Bank Account Details
                                    </h4>
                                    <BankVerificationToggle 
                                        bankDetail={printer.bankDetails[0]} 
                                        onVerificationChange={(bankDetailsId, isVerified) => {
                                            onBankVerificationChange(printer.id, bankDetailsId, isVerified);
                                        }} 
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Holder Name</span>
                                        <p className="font-bold text-slate-800 dark:text-zinc-200">{printer.bankDetails[0].accountHolderName}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Bank Name</span>
                                        <p className="font-bold text-slate-800 dark:text-zinc-200">{printer.bankDetails[0].bankName}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Account Number</span>
                                        <p className="font-mono font-bold text-slate-800 dark:text-zinc-200">{printer.bankDetails[0].accountNumber}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">IFSC Code</span>
                                        <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{printer.bankDetails[0].ifscCode}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Account Type</span>
                                        <p className="font-bold text-slate-700 dark:text-zinc-300 capitalize">{printer.bankDetails[0].accountType}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shop images */}
                        {printer.shopImages && printer.shopImages.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
                                    Shop Images ({printer.shopImages.length})
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {printer.shopImages.map((img, idx) => (
                                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer"
                                            className="relative h-16 w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 hover:scale-105 transition-transform group/img">
                                            <img src={img} alt={`Shop ${idx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <ExternalLink className="h-4 w-4 text-white" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Catalog uploads */}
                        {printer.priceLists && printer.priceLists.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
                                    Price Catalogs ({printer.priceLists.length})
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {printer.priceLists.map((catalog) => (
                                        <div key={catalog.id}
                                            className="group/cat relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 flex flex-col gap-2 hover:shadow-md transition-shadow">
                                            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-800 flex items-center justify-center border border-slate-100 dark:border-zinc-800">
                                                <img
                                                    src={catalog.imageUrl}
                                                    alt={catalog.catalogName || "Catalog Page"}
                                                    className="max-h-full object-contain transition-transform duration-300 group-hover/cat:scale-105"
                                                />
                                                <a
                                                    href={catalog.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/cat:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900/80 px-2 py-1 rounded-full text-white backdrop-blur-sm">
                                                        View
                                                    </span>
                                                </a>
                                            </div>
                                            <div className="px-0.5 text-[9px]">
                                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate block" title={catalog.catalogName || "Catalog Upload"}>
                                                    {catalog.catalogName || "Catalog"}
                                                </span>
                                                {catalog.createdAt && (
                                                    <span className="text-slate-400 block mt-0.5">
                                                        {format(new Date(catalog.createdAt), 'MMM d, yyyy')}
                                                    </span>
                                                )}
                                            </div>
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
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPrintersPage() {
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Alert queue
    const [alerts, setAlerts] = useState<Array<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>>([]);
    const addAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        const id = Date.now();
        setAlerts(a => [...a, { id, type, title, message }]);
        setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 5000);
    }, []);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; printerId: string; printerName: string; newStatus: boolean } | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Fetch printers
    const fetchPrinters = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetched = await getPrinters();
            setPrinters(fetched);
        } catch (error: any) {
            addAlert('error', 'Failed to load printers', error.message || 'Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [addAlert]);

    useEffect(() => { fetchPrinters(); }, [fetchPrinters]);

    // Approval toggle handler
    const handleApprovalChange = (printerId: string, newVal: boolean) => {
        const printer = printers.find(p => p.id === printerId);
        if (!printer) return;
        const name = printer.companyName || printer.fullName || 'this printer';
        setConfirmDialog({ isOpen: true, printerId, printerName: name, newStatus: newVal });
    };

    const handleBankVerificationChange = (printerId: string, bankDetailsId: string, isVerified: boolean) => {
        setPrinters(prevPrinters => prevPrinters.map(p => {
            if (p.id === printerId && p.bankDetails) {
                return {
                    ...p,
                    bankDetails: p.bankDetails.map(bd => bd.id === bankDetailsId ? { ...bd, isVerified } : bd)
                };
            }
            return p;
        }));
    };

    const handleConfirmApproval = () => {
        if (!confirmDialog) return;
        const { printerId, printerName, newStatus } = confirmDialog;
        startTransition(async () => {
            try {
                await updatePrinterApproval(printerId, newStatus);
                setPrinters(prev => prev.map(p =>
                    p.id === printerId
                        ? { ...p, isApproved: newStatus, status: newStatus ? 'approved' : 'rejected' }
                        : p
                ));
                addAlert(
                    newStatus ? 'success' : 'warning',
                    newStatus ? 'Printer Approved!' : 'Approval Revoked',
                    newStatus
                        ? `${printerName} has been approved and can now accept orders.`
                        : `${printerName}'s approval has been revoked.`
                );
                toast({
                    title: newStatus ? '✅ Approved' : '⚠️ Revoked',
                    description: `${printerName} has been ${newStatus ? 'approved' : 'deactivated'}.`,
                });
            } catch (error: any) {
                addAlert('error', 'Action Failed', error.message || 'Could not update printer status.');
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            } finally {
                setConfirmDialog(null);
            }
        });
    };

    // ── Filtering & sorting
    const filtered = printers.filter(p => {
        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const match = [p.fullName, p.companyName, p.email, p.phone, p.city, p.state, p.gstNumber, p.username]
                .some(f => f?.toLowerCase().includes(q));
            if (!match) return false;
        }

        // Status filter
        if (statusFilter === 'approved' && !p.isApproved) return false;
        if (statusFilter === 'pending' && (p.isApproved || p.status === 'rejected')) return false;
        if (statusFilter === 'rejected' && p.status !== 'rejected') return false;
        if (statusFilter === 'inactive' && p.isActive !== false) return false;

        // Date filter
        if (p.createdAt) {
            const created = new Date(p.createdAt);
            const now = new Date();
            if (dateFilter === 'today' && created < startOfDay(now)) return false;
            if (dateFilter === 'this_week' && created < startOfWeek(now)) return false;
            if (dateFilter === 'this_month' && created < startOfMonth(now)) return false;
            if (dateFilter === 'custom' && startDate && endDate) {
                const s = startOfDay(new Date(startDate));
                const e = endOfDay(new Date(endDate));
                if (created < s || created > e) return false;
            }
        }

        return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
        if (sortBy === 'name') return (a.companyName || a.fullName).localeCompare(b.companyName || b.fullName);
        if (sortBy === 'catalogs') return (b.priceLists?.length ?? 0) - (a.priceLists?.length ?? 0);
        return 0;
    });

    // KPI stats
    const stats = {
        total: printers.length,
        approved: printers.filter(p => p.isApproved).length,
        pending: printers.filter(p => !p.isApproved && p.status !== 'rejected').length,
        rejected: printers.filter(p => p.status === 'rejected').length,
        inactive: printers.filter(p => !p.isActive).length,
        totalCatalogs: printers.reduce((sum, p) => sum + (p.priceLists?.length ?? 0), 0),
    };

    const hasFilters = searchQuery || statusFilter !== 'all' || dateFilter !== 'all';
    const timeChips = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Custom', value: 'custom' },
    ];

    return (
        <div className="space-y-6 min-h-screen">
            {/* Confirm Dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog(null)}
                    onConfirm={handleConfirmApproval}
                    isPending={isPending}
                    printerName={confirmDialog.printerName}
                    newStatus={confirmDialog.newStatus}
                />
            )}

            {/* Alert banner stack */}
            {alerts.length > 0 && (
                <div className="space-y-2 fixed top-4 right-4 z-40 w-full max-w-sm">
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

            {/* ── Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <Printer className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Press Partners</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 ml-10">
                        Manage print press partners, approvals & catalog uploads
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
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Clear Filters
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(f => !f)}
                        className={cn("font-bold text-xs gap-1.5 rounded-xl", showFilters && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 text-blue-600")}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filters
                        {hasFilters && (
                            <span className="ml-0.5 h-4 w-4 rounded-full bg-blue-600 text-[9px] text-white flex items-center justify-center font-black">!</span>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPrinters}
                        className="font-bold text-xs gap-1.5 rounded-xl"
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                <KpiCard
                    title="Total Partners"
                    value={stats.total}
                    sub="All registered presses"
                    accent="bg-gradient-to-br from-blue-500/5 to-indigo-500/10"
                    icon={<Users className="h-4 w-4 text-blue-500" />}
                />
                <KpiCard
                    title="Approved"
                    value={stats.approved}
                    sub="Active press partners"
                    accent="bg-gradient-to-br from-emerald-500/5 to-teal-500/10"
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                />
                <KpiCard
                    title="Pending Review"
                    value={stats.pending}
                    sub="Awaiting approval"
                    accent="bg-gradient-to-br from-amber-500/5 to-orange-500/10"
                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                    trend={stats.pending > 0 ? `${stats.pending} need action` : undefined}
                />
                <KpiCard
                    title="Rejected"
                    value={stats.rejected}
                    sub="Declined applications"
                    accent="bg-gradient-to-br from-rose-500/5 to-pink-500/10"
                    icon={<Ban className="h-4 w-4 text-rose-500" />}
                />
                <KpiCard
                    title="Inactive"
                    value={stats.inactive}
                    sub="Deactivated accounts"
                    accent="bg-gradient-to-br from-slate-500/5 to-zinc-500/10"
                    icon={<Activity className="h-4 w-4 text-slate-500" />}
                />
                <KpiCard
                    title="Total Catalogs"
                    value={stats.totalCatalogs}
                    sub="Uploaded price files"
                    accent="bg-gradient-to-br from-purple-500/5 to-violet-500/10"
                    icon={<FileText className="h-4 w-4 text-purple-500" />}
                />
            </div>

            {/* ── Pending alert banner */}
            {stats.pending > 0 && !isLoading && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                            {stats.pending} press partner{stats.pending !== 1 ? 's' : ''} awaiting approval
                        </p>
                        <p className="text-[12px] text-amber-700 dark:text-amber-400 mt-0.5">
                            Review and approve applications to enable them to accept printing jobs.
                        </p>
                    </div>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className="shrink-0 text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                    >
                        Review Now
                    </button>
                </div>
            )}

            {/* ── Filters panel */}
            <div className={cn(
                "overflow-hidden transition-all duration-300 rounded-2xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800",
                showFilters ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 border-0"
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
                                    placeholder="Company, name, email, GST, city..."
                                    className="pl-9 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Partners</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
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
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="name">Name A–Z</SelectItem>
                                    <SelectItem value="catalogs">Most Catalogs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Custom date range */}
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

            {/* ── Toolbar: Status legend + date chips + count */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Status filter buttons */}
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { label: 'All', value: 'all', count: stats.total },
                        { label: 'Approved', value: 'approved', count: stats.approved },
                        { label: 'Pending', value: 'pending', count: stats.pending },
                        { label: 'Rejected', value: 'rejected', count: stats.rejected },
                    ].map(chip => (
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
                <div className="flex flex-wrap items-center gap-1.5">
                    {timeChips.map(c => (
                        <FilterChip
                            key={c.value}
                            label={c.label}
                            active={dateFilter === c.value}
                            onClick={() => { setDateFilter(c.value); if (c.value !== 'custom') { setStartDate(''); setEndDate(''); } }}
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

            {/* ── Results summary */}
            {!isLoading && (
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        Showing <span className="font-black text-slate-700 dark:text-zinc-200">{sorted.length}</span> of{' '}
                        <span className="font-black text-slate-700 dark:text-zinc-200">{printers.length}</span> press partners
                    </span>
                    {hasFilters && sorted.length !== printers.length && (
                        <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                            Filtered
                        </span>
                    )}
                </div>
            )}

            {/* ── Printer list */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-700 dark:text-zinc-300">Loading press partners…</p>
                        <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Fetching all printer data</p>
                    </div>
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-700 dark:text-zinc-300 text-base">No press partners found</p>
                        <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">
                            {hasFilters ? 'Try adjusting your filters' : 'No printers have registered yet'}
                        </p>
                    </div>
                    {hasFilters && (
                        <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs"
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); }}>
                            Clear all filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map(printer => (
                        <PrinterCard
                            key={printer.id}
                            printer={printer}
                            onApprovalChange={handleApprovalChange}
                            onBankVerificationChange={handleBankVerificationChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
