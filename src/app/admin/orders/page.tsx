'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminAllOrders, getAdminOrderStats } from "@/app/actions/order-actions";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import {
    IndianRupee,
    Eye,
    Loader2,
    TrendingUp,
    Search,
    XCircle,
    Filter,
    CalendarDays,
    AlertTriangle,
    Printer,
    Clock,
    CreditCard,
    Building2,
    Layers,
    User2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    ShoppingBag,
    CheckCircle2,
    Circle,
    Truck,
    PackageCheck,
    Ban,
    Hourglass,
    SlidersHorizontal,
    ArrowUpRight,
    Zap,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Order = Awaited<ReturnType<typeof getAdminAllOrders>>['orders'][0];

// ── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending:      { label: 'Pending',      color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',     icon: <Hourglass className="h-3 w-3" /> },
    confirmed:    { label: 'Confirmed',    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',         icon: <CheckCircle2 className="h-3 w-3" /> },
    quality_check:{ label: 'QC Check',    color: 'text-purple-600 dark:text-purple-400',bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',  icon: <Zap className="h-3 w-3" /> },
    processing:   { label: 'Processing',  color: 'text-indigo-600 dark:text-indigo-400',bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',  icon: <RefreshCw className="h-3 w-3" /> },
    shipped:      { label: 'Shipped',      color: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',          icon: <Truck className="h-3 w-3" /> },
    delivered:    { label: 'Delivered',    color: 'text-emerald-600 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',icon:<PackageCheck className="h-3 w-3" /> },
    cancelled:    { label: 'Cancelled',    color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',          icon: <Ban className="h-3 w-3" /> },
    refunded:     { label: 'Refunded',     color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700',      icon: <Circle className="h-3 w-3" /> },
};

function StatusPill({ status }: { status: string | null }) {
    const cfg = STATUS_CONFIG[status ?? ''] ?? { label: status ?? 'Unknown', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200', icon: <Circle className="h-3 w-3" /> };
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', cfg.color, cfg.bg)}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

// ── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, accent, icon }: { title: string; value: string; sub: string; accent: string; icon: React.ReactNode }) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group cursor-default",
            "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800"
        )}>
            {/* gradient accent */}
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", accent)} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{title}</p>
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                </div>
                <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">{sub}</p>
            </div>
        </div>
    );
}

// ── Filter chip ─────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border whitespace-nowrap",
                active
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-600"
            )}
        >
            {label}
        </button>
    );
}

