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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, ArrowRight, ArrowLeft, IndianRupee, ShoppingCart,
  Trash2, Plus, Minus, Sparkles, ShieldCheck, Truck, Package2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { resolveImagePath } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';

const addressSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  addressLine1: z.string().min(1, 'Street address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit Indian PIN code'),
  country: z.string().default('India'),
});

const checkoutSchema = z.object({
  shippingAddress: addressSchema,
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function AddressForm({ register, errors }: { register: any; errors: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5 sm:col-span-1">
        <Label htmlFor="shippingAddress.name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Recipient Full Name *
        </Label>
        <Input
          id="shippingAddress.name"
          placeholder="e.g. Ramesh Kumar"
          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          {...register('shippingAddress.name')}
        />
        {errors?.shippingAddress?.name && (
          <p className="text-xs font-semibold text-rose-500">{errors.shippingAddress.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5 sm:col-span-1">
        <Label htmlFor="shippingAddress.phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Mobile Number *
        </Label>
        <Input
          id="shippingAddress.phone"
          type="tel"
          placeholder="e.g. 9876543210"
          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          {...register('shippingAddress.phone')}
        />
        {errors?.shippingAddress?.phone && (
          <p className="text-xs font-semibold text-rose-500">{errors.shippingAddress.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="shippingAddress.addressLine1" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Door No., Building, Street Address *
        </Label>
        <Input
          id="shippingAddress.addressLine1"
          placeholder="e.g. Flat 402, Sunshine Apartments, 1st Cross"
          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          {...register('shippingAddress.addressLine1')}
        />
        {errors?.shippingAddress?.addressLine1 && (
          <p className="text-xs font-semibold text-rose-500">{errors.shippingAddress.addressLine1.message}</p>
        )}
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="shippingAddress.addressLine2" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Landmark / Area (Optional)
        </Label>
        <Input
          id="shippingAddress.addressLine2"
          placeholder="e.g. Near Metro Station / Behind City Hospital"
          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          {...register('shippingAddress.addressLine2')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingAddress.city" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          City *
        </Label>
        <Input
          id="shippingAddress.city"
          placeholder="e.g. Chennai"
          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          {...register('shippingAddress.city')}
        />
        {errors?.shippingAddress?.city && (
          <p className="text-xs font-semibold text-rose-500">{errors.shippingAddress.city.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingAddress.state" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          State *
        </Label>
        <Input
          id="shippingAddress.state"
          placeholder="e.g. Tamil Nadu"
          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          {...register('shippingAddress.state')}
        />
        {errors?.shippingAddress?.state && (
          <p className="text-xs font-semibold text-rose-500">{errors.shippingAddress.state.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingAddress.zip" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          PIN Code (6 digits) *
        </Label>
        <Input
          id="shippingAddress.zip"
          maxLength={6}
          placeholder="e.g. 600001"
          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
          {...register('shippingAddress.zip')}
        />
        {errors?.shippingAddress?.zip && (
          <p className="text-xs font-semibold text-rose-500">{errors.shippingAddress.zip.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingAddress.country" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Country
        </Label>
        <Input
          id="shippingAddress.country"
          defaultValue="India"
          readOnly
          className="h-11 rounded-xl bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold cursor-not-allowed"
          {...register('shippingAddress.country')}
        />
      </div>
    </div>
  );
}

export default function CartCheckoutPage() {
  const { items, subtotal, totalItems, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        country: 'India',
      },
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  // Shipping calculation: Free on ₹499+
  const shippingFee = subtotal >= 499 || items.length === 0 ? 0 : 49;
  const finalTotal = subtotal + shippingFee;

  const onSubmit = (data: CheckoutFormValues) => {
    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'Empty Order', description: 'Your draft has no items.' });
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Map all items to the exact order format required by placeDirectOrder & PaymentContent
      const mappedItems = items.map((item) => {
        const sellingPrice = parseFloat(String(item.sellingPrice || item.unitPrice || '0'));
        const qty = Number(item.quantity) || 1;
        const totalAmount = (sellingPrice * qty).toFixed(2);
        const imgSrc = item.image || item.imageUrl || (item.imageUrls && item.imageUrls[0]) || '/uploads/hero.png';

        const selectedSize =
          item.selectedSize ||
          item.selectedAttributes?.['Size'] ||
          item.selectedAttributes?.['Size / Dimensions'] ||
          item.selectedAttributes?.['Dimensions'] ||
          undefined;

        const selectedAttributesFormatted =
          item.selectedAttributesFormatted ||
          (item.selectedAttributes && typeof item.selectedAttributes === 'object'
            ? Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')
            : undefined);

        return {
          id: item.id || item.productId,
          productId: item.id || item.productId,
          directSellingProductId: item.id || item.productId,
          name: item.name,
          category: item.category,
          image: imgSrc,
          imageUrl: imgSrc,
          imageUrls: [imgSrc],
          sellingPrice: sellingPrice.toFixed(2),
          unitPrice: sellingPrice.toFixed(2),
          baseUnitPrice: item.baseUnitPrice || sellingPrice.toFixed(2),
          quantity: qty,
          totalAmount: totalAmount,
          sku: item.sku,
          hsnCode: item.hsnCode,
          selectedAttributes: item.selectedAttributes || {},
          selectedSize: selectedSize,
          selectedAttributesFormatted: selectedAttributesFormatted,
          customText: item.customText || undefined,
          shippingFee: 0,
          deliveryMode: 'standard',
          taxDetails: item.taxDetails || [],
          taxAmount: item.taxAmount || 0,
          pricingBreakdown: item.pricingBreakdown || {
            unitPrice: sellingPrice.toFixed(2),
            quantity: qty,
            productSubtotal: totalAmount,
            totalAmount: totalAmount,
          },
        };
      });

      const orderPayload = {
        orderData: {
          items: mappedItems,
          shippingAddress: data.shippingAddress,
          orderNotes: `Ordered multiple direct items (${mappedItems.length} items, total ${totalItems} units)`,
        },
        amount: finalTotal,
        items: mappedItems,
        shippingAddress: data.shippingAddress,
      };

      const encodedData = btoa(encodeURIComponent(JSON.stringify(orderPayload)));
      router.push(`/payment?orderType=direct&orderData=${encodedData}`);
    } catch (error: any) {
      console.error('Checkout preparation error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not proceed to payment.' });
      setIsPlacingOrder(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Your Draft Orders are Empty</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
          You don&apos;t have any quick selling items saved in draft yet. Browse our catalog, customize your products, and add them to draft to order multiple items together!
        </p>
        <Button asChild className="h-12 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-lg shadow-amber-500/25">
          <Link href="/products">
            <Package2 className="w-4 h-4 mr-2" />
            Explore Quick Selling Products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1528] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="rounded-xl h-9 px-2 text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Draft Orders Checkout
                <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                  {totalItems} {totalItems === 1 ? 'unit' : 'units'}
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order multiple configured items and variations together in one simple transaction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800"
            >
              <Link href="/products">
                + Add More Items
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Clear All Drafts
            </Button>
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Draft Items & Shipping Address (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Review & Edit Draft Items */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <Package2 className="w-5 h-5 text-amber-500" />
                        Configured Items ({items.length} {items.length === 1 ? 'product' : 'distinct configurations'})
                      </CardTitle>
                      <span className="text-xs font-semibold text-slate-400">
                        Total {totalItems} units
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {items.map((item) => {
                      const itemKey = item.cartItemId || String(item.id);
                      const imgSrc = resolveImagePath(
                        item.image || item.imageUrl || (item.imageUrls && item.imageUrls[0]) || '/uploads/hero.png'
                      );
                      const unitPrice = Number(item.sellingPrice || item.unitPrice || 0);
                      const lineTotal = unitPrice * item.quantity;

                      return (
                        <div
                          key={itemKey}
                          className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 transition-all hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          <div className="flex gap-3 sm:gap-4">
                            <div className="relative h-20 w-20 sm:h-22 sm:w-22 flex-shrink-0 overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                              <Image
                                src={imgSrc}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex flex-1 flex-col justify-between min-w-0">
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                                    {item.name}
                                  </h3>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(itemKey)}
                                    className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg shrink-0"
                                    title="Remove from draft"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                {item.category && (
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                    {item.category}
                                  </span>
                                )}

                                {/* Attributes Pills */}
                                {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {Object.entries(item.selectedAttributes).map(([k, v]) => (
                                      <span
                                        key={k}
                                        className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                                      >
                                        {k}: {String(v)}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Custom Text Inscription */}
                                {item.customText && (
                                  <div className="mt-1 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span className="font-semibold">Text:</span> &quot;{item.customText}&quot;
                                  </div>
                                )}
                              </div>

                              {/* Price & Quantity Controls */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 mt-1">
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateQuantity(itemKey, Math.max(1, item.quantity - 1))}
                                    disabled={item.quantity <= 1}
                                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-700 disabled:opacity-30"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (!isNaN(val) && val >= 1) {
                                        updateQuantity(itemKey, val);
                                      }
                                    }}
                                    className="h-7 w-12 text-center text-xs font-bold px-1 rounded-lg border-slate-200 dark:border-slate-700"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-700"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                <div className="text-right">
                                  <span className="text-[11px] text-slate-400 block">
                                    ₹{unitPrice.toFixed(2)} × {item.quantity}
                                  </span>
                                  <span className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-end">
                                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                    {lineTotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* 2. Shipping Address */}
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Truck className="w-5 h-5 text-amber-500" />
                      Shipping & Delivery Address
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Provide the destination address where all multiple items should be dispatched.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6">
                    <AddressForm register={register} errors={errors} />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Order Summary & Checkout Action (5 cols) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span>Order Summary</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {totalItems} items
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Items Subtotal ({totalItems} units)</span>
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                          {subtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Estimated Shipping</span>
                        {shippingFee === 0 ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            FREE Delivery
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {shippingFee.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {shippingFee > 0 && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                          💡 Add items worth ₹{(499 - subtotal).toFixed(2)} more to unlock <strong>FREE Shipping</strong>!
                        </p>
                      )}

                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>GST / Taxes</span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Included / Computed at Invoice
                        </span>
                      </div>
                    </div>

                    <Separator className="border-slate-100 dark:border-slate-800" />

                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        Total Amount Payable
                      </span>
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center">
                        <IndianRupee className="w-6 h-6 mr-0.5" />
                        {finalTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isPlacingOrder || items.length === 0}
                        className="w-full h-14 rounded-2xl font-black text-base bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                      >
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Preparing Payment...
                          </>
                        ) : (
                          <>
                            Proceed to Payment ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>100% Secure Checkout via Razorpay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>All multiple items packaged & shipped together</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
