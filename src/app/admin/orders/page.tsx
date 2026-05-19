'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAdminAllOrders, getAdminOrderStats } from "@/app/actions/order-actions";
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isToday, startOfDay, endOfDay, parseISO } from 'date-fns';
import { IndianRupee, MoreVertical, Eye, Loader2, Calendar, TrendingUp, Search, XCircle, Filter, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

type Order = Awaited<ReturnType<typeof getAdminAllOrders>>[0];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtering States
    const [timeFilter, setTimeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Date Range States
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [statsData, setStatsData] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        // Reset page to 1 when filters change
        setPage(1);
    }, [timeFilter, statusFilter, searchQuery, startDate, endDate]);

    useEffect(() => {
        async function loadOrders() {
            setIsLoading(true);
            try {
                let resolvedStartDate = startDate;
                let resolvedEndDate = endDate;

                if (timeFilter === 'today') {
                    resolvedStartDate = startOfDay(new Date()).toISOString();
                    resolvedEndDate = endOfDay(new Date()).toISOString();
                } else if (timeFilter === 'this_week') {
                    resolvedStartDate = startOfWeek(new Date()).toISOString();
                    resolvedEndDate = endOfWeek(new Date()).toISOString();
                } else if (timeFilter === 'this_month') {
                    resolvedStartDate = startOfMonth(new Date()).toISOString();
                    resolvedEndDate = endOfMonth(new Date()).toISOString();
                } else if (timeFilter === 'all') {
                    resolvedStartDate = '';
                    resolvedEndDate = '';
                }

                const [fetched, stats] = await Promise.all([
                    getAdminAllOrders({
                        page,
                        limit: 10,
                        searchQuery,
                        statusFilter,
                        startDate: resolvedStartDate,
                        endDate: resolvedEndDate
                    }),
                    getAdminOrderStats({
                        searchQuery,
                        statusFilter,
                        startDate: resolvedStartDate,
                        endDate: resolvedEndDate
                    })
                ]);

                setOrders(fetched.orders);
                setTotalPages(fetched.totalPages);
                setStatsData(stats);
            } catch (error) {
                console.error("Failed to load orders", error);
            } finally {
                setIsLoading(false);
            }
        }
        
        // Debounce search slightly
        const timeoutId = setTimeout(() => {
            loadOrders();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, timeFilter, statusFilter, searchQuery, startDate, endDate]);

    const stats = statsData ? [
        { 
            title: "Today's Revenue", 
            value: `₹${statsData.today.amount.toLocaleString('en-IN')}`, 
            count: `${statsData.today.count} orders today` 
        },
        { 
            title: "Filtered Revenue", 
            value: `₹${statsData.filtered.amount.toLocaleString('en-IN')}`, 
            count: `${statsData.filtered.count} matching orders` 
        },
        { 
            title: "Total Revenue", 
            value: `₹${statsData.total.amount.toLocaleString('en-IN')}`, 
            count: `${statsData.total.count} total orders` 
        },
    ] : [
        { title: "Today's Revenue", value: "₹0", count: "Loading..." },
        { title: "Filtered Revenue", value: "₹0", count: "Loading..." },
        { title: "Total Revenue", value: "₹0", count: "Loading..." },
    ];

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTimeFilter('all');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Order Dashboard</h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                        <XCircle className="mr-2 h-4 w-4" /> Reset All
                    </Button>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map(stat => (
                    <Card key={stat.title} className="shadow-sm border-l-4 border-l-primary">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.count}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b space-y-4">
                    <div className="flex flex-col xl:flex-row gap-4 justify-between">
                        {/* Left: Search and Status */}
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Order ID, Name, Email..."
                                    className="pl-10 bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px] bg-background">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Right: Date Range Picker */}
                        <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground px-1">From Date</Label>
                                    <Input 
                                        type="date" 
                                        className="h-9 bg-background text-sm" 
                                        value={startDate} 
                                        onChange={(e) => {setStartDate(e.target.value); setTimeFilter('custom')}}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground px-1">To Date</Label>
                                    <Input 
                                        type="date" 
                                        className="h-9 bg-background text-sm" 
                                        value={endDate} 
                                        onChange={(e) => {setEndDate(e.target.value); setTimeFilter('custom')}}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full">
                        <TabsList className="bg-background border">
                            <TabsTrigger value="all">All History</TabsTrigger>
                            <TabsTrigger value="today">Today</TabsTrigger>
                            <TabsTrigger value="this_week">This Week</TabsTrigger>
                            <TabsTrigger value="this_month">This Month</TabsTrigger>
                            <TabsTrigger value="custom" className="flex items-center gap-2">
                                <CalendarDays className="h-3.5 w-3.5" /> Custom Range
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-80 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground italic">Fetching orders...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[100px] pl-6 font-semibold">ID</TableHead>
                                        <TableHead className="font-semibold">Customer</TableHead>
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead className="font-semibold">Items</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                        <TableHead className="text-right pr-6 font-semibold">Total Amount</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-muted/10 transition-colors border-b">
                                            <TableCell className="font-mono text-xs pl-6">#{order.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{order.user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{order.user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm whitespace-nowrap">
                                                {format(new Date(order.createdAt), 'dd MMM, yyyy')}
                                            </TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <div className="truncate text-sm font-medium" title={order.directSellingProduct?.name || order.product?.name}>
                                                    {order.directSellingProduct?.name || order.product?.name || "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} 
                                                    className={`capitalize text-[10px] px-2 ${
                                                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''
                                                    }`}
                                                >
                                                    {order.orderStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold pr-6">
                                               <div className="flex flex-col items-end">
                                                   <div className="flex items-center justify-end gap-1 text-primary">
                                                        <IndianRupee size={12} />
                                                        {parseFloat(order.totalAmount).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                                   </div>
                                                   {order.contestId && order.contest?.payments?.[0] && (
                                                        <span className="text-[9px] text-muted-foreground font-medium whitespace-nowrap">
                                                            (₹{parseFloat(order.contest.payments[0].amount).toLocaleString('en-IN', {minimumFractionDigits: 2})} paid during contest)
                                                        </span>
                                                   )}
                                               </div>
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[180px]">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/orders/${order.id}`} className="cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4" /> Order Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer text-blue-600">
                                                            <Calendar className="mr-2 h-4 w-4" /> Update Progress
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    
                    {!isLoading && totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <p className="text-sm text-muted-foreground font-medium">
                                Page <span className="font-bold text-foreground">{page}</span> of <span className="font-bold text-foreground">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                    Previous
                                </Button>
                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {!isLoading && orders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
                            <div className="bg-muted p-4 rounded-full">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">No matching orders</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    We couldn't find any orders for the selected filters. Try widening your date range.
                                </p>
                            </div>
                            <Button variant="outline" className="mt-2" onClick={resetFilters}>
                                Reset all filters
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}