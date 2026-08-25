import { getMyOrders } from "@/app/actions/order-actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";
import { resolveImagePath, cn } from "@/lib/utils";
import { 
    FileText, IndianRupee, Package, Clock, ShieldCheck, Search, Filter, 
    ArrowRight, Download, Truck, Zap, CheckCircle2, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default async function MyOrdersPage({ searchParams }: { searchParams: { page?: string } }) {
    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const { orders, totalPages, currentPage } = await getMyOrders(page, 10);

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                        <Package className="w-3.5 h-3.5" /> Order Control & History
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">My Orders</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Track print production status, view delivery schedules, and download tax invoices.</p>
                </div>
                {orders.length > 0 && (
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search orders..." className="h-10 pl-9 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold" />
                        </div>
                    </div>
                )}
            </header>
            
            {orders.length === 0 ? (
                <Card className="py-24 text-center border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl shadow-none">
                    <CardContent className="flex flex-col items-center justify-center space-y-5">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                            <Package className="h-10 w-10" />
                        </div>
                        <div className="space-y-1 max-w-sm mx-auto">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">No Orders Placed Yet</h3>
                            <p className="text-xs text-slate-500 font-medium">Create your first custom design or upload artwork to launch commercial print production.</p>
                        </div>
                        <Button asChild size="lg" className="rounded-2xl shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs gap-2">
                            <Link href="/products">
                                <Sparkles className="h-4 w-4" />
                                Explore Catalog & Start Customizing
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {orders.map(order => {
                        const isDirectSale = !!order.directSellingProduct;
                        const productName = isDirectSale ? order.directSellingProduct.name : (order.product?.name || 'Custom Product');
                        const subProductName = isDirectSale ? order.directSellingProduct.category : (order.subProduct?.name || 'Custom Specs');
                        const imageSrc = isDirectSale 
                            ? order.directSellingProduct.imageUrls?.[0] 
                            : (order.designUpload?.thumbnailPath 
                                || (order.designUpload?.mimeType?.startsWith('image/') ? order.designUpload.filePath : null)
                                || order.design?.thumbnailUrl);

                        let parsedCustomisation: any = null;
                        try {
                            const raw = (order as any).customisation || order.design?.customisation || order.designUpload?.customisation;
                            parsedCustomisation = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        } catch (e) {}

                        const delivery = parsedCustomisation?.deliveryOption || parsedCustomisation?.priceBreakup?.delivery || {
                            name: 'Standard Delivery',
                            days: order.subProduct?.deliveryDays || '3-5 Days',
                            fee: Number(order.subProduct?.deliveryAmount || 0)
                        };
                        const isExpedited = delivery.id && delivery.id !== 'standard';

                        const totalAmountNum = (order.contestId && order.contest?.payments?.[0])
                            ? parseFloat(order.contest.payments[0].amount)
                            : parseFloat(order.totalAmount || '0');

                        return (
                            <Card key={order.id} className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 group">
                                <CardHeader className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 p-5 md:px-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-base font-black text-slate-900 dark:text-white">Order #{order.id}</CardTitle>
                                                    <span className="text-xs text-slate-400">•</span>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        {format(new Date(order.createdAt), 'PPP')}
                                                    </span>
                                                </div>
                                                <CardDescription className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" /> Placed at {format(new Date(order.createdAt), 'p')}
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Delivery Speed Chip */}
                                            <div className={cn(
                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider",
                                                isExpedited 
                                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" 
                                                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                            )}>
                                                {isExpedited ? <Zap className="w-3 h-3 text-amber-500 animate-pulse" /> : <Truck className="w-3 h-3" />}
                                                <span>{delivery.name} ({delivery.days})</span>
                                            </div>

                                            {/* Status Badge */}
                                            <Badge className={cn(
                                                "capitalize px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                                                order.orderStatus === 'delivered' 
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                                                    : order.orderStatus === 'in_production' || order.orderStatus === 'printing'
                                                    ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
                                                    : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                            )}>
                                                {order.orderStatus.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 md:p-6">
                                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5 min-w-0">
                                            <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner">
                                                {imageSrc ? (
                                                    <Image src={resolveImagePath(imageSrc)} alt="preview" fill className="object-contain p-1" />
                                                ) : (
                                                    <FileText className="h-8 w-8 text-slate-500"/>
                                                )}
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <p className="font-black text-base text-slate-900 dark:text-white truncate">{productName}</p>
                                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{subProductName}</p>
                                                
                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                    <Badge variant="outline" className="text-[10px] font-extrabold bg-slate-50 dark:bg-slate-800/80">
                                                        Qty: {order.quantity} Cards
                                                    </Badge>
                                                    {parsedCustomisation?.pages && (
                                                        <Badge variant="outline" className="text-[10px] font-bold text-slate-500">
                                                            {parsedCustomisation.pages === 2 ? 'Double Sided' : 'Single Sided'}
                                                        </Badge>
                                                    )}
                                                    {parsedCustomisation?.spotUv && (
                                                        <Badge className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                                            Spot UV
                                                        </Badge>
                                                    )}
                                                    {parsedCustomisation?.dieCut?.name && (
                                                        <Badge className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/30">
                                                            {parsedCustomisation.dieCut.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-left sm:text-right shrink-0 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 w-full sm:w-auto">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Paid</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center sm:justify-end">
                                                <IndianRupee className="h-5 w-5 mr-0.5 text-indigo-600 dark:text-indigo-400" />
                                                {totalAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1 mt-0.5">
                                                <ShieldCheck className="w-3 h-3" /> GST Paid • Verified
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="bg-slate-50/40 dark:bg-slate-900/40 p-4 px-5 md:px-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Turnaround: <strong className="text-slate-700 dark:text-slate-300 font-bold">{delivery.days}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 h-9 px-3.5">
                                            <Link href={`/client/orders/${order.id}/invoice`} target="_blank">
                                                <Download className="w-3.5 h-3.5 mr-1.5" /> Tax Invoice (PDF)
                                            </Link>
                                        </Button>
                                        <Button asChild size="sm" className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs h-9 px-4">
                                            <Link href={`/client/orders/${order.id}`}>
                                                Order Details <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                    
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80 mt-4">
                            <p className="text-xs text-slate-500 font-medium">
                                Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                {currentPage > 1 && (
                                    <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs">
                                        <Link href={`/client/orders?page=${currentPage - 1}`}>Previous</Link>
                                    </Button>
                                )}
                                {currentPage < totalPages && (
                                    <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs">
                                        <Link href={`/client/orders?page=${currentPage + 1}`}>Next</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}