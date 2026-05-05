'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getProductBySlug } from '@/app/actions/product-actions';
import { getPricingRulesForSubProduct } from '@/app/actions/pricing-actions';
import { getSession } from '@/app/actions/user-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup } from '@/components/ui/radio-group';
import { ArrowRight, ImagePlus, LayoutTemplate, PenSquare, Trophy, IndianRupee, Sparkles, ShieldCheck, Loader2, Layers, Square, CheckCircle2, PlusCircle, Zap, Briefcase, HelpCircle, Info, Sparkle } from 'lucide-react';
import { getFoilTypes } from '@/app/actions/foil-actions';
import { FoilType } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { resolveImagePath, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

  useEffect(() => {
    getFoilTypes().then(setFoilTypes);
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

    setCalculatedPrice({
        original: (basePrice + addonTotalPerUnit) * qty,
        final: (finalPrice + addonTotalPerUnit) * qty,
        discount: discount * qty,
        description: discountDescription,
        addons: addonBreakdown,
    });

  }, [quantity, subProduct, pricingRules, selectedAddons, pages]);

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
    
    if (subProduct?.width === 0 && subProduct?.height === 0) {
      if (customWidth) newParams.set('width', customWidth);
      if (customHeight) newParams.set('height', customHeight);
    }

    return newParams.toString();
  }, [searchParams, quantity, pages, spotUv, subProduct, selectedAddons, customWidth, customHeight]);

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
            <h1 className="text-2xl font-bold">Product not found</h1>
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
      title: 'Start Blank',
      description: 'Build your vision from zero in our editor.',
      href: `/design/${product.slug}?${constructedQuery}`,
      icon: <PenSquare className="w-5 h-5 text-purple-600" />,
      badge: 'Popular',
    },
    {
      title: 'Upload File',
      description: 'Send us your print-ready file. We will take care!.',
      href: isLoggedIn ? `/design/${product.slug}/upload?${constructedQuery}` : `/login?redirect_url=/design/${product.slug}/upload%3F${constructedQuery}`,
      icon: <ImagePlus className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Hire Expert',
      description: 'Get custom designs from our top designers.',
      href: `/client/contests/create?productId=${product.id}&subProductId=${subProduct.id}`,
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                <Card className="overflow-hidden border shadow-sm bg-white dark:bg-slate-900">
                  <div className="flex flex-col sm:flex-row lg:flex-col">
                    <div className="relative aspect-video sm:w-1/3 lg:w-full bg-slate-100 dark:bg-slate-800 border-b lg:border-b-0 lg:border-r dark:border-slate-800">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={product.name} fill className="object-cover" priority />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <LayoutTemplate className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="mb-4">
                        <h1 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">{product.name}</h1>
                        <p className="text-sm text-muted-foreground">{subProduct.name}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3.5 dark:border-slate-800">
                          <p className="text-[11px] font-bold text-muted-foreground">Dimensions</p>
                          <p className="text-sm font-semibold">
                            {subProduct.width === 0 && subProduct.height === 0 
                              ? 'Custom Size' 
                              : `${subProduct.width} x ${subProduct.height} ${subProduct.unitType || 'mm'}`}
                          </p>
                        </div>
                    </div>
                  </div>
                </Card>

                {subProduct.width === 0 && subProduct.height === 0 && (
                  <Card className="border shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="p-4 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Square className="w-4 h-4 text-primary" />
                        Enter Custom Size
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        Specify the dimensions for your project in {subProduct.unitType || 'mm'}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Width ({subProduct.unitType || 'mm'})</Label>
                          <Input 
                            type="number" 
                            placeholder="e.g. 100" 
                            value={customWidth} 
                            onChange={(e) => setCustomWidth(e.target.value)}
                            className="font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Height ({subProduct.unitType || 'mm'})</Label>
                          <Input 
                            type="number" 
                            placeholder="e.g. 100" 
                            value={customHeight} 
                            onChange={(e) => setCustomHeight(e.target.value)}
                            className="font-bold"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </aside>

              <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                    <Card className="border shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x dark:divide-slate-800">
                        <div className="p-4 space-y-3">
                          <Label className="text-[11px] font-bold text-muted-foreground">Select quantity</Label>
                          <Select value={quantity} onValueChange={setQuantity}>
                            <SelectTrigger className="w-full h-10 font-semibold"><SelectValue/></SelectTrigger>
                            <SelectContent>
                              {[100, 250, 500, 1000, 2500, 5000].map(q => (
                                <SelectItem key={q} value={String(q)}>{q} pieces</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {subProduct.maxPages > 1 && (
                          <div className="p-4 space-y-3">
                            <Label className="text-[11px] font-bold text-muted-foreground">Print configuration</Label>
                            <div className="flex gap-2">
                              <button 
                                  onClick={() => setPages('1')}
                                  className={cn(
                                      "flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all",
                                      pages === '1' ? "border-primary bg-primary/5 text-primary shadow-sm" : "text-muted-foreground border-slate-100 dark:border-slate-800"
                                  )}
                              >Front only</button>
                              <button 
                                  onClick={() => setPages('2')}
                                  className={cn(
                                      "flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all",
                                      pages === '2' ? "border-primary bg-primary/5 text-primary shadow-sm" : "text-muted-foreground border-slate-100 dark:border-slate-800"
                                  )}
                              >Front & back</button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {subProduct.spotUvAllowed && (
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 border-t dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Premium spot UV</p>
                                    <p className="text-[10px] text-muted-foreground font-semibold">Add glossy raised texture</p>
                                </div>
                            </div>
                            <Switch checked={spotUv} onCheckedChange={setSpotUv} className="data-[state=checked]:bg-amber-500" />
                        </div>
                      )}
                    </Card>

                    {addonRules.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[12px] font-bold text-muted-foreground flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                    Enhancements
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {addonRules.map(rule => {
                                    const isSelected = selectedAddons.includes(rule.id);
                                    const isCurved = rule.addonName?.toLowerCase().includes('curved') || rule.addonName?.toLowerCase().includes('round');
                                    
                                    return (
                                        <div 
                                            key={rule.id}
                                            onClick={() => toggleAddon(rule.id)}
                                            className={cn(
                                                "p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer",
                                                isSelected 
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                                                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center",
                                                isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                            )}>
                                                {isCurved ? <Square className="w-3.5 h-3.5 rounded-sm" /> : <PlusCircle className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold leading-none mb-1 text-slate-800 dark:text-slate-100">{rule.addonName}</p>
                                                <p className="text-[10px] text-muted-foreground font-semibold">₹{Number(rule.addonPriceAmount)}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {discountRules.length > 0 && (
                        <Card className="border shadow-sm bg-white dark:bg-slate-900 overflow-hidden mb-6">
                            <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 border-b py-3">
                                <CardTitle className="text-xs flex items-center gap-2 text-amber-700 dark:text-amber-400 uppercase tracking-widest font-black">
                                    <Sparkles className="w-4 h-4" />
                                    Volume Discounts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {discountRules.map(rule => {
                                        const qty = parseInt(quantity, 10);
                                        const isActive = !isNaN(qty) && qty >= (rule.minQuantity || 1) && (!rule.maxQuantity || qty <= rule.maxQuantity);
                                        const discountText = rule.discountType === 'percentage'
                                            ? `${rule.discountValue}% OFF`
                                            : `₹${rule.discountValue} OFF`;
                                        return (
                                            <div key={rule.id} className={cn(
                                                "p-2 rounded-lg border text-center transition-all", 
                                                isActive 
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                                                    : "bg-muted/30 border-slate-100 dark:border-slate-800"
                                            )}>
                                                <p className="font-semibold text-[10px] text-muted-foreground leading-none mb-1">
                                                    {rule.minQuantity || 1}{rule.maxQuantity ? `-${rule.maxQuantity}` : '+'} qty
                                                </p>
                                                <p className={cn("font-bold text-[11px]", isActive ? "text-primary" : "text-foreground")}>{discountText}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-2 border-primary/20 shadow-xl bg-primary/[0.02] dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="py-4 border-b bg-white dark:bg-slate-900/50">
                            <CardTitle className="text-xs font-bold text-primary flex items-center justify-between">
                                Final summary
                                <IndianRupee className="w-4 h-4 opacity-50" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            {loadingPricing ? (
                                <div className="flex items-center justify-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : calculatedPrice ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-muted-foreground">Standard printing</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">₹{calculatedPrice.original.toFixed(2)}</span>
                                        </div>

                                        {calculatedPrice.addons.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                {calculatedPrice.addons.map((addon, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                            <span className="text-slate-600 dark:text-slate-400 font-semibold">{addon.name}</span>
                                                        </div>
                                                        <span className="font-bold text-primary/80">+ ₹{addon.totalAmount.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {calculatedPrice.discount > 0 && calculatedPrice.description && (
                                            <div className="flex justify-between text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                                <span>Saved with {calculatedPrice.description}</span>
                                                <span>- ₹{calculatedPrice.discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t-2 border-dashed border-primary/10">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[11px] font-bold text-muted-foreground leading-none mb-1.5">Total amount</p>
                                                <p className="text-[10px] text-muted-foreground/60 font-semibold">Inclusive of all taxes</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-3xl font-bold text-primary flex items-center tracking-tight">
                                                    <IndianRupee size={24} className="mr-1 stroke-[2.5]"/>
                                                    {calculatedPrice.final.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-8 font-bold italic">Configuring your price...</div>
                            )}
                        </CardContent>
                    </Card>

                  
                </div>

                <div>
                  <header className="mb-8">
                    <h2 className="text-2xl font-extrabold tracking-tight mb-2">How would you like to design?</h2>
                    <p className="text-muted-foreground">Choose a starting method to begin your project.</p>
                  </header>

                  <div className="grid gap-4">
                    {options.map((option) => (
                      <Link key={option.title} href={option.href} className="block">
                        <Card className="group relative border-2 border-transparent hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900">
                          <CardHeader className="p-6">
                            <div className="flex items-start gap-5">
                              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {option.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <CardTitle className="text-lg group-hover:text-primary transition-colors text-slate-800 dark:text-slate-100">{option.title}</CardTitle>
                                  {option.badge && (
                                    <span className="px-3 py-1 text-[11px] font-bold bg-primary/10 text-primary rounded-full">
                                      {option.badge}
                                    </span>
                                  )}
                                </div>
                                <CardDescription className="text-sm leading-relaxed">
                                  {option.description}
                                </CardDescription>
                              </div>
                              <div className="self-center flex items-center justify-center w-8 h-8 rounded-full border group-hover:bg-primary group-hover:border-primary transition-all">
                                <ArrowRight size={16} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                   <div className="flex -space-x-2 mb-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                          <ShieldCheck size={14} className="text-primary" />
                        </div>
                      ))}
                   </div>
                   <h4 className="font-bold text-sm">Professional Pre-Press Check</h4>
                   <p className="text-xs text-muted-foreground text-center mt-1 max-w-xs">
                     Our designers will manually review your design for resolution, bleed, and margins before printing.
                   </p>
                </div>
              </div>
            </div>

            {/* NEW: Formal Product Intelligence Section */}
            <div className="mt-16 space-y-16 border-t border-slate-100 dark:border-slate-800 pt-16 pb-12">
                
                {/* 1. Feature Arsenal */}
                <div className="space-y-10">
                    <div className="flex flex-col items-center text-center space-y-3 max-w-3xl mx-auto">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-5 py-1.5 text-[10px] font-bold rounded-full">Capability matrix</Badge>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Industrial feature arsenal</h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Explore the technical capabilities and premium finishes engineered into every unit of {product.name}.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { 
                                icon: Sparkles, 
                                title: "Premium Finishing", 
                                features: ["Spot UV Varnish", "Soft-Touch Lamination", "Metallic Foil Accents", "Embossed Textures"] 
                            },
                            { 
                                icon: ShieldCheck, 
                                title: "Production Rigor", 
                                features: ["G7 Certified Color", "Precision Die-Cutting", "300+ DPI Clarity", "Structural Stress Tested"] 
                            },
                            { 
                                icon: Zap, 
                                title: "Rapid Fulfillment", 
                                features: ["Next-Day Dispatch", "Live Tracking", "Safe-Transit Packing", "Volume Scaling"] 
                            },
                        ].map((group, i) => (
                            <div key={i} className="p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                        <group.icon size={20} />
                                    </div>
                                </div>
                                <h3 className="text-md font-bold mb-4 text-slate-800 dark:text-slate-100">{group.title}</h3>
                                <ul className="space-y-3">
                                    {group.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-2.5">
                                            <CheckCircle2 size={12} className="text-primary/60 shrink-0" />
                                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Technical Specs & Variant Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Deep Specs */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                                <div className="w-1.5 h-6 bg-primary rounded-full" />
                                Technical blueprint
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {subProduct.width === 0 && subProduct.height === 0 
                                    ? 'Custom size project initialization' 
                                    : `Standard industrial parameters for ${subProduct.width}x${subProduct.height} ${subProduct.unitType} production.`}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Paper Stock', value: subProduct.priceType === 'per_sqft' ? 'Industrial Flex' : '350 GSM Silk' },
                                { label: 'Coating System', value: spotUv ? 'Spot UV + Matte' : 'Industrial Aqueous' },
                                { label: 'Inking', value: 'High-Density CMYK' },
                                { label: 'Finishing', value: 'Precision Trim' },
                                { label: 'Margins', value: '3.0mm Safety' },
                                { label: 'Resolution', value: '300 DPI Min' },
                            ].map((spec, i) => (
                                <div key={i} className="flex flex-col gap-1.5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all">
                                    <span className="text-[10px] font-bold text-slate-400">{spec.label}</span>
                                    <span className="text-[11px] font-semibold text-slate-900 dark:text-white">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Interactive Variant Selector */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Variant matrix</h3>
                            <p className="text-[11px] text-slate-500 font-medium text-center lg:text-left">Switch between available dimensions.</p>
                        </div>
                        <div className="grid gap-2">
                            {product.subProducts.map((sp) => (
                                <button 
                                    key={sp.id} 
                                    onClick={() => {
                                        const newParams = new URLSearchParams(searchParams.toString());
                                        newParams.set('subProductId', sp.id.toString());
                                        router.push(`${pathname}?${newParams.toString()}`);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group text-left",
                                        subProduct.id === sp.id 
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/10" 
                                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/20"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                            subProduct.id === sp.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary"
                                        )}>
                                            <Square size={14} />
                                        </div>
                                        <div>
                                            <p className={cn("text-xs font-bold", subProduct.id === sp.id ? "text-white" : "text-slate-900 dark:text-white")}>
                                                {sp.width === 0 && sp.height === 0 ? 'Custom Size' : `${sp.width}x${sp.height} ${sp.unitType}`}
                                            </p>
                                            <p className={cn("text-[10px] font-semibold", subProduct.id === sp.id ? "text-white/70" : "text-slate-400")}>
                                                Standard format
                                            </p>
                                        </div>
                                    </div>
                                    {subProduct.id === sp.id ? (
                                        <CheckCircle2 size={16} className="text-white" />
                                    ) : (
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Finishing Guide Inline */}
                <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                    <FinishingGuide foilTypes={foilTypes} />
                </div>

                {/* 3. Formal Use Case Showcase */}
                <div className="p-16 rounded-[4rem] bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-primary/30 to-transparent" />
                    </div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <Badge className="bg-primary text-white font-bold px-6 py-2 text-[11px] rounded-full">Industrial application</Badge>
                            <h3 className="text-5xl font-bold tracking-tight leading-none">Designed for <br/><span className="text-primary">excellence.</span></h3>
                            <p className="text-slate-400 font-medium leading-relaxed text-lg max-w-md">
                                From high-stakes corporate summits to luxury retail packaging, our {product.name.toLowerCase()} production line is built to deliver unmatched visual consistency.
                            </p>
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                {[
                                    { label: 'Corporate', icon: Briefcase },
                                    { label: 'Marketing', icon: Zap },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                                            <item.icon size={20} />
                                        </div>
                                        <span className="text-[13px] font-bold">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'Durability', val: '100%' },
                                { title: 'Color Match', val: '∆E &lt; 2' },
                                { title: 'Eco-Friendly', val: 'FSC' },
                                { title: 'Finish', val: 'HD' },
                            ].map((stat, i) => (
                                <div key={i} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-2">
                                    <span className="text-4xl font-bold text-primary">{stat.val}</span>
                                    <span className="text-[11px] font-bold text-slate-500">{stat.title}</span>
                                </div>
                            ))}
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
        <div className="space-y-12">
            <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-4 text-slate-800 dark:text-slate-100">
                    <div className="w-2 h-8 bg-amber-500 rounded-full" />
                    Premium Finishing Guide
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Elevate your design with our high-end professional finishes. These options are available for application directly within our editor.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Spot UV Section */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-full sm:w-1/2 aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center">
                            <div className="text-white/10 text-3xl font-black tracking-widest uppercase select-none">MATTE</div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 bg-amber-400/10 rounded-full blur-3xl" />
                                <div className="w-16 h-16 bg-amber-400/90 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.6)] border-2 border-amber-300 flex items-center justify-center transform -rotate-12">
                                    <span className="text-amber-950 font-black text-sm tracking-tighter">GLOSS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkle className="w-4 h-4 text-amber-600" />
                            <h4 className="text-md font-bold text-slate-800 dark:text-slate-100">Spot UV</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            A clear, glossy liquid coating that creates a beautiful contrast against matte surfaces. Perfect for logos and highlight text.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/30 text-emerald-600">Raised Texture</Badge>
                            <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/30 text-emerald-600">Matte Contrast</Badge>
                        </div>
                    </div>
                </div>

                {/* Foils Section */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-full sm:w-1/2 aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                            <div className="grid grid-cols-3 gap-2 relative z-10">
                                {foilTypes.length > 0 ? (
                                    foilTypes.slice(0, 3).map((foil, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border border-white/20 shadow-lg" style={{ background: foil.colorCode || '#ffd700' }} />
                                    ))
                                ) : (
                                    ['#FFD700', '#C0C0C0', '#B87333'].map((color, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: color }} />
                                    ))
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-50" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-md font-bold text-slate-800 dark:text-slate-100">Metallic Foil</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            True metallic layers stamped onto your design. Offers a mirror-like brilliance that standard inks can&apos;t replicate.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[9px] py-0 border-indigo-500/30 text-indigo-600">Mirror Shine</Badge>
                            <Badge variant="outline" className="text-[9px] py-0 border-indigo-500/30 text-indigo-600">Multi-Color</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Info size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Application Insight</p>
                    <p className="text-[10px] text-slate-500 font-medium">Select any element in the editor and toggle <strong>Spot UV</strong> or <strong>Foil</strong> in the toolbar.</p>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-lg" asChild>
                    <Link href={`/design/${foilTypes[0]?.name ? 'guide' : '#'}`}>View Full Guide</Link>
                </Button>
            </div>
        </div>
    );
}
