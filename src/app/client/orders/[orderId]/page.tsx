import { getMyOrderDetails } from "@/app/actions/order-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
    IndianRupee, Package, Truck, CreditCard, Hash, FileText, Download, 
    ArrowLeft, History, Clock, CheckCircle2, Lock, ShieldCheck, AlertTriangle,
    Zap, Sparkles, MapPin, Building, Phone, User, Calendar, ExternalLink
} from "lucide-react";
import Image from 'next/image';
import { resolveImagePath, cn } from "@/lib/utils";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { Product, DesignElement, Background } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { calculateGstBreakdown, getGstStateInfo } from "@/lib/gst";

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
    const subProductName = isDirectSale ? order.directSellingProduct.category : (order.subProduct?.name || 'Custom Size & Finish');
    
    const shippingAddress = (order.shippingAddress as any) || {};
    const billingAddress = (order.billingAddress as any) || shippingAddress;

    const designVerifications = (order as any).designVerifications || [];
    const activeDV = designVerifications.find((v: any) => v.status === 'assigned' || v.status === 'pending');
    const completedDVs = designVerifications.filter((v: any) => v.status === 'completed');

    // Parse Customisation JSON safely
    let parsedCustomisation: any = null;
    try {
        const raw = (order as any).customisation || order.design?.customisation || order.designUpload?.customisation;
        parsedCustomisation = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {}

    // Delivery Option Resolution
    const delivery = parsedCustomisation?.deliveryOption || parsedCustomisation?.priceBreakup?.delivery || {
        id: 'standard',
        name: 'Standard Delivery',
        days: order.subProduct?.deliveryDays || '3-5 Business Days',
        fee: Number(order.subProduct?.deliveryAmount || 0)
    };
    const isExpedited = delivery.id && delivery.id !== 'standard';
    const deliveryFee = Number(delivery.fee || 0);

    // Total Financial Calculation
    let totalAmountVal = parseFloat(order.totalAmount || '0') || 0;
    if (totalAmountVal === 0 && order.contestId && order.payment?.amount) {
        totalAmountVal = parseFloat(order.payment.amount);
    }

    // Accurate Financial Split Calculation
    const breakup = parsedCustomisation?.priceBreakup || parsedCustomisation?.pricing;
    const addonsList: any[] = breakup?.addons || [];
    const addonsTotal = addonsList.reduce((acc: number, addon: any) => acc + parseFloat(addon.totalAmount || addon.amount || 0), 0);
    const discount = parseFloat(breakup?.discount || 0);
    const discountDescription = breakup?.description || '';

    // Base commercial printing subtotal (Total - Addons - Delivery + Discount)
    const basePrintingCost = Math.max(0, totalAmountVal - addonsTotal - deliveryFee + discount);

    // GST Calculation based on State
    const targetState = shippingAddress.state || billingAddress.state || 'Tamil Nadu';
    const gstCalc = calculateGstBreakdown({
        totalAmount: totalAmountVal,
        stateInput: targetState,
        gstRate: 0.18,
    });

    let designPreviewNode: React.ReactNode = <FileText className="h-16 w-16 text-slate-500"/>;
    if (isDesignOrder && order.design) {
        const design = order.design;
        const widthInPx = Math.round(Number(design.width || 89) * MM_TO_PX);
        const heightInPx = Math.round(Number(design.height || 51) * MM_TO_PX);

        const productForCanvas: Product = {
            id: design.productSlug, name: design.name, description: '', imageId: '',
            width: widthInPx, height: heightInPx, type: '',
        };
        const elements: DesignElement[] = (Array.isArray(design.elements) && Array.isArray(design.elements[0])) ? design.elements[0] as DesignElement[] : design.elements as DesignElement[];
        const background: Background = (Array.isArray(design.background)) ? design.background[0] as Background : design.background as Background;

        const previewScale = 160 / widthInPx;

        designPreviewNode = (
            <div style={{ width: 160, height: Math.max(100, heightInPx * previewScale), overflow: 'hidden', borderRadius: '1rem' }} className="shadow-md border border-white/20 bg-slate-900 flex items-center justify-center">
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
        );
    } else if (isUploadOrder && order.designUpload) {
        const imageSrc = order.designUpload.thumbnailPath || (order.designUpload.mimeType?.startsWith('image/') ? order.designUpload.filePath : null);
        designPreviewNode = imageSrc ? (
            <Image 
                src={resolveImagePath(imageSrc)} 
                alt="upload preview" 
                width={160} 
                height={160} 
                className="rounded-2xl object-contain shadow-md border border-white/20 bg-slate-900" 
            />
        ) : (
            <FileText className="h-16 w-16 text-slate-500"/>
        );
    } else if (isDirectSale && order.directSellingProduct) {
        const imageSrc = order.directSellingProduct.imageUrls?.[0];
        designPreviewNode = imageSrc ? (
            <Image 
                src={resolveImagePath(imageSrc)} 
                alt="product image" 
                width={160} 
                height={160} 
                className="rounded-2xl object-cover shadow-md border border-white/20 bg-slate-900" 
            />
        ) : (
            <FileText className="h-16 w-16 text-slate-500"/>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">
            
            {/* Top Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 px-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <Button asChild variant="ghost" size="sm" className="rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-900 gap-1.5 h-9 w-fit">
                    <Link href="/client/orders">
                        <ArrowLeft className="w-4 h-4" /> Back to My Orders
                    </Link>
                </Button>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Button asChild variant="outline" size="sm" className="rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 h-9 px-4 gap-1.5">
                        <Link href={`/client/orders/${order.id}/invoice`} target="_blank">
                            <Download className="w-3.5 h-3.5" /> Official Tax Invoice (PDF)
                        </Link>
                    </Button>
                    <Badge className={cn(
                        "capitalize px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase border",
                        order.orderStatus === 'delivered' 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                            : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
                    )}>
                        {order.orderStatus.replace('_', ' ')}
                    </Badge>
                </div>
            </div>

            {/* Order Title & Delivery Highlight */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1.5 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-white/10">
                        <Package className="w-3 h-3" /> Industrial Print Job #{order.id}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{productName}</h1>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">
                        Order placed on {format(new Date(order.createdAt), 'PPP')} at {format(new Date(order.createdAt), 'p')}
                    </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        {isExpedited ? <Zap className="w-5 h-5 text-amber-400 animate-pulse" /> : <Truck className="w-5 h-5" />}
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Turnaround</span>
                        <p className="text-sm font-black text-white">{delivery.name} ({delivery.days})</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Specifications, Accurate Financial Split, and Addresses */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* 1. Item Details & Artwork Blueprint Card */}
                    <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="h-5 w-5 text-indigo-600" />
                                <span>Artwork Blueprint & Product Specifications</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 sm:p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="shrink-0 flex items-center justify-center">
                                    {designPreviewNode}
                                </div>
                                <div className="space-y-2 flex-1 min-w-0">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{productName}</h3>
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{subProductName}</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Quantity</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{order.quantity} Units</span>
                                        </div>
                                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Sides</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                {parsedCustomisation?.pages === 2 || parsedCustomisation?.pages === '2' ? 'Double Sided' : 'Single Sided'}
                                            </span>
                                        </div>
                                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Product Size</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                {order.selectedSize || parsedCustomisation?.selectedSize || `${order.design?.width || order.designUpload?.width || order.subProduct?.width || 'Custom'} × ${order.design?.height || order.designUpload?.height || order.subProduct?.height || 'Custom'} mm`}
                                            </span>
                                        </div>
                                        {parsedCustomisation?.spotUv && (
                                            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                                                <span className="text-[9px] font-bold uppercase block">Spot UV Gloss</span>
                                                <span className="text-xs font-black">Applied</span>
                                            </div>
                                        )}
                                        {parsedCustomisation?.dieCut?.name && (
                                            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                                <span className="text-[9px] font-bold uppercase block">Custom Die-Cut</span>
                                                <span className="text-xs font-black">{parsedCustomisation.dieCut.name}</span>
                                            </div>
                                        )}
                                        {parsedCustomisation?.cardTexture?.name && (
                                            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                                                <span className="text-[9px] font-bold uppercase block">Paper Texture</span>
                                                <span className="text-xs font-black">{parsedCustomisation.cardTexture.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons for Design Proof / Uploaded File */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
                                {isDesignOrder && (
                                    <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5 h-9">
                                        <Link 
                                            href={`/design/${order.design.productSlug}?templateId=${order.design.id}${!['completed', 'delivered', 'cancelled'].includes(order.orderStatus) ? '&readonly=true' : ''}`} 
                                            target="_blank"
                                        >
                                            <FileText className="w-4 h-4 text-indigo-600" />
                                            <span>View Digital Artwork Proof</span>
                                            <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                                        </Link>
                                    </Button>
                                )}
                                {isUploadOrder && (
                                    <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5 h-9">
                                        <a href={resolveImagePath(order.designUpload.filePath)} download>
                                            <Download className="w-4 h-4 text-indigo-600" />
                                            <span>Download Uploaded Artwork ({order.designUpload.originalFilename})</span>
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Complete Order Financial Split Breakdown */}
                    <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5 text-indigo-600" />
                                    <span>Financial Breakdown & Itemized Split</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 mt-0.5">
                                    Detailed cost distribution across printing, custom add-ons, and shipping
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
                                100% Tax Compliant
                            </Badge>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <div className="space-y-3 text-xs">
                                
                                {/* Base Commercial Printing */}
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <span className="font-extrabold text-slate-900 dark:text-white block">
                                            Base Commercial Printing ({order.quantity} Cards)
                                        </span>
                                        <span className="text-[11px] text-slate-400">High-definition offset press batch</span>
                                    </div>
                                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                        ₹{basePrintingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {/* Itemized Addons */}
                                {addonsList.length > 0 && (
                                    <div className="space-y-2 pl-3 border-l-2 border-indigo-500/30">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                            Custom Finishing Enhancements
                                        </span>
                                        {addonsList.map((addon: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    {addon.name}
                                                </span>
                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    + ₹{parseFloat(addon.totalAmount || addon.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Volume Discount Savings */}
                                {discount > 0 && (
                                    <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-emerald-600" />
                                            <span>Volume Savings Discount {discountDescription ? `(${discountDescription})` : ''}</span>
                                        </div>
                                        <span className="font-mono font-black text-sm">
                                            - ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                {/* Shipping & Delivery Option */}
                                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-indigo-600" />
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {delivery.name} ({delivery.days})
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                                        {deliveryFee > 0 ? `+ ₹${deliveryFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : (
                                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Free</span>
                                        )}
                                    </span>
                                </div>

                                {/* GST Tax Breakdown Ledger */}
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                                        <span>Taxable Production Value</span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                            ₹{gstCalc.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {gstCalc.isIntrastate ? (
                                        <>
                                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                                                <span>CGST (9%) - Tamil Nadu [{gstCalc.stateCode}]</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    ₹{gstCalc.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                                                <span>SGST (9%) - Tamil Nadu [{gstCalc.stateCode}]</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    ₹{gstCalc.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                                            <span>IGST (18%) - {targetState} [{gstCalc.stateCode}]</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                ₹{gstCalc.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-[11px] text-emerald-600 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                                        <span>Taxes Status</span>
                                        <span>All Taxes Inclusive (18% GST)</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="bg-slate-50 dark:bg-slate-800/40 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Net Total Paid</span>
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Payment Received & Reconciled
                                </span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center">
                                <IndianRupee className="h-6 w-6 mr-0.5 text-indigo-600" />
                                {totalAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </CardFooter>
                    </Card>

                    {/* 3. Shipping & Billing Addresses Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-indigo-600" /> Shipping Destination
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 text-xs space-y-1.5 text-slate-600 dark:text-slate-400 font-medium">
                                <p className="font-black text-slate-900 dark:text-white text-sm">{shippingAddress.name || 'N/A'}</p>
                                <p>{shippingAddress.addressLine1}</p>
                                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                                <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zip}</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{shippingAddress.country || 'India'}</p>
                                <p className="pt-2 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-indigo-600" /> +91 {shippingAddress.phone || 'N/A'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Building className="w-4 h-4 text-indigo-600" /> Billing / Invoice Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 text-xs space-y-1.5 text-slate-600 dark:text-slate-400 font-medium">
                                <p className="font-black text-slate-900 dark:text-white text-sm">{billingAddress.name || shippingAddress.name || 'N/A'}</p>
                                <p>{billingAddress.addressLine1 || shippingAddress.addressLine1}</p>
                                {(billingAddress.addressLine2 || shippingAddress.addressLine2) && (
                                    <p>{billingAddress.addressLine2 || shippingAddress.addressLine2}</p>
                                )}
                                <p>{billingAddress.city || shippingAddress.city}, {billingAddress.state || shippingAddress.state} - {billingAddress.zip || shippingAddress.zip}</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{billingAddress.country || shippingAddress.country || 'India'}</p>
                                <p className="pt-2 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-indigo-600" /> +91 {billingAddress.phone || shippingAddress.phone || 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Tracking & Production Timeline */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Payment & Status Overview */}
                    <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-indigo-600" /> Payment & Dispatch Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Payment Status</span>
                                <span className="font-black text-emerald-600 uppercase flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {order.paymentStatus || 'PAID'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Payment Provider</span>
                                <span className="font-black text-slate-900 dark:text-white">
                                    {(order as any).payment?.provider?.toUpperCase() || 'RAZORPAY'} / {order.paymentMethod || 'Online'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Transaction Ref</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                    {(order as any).payment?.providerPaymentId || `TXN-${order.id}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Courier Tracking</span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400">
                                    {order.trackingNumber || 'PROVISIONING DISPATCH'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Design Verification Audit */}
                    {designVerifications.length > 0 && (
                        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Designer Pre-Press Audit
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4 text-xs">
                                {activeDV && (
                                    <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-indigo-900 dark:text-indigo-300">Audit in Progress</span>
                                            <Badge variant="outline" className="text-[9px] font-black text-indigo-600 uppercase">
                                                {activeDV.status}
                                            </Badge>
                                        </div>
                                        {activeDV.freelancer && (
                                            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                                Assigned designer: <strong className="text-slate-900 dark:text-white">{activeDV.freelancer.name}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {completedDVs.map((v: any, idx: number) => (
                                    <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-emerald-900 dark:text-emerald-300">Artwork Proof Approved</span>
                                            <Badge className="bg-emerald-600 text-white text-[9px] font-black">Passed</Badge>
                                        </div>
                                        {v.freelancerFeedback && (
                                            <p className="italic text-slate-600 dark:text-slate-400 text-[11px]">
                                                &quot;{v.freelancerFeedback}&quot;
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Production Timeline Steps */}
                    <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> Production Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                
                                <div className="relative">
                                    <div className="absolute -left-[1.4rem] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 z-10" />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">Order Confirmed</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Payment received and placed on production schedule.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className={cn(
                                        "absolute -left-[1.4rem] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 z-10",
                                        ['in_production', 'printing', 'dispatched', 'delivered'].includes(order.orderStatus)
                                            ? "bg-emerald-500"
                                            : "bg-slate-300 dark:bg-slate-700"
                                    )} />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">Pre-press & Artwork Check</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Digital proofs verified for bleeds, resolution & color calibration.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className={cn(
                                        "absolute -left-[1.4rem] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 z-10",
                                        ['printing', 'dispatched', 'delivered'].includes(order.orderStatus)
                                            ? "bg-emerald-500"
                                            : "bg-slate-300 dark:bg-slate-700"
                                    )} />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">High-Definition Press Printing</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Undergoing industrial offset printing, curing & custom finishes.</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className={cn(
                                        "absolute -left-[1.4rem] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 z-10",
                                        ['dispatched', 'delivered'].includes(order.orderStatus)
                                            ? "bg-emerald-500"
                                            : "bg-slate-300 dark:bg-slate-700"
                                    )} />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">Dispatched via {delivery.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Packed in secure moisture-proof box and handed to courier partner.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
