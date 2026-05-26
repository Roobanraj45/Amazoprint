'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
    getAdminAllInvoices,
    getAdminInvoiceStats,
    getAllPrintersForFilter,
    updateInvoiceStatus,
} from '@/app/actions/invoice-actions';
import {
    IndianRupee,
    Receipt,
    FileText,
    CheckCircle2,
    Clock,
    Ban,
    XCircle,
    Loader2,
    RefreshCw,
    Search,
    AlertTriangle,
    Banknote,
    SlidersHorizontal,
    Filter,
    BarChart3,
    CalendarDays,
    User2,
    Building2,
    ChevronDown,
    MessageSquare,
    TrendingUp,
    ShieldCheck,
    CreditCard,
    Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay } from 'date-fns';

type Invoice = Awaited<ReturnType<typeof getAdminAllInvoices>>[0];
type Stats = Awaited<ReturnType<typeof getAdminInvoiceStats>>;
type Printer = Awaited<ReturnType<typeof getAllPrintersForFilter>>[0];

// ── Status config ─────────────────────────────────────────────────────────────
const INV_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; dot: string }> = {
    pending: { label: 'Pending Review', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500', icon: <Clock className="h-3 w-3" /> },
    approved: { label: 'Approved', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500', icon: <CheckCircle2 className="h-3 w-3" /> },
    paid: { label: 'Paid', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', icon: <Banknote className="h-3 w-3" /> },
    rejected: { label: 'Rejected', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500', icon: <Ban className="h-3 w-3" /> },
};

function StatusPill({ status }: { status: string }) {
    const cfg = INV_STATUS[status] ?? INV_STATUS['pending'];
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border', cfg.color, cfg.bg)}>
            <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ── Alert banner ──────────────────────────────────────────────────────────────
function AlertBanner({ type, title, message, onDismiss }: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string; message: string; onDismiss: () => void;
}) {
    const styles = {
        success: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />, t: 'text-emerald-800 dark:text-emerald-300', m: 'text-emerald-700 dark:text-emerald-400' },
        error:   { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', icon: <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />, t: 'text-rose-800 dark:text-rose-300', m: 'text-rose-700 dark:text-rose-400' },
        warning: { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />, t: 'text-amber-800 dark:text-amber-300', m: 'text-amber-700 dark:text-amber-400' },
        info:    { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', icon: <FileText className="h-4 w-4 text-blue-600 shrink-0" />, t: 'text-blue-800 dark:text-blue-300', m: 'text-blue-700 dark:text-blue-400' },
    }[type];

    return (
        <div className={cn('flex items-center gap-3 p-4 rounded-2xl border animate-in slide-in-from-right-4 duration-300 shadow-lg', styles.bg)}>
            {styles.icon}
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold', styles.t)}>{title}</p>
                <p className={cn('text-[11px] mt-0.5', styles.m)}>{message}</p>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <XCircle className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, accent, icon, trend }: { title: string; value: string | number; sub: string; accent: string; icon: React.ReactNode; trend?: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group cursor-default bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800">
            <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500', accent)} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{title}</p>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform duration-300">{icon}</div>
                </div>
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">{sub}</p>
                {trend && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <TrendingUp className="h-2.5 w-2.5" /> {trend}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Action dialog (approve / reject / pay) ────────────────────────────────────
function ActionDialog({
    invoice, actionType, onClose, onDone,
}: {
    invoice: Invoice;
    actionType: 'approved' | 'paid' | 'rejected';
    onClose: () => void;
    onDone: (invoiceId: number, newStatus: string) => void;
}) {
    const [adminNote, setAdminNote] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (actionType === 'rejected' && !adminNote.trim()) {
            setError('Please provide a reason for rejection.');
            return;
        }
        setError('');
        startTransition(async () => {
            try {
                await updateInvoiceStatus({ invoiceId: invoice.id, status: actionType, adminNote: adminNote.trim() || undefined });
                onDone(invoice.id, actionType);
                onClose();
            } catch (err: any) {
                setError(err.message || 'Action failed. Please try again.');
            }
        });
    };

    const config = {
        approved: { title: 'Approve Invoice', sub: 'This invoice will be marked as approved and the printer will be notified.', icon: <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />, iconBg: 'bg-blue-100 dark:bg-blue-950/40', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25', label: 'Approve' },
        paid: { title: 'Mark as Paid', sub: 'This will confirm payment has been disbursed to the printer.', icon: <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />, iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25', label: 'Mark Paid' },
        rejected: { title: 'Reject Invoice', sub: 'The printer will be notified with your reason. This cannot be undone.', icon: <Ban className="h-6 w-6 text-rose-600 dark:text-rose-400" />, iconBg: 'bg-rose-100 dark:bg-rose-950/40', btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25', label: 'Reject' },
    }[actionType];

    const productName = invoice.order?.directSellingProduct?.name || invoice.order?.product?.name || 'N/A';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
                <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4', config.iconBg)}>
                    {config.icon}
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white text-center mb-1">{config.title}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 text-center mb-4">{config.sub}</p>

                {/* Invoice summary */}
                <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-100 dark:border-zinc-800 p-3 mb-4 space-y-1.5">
                    <div className="flex justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice</span>
                        <span className="text-xs font-black text-violet-600 dark:text-violet-400 font-mono">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Printer</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{invoice.printer?.companyName || invoice.printer?.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[180px]">{productName}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-zinc-700 pt-1.5 mt-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">₹{parseFloat(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Admin note */}
                <div className="space-y-1.5 mb-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {actionType === 'rejected' ? 'Rejection Reason *' : 'Admin Note (optional)'}
                    </Label>
                    <Textarea
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        placeholder={actionType === 'rejected' ? 'Explain why this invoice is rejected...' : 'Any payment notes or reference...'}
                        className="rounded-xl text-sm resize-none bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
                        rows={3}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl mb-4">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={onClose} disabled={isPending}>Cancel</Button>
                    <Button
                        className={cn('flex-1 rounded-xl font-bold text-white shadow-lg gap-2', config.btn)}
                        onClick={handleConfirm}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : config.icon}
                        {config.label}
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
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border whitespace-nowrap flex items-center gap-1.5',
                active
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/25'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-violet-400 hover:text-violet-600'
            )}
        >
            {label}
            {count !== undefined && (
                <span className={cn('h-4 min-w-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center', active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500')}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPrinterInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Alerts
    const [alerts, setAlerts] = useState<Array<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>>([]);
    const addAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        const id = Date.now();
        setAlerts(a => [...a, { id, type, title, message }]);
        setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 5000);
    }, []);

    // Action dialog state
    const [actionDialog, setActionDialog] = useState<{ invoice: Invoice; type: 'approved' | 'paid' | 'rejected' } | null>(null);

    // Filters
    const [printerFilter, setPrinterFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [invs, s, p] = await Promise.all([
                getAdminAllInvoices(),
                getAdminInvoiceStats(),
                getAllPrintersForFilter(),
            ]);
            setInvoices(invs);
            setStats(s);
            setPrinters(p);
        } catch (err: any) {
            addAlert('error', 'Failed to load', err.message || 'Could not fetch invoice data.');
        } finally {
            setIsLoading(false);
        }
    }, [addAlert]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Optimistic update after action
    const handleActionDone = (invoiceId: number, newStatus: string) => {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv));
        const labels: Record<string, string> = { approved: 'Approved', paid: 'Paid', rejected: 'Rejected' };
        addAlert('success', `Invoice ${labels[newStatus] ?? newStatus}`, `Invoice #${invoiceId} has been ${newStatus} successfully.`);
    };

    // Client-side filter + search on already-fetched invoices
    const filtered = invoices.filter(inv => {
        if (printerFilter !== 'all' && inv.printerId !== printerFilter) return false;
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            const hit = [
                inv.invoiceNumber,
                inv.printer?.companyName,
                inv.printer?.fullName,
                inv.printer?.email,
                inv.order?.product?.name,
                inv.order?.directSellingProduct?.name,
                inv.order?.user?.name,
                String(inv.order?.id ?? ''),
            ].some(f => f?.toLowerCase().includes(q));
            if (!hit) return false;
        }
        if (inv.createdAt) {
            const d = new Date(inv.createdAt);
            if (dateFilter === 'today' && !isToday(d)) return false;
            if (dateFilter === 'this_week' && !isThisWeek(d)) return false;
            if (dateFilter === 'this_month' && !isThisMonth(d)) return false;
            if (dateFilter === 'custom' && startDate && endDate) {
                if (d < startOfDay(new Date(startDate)) || d > endOfDay(new Date(endDate))) return false;
            }
        }
        return true;
    });

    const timeChips = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Custom', value: 'custom' },
    ];

    const statusChips = [
        { label: 'All', value: 'all', count: invoices.length },
        { label: 'Pending', value: 'pending', count: invoices.filter(i => i.status === 'pending').length },
        { label: 'Approved', value: 'approved', count: invoices.filter(i => i.status === 'approved').length },
        { label: 'Paid', value: 'paid', count: invoices.filter(i => i.status === 'paid').length },
        { label: 'Rejected', value: 'rejected', count: invoices.filter(i => i.status === 'rejected').length },
    ];

    const hasFilters = search || printerFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all';

    return (
        <div className="space-y-6 min-h-screen pb-20">

            {/* Action dialog */}
            {actionDialog && (
                <ActionDialog
                    invoice={actionDialog.invoice}
                    actionType={actionDialog.type}
                    onClose={() => setActionDialog(null)}
                    onDone={handleActionDone}
                />
            )}

            {/* Floating alerts */}
            {alerts.length > 0 && (
                <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
                    {alerts.map(a => (
                        <AlertBanner key={a.id} type={a.type} title={a.title} message={a.message} onDismiss={() => setAlerts(prev => prev.filter(x => x.id !== a.id))} />
                    ))}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-600/30">
                            <Receipt className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Printer Invoices</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 ml-10">
                        Review, approve, and manage all printer invoice submissions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasFilters && (
                        <Button variant="ghost" size="sm"
                            onClick={() => { setSearch(''); setPrinterFilter('all'); setStatusFilter('all'); setDateFilter('all'); setStartDate(''); setEndDate(''); }}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold">
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Clear Filters
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}
                        className={cn('font-bold text-xs gap-1.5 rounded-xl', showFilters && 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 text-violet-600')}>
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                        {hasFilters && <span className="h-4 w-4 rounded-full bg-violet-600 text-[9px] text-white flex items-center justify-center font-black">!</span>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchAll} disabled={isLoading} className="font-bold text-xs gap-1.5 rounded-xl">
                        <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} /> Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                <KpiCard title="Total Invoices" value={stats?.total.count ?? 0} sub="All submitted" accent="bg-gradient-to-br from-violet-500/5 to-purple-500/10" icon={<FileText className="h-4 w-4 text-violet-500" />} />
                <KpiCard title="Pending Review" value={stats?.pending.count ?? 0} sub="Awaiting action"
                    accent="bg-gradient-to-br from-amber-500/5 to-orange-500/10"
                    icon={<Clock className="h-4 w-4 text-amber-500" />}
                    trend={stats?.pending.count ? `${stats.pending.count} need action` : undefined} />
                <KpiCard title="Approved" value={stats?.approved.count ?? 0} sub="Ready for payment" accent="bg-gradient-to-br from-blue-500/5 to-indigo-500/10" icon={<ShieldCheck className="h-4 w-4 text-blue-500" />} />
                <KpiCard title="Paid" value={stats?.paid.count ?? 0} sub="Disbursed" accent="bg-gradient-to-br from-emerald-500/5 to-teal-500/10" icon={<Banknote className="h-4 w-4 text-emerald-500" />} />
                <KpiCard title="Total Paid" value={`₹${(stats?.paid.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`} sub="Disbursed amount" accent="bg-gradient-to-br from-emerald-500/5 to-green-500/10" icon={<IndianRupee className="h-4 w-4 text-emerald-500" />} />
                <KpiCard title="This Month" value={`₹${(stats?.thisMonth.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`} sub={`${stats?.thisMonth.count ?? 0} invoices`} accent="bg-gradient-to-br from-purple-500/5 to-pink-500/10" icon={<TrendingUp className="h-4 w-4 text-purple-500" />} />
            </div>

            {/* Pending alert */}
            {(stats?.pending.count ?? 0) > 0 && !isLoading && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                            {stats?.pending.count} invoice{(stats?.pending.count ?? 0) !== 1 ? 's' : ''} pending your review
                        </p>
                        <p className="text-[12px] text-amber-700 dark:text-amber-400 mt-0.5">
                            Printers are waiting for approval before payment can be processed.
                        </p>
                    </div>
                    <button onClick={() => setStatusFilter('pending')}
                        className="shrink-0 text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
                        Review Now
                    </button>
                </div>
            )}

            {/* Filters panel */}
            <div className={cn('overflow-hidden transition-all duration-300 rounded-2xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800', showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-0')}>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">Advanced Filters</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="space-y-1.5 lg:col-span-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input placeholder="Invoice #, printer, order, product..." className="pl-9 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>
                        {/* Printer filter */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter by Printer</Label>
                            <Select value={printerFilter} onValueChange={setPrinterFilter}>
                                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                    <SelectValue placeholder="All Printers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Printers</SelectItem>
                                    {printers.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.company || p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {dateFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From</Label>
                                <Input type="date" className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">To</Label>
                                <Input type="date" className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="flex flex-wrap gap-1.5">
                    {statusChips.map(chip => (
                        <FilterChip key={chip.value} label={chip.label} active={statusFilter === chip.value} onClick={() => setStatusFilter(chip.value)} count={chip.count} />
                    ))}
                </div>
                <div className="flex-1" />
                <div className="flex flex-wrap gap-1.5">
                    {timeChips.map(c => (
                        <FilterChip key={c.value} label={c.label} active={dateFilter === c.value} onClick={() => { setDateFilter(c.value); if (c.value !== 'custom') { setStartDate(''); setEndDate(''); } }} />
                    ))}
                </div>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input placeholder="Quick search..." className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-violet-500/30 transition" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Summary */}
            {!isLoading && (
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                            Showing <span className="font-black text-slate-700 dark:text-zinc-200">{filtered.length}</span> of{' '}
                            <span className="font-black text-slate-700 dark:text-zinc-200">{invoices.length}</span> invoices
                        </span>
                    </div>
                    {filtered.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-2.5 py-1 rounded-full">
                            <IndianRupee className="h-3 w-3" />
                            ₹{filtered.reduce((s, i) => s + parseFloat(i.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} in view
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Loading invoices…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Receipt className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-700 dark:text-zinc-300 text-base">No invoices found</p>
                        <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">{hasFilters ? 'Try adjusting your filters.' : 'No printer invoices have been submitted yet.'}</p>
                    </div>
                    {hasFilters && (
                        <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs"
                            onClick={() => { setSearch(''); setPrinterFilter('all'); setStatusFilter('all'); setDateFilter('all'); }}>
                            Clear all filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40">
                                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Printer</th>
                                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Order / Product</th>
                                    <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                    <th className="text-center px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Sent At</th>
                                    <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</th>
                                    <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(inv => {
                                    const productName = inv.order?.directSellingProduct?.name || inv.order?.product?.name || 'N/A';
                                    const printerName = inv.printer?.companyName || inv.printer?.fullName || 'Unknown';
                                    const canApprove = inv.status === 'pending';
                                    const canPay = inv.status === 'approved';
                                    const canReject = inv.status === 'pending' || inv.status === 'approved';

                                    return (
                                        <tr key={inv.id} className="border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors group">
                                            <td className="px-4 py-4">
                                                <span className="font-black text-[11px] text-violet-600 dark:text-violet-400 font-mono">{inv.invoiceNumber}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-[9px] shrink-0">
                                                        {printerName.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate max-w-[120px]">{printerName}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[120px]">{inv.printer?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">#{inv.order?.id} · {inv.order?.user?.name}</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[160px]">{productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="font-black text-sm text-slate-900 dark:text-white">
                                                    ₹{parseFloat(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <StatusPill status={inv.status} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{inv.sentAt ? format(new Date(inv.sentAt), 'dd MMM yyyy') : '—'}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">{inv.sentAt ? format(new Date(inv.sentAt), 'h:mm a') : ''}</p>
                                            </td>
                                            <td className="px-4 py-4 max-w-[140px]">
                                                {inv.notes ? (
                                                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 italic line-clamp-2">{inv.notes}</span>
                                                ) : inv.adminNote ? (
                                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 italic line-clamp-2">{inv.adminNote}</span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 dark:text-zinc-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {canApprove && (
                                                        <button
                                                            onClick={() => setActionDialog({ invoice: inv, type: 'approved' })}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25"
                                                        >
                                                            <ShieldCheck className="h-3 w-3" /> Approve
                                                        </button>
                                                    )}
                                                    {canPay && (
                                                        <button
                                                            onClick={() => setActionDialog({ invoice: inv, type: 'paid' })}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/25"
                                                        >
                                                            <Banknote className="h-3 w-3" /> Pay
                                                        </button>
                                                    )}
                                                    {canReject && (
                                                        <button
                                                            onClick={() => setActionDialog({ invoice: inv, type: 'rejected' })}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                                                        >
                                                            <Ban className="h-3 w-3" /> Reject
                                                        </button>
                                                    )}
                                                    {inv.status === 'paid' && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                                            <CheckCircle2 className="h-3 w-3" /> Paid
                                                        </span>
                                                    )}
                                                    {inv.status === 'rejected' && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                                                            <Ban className="h-3 w-3" /> Rejected
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Table footer summary */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] font-black text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                            Total: <IndianRupee className="h-3 w-3 text-violet-500" />
                            {filtered.reduce((s, i) => s + parseFloat(i.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
