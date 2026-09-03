'use client';

import { useState, useMemo } from 'react';
import {
    Sparkles, Package2, ArrowRight, ArrowLeft, CheckCircle2,
    IndianRupee, Star, Zap, Flame, AlertCircle, ShieldCheck,
    Truck, Lock, Share2, Check, Coins, Percent, Receipt
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductImageZoom } from '@/components/ui/product-image-zoom';
import { resolveImagePath, cn } from '@/lib/utils';

interface DirectProductDetailClientProps {
    product: any;
}

export function DirectProductDetailClient({ product }: DirectProductDetailClientProps) {
    const router = useRouter();
    const { toast } = useToast();

    // Helper to normalize sizes
    const getProductSizes = (prod: any): { name: string; price?: number }[] => {
        if (!prod || !prod.sizes) return [];
        const raw = prod.sizes;
        if (Array.isArray(raw)) {
            return raw.map((s: any) => {
                if (typeof s === 'string') return { name: s };
                return { name: s.name || s.size || String(s), price: s.price ? Number(s.price) : undefined };
            });
        }
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return parsed.map((s: any) => {
                        if (typeof s === 'string') return { name: s };
                        return { name: s.name || s.size || String(s), price: s.price ? Number(s.price) : undefined };
                    });
                }
            } catch {
                return raw.split(',').map(s => ({ name: s.trim() })).filter(s => s.name);
            }
        }
        return [];
    };

    const sizes = useMemo(() => getProductSizes(product), [product]);

    // Active Slabs & Taxes
    const taxSlabs = useMemo(() => {
        if (product.taxSlabs && Array.isArray(product.taxSlabs)) {
            return product.taxSlabs.filter((t: any) => t.isActive !== false);
        }
        return [];
    }, [product]);

    const priceSlabs = useMemo(() => {
        if (product.priceSlabs && Array.isArray(product.priceSlabs)) {
            return product.priceSlabs
                .filter((s: any) => s.isActive !== false)
                .sort((a: any, b: any) => Number(a.quantity) - Number(b.quantity));
        }
        return [];
    }, [product]);

    const images: string[] = useMemo(() => {
        if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
            return product.imageUrls;
        }
        return ['/uploads/hero.png'];
    }, [product]);

    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
    const [selectedSize, setSelectedSize] = useState<string>(sizes.length > 0 ? sizes[0].name : '');
    const [quantity, setQuantity] = useState<number>(() => {
        if (product.priceSlabs && Array.isArray(product.priceSlabs)) {
            const active = product.priceSlabs.filter((s: any) => s.isActive !== false);
            if (active.length > 0) return Number(active[0].quantity);
        }
        return 1;
    });
    const [customText, setCustomText] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    const [shippingAddress, setShippingAddress] = useState({
        name: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
    });

    const stock = typeof product.stockQuantity === 'number'
        ? product.stockQuantity
        : (parseInt(product.stockQuantity as any) || 0);
    const minStock = product.minStockLevel || 5;

    // Calculate active unit price based on selected size
    const activeUnitPrice = useMemo(() => {
        const matchingSize = sizes.find(s => s.name === selectedSize);
        if (matchingSize && matchingSize.price && matchingSize.price > 0) {
            return matchingSize.price;
        }
        return Number(product.sellingPrice || 0);
    }, [sizes, selectedSize, product]);

    // Match quantity with price slab if applicable
    const matchingSlab = useMemo(() => {
        return priceSlabs.find((s: any) => Number(s.quantity) === quantity);
    }, [priceSlabs, quantity]);

    const productTotal = useMemo(() => {
        if (matchingSlab) {
            return Number(matchingSlab.price);
        }
        return activeUnitPrice * quantity;
    }, [matchingSlab, activeUnitPrice, quantity]);

    const effectiveUnitRate = useMemo(() => {
        if (quantity > 0) {
            return productTotal / quantity;
        }
        return activeUnitPrice;
    }, [productTotal, quantity, activeUnitPrice]);

    // GST / Tax Calculation
    const taxBreakdown = useMemo(() => {
        let extraTaxAmount = 0;
        const details: Array<{ name: string; rate: number; amount: number; isInclusive: boolean }> = [];

        taxSlabs.forEach((tax: any) => {
            const rate = Number(tax.rate) || 0;
            if (tax.isInclusive) {
                const taxPart = productTotal - (productTotal / (1 + rate / 100));
                details.push({
                    name: tax.name,
                    rate,
                    amount: taxPart,
                    isInclusive: true,
                });
            } else {
                const taxPart = productTotal * (rate / 100);
                extraTaxAmount += taxPart;
                details.push({
                    name: tax.name,
                    rate,
                    amount: taxPart,
                    isInclusive: false,
                });
            }
        });

        return {
            details,
            extraTaxAmount,
        };
    }, [taxSlabs, productTotal]);

    const basePrice = Number(product.basePrice || 0);
    const hasDiscount = basePrice > activeUnitPrice;
    const discountPercent = hasDiscount ? Math.round(((basePrice - activeUnitPrice) / basePrice) * 100) : 0;
    const totalPayable = productTotal + taxBreakdown.extraTaxAmount;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.name,
                text: product.description || `Check out ${product.name} on Amazoprint`,
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast({ title: 'Link copied to clipboard!' });
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (stock <= 0) {
            toast({ variant: 'destructive', title: 'Out of Stock', description: 'This item is currently sold out.' });
            return;
        }

        if (sizes.length > 0 && !selectedSize) {
            toast({ variant: 'destructive', title: 'Select Size', description: 'Please choose a size before proceeding.' });
            return;
        }

        if (product.textAllowed && !customText.trim()) {
            toast({ variant: 'destructive', title: 'Customization Missing', description: 'Please enter your customization text or name.' });
            return;
        }

        if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
            toast({ variant: 'destructive', title: 'Address Incomplete', description: 'Please fill in all shipping address fields.' });
            return;
        }

        setIsSubmitting(true);

        const orderPayload = {
            orderData: {
                items: [{
                    id: product.id,
                    name: product.name,
                    sellingPrice: Number(effectiveUnitRate).toFixed(2),
                    totalAmount: totalPayable.toFixed(2),
                    quantity: quantity,
                    sku: product.sku,
                    hsnCode: product.hsnCode || undefined,
                    selectedSize: selectedSize || undefined,
                    customText: customText.trim() || undefined,
                }],
                shippingAddress: shippingAddress,
            },
            amount: totalPayable,
            items: [{
                name: product.name,
                quantity: quantity,
                selectedSize: selectedSize || undefined,
                customText: customText.trim() || undefined,
            }],
            shippingAddress: shippingAddress,
        };

        const encodedData = btoa(encodeURIComponent(JSON.stringify(orderPayload)));
        router.push(`/payment?orderType=direct&orderData=${encodedData}`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1528] py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* ── BREADCRUMB & BACK ACTION ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Link href="/products" className="hover:text-primary transition-colors flex items-center gap-1">
                            <ArrowLeft size={14} /> Back to Catalog
                        </Link>
                        <span>/</span>
                        <span className="text-slate-700 dark:text-slate-300">{product.category || 'Direct Order'}</span>
                        <span>/</span>
                        <span className="text-slate-900 dark:text-white font-extrabold line-clamp-1">{product.name}</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="h-8 rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800"
                    >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                        {copied ? 'Copied' : 'Share'}
                    </Button>
                </div>

                {/* ── MAIN CONTENT GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* ── LEFT COLUMN: PRODUCT GALLERY & DESCRIPTION ── */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Main Media Preview Card with Flipkart-Style Loupe & Side Zoom Popup */}
                        <div className="relative aspect-square w-full">
                            <ProductImageZoom
                                src={resolveImagePath(images[activeImageIndex] || '/uploads/hero.png')}
                                alt={product.name}
                                zoomScale={2.8}
                                priority
                                className="border border-slate-200/80 dark:border-slate-800 shadow-sm"
                                badgeOverlay={(
                                    <>
                                        {/* Floating Badges */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                            <Badge className="bg-amber-500 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                                                <Zap size={12} className="fill-current" /> Direct Selling
                                            </Badge>
                                            {stock <= 0 ? (
                                                <Badge variant="destructive" className="bg-rose-600 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Out of Stock
                                                </Badge>
                                            ) : stock <= minStock ? (
                                                <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                                    <Flame size={12} className="fill-current" /> Only {stock} Left
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-600/90 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {stock} in Stock
                                                </Badge>
                                            )}
                                        </div>

                                        {hasDiscount && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <Badge variant="destructive" className="bg-rose-500 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {discountPercent}% OFF
                                                </Badge>
                                            </div>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        {/* Thumbnail Carousel */}
                        {images.length > 1 && (
                            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={cn(
                                            "relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-white dark:bg-slate-900 shadow-sm",
                                            activeImageIndex === idx
                                                ? "border-amber-500 scale-105 shadow-amber-500/20"
                                                : "border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-400"
                                        )}
                                    >
                                        <Image
                                            src={resolveImagePath(img)}
                                            alt={`${product.name} thumbnail ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Description & Specifications Card */}
                        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <CardContent className="p-6 sm:p-8 space-y-5">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles size={16} className="text-amber-500" /> Product Overview & Details
                                </h3>

                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                                    {product.description || 'Premium quality customized product crafted with superior materials and precision print engineering.'}
                                </p>

                                {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                                        {product.tags.map((t: string, idx: number) => (
                                            <span key={idx} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Trust & Guarantee Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                                <ShieldCheck size={20} className="mx-auto text-emerald-500" />
                                <span className="text-[11px] font-extrabold block text-slate-900 dark:text-white">Guaranteed Quality</span>
                                <span className="text-[9px] text-slate-400 font-medium block">100% Quality Checked</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                                <Truck size={20} className="mx-auto text-indigo-500" />
                                <span className="text-[11px] font-extrabold block text-slate-900 dark:text-white">Fast Dispatch</span>
                                <span className="text-[9px] text-slate-400 font-medium block">Safe Nationwide Delivery</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                                <Lock size={20} className="mx-auto text-amber-500" />
                                <span className="text-[11px] font-extrabold block text-slate-900 dark:text-white">Secure Payment</span>
                                <span className="text-[9px] text-slate-400 font-medium block">Encrypted Checkout</span>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: CONFIGURATION & ORDER FORM ── */}
                    <div className="lg:col-span-6 space-y-6">
                        <form onSubmit={handleOrderSubmit} className="space-y-6">

                            {/* Product Header & Pricing */}
                            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                <CardContent className="p-6 sm:p-8 space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                                {product.category || 'Direct Selling Product'}
                                            </span>
                                            {product.sku && (
                                                <span className="text-[11px] font-mono font-bold text-slate-400">
                                                    SKU: {product.sku}
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                            {product.name}
                                        </h1>

                                        <div className="flex items-center gap-2 pt-1">
                                            <div className="flex text-amber-400">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={14} fill="currentColor" className="stroke-none" />
                                                ))}
                                            </div>
                                            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">5.0 (Customer Favorite)</span>
                                        </div>
                                    </div>

                                    {/* Price Display */}
                                    <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Price</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-900 dark:text-white flex items-center">
                                                    <IndianRupee size={24} className="mr-0.5" />{activeUnitPrice}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-sm font-semibold text-slate-400 line-through">
                                                        ₹{basePrice}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {hasDiscount && (
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl">
                                                Save ₹{(basePrice - activeUnitPrice).toFixed(0)} per unit
                                            </span>
                                        )}
                                    </div>

                                    {/* Stock Alert Banner */}
                                    <div className={cn(
                                        "p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all",
                                        stock <= 0
                                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300"
                                            : stock <= minStock
                                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300"
                                                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            {stock <= 0 ? (
                                                <AlertCircle size={17} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                            ) : stock <= minStock ? (
                                                <Flame size={17} className="text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                                            ) : (
                                                <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            )}
                                            <span>
                                                {stock <= 0
                                                    ? "This product is currently out of stock."
                                                    : stock <= minStock
                                                        ? `Only ${stock} unit(s) left in stock! Order quickly.`
                                                        : `${stock} units in stock and ready to ship.`}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/40 border border-current/20 shrink-0">
                                            {stock <= 0 ? 'Out of Stock' : `${stock} Left`}
                                        </span>
                                    </div>

                                    {/* Size Selection */}
                                    {sizes.length > 0 && (
                                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                <span>Choose Size / Variation</span>
                                                <span className="text-muted-foreground font-semibold">{sizes.length} Options Available</span>
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                {sizes.map(sz => {
                                                    const isSelected = selectedSize === sz.name;
                                                    return (
                                                        <button
                                                            key={sz.name}
                                                            type="button"
                                                            onClick={() => setSelectedSize(sz.name)}
                                                            className={cn(
                                                                "p-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border text-center",
                                                                isSelected
                                                                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]"
                                                                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400"
                                                            )}
                                                        >
                                                            <span>{sz.name}</span>
                                                            {sz.price && sz.price > 0 && (
                                                                <span className={cn(
                                                                    "text-[10px] px-1.5 py-0.5 rounded-md font-bold",
                                                                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                                                )}>
                                                                    ₹{sz.price}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quantity Selection: Price Slabs OR Stepper */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                                <span>Order Quantity</span>
                                            </label>
                                            {priceSlabs.length > 0 && (
                                                <span className="text-[11px] font-bold text-slate-500">
                                                    Select Package
                                                </span>
                                            )}
                                        </div>

                                        {priceSlabs.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                {priceSlabs.map((slab: any) => {
                                                    const isSelected = quantity === Number(slab.quantity);
                                                    const perUnit = (Number(slab.price) / Number(slab.quantity)).toFixed(2);
                                                    return (
                                                        <button
                                                            key={slab.id || slab.quantity}
                                                            type="button"
                                                            onClick={() => setQuantity(Number(slab.quantity))}
                                                            className={cn(
                                                                "group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all text-left shadow-xs hover:shadow",
                                                                isSelected
                                                                    ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/20 scale-[1.02]"
                                                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between w-full mb-1">
                                                                <span className={cn("text-xs font-black", isSelected ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white")}>
                                                                    {Number(slab.quantity).toLocaleString()} Pcs
                                                                </span>
                                                                {isSelected && (
                                                                    <Badge className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0 h-4 border-none">
                                                                        Selected
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-baseline justify-between w-full">
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                    ₹{Number(slab.price).toLocaleString()}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground font-semibold">
                                                                    ₹{perUnit}/pc
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                                                <div className="space-y-0.5">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">Select Pieces</span>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={quantity <= 1 || stock <= 0}
                                                            className="h-9 w-9 rounded-xl font-bold border-slate-300 dark:border-slate-700"
                                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="font-black text-lg w-10 text-center">{quantity}</span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={quantity >= stock && stock > 0}
                                                            className="h-9 w-9 rounded-xl font-bold border-slate-300 dark:border-slate-700"
                                                            onClick={() => setQuantity(q => (stock > 0 ? Math.min(stock, q + 1) : q + 1))}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-0.5 text-right">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">Unit Rate</span>
                                                    <div className="text-base font-black text-slate-900 dark:text-white">
                                                        ₹{activeUnitPrice} / pc
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Price & GST Breakdown Card */}
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                <span>Base Product ({quantity} {quantity === 1 ? 'pc' : 'pcs'})</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    ₹{productTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {taxBreakdown.details.map((tax, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                                                    <span className="flex items-center gap-1">
                                                        <Receipt className="w-3 h-3" />
                                                        {tax.name} ({tax.rate}%) {tax.isInclusive ? '(Included in price)' : ''}
                                                    </span>
                                                    <span className="font-bold">
                                                        {tax.isInclusive ? `(₹${tax.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })})` : `+₹${tax.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                                    </span>
                                                </div>
                                            ))}

                                            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
                                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                                                    Total Payable
                                                </span>
                                                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center">
                                                    <IndianRupee size={20} className="mr-0.5" />
                                                    {totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Text Field if Allowed */}
                                    {product.textAllowed && (
                                        <div className="space-y-2 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                                            <label className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles size={14} /> Customization Text / Inscription <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                required
                                                placeholder="Enter the custom text or name to be printed..."
                                                value={customText}
                                                onChange={e => setCustomText(e.target.value)}
                                                className="h-11 rounded-xl bg-white dark:bg-slate-900 border-amber-500/30 focus-visible:ring-amber-500 font-semibold text-sm"
                                            />
                                            <p className="text-[11px] text-muted-foreground font-medium">This product supports custom text engraving or printing. Please enter your desired text above.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Shipping Address Card */}
                            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                <CardContent className="p-6 sm:p-8 space-y-5">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                        <Package2 size={16} className="text-primary" /> Delivery & Shipping Address
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Full Name <span className="text-rose-500">*</span></label>
                                            <Input
                                                required
                                                placeholder="e.g. Rahul Sharma"
                                                value={shippingAddress.name}
                                                onChange={e => setShippingAddress(s => ({ ...s, name: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Number <span className="text-rose-500">*</span></label>
                                            <Input
                                                required
                                                placeholder="+91 9876543210"
                                                value={shippingAddress.phone}
                                                onChange={e => setShippingAddress(s => ({ ...s, phone: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Address Line 1 <span className="text-rose-500">*</span></label>
                                        <Input
                                            required
                                            placeholder="Flat / House No., Street, Landmark"
                                            value={shippingAddress.addressLine1}
                                            onChange={e => setShippingAddress(s => ({ ...s, addressLine1: e.target.value }))}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">City <span className="text-rose-500">*</span></label>
                                            <Input
                                                required
                                                placeholder="Mumbai"
                                                value={shippingAddress.city}
                                                onChange={e => setShippingAddress(s => ({ ...s, city: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">State <span className="text-rose-500">*</span></label>
                                            <Input
                                                required
                                                placeholder="Maharashtra"
                                                value={shippingAddress.state}
                                                onChange={e => setShippingAddress(s => ({ ...s, state: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ZIP Code <span className="text-rose-500">*</span></label>
                                            <Input
                                                required
                                                placeholder="400001"
                                                value={shippingAddress.zip}
                                                onChange={e => setShippingAddress(s => ({ ...s, zip: e.target.value }))}
                                                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit & Checkout CTA */}
                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || stock <= 0}
                                    className="w-full h-14 rounded-2xl font-black text-base bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {stock <= 0 ? (
                                        'Currently Out of Stock'
                                    ) : (
                                        <>
                                            Proceed to Secure Payment ({quantity} {quantity === 1 ? 'item' : 'items'} • ₹{totalPayable})
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-xs text-slate-400 font-medium">
                                    Instant order processing • Real-time stock reservation • 100% Secure Checkout
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
