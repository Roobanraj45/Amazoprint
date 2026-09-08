'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Sparkles, Package2, ArrowRight, ArrowLeft, CheckCircle2,
    IndianRupee, Star, Zap, Flame, AlertCircle, ShieldCheck,
    Truck, Lock, Share2, Check, Coins, Percent, Receipt,
    MapPin, Calendar, Clock, RotateCcw, FileText, Layers, Tag,
    ChevronRight, Gift, Info, CheckCheck, Palette
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DirectProductDetailClientProps {
    product: any;
}

export interface RichAttributeOption {
    id?: string;
    name: string;
    value?: string; // hex color code or custom value
    price?: number; // specific unit price override
    priceAdjustment?: number; // delta to base price, e.g. +50
    basePriceAdjustment?: number; // delta to MRP
    stock?: number;
    sku?: string;
    image?: string; // image to switch to
    isDefault?: boolean;
    isActive?: boolean;
}

export interface RichAttribute {
    id?: string;
    name: string; // e.g. "Color", "Size", "Material", "Capacity"
    type?: 'color' | 'button' | 'select' | 'image';
    options: RichAttributeOption[];
}

export interface RichVariation {
    id: string;
    attributes: Record<string, string>; // e.g. { "Color": "Black", "Size": "XL" }
    sku?: string;
    price: number;
    basePrice?: number;
    stock?: number;
    image?: string;
    isActive: boolean;
}

