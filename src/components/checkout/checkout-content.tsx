'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCheckoutDetails } from '@/app/actions/order-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowRight, File, ShieldCheck, Truck, Lock, Package2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { resolveImagePath } from '@/lib/utils';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Product, Background } from '@/lib/types';


const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone is required'),
});

const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  useShippingForBilling: z.boolean().default(true),
  billingAddress: z.any().optional(),
}).superRefine((data, ctx) => {
  if (!data.useShippingForBilling) {
    const result = addressSchema.safeParse(data.billingAddress);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ['billingAddress', ...issue.path],
        });
      });
    }
  }
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

type CheckoutDetails = Awaited<ReturnType<typeof getCheckoutDetails>>;

const DPI = 300;
const MM_TO_PX = DPI / 25.4;


function AddressForm({ type, register, errors }: { type: 'shippingAddress' | 'billingAddress', register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor={`${type}.name`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Full Name</Label>
                <Input id={`${type}.name`} {...register(`${type}.name`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="John Doe" />
                {errors?.[type]?.name && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.name.message}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={`${type}.addressLine1`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Address Line 1</Label>
                <Input id={`${type}.addressLine1`} {...register(`${type}.addressLine1`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="123 Printing Lane" />
                 {errors?.[type]?.addressLine1 && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.addressLine1.message}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={`${type}.addressLine2`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Address Line 2 (Optional)</Label>
                <Input id={`${type}.addressLine2`} {...register(`${type}.addressLine2`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="Suite, Apartment, etc." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.city`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">City</Label>
                    <Input id={`${type}.city`} {...register(`${type}.city`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="Mumbai" />
                    {errors?.[type]?.city && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.state`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">State / Province</Label>
                    <Input id={`${type}.state`} {...register(`${type}.state`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="Maharashtra" />
                    {errors?.[type]?.state && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.state.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.zip`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ZIP / Postal Code</Label>
                    <Input id={`${type}.zip`} {...register(`${type}.zip`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="400001" />
                    {errors?.[type]?.zip && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.zip.message}</p>}
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor={`${type}.country`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Country</Label>
                    <Input id={`${type}.country`} {...register(`${type}.country`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="India" />
                    {errors?.[type]?.country && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.country.message}</p>}
                </div>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor={`${type}.phone`} className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Number</Label>
                <Input id={`${type}.phone`} type="tel" {...register(`${type}.phone`)} className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs shadow-inner px-3 transition-all" placeholder="+91 98765 43210" />
                 {errors?.[type]?.phone && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.phone.message}</p>}
            </div>
        </div>
    );
}

export function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const [details, setDetails] = useState<CheckoutDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const methods = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        mode: 'onChange',
        defaultValues: {
            useShippingForBilling: true
        }
    });

    const { register, handleSubmit, watch, formState: { errors } } = methods;
    const useShippingForBilling = watch('useShippingForBilling');

    useEffect(() => {
        const designId = searchParams.get('designId');
        const uploadId = searchParams.get('uploadId');
        const quantity = searchParams.get('quantity') || '100';

        if (!designId && !uploadId) {
            router.push('/');
            return;
        }

        getCheckoutDetails({ designId: designId || undefined, uploadId: uploadId || undefined, quantity })
            .then(data => {
                setDetails(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load checkout details.' });
                router.push('/');
            });
    }, [searchParams, router, toast]);

    const onSubmit = (data: CheckoutFormValues) => {
        if (!details) return;

        setIsPlacingOrder(true);
        try {
             const orderPayload = {
                orderData: {
                    designId: details.design?.id,
                    uploadId: details.upload?.id,
                    quantity: details.quantity,
                    ...data,
                },
                amount: details.total,
                items: [{ name: details.product.name, quantity: details.quantity }],
                shippingAddress: data.shippingAddress,
            };
            
            const encodedData = btoa(encodeURIComponent(JSON.stringify(orderPayload)));
            router.push(`/payment?orderType=design&orderData=${encodedData}`);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: "Could not proceed to payment." });
            setIsPlacingOrder(false);
        }
    };



    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400 animate-pulse">Preparing your secure checkout...</p>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 space-y-3">
                <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">Could not load checkout information.</p>
                <Button onClick={() => router.push('/')} size="sm" className="rounded-xl font-bold text-xs">Return to Home</Button>
            </div>
        );
    }

    let imagePreview: React.ReactNode;

    if (details.design) {
        const productForCanvas: Product = {
            ...details.product,
            width: Math.round(Number(details.design.width) * MM_TO_PX),
            height: Math.round(Number(details.design.height) * MM_TO_PX),
        };
        const elements = (Array.isArray(details.design.elements) && Array.isArray(details.design.elements[0]))
            ? details.design.elements[0]
            : details.design.elements;
        const background = (Array.isArray(details.design.background))
            ? details.design.background[0]
            : details.design.background;

        const previewScale = 80 / productForCanvas.width;
        
        imagePreview = (
             <div style={{ width: 80, height: productForCanvas.height * previewScale, overflow: 'hidden', borderRadius: '0.75rem' }} className="shadow-sm border border-white/10">
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: productForCanvas.width, height: productForCanvas.height }}>
                    <DesignCanvas
                        product={productForCanvas}
                        elements={elements as DesignElement[]}
                        background={background as Background}
                        showRulers={false} showGrid={false} gridSize={20} guides={[]}
                        showPrintGuidelines={false} bleed={0} safetyMargin={0}
                        viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                    />
                </div>
            </div>
        );
    } else if (details.upload) {
        const imageSrc = details.upload.thumbnailPath || (details.upload.mimeType?.startsWith('image/') ? details.upload.filePath : null);
        imagePreview = imageSrc ? <Image src={resolveImagePath(imageSrc)} alt={details.upload.originalFilename} width={80} height={80} className="rounded-xl object-contain shadow-sm border border-white/10" /> : <File className="h-10 w-10 text-white/40" />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-[11px] font-extrabold uppercase tracking-widest mb-2 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" /> 100% Secure Checkout
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Complete Your Order</h1>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Verify your shipping details and order specifications below.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <FormProvider {...methods}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-900/5 dark:shadow-black/20 overflow-hidden bg-white dark:bg-slate-900/80 backdrop-blur-xl">
                                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 px-6 pt-6 bg-slate-50/50 dark:bg-slate-900/50">
                                        <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-indigo-500/25">1</span>
                                            Shipping Address
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <AddressForm type="shippingAddress" register={register} errors={errors} />
                                    </CardContent>
                                </Card>

                                <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <Checkbox
                                        id="use-shipping-for-billing"
                                        checked={useShippingForBilling}
                                        onCheckedChange={(checked) => methods.setValue('useShippingForBilling', !!checked)}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <Label htmlFor="use-shipping-for-billing" className="text-xs font-extrabold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                        Billing address is the same as shipping
                                    </Label>
                                </div>

                                {!useShippingForBilling && (
                                    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-900/5 dark:shadow-black/20 overflow-hidden bg-white dark:bg-slate-900/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 px-6 pt-6 bg-slate-50/50 dark:bg-slate-900/50">
                                            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-indigo-500/25">2</span>
                                                Billing Address
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <AddressForm type="billingAddress" register={register} errors={errors} />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Action CTAs */}
                                <div className="w-full pt-2">
                                    <Button type="submit" size="default" className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-md hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all text-xs gap-1.5" disabled={isPlacingOrder}>
                                        {isPlacingOrder ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Lock className="mr-1.5 h-4 w-4" />}
                                        Proceed to Secure Payment <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </FormProvider>
                    </div>
                    
                    {/* Right Column: Premium Glassmorphic Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
                            {/* Decorative Glow Background */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                                <h3 className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
                                    <Package2 className="w-4 h-4 text-indigo-400" /> Order Summary
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/10">Design Order</span>
                            </div>

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-20 h-20 bg-white/5 rounded-xl p-1.5 flex items-center justify-center border border-white/10 shadow-inner shrink-0">
                                    {imagePreview}
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <p className="font-extrabold text-sm tracking-tight truncate text-white">{details.product.name}</p>
                                    <p className="text-xs font-bold text-indigo-400 truncate">{details.subProduct.name}</p>
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[11px] font-bold mt-1.5">
                                        Qty: {details.quantity}
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-white/10 relative z-10" />

                            <div className="space-y-2.5 text-xs relative z-10">
                                <div className="flex justify-between items-center text-slate-300 font-medium">
                                    <span>Standard Printing</span>
                                    <span className="font-extrabold text-white">₹{(details.originalTotal - ((details as any).customisation?.priceBreakup?.addons?.reduce((acc: number, addon: any) => acc + addon.totalAmount, 0) || 0)).toFixed(2)}</span>
                                </div>
                                
                                {(details as (typeof details & { customisation?: any })).customisation?.priceBreakup?.addons?.map((addon: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-[11px] items-center py-1 border-t border-white/5">
                                        <div className="flex items-center gap-1.5 text-slate-300">
                                            <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                            <span className="font-bold">{addon.name}</span>
                                        </div>
                                        <span className="font-black text-indigo-300">+ ₹{addon.totalAmount.toFixed(2)}</span>
                                    </div>
                                ))}

                                {details.totalDiscount > 0 && (
                                    <div className="flex justify-between text-[11px] font-black text-emerald-400 bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30 shadow-inner items-center">
                                        <span>Saved {details.discountDescription ? `(${details.discountDescription})` : ''}</span>
                                        <span>- ₹{details.totalDiscount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-slate-300 font-medium pt-0.5">
                                    <span>Shipping</span>
                                    <span className="text-emerald-400 font-black text-[11px] uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Free</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-300 font-medium">
                                    <span>Taxes</span>
                                    <span className="text-slate-400 italic text-[11px] font-bold">Included</span>
                                </div>
                            </div>

                            <Separator className="bg-white/10 relative z-10" />

                            <div className="flex justify-between items-center font-black text-lg text-white pt-1 relative z-10">
                                <span>Total Payable</span>
                                <span className="bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">₹{details.total.toFixed(2)}</span>
                            </div>

                            {/* Trust Footer inside card */}
                            <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-5 text-slate-400 text-[11px] font-bold relative z-10">
                                <div className="flex items-center gap-1">
                                    <Truck className="w-3.5 h-3.5 text-indigo-400" /> Fast Delivery
                                </div>
                                <div className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Buyer Protection
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
