import { getAdminOrderDetails, getApprovedPrinters } from "@/app/actions/order-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IndianRupee, User, Package, Truck, CreditCard, Hash, FileText, Download, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { resolveImagePath, cn } from "@/lib/utils";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { Product, DesignElement, Background, Guide, RenderData } from "@/lib/types";
import { PrintPreviewButton } from "./PrintPreviewButton";
import { Button } from "@/components/ui/button";
import { PrinterAssignmentControl } from "./PrinterAssignmentControl";

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

                                    {(() => {
                                        let parsedCustomisation: any = null;
                                        try {
                                            const rawCustomisation = order.design?.customisation || (order as any).customisation;
                                            parsedCustomisation = typeof rawCustomisation === 'string' 
                                                ? JSON.parse(rawCustomisation) 
                                                : rawCustomisation;
                                        } catch (e) {
                                            console.error("Failed to parse customisation data", e);
                                        }

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
                                                                <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                                                    {order.design?.width || order.designUpload?.width} x {order.design?.height || order.designUpload?.height} mm
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Custom shape</span>
                                                                <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                                                    {parsedCustomisation?.dieCut ? `Pattern #${parsedCustomisation.dieCut}` : 'Standard'}
                                                                </span>
                                                            </div>
                                                            
                                                            {parsedCustomisation?.lamination && (
                                                                <div className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                                                    <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">Lamination</span>
                                                                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">Enabled</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Row 2: Financial Breakdown (Full Width) - Compact */}
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-50/30 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                                                        <div className="lg:col-span-8">
                                                            {(() => {
                                                                const breakup = parsedCustomisation?.priceBreakup;
                                                                if (breakup) {
                                                                    const addonsTotal = breakup.addons?.reduce((acc: number, addon: any) => acc + addon.totalAmount, 0) || 0;
                                                                    const standardCost = parseFloat(order.totalAmount) - addonsTotal;
                                                                    
                                                                    return (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between items-center text-[10px]">
                                                                                    <span className="text-slate-500 font-bold uppercase tracking-tight">Standard printing</span>
                                                                                    <span className="text-slate-900 dark:text-white font-black">₹{standardCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                                </div>
                                                                                {breakup.addons?.length > 0 && (
                                                                                    <div className="space-y-1 pl-2 border-l border-primary/20">
                                                                                        {breakup.addons.map((addon: any, idx: number) => (
                                                                                            <div key={idx} className="flex justify-between items-center text-[9px]">
                                                                                                <span className="text-slate-400 font-medium">{addon.name}</span>
                                                                                                <span className="text-primary font-bold">+ ₹{addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col justify-center items-end border-l border-slate-200 dark:border-slate-800 pl-4">
                                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Final amount</span>
                                                                                <div className="flex items-center gap-1">
                                                                                    <IndianRupee className="w-3.5 h-3.5 text-primary" />
                                                                                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                                                        {parseFloat(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[7px] font-bold text-emerald-500 tracking-widest mt-1 uppercase">Taxes & shipping included</p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <div className="lg:col-span-4 flex flex-col gap-2">
                                                            {isDesignOrder && <PrintPreviewButton order={order} />}
                                                            {isUploadOrder && (
                                                                <Button asChild variant="secondary" className="rounded-xl px-4 h-9 text-[10px] font-bold shadow-sm transition-all w-full">
                                                                    <a href={resolveImagePath(order.designUpload.filePath)} download>
                                                                        <Download className="mr-2 h-3.5 w-3.5"/> Download Artifact
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            <Button variant="outline" className="rounded-xl px-4 h-9 text-[10px] font-bold border-slate-200 transition-all w-full">
                                                                <FileText className="mr-2 h-3.5 w-3.5" /> Job Sheet
                                                            </Button>
                                                        </div>
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
                                        { status: 'confirmed', label: 'Order confirmed', icon: ShieldCheck, date: order.createdAt, current: order.orderStatus === 'confirmed', done: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus) },
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
            </div>
        </div>
    )
}