// ── Skeleton row ────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-slate-100 dark:border-zinc-800/60">
            {[8, 18, 12, 20, 10, 14, 12, 6].map((w, i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className={cn("h-4 rounded-lg bg-slate-100 dark:bg-zinc-800 animate-pulse", `w-${w}`)} />
                </td>
            ))}
        </tr>
    );
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statsData, setStatsData] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [timeFilter, setTimeFilter] = useState('this_month');
    const [statusFilter, setStatusFilter] = useState('all');
    const [assignmentFilter, setAssignmentFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setStatusFilter('all');
        setAssignmentFilter('all');
        setTimeFilter('this_month');
        setStartDate('');
        setEndDate('');
        setPage(1);
    }, []);

    // Resolve date range from time filter
    const resolveDates = useCallback(() => {
        if (timeFilter === 'today') return { s: startOfDay(new Date()).toISOString(), e: endOfDay(new Date()).toISOString() };
        if (timeFilter === 'this_week') return { s: startOfWeek(new Date()).toISOString(), e: endOfWeek(new Date()).toISOString() };
        if (timeFilter === 'this_month') return { s: startOfMonth(new Date()).toISOString(), e: endOfMonth(new Date()).toISOString() };
        if (timeFilter === 'all') return { s: '', e: '' };
        return { s: startDate, e: endDate };
    }, [timeFilter, startDate, endDate]);

    useEffect(() => { setPage(1); }, [timeFilter, statusFilter, assignmentFilter, searchQuery, startDate, endDate]);

    useEffect(() => {
        const { s, e } = resolveDates();
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const [fetched, stats] = await Promise.all([
                    getAdminAllOrders({ page, limit: 12, searchQuery, statusFilter, assignmentFilter, startDate: s, endDate: e }),
                    getAdminOrderStats({ searchQuery, statusFilter, startDate: s, endDate: e }),
                ]);
                setOrders(fetched.orders);
                setTotalPages(fetched.totalPages);
                setTotalCount(fetched.totalCount);
                setStatsData(stats);
            } catch (err) {
                console.error('Failed to load orders', err);
            } finally {
                setIsLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [page, timeFilter, statusFilter, assignmentFilter, searchQuery, startDate, endDate, resolveDates]);

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || assignmentFilter !== 'all' || timeFilter !== 'this_month';

    // KPI definitions
    const kpis = [
        {
            title: "Today's Revenue",
            value: `₹${statsData ? statsData.today.amount.toLocaleString('en-IN') : '—'}`,
            sub: `${statsData?.today.count ?? '—'} orders today`,
            accent: 'bg-gradient-to-br from-blue-500/5 to-indigo-500/10',
            icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
        },
        {
            title: 'Period Revenue',
            value: `₹${statsData ? statsData.filtered.amount.toLocaleString('en-IN') : '—'}`,
            sub: `${statsData?.filtered.count ?? '—'} matching orders`,
            accent: 'bg-gradient-to-br from-indigo-500/5 to-purple-500/10',
            icon: <Filter className="h-4 w-4 text-indigo-500" />,
        },
        {
            title: "This Month's Revenue",
            value: `₹${statsData ? statsData.thisMonth.amount.toLocaleString('en-IN') : '—'}`,
            sub: `${statsData?.thisMonth.count ?? '—'} total orders`,
            accent: 'bg-gradient-to-br from-emerald-500/5 to-teal-500/10',
            icon: <IndianRupee className="h-4 w-4 text-emerald-500" />,
        },
        {
            title: 'Press Assigned',
            value: String(statsData?.printers?.assigned ?? '—'),
            sub: 'Active production jobs',
            accent: 'bg-gradient-to-br from-cyan-500/5 to-blue-500/10',
            icon: <Printer className="h-4 w-4 text-cyan-500" />,
        },
        {
            title: 'Awaiting Press',
            value: String(statsData?.printers?.unassigned ?? '—'),
            sub: 'Need partner allocation',
            accent: 'bg-gradient-to-br from-rose-500/5 to-pink-500/10',
            icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,
        },
        {
            title: 'Unresponsive',
            value: String(statsData?.printers?.unresponsive ?? '—'),
            sub: 'Overdue > 6 hours',
            accent: 'bg-gradient-to-br from-amber-500/5 to-orange-500/10',
            icon: <Clock className="h-4 w-4 text-amber-500" />,
        },
    ];

    const timeChips = [
        { label: 'Today',      value: 'today' },
        { label: 'This Week',  value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'All Time',   value: 'all' },
        { label: 'Custom',     value: 'custom' },
    ];

    return (
        <div className="space-y-6 min-h-screen">

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <Package className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Orders</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 ml-10">
                        Manage customer purchases, press commissions & dispatch workflows
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
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
                        {hasActiveFilters && (
                            <span className="ml-0.5 h-4 w-4 rounded-full bg-blue-600 text-[9px] text-white flex items-center justify-center font-black">!</span>
                        )}
                    </Button>
                </div>
            </div>

            {/* ── KPI grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                {kpis.map(k => <KpiCard key={k.title} {...k} />)}
            </div>

            {/* ── Status legend ────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150 hover:shadow-sm",
                            cfg.bg, cfg.color,
                            statusFilter === key && "ring-2 ring-offset-1 ring-current"
                        )}
                    >
                        {cfg.icon} {cfg.label}
                    </button>
                ))}
                <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150 hover:shadow-sm",
                        "bg-slate-50 dark:bg-zinc-900 text-slate-500 border-slate-200 dark:border-zinc-700",
                        statusFilter === 'all' && "ring-2 ring-offset-1 ring-slate-400"
                    )}
                >
                    <BarChart3 className="h-3 w-3" /> All Statuses
                </button>
            </div>

            {/* ── Filters panel ───────────────────────────────────────────── */}
            <div className={cn(
                "overflow-hidden transition-all duration-300 rounded-2xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800",
                showFilters ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-0"
            )}>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
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
                                    placeholder="Order ID, customer name or email..."
                                    className="pl-9 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="quality_check">Quality Check</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Assignment */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Press Assignment</Label>
                            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Orders</SelectItem>
                                    <SelectItem value="assigned">Press Assigned</SelectItem>
                                    <SelectItem value="unassigned">Awaiting Press</SelectItem>
                                    <SelectItem value="unresponsive">Unresponsive (&gt;6 hrs)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Custom date range (shown when custom is selected) */}
                    {timeFilter === 'custom' && (
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

            {/* ── Main table card ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">

                {/* Table toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800">
                    {/* Quick search (visible even when filters hidden) */}
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            placeholder="Quick search..."
                            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Time filter chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {timeChips.map(c => (
                            <FilterChip
                                key={c.value}
                                label={c.label}
                                active={timeFilter === c.value}
                                onClick={() => {
                                    setTimeFilter(c.value);
                                    if (c.value !== 'custom') { setStartDate(''); setEndDate(''); }
                                }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 ml-auto sm:ml-0 shrink-0">
                        {!isLoading && (
                            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                                {totalCount.toLocaleString()} order{totalCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40">
                                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 w-20">Order</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Customer</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Date</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Product</th>
                                <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Status</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Press Partner</th>
                                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Amount</th>
                                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                : orders.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={8}>
                                            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                                                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-zinc-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 dark:text-zinc-300 text-base">No orders found</p>
                                                    <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">Try adjusting your filters or date range</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl font-bold text-xs">
                                                    Reset all filters
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                                : orders.map((order) => {
                                    const isOverdue = order.orderStatus === 'pending' && order.printerAssigned && order.printerAssignedAt
                                        && (Date.now() - new Date(order.printerAssignedAt).getTime()) / 3600000 > 6;

                                    return (
                                        <tr
                                            key={order.id}
                                            className={cn(
                                                "border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors duration-150 group",
                                                isOverdue && "bg-amber-50/40 dark:bg-amber-950/10"
                                            )}
                                        >
                                            {/* Order ID */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-[11px] text-slate-900 dark:text-white font-mono">#{order.id}</span>
                                                    {order.contestId && (
                                                        <span className="text-[9px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 rounded-full w-max border border-purple-200 dark:border-purple-800">Contest</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0 text-[10px] font-black text-white">
                                                        {order.user.name?.charAt(0)?.toUpperCase() ?? '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate max-w-[130px]">{order.user.name}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[130px]">{order.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{format(new Date(order.createdAt!), 'dd MMM yyyy')}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">{format(new Date(order.createdAt!), 'h:mm a')}</p>
                                            </td>

                                            {/* Product */}
                                            <td className="px-4 py-3.5 max-w-[200px]">
                                                <p className="font-semibold text-xs text-slate-800 dark:text-zinc-200 truncate" title={order.directSellingProduct?.name || order.product?.name || undefined}>
                                                    {order.directSellingProduct?.name || order.product?.name || 'N/A'}
                                                </p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Layers className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                        {order.quantity} pcs · ₹{parseFloat(order.unitPrice).toFixed(2)}/ea
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <StatusPill status={order.orderStatus} />
                                                    {isOverdue && (
                                                        <span className="text-[9px] font-black text-amber-500 animate-pulse flex items-center gap-0.5">
                                                            <AlertTriangle className="h-2.5 w-2.5" /> No Response
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Press Partner */}
                                            <td className="px-4 py-3.5">
                                                {order.printerAssigned ? (
                                                    <div className="flex items-start gap-2">
                                                        <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0 mt-0.5">
                                                            <Building2 className="h-3 w-3 text-blue-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[130px]">
                                                                {order.printer?.companyName || order.printer?.fullName || 'Press Partner'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-0.5">
                                                                <IndianRupee className="h-2.5 w-2.5" />
                                                                {parseFloat(order.printingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} payout
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full w-max">
                                                            <AlertTriangle className="h-2.5 w-2.5" /> Unassigned
                                                        </span>
                                                        <Link href={`/admin/orders/${order.id}`} className="text-[9px] text-blue-500 font-semibold hover:underline flex items-center gap-0.5">
                                                            Assign Now <ArrowUpRight className="h-2.5 w-2.5" />
                                                        </Link>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Amount */}
                                            <td className="px-4 py-3.5 text-right">
                                                <p className="font-black text-sm text-slate-900 dark:text-white">
                                                    ₹{parseFloat(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                                    <CreditCard className="h-2.5 w-2.5 text-slate-400" />
                                                    <span className={cn(
                                                        "text-[10px] font-semibold capitalize",
                                                        order.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-slate-400'
                                                    )}>
                                                        {order.paymentStatus || 'pending'}
                                                    </span>
                                                </div>
                                                {order.contestId && order.contest?.payments?.[0] && (
                                                    <span className="text-[9px] text-purple-500 font-semibold block mt-0.5">
                                                        +₹{parseFloat(order.contest.payments[0].amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} prepaid
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td className="px-5 py-3.5 text-right">
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/20">
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                            Page <span className="font-bold text-slate-700 dark:text-zinc-300">{page}</span> of <span className="font-bold text-slate-700 dark:text-zinc-300">{totalPages}</span>
                            <span className="ml-2 text-slate-300 dark:text-zinc-600">·</span>
                            <span className="ml-2">{totalCount.toLocaleString()} results</span>
                        </p>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {/* Page number pills */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                return (
                                    <Button
                                        key={p}
                                        variant={p === page ? "default" : "outline"}
                                        size="icon"
                                        className={cn("h-8 w-8 rounded-xl text-xs font-bold", p === page && "bg-blue-600 border-blue-600 shadow-md shadow-blue-600/25")}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </Button>
                                );
                            })}
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}