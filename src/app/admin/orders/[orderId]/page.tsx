import { getAdminOrderDetails, getApprovedPrinters } from "@/app/actions/order-actions";
import { getActiveFreelancers } from "@/app/actions/verification-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
    IndianRupee, User, Package, Truck, CreditCard, Hash, FileText, 
    Download, ShieldCheck, Clock, Tag, Receipt, Mail, Phone, MapPin, Factory, Trophy, Sparkles 
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from 'next/image';
import { resolveImagePath, cn } from "@/lib/utils";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { Product, DesignElement, Background } from "@/lib/types";
import { PrintPreviewButton } from "./PrintPreviewButton";
import { Button } from "@/components/ui/button";
import { PrinterAssignmentControl } from "./PrinterAssignmentControl";
import { FreelancerVerificationControl } from "./FreelancerVerificationControl";
import { OrderStatusControl } from "./OrderStatusControl";
import { PrintVerificationReview } from "./PrintVerificationReview";

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

export default async function AdminOrderDetailsPage({ params }: { params: { orderId: string } }) {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        notFound();
    }

    const [order, approvedPrinters, activeFreelancers] = await Promise.all([
        getAdminOrderDetails(orderId),
        getApprovedPrinters(),
        getActiveFreelancers()
    ]);

    if (!order) {
        notFound();
    }

    const totalPrinterPaid = (order as any).printerPayments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
    const remainingPrinterBalance = (parseFloat(order.printingAmount) || 0) - totalPrinterPaid;

    const isDirectSale = !!order.directSellingProduct;
    const isDesignOrder = !!order.design;
    const isUploadOrder = !!order.designUpload;

    const productName = isDirectSale ? order.directSellingProduct.name : (order.product?.name || 'Custom Product');
    const subProductName = isDirectSale ? order.directSellingProduct.category : (order.subProduct?.name || 'Custom Size');
    
    const shippingAddress = order.shippingAddress as any;
    const billingAddress = order.billingAddress as any || shippingAddress;

    let designPreviewNode: React.ReactNode = <FileText className="h-16 w-16 text-muted-foreground"/>;
    if (isDesignOrder) {
        const design = order.design;
        const widthInPx = Math.round(design.width * MM_TO_PX);
        const heightInPx = Math.round(design.height * MM_TO_PX);

        const productForCanvas: Product = {
            id: design.productSlug, name: design.name, description: '', imageId: '',
            width: widthInPx, height: heightInPx, type: '',
        };
        const elements: DesignElement[] = (Array.isArray(design.elements) && Array.isArray(design.elements[0])) ? design.elements[0] as DesignElement[] : design.elements as DesignElement[];
        const background: Background = (Array.isArray(design.background)) ? design.background[0] as Background : design.background as Background;

        const previewScale = 192 / widthInPx;

        designPreviewNode = (
            <div style={{ width: 192, height: heightInPx * previewScale, overflow: 'hidden' }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx }}>
                    <DesignCanvas
                        product={productForCanvas}
                        elements={elements}
                        background={background}
                        showRulers={false} showGrid={false} gridSize={20} guides={[]}
                        showPrintGuidelines={false} bleed={0} safetyMargin={0}
                        viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                    />
                </div>
            </div>
        )
    } else if (isUploadOrder) {
        const imageSrc = order.designUpload.thumbnailPath || (order.designUpload.mimeType?.startsWith('image/') ? order.designUpload.filePath : null);
        designPreviewNode = imageSrc ? <Image src={resolveImagePath(imageSrc)} alt="upload preview" layout="fill" className="object-contain" /> : <FileText className="h-16 w-16 text-muted-foreground"/>;
    } else if (isDirectSale) {
        const imageSrc = order.directSellingProduct.imageUrls?.[0];
        designPreviewNode = imageSrc ? <Image src={resolveImagePath(imageSrc)} alt="product image" layout="fill" className="object-cover" /> : <FileText className="h-16 w-16 text-muted-foreground"/>;
    }

    // Parse customisation
    let parsedCustomisation: any = null;
    try {
        const rawCustomisation = order.design?.customisation || (order as any).customisation;
        parsedCustomisation = typeof rawCustomisation === 'string' 
            ? JSON.parse(rawCustomisation) 
            : rawCustomisation;
    } catch (e) {
        console.error("Failed to parse customisation data", e);
    }

    const formatSpecValue = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
            if (Array.isArray(val)) {
                return val.map((item: any) => {
                    if (typeof item === 'object') {
                        return item.name || item.Name || JSON.stringify(item);
                    }
                    return String(item);
                }).join(', ');
            }
            return val.name || val.Name || JSON.stringify(val);
        }
        return String(val);
    };

    // Standardise addons and base printing cost
    let addonsList: any[] = [];
    let baseSubtotal = 0;
    let discount = 0;

    const breakup = parsedCustomisation?.priceBreakup;
    if (breakup) {
        addonsList = breakup.addons || [];
        discount = parseFloat(breakup.discount || 0);
        const addonsTotal = addonsList.reduce((acc: number, addon: any) => acc + parseFloat(addon.totalAmount || addon.amount || 0), 0);
        baseSubtotal = (parseFloat(order.totalAmount) || 0) - addonsTotal + discount;
    } else if (parsedCustomisation?.specsBreakdown) {
        addonsList = parsedCustomisation.specsBreakdown || [];
        baseSubtotal = parseFloat(parsedCustomisation.printBaseCost) || 0;
        discount = parseFloat(parsedCustomisation.discount) || 0;
    } else {
        baseSubtotal = parseFloat(order.totalAmount) || 0;
    }

    let totalAmountVal = parseFloat(order.totalAmount) || 0;
    if (totalAmountVal === 0 && order.contestId && order.payment?.amount) {
        totalAmountVal = parseFloat(order.payment.amount);
    }

    if (baseSubtotal === 0 && order.contestId && order.payment?.amount) {
        baseSubtotal = parseFloat(order.payment.amount);
    }

    const gstRate = 0.18;
    const taxableAmount = totalAmountVal / (1 + gstRate);
    const gstAmount = totalAmountVal - taxableAmount;

    return (
        <div className="space-y-6 pb-20 max-w-[1600px] mx-auto p-2 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-tight border border-white/10">
                            <Hash className="w-3 h-3 text-primary animate-pulse" />
                            Order Control Center
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Order #{order.id}</h1>
                        <p className="text-slate-400 font-medium text-[11px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Placed on {format(new Date(order.createdAt), 'PPP p')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Payment status</span>
                            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'} className="mt-0.5 px-3 py-0.5 rounded-full font-bold text-[10px] uppercase">
                                {order.paymentStatus}
                            </Badge>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-primary text-white shadow-xl shadow-primary/20 flex flex-col items-end">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Fulfillment Stage</span>
                            <span className="text-sm font-bold tracking-tight capitalize mt-0.5">{order.orderStatus.replace(/_/g, ' ')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning if printer has not responded in 6 hours */}
            {order.orderStatus === 'pending' && order.printerAssigned && order.printerAssignedAt && (
                (() => {
                    const elapsed = Date.now() - new Date(order.printerAssignedAt).getTime();
                    const hoursElapsed = elapsed / (1000 * 60 * 60);
                    if (hoursElapsed > 6) {
                        return (
                            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl">
                                <Clock className="w-5 h-5 text-amber-500" />
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider">No response from printer</h4>
                                    <p className="text-[10px] font-medium text-amber-500/90 mt-0.5">
                                        It has been {Math.floor(hoursElapsed)} hours since this job was assigned to the printer. Action is overdue.
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Order Total', value: `₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20' },
                    { label: 'Total Units', value: `${order.quantity} Units`, icon: Package, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                    { label: 'Printer Cost', value: `₹${parseFloat(order.printingAmount || '0').toLocaleString('en-IN')}`, icon: Receipt, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' },
                    { label: 'Delivery Target', value: order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'MMM dd, yyyy') : 'TBD', icon: Truck, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                ].map((stat, i) => (
                    <Card key={i} className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold", stat.color)}>
                                <stat.icon size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Restructured Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (8/12 widths) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Visual Blueprint & Specs */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold tracking-tight">Production Specifications</CardTitle>
                                        <CardDescription className="text-[11px] font-medium">Verify standard print options and blueprint mockup</CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-none px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider">
                                    {isDesignOrder ? 'Design tool' : isUploadOrder ? 'Direct upload' : 'Direct sale'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Flex Row: mockup side-by-side with detail grid */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                    <div className="md:col-span-4 space-y-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Design Mockup</span>
                                        <div className="w-full h-40 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center justify-center p-3 relative overflow-hidden">
                                            <div className="relative z-10 scale-[1.05] drop-shadow-lg">
                                                {designPreviewNode}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-8 space-y-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Attributes Grid</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Printing side</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                                                    {parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double sided' : 'Single sided'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Spot UV gloss</span>
                                                <span className={cn("font-bold text-[11px]", parsedCustomisation?.spotUv ? "text-amber-600" : "text-slate-400")}>
                                                    {parsedCustomisation?.spotUv ? 'Added' : 'None'}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Dimensions</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase">
                                                     {parsedCustomisation?.sizeDisplay || (
                                                         order.design?.width || order.designUpload?.width 
                                                             ? `${order.design?.width || order.designUpload?.width} x ${order.design?.height || order.designUpload?.height} mm` 
                                                             : 'Standard'
                                                     )}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Custom shape</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                                                     {parsedCustomisation?.dieCut ? (
                                                         typeof parsedCustomisation.dieCut === 'object'
                                                             ? (parsedCustomisation.dieCut.name || parsedCustomisation.dieCut.Name || `Pattern #${parsedCustomisation.dieCut.id || ''}`)
                                                             : `Pattern #${parsedCustomisation.dieCut}`
                                                     ) : 'Standard'}
                                                 </span>
                                            </div>

                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Quantity</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                                                     {parsedCustomisation?.quantity || order.quantity || '1'} Units
                                                </span>
                                            </div>

                                            {parsedCustomisation?.lamination && (
                                                <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
                                                    <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Lamination</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Enabled</span>
                                                </div>
                                            )}

                                            {parsedCustomisation && Object.entries(parsedCustomisation).map(([key, val]) => {
                                                if (['pages', 'spotUv', 'dieCut', 'lamination', 'priceBreakup', 'pricing', 'addons', 'specsBreakdown', 'specsCost', 'printBaseCost', 'sizeDisplay', 'quantity'].includes(key)) return null;
                                                if (val === null || val === undefined || val === '') return null;
                                                
                                                const displayVal = formatSpecValue(val);
                                                if (!displayVal) return null;

                                                const label = key
                                                    .replace(/([A-Z])/g, ' $1')
                                                    .replace(/_/g, ' ')
                                                    .trim();

                                                return (
                                                    <div key={key} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 capitalize">
                                                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider text-ellipsis overflow-hidden whitespace-nowrap">{label}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate" title={displayVal}>{displayVal}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Download Layout Buttons */}
                                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                     <div className="flex-1 min-w-[200px]">
                                         {isDesignOrder && <PrintPreviewButton order={order} />}
                                         {isUploadOrder && (
                                             <Button asChild variant="secondary" className="rounded-xl px-4 h-10 text-xs font-bold transition-all w-full">
                                                 <a href={resolveImagePath(order.designUpload.filePath)} download>
                                                     <Download className="mr-2 h-4 w-4"/> Download Original Design File
                                                 </a>
                                             </Button>
                                         )}
                                     </div>
                                     <Button variant="outline" className="rounded-xl px-4 h-10 text-xs font-bold border-slate-200 transition-all">
                                         <FileText className="mr-2 h-4 w-4" /> Export Job Sheet
                                     </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Breakdown Ledger */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <Receipt size={16} />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight">Financial Audit & Breakdown</CardTitle>
                                    <CardDescription className="text-[11px] font-medium">Reconcile transaction gateway items and customization billing</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Left side: detailed calculations */}
                                <div className="md:col-span-7 space-y-3">
                                    <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-zinc-800 pb-2">
                                        <span className="text-slate-500 font-bold">{order.contestId ? "Prepaid Contest Prize Pool" : "Standard Print Production"}</span>
                                        <span className="text-slate-900 dark:text-white font-extrabold">₹{baseSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {order.contestId && (
                                        <div className="flex justify-between items-center text-xs text-indigo-600 dark:text-indigo-400 font-bold border-b border-slate-100 dark:border-zinc-800 pb-2">
                                            <span className="flex items-center gap-1"><Trophy size={12} /> Contest Campaign Payout</span>
                                            <span>Prepaid</span>
                                        </div>
                                    )}

                                    {addonsList && addonsList.length > 0 && (
                                        <div className="space-y-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Premium Customization Add-ons</p>
                                            {addonsList.map((addon: any, idx: number) => {
                                                const addonName = addon.name || addon.Name || 'Custom Addon';
                                                const addonAmount = parseFloat(addon.totalAmount || addon.amount || 0);
                                                return (
                                                    <div key={idx} className="flex justify-between items-center text-xs pl-2 border-l-2 border-primary/40">
                                                        <span className="text-slate-500 font-medium">{addonName}</span>
                                                        <span className="text-slate-900 dark:text-white font-bold">+ ₹{addonAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {discount > 0 && (
                                        <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold border-b border-slate-100 dark:border-zinc-800 pb-2">
                                            <span className="flex items-center gap-1"><Tag size={12} /> Coupon / Special Discount</span>
                                            <span>- ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 dark:border-zinc-800 pb-2">
                                        <span>Tax Base (18% GST Inclusive)</span>
                                        <span className="font-bold">
                                            ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 dark:border-zinc-800 pb-2">
                                        <span>Inclusive GST Amount</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Shipping & Logistics Cost</span>
                                        <span className="text-emerald-600 font-bold uppercase text-[9px] tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">Free Express</span>
                                    </div>

                                    {order.printerAssigned && (
                                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                                            <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Printer Payout Settlement</p>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">Printer Cost (Total Payout):</span>
                                                <span className="text-slate-900 dark:text-white font-bold">₹{parseFloat(order.printingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">Paid to Printer:</span>
                                                <span className="text-emerald-600 dark:text-emerald-405 font-extrabold">₹{totalPrinterPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">Outstanding Printer Balance:</span>
                                                <span className="text-amber-600 dark:text-amber-500 font-extrabold">₹{remainingPrinterBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right side: summary and gateway details */}
                                <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/10 border border-slate-100 dark:border-zinc-800/40 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Settled</span>
                                        <div className="flex items-baseline gap-1">
                                            <IndianRupee size={16} className="text-slate-800 dark:text-slate-200 font-bold" />
                                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {totalAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gateway Settlement</p>
                                        {order.payment ? (
                                            <div className="text-[10px] font-medium text-slate-500 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Provider:</span>
                                                    <span className="font-extrabold uppercase text-slate-700 dark:text-slate-300">{order.payment.provider}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Transaction ID:</span>
                                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold select-all">{order.payment.providerPaymentId || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Settled On:</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                                        {order.payment.createdAt ? format(new Date(order.payment.createdAt), 'dd MMM yyyy') : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 italic">No online payment record linked.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline logs */}
                    {order.logs && order.logs.length > 0 && (
                        <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                            <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold tracking-tight">System Audit History</CardTitle>
                                        <CardDescription className="text-[11px] font-medium">Detailed audit trail of state changes and events</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="relative space-y-5 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100 dark:before:bg-slate-800">
                                    {order.logs.map((log: any) => (
                                        <div key={log.id} className="relative text-xs">
                                            <div className="absolute -left-[28.5px] top-1.5 w-2.5 h-2.5 rounded-full border bg-indigo-500 border-white dark:border-slate-900 z-10" />
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge className="font-extrabold text-[8px] uppercase tracking-wide bg-slate-100 hover:bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-none px-2 py-0.5 rounded-md">
                                                        {log.actionType.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {format(new Date(log.createdAt), 'dd MMM, hh:mm a')}
                                                    </span>
                                                    {log.performedByRole && (
                                                        <span className="text-[8px] font-extrabold text-violet-600 bg-violet-600/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            {log.performedByRole}
                                                        </span>
                                                    )}
                                                    {!log.isCustomerVisible && (
                                                        <span className="text-[8px] font-extrabold text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            Internal
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{log.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column (4/12 widths) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Print Quality Verification Panel */}
                    {order.verificationFileUrl && (
                        <PrintVerificationReview
                            orderId={order.id}
                            verificationFileUrl={order.verificationFileUrl}
                            verificationFileStatus={(order as any).verificationFileStatus || 'pending'}
                            verificationRejectedReason={(order as any).verificationRejectedReason}
                            orderStatus={order.orderStatus}
                        />
                    )}

                    {/* Operational Guard & Status Picker */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <ShieldCheck size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight">Order Lifecycle & Status</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Dropdown status update */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                                <OrderStatusControl 
                                    orderId={order.id}
                                    currentStatus={order.orderStatus}
                                    currentTrackingNumber={order.trackingNumber}
                                    currentEstimatedDeliveryDate={order.estimatedDeliveryDate}
                                    currentActualDeliveryDate={order.actualDeliveryDate}
                                />
                            </div>

                            {/* Design Verification Status */}
                            {(() => {
                                const dvs = (order as any).designVerifications || [];
                                const latest = dvs[0]; // designVerifications are ordered desc by createdAt
                                
                                if (dvs.length === 0) return null;
                                
                                return (
                                    <div className="p-4 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/5 border border-indigo-100/50 dark:border-indigo-950/20 flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Design Verification</span>
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                                                latest.status === 'completed' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                                latest.status === 'assigned' && "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                                                latest.status === 'pending' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                                latest.status === 'cancelled' && "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                            )}>
                                                {latest.status}
                                            </Badge>
                                        </div>
                                        {latest.freelancer && (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                                                <span className="text-[9px] text-slate-450 uppercase tracking-wider">Assigned:</span>
                                                <span>{latest.freelancer.name}</span>
                                            </div>
                                        )}
                                        {latest.status === 'completed' && latest.freelancerFeedback && (
                                            <div className="text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800/40 pt-2 italic leading-relaxed">
                                                "{latest.freelancerFeedback}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Timeline progression tracker */}
                            <div className="relative space-y-5 pl-7 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                {[
                                    { status: 'pending', label: 'Order Initiated', date: order.createdAt, done: true },
                                    { status: 'confirmed', label: 'Order Confirmed', date: order.createdAt, done: ['confirmed', 'quality_check', 'processing', 'shipped', 'delivered'].includes(order.orderStatus) },
                                    { status: 'quality_check', label: 'Quality Check', date: null, done: ['quality_check', 'processing', 'shipped', 'delivered'].includes(order.orderStatus) },
                                    { status: 'processing', label: 'In Production', date: null, done: ['processing', 'shipped', 'delivered'].includes(order.orderStatus) },
                                    { status: 'shipped', label: 'Dispatched / Shipped', date: null, done: ['shipped', 'delivered'].includes(order.orderStatus) },
                                    { status: 'delivered', label: 'Delivered', date: order.actualDeliveryDate, done: order.orderStatus === 'delivered' },
                                ].map((step, i) => {
                                    const isCurrent = order.orderStatus === step.status;
                                    return (
                                        <div key={i} className="relative text-xs">
                                            <div className={cn(
                                                "absolute -left-[32.5px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-all duration-300",
                                                step.done ? "bg-primary" : "bg-slate-200 dark:bg-slate-800",
                                                isCurrent && "ring-4 ring-primary/20 scale-110"
                                            )} />
                                            <div className="space-y-0.5">
                                                <p className={cn("font-bold tracking-tight", step.done ? "text-slate-800 dark:text-slate-200" : "text-slate-400")}>
                                                    {step.label}
                                                </p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {step.date ? format(new Date(step.date), 'MMM dd, hh:mm a') : isCurrent ? 'Active Stage' : 'Awaiting stage'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Printer Assignment & cost payout */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <Factory size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight">Press Partner Assignment</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <PrinterAssignmentControl 
                                orderId={order.id} 
                                currentPrinterId={order.printerAssigned} 
                                currentPrintingAmount={order.printingAmount}
                                printers={approvedPrinters as any} 
                                printerPayments={(order as any).printerPayments}
                            />
                        </CardContent>
                    </Card>

                    {/* Freelancer Design Verification */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <Sparkles size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight">Design Verification Assignment</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <FreelancerVerificationControl 
                                orderId={order.id}
                                freelancers={activeFreelancers}
                                existingVerifications={(order as any).designVerifications || []}
                            />
                        </CardContent>
                    </Card>

                    {/* Customer Identity */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                    <User size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight">Customer Identity</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 text-xs">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <AvatarFallback className="bg-primary text-white text-sm font-black">
                                            {order.user.name?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="font-black text-slate-800 dark:text-slate-150 leading-none">{order.user.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                            <Mail size={11} className="text-slate-400" /> {order.user.email}
                                        </p>
                                        {order.user.phone && (
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                <Phone size={11} className="text-slate-400" /> {order.user.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logistics Nexus (Shipping and Billing) */}
                    <Card className="border border-slate-200/60 dark:border-slate-800/80 shadow-md bg-gradient-to-b from-white to-slate-50/20 dark:from-slate-900 dark:to-slate-950/20 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                                    <Truck size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight">Logistics Nexus</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 text-xs">
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Shipping Address</span>
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50 space-y-0.5">
                                    <p className="font-black text-slate-800 dark:text-slate-200">{shippingAddress.name}</p>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        {shippingAddress.addressLine1}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Billing Address</span>
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800/50 space-y-0.5">
                                    <p className="font-black text-slate-800 dark:text-slate-200">{billingAddress.name}</p>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        {billingAddress.addressLine1}, {billingAddress.city}, {billingAddress.state} {billingAddress.zip}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes & Instructions */}
                    {(order.notes || order.specialInstructions) && (
                        <div className="space-y-6">
                            {order.specialInstructions && (
                                <Card className="border-none shadow-sm bg-amber-50/50 dark:bg-amber-950/10 rounded-[2rem] overflow-hidden border-l-4 border-amber-400">
                                    <CardHeader className="p-5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-600 flex items-center justify-center">
                                                <Info size={14} />
                                            </div>
                                            <CardTitle className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-400">Special Instructions</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0">
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-relaxed italic">
                                            "{order.specialInstructions}"
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                            {order.notes && (
                                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border-l-4 border-slate-300">
                                    <CardHeader className="p-5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                                                <FileText size={14} />
                                            </div>
                                            <CardTitle className="text-xs font-bold text-slate-700">Internal fulfillment notes</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0">
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                            {order.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                </div>

            </div>
        </div>
    )
}
