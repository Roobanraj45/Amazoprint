'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
    getPrinterDeliveredOrders,
    getPrinterInvoices,
    getPrinterInvoicedOrderIds,
    sendPrinterInvoice,
} from '@/app/actions/invoice-actions';
import {
    IndianRupee,
    FileText,
    Send,
    CheckCircle2,
    Clock,
    Ban,
    XCircle,
    Loader2,
    RefreshCw,
    Search,
    Package,
    AlertTriangle,
    TrendingUp,
    Eye,
    ChevronDown,
    ChevronUp,
    PackageCheck,
    CalendarDays,
    Layers,
    User2,
    SlidersHorizontal,
    Filter,
    BarChart3,
    Banknote,
    Receipt,
    CircleCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';

type DeliveredOrder = Awaited<ReturnType<typeof getPrinterDeliveredOrders>>[0];
type Invoice = Awaited<ReturnType<typeof getPrinterInvoices>>[0];

// ── Status config ─────────────────────────────────────────────────────────────
const INV_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; dot: string }> = {
    pending: {
        label: 'Pending Review',
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        icon: <Clock className="h-3 w-3" />,
    },
    approved: {
        label: 'Approved',
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
        icon: <CheckCircle2 className="h-3 w-3" />,
    },
    paid: {
        label: 'Paid',
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        icon: <Banknote className="h-3 w-3" />,
    },
    rejected: {
        label: 'Rejected',
        color: 'text-rose-700 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
        icon: <Ban className="h-3 w-3" />,
    },
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
function KpiCard({ title, value, sub, accent, icon }: { title: string; value: string | number; sub: string; accent: string; icon: React.ReactNode }) {
    return (
        <div className={cn('relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group cursor-default bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800')}>
            <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500', accent)} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{title}</p>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform duration-300">{icon}</div>
                </div>
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">{sub}</p>
            </div>
        </div>
    );
}

function SendInvoiceModal({
    order,
    onClose,
    onSent,
}: {
    order: DeliveredOrder;
    onClose: () => void;
    onSent: () => void;
}) {
    const productName = order.directSellingProduct?.name || order.product?.name || 'Product';

    const [items, setItems] = useState<{ id: string; description: string; qty: string; unitPrice: string }[]>([
        { id: Date.now().toString(), description: `Printing for ${productName}`, qty: String(order.quantity), unitPrice: (parseFloat(order.printingAmount || '0') / (order.quantity || 1)).toFixed(2) }
    ]);
    const [notes, setNotes] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    const totalAmount = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)), 0);

    const handleSend = () => {
        if (items.length === 0) {
            setError('Please add at least one item.');
            return;
        }
        if (totalAmount <= 0) {
            setError('Total amount must be greater than 0.');
            return;
        }
        for (const item of items) {
            if (!item.description.trim() || !parseFloat(item.qty) || !parseFloat(item.unitPrice)) {
                setError('All items must have a description, valid quantity, and unit price.');
                return;
            }
        }
        
        setError('');
        startTransition(async () => {
            try {
                await sendPrinterInvoice({ 
                    orderId: order.id, 
                    amount: String(totalAmount.toFixed(2)), 
                    invoiceItems: items.map(i => ({ description: i.description, qty: parseFloat(i.qty), unitPrice: parseFloat(i.unitPrice), total: parseFloat(i.qty) * parseFloat(i.unitPrice) })),
                    notes: notes.trim() || undefined 
                });
                onSent();
                onClose();
            } catch (err: any) {
                setError(err.message || 'Failed to send invoice. Please try again.');
            }
        });
    };

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), description: '', qty: '1', unitPrice: '0' }]);
    };
    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };
    const updateItem = (id: string, field: string, value: string) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 max-w-2xl w-full animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5 shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-600/30">
                        <Send className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Create Invoice</h3>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Order #{order.id} · {productName}</p>
                    </div>
                </div>

                <div className="overflow-y-auto pr-2 pb-2 space-y-4">
                    {/* Order summary */}
                    <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-100 dark:border-zinc-800 p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{order.user.name}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 dark:border-zinc-700 pt-2 mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. Printing Amount</span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                ₹{parseFloat(order.printingAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice Items</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs font-bold rounded-lg px-3 gap-1">
                                + Add Item
                            </Button>
                        </div>
                        
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700">
                                    <div className="w-full sm:flex-1 min-w-[150px]">
                                        <Input placeholder="Description" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="h-8 text-xs font-medium bg-white dark:bg-zinc-900" />
                                    </div>
                                    <div className="w-20">
                                        <Input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} className="h-8 text-xs bg-white dark:bg-zinc-900" />
                                    </div>
                                    <div className="w-28 relative">
                                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <Input type="number" step="0.01" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} className="h-8 pl-7 text-xs bg-white dark:bg-zinc-900" />
                                    </div>
                                    <div className="w-24 text-right pr-2">
                                        <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                                            ₹{((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                    {items.length > 1 && (
                                        <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end p-3 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-900/50">
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 mr-4">Total Amount</span>
                                <span className="text-lg font-black text-violet-700 dark:text-violet-400">
                                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes (optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Any remarks or payment instructions..."
                            className="rounded-xl text-sm resize-none bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-4 shrink-0 pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 gap-2"
                        onClick={handleSend}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send Invoice (₹{totalAmount.toFixed(2)})
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
export default function PrinterInvoicesPage() {
    const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoicedOrderIds, setInvoicedOrderIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');

    // Alerts
    const [alerts, setAlerts] = useState<Array<{ id: number; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>>([]);
    const addAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        const id = Date.now();
        setAlerts(a => [...a, { id, type, title, message }]);
        setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 5000);
    }, []);

    // Modal
    const [invoiceModal, setInvoiceModal] = useState<DeliveredOrder | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [orders, invs, ids] = await Promise.all([
                getPrinterDeliveredOrders(),
                getPrinterInvoices(),
                getPrinterInvoicedOrderIds(),
            ]);
            setDeliveredOrders(orders);
            setInvoices(invs);
            setInvoicedOrderIds(ids);
        } catch (err: any) {
            addAlert('error', 'Load failed', err.message || 'Could not load invoice data.');
        } finally {
            setIsLoading(false);
        }
    }, [addAlert]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Stats
    const stats = {
        pendingInvoice: deliveredOrders.filter(o => !invoicedOrderIds.includes(o.id)).length,
        totalInvoices: invoices.length,
        pendingReview: invoices.filter(i => i.status === 'pending').length,
        approved: invoices.filter(i => i.status === 'approved').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        totalEarned: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0),
    };

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            const hit = [
                inv.invoiceNumber,
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

    // Pending orders (not yet invoiced)
    const pendingOrders = deliveredOrders.filter(o => !invoicedOrderIds.includes(o.id));

    const timeChips = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Custom', value: 'custom' },
    ];

    return (
        <div className="space-y-6 min-h-screen p-6 lg:p-8 max-w-[1400px] mx-auto pb-20">

            {/* Send Invoice Modal */}
            {invoiceModal && (
                <SendInvoiceModal
                    order={invoiceModal}
                    onClose={() => setInvoiceModal(null)}
                    onSent={() => {
                        addAlert('success', 'Invoice Sent!', `Invoice for Order #${invoiceModal.id} sent successfully and is pending admin review.`);
                        fetchAll();
                    }}
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
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">My Invoices</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 ml-10">
                        Send invoices for completed orders & track payment status
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(f => !f)}
                        className={cn('font-bold text-xs gap-1.5 rounded-xl', showFilters && 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 text-violet-600')}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchAll} disabled={isLoading} className="font-bold text-xs gap-1.5 rounded-xl">
                        <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} /> Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                <KpiCard title="Ready to Invoice" value={stats.pendingInvoice} sub="Completed, not invoiced" accent="bg-gradient-to-br from-amber-500/5 to-orange-500/10" icon={<Package className="h-4 w-4 text-amber-500" />} />
                <KpiCard title="Total Invoices" value={stats.totalInvoices} sub="All time sent" accent="bg-gradient-to-br from-violet-500/5 to-purple-500/10" icon={<FileText className="h-4 w-4 text-violet-500" />} />
                <KpiCard title="Pending Review" value={stats.pendingReview} sub="Awaiting admin" accent="bg-gradient-to-br from-blue-500/5 to-indigo-500/10" icon={<Clock className="h-4 w-4 text-blue-500" />} />
                <KpiCard title="Approved" value={stats.approved} sub="Ready for payment" accent="bg-gradient-to-br from-indigo-500/5 to-blue-500/10" icon={<CheckCircle2 className="h-4 w-4 text-indigo-500" />} />
                <KpiCard title="Paid" value={stats.paid} sub="Successfully cleared" accent="bg-gradient-to-br from-emerald-500/5 to-teal-500/10" icon={<Banknote className="h-4 w-4 text-emerald-500" />} />
                <KpiCard
                    title="Total Earned"
                    value={`₹${stats.totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                    sub="Paid invoices amount"
                    accent="bg-gradient-to-br from-emerald-500/5 to-green-500/10"
                    icon={<IndianRupee className="h-4 w-4 text-emerald-500" />}
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2',
                        activeTab === 'pending'
                            ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                    )}
                >
                    <Package className="h-3.5 w-3.5" />
                    Completed Orders
                    {stats.pendingInvoice > 0 && (
                        <span className="h-5 min-w-5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                            {stats.pendingInvoice}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={cn(
                        'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2',
                        activeTab === 'sent'
                            ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                    )}
                >
                    <Receipt className="h-3.5 w-3.5" />
                    My Invoices
                    {stats.totalInvoices > 0 && (
                        <span className="h-5 min-w-5 px-1 rounded-full bg-violet-500 text-white text-[9px] font-black flex items-center justify-center">
                            {stats.totalInvoices}
                        </span>
                    )}
                </button>
            </div>

            {/* ── TAB 1: Completed Orders (ready to invoice) ── */}
            {activeTab === 'pending' && (
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                        </div>
                    ) : pendingOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                            <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                <CircleCheck className="h-8 w-8 text-emerald-400" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-700 dark:text-zinc-300 text-base">All invoices sent!</p>
                                <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">No completed orders are waiting for an invoice.</p>
                            </div>
                        </div>
                    ) : (
                        pendingOrders.map(order => {
                            const productName = order.directSellingProduct?.name || order.product?.name || 'Product';
                            return (
                                <div key={order.id} className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 font-black text-[11px] text-white shadow-md shadow-emerald-500/30">
                                            #{order.id}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[220px]">{productName}</h3>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
                                                    <PackageCheck className="h-3 w-3" /> Delivered
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
                                                <span className="flex items-center gap-1"><User2 className="h-3 w-3" /> {order.user.name}</span>
                                                <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {order.quantity} pcs</span>
                                                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {format(new Date(order.createdAt!), 'dd MMM yyyy')}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                                    <IndianRupee className="h-3.5 w-3.5" />
                                                    {parseFloat(order.printingAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Printing Amount</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => setInvoiceModal(order)}
                                                className="h-9 px-4 rounded-xl text-xs font-black bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 gap-1.5"
                                            >
                                                <Send className="h-3.5 w-3.5" /> Send Invoice
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ── TAB 2: Sent Invoices ── */}
            {activeTab === 'sent' && (
                <div className="space-y-4">
                    {/* Filters panel */}
                    <div className={cn('overflow-hidden transition-all duration-300 rounded-2xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800', showFilters ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 border-0')}>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input placeholder="Invoice #, order, product..." className="pl-9 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date Range</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {timeChips.map(c => (
                                            <FilterChip key={c.value} label={c.label} active={dateFilter === c.value} onClick={() => { setDateFilter(c.value); if (c.value !== 'custom') { setStartDate(''); setEndDate(''); } }} />
                                        ))}
                                    </div>
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

                    {/* Status filter chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { label: 'All', value: 'all', count: invoices.length },
                            { label: 'Pending', value: 'pending', count: stats.pendingReview },
                            { label: 'Approved', value: 'approved', count: stats.approved },
                            { label: 'Paid', value: 'paid', count: stats.paid },
                            { label: 'Rejected', value: 'rejected', count: invoices.filter(i => i.status === 'rejected').length },
                        ].map(chip => (
                            <FilterChip key={chip.value} label={chip.label} active={statusFilter === chip.value} onClick={() => setStatusFilter(chip.value)} count={chip.count} />
                        ))}
                        <div className="flex-1" />
                        {(search || statusFilter !== 'all' || dateFilter !== 'all') && (
                            <button onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter('all'); setStartDate(''); setEndDate(''); }}
                                className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors">
                                <XCircle className="h-3.5 w-3.5" /> Clear
                            </button>
                        )}
                    </div>

                    {/* Summary */}
                    {!isLoading && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                            <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                            Showing <span className="font-black text-slate-700 dark:text-zinc-200 mx-1">{filteredInvoices.length}</span> of
                            <span className="font-black text-slate-700 dark:text-zinc-200 mx-1">{invoices.length}</span> invoices
                            {filteredInvoices.length > 0 && (
                                <>
                                    <span className="text-slate-300 dark:text-zinc-600">·</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-0.5">
                                        <IndianRupee className="h-3 w-3" />
                                        {filteredInvoices.reduce((s, i) => s + parseFloat(i.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-slate-400 dark:text-zinc-500">filtered total</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Invoice table */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 text-violet-500 animate-spin" /></div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Receipt className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-700 dark:text-zinc-300 text-base">No invoices found</p>
                                <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">Send an invoice from the Completed Orders tab.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40">
                                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Order</th>
                                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                                            <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                            <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Sent</th>
                                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.map(inv => {
                                            const productName = inv.order?.directSellingProduct?.name || inv.order?.product?.name || 'N/A';
                                            return (
                                                <tr key={inv.id} className="border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-black text-[11px] text-violet-600 dark:text-violet-400 font-mono">{inv.invoiceNumber}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">#{inv.order?.id}</span>
                                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">{inv.order?.user?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 max-w-[180px]">
                                                        <span className="font-semibold text-xs text-slate-700 dark:text-zinc-300 truncate block" title={productName}>{productName}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                                            ₹{parseFloat(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <StatusPill status={inv.status} />
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{inv.sentAt ? format(new Date(inv.sentAt), 'dd MMM yyyy') : '—'}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">{inv.sentAt ? format(new Date(inv.sentAt), 'h:mm a') : ''}</p>
                                                    </td>
                                                    <td className="px-4 py-3.5 max-w-[160px]">
                                                        {inv.adminNote ? (
                                                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 italic line-clamp-2">{inv.adminNote}</span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 dark:text-zinc-600">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
