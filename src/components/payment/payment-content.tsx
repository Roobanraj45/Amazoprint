'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createRazorpayOrder, captureAndVerifyPayment, processDummyPayment } from '@/app/actions/payment-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Loader2, IndianRupee, ShieldCheck, Coins, Sparkles, Trophy, 
    Package2, MapPin, Phone, User, CheckCircle2, Lock, ArrowLeft, 
    Zap, Tag, FileText, Check
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Script from 'next/script';
import { cn } from '@/lib/utils';

// Define a type for the order details
type OrderPayload = {
    orderData: any;
    amount: number;
    items: any[];
    shippingAddress: any;
};

export function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [orderPayload, setOrderPayload] = useState<OrderPayload | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(true);
    const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
    const [paymentRecordId, setPaymentRecordId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const orderDataParam = searchParams.get('orderData');
    const orderType = searchParams.get('orderType') as 'design' | 'direct' | 'contest';
    
    useEffect(() => {
        if (!orderDataParam || !orderType) {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid order details.' });
            router.push('/');
            return;
        }

        try {
            const decodedData = JSON.parse(decodeURIComponent(atob(orderDataParam)));
            setOrderPayload(decodedData);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not read order data.' });
            router.push('/');
        }
    }, [orderDataParam, orderType, router, toast]);

    useEffect(() => {
        if (orderPayload) {
            const createOrder = async () => {
                const result = await createRazorpayOrder(orderPayload.amount, orderType, orderPayload.orderData);
                if (result.success && result.order && result.paymentRecordId) {
                    setRazorpayOrder(result.order);
                    setPaymentRecordId(result.paymentRecordId);
                } else {
                    toast({ variant: 'destructive', title: 'Payment Error', description: result.error });
                }
                setIsLoading(false);
            };
            createOrder();
        }
    }, [orderPayload, orderType, toast]);

    const handlePayment = () => {
        if (!razorpayOrder || !orderPayload || !paymentRecordId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Payment details not ready.' });
            return;
        }

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "Amazoprint",
            description: "Your Order from Amazoprint",
            order_id: razorpayOrder.id,
            handler: async (response: any) => {
                setIsProcessing(true);
                const result = await captureAndVerifyPayment({
                    ...response,
                    paymentRecordId,
                    orderType,
                    orderData: orderPayload.orderData,
                });

                if (result.success) {
                    toast({ title: 'Payment Successful!', description: 'Your order has been placed.' });
                    router.push('/client/orders');
                } else {
                    toast({ variant: 'destructive', title: 'Payment Failed', description: result.error });
                    setIsProcessing(false);
                }
            },
            prefill: {
                name: orderPayload.shippingAddress?.name || "Client",
                contact: orderPayload.shippingAddress?.phone || "",
            },
            notes: {
                address: orderPayload.shippingAddress 
                    ? `${orderPayload.shippingAddress.addressLine1 || ''}, ${orderPayload.shippingAddress.city || ''}` 
                    : "Digital Service / Design Contest"
            },
            theme: {
                color: "#2563EB"
            },
            modal: {
                ondismiss: () => {
                    if (!isProcessing) {
                        toast({ variant: 'destructive', title: 'Payment Canceled' });
                    }
                }
            }
        };
        
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleDummyPayment = async () => {
        if (!orderPayload) return;
        setIsProcessing(true);
        try {
            const result = await processDummyPayment({
                amount: orderPayload.amount,
                orderType: orderType,
                orderData: orderPayload.orderData,
            });

            if (result.success) {
                toast({ title: 'Payment Successful (Dummy)', description: 'Your order has been placed successfully.' });
                router.push('/client/orders');
            } else {
                toast({ variant: 'destructive', title: 'Payment Failed', description: result.error });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Dummy payment failed.' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!orderPayload) {
        return (
            <div className="min-h-screen pt-36 pb-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground">Preparing checkout details...</p>
            </div>
        );
    }

    const items = orderPayload.orderData?.items || orderPayload.items || [];
    const shipping = orderPayload.shippingAddress || orderPayload.orderData?.shippingAddress;

    return (
        <div className="min-h-screen pt-28 sm:pt-36 md:pt-40 pb-20 bg-slate-50/70 dark:bg-[#0B1528] text-slate-900 dark:text-white">
            <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* ── TOP HEADER / BREADCRUMB ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <Link href="/products" className="hover:text-primary transition-colors flex items-center gap-1">
                                <ArrowLeft size={14} /> Back
                            </Link>
                            <span>/</span>
                            <span>Checkout</span>
                            <span>/</span>
                            <span className="text-slate-900 dark:text-white font-extrabold capitalize">{orderType} Order</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Lock size={24} className="text-primary" /> Secure Checkout & Payment
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span>256-Bit SSL Encrypted</span>
                    </div>
                </div>

                {/* ── MAIN 2-COLUMN CHECKOUT GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ── LEFT COLUMN: ORDER REVIEW & SHIPPING ── */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* 1. Item Details Card */}
                        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <CardContent className="p-6 sm:p-7 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                        <Package2 size={18} className="text-primary" /> Order Items ({items.length})
                                    </h3>
                                    <Badge className={cn(
                                        "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-none",
                                        orderType === 'direct' 
                                            ? "bg-amber-500 text-white" 
                                            : orderType === 'contest'
                                                ? "bg-indigo-600 text-white"
                                                : "bg-blue-600 text-white"
                                    )}>
                                        {orderType === 'direct' ? '⚡ Direct Selling' : orderType === 'contest' ? '🏆 Design Quest' : '🎨 Custom Print'}
                                    </Badge>
                                </div>

                                {/* Items Listing */}
                                <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                                    {items.map((item: any, idx: number) => {
                                        const unitPrice = item.sellingPrice || item.price || (orderPayload.amount / (item.quantity || 1));
                                        const qty = item.quantity || 1;
                                        return (
                                            <div key={idx} className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", idx > 0 && "pt-4")}>
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                                                            {item.name}
                                                        </h4>
                                                        {item.sku && (
                                                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                                SKU: {item.sku}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                        {item.selectedSize && (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                                                                Size: {item.selectedSize}
                                                            </span>
                                                        )}
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                            Qty: {qty}
                                                        </span>
                                                    </div>

                                                    {item.customText && (
                                                        <div className="mt-2 p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs">
                                                            <span className="font-extrabold text-amber-700 dark:text-amber-400 block mb-0.5 flex items-center gap-1">
                                                                <Sparkles size={12} /> Custom Inscription / Text:
                                                            </span>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                "{item.customText}"
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-left sm:text-right shrink-0">
                                                    <span className="text-xs text-slate-400 font-bold block">
                                                        ₹{Number(unitPrice).toFixed(2)} × {qty}
                                                    </span>
                                                    <span className="text-lg font-black text-slate-900 dark:text-white flex items-center sm:justify-end">
                                                        <IndianRupee size={16} className="mr-0.5" />
                                                        {(Number(unitPrice) * qty).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Contest Specifications Summary if Contest Type */}
                        {orderType === 'contest' && (
                            <Card className="rounded-3xl border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm overflow-hidden">
                                <CardContent className="p-6 sm:p-7 space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                        <Trophy size={18} className="text-indigo-500" /> Contest Details & Scope
                                    </h3>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                                            <span className="text-slate-600 dark:text-slate-400 font-semibold">Contest Title</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white">{orderPayload.orderData?.contestData?.title}</span>
                                        </div>
                                        {orderPayload.orderData?.contestData?.customisation?.sizeDisplay && (
                                            <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                                                <span className="text-slate-600 dark:text-slate-400 font-semibold">Design Format & Units</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {orderPayload.orderData?.contestData?.customisation?.sizeDisplay} ({orderPayload.orderData?.contestData?.customisation?.quantity || 1} Units)
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1">
                                            <span className="text-slate-600 dark:text-slate-400 font-semibold">Prize Escrow Pool</span>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400">₹{Number(orderPayload.orderData?.contestData?.prizeAmount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 3. Delivery / Shipping Details Card */}
                        {shipping && (
                            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                <CardContent className="p-6 sm:p-7 space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                        <MapPin size={18} className="text-primary" /> Delivery Destination
                                    </h3>

                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-2 text-sm">
                                        <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                                            <User size={15} className="text-slate-400" />
                                            <span>{shipping.name}</span>
                                            {shipping.phone && (
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-2">
                                                    <Phone size={12} /> {shipping.phone}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 font-medium pl-6">
                                            {shipping.addressLine1}
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold pl-6">
                                            {shipping.city}, {shipping.state} - {shipping.zip}, {shipping.country || 'India'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN: PAYMENT SUMMARY & ACTION ── */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden sticky top-36">
                            <CardContent className="p-6 sm:p-8 space-y-6">
                                <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                        Payment Summary
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Complete your transaction securely
                                    </p>
                                </div>

                                {/* Price Breakdown Matrix */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                                        <span>Items Subtotal</span>
                                        <span className="font-bold text-slate-900 dark:text-white">₹{orderPayload.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                                        <span>Standard Shipping</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-xs">FREE</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                                        <span>GST & Platform Charges</span>
                                        <span className="font-semibold text-slate-400 text-xs">Included in price</span>
                                    </div>

                                    {/* Total Payable Block */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Total Amount</span>
                                            <span className="text-xs text-slate-500 font-medium">Inclusive of all taxes</span>
                                        </div>
                                        <div className="text-3xl font-black text-primary flex items-center">
                                            <IndianRupee size={26} className="mr-0.5" />
                                            {orderPayload.amount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Conditions Checkbox */}
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                    <div className="flex items-start space-x-2.5">
                                        <Checkbox
                                            id="terms-and-conditions"
                                            checked={agreedToTerms}
                                            onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                                            className="mt-0.5 h-4 w-4 rounded-md text-primary"
                                        />
                                        <Label htmlFor="terms-and-conditions" className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
                                            I agree to the <span className="underline font-bold text-primary">Terms & Conditions</span>, privacy policies, and verified refund rules.
                                        </Label>
                                    </div>
                                </div>

                                {/* Primary & Secondary Action CTAs */}
                                <div className="space-y-3 pt-2">
                                    <Button 
                                        className="w-full h-14 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50" 
                                        onClick={handlePayment} 
                                        disabled={isLoading || isProcessing || !agreedToTerms}
                                    >
                                        {isProcessing ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying Payment...</>
                                        ) : isLoading ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Initializing Gateway...</>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Lock size={18} /> Pay ₹{orderPayload.amount.toFixed(2)} with Razorpay
                                            </span>
                                        )}
                                    </Button>

                                    <Button 
                                        variant="outline" 
                                        className="w-full h-11 rounded-xl text-xs font-bold border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" 
                                        onClick={handleDummyPayment}
                                        disabled={isLoading || isProcessing || !agreedToTerms}
                                    >
                                        <Zap size={14} className="mr-1 text-amber-500" /> Fast Dummy PG Checkout (Testing Mode)
                                    </Button>
                                </div>

                                {/* Trust Highlights */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-400 font-medium">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                        <span>Instant Order Confirmation & Tracking</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
                                        <span>Official GST Invoice automatically generated</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-amber-500 shrink-0" />
                                        <span>Razorpay Verified Payment Gateway</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

