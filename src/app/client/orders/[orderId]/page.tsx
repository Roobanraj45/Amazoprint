import { getMyOrderDetails } from "@/app/actions/order-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IndianRupee, Package, Truck, CreditCard, Hash, FileText, Download, ArrowLeft, History, Clock, CheckCircle2, Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import Image from 'next/image';
import { resolveImagePath, cn } from "@/lib/utils";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { Product, DesignElement, Background } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

export default async function ClientOrderDetailsPage({ params }: { params: { orderId: string } }) {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        notFound();
    }

    const order = await getMyOrderDetails(orderId);

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

    const designVerifications = (order as any).designVerifications || [];
    const activeDV = designVerifications.find((v: any) => v.status === 'assigned' || v.status === 'pending');
    const completedDVs = designVerifications.filter((v: any) => v.status === 'completed');

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
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/client/orders">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order #{order.id}</h1>
                    <p className="text-muted-foreground">
                        Placed on {format(new Date(order.createdAt), 'PPP p')}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button asChild variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-sm">
                        <Link href={`/client/orders/${order.id}/invoice`} target="_blank">
                            <Download className="w-4 h-4 mr-2" /> Download Invoice (PDF)
                        </Link>
                    </Button>
                    <Badge variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} className="capitalize text-base px-4 py-1">
                        {order.orderStatus}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Order Item Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="w-full md:w-48 h-48 bg-muted rounded-md flex items-center justify-center flex-shrink-0 p-2 relative overflow-hidden">
                                    {designPreviewNode}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="font-semibold text-lg">{productName}</p>
                                        <p className="text-muted-foreground">{subProductName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Quantity</p>
                                            <p className="font-medium">{order.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Unit Price</p>
                                            <p className="font-medium flex items-center"><IndianRupee size={12} className="mr-0.5" />{parseFloat(order.unitPrice).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-muted-foreground">Total Amount</p>
                                            <p className="font-bold text-lg flex items-center"><IndianRupee size={16} className="mr-0.5" />{parseFloat(order.totalAmount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                                        </div>
                                    </div>

                                    {(() => {
                                        const customisation = (order as any).customisation || order.design?.customisation;
                                        const breakup = customisation?.priceBreakup;
                                        if (breakup) {
                                            const addonsTotal = breakup.addons?.reduce((acc: number, addon: any) => acc + addon.totalAmount, 0) || 0;
                                            const standardCost = parseFloat(order.totalAmount) - addonsTotal + (breakup.discount || 0);
                                            
                                            return (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Command</p>
                                                    <div className="bg-slate-50/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-500 font-bold uppercase tracking-tight">Standard Printing</span>
                                                                <span className="text-slate-900 dark:text-white font-black">₹{standardCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                            
                                                            {breakup.addons?.length > 0 && (
                                                                <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                                                                    {breakup.addons.map((addon: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between items-center text-[11px]">
                                                                            <span className="text-slate-400 font-medium">{addon.name}</span>
                                                                            <span className="text-primary font-bold">+ ₹{addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {breakup.discount > 0 && (
                                                                <div className="flex justify-between items-center text-xs text-emerald-600 font-bold pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                                                                    <span>Discount {breakup.description ? `(${breakup.description})` : ''}</span>
                                                                    <span>- ₹{breakup.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Net Payable</span>
                                                                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Incl. Taxes & Shipping</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <IndianRupee className="w-4 h-4 text-primary" />
                                                                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                                        {parseFloat(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <div className="pt-4 border-t flex flex-wrap gap-3">
                                        {isDesignOrder && (
                                            <Button asChild variant={!['completed', 'delivered', 'cancelled'].includes(order.orderStatus) ? 'outline' : 'secondary'}>
                                                <Link 
                                                    href={`/design/${order.design.productSlug}?templateId=${order.design.id}${!['completed', 'delivered', 'cancelled'].includes(order.orderStatus) ? '&readonly=true' : ''}`} 
                                                    target="_blank"
                                                >
                                                    {!['completed', 'delivered', 'cancelled'].includes(order.orderStatus) ? (
                                                        <><Lock className="mr-2 h-4 w-4 text-amber-500"/> View Design (Locked)</>
                                                    ) : (
                                                        <><FileText className="mr-2 h-4 w-4"/> View & Edit Design</>
                                                    )}
                                                </Link>
                                            </Button>
                                        )}
                                        {isUploadOrder && (
                                            <Button asChild variant="secondary">
                                                <a href={resolveImagePath(order.designUpload.filePath)} download>
                                                    <Download className="mr-2 h-4 w-4"/> Download Your File
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Shipping Address</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-1 text-muted-foreground">
                                <p className="font-semibold text-foreground">{shippingAddress.name}</p>
                                <p>{shippingAddress.addressLine1}</p>
                                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                                <p>{shippingAddress.country}</p>
                                <p>Phone: {shippingAddress.phone}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Billing Address</CardTitle>
                            </CardHeader>
                             <CardContent className="text-sm space-y-1 text-muted-foreground">
                                <p className="font-semibold text-foreground">{billingAddress.name}</p>
                                <p>{billingAddress.addressLine1}</p>
                                {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                                <p>{billingAddress.city}, {billingAddress.state} {billingAddress.zip}</p>
                                <p>{billingAddress.country}</p>
                                <p>Phone: {billingAddress.phone}</p>
                            </CardContent>
                        </Card>
                     </div>
                </div>
                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary" /> Payment & Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                             <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Status</span>
                                <Badge variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} className="rounded-lg font-black text-[9px] py-0.5 px-3 tracking-tighter uppercase">{order.orderStatus}</Badge>
                            </div>
                            
                            <div className="space-y-3 px-1">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-tight">Payment Status</span>
                                    <span className={cn("font-black uppercase tracking-tighter", order.paymentStatus === 'paid' ? "text-emerald-500" : "text-amber-500")}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-tight">Method / Provider</span>
                                    <span className="text-slate-900 dark:text-white font-black">
                                        {(order as any).payment?.provider?.toUpperCase() || 'OFFLINE'} / {order.paymentMethod}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-tight">Transaction ID</span>
                                    <span className="text-slate-900 dark:text-white font-mono font-bold text-[10px]">
                                        {(order as any).payment?.providerPaymentId || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-400 font-bold uppercase tracking-tight">Tracking</span>
                                    <span className="text-blue-600 font-black">
                                        {order.trackingNumber || 'PROVISIONING'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {designVerifications.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Design Verification</CardTitle>
                                <CardDescription className="text-xs">Professional review of your design files</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {activeDV && (
                                    <div className={cn(
                                        "p-3.5 rounded-xl border text-xs flex flex-col gap-2.5",
                                        activeDV.status === 'assigned' 
                                            ? "bg-indigo-50/40 dark:bg-indigo-950/15 border-indigo-100 dark:border-indigo-900/30 text-indigo-850 dark:text-indigo-400"
                                            : "bg-amber-50/40 dark:bg-amber-950/15 border-amber-100 dark:border-amber-900/30 text-amber-850 dark:text-amber-400"
                                    )}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold uppercase text-[9px] tracking-wider">
                                                {activeDV.status === 'assigned' ? 'Review in Progress' : 'Awaiting Designer'}
                                            </span>
                                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md", 
                                                activeDV.status === 'assigned' ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            )}>
                                                {activeDV.status}
                                            </Badge>
                                        </div>
                                        {activeDV.freelancer && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400 font-bold">Assigned to:</span>
                                                <span className="font-black text-slate-800 dark:text-slate-200">{activeDV.freelancer.name}</span>
                                            </div>
                                        )}
                                        {activeDV.clientNotes && (
                                            <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 dark:border-slate-800/40 pt-2">
                                                <span className="font-bold block text-[8px] uppercase tracking-wider text-slate-400">Your Instructions:</span>
                                                <p className="italic">"{activeDV.clientNotes}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {completedDVs.map((v: any, idx: number) => (
                                    <div key={idx} className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/15 text-emerald-850 dark:text-emerald-400 text-xs flex flex-col gap-2.5">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold uppercase text-[9px] tracking-wider">Completed Audit</span>
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                                Approved
                                            </Badge>
                                        </div>
                                        {v.freelancerFeedback && (
                                            <div className="space-y-1">
                                                <span className="font-black text-emerald-600 dark:text-emerald-500 text-[8px] uppercase tracking-wider block">Feedback:</span>
                                                <p className="p-2.5 bg-emerald-550/5 dark:bg-emerald-550/10 rounded-xl border border-emerald-500/10 italic text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
                                                    "{v.freelancerFeedback}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold"><Clock className="h-4 w-4 text-primary" /> Production Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(order as any).logs && (order as any).logs.length > 0 ? (
                                <div className="relative space-y-6 pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                    {(order as any).logs.map((log: any, idx: number) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-slate-900 z-10" />
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] font-black tracking-tight text-slate-900 dark:text-white capitalize">
                                                        {log.actionType.replace(/_/g, ' ')}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-slate-400">
                                                        {format(new Date(log.createdAt), 'MMM dd, p')}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                                    {log.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No timeline updates yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 rounded-2xl overflow-hidden">
                        <CardHeader className="p-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Support Protocol</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            Reference **#{order.id}** for all support inquiries. Our team typically responds within 4 business hours for active production orders.
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Detailed Specifications Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-12 border-none shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-6 pb-2 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                                <FileText size={16} />
                            </div>
                            <CardTitle className="text-base font-bold tracking-tight">Technical Specifications</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {(() => {
                            let parsedCustomisation: any = null;
                            try {
                                const rawCustomisation = order.design?.customisation || (order as any).customisation;
                                parsedCustomisation = typeof rawCustomisation === 'string' 
                                    ? JSON.parse(rawCustomisation) 
                                    : rawCustomisation;
                            } catch (e) {}

                            return (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">Printing Side</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                                            {parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double Sided' : 'Single Sided'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">Dimensions</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                                            {order.design?.width || order.designUpload?.width || 'Custom'} x {order.design?.height || order.designUpload?.height || 'Custom'} mm
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">Spot UV Gloss</span>
                                        <span className={cn("font-bold text-xs", parsedCustomisation?.spotUv ? "text-amber-600" : "text-slate-400")}>
                                            {parsedCustomisation?.spotUv ? 'Applied' : 'Not Included'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">Custom Shape</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                                            {parsedCustomisation?.dieCut ? `Pattern #${parsedCustomisation.dieCut}` : 'Standard Rect.'}
                                        </span>
                                    </div>
                                    {parsedCustomisation?.lamination && (
                                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50">
                                            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">Finishing</span>
                                            <span className="font-bold text-slate-900 dark:text-white text-xs">Lamination Enabled</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
