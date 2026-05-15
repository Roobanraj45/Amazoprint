'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCheckoutDetails } from '@/app/actions/order-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowRight, File, CreditCard } from 'lucide-react';
import { processDummyPayment } from '@/app/actions/payment-actions';
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
  billingAddress: addressSchema.optional(),
}).refine(data => data.useShippingForBilling || !!data.billingAddress, {
  message: "Billing address is required if not same as shipping",
  path: ["billingAddress"],
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

type CheckoutDetails = Awaited<ReturnType<typeof getCheckoutDetails>>;

const DPI = 300;
const MM_TO_PX = DPI / 25.4;


function AddressForm({ type, register, errors }: { type: 'shippingAddress' | 'billingAddress', register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.name`}>Full Name</Label>
                    <Input id={`${type}.name`} {...register(`${type}.name`)} />
                    {errors?.[type]?.name && <p className="text-sm text-destructive">{errors?.[type]?.name.message}</p>}
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={`${type}.addressLine1`}>Address Line 1</Label>
                <Input id={`${type}.addressLine1`} {...register(`${type}.addressLine1`)} />
                 {errors?.[type]?.addressLine1 && <p className="text-sm text-destructive">{errors?.[type]?.addressLine1.message}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={`${type}.addressLine2`}>Address Line 2 (Optional)</Label>
                <Input id={`${type}.addressLine2`} {...register(`${type}.addressLine2`)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.city`}>City</Label>
                    <Input id={`${type}.city`} {...register(`${type}.city`)} />
                    {errors?.[type]?.city && <p className="text-sm text-destructive">{errors?.[type]?.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.state`}>State / Province</Label>
                    <Input id={`${type}.state`} {...register(`${type}.state`)} />
                    {errors?.[type]?.state && <p className="text-sm text-destructive">{errors?.[type]?.state.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.zip`}>ZIP / Postal Code</Label>
                    <Input id={`${type}.zip`} {...register(`${type}.zip`)} />
                    {errors?.[type]?.zip && <p className="text-sm text-destructive">{errors?.[type]?.zip.message}</p>}
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor={`${type}.country`}>Country</Label>
                    <Input id={`${type}.country`} {...register(`${type}.country`)} />
                    {errors?.[type]?.country && <p className="text-sm text-destructive">{errors?.[type]?.country.message}</p>}
                </div>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor={`${type}.phone`}>Phone Number</Label>
                <Input id={`${type}.phone`} type="tel" {...register(`${type}.phone`)} />
                 {errors?.[type]?.phone && <p className="text-sm text-destructive">{errors?.[type]?.phone.message}</p>}
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

    const handleDummyPayment = async (data: CheckoutFormValues) => {
        if (!details) return;
        setIsPlacingOrder(true);
        try {
            const result = await processDummyPayment({
                amount: details.total,
                orderType: 'design',
                orderData: {
                    designId: details.design?.id,
                    uploadId: details.upload?.id,
                    quantity: details.quantity,
                    ...data,
                }
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Order placed using Dummy PG.' });
                router.push('/client/orders');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Dummy payment failed.' });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-4rem)]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }

    if (!details) {
        return <div className="text-center py-20">Could not load checkout information.</div>;
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

        const previewScale = 128 / productForCanvas.width;
        
        imagePreview = (
             <div style={{ width: 128, height: productForCanvas.height * previewScale, overflow: 'hidden', borderRadius: 'var(--radius)' }}>
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
        imagePreview = imageSrc ? <Image src={resolveImagePath(imageSrc)} alt={details.upload.originalFilename} width={128} height={128} className="rounded-md object-contain" /> : <File className="h-16 w-16 text-muted-foreground" />;
    }

    return (
        <div className="container mx-auto max-w-6xl py-12">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
                                <CardContent><AddressForm type="shippingAddress" register={register} errors={errors} /></CardContent>
                            </Card>
                             <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="use-shipping-for-billing"
                                    checked={useShippingForBilling}
                                    onCheckedChange={(checked) => methods.setValue('useShippingForBilling', !!checked)}
                                />
                                <Label htmlFor="use-shipping-for-billing">Billing address is the same as shipping</Label>
                            </div>
                            {!useShippingForBilling && (
                                <Card>
                                    <CardHeader><CardTitle>Billing Address</CardTitle></CardHeader>
                                    <CardContent><AddressForm type="billingAddress" register={register} errors={errors} /></CardContent>
                                </Card>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button type="submit" size="lg" className="flex-1" disabled={isPlacingOrder}>
                                    {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="lg" 
                                    className="flex-1 border-dashed border-primary/50 text-primary hover:bg-primary/5" 
                                    disabled={isPlacingOrder}
                                    onClick={handleSubmit(handleDummyPayment)}
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Dummy PG (Fast)
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </div>
                
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center">
                                    {imagePreview}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{details.product.name}</p>
                                    <p className="text-sm text-muted-foreground">{details.subProduct.name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {details.quantity}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Standard printing</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">₹{(details.originalTotal - ((details as any).customisation?.priceBreakup?.addons?.reduce((acc: number, addon: any) => acc + addon.totalAmount, 0) || 0)).toFixed(2)}</span>
                                </div>
                                
                                {(details as any).customisation?.priceBreakup?.addons?.map((addon: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            <span className="text-slate-600 dark:text-slate-400 font-semibold">{addon.name}</span>
                                        </div>
                                        <span className="font-bold text-primary/80">+ ₹{addon.totalAmount.toFixed(2)}</span>
                                    </div>
                                ))}

                                {details.totalDiscount > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <span>Saved {details.discountDescription ? `(${details.discountDescription})` : ''}</span>
                                        <span>- ₹{details.totalDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="text-green-600 font-bold text-xs uppercase tracking-wider">Free</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxes</span>
                                    <span className="text-slate-500 italic text-[11px]">Included</span>
                                </div>
                            </div>
                            <Separator />
                             <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{details.total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
