'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getProductBySlug } from '@/app/actions/product-actions';
import { getPricingRulesForSubProduct } from '@/app/actions/pricing-actions';
import { getSession } from '@/app/actions/user-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup } from '@/components/ui/radio-group';
import { ArrowRight, ImagePlus, LayoutTemplate, PenSquare, Trophy, IndianRupee, Sparkles, ShieldCheck, Loader2, Layers, Square, CheckCircle2, PlusCircle, Zap, Briefcase, HelpCircle, Info, Sparkle, Circle, Hexagon, Triangle, Star, Scissors, Hash, Package2 } from 'lucide-react';
import { getFoilTypes } from '@/app/actions/foil-actions';
import { getDieCuts } from '@/app/actions/die-cut-actions';
import { FoilType } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { resolveImagePath, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type ProductWithSubProducts = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
type SubProductData = ProductWithSubProducts['subProducts'][0];

export function StartDesignContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [product, setProduct] = useState<ProductWithSubProducts | null>(null);
  const [subProduct, setSubProduct] = useState<SubProductData | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<{ 
    original: number; 
    final: number; 
    discount: number; 
    description: string | null;
    addons: { name: string; totalAmount: number }[];
  } | null>(null);

  const [quantity, setQuantity] = useState('100');
  const [pages, setPages] = useState('1');
  const [spotUv, setSpotUv] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [foilTypes, setFoilTypes] = useState<FoilType[]>([]);
  const [customWidth, setCustomWidth] = useState(searchParams.get('width') || '');
  const [customHeight, setCustomHeight] = useState(searchParams.get('height') || '');
  const [selectedDie, setSelectedDie] = useState<number | null>(null);
  const [dieCuts, setDieCuts] = useState<any[]>([]);

  useEffect(() => {
    getFoilTypes().then(setFoilTypes);
    getDieCuts().then(setDieCuts);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const productId = params.productId as string;
      const subProductId = searchParams.get('subProductId');

      if (!productId || !subProductId) {
        router.push('/products');
        return;
      }
      
      const [productData, sessionData] = await Promise.all([
        getProductBySlug(productId),
        getSession(),
      ]);
      
      setSession(sessionData);

      if (productData) {
        setProduct(productData);
        const sp = productData.subProducts.find(s => s.id === Number(subProductId));
        if (sp) {
            setSubProduct(sp);
            if (!sp.spotUvAllowed) {
                setSpotUv(false);
            }
            if (sp.maxPages <= 1) {
                setPages('1');
            }
            setLoadingPricing(true);
            getPricingRulesForSubProduct(sp.id).then(rules => {
                setPricingRules(rules);
                setLoadingPricing(false);
            });
        } else {
            setSubProduct(null);
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [params, searchParams, router]);

  const availableDieCuts = useMemo(() => {
    if (!subProduct || !(subProduct as any).allowedDieCuts || !(subProduct as any).allowedDieCuts.length) return [];
    return dieCuts.filter(dc => (subProduct as any).allowedDieCuts.includes(dc.id) && dc.isActive);
  }, [subProduct, dieCuts]);

  const discountRules = useMemo(() => {
    return pricingRules
        .filter(rule => rule.isDiscount)
        .sort((a, b) => (a.minQuantity || 0) - (b.minQuantity || 0));
  }, [pricingRules]);

  const addonRules = useMemo(() => {
    return pricingRules.filter(rule => rule.isAddon);
  }, [pricingRules]);

  const toggleAddon = (id: number) => {
    setSelectedAddons(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!subProduct) {
        setCalculatedPrice(null);
        return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) return;

    let basePrice = Number(subProduct.price || 0);
    let finalPrice = basePrice;
    let discount = 0;
    let discountDescription: string | null = null;

    const standardRule = pricingRules.find(r => !r.isDiscount && !r.isContest && !r.isVerification && qty >= (r.minQuantity || 1) && (!r.maxQuantity || qty <= r.maxQuantity));
    if (standardRule && standardRule.unitPrice) {
        basePrice = Number(standardRule.unitPrice);
        finalPrice = basePrice;
    }

    const discountRule = pricingRules.find(r => r.isDiscount && qty >= (r.minQuantity || 1) && (!r.maxQuantity || qty <= r.maxQuantity));
    if (discountRule && discountRule.discountValue) {
        if (discountRule.discountType === 'percentage') {
            discount = basePrice * (Number(discountRule.discountValue) / 100);
            discountDescription = `${discountRule.discountValue}% off`;
        } else if (discountRule.discountType === 'fixed') {
            discount = Number(discountRule.discountValue);
            discountDescription = `₹${discountRule.discountValue} off`;
        }
        finalPrice = basePrice - discount;
    }

    let addonTotalPerUnit = 0;
    const addonBreakdown: { name: string; totalAmount: number }[] = [];

    const isDoubleSided = pages === '2';

    if (isDoubleSided && subProduct.backSideCost) {
        const amount = Number(subProduct.backSideCost);
        addonTotalPerUnit += amount;
        addonBreakdown.push({
            name: 'Double Sided Printing',
            totalAmount: amount * qty
        });
    }

    if (spotUv) {
        addonBreakdown.push({
            name: 'Spot UV',
            totalAmount: 0
        });
    }

    selectedAddons.forEach(id => {
        const rule = pricingRules.find(r => r.id === id);
        if (rule && rule.addonPriceAmount) {
            const amount = Number(rule.addonPriceAmount);
            addonTotalPerUnit += amount;
            addonBreakdown.push({
                name: rule.addonName || 'Extra Add-on',
                totalAmount: amount * qty
            });
        }
    });

    if (selectedDie) {
        const die = dieCuts.find(d => d.id === selectedDie);
        if (die) {
            const customPrices = (subProduct as any).dieCutPrices || {};
            const amount = Number(customPrices[selectedDie] || 0);
                
            addonTotalPerUnit += amount;
            addonBreakdown.push({
                name: `Die Cut: ${die.name}`,
                totalAmount: amount * qty
            });
        }
    }

    setCalculatedPrice({
        original: (basePrice + addonTotalPerUnit) * qty,
        final: (finalPrice + addonTotalPerUnit) * qty,
        discount: discount * qty,
        description: discountDescription,
        addons: addonBreakdown,
    });

  }, [quantity, subProduct, pricingRules, selectedAddons, pages, selectedDie, dieCuts]);

  const constructedQuery = useMemo(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('quantity', quantity);
    newParams.set('pages', pages);
    if (spotUv && subProduct?.spotUvAllowed) {
      newParams.set('spotUv', 'true');
    } else {
      newParams.delete('spotUv');
    }
    if (selectedAddons.length > 0) {
      newParams.set('addons', selectedAddons.join(','));
    } else {
      newParams.delete('addons');
    }
    if (selectedDie) {
      newParams.set('dieCut', String(selectedDie));
    } else {
      newParams.delete('dieCut');
    }
    
    if (subProduct?.width === 0 && subProduct?.height === 0) {
      if (customWidth) newParams.set('width', customWidth);
      if (customHeight) newParams.set('height', customHeight);
    }

    return newParams.toString();
  }, [searchParams, quantity, pages, spotUv, subProduct, selectedAddons, customWidth, customHeight, selectedDie]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!product || !subProduct) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
            <h1 className="text-xl font-bold">Product not found</h1>
            <Button asChild><Link href="/products">Back to Products</Link></Button>
        </div>
    );
  }

  const isLoggedIn = !!session;
  const imageUrl = resolveImagePath(subProduct?.imageUrl || product.imageUrl);

  const options = [
    {
      title: 'Templates',
      description: 'Quickly swap details on professional layouts.',
      href: `/design/${product.slug}/templates?${constructedQuery}`,
      icon: <LayoutTemplate className="w-5 h-5 text-blue-600" />,
      badge: 'Fast',
    },
    {
      title: 'Start blank',
      description: 'Build your vision from zero in our editor.',
      href: `/design/${product.slug}?${constructedQuery}`,
      icon: <PenSquare className="w-5 h-5 text-purple-600" />,
      badge: 'Popular',
    },
    {
      title: 'Upload file',
      description: 'Send us your print-ready file. We will take care!.',
      href: isLoggedIn ? `/design/${product.slug}/upload?${constructedQuery}` : `/login?redirect_url=/design/${product.slug}/upload%3F${constructedQuery}`,
      icon: <ImagePlus className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Hire expert',
      description: 'Get custom designs from our top designers.',
      href: `/client/contests/create?productId=${product.id}&subProductId=${subProduct.id}`,
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <main className="flex-grow pt-24 pb-20 bg-slate-50/50 dark:bg-slate-950">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header Section with Product Hero */}
          <div className="mb-10 flex flex-col md:flex-row gap-8 items-center animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="w-full md:w-1/3 aspect-[4/3] relative rounded-2xl overflow-hidden shadow-xl shadow-primary/10 group">
                  {imageUrl ? (
                      <Image src={imageUrl} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                  ) : (
                      <div className="flex items-center justify-center h-full bg-slate-200 dark:bg-slate-800">
                          <LayoutTemplate className="h-12 w-12 text-slate-400" />
                      </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="flex-1 space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest border border-primary/20">
                      <Sparkles className="w-3 h-3" />
                      Project Initialization
                  </div>
                  <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {product.name}
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl">
                      Configure your production specifications for industrial-grade {product.name.toLowerCase()} fulfillment.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <Badge variant="outline" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg font-semibold text-[10px] text-slate-600">
                          <Package2 size={12} className="mr-1.5 text-primary" />
                          {subProduct.width === 0 && subProduct.height === 0 ? 'Custom Size' : `${subProduct.width} x ${subProduct.height} ${subProduct.unitType || 'mm'}`}
                      </Badge>
                      <Badge variant="outline" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg font-semibold text-[10px] text-slate-600">
                          <ShieldCheck size={12} className="mr-1.5 text-primary" />
                          G7 Certified
                      </Badge>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Step-by-Step Configuration */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Step 1: Physical Parameters */}
                <section className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-md shadow-primary/20">1</div>
                        <div>
                            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Production Configuration</h2>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Set volume and physical attributes</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-none shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group hover:ring-1 hover:ring-primary/20 transition-all duration-500">
                            <CardHeader className="pb-1.5 p-5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Hash className="w-3 h-3 text-primary" />
                                    Order Quantity
                                </Label>
                            </CardHeader>
                            <CardContent className="pb-5 px-5">
                                <div className="relative group">
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        value={quantity} 
                                        onChange={(e) => setQuantity(e.target.value)}
                                        onBlur={() => {
                                            const val = parseInt(quantity, 10);
                                            if (isNaN(val) || val < 1) setQuantity('1');
                                        }}
                                        className="h-12 text-2xl font-bold border-none bg-slate-50 dark:bg-slate-800/50 focus-visible:ring-primary rounded-xl pl-5"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pointer-events-none">Units</span>
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                    <Zap size={10} className="fill-emerald-600/10" />
                                    Volume discount tier automatically active
                                </div>
                            </CardContent>
                        </Card>

                        {subProduct.maxPages > 1 ? (
                            <Card className="border-none shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group hover:ring-1 hover:ring-primary/20 transition-all duration-500">
                                <CardHeader className="pb-1.5 p-5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <Layers className="w-3 h-3 text-primary" />
                                        Print Coverage
                                    </Label>
                                </CardHeader>
                                <CardContent className="pb-5 px-5">
                                    <div className="grid grid-cols-2 gap-2 h-12">
                                        <button 
                                            onClick={() => setPages('1')}
                                            className={cn(
                                                "rounded-xl border font-semibold transition-all flex flex-col items-center justify-center gap-0.5",
                                                pages === '1' ? "border-primary bg-primary text-white shadow-md shadow-primary/10" : "text-muted-foreground border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-200"
                                            )}
                                        >
                                            <span className="text-sm">Single Sided</span>
                                        </button>
                                        <button 
                                            onClick={() => setPages('2')}
                                            className={cn(
                                                "rounded-xl border font-semibold transition-all flex flex-col items-center justify-center gap-0.5",
                                                pages === '2' ? "border-primary bg-primary text-white shadow-md shadow-primary/10" : "text-muted-foreground border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-200"
                                            )}
                                        >
                                            <span className="text-sm">Double Sided</span>
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                             <Card className="border-none shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden opacity-50 grayscale pointer-events-none">
                                <CardHeader className="pb-1.5 p-5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Print Coverage</Label>
                                </CardHeader>
                                <CardContent className="pb-5 px-5">
                                    <div className="h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200">
                                        <span className="text-[10px] font-medium text-slate-400">Fixed: Single Sided</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {subProduct.width === 0 && subProduct.height === 0 && (
                        <Card className="border-none shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                             <CardHeader className="p-5 border-b border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Scissors size={14} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest">Bespoke Dimensioning</CardTitle>
                                        <CardDescription className="text-[9px] font-medium text-muted-foreground">Specify custom spatial requirements in {subProduct.unitType || 'mm'}.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Width</Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={customWidth} 
                                                onChange={(e) => setCustomWidth(e.target.value)}
                                                className="h-11 text-base font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-primary"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">{subProduct.unitType || 'mm'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Height</Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={customHeight} 
                                                onChange={(e) => setCustomHeight(e.target.value)}
                                                className="h-11 text-base font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-primary"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">{subProduct.unitType || 'mm'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </section>

                {/* Step 2: Visual Enhancements */}
                {(subProduct.spotUvAllowed || addonRules.length > 0 || availableDieCuts.length > 0) && (
                    <section className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-md shadow-primary/20">2</div>
                            <div>
                                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Premium Enhancements</h2>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Industrial finishes and structural precision</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {/* Spot UV */}
                            {subProduct.spotUvAllowed && (
                                <div 
                                    onClick={() => setSpotUv(!spotUv)}
                                    className={cn(
                                        "group relative p-5 rounded-2xl border flex flex-col items-center gap-3 text-center transition-all duration-500 cursor-pointer overflow-hidden",
                                        spotUv 
                                            ? "border-amber-400 bg-amber-400/5 ring-1 ring-amber-400 shadow-lg shadow-amber-500/10" 
                                            : "border-white dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 hover:shadow-md"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                        spotUv ? "bg-amber-400 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200"
                                    )}>
                                        <Zap className={cn("w-6 h-6", spotUv ? "fill-white" : "")} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white leading-none">Spot UV</p>
                                        <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">PREMIUM GLOSS</p>
                                    </div>
                                    {spotUv && (
                                        <div className="absolute top-2.5 right-2.5 animate-in zoom-in duration-300">
                                            <CheckCircle2 className="w-4 h-4 text-amber-500 fill-white dark:fill-slate-900" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Die Cut */}
                            {availableDieCuts.length > 0 && (
                                <div 
                                    className={cn(
                                        "group relative p-5 rounded-2xl border flex flex-col items-center gap-3 text-center transition-all duration-500 cursor-pointer overflow-hidden",
                                        selectedDie
                                            ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10" 
                                            : "border-white dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 hover:shadow-md"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                        selectedDie ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200"
                                    )}>
                                        <Scissors className={cn("w-6 h-6", selectedDie ? "fill-white" : "")} />
                                    </div>
                                    <div className="w-full space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white leading-none">Die Cut</p>
                                        <Select 
                                            value={selectedDie ? String(selectedDie) : "none"} 
                                            onValueChange={(val) => setSelectedDie(val === "none" ? null : parseInt(val, 10))}
                                        >
                                            <SelectTrigger className="h-6 w-full text-[9px] font-bold uppercase tracking-tighter border-none bg-slate-100 dark:bg-slate-800 rounded-md px-1.5 flex justify-between gap-0.5 focus:ring-0 text-slate-600 dark:text-slate-400">
                                                <SelectValue placeholder="NONE" />
                                            </SelectTrigger>
                                            <SelectContent className="min-w-[180px] rounded-xl shadow-xl border-border/40">
                                                <SelectItem value="none" className="rounded-lg">
                                                    <div className="flex items-center gap-3 py-0.5">
                                                        <div className="w-8 h-8 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900 shrink-0">
                                                            <Scissors size={12} className="text-slate-300" />
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">NO DIE CUT</span>
                                                    </div>
                                                </SelectItem>
                                                {availableDieCuts.map(die => (
                                                    <SelectItem key={die.id} value={String(die.id)} className="rounded-lg">
                                                        <div className="flex items-center gap-3 py-0.5">
                                                            {die.imageUrl && (
                                                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                                                                    <Image 
                                                                        src={resolveImagePath(die.imageUrl)} 
                                                                        alt={die.name} 
                                                                        width={32} 
                                                                        height={32} 
                                                                        className="object-cover" 
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col items-start leading-none gap-1">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">{die.name}</span>
                                                                <span className="text-[10px] font-semibold text-indigo-500">+₹{Number(((subProduct as any).dieCutPrices || {})[die.id] || 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {selectedDie && (
                                        <div className="absolute top-2.5 right-2.5 animate-in zoom-in duration-300">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-500 fill-white dark:fill-slate-900" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Custom Addons */}
                            {addonRules.map(rule => {
                                const isSelected = selectedAddons.includes(rule.id);
                                const isCurved = rule.addonName?.toLowerCase().includes('curved') || rule.addonName?.toLowerCase().includes('round');
                                
                                return (
                                    <div 
                                        key={rule.id}
                                        onClick={() => toggleAddon(rule.id)}
                                        className={cn(
                                            "group relative p-5 rounded-2xl border flex flex-col items-center gap-3 text-center transition-all duration-500 cursor-pointer overflow-hidden",
                                            isSelected 
                                                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-lg shadow-primary/10" 
                                                : "border-white dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 hover:shadow-md"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden relative transition-all duration-500",
                                            isSelected ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200"
                                        )}>
                                            {rule.addonImageUrl ? (
                                                <Image src={rule.addonImageUrl} alt={rule.addonName} fill className="object-cover" />
                                            ) : (
                                                isCurved ? <Square className="w-6 h-6 rounded-lg border-2 border-current" /> : <PlusCircle className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white leading-none line-clamp-1">{rule.addonName}</p>
                                            <p className="text-[10px] text-primary font-semibold">+₹{Number(rule.addonPriceAmount)}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2.5 right-2.5 animate-in zoom-in duration-300">
                                                <CheckCircle2 className="w-4 h-4 text-primary fill-white dark:fill-slate-900" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Step 3: Creative Direction */}
                <section className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-md shadow-primary/20">3</div>
                        <div>
                            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Creative Selection</h2>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Choose your design initiation path</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {options.map((option, idx) => (
                            <Link key={option.title} href={option.href} className="group relative">
                                <Card className="h-full border-none shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10">
                                    <CardHeader className="p-6 pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                                {option.icon}
                                            </div>
                                            {option.badge && (
                                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full">
                                                    {option.badge}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-2">{option.title}</h3>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">
                                            {option.description}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                                            Initialize Project <ArrowRight size={12} className="group-hover:translate-x-1.5 transition-transform duration-500" />
                                        </div>
                                    </CardContent>
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
              </div>

              {/* Right Column: Dynamic Price Intelligence (Sticky) */}
              <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                
                {/* Visual Quote Card */}
                <Card className="border-none shadow-xl shadow-primary/10 bg-primary text-white rounded-[1.5rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 animate-pulse" />
                    <CardHeader className="p-6 pb-2 border-none">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[9px] font-bold uppercase tracking-widest opacity-80">Instant Quotation</CardTitle>
                            <IndianRupee size={14} className="opacity-50" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        {loadingPricing ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                            </div>
                        ) : calculatedPrice ? (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-2xl md:text-3xl font-extrabold tracking-tighter flex items-center">
                                            <IndianRupee className="mr-0.5 stroke-[3]" size={22} />
                                            {calculatedPrice.final.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">Net Payable (Incl. Taxes)</p>
                                </div>

                                <div className="space-y-2.5 pt-5 border-t border-white/10">
                                    <div className="flex justify-between text-[10px] font-semibold text-white/80">
                                        <span className="uppercase tracking-widest opacity-60">Production</span>
                                        <span>₹{calculatedPrice.original.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {calculatedPrice.addons.map((addon, idx) => (
                                        <div key={idx} className="flex justify-between text-[10px] font-semibold text-white">
                                            <span className="uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-white/40" />
                                                {addon.name}
                                            </span>
                                            <span className="text-primary-foreground font-bold">+ ₹{addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                    
                                    {calculatedPrice.discount > 0 && (
                                        <div className="flex justify-between text-[10px] font-bold bg-white/10 px-3 py-2 rounded-xl mt-3 animate-in slide-in-from-bottom-2 duration-500">
                                            <span className="uppercase tracking-widest">SAVED {calculatedPrice.description}</span>
                                            <span>- ₹{calculatedPrice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-5">
                                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                            <Package2 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Unit Price</p>
                                            <p className="text-base font-bold tracking-tight">₹{(calculatedPrice.final / parseInt(quantity, 10)).toFixed(2)} <span className="text-[9px] opacity-60 font-semibold uppercase ml-0.5">per Unit</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-32 italic font-semibold text-white/30 text-xs">Calibrating...</div>
                        )}
                    </CardContent>
                </Card>

                {/* Volume Advantage Matrix */}
                {discountRules.length > 0 && (
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden">
                        <CardHeader className="p-5 bg-amber-400/10 dark:bg-amber-400/5 border-b border-amber-400/10">
                            <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 fill-amber-500" />
                                Volume Advantage Matrix
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid gap-2.5">
                                {discountRules.map(rule => {
                                    const qty = parseInt(quantity, 10);
                                    const isActive = !isNaN(qty) && qty >= (rule.minQuantity || 1) && (!rule.maxQuantity || qty <= rule.maxQuantity);
                                    return (
                                        <div key={rule.id} className={cn(
                                            "flex items-center justify-between p-3.5 rounded-xl border transition-all", 
                                            isActive 
                                                ? "border-amber-400 bg-amber-400/5 shadow-md shadow-amber-500/10" 
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60"
                                        )}>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{rule.minQuantity || 1}{rule.maxQuantity ? `-${rule.maxQuantity}` : '+'} Units</span>
                                                <span className="text-[8px] font-semibold text-muted-foreground uppercase">Production Tier</span>
                                            </div>
                                            <Badge className={cn("rounded-lg px-2.5 py-0.5 font-bold text-[9px]", isActive ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500")}>
                                                {rule.discountType === 'percentage' ? `${rule.discountValue}% OFF` : `₹${rule.discountValue} OFF`}
                                            </Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Trust Intelligence Section */}
                <div className="p-6 rounded-[1.5rem] bg-slate-900 text-white space-y-4">
                    <div className="flex -space-x-2.5">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                    <ShieldCheck size={12} className="text-primary" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-1.5">
                        <h4 className="text-sm font-bold tracking-tight leading-none">Pre-Press Assurance</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            Manual technical audit for resolution, bleed, and ink density.
                        </p>
                    </div>
                </div>

              </aside>
            </div>

            {/* NEW: Formal Product Intelligence Section */}
            <div className="mt-20 space-y-20 border-t border-slate-200 dark:border-slate-800 pt-20 pb-12">
                
                {/* 1. Feature Arsenal */}
                <div className="space-y-10">
                    <div className="flex flex-col items-center text-center space-y-3 max-w-3xl mx-auto">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-5 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-full">Capability Matrix</Badge>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">Industrial Feature Arsenal</h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                            Technical capabilities engineered into every unit of {product.name}.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { 
                                icon: Sparkles, 
                                title: "Premium Finishing", 
                                features: ["Spot UV Varnish", "Soft-touch Lamination", "Metallic Foil Accents", "Embossed Textures"] 
                            },
                            { 
                                icon: ShieldCheck, 
                                title: "Production Rigor", 
                                features: ["G7 Certified Color", "Precision Die-cutting", "300+ DPI Clarity", "Structural Stress Tested"] 
                            },
                            { 
                                icon: Zap, 
                                title: "Rapid Fulfillment", 
                                features: ["Next-day Dispatch", "Live Tracking", "Safe-transit Packing", "Volume Scaling"] 
                            },
                        ].map((group, i) => (
                            <div key={i} className="p-7 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-primary/5 transition-all duration-700 group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        <group.icon size={20} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white uppercase tracking-tight">{group.title}</h3>
                                <ul className="space-y-3">
                                    {group.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-2.5">
                                            <div className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Technical Specs & Variant Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Deep Specs */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-3">
                            <h3 className="text-lg font-extrabold flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tighter">
                                <div className="w-1.5 h-6 bg-primary rounded-full" />
                                Technical Blueprint
                            </h3>
                            <p className="text-xs text-slate-500 font-medium max-w-lg">
                                Industrial parameters for {product.name.toLowerCase()} production.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { label: 'Paper Stock', value: subProduct.priceType === 'per_sqft' ? 'Industrial Flex' : '350 GSM Silk' },
                                { label: 'Coating System', value: spotUv ? 'Spot UV + Matte' : 'Industrial Aqueous' },
                                { label: 'Inking', value: 'High-Density CMYK' },
                                { label: 'Bleed Zone', value: '3mm Industrial' },
                                { label: 'Color Space', value: 'GRACoL 2013' },
                                { label: 'Resolution', value: '300 DPI Min' },
                            ].map((spec, i) => (
                                <div key={i} className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all duration-500">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{spec.label}</span>
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Scale Matrix */}
                    <div className="lg:col-span-5">
                        <div className="p-7 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden h-full flex flex-col">
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mb-24 -mr-24" />
                            <h3 className="text-lg font-bold uppercase tracking-tighter mb-6 flex items-center gap-2.5">
                                <Package2 className="text-primary" />
                                Scale Matrix
                            </h3>
                            <div className="space-y-4 flex-1">
                                {pricingRules.filter(r => !r.isDiscount && !r.isAddon && !r.isContest && !r.isVerification).map((rule, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">{rule.minQuantity}{rule.maxQuantity ? `-${rule.maxQuantity}` : '+'} Units</span>
                                            <span className="text-sm font-bold">Tier {i+1}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-bold text-primary">₹{Number(rule.unitPrice).toFixed(2)}</span>
                                            <p className="text-[8px] font-semibold text-white/40 uppercase">per Unit</p>
                                        </div>
                                    </div>
                                ))}
                                {pricingRules.filter(r => !r.isDiscount && !r.isAddon && !r.isContest && !r.isVerification).length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-white/20">
                                        <Info size={24} className="mb-3" />
                                        <p className="text-[9px] font-bold uppercase tracking-widest">Custom Scale</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1.5">Production Status</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Capacity Available</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
    </main>
  );
}

function FinishingGuide({ foilTypes }: { foilTypes: FoilType[] }) {
    return (
        <div className="space-y-10">
            <div className="space-y-3">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    Finishing Guide
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Professional finishes available within our editor.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Spot UV Section */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-full sm:w-1/2 aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center">
                            <div className="text-white/10 text-2xl font-bold tracking-widest uppercase select-none">MATTE</div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 bg-amber-400/10 rounded-full blur-2xl" />
                                <div className="w-14 h-14 bg-amber-400/90 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)] border border-amber-300 flex items-center justify-center transform -rotate-12">
                                    <span className="text-amber-950 font-extrabold text-[10px] tracking-tighter">GLOSS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <Sparkle className="w-3.5 h-3.5 text-amber-600" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Spot UV</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            Glossy liquid coating that creates a beautiful contrast against matte surfaces.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[8px] py-0 border-emerald-500/20 text-emerald-600">Raised</Badge>
                            <Badge variant="outline" className="text-[8px] py-0 border-emerald-500/20 text-emerald-600">Matte</Badge>
                        </div>
                    </div>
                </div>

                {/* Foils Section */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-full sm:w-1/2 aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                            <div className="grid grid-cols-3 gap-1.5 relative z-10">
                                {foilTypes.length > 0 ? (
                                    foilTypes.slice(0, 3).map((foil, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-md" style={{ background: foil.colorCode || '#ffd700' }} />
                                    ))
                                ) : (
                                    ['#FFD700', '#C0C0C0', '#B87333'].map((color, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: color }} />
                                    ))
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Metallic Foil</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            Metallic layers stamped onto your design for mirror-like brilliance.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[8px] py-0 border-indigo-500/20 text-indigo-600">Mirror</Badge>
                            <Badge variant="outline" className="text-[8px] py-0 border-indigo-500/20 text-indigo-600">Multi</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Info size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight">Editor Hint</p>
                    <p className="text-[9px] text-slate-500 font-medium leading-tight">Apply finishes in the editor toolbar.</p>
                </div>
                <Button variant="outline" size="sm" className="text-[9px] h-7 rounded-md" asChild>
                    <Link href={`/design/${foilTypes[0]?.name ? 'guide' : '#'}`}>View Guide</Link>
                </Button>
            </div>
        </div>
    );
}
