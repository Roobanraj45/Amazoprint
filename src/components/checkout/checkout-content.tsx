'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCheckoutDetails } from '@/app/actions/order-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
    Loader2, ArrowRight, File, ShieldCheck, Truck, Lock, Package2, CreditCard,
    CheckCircle2, Sparkles, MapPin, Phone, User, Building, Clock, Zap,
    HelpCircle, ChevronRight, ArrowLeft, RefreshCw, FileText
} from 'lucide-react';
import { processDummyPayment } from '@/app/actions/payment-actions';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { resolveImagePath, cn } from '@/lib/utils';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Product, Background } from '@/lib/types';

const addressSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  addressLine1: z.string().min(1, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string()
    .min(6, 'Postal code must be exactly 6 digits')
    .max(6, 'Postal code must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'Postal code must contain only numbers'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .length(10, 'Phone number must be 10 digits')
    .regex(/^[0-9]{10}$/, 'Phone number must contain only numbers'),
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
                <Label htmlFor={`${type}.name`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" /> Full Name / Company Contact
                </Label>
                <Input 
                    id={`${type}.name`} 
                    {...register(`${type}.name`)} 
                    className="h-11 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                    placeholder="e.g. Rajesh Kumar" 
                />
                {errors?.[type]?.name && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.name.message}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor={`${type}.addressLine1`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Street Address / Flat & Building
                </Label>
                <Input 
                    id={`${type}.addressLine1`} 
                    {...register(`${type}.addressLine1`)} 
                    className="h-11 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                    placeholder="e.g. 402, Lotus Grandeur, Veera Desai Road" 
                />
                 {errors?.[type]?.addressLine1 && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.addressLine1.message}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor={`${type}.addressLine2`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-indigo-500" /> Landmark / Area (Optional)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </Label>
                <Input 
                    id={`${type}.addressLine2`} 
                    {...register(`${type}.addressLine2`)} 
                    className="h-11 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                    placeholder="e.g. Near Infinity Mall, Andheri West" 
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.city`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">City</Label>
                    <Input 
                        id={`${type}.city`} 
                        {...register(`${type}.city`)} 
                        className="h-11 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                        placeholder="e.g. Mumbai" 
                    />
                    {errors?.[type]?.city && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.state`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">State</Label>
                    <Input 
                        id={`${type}.state`} 
                        {...register(`${type}.state`)} 
                        className="h-11 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                        placeholder="e.g. Maharashtra" 
                    />
                    {errors?.[type]?.state && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.state.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                    <Label htmlFor={`${type}.zip`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">PIN / Postal Code</Label>
                    <Input 
                      id={`${type}.zip`} 
                      maxLength={6}
                      placeholder="e.g. 400053"
                      {...register(`${type}.zip`, {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }
                      })}
                      className="h-11 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                    />
                    {errors?.[type]?.zip && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.zip.message}</p>}
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor={`${type}.country`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Country</Label>
                    <Input 
                        id={`${type}.country`} 
                        {...register(`${type}.country`)} 
                        className="h-11 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                        placeholder="India" 
                    />
                    {errors?.[type]?.country && <p className="text-[11px] font-bold text-rose-500">{errors?.[type]?.country.message}</p>}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor={`${type}.phone`} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" /> Phone Number (For Courier Updates)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">10 Digits</span>
                </Label>
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">+91</span>
                    <Input 
                      id={`${type}.phone`} 
                      type="tel" 
                      maxLength={10}
                      placeholder="9876543210"
                      {...register(`${type}.phone`, {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }
                      })} 
                      className="h-11 pl-12 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-xs shadow-inner px-3.5 transition-all" 
                    />
                </div>
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
            useShippingForBilling: true,
            shippingAddress: {
                country: 'India',
            }
        }
    });

    const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;
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

    const handleQuickAutofill = () => {
        setValue('shippingAddress.name', 'Rajesh Sharma', { shouldValidate: true });
        setValue('shippingAddress.addressLine1', '402, Lotus Heights, Link Road', { shouldValidate: true });
        setValue('shippingAddress.addressLine2', 'Near Metro Station, Andheri West', { shouldValidate: true });
        setValue('shippingAddress.city', 'Mumbai', { shouldValidate: true });
        setValue('shippingAddress.state', 'Maharashtra', { shouldValidate: true });
        setValue('shippingAddress.zip', '400053', { shouldValidate: true });
        setValue('shippingAddress.country', 'India', { shouldValidate: true });
        setValue('shippingAddress.phone', '9876543210', { shouldValidate: true });
        toast({ title: 'Sample Address Filled', description: 'Test address loaded into shipping form.' });
    };

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
        return (
            <div className="flex flex-col justify-center items-center min-h-[80vh] bg-slate-50 dark:bg-slate-950 space-y-4 p-6">
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
                    <Package2 className="w-6 h-6 text-indigo-600 absolute" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Preparing Your Checkout Experience</p>
                    <p className="text-xs text-slate-400 font-medium">Validating print configurations and delivery speed...</p>
                </div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[80vh] bg-slate-50 dark:bg-slate-950 space-y-4 p-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Could not load checkout information</h2>
                <p className="text-xs text-slate-500 max-w-sm">The design or upload could not be retrieved. Please return to the product customizer.</p>
                <Button asChild size="sm" className="rounded-xl font-bold text-xs">
                    <Link href="/products">Explore Products</Link>
                </Button>
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

        const previewScale = 90 / productForCanvas.width;
        
        imagePreview = (
             <div style={{ width: 90, height: Math.max(60, productForCanvas.height * previewScale), overflow: 'hidden', borderRadius: '1rem' }} className="shadow-md border border-white/20 bg-slate-900 flex items-center justify-center">
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
        imagePreview = imageSrc ? (
            <Image 
                src={resolveImagePath(imageSrc)} 
                alt={details.upload.originalFilename} 
                width={90} 
                height={90} 
                className="rounded-2xl object-contain shadow-md border border-white/20 bg-slate-900" 
            />
        ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
                <File className="h-8 w-8 text-white/60" />
            </div>
        );
    }

    const delivery = (details as any).deliveryOption || (details as any).customisation?.deliveryOption || (details as any).customisation?.priceBreakup?.delivery || {
        id: 'standard',
        name: 'Standard Delivery',
        days: details.subProduct.deliveryDays || '3-5 Business Days',
        fee: Number(details.subProduct.deliveryAmount || 0),
    };
    const isExpedited = delivery.id && delivery.id !== 'standard';
    const deliveryFee = Number(delivery.fee || 0);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 md:py-12 px-4 sm:px-6 lg:px-8 transition-colors relative overflow-hidden">
            {/* Subtle Gradient Atmosphere */}
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10 space-y-8">
                
                {/* Stepper & Top Navigation Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 md:px-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-900 gap-1.5 h-9">
                            <Link href={`/design/${details.product.slug}/start?subProductId=${details.subProduct.id}`}>
                                <ArrowLeft className="w-4 h-4" /> Back to Customizer
                            </Link>
                        </Button>
                        <Separator orientation="vertical" className="h-5 bg-slate-200 dark:bg-slate-800" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{details.product.name}</span>
                            <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                                {details.subProduct.name}
                            </Badge>
                        </div>
                    </div>

                    {/* 3-Step Progress Indicators */}
                    <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <span className="hidden sm:inline">1. Customization</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs shadow-indigo-500/30">
                                2
                            </div>
                            <span>2. Shipping & Details</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                                3
                            </div>
                            <span className="hidden sm:inline">3. Payment</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Delivery & Shipping Forms */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* 1. Chosen Delivery Speed Banner */}
                        <div className={cn(
                            "rounded-3xl p-5 md:p-6 border relative overflow-hidden transition-all shadow-xs",
                            isExpedited 
                                ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 dark:border-amber-500/20"
                                : "bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/20 dark:border-indigo-500/15"
                        )}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn(
                                            "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                                            isExpedited ? "bg-amber-600 text-white" : "bg-indigo-600 text-white"
                                        )}>
                                            {isExpedited ? <Zap className="w-3 h-3 mr-1 inline animate-pulse" /> : <Truck className="w-3 h-3 mr-1 inline" />}
                                            {delivery.name}
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Estimated Turnaround: <span className="text-indigo-600 dark:text-indigo-400 font-black">{delivery.days}</span>
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {isExpedited 
                                            ? 'Priority press queue with expedited air courier shipping.' 
                                            : 'Standard high-definition press run with insured surface shipping.'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Shipping Fee</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                        {deliveryFee > 0 ? `₹${deliveryFee.toFixed(2)}` : 'Free Delivery'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Shipping Address Form */}
                        <FormProvider {...methods}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                
                                <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 dark:shadow-black/20 overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-xl">
                                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                                                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs shadow-indigo-500/30">
                                                    1
                                                </div>
                                                Shipping Address
                                            </CardTitle>
                                            <CardDescription className="text-xs text-slate-500 mt-1">
                                                Where should we dispatch your finished printed cards?
                                            </CardDescription>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={handleQuickAutofill}
                                            className="h-8 rounded-xl text-[11px] font-bold border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1.5"
                                        >
                                            <Sparkles className="w-3 h-3" /> Quick Autofill
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-5 md:p-6">
                                        <AddressForm type="shippingAddress" register={register} errors={errors} />
                                    </CardContent>
                                </Card>

                                {/* 3. Billing Address Checkbox / Card */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="use-shipping-for-billing"
                                            checked={useShippingForBilling}
                                            onCheckedChange={(checked) => methods.setValue('useShippingForBilling', !!checked)}
                                            className="h-4.5 w-4.5 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <Label htmlFor="use-shipping-for-billing" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                            Billing address is the same as shipping address
                                        </Label>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] text-slate-400 font-bold hidden sm:inline-flex">
                                        GST Invoice
                                    </Badge>
                                </div>

                                {!useShippingForBilling && (
                                    <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md overflow-hidden bg-white dark:bg-slate-900/90 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                                                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs shadow-indigo-500/30">
                                                    2
                                                </div>
                                                Billing Address
                                            </CardTitle>
                                            <CardDescription className="text-xs text-slate-500 mt-1">
                                                Details for tax invoice & financial receipts
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-5 md:p-6">
                                            <AddressForm type="billingAddress" register={register} errors={errors} />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* 4. Payment Method & Authorization */}
                                <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 dark:shadow-black/20 overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-xl">
                                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 p-5 md:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                                                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs shadow-indigo-500/30">
                                                        {useShippingForBilling ? '2' : '3'}
                                                    </div>
                                                    Payment Method
                                                </CardTitle>
                                                <CardDescription className="text-xs text-slate-500 mt-1">
                                                    Choose your preferred secure payment method
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                                <Lock className="w-3 h-3" /> 256-Bit SSL
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 md:p-6 space-y-4">
                                        {/* Primary Gateway Option */}
                                        <div className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center mt-0.5 shrink-0 bg-white dark:bg-slate-900">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Razorpay Secure Gateway</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                                                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                                                    UPI / CARDS
                                                </span>
                                            </div>
                                        </div>

                                        {/* Main Primary Button */}
                                        <Button 
                                            type="submit" 
                                            size="lg"
                                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 transition-all text-sm flex items-center justify-between px-6 cursor-pointer" 
                                            disabled={isPlacingOrder}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isPlacingOrder ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                                                <span>Pay ₹{details.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} & Place Order</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-xl text-xs font-bold">
                                                <span>Razorpay</span>
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </div>
                                        </Button>

                                        {/* Secondary Developer / Test PG Option */}
                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span>Test mode or sandbox account?</span>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                className="h-8 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] font-bold gap-1.5 border border-slate-200 dark:border-slate-800" 
                                                disabled={isPlacingOrder}
                                                onClick={handleSubmit(handleDummyPayment)}
                                            >
                                                <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                                                <span>Instant Test Payment (Dummy PG)</span>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="text-center space-y-1">
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        By placing your order, you agree to AmazoPrint&apos;s Print Terms & Refund Policy.
                                    </p>
                                </div>
                            </form>
                        </FormProvider>
                    </div>

                    {/* Right Column: Sticky Live Blueprint Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-20 bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
                            
                            {/* Decorative Background Glows */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <Package2 className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black tracking-tight text-white">Order Summary</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">Live Blueprint & Cost Breakdown</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold text-indigo-300 border-indigo-500/30 uppercase tracking-widest bg-indigo-500/10">
                                    Ready to Print
                                </Badge>
                            </div>

                            {/* Item Presentation */}
                            <div className="flex items-center gap-4 relative z-10 bg-white/5 p-3 rounded-2xl border border-white/10">
                                <div className="shrink-0 flex items-center justify-center">
                                    {imagePreview}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <p className="font-black text-sm text-white truncate">{details.product.name}</p>
                                    <p className="text-xs font-bold text-indigo-300 truncate">{details.subProduct.name}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <Badge className="bg-white/10 hover:bg-white/15 text-slate-200 text-[10px] font-bold px-2 py-0.5 border-0">
                                            {details.quantity} Cards
                                        </Badge>
                                        <Badge className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 border",
                                            isExpedited ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                        )}>
                                            <Truck className="w-2.5 h-2.5 mr-1 inline" />
                                            {delivery.name}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Specification Chips */}
                            {(() => {
                                const custom = (details as any).customisation || {};
                                const isDouble = custom.pages === 2 || custom.pages === '2';
                                const spotUv = custom.spotUv;
                                const dieCutName = custom.dieCut?.name;
                                const textureName = custom.cardTexture?.name;

                                return (
                                    <div className="grid grid-cols-2 gap-2 text-[11px] relative z-10">
                                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Sides</span>
                                            <span className="font-bold text-slate-200">{isDouble ? 'Double Sided' : 'Single Sided'}</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Dimensions</span>
                                            <span className="font-bold text-slate-200">
                                                {details.design?.width || details.upload?.width || details.subProduct.width || 'Custom'} × {details.design?.height || details.upload?.height || details.subProduct.height || 'Custom'} mm
                                            </span>
                                        </div>
                                        {spotUv && (
                                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                                <span className="text-[9px] text-amber-400 font-bold uppercase block">Spot UV Gloss</span>
                                                <span className="font-bold">Included</span>
                                            </div>
                                        )}
                                        {dieCutName && (
                                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                                                <span className="text-[9px] text-indigo-400 font-bold uppercase block">Die Cut Shape</span>
                                                <span className="font-bold">{dieCutName}</span>
                                            </div>
                                        )}
                                        {textureName && (
                                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                                <span className="text-[9px] text-purple-400 font-bold uppercase block">Paper Texture</span>
                                                <span className="font-bold">{textureName}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <Separator className="bg-white/10 relative z-10" />

                            {/* Itemized Financial Breakdown */}
                            <div className="space-y-2.5 text-xs relative z-10">
                                {(() => {
                                    const breakup = (details as any).customisation?.priceBreakup;
                                    const addons = breakup?.addons || [];
                                    const addonsTotal = addons.reduce((acc: number, addon: any) => acc + (addon.totalAmount || 0), 0);
                                    const basePrintingAmount = typeof breakup?.basePriceTotal === 'number' 
                                        ? breakup.basePriceTotal 
                                        : (details.originalTotal - addonsTotal - deliveryFee);

                                    return (
                                        <>
                                            <div className="flex justify-between items-center text-slate-300 font-medium">
                                                <span>Base Printing ({details.quantity} Cards)</span>
                                                <span className="font-bold text-white">
                                                    ₹{basePrintingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            
                                            {addons.map((addon: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-[11px] items-center py-1 border-t border-white/5">
                                                    <div className="flex items-center gap-1.5 text-slate-300">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                        <span className="font-semibold">{addon.name}</span>
                                                    </div>
                                                    <span className="font-bold text-indigo-300">+ ₹{(addon.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))}
                                        </>
                                    );
                                })()}

                                {details.totalDiscount > 0 && (
                                    <div className="flex justify-between text-[11px] font-black text-emerald-400 bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30 shadow-inner items-center">
                                        <span>Volume Savings {details.discountDescription ? `(${details.discountDescription})` : ''}</span>
                                        <span>- ₹{details.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-slate-300 font-medium pt-1 border-t border-white/5">
                                    <span className="flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>{delivery.name} ({delivery.days})</span>
                                    </span>
                                    {deliveryFee > 0 ? (
                                        <span className="font-black text-indigo-300 text-[11px]">+ ₹{deliveryFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    ) : (
                                        <span className="text-emerald-400 font-black text-[10px] uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Free</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-slate-300 font-medium">
                                    <span>Taxes & GST (18%)</span>
                                    <span className="text-slate-400 italic text-[11px] font-bold">Inclusive</span>
                                </div>
                            </div>

                            <Separator className="bg-white/10 relative z-10" />

                            {/* Total Payable */}
                            <div className="flex justify-between items-baseline font-black text-xl text-white pt-1 relative z-10">
                                <div>
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payable</span>
                                    <span className="text-[10px] font-medium text-slate-500">All taxes & shipping included</span>
                                </div>
                                <span className="text-2xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
                                    ₹{details.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Summary Card Payment Trigger */}
                            <div className="pt-2 relative z-10">
                                <Button 
                                    type="button" 
                                    size="lg"
                                    onClick={handleSubmit(onSubmit)}
                                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-extrabold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all text-xs gap-2"
                                    disabled={isPlacingOrder}
                                >
                                    {isPlacingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                    <span>Pay ₹{details.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Trust Badges */}
                            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-slate-400 text-[10px] font-bold relative z-10">
                                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 border border-white/5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>100% Quality Guaranteed</span>
                                </div>
                                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 border border-white/5">
                                    <Truck className="w-4 h-4 text-indigo-400 shrink-0" />
                                    <span>{delivery.days} Delivery</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
