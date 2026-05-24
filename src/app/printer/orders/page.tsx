'use client';

import { useState, useEffect, useMemo } from 'react';
import { getPrinterAssignedOrders } from "@/app/actions/order-actions";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { format, isToday } from 'date-fns';
import { IndianRupee, MoreVertical, Eye, Loader2, Search, Filter, Package, Printer, Clock, CheckCircle2, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { cn, resolveImagePath } from '@/lib/utils';

type Order = Awaited<ReturnType<typeof getPrinterAssignedOrders>>[0];

export default function PrinterOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    useEffect(() => {
        async function loadOrders() {
            setIsLoading(true);
            try {
                const fetchedOrders = await getPrinterAssignedOrders();
                setOrders(fetchedOrders);
            } catch (error) {
                console.error("Failed to load orders", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
            const matchesSearch = searchQuery === '' || 
                order.id.toString().includes(searchQuery) ||
                order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.product?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [orders, statusFilter, searchQuery]);

    const stats = [
        { 
            title: "Assigned Jobs", 
            value: orders.filter(o => o.orderStatus === 'processing').length, 
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        { 
            title: "Completed Today", 
            value: orders.filter(o => o.orderStatus === 'delivered' && isToday(new Date(o.updatedAt || o.createdAt))).length, 
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        { 
            title: "Total Workload", 
            value: orders.length, 
            icon: Package,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
    ];

    const DPI = 300;
    const MM_TO_PX = DPI / 25.4;

    const handlePreviewDesign = (order: Order) => {
        if (order.design) {
            const design = order.design;
            try {
                const productForCanvas = {
                    id: design.productSlug, 
                    name: design.name, 
                    description: '', 
                    imageId: '',
                    width: Math.round(Number(design.width) * MM_TO_PX),
                    height: Math.round(Number(design.height) * MM_TO_PX), 
                    type: '',
                };

                const pages = Array.isArray(design.elements) && Array.isArray(design.elements[0])
                    ? (design.elements as any[][]).map((els, i) => ({
                        elements: els,
                        background: (design.background as any[])[i]
                    }))
                    : [{ 
                        elements: design.elements as any[], 
                        background: design.background as any 
                    }];

                const renderData = {
                    pages: pages,
                    product: productForCanvas, 
                    guides: (design.guides as any[]) || [], 
                    bleed: 18, 
                    safetyMargin: 18,
                };
                localStorage.setItem('pdf_render_data', JSON.stringify(renderData));
                window.open('/pdf-render', '_blank');
            } catch (error) {
                console.error('Error opening preview:', error);
            }
        } else if (order.designUpload) {
            window.open(resolveImagePath(order.designUpload.filePath), '_blank');
        }
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                        <Printer size={12} /> Production Queue
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-headline">
                        Manufacturing <span className="text-primary">Orders</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col text-right px-4 py-2 border-r border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Jobs</span>
                        <span className="text-xl font-black text-slate-900">{orders.filter(o => o.orderStatus === 'processing').length}</span>
                    </div>
                    <Button className="h-12 px-6 rounded-2xl shadow-xl shadow-primary/20 font-bold text-xs uppercase tracking-widest gap-2">
                        <Clock size={16} /> Batch View
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map(stat => (
                    <Card key={stat.title} className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                                    <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                                </div>
                                <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                                    <stat.icon size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Orders Table Section */}
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 bg-zinc-50/50">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by ID, Customer, or Product..."
                                    className="h-12 pl-12 pr-6 bg-white border-2 border-slate-100 focus:border-primary focus:ring-0 rounded-2xl font-bold text-xs transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-12 w-full md:w-[200px] bg-white border-2 border-slate-100 rounded-2xl font-bold text-xs">
                                    <SelectValue placeholder="Production Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="processing">In Production</SelectItem>
                                    <SelectItem value="shipped">Dispatched</SelectItem>
                                    <SelectItem value="delivered">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-[500px] gap-4">
                            <div className="relative">
                                <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                                <div className="absolute inset-0 h-12 w-12 bg-primary/20 blur-xl rounded-full" />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Production Data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-zinc-50/50 border-b-2">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[120px] pl-10 h-16 font-black text-[10px] uppercase tracking-widest text-slate-400">Order Token</TableHead>
                                        <TableHead className="h-16 font-black text-[10px] uppercase tracking-widest text-slate-400">Client Details</TableHead>
                                        <TableHead className="h-16 font-black text-[10px] uppercase tracking-widest text-slate-400">Product Blueprint</TableHead>
                                        <TableHead className="h-16 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Batch Status</TableHead>
                                        <TableHead className="h-16 font-black text-[10px] uppercase tracking-widest text-slate-400">Received On</TableHead>
                                        <TableHead className="w-[100px] pr-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => {
                                        const isExpanded = expandedOrderId === order.id;
                                        return (
                                            <>
                                                <TableRow 
                                                    key={order.id} 
                                                    className={cn(
                                                        "hover:bg-zinc-50/80 transition-all border-b border-slate-100 group cursor-pointer",
                                                        isExpanded && "bg-slate-50/50"
                                                    )}
                                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                                >
                                                    <TableCell className="pl-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">
                                                                #{order.id}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-black text-xs text-slate-900 uppercase tracking-tight">{order.user.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{order.user.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                                <Package size={18} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-xs text-slate-700 truncate max-w-[200px]">
                                                                    {order.directSellingProduct?.name || order.product?.name || "Unspecified Unit"}
                                                                </span>
                                                                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Qty: {order.quantity} Units</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge 
                                                            className={cn(
                                                                "capitalize text-[9px] font-black tracking-widest px-3 py-1 rounded-full border-2",
                                                                order.orderStatus === 'processing' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                                                                order.orderStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                                                                'bg-slate-100 text-slate-600 border-slate-200'
                                                            )}
                                                        >
                                                            {order.orderStatus === 'processing' ? 'In Production' : order.orderStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs text-slate-600 italic">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                                                            <span className="text-[10px] font-medium text-slate-400">{format(new Date(order.createdAt), 'hh:mm a')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="pr-10 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-200 transition-colors">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-2xl border-2 shadow-2xl">
                                                                <DropdownMenuItem asChild className="rounded-xl h-10 font-bold text-xs cursor-pointer">
                                                                    <Link href={`/printer/orders/${order.id}`}>
                                                                        <Eye className="mr-3 h-4 w-4 text-blue-500" /> View Job Specs Sheet
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="rounded-xl h-10 font-bold text-xs cursor-pointer text-amber-600">
                                                                    <Settings className="mr-3 h-4 w-4" /> Production Steps
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 dark:bg-slate-900/30">
                                                        <TableCell colSpan={6} className="p-6 border-b border-slate-100 dark:border-slate-800">
                                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                                                    <div>
                                                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Job Blueprint Specs</h4>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verify manufacturing requirements below before printing</p>
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Button 
                                                                            asChild
                                                                            size="sm"
                                                                            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/10 gap-1.5"
                                                                        >
                                                                            <Link href={`/printer/orders/${order.id}`}>
                                                                                <Eye size={14} /> Open Specs Sheet
                                                                            </Link>
                                                                        </Button>
                                                                        {order.designUpload && (
                                                                            <Button asChild variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200 transition-all gap-1.5">
                                                                                <a href={resolveImagePath(order.designUpload.filePath)} download>
                                                                                    <Download size={14} className="text-slate-400" /> Download Design File
                                                                                </a>
                                                                            </Button>
                                                                        )}
                                                                        {order.design && (
                                                                            <Button 
                                                                                onClick={() => handlePreviewDesign(order)}
                                                                                variant="outline" 
                                                                                size="sm" 
                                                                                className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200 transition-all gap-1.5"
                                                                            >
                                                                                <Download size={14} className="text-slate-400" /> Generate Job File
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {(() => {
                                                                    let parsedCustomisation: any = null;
                                                                    try {
                                                                        const rawCustomisation = order.design?.customisation || (order as any).customisation;
                                                                        parsedCustomisation = typeof rawCustomisation === 'string' 
                                                                            ? JSON.parse(rawCustomisation) 
                                                                            : rawCustomisation;
                                                                    } catch (e) {}

                                                                    const pages = parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double Sided' : 'Single Sided';
                                                                    const dimensions = `${order.design?.width || order.designUpload?.width || 'Custom'} x ${order.design?.height || order.designUpload?.height || 'Custom'} mm`;
                                                                    const spotUv = parsedCustomisation?.spotUv ? 'Yes, Included' : 'No';
                                                                    const dieCut = parsedCustomisation?.dieCut ? `Custom Shape (#${parsedCustomisation.dieCut})` : 'Standard Rectangular';
                                                                    const lamination = parsedCustomisation?.lamination || 'None';
                                                                    const foil = parsedCustomisation?.foilName || parsedCustomisation?.foil || (parsedCustomisation?.foilId ? `Foil ID #${parsedCustomisation.foilId}` : 'None');

                                                                    return (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                                                            <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Printing side</span>
                                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{pages}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Dimensions</span>
                                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{dimensions}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Spot UV Gloss</span>
                                                                                <span className={cn("font-extrabold text-xs", parsedCustomisation?.spotUv ? "text-amber-600" : "text-slate-500")}>{spotUv}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Custom Foil</span>
                                                                                <span className={cn("font-extrabold text-xs", (parsedCustomisation?.foilName || parsedCustomisation?.foil || parsedCustomisation?.foilId) ? "text-indigo-600" : "text-slate-500")}>{foil}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Die Cut / Shape</span>
                                                                                <span className={cn("font-extrabold text-xs", parsedCustomisation?.dieCut ? "text-primary" : "text-slate-500")}>{dieCut}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Lamination</span>
                                                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs capitalize">{lamination}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    
                    {!isLoading && filteredOrders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                                <div className="relative bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border-2 border-slate-50">
                                    <Package className="h-16 w-16 text-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-2xl text-slate-900 uppercase font-headline">Zero Production Load</h3>
                                <p className="text-slate-400 font-bold text-xs max-w-sm mx-auto uppercase tracking-wider">
                                    There are currently no active orders assigned to your hub for the selected filters.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