export function DirectProductDetailClient({ product }: DirectProductDetailClientProps) {
    const router = useRouter();
    const { toast } = useToast();

    // ── 1. NORMALIZE DYNAMIC ATTRIBUTES (WooCommerce-Style) ──
    const attributes: RichAttribute[] = useMemo(() => {
        const result: RichAttribute[] = [];

        // Check if product has modern attributes JSONB array
        if (product && product.attributes) {
            let rawAttrs = product.attributes;
            if (typeof rawAttrs === 'string') {
                try { rawAttrs = JSON.parse(rawAttrs); } catch { rawAttrs = []; }
            }
            if (Array.isArray(rawAttrs) && rawAttrs.length > 0) {
                rawAttrs.forEach((attr: any, idx: number) => {
                    const opts = Array.isArray(attr.options)
                        ? attr.options.filter((o: any) => o.isActive !== false)
                        : [];
                    if (opts.length > 0) {
                        result.push({
                            id: attr.id || `attr-${idx}`,
                            name: attr.name || `Attribute ${idx + 1}`,
                            type: attr.type || (attr.name?.toLowerCase().includes('color') ? 'color' : 'button'),
                            options: opts.map((o: any, oIdx: number) => ({
                                id: o.id || `opt-${oIdx}`,
                                name: o.name || String(o),
                                value: o.value || (attr.name?.toLowerCase().includes('color') ? (o.name || '#000000') : undefined),
                                price: o.price !== undefined && o.price !== null && o.price !== '' ? Number(o.price) : undefined,
                                priceAdjustment: o.priceAdjustment !== undefined ? Number(o.priceAdjustment) : 0,
                                basePriceAdjustment: o.basePriceAdjustment !== undefined ? Number(o.basePriceAdjustment) : 0,
                                stock: o.stock !== undefined ? Number(o.stock) : undefined,
                                sku: o.sku || '',
                                image: o.image || undefined,
                                isDefault: o.isDefault || false,
                                isActive: o.isActive !== false,
                            })),
                        });
                    }
                });
            }
        }

        // Fallback: If no explicit "Size" attribute but legacy sizes array exists
        const hasSizeAttr = result.some(a => a.name.toLowerCase().includes('size') || a.name.toLowerCase().includes('dimension'));
        if (!hasSizeAttr && product && product.sizes) {
            let rawSizes = product.sizes;
            if (typeof rawSizes === 'string') {
                try { rawSizes = JSON.parse(rawSizes); } catch { rawSizes = []; }
            }
            if (Array.isArray(rawSizes) && rawSizes.length > 0) {
                const sizeOpts: RichAttributeOption[] = rawSizes.map((s: any, idx: number) => {
                    if (typeof s === 'string') return { id: `sz-${idx}`, name: s, isActive: true };
                    return {
                        id: s.id || `sz-${idx}`,
                        name: s.name || s.size || String(s),
                        price: s.price !== undefined && s.price !== null && s.price !== '' ? Number(s.price) : undefined,
                        basePrice: s.basePrice !== undefined && s.basePrice !== null && s.basePrice !== '' ? Number(s.basePrice) : undefined,
                        stock: s.stock !== undefined && s.stock !== null && s.stock !== '' ? Number(s.stock) : undefined,
                        sku: s.sku || '',
                        isActive: s.isActive !== false,
                    };
                }).filter(s => s.isActive !== false);

                if (sizeOpts.length > 0) {
                    result.push({
                        id: 'attr-sizes',
                        name: 'Size / Dimensions',
                        type: 'button',
                        options: sizeOpts,
                    });
                }
            }
        }

        return result;
    }, [product]);

    // Variations matrix
    const variations: RichVariation[] = useMemo(() => {
        if (!product || !product.variations) return [];
        let rawVars = product.variations;
        if (typeof rawVars === 'string') {
            try { rawVars = JSON.parse(rawVars); } catch { rawVars = []; }
        }
        if (Array.isArray(rawVars)) {
            return rawVars
                .filter((v: any) => v.isActive !== false)
                .map((v: any, idx: number) => ({
                    id: v.id || `var-${idx}`,
                    attributes: v.attributes || {},
                    sku: v.sku || '',
                    price: Number(v.price || product.sellingPrice || 0),
                    basePrice: v.basePrice !== undefined ? Number(v.basePrice) : Number(product.basePrice || 0),
                    stock: v.stock !== undefined ? Number(v.stock) : undefined,
                    image: v.image || undefined,
                    isActive: v.isActive !== false,
                }));
        }
        return [];
    }, [product]);

    // ── 2. STATE FOR SELECTED ATTRIBUTES ──
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        attributes.forEach(attr => {
            const def = attr.options.find(o => o.isDefault) || attr.options[0];
            if (def) {
                initial[attr.name] = def.name;
            }
        });
        return initial;
    });

    // Ensure selectedAttributes stays synced if attributes load/change
    useEffect(() => {
        setSelectedAttributes(prev => {
            let changed = false;
            const updated = { ...prev };
            attributes.forEach(attr => {
                if (!updated[attr.name] && attr.options.length > 0) {
                    const def = attr.options.find(o => o.isDefault) || attr.options[0];
                    updated[attr.name] = def.name;
                    changed = true;
                }
            });
            return changed ? updated : prev;
        });
    }, [attributes]);

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

    // Shipping info
    const shippingInfo = useMemo(() => {
        if (!product.shippingInfo) return {};
        if (typeof product.shippingInfo === 'string') {
            try { return JSON.parse(product.shippingInfo); } catch { return {}; }
        }
        return product.shippingInfo;
    }, [product.shippingInfo]);

    // Promotional Offers & Badges
    const offersList = useMemo(() => {
        if (!product.offers) return [];
        if (Array.isArray(product.offers)) return product.offers;
        if (typeof product.offers === 'string') {
            try {
                const parsed = JSON.parse(product.offers);
                if (Array.isArray(parsed)) return parsed;
            } catch { return []; }
        }
        return [];
    }, [product.offers]);

    // Specifications
    const specs = useMemo(() => {
        if (!product.specifications) return {};
        if (typeof product.specifications === 'string') {
            try { return JSON.parse(product.specifications); } catch { return {}; }
        }
        return product.specifications;
    }, [product.specifications]);

    // Product Images
    const images: string[] = useMemo(() => {
        if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
            return product.imageUrls;
        }
        return ['/uploads/hero.png'];
    }, [product]);

    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

    // ── 3. DYNAMIC VARIATION & PRICING CALCULATION ENGINE ──
    // Match exact variation if present in matrix
    const matchedVariation = useMemo(() => {
        if (variations.length === 0) return null;
        return variations.find(v => {
            const vAttrs = v.attributes || {};
            return Object.entries(selectedAttributes).every(([attrName, optName]) => {
                return !vAttrs[attrName] || vAttrs[attrName] === optName;
            });
        }) || null;
    }, [variations, selectedAttributes]);

    // Calculate active unit price, base price, stock, and SKU
    const { activeUnitPrice, activeBasePrice, activeStock, activeSku, activeVariantImage } = useMemo(() => {
        if (matchedVariation) {
            return {
                activeUnitPrice: Number(matchedVariation.price),
                activeBasePrice: Number(matchedVariation.basePrice || product.basePrice || matchedVariation.price),
                activeStock: matchedVariation.stock !== undefined
                    ? Number(matchedVariation.stock)
                    : (typeof product.stockQuantity === 'number' ? product.stockQuantity : 999),
                activeSku: matchedVariation.sku || product.sku || '',
                activeVariantImage: matchedVariation.image || null,
            };
        }

        // Sum price adjustments from all selected attribute options
        let unitDelta = 0;
        let baseDelta = 0;
        let minOptionStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 999;
        let selectedSku = product.sku || '';
        let selectedImg: string | null = null;
        let exactOptionPrice: number | null = null;

        Object.entries(selectedAttributes).forEach(([attrName, optName]) => {
            const attr = attributes.find(a => a.name === attrName);
            const opt = attr?.options.find(o => o.name === optName);
            if (opt) {
                if (opt.price !== undefined && opt.price > 0) {
                    exactOptionPrice = Number(opt.price);
                } else if (opt.priceAdjustment !== undefined) {
                    unitDelta += Number(opt.priceAdjustment);
                }

                if (opt.basePriceAdjustment !== undefined) {
                    baseDelta += Number(opt.basePriceAdjustment);
                } else if (opt.basePrice !== undefined && opt.basePrice > 0) {
                    baseDelta += (Number(opt.basePrice) - Number(product.basePrice || 0));
                }

                if (opt.stock !== undefined) {
                    minOptionStock = Math.min(minOptionStock, Number(opt.stock));
                }
                if (opt.sku) {
                    selectedSku = opt.sku;
                }
                if (opt.image) {
                    selectedImg = opt.image;
                }
            }
        });

        const calculatedUnitPrice = exactOptionPrice !== null
            ? exactOptionPrice + unitDelta
            : Math.max(0, Number(product.sellingPrice || 0) + unitDelta);

        const calculatedBasePrice = Math.max(
            calculatedUnitPrice,
            Number(product.basePrice || 0) + baseDelta
        );

        return {
            activeUnitPrice: calculatedUnitPrice,
            activeBasePrice: calculatedBasePrice,
            activeStock: minOptionStock,
            activeSku: selectedSku,
            activeVariantImage: selectedImg,
        };
    }, [matchedVariation, selectedAttributes, attributes, product]);

    // When an attribute with a dedicated image is selected, switch gallery preview
    useEffect(() => {
        if (activeVariantImage) {
            const idx = images.findIndex(img => resolveImagePath(img) === resolveImagePath(activeVariantImage));
            if (idx !== -1) {
                setActiveImageIndex(idx);
            }
        }
    }, [activeVariantImage, images]);

    // Quantity state
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

    // Shipping & Express Selection
    const [isExpressSelected, setIsExpressSelected] = useState<boolean>(false);
    const [pincodeInput, setPincodeInput] = useState<string>('');
    const [pincodeStatus, setPincodeStatus] = useState<{ checked: boolean; valid: boolean; message: string; dateStr?: string } | null>(null);

    const [shippingAddress, setShippingAddress] = useState({
        name: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
    });

    const minStock = product.minStockLevel || 5;

    // Match quantity with price slab if applicable (supports exact match & tiered quantities)
    const matchingSlab = useMemo(() => {
        if (!priceSlabs || priceSlabs.length === 0) return null;
        const exact = priceSlabs.find((s: any) => Number(s.quantity) === quantity);
        if (exact) return exact;

        const qualifying = [...priceSlabs]
            .filter((s: any) => Number(s.quantity) <= quantity)
            .sort((a: any, b: any) => Number(b.quantity) - Number(a.quantity));

        return qualifying.length > 0 ? qualifying[0] : null;
    }, [priceSlabs, quantity]);

    // ── 4. ACCURATE PROPORTIONAL SLAB & TOTAL CALCULATION ──
    const { productTotal, effectiveUnitRate } = useMemo(() => {
        if (matchingSlab && quantity > 0) {
            const slabQty = Number(matchingSlab.quantity) || 1;
            const baseSlabExpected = slabQty * Number(product.sellingPrice || 1);
            const slabFlatPrice = Number(matchingSlab.price);
            const slabDiscountRate = (baseSlabExpected > 0 && slabFlatPrice < baseSlabExpected)
                ? (1 - slabFlatPrice / baseSlabExpected)
                : 0;

            if (slabDiscountRate > 0) {
                // Apply proportional volume discount to active variant price
                const unitRate = activeUnitPrice * (1 - slabDiscountRate);
                return {
                    effectiveUnitRate: unitRate,
                    productTotal: unitRate * quantity,
                };
            }

            // If no volume discount (or 0% discount on slab):
            // If activeUnitPrice is defined and base selling price exists, use activeUnitPrice
            const unitRate = (activeUnitPrice > 0 && Number(product.sellingPrice || 0) > 0)
                ? activeUnitPrice
                : (slabFlatPrice / slabQty);

            return {
                effectiveUnitRate: unitRate,
                productTotal: unitRate * quantity,
            };
        }

        return {
            effectiveUnitRate: activeUnitPrice,
            productTotal: activeUnitPrice * quantity,
        };
    }, [matchingSlab, quantity, activeUnitPrice, product]);

    // Shipping Fee calculation
    const standardFee = shippingInfo.deliveryCharge !== undefined && shippingInfo.deliveryCharge !== ''
        ? Number(shippingInfo.deliveryCharge)
        : 0;
    const freeThreshold = shippingInfo.freeDeliveryThreshold !== undefined && shippingInfo.freeDeliveryThreshold !== ''
        ? Number(shippingInfo.freeDeliveryThreshold)
        : 499;
    const isFreeStandard = standardFee === 0 || productTotal >= freeThreshold;

    const expressFee = shippingInfo.expressCharge !== undefined && shippingInfo.expressCharge !== ''
        ? Number(shippingInfo.expressCharge)
        : 99;

    const finalShippingFee = isExpressSelected
        ? expressFee
        : (isFreeStandard ? 0 : standardFee);

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

    const hasDiscount = activeBasePrice > activeUnitPrice;
    const discountPercent = hasDiscount ? Math.round(((activeBasePrice - activeUnitPrice) / activeBasePrice) * 100) : 0;
    const totalPayable = productTotal + taxBreakdown.extraTaxAmount + finalShippingFee;

    // PIN code validation & estimated delivery calculation
    const handleCheckPincode = () => {
        const clean = pincodeInput.trim();
        if (!/^\d{6}$/.test(clean)) {
            setPincodeStatus({
                checked: true,
                valid: false,
                message: 'Please enter a valid 6-digit Indian PIN code.'
            });
            return;
        }

        const daysToAdd = isExpressSelected ? 2 : 4;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
        const dateStr = targetDate.toLocaleDateString('en-IN', options);

        setPincodeStatus({
            checked: true,
            valid: true,
            message: `Delivery available to ${clean}`,
            dateStr,
        });

        if (!shippingAddress.zip) {
            setShippingAddress(prev => ({ ...prev, zip: clean }));
        }
    };

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

    const handleAttributeSelect = (attrName: string, optionName: string) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attrName]: optionName,
        }));
    };

    const handleOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (activeStock <= 0) {
            toast({ variant: 'destructive', title: 'Out of Stock', description: 'This item or variation is currently sold out.' });
            return;
        }

        // Validate all attributes selected
        for (const attr of attributes) {
            if (!selectedAttributes[attr.name]) {
                toast({ variant: 'destructive', title: 'Select Options', description: `Please choose an option for ${attr.name}.` });
                return;
            }
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

        const selectedAttributesFormatted = Object.entries(selectedAttributes)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');

        const orderItem = {
            id: product.id,
            productId: product.id,
            name: product.name,
            category: product.category,
            image: images[activeImageIndex] || (images && images[0]) || '/uploads/hero.png',
            imageUrl: images[activeImageIndex] || (images && images[0]) || '/uploads/hero.png',
            sellingPrice: Number(effectiveUnitRate).toFixed(2),
            unitPrice: Number(effectiveUnitRate).toFixed(2),
            baseUnitPrice: Number(activeUnitPrice).toFixed(2),
            totalAmount: totalPayable.toFixed(2),
            quantity: quantity,
            sku: activeSku || product.sku,
            hsnCode: product.hsnCode || undefined,
            selectedAttributes: selectedAttributes,
            selectedSize: selectedAttributes['Size'] || selectedAttributes['Size / Dimensions'] || selectedAttributes['Dimensions'] || undefined,
            selectedAttributesFormatted,
            customText: customText.trim() || undefined,
            shippingFee: finalShippingFee,
            deliveryMode: isExpressSelected ? 'express' : 'standard',
            taxDetails: taxBreakdown.details,
            taxAmount: taxBreakdown.extraTaxAmount,
            pricingBreakdown: {
                baseUnitPrice: activeUnitPrice.toFixed(2),
                effectiveUnitRate: effectiveUnitRate.toFixed(2),
                quantity: quantity,
                productSubtotal: productTotal.toFixed(2),
                slabApplied: matchingSlab ? { quantity: matchingSlab.quantity, slabPrice: matchingSlab.price } : null,
                taxDetails: taxBreakdown.details,
                extraTaxAmount: taxBreakdown.extraTaxAmount.toFixed(2),
                shippingFee: finalShippingFee.toFixed(2),
                deliveryMode: isExpressSelected ? 'express' : 'standard',
                totalPayable: totalPayable.toFixed(2),
            },
            specifications: specs,
        };

        const orderPayload = {
            orderData: {
                items: [orderItem],
                shippingAddress: shippingAddress,
            },
            amount: totalPayable,
            items: [orderItem],
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

                    {/* ── LEFT COLUMN: PRODUCT GALLERY, OFFERS & SPECIFICATIONS ── */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Main Media Preview Card with Flipkart-Style Loupe & Side Zoom Popup */}
                        <div className="relative aspect-square w-full">
                            <ProductImageZoom
                                src={resolveImagePath(images[activeImageIndex] || '/uploads/hero.png')}
                                alt={product.name}
                                zoomScale={2.8}
                                priority
                                className="border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-3xl"
                                badgeOverlay={(
                                    <>
                                        {/* Floating Badges */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                            {product.offerBadge && (
                                                <Badge className="bg-rose-600 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                                                    {product.offerBadge}
                                                </Badge>
                                            )}
                                            <Badge className="bg-amber-500 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                                                <Zap size={12} className="fill-current" /> Direct Selling
                                            </Badge>
                                            {activeStock <= 0 ? (
                                                <Badge variant="destructive" className="bg-rose-600 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Out of Stock
                                                </Badge>
                                            ) : activeStock <= minStock ? (
                                                <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                                    <Flame size={12} className="fill-current" /> Only {activeStock} Left
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-600/90 text-white border-none shadow-lg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {activeStock} in Stock
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
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── PROMOTIONAL DEALS & OFFERS CARD (if present) ── */}
                        {(product.offerBadge || offersList.length > 0) && (
                            <Card className="rounded-3xl border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm overflow-hidden">
                                <CardContent className="p-5 sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                                <Gift size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                                    Exclusive Deals & Offers
                                                </h3>
                                                <p className="text-[11px] text-muted-foreground">Available discounts on this product</p>
                                            </div>
                                        </div>
                                        {product.offerBadge && (
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-sm uppercase tracking-wide">
                                                {product.offerBadge}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2.5 pt-1">
                                        {offersList.map((o: any, idx: number) => (
                                            <div
                                                key={o.id || idx}
                                                className="p-3 rounded-2xl bg-white/90 dark:bg-slate-950/70 border border-amber-200/60 dark:border-slate-800 flex items-start gap-3 shadow-2xs"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                                    <Tag size={13} />
                                                </div>
                                                <div className="space-y-0.5 flex-1 min-w-0">
                                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{o.title}</span>
                                                    {o.description && (
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-snug">
                                                             {o.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {isFreeStandard && (
                                            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    <Truck size={13} />
                                                </div>
                                                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                    Free Standard Shipping Applied on this product!
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Description & Overview */}
                        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <CardContent className="p-6 sm:p-8 space-y-5">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles size={16} className="text-amber-500" /> Product Overview
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

                        {/* Technical Specifications */}
                        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <CardContent className="p-6 sm:p-8 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-500" /> Technical Specifications
                                </h3>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {specs.material && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Material / Paper GSM</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.material}</span>
                                        </div>
                                    )}
                                    {specs.finish && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Surface Finish</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.finish}</span>
                                        </div>
                                    )}
                                    {specs.printType && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Print Method</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.printType}</span>
                                        </div>
                                    )}
                                    {(specs.dimensionsFormatted || product.dimensions) && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Dimensions</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">
                                                {specs.dimensionsFormatted || (typeof product.dimensions === 'object' ? JSON.stringify(product.dimensions) : product.dimensions)}
                                            </span>
                                        </div>
                                    )}
                                    {product.weight && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Item Weight</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{product.weight} kg</span>
                                        </div>
                                    )}
                                    {specs.brand && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Brand / Maker</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.brand}</span>
                                        </div>
                                    )}
                                    {specs.originCountry && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Country of Origin</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.originCountry}</span>
                                        </div>
                                    )}
                                    {specs.minOrderQuantity && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Minimum Order Qty</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.minOrderQuantity} pcs</span>
                                        </div>
                                    )}
                                    {(specs.leadTime || shippingInfo.dispatchTime) && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Dispatch Turnaround</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.leadTime || shippingInfo.dispatchTime}</span>
                                        </div>
                                    )}
                                    {specs.warranty && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Quality Warranty</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.warranty}</span>
                                        </div>
                                    )}
                                    {specs.careInstructions && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">Care Instructions</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-right">{specs.careInstructions}</span>
                                        </div>
                                    )}
                                    {product.hsnCode && (
                                        <div className="py-2.5 flex justify-between items-center gap-4">
                                            <span className="font-bold text-slate-500 dark:text-slate-400">HSN Code</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white text-right">{product.hsnCode}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trust & Guarantee Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                                <ShieldCheck size={20} className="mx-auto text-emerald-500" />
                                <span className="text-[11px] font-extrabold block text-slate-900 dark:text-white">Guaranteed Quality</span>
                                <span className="text-[9px] text-slate-400 font-medium block">
                                    {specs.warranty || '100% Quality Checked'}
                                </span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                                <Truck size={20} className="mx-auto text-indigo-500" />
                                <span className="text-[11px] font-extrabold block text-slate-900 dark:text-white">Safe Delivery</span>
                                <span className="text-[9px] text-slate-400 font-medium block">
                                    {shippingInfo.estimatedDays || 'Fast Tracked Courier'}
                                </span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                                <RotateCcw size={20} className="mx-auto text-amber-500" />
                                <span className="text-[11px] font-extrabold block text-slate-900 dark:text-white">Easy Returns</span>
                                <span className="text-[9px] text-slate-400 font-medium block">
                                    {shippingInfo.returnPolicy || '7 Days Replacement'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: DYNAMIC ATTRIBUTES, SIZES, DELIVERY & ORDER FORM ── */}
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
                                            {activeSku && (
                                                <span className="text-[11px] font-mono font-bold text-slate-400">
                                                    SKU: {activeSku}
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

                                    {/* Price Display with Strikethrough & Savings */}
                                    <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Selling Price</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-900 dark:text-white flex items-center">
                                                    <IndianRupee size={24} className="mr-0.5" />{activeUnitPrice}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-sm font-semibold text-slate-400 line-through">
                                                        ₹{activeBasePrice}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {hasDiscount && (
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl">
                                                Save ₹{(activeBasePrice - activeUnitPrice).toFixed(0)} ({discountPercent}% OFF)
                                            </span>
                                        )}
                                    </div>

                                    {/* Stock Alert Banner (Dynamic to Selected Variation) */}
                                    <div className={cn(
                                        "p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all",
                                        activeStock <= 0
                                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300"
                                            : activeStock <= minStock
                                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300"
                                                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            {activeStock <= 0 ? (
                                                <AlertCircle size={17} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                            ) : activeStock <= minStock ? (
                                                <Flame size={17} className="text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                                            ) : (
                                                <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            )}
                                            <span>
                                                {activeStock <= 0
                                                    ? 'The selected configuration is currently out of stock.'
                                                    : activeStock <= minStock
                                                        ? `Only ${activeStock} unit(s) left in stock! Order quickly.`
                                                        : `${activeStock} units available and ready for immediate dispatch.`}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/40 border border-current/20 shrink-0">
                                            {activeStock <= 0 ? 'Out of Stock' : `${activeStock} Left`}
                                        </span>
                                    </div>

                                    {/* ── DYNAMIC ATTRIBUTES (WooCommerce-Style Color, Size, Material, etc.) ── */}
                                    {attributes.map(attr => {
                                        const selectedValue = selectedAttributes[attr.name] || (attr.options[0]?.name);
                                        const isColorAttr = attr.type === 'color' || attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour');

                                        return (
                                            <div key={attr.id || attr.name} className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                        {isColorAttr ? <Palette className="w-3.5 h-3.5 text-amber-500" /> : <Layers className="w-3.5 h-3.5 text-indigo-500" />}
                                                        <span>{attr.name}</span>
                                                        {selectedValue && (
                                                            <span className="text-amber-600 dark:text-amber-400 font-bold normal-case ml-1">
                                                                : {selectedValue}
                                                            </span>
                                                        )}
                                                    </label>
                                                    <span className="text-[11px] text-muted-foreground font-semibold">
                                                        {attr.options.length} {attr.options.length === 1 ? 'Option' : 'Options'}
                                                    </span>
                                                </div>

                                                {/* Color Swatch Picker */}
                                                {isColorAttr ? (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        {attr.options.map(opt => {
                                                            const isSelected = selectedValue === opt.name;
                                                            const isOutOfStock = opt.stock !== undefined && opt.stock <= 0;
                                                            const hex = opt.value || opt.name || '#000000';

                                                            return (
                                                                <button
                                                                    key={opt.id || opt.name}
                                                                    type="button"
                                                                    disabled={isOutOfStock}
                                                                    onClick={() => handleAttributeSelect(attr.name, opt.name)}
                                                                    title={`${opt.name}${opt.priceAdjustment ? ` (+₹${opt.priceAdjustment})` : ''}`}
                                                                    className={cn(
                                                                        "group relative flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all text-xs font-bold",
                                                                        isSelected
                                                                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/20 scale-105"
                                                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300",
                                                                        isOutOfStock && "opacity-40 cursor-not-allowed line-through"
                                                                    )}
                                                                >
                                                                    <div
                                                                        className="w-6 h-6 rounded-full border border-black/20 shadow-xs flex items-center justify-center shrink-0"
                                                                        style={{ backgroundColor: hex }}
                                                                    >
                                                                        {isSelected && (
                                                                            <Check className={cn(
                                                                                "w-3.5 h-3.5 stroke-[3]",
                                                                                ['#ffffff', '#fff', 'white', '#f8fafc', '#f1f5f9'].includes(hex.toLowerCase())
                                                                                    ? "text-black"
                                                                                    : "text-white"
                                                                            )} />
                                                                        )}
                                                                    </div>
                                                                    <span className="text-slate-800 dark:text-slate-200">{opt.name}</span>
                                                                    {opt.priceAdjustment && opt.priceAdjustment !== 0 ? (
                                                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">
                                                                            +{opt.priceAdjustment > 0 ? `₹${opt.priceAdjustment}` : `-₹${Math.abs(opt.priceAdjustment)}`}
                                                                        </span>
                                                                    ) : null}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    /* Button / Pill / Dimension Picker */
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                        {attr.options.map(opt => {
                                                            const isSelected = selectedValue === opt.name;
                                                            const isOutOfStock = opt.stock !== undefined && opt.stock <= 0;

                                                            // Display price badge
                                                            let displayPriceTag = '';
                                                            if (opt.price !== undefined && opt.price > 0) {
                                                                displayPriceTag = `₹${opt.price}`;
                                                            } else if (opt.priceAdjustment && opt.priceAdjustment !== 0) {
                                                                displayPriceTag = opt.priceAdjustment > 0 ? `+₹${opt.priceAdjustment}` : `-₹${Math.abs(opt.priceAdjustment)}`;
                                                            }

                                                            return (
                                                                <button
                                                                    key={opt.id || opt.name}
                                                                    type="button"
                                                                    disabled={isOutOfStock}
                                                                    onClick={() => handleAttributeSelect(attr.name, opt.name)}
                                                                    className={cn(
                                                                        "p-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border text-center relative",
                                                                        isOutOfStock
                                                                            ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 line-through"
                                                                            : isSelected
                                                                                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]"
                                                                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400"
                                                                    )}
                                                                >
                                                                    <span>{opt.name}</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {displayPriceTag ? (
                                                                            <span className={cn(
                                                                                "text-[10px] px-1.5 py-0.5 rounded-md font-bold",
                                                                                isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                                                            )}>
                                                                                {displayPriceTag}
                                                                            </span>
                                                                        ) : (
                                                                            <span className={cn(
                                                                                "text-[10px] px-1.5 py-0.5 rounded-md font-bold",
                                                                                isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                                                            )}>
                                                                                ₹{activeUnitPrice}
                                                                            </span>
                                                                        )}
                                                                        {opt.stock !== undefined && (
                                                                            <span className={cn(
                                                                                "text-[9px] font-bold",
                                                                                isOutOfStock
                                                                                    ? "text-rose-500"
                                                                                    : isSelected
                                                                                        ? "text-amber-100"
                                                                                        : "text-slate-400"
                                                                            )}>
                                                                                {isOutOfStock ? '0 stock' : `${opt.stock} left`}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* ── QUANTITY SELECTION: PRICE SLABS OR STEPPER ── */}
                                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                                <span>Order Quantity & Volume Discounts</span>
                                            </label>
                                            {priceSlabs.length > 0 && (
                                                <span className="text-[11px] font-bold text-slate-500">
                                                    Select Volume Package
                                                </span>
                                            )}
                                        </div>

                                        {priceSlabs.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                {priceSlabs.map((slab: any) => {
                                                    const isSelected = quantity === Number(slab.quantity);
                                                    
                                                    // Calculate dynamic proportional discounted rate for this slab based on selected variant
                                                    const baseSlabExpected = Number(slab.quantity) * Number(product.sellingPrice || 1);
                                                    const slabDiscountRate = (baseSlabExpected > 0 && Number(slab.price) < baseSlabExpected)
                                                        ? (1 - Number(slab.price) / baseSlabExpected)
                                                        : 0;
                                                    const effectiveSlabUnit = slabDiscountRate > 0
                                                        ? activeUnitPrice * (1 - slabDiscountRate)
                                                        : ((activeUnitPrice > 0 && Number(product.sellingPrice || 0) > 0) ? activeUnitPrice : (Number(slab.price) / Number(slab.quantity)));
                                                    const totalForThisSlab = Math.round(effectiveSlabUnit * Number(slab.quantity));

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
                                                                    ₹{totalForThisSlab.toLocaleString()}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground font-semibold">
                                                                    ₹{effectiveSlabUnit.toFixed(2)}/pc
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
                                                            disabled={quantity <= 1 || activeStock <= 0}
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
                                                            disabled={quantity >= activeStock && activeStock > 0}
                                                            className="h-9 w-9 rounded-xl font-bold border-slate-300 dark:border-slate-700"
                                                            onClick={() => setQuantity(q => (activeStock > 0 ? Math.min(activeStock, q + 1) : q + 1))}
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
                                    </div>

                                    {/* ── DELIVERY OPTIONS & PINCODE CHECKER ── */}
                                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                                <Truck className="w-3.5 h-3.5 text-indigo-500" /> Delivery Options & Speed
                                            </span>
                                            {shippingInfo.codAvailable !== false && (
                                                <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                                                    ✓ Cash on Delivery Available
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Pincode Check input */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="Enter 6-digit Delivery Pincode"
                                                    value={pincodeInput}
                                                    maxLength={6}
                                                    onChange={e => setPincodeInput(e.target.value)}
                                                    className="h-9 pl-9 text-xs rounded-xl bg-white dark:bg-slate-900 font-semibold"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleCheckPincode}
                                                className="h-9 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                                            >
                                                Check
                                            </Button>
                                        </div>

                                        {/* Pincode result message */}
                                        {pincodeStatus?.checked && (
                                            <div className={cn(
                                                "p-2.5 rounded-xl text-xs font-bold flex items-center justify-between",
                                                pincodeStatus.valid
                                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                                    : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                            )}>
                                                <span>{pincodeStatus.message}</span>
                                                {pincodeStatus.dateStr && (
                                                    <span className="font-black text-slate-900 dark:text-white">
                                                        Estimated by: {pincodeStatus.dateStr}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Standard vs Express Shipping Selector */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                            {/* Standard Option */}
                                            <div
                                                onClick={() => setIsExpressSelected(false)}
                                                className={cn(
                                                    "p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2",
                                                    !isExpressSelected
                                                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600/30"
                                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                                                )}
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">Standard Delivery</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground block">
                                                        {shippingInfo.estimatedDays || '2-4 Business Days'}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                    {isFreeStandard ? 'FREE' : `₹${standardFee}`}
                                                </span>
                                            </div>

                                            {/* Express Option (if enabled) */}
                                            {shippingInfo.expressDeliveryAvailable ? (
                                                <div
                                                    onClick={() => setIsExpressSelected(true)}
                                                    className={cn(
                                                        "p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2",
                                                        isExpressSelected
                                                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500/30"
                                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                                                    )}
                                                >
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <Zap size={12} className="text-amber-500 fill-current" />
                                                            <span className="text-xs font-black text-slate-900 dark:text-white">Express Delivery</span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground block">
                                                            {shippingInfo.expressDays || '1-2 Days / Priority'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                                        +₹{expressFee}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between opacity-70">
                                                    <span className="text-xs font-semibold text-slate-400">Dispatch Turnaround</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {shippingInfo.dispatchTime || 'Within 24 Hours'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price & GST Breakdown Card */}
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                                        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            <span>Base Product ({quantity} {quantity === 1 ? 'pc' : 'pcs'})</span>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                ₹{productTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        {/* Shipping charge row */}
                                        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                                            <span className="flex items-center gap-1">
                                                <Truck size={12} className="text-indigo-500" />
                                                Shipping ({isExpressSelected ? 'Express Courier' : 'Standard Delivery'})
                                            </span>
                                            <span className={cn("font-bold", finalShippingFee === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
                                                {finalShippingFee === 0 ? 'FREE' : `+₹${finalShippingFee.toFixed(2)}`}
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
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setShippingAddress(s => ({ ...s, zip: val }));
                                                    if (!pincodeInput && val.length <= 6) {
                                                        setPincodeInput(val);
                                                    }
                                                }}
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
                                    disabled={isSubmitting || activeStock <= 0}
                                    className="w-full h-14 rounded-2xl font-black text-base bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {activeStock <= 0 ? (
                                        'Configuration is Out of Stock'
                                    ) : (
                                        <>
                                            Proceed to Secure Payment ({quantity} {quantity === 1 ? 'item' : 'items'} • ₹{totalPayable.toFixed(2)})
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
