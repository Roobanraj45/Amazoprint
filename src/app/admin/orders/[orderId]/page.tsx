import { getAdminOrderDetails, getApprovedPrinters } from "@/app/actions/order-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IndianRupee, User, Package, Truck, CreditCard, Hash, FileText, Download, ShieldCheck, Clock, Info, Tag, Receipt } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { resolveImagePath, cn } from "@/lib/utils";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { Product, DesignElement, Background, Guide, RenderData } from "@/lib/types";
import { PrintPreviewButton } from "./PrintPreviewButton";
import { Button } from "@/components/ui/button";
import { PrinterAssignmentControl } from "./PrinterAssignmentControl";
import { OrderStatusControl } from "./OrderStatusControl";

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

export default async function AdminOrderDetailsPage({ params }: { params: { orderId: string } }) {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        notFound();
    }

    const [order, approvedPrinters] = await Promise.all([
        getAdminOrderDetails(orderId),
        getApprovedPrinters()
    ]);

    if (!order) {
        notFound();
    }

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

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            {/* Industrial Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-tight border border-white/10">
                            <Hash className="w-3 h-3 text-primary" />
                            Order Fulfillment Engine
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Order #{order.id}</h1>
                        <p className="text-slate-400 font-medium text-[11px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Initiated on {format(new Date(order.createdAt), 'PPP p')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Payment status</span>
                            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'} className="mt-0.5 px-3 py-0.5 rounded-full font-bold text-[10px]">
                                {order.paymentStatus}
                            </Badge>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-primary text-white shadow-xl shadow-primary/20 flex flex-col items-end">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Workflow stage</span>
                            <span className="text-base font-bold tracking-tight capitalize">{order.orderStatus}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Summary Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Net value', value: `₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-primary' },
                    { label: 'Total units', value: `${order.quantity} Pcs`, icon: Package, color: 'bg-blue-600' },
                    { label: 'Order date', value: format(new Date(order.createdAt), 'MMM dd, yyyy'), icon: CreditCard, color: 'bg-amber-500' },
                    { label: 'Estimated delivery', value: order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'MMM dd, yyyy') : 'TBD', icon: Truck, color: 'bg-emerald-500' },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-md shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-inherit", stat.color)}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-6">
                {/* Item Master Detail - High Fidelity */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8">
                        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group h-full">
                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold tracking-tight">Item Master Detail</CardTitle>
                                            <CardDescription className="text-[11px] font-medium">Production specifications and visual preview</CardDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-600 border-none px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-widest">
                                        {isDesignOrder ? 'Design tool' : isUploadOrder ? 'Direct upload' : 'Direct sale'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="space-y-4">
                                    {/* Product Title Header - Compact */}
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mt-4">
                                        <div className="space-y-0.5">
                                            <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">{productName}</h3>
                                            <p className="text-primary font-bold tracking-tight text-[10px] uppercase">{subProductName}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Quick Order Status Control */}
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Change Order Status</p>
                                        <OrderStatusControl 
                                            orderId={order.id}
                                            currentStatus={order.orderStatus}
                                            currentTrackingNumber={order.trackingNumber}
                                            currentEstimatedDeliveryDate={order.estimatedDeliveryDate}
                                            currentActualDeliveryDate={order.actualDeliveryDate}
                                        />
                                    </div>                                    {(() => {
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

                                        const totalAmountVal = parseFloat(order.totalAmount) || 0;

                                        // GST calculations (18% inclusive)
                                        const gstRate = 0.18;
                                        const taxableAmount = totalAmountVal / (1 + gstRate);
                                        const gstAmount = totalAmountVal - taxableAmount;

                                        return (
                                            <div className="space-y-6">
                                                {/* Row 1: Design (Left) & Project Specs (Right) - Compact */}
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                                    {/* Design Preview Section */}
                                                    <div className="lg:col-span-4 space-y-2">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visual design</p>
                                                        <div className="w-full h-40 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center p-3 relative overflow-hidden group-hover:shadow-inner transition-all duration-500">
                                                            <div className="relative z-10 scale-[1.1] drop-shadow-xl">
                                                                 {designPreviewNode}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Project Specifications Section */}
                                                    <div className="lg:col-span-8 space-y-2">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Project specifications</p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Printing side</span>
                                                                <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                                                    {parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double sided' : 'Single sided'}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Spot UV gloss</span>
                                                                <span className={cn(
                                                                    "font-bold text-[11px]",
                                                                    parsedCustomisation?.spotUv ? "text-amber-600" : "text-slate-400"
                                                                )}>
                                                                    {parsedCustomisation?.spotUv ? 'Added' : 'None'}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Dimensions</span>
                                                                <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase">
                                                                     {parsedCustomisation?.sizeDisplay || (
                                                                         order.design?.width || order.designUpload?.width 
                                                                             ? `${order.design?.width || order.designUpload?.width} x ${order.design?.height || order.designUpload?.height} mm` 
                                                                             : 'Standard'
                                                                     )}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Custom shape</span>
                                                                <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                                                     {parsedCustomisation?.dieCut ? (
                                                                         typeof parsedCustomisation.dieCut === 'object'
                                                                             ? (parsedCustomisation.dieCut.name || parsedCustomisation.dieCut.Name || `Pattern #${parsedCustomisation.dieCut.id || ''}`)
                                                                             : `Pattern #${parsedCustomisation.dieCut}`
                                                                     ) : 'Standard'}
                                                                 </span>
                                                            </div>

                                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Quantity</span>
                                                                <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                                                     {parsedCustomisation?.quantity || order.quantity || '1'} Units
                                                                </span>
                                                            </div>
                                                            
                                                            {parsedCustomisation?.lamination && (
                                                                <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                    <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Lamination</span>
                                                                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">Enabled</span>
                                                                </div>
                                                            )}

                                                            {/* Dynamic Customisations Render */}
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
                                                                    <div key={key} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 capitalize">
                                                                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">{label}</span>
                                                                        <span className="font-bold text-slate-900 dark:text-white text-[11px] truncate" title={displayVal}>{displayVal}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Row 2: Financial Breakdown (Full Width) */}
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Receipt size={11} /> Financial Audit & Breakdown Ledger</p>
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-zinc-900/30 p-6 rounded-[1.5rem] border border-slate-100 dark:border-zinc-800/50">
                                                        {/* Detailed Line Items */}
                                                        <div className="lg:col-span-7 space-y-3">
                                                            <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                                                                <span className="text-slate-500 font-bold">Standard Print Production</span>
                                                                <span className="text-slate-900 dark:text-white font-extrabold">₹{baseSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                            </div>

                                                            {addonsList && addonsList.length > 0 ? (
                                                                <div className="space-y-2 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
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
                                                            ) : null}

                                                            {discount > 0 && (
                                                                <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                                                                    <span className="flex items-center gap-1"><Tag size={12} /> Coupon / Special Discount</span>
                                                                    <span>- ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                            )}

                                                            {/* GST Breakdown */}
                                                            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                                                                <span>Inclusive Tax Breakdown (18% GST)</span>
                                                                <span className="font-bold">
                                                                    ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Taxable) + ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (GST)
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center text-xs text-slate-500">
                                                                <span>Shipping & Logistics Cost</span>
                                                                <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wider">Free Express</span>
                                                            </div>
                                                        </div>

                                                        {/* Total Receipt Summary */}
                                                        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-slate-100/50 dark:bg-zinc-800/20 border border-slate-200/50 dark:border-zinc-800/40">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total amount</span>
                                                                    <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'} className="rounded-md text-[9px] font-black uppercase px-2 py-0.5 tracking-tighter">
                                                                        {order.paymentStatus}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <IndianRupee className="w-5 h-5 text-primary" />
                                                                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                                                        {totalAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                                                                {/* Payment Gateway Audit Details */}
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gateway Reconciliation</p>
                                                                {order.payment ? (
                                                                    <div className="text-[10px] font-medium text-slate-500 space-y-1.5">
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
                                                                                {order.payment.createdAt ? format(new Date(order.payment.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 italic">No verified online transaction record found.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                     </div>

                                                     {/* Actions row */}
                                                     <div className="flex flex-wrap items-center gap-3">
                                                         <div className="flex-1 min-w-[200px]">
                                                             {isDesignOrder && <PrintPreviewButton order={order} />}
                                                             {isUploadOrder && (
                                                                 <Button asChild variant="secondary" className="rounded-xl px-4 h-10 text-xs font-bold shadow-sm transition-all w-full">
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
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Lifecycle Timeline */}
                    <div className="xl:col-span-4">
                        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden h-full">
                            <CardHeader className="p-6 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Hash size={16} />
                                    </div>
                                    <CardTitle className="text-lg font-bold tracking-tight">Order Lifecycle</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                    {[
                                        { status: 'pending', label: 'Order initiated', icon: FileText, date: order.createdAt, current: order.orderStatus === 'pending', done: true },
                                        { status: 'confirmed', label: 'Order confirmed', icon: ShieldCheck, date: order.createdAt, current: order.orderStatus === 'confirmed', done: ['confirmed', 'quality_check', 'processing', 'shipped', 'delivered'].includes(order.orderStatus) },
                                        { status: 'quality_check', label: 'Quality Check', icon: ShieldCheck, date: null, current: order.orderStatus === 'quality_check', done: ['quality_check', 'processing', 'shipped', 'delivered'].includes(order.orderStatus) },
                                        { status: 'processing', label: 'In production', icon: Package, date: null, current: order.orderStatus === 'processing', done: ['processing', 'shipped', 'delivered'].includes(order.orderStatus) },
                                        { status: 'shipped', label: 'Dispatched', icon: Truck, date: null, current: order.orderStatus === 'shipped', done: ['shipped', 'delivered'].includes(order.orderStatus) },
                                        { status: 'delivered', label: 'Delivered', icon: User, date: order.actualDeliveryDate, current: order.orderStatus === 'delivered', done: order.orderStatus === 'delivered' },
                                    ].map((step, i) => (
                                        <div key={i} className="relative group">
                                            <div className={cn(
                                                "absolute -left-[37px] top-0 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 z-10 transition-all duration-500",
                                                step.done ? "bg-primary" : "bg-slate-200 dark:bg-slate-800",
                                                step.current && "scale-110 ring-4 ring-primary/20"
                                            )} />
                                            <div className="space-y-1">
                                                <p className={cn("text-[13px] font-black tracking-tight", step.done ? "text-slate-900 dark:text-white" : "text-slate-400")}>{step.label}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {step.date ? format(new Date(step.date), 'MMM dd, hh:mm a') : 'Awaiting stage'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Delivery</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                {order.estimatedDeliveryDate ? format(new Date(order.estimatedDeliveryDate), 'PPP') : 'TBD'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tracking</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {order.trackingNumber || 'Not assigned'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Secondary Intelligence Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Customer Identity */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group hover:bg-slate-950 transition-all duration-500">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-white/10 group-hover:text-white transition-colors">
                                    <User size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight group-hover:text-white transition-colors">Customer Identity</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-2">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-lg group-hover:scale-105 transition-transform">
                                        <AvatarFallback className="bg-primary text-white text-base font-black">{order.user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="font-black text-base tracking-tighter text-slate-900 dark:text-white group-hover:text-white transition-colors leading-none">{order.user.name}</p>
                                        <p className="text-[10px] font-bold text-primary transition-colors">{order.user.email}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 group-hover:border-white/10 space-y-3">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-slate-400 group-hover:text-slate-500 uppercase tracking-widest">Contact</span>
                                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-white transition-colors">{order.user.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operational Guard */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <ShieldCheck size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight">Operational Guard</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                    <Badge className="bg-primary hover:bg-primary rounded-lg font-black text-[9px] py-0.5 px-3 tracking-tighter uppercase">{order.orderStatus}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Internal ID</span>
                                    <span className="font-black text-slate-900 dark:text-white text-[11px]">#INT-{order.id.toString().padStart(6, '0')}</span>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <PrinterAssignmentControl 
                                        orderId={order.id} 
                                        currentPrinterId={order.printerAssigned} 
                                        printers={approvedPrinters as any} 
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logistics Nexus */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden lg:col-span-2">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                    <Truck size={16} />
                                </div>
                                <CardTitle className="text-base font-bold tracking-tight">Logistics Nexus</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Shipping</span>
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                                        <p className="font-black text-slate-900 dark:text-white text-[13px]">{shippingAddress.name}</p>
                                        <div className="text-[11px] font-bold text-slate-500 leading-tight">
                                            <p>{shippingAddress.addressLine1}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Billing</span>
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                                        <p className="font-black text-slate-900 dark:text-white text-[13px]">{billingAddress.name}</p>
                                        <div className="text-[11px] font-bold text-slate-500 leading-tight">
                                            <p>{billingAddress.addressLine1}, {billingAddress.city}, {billingAddress.state} {billingAddress.zip}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Internal Notes & Special Instructions */}
                {(order.notes || order.specialInstructions) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {order.specialInstructions && (
                            <Card className="border-none shadow-xl shadow-amber-200/20 dark:shadow-none bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] overflow-hidden border-l-4 border-amber-400">
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-600 flex items-center justify-center">
                                            <FileText size={16} />
                                        </div>
                                        <CardTitle className="text-base font-bold tracking-tight text-amber-900 dark:text-amber-400">Special Instructions</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-2">
                                    <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-amber-100 dark:border-amber-900/30">
                                        <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 leading-relaxed italic">
                                            "{order.specialInstructions}"
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {order.notes && (
                            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border-l-4 border-slate-300">
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                            <Hash size={16} />
                                        </div>
                                        <CardTitle className="text-base font-bold tracking-tight">Internal Fulfillment Notes</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-2">
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                                        {order.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* System Audit Logs & History Trail */}
                {order.logs && order.logs.length > 0 && (
                    <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight">System Audit Logs & Operational History</CardTitle>
                                    <CardDescription className="text-[11px] font-medium font-sans">Chronological timeline of system actions and workflow state transitions</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="relative space-y-6 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100 dark:before:bg-slate-800">
                                {order.logs.map((log: any) => (
                                    <div key={log.id} className="relative group text-xs">
                                        <div className="absolute -left-[28.5px] top-1 w-2.5 h-2.5 rounded-full border bg-indigo-500 border-white dark:border-slate-900 z-10" />
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge className="font-extrabold text-[9px] uppercase tracking-wide bg-slate-100 hover:bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-none px-2 py-0.5 rounded-md">
                                                    {log.actionType.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm:ss a')}
                                                </span>
                                                {log.performedByRole && (
                                                    <span className="text-[9px] font-extrabold text-violet-600 bg-violet-600/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                        By {log.performedByRole.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                                {!log.isCustomerVisible && (
                                                    <span className="text-[9px] font-extrabold text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                        Internal Only
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{log.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
