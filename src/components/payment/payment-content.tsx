'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createRazorpayOrder, captureAndVerifyPayment, processDummyPayment } from '@/app/actions/payment-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, IndianRupee, ShieldCheck, Coins, Sparkles, Trophy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Script from 'next/script';

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
    const [agreedToTerms, setAgreedToTerms] = useState(false);
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
                color: "#2563EB" // Blue-600
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
             <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl py-12">
            <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Secure Payment</CardTitle>
                    <CardDescription>Review your order and complete the payment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="flex items-center text-primary">
                                <IndianRupee size={18} className="mr-1"/>{orderPayload.amount.toFixed(2)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">All taxes and fees included.</p>
                    </div>

                    {orderType === 'contest' ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3 shadow-inner">
                                <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Trophy className="w-4 h-4 text-indigo-500 shrink-0" /> Contest Specifications Summary
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-border/40 pb-2">
                                        <span className="text-muted-foreground font-semibold">Contest Title</span>
                                        <span className="font-extrabold text-foreground text-right">{orderPayload.orderData?.contestData?.title}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/40 pb-2">
                                        <span className="text-muted-foreground font-semibold">Casing Format</span>
                                        <span className="font-extrabold text-indigo-600 bg-indigo-600/10 px-2.5 py-0.5 rounded-lg text-xs flex items-center gap-1 shrink-0">
                                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Aa Format
                                        </span>
                                    </div>
                                    {orderPayload.orderData?.contestData?.customisation?.sizeDisplay && (
                                        <div className="flex justify-between border-b border-border/40 pb-2">
                                            <span className="text-muted-foreground font-semibold">Design Options</span>
                                            <span className="font-bold text-foreground text-right">
                                                {orderPayload.orderData?.contestData?.customisation?.sizeDisplay} ({orderPayload.orderData?.contestData?.customisation?.quantity || 1} Units)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-3 shadow-inner">
                                <h4 className="text-xs font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Coins className="w-4 h-4 text-rose-500 shrink-0" /> Detailed Cost Breakdown
                                </h4>
                                <div className="space-y-2.5 text-sm">
                                    {/* Specifications Cost Sub-matrix */}
                                    {orderPayload.orderData?.contestData?.customisation?.specsCost !== undefined && (
                                        <div className="border-b border-border/40 pb-2.5 space-y-1.5 text-xs bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border">
                                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                                                <span>Base Printing ({orderPayload.orderData?.contestData?.customisation?.quantity || 1} Units)</span>
                                                <span>₹{Number(orderPayload.orderData?.contestData?.customisation?.printBaseCost || 0).toFixed(2)}</span>
                                            </div>
                                            {orderPayload.orderData?.contestData?.customisation?.specsBreakdown?.map((addon: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-muted-foreground pl-2 font-medium">
                                                    <span>+ {addon.name}</span>
                                                    <span>₹{Number(addon.totalAmount || 0).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-black text-indigo-600 dark:text-indigo-400 pt-1.5 border-t border-dashed border-border/40">
                                                <span>Specifications Subtotal</span>
                                                <span>₹{Number(orderPayload.orderData?.contestData?.customisation?.specsCost || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between border-b border-border/40 pb-2">
                                        <span className="text-muted-foreground font-semibold">Platform Fee (Contest Tier)</span>
                                        <span className="font-bold text-foreground">₹{Number(orderPayload.orderData?.contestData?.entryFee || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/40 pb-2">
                                        <span className="text-muted-foreground font-semibold">Winner Prize Escrow</span>
                                        <span className="font-bold text-rose-500">₹{Number(orderPayload.orderData?.contestData?.prizeAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1.5 font-extrabold text-base border-t border-border/60">
                                        <span className="text-foreground">Grand Total Cost</span>
                                        <span className="text-primary flex items-center"><IndianRupee size={16} className="mr-0.5"/>{orderPayload.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Shipping to:</h4>
                            {orderPayload.shippingAddress ? (
                                <div className="text-sm text-muted-foreground p-3 rounded-md border">
                                    <p className="font-medium">{orderPayload.shippingAddress.name}</p>
                                    <p>{orderPayload.shippingAddress.addressLine1}</p>
                                    <p>{orderPayload.shippingAddress.city}, {orderPayload.shippingAddress.state} {orderPayload.shippingAddress.zip}</p>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground p-3 rounded-md border">
                                    No shipping address provided.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <div className="flex items-start space-x-2.5 w-full pb-2 select-none">
                        <Checkbox
                            id="terms-and-conditions"
                            checked={agreedToTerms}
                            onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        <Label htmlFor="terms-and-conditions" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer leading-normal">
                            I agree to the <span className="underline font-bold text-[#2563EB] hover:text-blue-600 transition-colors">Terms and Conditions</span>, privacy policy, and refund rules.
                        </Label>
                    </div>
                     <Button 
                        className="w-full h-12 text-lg font-bold" 
                        onClick={handlePayment} 
                        disabled={isLoading || isProcessing || !agreedToTerms}
                    >
                        {isProcessing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                           'Pay Now'
                        )}
                    </Button>
                    <Button 
                        variant="outline" 
                        className="w-full border-dashed" 
                        onClick={handleDummyPayment}
                        disabled={isLoading || isProcessing || !agreedToTerms}
                    >
                        Skip to Dummy PG (Testing)
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck size={14}/> Securely processed by Razorpay
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
