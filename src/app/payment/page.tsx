
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createRazorpayOrder, captureAndVerifyPayment } from '@/app/actions/payment-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, IndianRupee, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/layout/header';
import Script from 'next/script';

// Define a type for the order details
type OrderPayload = {
    orderData: any;
    amount: number;
    items: any[];
    shippingAddress: any;
};

function PaymentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [orderPayload, setOrderPayload] = useState<OrderPayload | null>(null);
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
                name: orderPayload.shippingAddress.name,
                contact: orderPayload.shippingAddress.phone,
            },
            notes: {
                address: `${orderPayload.shippingAddress.addressLine1}, ${orderPayload.shippingAddress.city}`
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

                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Shipping to:</h4>
                        <div className="text-sm text-muted-foreground p-3 rounded-md border">
                            <p className="font-medium">{orderPayload.shippingAddress.name}</p>
                            <p>{orderPayload.shippingAddress.addressLine1}</p>
                            <p>{orderPayload.shippingAddress.city}, {orderPayload.shippingAddress.state} {orderPayload.shippingAddress.zip}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                     <Button 
                        className="w-full h-12 text-lg font-bold" 
                        onClick={handlePayment} 
                        disabled={isLoading || isProcessing}
                    >
                        {isProcessing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                           'Pay Now'
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck size={14}/> Securely processed by Razorpay
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function PaymentPage() {
    return (
        <>
            <Header />
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
                <PaymentPageContent />
            </Suspense>
        </>
    )
}
