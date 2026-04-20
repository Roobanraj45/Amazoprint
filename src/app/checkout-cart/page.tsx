'use client';

import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, IndianRupee, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { resolveImagePath } from '@/lib/utils';
import { useState, useEffect } from 'react';

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
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function AddressForm({ register, errors }: { register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="shippingAddress.name">Full Name</Label>
                <Input id="shippingAddress.name" {...register('shippingAddress.name')} />
                {errors?.shippingAddress?.name && <p className="text-sm text-destructive">{errors.shippingAddress.name.message}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="shippingAddress.addressLine1">Address Line 1</Label>
                <Input id="shippingAddress.addressLine1" {...register('shippingAddress.addressLine1')} />
                 {errors?.shippingAddress?.addressLine1 && <p className="text-sm text-destructive">{errors.shippingAddress.addressLine1.message}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="shippingAddress.addressLine2">Address Line 2 (Optional)</Label>
                <Input id="shippingAddress.addressLine2" {...register('shippingAddress.addressLine2')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="shippingAddress.city">City</Label>
                    <Input id="shippingAddress.city" {...register('shippingAddress.city')} />
                    {errors?.shippingAddress?.city && <p className="text-sm text-destructive">{errors.shippingAddress.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="shippingAddress.state">State</Label>
                    <Input id="shippingAddress.state" {...register('shippingAddress.state')} />
                    {errors?.shippingAddress?.state && <p className="text-sm text-destructive">{errors.shippingAddress.state.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="shippingAddress.zip">ZIP Code</Label>
                    <Input id="shippingAddress.zip" {...register('shippingAddress.zip')} />
                    {errors?.shippingAddress?.zip && <p className="text-sm text-destructive">{errors.shippingAddress.zip.message}</p>}
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="shippingAddress.country">Country</Label>
                    <Input id="shippingAddress.country" {...register('shippingAddress.country')} />
                    {errors?.shippingAddress?.country && <p className="text-sm text-destructive">{errors.shippingAddress.country.message}</p>}
                </div>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="shippingAddress.phone">Phone</Label>
                <Input id="shippingAddress.phone" type="tel" {...register('shippingAddress.phone')} />
                 {errors?.shippingAddress?.phone && <p className="text-sm text-destructive">{errors.shippingAddress.phone.message}</p>}
            </div>
        </div>
    );
}

export default function CartCheckoutPage() {
    const { items, subtotal, totalItems } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const methods = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
    });

    const { register, handleSubmit, formState: { errors } } = methods;

    const onSubmit = (data: CheckoutFormValues) => {
        setIsPlacingOrder(true);
        try {
            const orderPayload = {
                orderData: {
                    items,
                    shippingAddress: data.shippingAddress,
                },
                amount: subtotal,
                items: items,
                shippingAddress: data.shippingAddress,
            };

            const encodedData = btoa(encodeURIComponent(JSON.stringify(orderPayload)));
            router.push(`/payment?orderType=direct&orderData=${encodedData}`);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not proceed to payment.' });
            setIsPlacingOrder(false);
        }
    };
    
    if (!isMounted) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    
    if (items.length === 0) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-center">
                <p>Your cart is empty. Please add items before checking out.</p>
            </div>
        )
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
                                <CardContent><AddressForm register={register} errors={errors} /></CardContent>
                            </Card>
                            <Button type="submit" size="lg" className="w-full" disabled={isPlacingOrder}>
                                {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </FormProvider>
                </div>
                
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                            <CardDescription>{totalItems} items</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {items.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                     <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                        {item.imageUrls?.[0] ? (
                                            <Image src={resolveImagePath(item.imageUrls[0])} alt={item.name} fill className="object-cover" />
                                        ) : <ShoppingCart className="h-8 w-8 text-muted-foreground" />}
                                     </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-medium flex items-center"><IndianRupee size={12}/>{(Number(item.sellingPrice) * item.quantity).toFixed(2)}</p>
                                </div>
                           ))}
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="flex items-center"><IndianRupee size={12}/>{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="text-green-600">FREE</span>
                                </div>
                            </div>
                            <Separator />
                             <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="flex items-center"><IndianRupee size={16}/>{subtotal.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
