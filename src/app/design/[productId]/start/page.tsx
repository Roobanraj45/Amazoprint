'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getProductBySlug } from '@/app/actions/product-actions';
import { getPricingRulesForSubProduct } from '@/app/actions/pricing-actions';
import { getSession } from '@/app/actions/user-actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup } from '@/components/ui/radio-group';
import { ArrowRight, ImagePlus, LayoutTemplate, PenSquare, Trophy, IndianRupee, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveImagePath } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

type ProductWithSubProducts = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
type SubProductData = ProductWithSubProducts['subProducts'][0];

export default function StartDesignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState<ProductWithSubProducts | null>(null);
  const [subProduct, setSubProduct] = useState<SubProductData | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<{ original: number; final: number; discount: number; description: string | null } | null>(null);

  const [quantity, setQuantity] = useState('100');
  const [pages, setPages] = useState('1');
  const [spotUv, setSpotUv] = useState(false);

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
    let priceDescription: string | null = null;

    // Find standard pricing rule for quantity
    const standardRule = pricingRules.find(r => !r.isDiscount && !r.isContest && !r.isVerification && qty >= (r.minQuantity || 1) && (!r.maxQuantity || qty <= r.maxQuantity));
    if (standardRule && standardRule.unitPrice) {
        basePrice = Number(standardRule.unitPrice);
        finalPrice = basePrice;
    }

    // Find discount rule for quantity
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

    setCalculatedPrice({
        original: basePrice * qty,
        final: finalPrice * qty,
        discount: discount * qty,
        description: discountDescription,
    });

}, [quantity, subProduct, pricingRules]);

  const constructedQuery = useMemo(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('quantity', quantity);
    newParams.set('pages', pages);
    if (spotUv && subProduct?.spotUvAllowed) {
      newParams.set('spotUv', 'true');
    } else {
      newParams.delete('spotUv');
    }
    return newParams.toString();
  }, [searchParams, quantity, pages, spotUv, subProduct]);

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
            <Header />
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        </div>
    );
  }

  if (!product || !subProduct) {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
            <Header />
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
                <h1 className="text-2xl font-bold">Product not found</h1>
                <Button asChild><Link href="/products">Back to Products</Link></Button>
            </div>
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col">
      <Header />
      {/* Added pt-20 to push content below a fixed header */}
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT SIDE: Product Summary (Sticky) */}
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
                      <div className="rounded-md border bg-muted/30 p-2.5 dark:border-slate-800">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Dimensions</p>
                          <p className="text-sm font-medium">{subProduct.width} x {subProduct.height} mm</p>
                        </div>
                    </div>
                  </div>
                </Card>
              </aside>

              {/* RIGHT SIDE: Design Selection & Config */}
              <div className="lg:col-span-7 space-y-12">

              {discountRules.length > 0 && (
                        <Card className="border shadow-sm bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Volume Discounts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {discountRules.map(rule => {
                                    const qty = parseInt(quantity, 10);
                                    const isActive = !isNaN(qty) && qty >= (rule.minQuantity || 1) && (!rule.maxQuantity || qty <= rule.maxQuantity);
                                    const discountText = rule.discountType === 'percentage'
                                        ? `${rule.discountValue}% OFF`
                                        : `₹${rule.discountValue} OFF`;
                                    return (
                                        <div key={rule.id} className={cn(
                                            "p-3 rounded-lg border transition-all", 
                                            isActive 
                                                ? "border-primary bg-primary/5 ring-2 ring-primary shadow-lg" 
                                                : "bg-muted/30 dark:bg-slate-800/50"
                                        )}>
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-sm">
                                                    {rule.minQuantity || 1}{rule.maxQuantity ? ` - ${rule.maxQuantity}` : '+'} units
                                                </p>
                                                <Badge variant={isActive ? "default" : "secondary"}>{discountText}</Badge>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

              <div className="space-y-6">
                    <Card className="border shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Specifications</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Quantity</Label>
                          <Select value={quantity} onValueChange={setQuantity}>
                            <SelectTrigger className="w-full h-10"><SelectValue/></SelectTrigger>
                            <SelectContent>
                              {[100, 250, 500, 1000, 2500, 5000].map(q => (
                                <SelectItem key={q} value={String(q)}>{q} pieces</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Print Sides</Label>
                          <RadioGroup value={pages} onValueChange={setPages} className="grid grid-cols-2 gap-3">
                            <div 
                              onClick={() => setPages('1')}
                              className={cn(
                                "flex items-center justify-center p-2.5 rounded-md border text-sm font-medium cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                                pages === '1' ? "border-primary bg-primary/5 ring-1 ring-primary" : "text-muted-foreground dark:border-slate-800"
                              )}
                            >Single Sided</div>
                            <div 
                              onClick={() => setPages('2')}
                              className={cn(
                                "flex items-center justify-center p-2.5 rounded-md border text-sm font-medium cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                                pages === '2' ? "border-primary bg-primary/5 ring-1 ring-primary" : "text-muted-foreground dark:border-slate-800"
                              )}
                            >Double Sided</div>
                          </RadioGroup>
                        </div>

                        {subProduct.spotUvAllowed && (
                          <div className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-800 bg-amber-50/20 dark:bg-amber-900/10">
                            <div className="space-y-0.5">
                              <Label htmlFor="spot-uv" className="flex items-center gap-1.5 text-sm">
                                <Sparkles className="text-amber-500" size={14}/> Spot UV Finish
                              </Label>
                              <p className="text-[11px] text-muted-foreground">Add premium raised gloss</p>
                            </div>
                            <Switch id="spot-uv" checked={spotUv} onCheckedChange={setSpotUv} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="border shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-base">Price Details</CardTitle>
                            <CardDescription>Based on your selection.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingPricing ? (
                                <div className="flex items-center justify-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : calculatedPrice ? (
                                <div className="space-y-3">
                                    {calculatedPrice.discount > 0 && calculatedPrice.description && (
                                        <>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Base Price</span>
                                                <span className="line-through">₹{calculatedPrice.original.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-emerald-600 font-medium">
                                                <span>Discount ({calculatedPrice.description})</span>
                                                <span>- ₹{calculatedPrice.discount.toFixed(2)}</span>
                                            </div>
                                            <Separator />
                                        </>
                                    )}
                                    <div className="flex justify-between items-center font-bold text-xl text-primary">
                                        <span>Total Price</span>
                                        <span className="flex items-center">
                                            <IndianRupee size={18} className="mr-0.5"/>
                                            {calculatedPrice.final.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-8">Select quantity to view price.</div>
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
                                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{option.title}</CardTitle>
                                  {option.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
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
          </div>
        </div>
      </main>
    </div>
  );
}
