'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getProductBySlug } from '@/app/actions/product-actions';
import { getPricingRulesForSubProduct } from '@/app/actions/pricing-actions';
import { getSession } from '@/app/actions/user-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup } from '@/components/ui/radio-group';
import { ArrowRight, ImagePlus, LayoutTemplate, PenSquare, Trophy, IndianRupee, Sparkles, ShieldCheck, Loader2, Layers, Square, CheckCircle2, PlusCircle, Zap, Briefcase, HelpCircle, Info, Sparkle, Circle, Hexagon, Triangle, Star, Scissors, Hash, Package2, Truck, Lock, Check, ChevronLeft, ChevronRight, Search, FileText, MessageSquare, Upload, Copy } from 'lucide-react';
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
    basePriceTotal: number;
    original: number; 
    final: number; 
    discount: number; 
    description: string | null;
    addons: { name: string; totalAmount: number }[];
  } | null>(null);

  const [quantity, setQuantity] = useState('500');
  const [pages, setPages] = useState('1');
  const [spotUv, setSpotUv] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [foilTypes, setFoilTypes] = useState<FoilType[]>([]);
  const [customWidth, setCustomWidth] = useState(searchParams.get('width') || '');
  const [customHeight, setCustomHeight] = useState(searchParams.get('height') || '');
  const [selectedDie, setSelectedDie] = useState<number | null>(null);
  const [dieCuts, setDieCuts] = useState<any[]>([]);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'templates', 'guidelines', 'shipping', 'reviews'
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0);

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

  const handleSubProductChange = useCallback((sp: SubProductData) => {
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
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('subProductId', String(sp.id));
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

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
        basePriceTotal: basePrice * qty,
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

  const thumbnailImages = useMemo(() => {
    if (!subProduct && !product) return [];
    const images: string[] = [];
    
    if (subProduct) {
        if (subProduct.imageUrl) {
            images.push(resolveImagePath(subProduct.imageUrl));
        }
        if (Array.isArray(subProduct.imageUrls)) {
            subProduct.imageUrls.forEach(url => {
                if (url) {
                    const img = resolveImagePath(url);
                    if (!images.includes(img)) images.push(img);
                }
            });
        }
    }

    if (images.length === 0 && product?.imageUrl) {
        images.push(resolveImagePath(product.imageUrl));
    }

    if (images.length === 1) {
        images.push(images[0]);
        images.push(images[0]);
        images.push(images[0]);
    }
    return images.slice(0, 4);
  }, [subProduct, product]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
    );
  }

  if (!product || !subProduct) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4 bg-slate-50 dark:bg-slate-950">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Product not found</h1>
            <Button asChild className="rounded-xl font-bold"><Link href="/products">Back to Products Directory</Link></Button>
        </div>
    );
  }

  const isLoggedIn = !!session;
  const currentDisplayImage = thumbnailImages[activeThumbnailIndex] || resolveImagePath(subProduct?.imageUrl || product.imageUrl);

  return (
    <main className="flex-grow pt-24 pb-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-[1400px] space-y-16">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
              <span>›</span>
              <Link href="/products" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">All Products</Link>
              <span>›</span>
              <Link href={`/products#${product.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{product.name}</Link>
              {subProduct && (
                  <>
                      <span>›</span>
                      <span className="text-slate-900 dark:text-white font-bold">{subProduct.name}</span>
                  </>
              )}
          </nav>

          {/* MAIN SPLIT SECTION: Left (Images & Design Options) | Right (Config & Price Box) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* LEFT COLUMN: Media Viewer & Design It Your Way */}
              <div className="lg:col-span-6 space-y-8">
                  {/* Main Product Image Viewer */}
                  <div className="space-y-4">
                      <div className="aspect-[4/3] relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md group flex items-center justify-center">
                          {currentDisplayImage ? (
                              <Image 
                                  src={currentDisplayImage} 
                                  alt={product.name} 
                                  fill 
                                  className="object-contain p-8 transition-transform duration-700 group-hover:scale-105" 
                                  priority 
                              />
                          ) : (
                              <LayoutTemplate className="h-20 w-20 text-slate-300 dark:text-slate-700" />
                          )}
                          <div className="absolute top-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all hover:scale-110">
                              <Search className="w-5 h-5" />
                          </div>
                      </div>

                      {/* Thumbnail Selector Carousel */}
                      <div className="flex items-center justify-between gap-3">
                          <button 
                              onClick={() => setActiveThumbnailIndex(prev => prev > 0 ? prev - 1 : thumbnailImages.length - 1)}
                              className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
                          >
                              <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div className="flex items-center gap-3 flex-1 justify-center overflow-x-auto py-1">
                              {thumbnailImages.map((img, idx) => (
                                  <button
                                      key={idx}
                                      onClick={() => setActiveThumbnailIndex(idx)}
                                      className={cn(
                                          "relative w-20 h-16 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-50 dark:bg-slate-900",
                                          activeThumbnailIndex === idx ? "border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-600/20 shadow-md scale-105" : "border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100"
                                      )}
                                  >
                                      <Image src={img} alt={`Thumbnail ${idx+1}`} fill className="object-cover" />
                                  </button>
                              ))}
                          </div>
                          <button 
                              onClick={() => setActiveThumbnailIndex(prev => prev < thumbnailImages.length - 1 ? prev + 1 : 0)}
                              className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
                          >
                              <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                  </div>

                  {/* Design It Your Way Container */}
                  <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
                      <div className="space-y-1">
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm tracking-tight">
                              <Sparkles className="w-4 h-4 animate-pulse" /> Design it Your Way
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Use our easy design tool or hire a professional designer.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Design Online Card */}
                          <div className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between space-y-6 group hover:border-indigo-500/50 transition-all">
                              <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                                      <LayoutTemplate className="w-6 h-6" />
                                  </div>
                                  <div>
                                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Design Online</h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Use our easy drag & drop tool.</p>
                                  </div>
                              </div>
                              <Button asChild className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-extrabold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                  <Link href={`/design/${product.slug}?${constructedQuery}`}>Start Designing</Link>
                              </Button>
                          </div>

                          {/* Hire a Designer Card */}
                          <div className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between space-y-6 group hover:border-pink-500/50 transition-all relative overflow-hidden">
                              <div className="absolute top-3 right-3 bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-200 dark:border-pink-800 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight uppercase">
                                  Popular
                              </div>
                              <div className="flex items-start gap-4 pr-12">
                                  <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-100 dark:border-pink-900 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                                      <Trophy className="w-6 h-6" />
                                  </div>
                                  <div>
                                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Hire a Designer</h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Work with our professional designers.</p>
                                  </div>
                              </div>
                              <Button asChild variant="outline" className="w-full h-12 rounded-xl border-2 border-pink-600 text-pink-600 dark:border-pink-500 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 font-extrabold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                                  <Link href={`/client/contests/create?productId=${product.id}&subProductId=${subProduct.id}`}>Hire a Designer</Link>
                              </Button>
                          </div>
                      </div>

                      <div className="text-center pt-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Not sure? Get inspiration from our <Link href={`/design/${product.slug}/templates?${constructedQuery}`} className="text-pink-600 dark:text-pink-400 font-extrabold hover:underline">templates</Link>
                          </p>
                      </div>
                  </div>
              </div>

              {/* RIGHT COLUMN: Product Configuration & Price Box */}
              <div className="lg:col-span-6 space-y-8">
                  {/* Product Title & Reviews Header */}
                  <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                              {subProduct?.name || product.name}
                          </h1>
                          <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 pt-0.5">
                              <Package2 className="w-3.5 h-3.5 inline-block" /> {product.name}
                          </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center text-amber-500 gap-0.5">
                              <Star className="w-4 h-4 fill-amber-500" />
                              <Star className="w-4 h-4 fill-amber-500" />
                              <Star className="w-4 h-4 fill-amber-500" />
                              <Star className="w-4 h-4 fill-amber-500" />
                              <Star className="w-4 h-4 fill-amber-500" />
                          </div>
                          <span className="text-slate-900 dark:text-white ml-1">4.8</span>
                          <span className="text-slate-400 dark:text-slate-500 font-semibold">(245 Reviews)</span>
                      </div>
                  </div>

                  {/* Option Groups Matrix */}
                  <div className="space-y-6">
                      {/* 1. Size Selection */}
                      <div className="space-y-3">
                          <Label className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">1.</span> Size
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {product.subProducts.map(sp => (
                                  <button
                                      key={sp.id}
                                      onClick={() => handleSubProductChange(sp)}
                                      className={cn(
                                          "py-3 px-3 rounded-2xl border text-xs font-extrabold transition-all text-center flex items-center justify-center shadow-sm",
                                          subProduct.id === sp.id 
                                              ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md ring-2 ring-slate-900/10 dark:ring-white/10 scale-[1.02]" 
                                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                                      )}
                                  >
                                      {sp.width === 0 && sp.height === 0 ? 'Custom Size' : `${sp.width}" x ${sp.height}"`}
                                  </button>
                              ))}
                          </div>
                          {subProduct.width === 0 && subProduct.height === 0 && (
                              <div className="grid grid-cols-2 gap-4 pt-2 animate-in zoom-in-95 duration-300">
                                  <div className="space-y-1.5">
                                      <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Custom Width</Label>
                                      <Input 
                                          type="number" 
                                          value={customWidth} 
                                          onChange={(e) => setCustomWidth(e.target.value)} 
                                          placeholder="Width" 
                                          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-sm" 
                                      />
                                  </div>
                                  <div className="space-y-1.5">
                                      <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Custom Height</Label>
                                      <Input 
                                          type="number" 
                                          value={customHeight} 
                                          onChange={(e) => setCustomHeight(e.target.value)} 
                                          placeholder="Height" 
                                          className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-sm" 
                                      />
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* 2. Add on & Finishes */}
                      <div className="space-y-3">
                          <Label className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">2.</span> Add on & Finishes
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {/* Default Paper Type Pill */}
                              <button className="py-3 px-3 rounded-2xl border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold text-center shadow-md ring-2 ring-slate-900/10 dark:ring-white/10 scale-[1.02]">
                                  Premium Matte
                              </button>

                              {/* Spot UV Toggle Pill */}
                              {subProduct.spotUvAllowed && (
                                  <button
                                      onClick={() => setSpotUv(!spotUv)}
                                      className={cn(
                                          "py-3 px-3 rounded-2xl border text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm",
                                          spotUv 
                                              ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-md scale-[1.02]" 
                                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                      )}
                                  >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Spot UV
                                  </button>
                              )}

                              {/* Addons Pills */}
                              {addonRules.map(rule => {
                                  const isSelected = selectedAddons.includes(rule.id);
                                  return (
                                      <button
                                          key={rule.id}
                                          onClick={() => toggleAddon(rule.id)}
                                          className={cn(
                                              "py-3 px-3 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm truncate",
                                              isSelected 
                                                  ? "border-indigo-600 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20 shadow-md scale-[1.02]" 
                                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                          )}
                                      >
                                          <div className="flex items-center gap-1.5 shrink-0">
                                              {rule.addonImageUrl ? (
                                                  <>
                                                      <img 
                                                          src={resolveImagePath(rule.addonImageUrl)} 
                                                          alt={rule.addonName || 'Addon'} 
                                                          className="w-4 h-4 object-contain shrink-0" 
                                                          onError={(e) => { 
                                                              e.currentTarget.style.display = 'none'; 
                                                              const nextEl = e.currentTarget.nextElementSibling;
                                                              if (nextEl) nextEl.classList.remove('hidden');
                                                          }} 
                                                      />
                                                      <Sparkle className="w-4 h-4 shrink-0 hidden text-indigo-500" />
                                                  </>
                                              ) : (
                                                  <Sparkle className="w-4 h-4 shrink-0 text-indigo-500" />
                                              )}
                                          </div>
                                          <span className="truncate">{rule.addonName}</span>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      {/* 3. Shapes & Die cuts (Proportioned Image Buttons) */}
                      <div className="space-y-3">
                          <Label className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">3.</span> Shapes & Die cuts
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {/* Default Standard Shape Card */}
                              <button 
                                  onClick={() => setSelectedDie(null)}
                                  className={cn(
                                      "group relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all overflow-hidden text-center shadow-sm hover:shadow-md",
                                      !selectedDie 
                                          ? "border-slate-900 dark:border-white bg-slate-900/5 dark:bg-white/5 ring-4 ring-slate-900/10 dark:ring-white/10 scale-[1.02]" 
                                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                                  )}
                              >
                                  <div className="w-4/5 aspect-[4/3] mx-auto bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform p-2">
                                      <LayoutTemplate className={cn("w-7 h-7", !selectedDie ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600")} />
                                  </div>
                                  <span className={cn("text-xs font-black tracking-tight line-clamp-1", !selectedDie ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300")}>
                                      Standard (No Die Cut)
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold mt-0.5">Regular Cut</span>
                              </button>

                              {availableDieCuts.map(die => (
                                  <button
                                      key={die.id}
                                      onClick={() => setSelectedDie(selectedDie === die.id ? null : die.id)}
                                      className={cn(
                                          "group relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all overflow-hidden text-center shadow-sm hover:shadow-md",
                                          selectedDie === die.id 
                                              ? "border-indigo-600 bg-indigo-600/5 ring-4 ring-indigo-600/20 scale-[1.02]" 
                                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                                      )}
                                  >
                                      <div className="w-4/5 aspect-[4/3] mx-auto bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center mb-2 overflow-hidden relative group-hover:scale-105 transition-transform p-2">
                                          {die.imageUrl ? (
                                              <>
                                                  <img 
                                                      src={resolveImagePath(die.imageUrl)} 
                                                      alt={die.name || 'Die Cut'} 
                                                      className="w-full h-full object-contain" 
                                                      onError={(e) => { 
                                                          e.currentTarget.style.display = 'none'; 
                                                          const nextEl = e.currentTarget.nextElementSibling;
                                                          if (nextEl) nextEl.classList.remove('hidden');
                                                      }} 
                                                  />
                                                  <Scissors className="w-7 h-7 hidden text-indigo-500" />
                                              </>
                                          ) : (
                                              <Scissors className="w-7 h-7 text-indigo-500" />
                                          )}
                                      </div>
                                      <span className={cn("text-xs font-black tracking-tight line-clamp-1", selectedDie === die.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300")}>
                                          {die.name}
                                      </span>
                                      <span className="text-[10px] text-indigo-500 font-bold mt-0.5">Custom Die Shape</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* 4. Print Sides */}
                      {subProduct.maxPages > 1 && (
                          <div className="space-y-3">
                              <Label className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                                  <span className="text-indigo-600 dark:text-indigo-400 font-black">4.</span> Print Sides
                              </Label>
                              <div className="grid grid-cols-2 gap-2.5">
                                  <button 
                                      onClick={() => setPages('1')}
                                      className={cn(
                                          "py-3 px-4 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm",
                                          pages === '1' ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md ring-2 ring-slate-900/10 dark:ring-white/10 scale-[1.02]" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                      )}
                                  >
                                      <FileText className={cn("w-4 h-4 shrink-0", pages === '1' ? "text-white dark:text-slate-900" : "text-indigo-500")} />
                                      <span>Front Only</span>
                                  </button>
                                  <button 
                                      onClick={() => setPages('2')}
                                      className={cn(
                                          "py-3 px-4 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm",
                                          pages === '2' ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md ring-2 ring-slate-900/10 dark:ring-white/10 scale-[1.02]" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                      )}
                                  >
                                      <Copy className={cn("w-4 h-4 shrink-0", pages === '2' ? "text-white dark:text-slate-900" : "text-indigo-500")} />
                                      <span>Front & Back</span>
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* 5. Quantity Select */}
                      <div className="space-y-3">
                          <Label className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">5.</span> Quantity
                          </Label>
                          {subProduct.width === 0 && subProduct.height === 0 ? (
                              <Input 
                                  type="number" 
                                  min="1" 
                                  value={quantity} 
                                  onChange={(e) => setQuantity(e.target.value)} 
                                  className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-base shadow-inner pl-4" 
                              />
                          ) : (
                              <Select value={quantity} onValueChange={setQuantity}>
                                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-extrabold text-sm shadow-inner px-4">
                                      <SelectValue placeholder="Select Quantity" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                      {[100, 250, 500, 1000, 2500, 5000].map((qty) => (
                                          <SelectItem key={qty} value={String(qty)} className="rounded-xl font-extrabold">
                                              {qty} Cards
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          )}
                      </div>
                  </div>

                  {/* Price Box Container */}
                  <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                          <div>
                              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Price</p>
                              <div className="flex items-baseline gap-3">
                                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
                                      <IndianRupee className="mr-0.5 stroke-[3]" size={28} />
                                      {calculatedPrice ? calculatedPrice.final.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '...'}
                                  </span>
                                  {calculatedPrice && calculatedPrice.discount > 0 && (
                                      <>
                                          <span className="text-lg font-extrabold text-slate-400 dark:text-slate-500 line-through">
                                              ₹{calculatedPrice.original.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </span>
                                          <span className="bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-200 dark:border-pink-800 px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-tight">
                                              {calculatedPrice.description}
                                          </span>
                                      </>
                                  )}
                              </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 py-2 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                              <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Ships in 2-3 Business Days
                          </div>
                      </div>

                      {/* Price Split-up / Breakdown */}
                      {calculatedPrice && (
                          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                              <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price Breakdown</p>
                              <div className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                  <div className="flex justify-between items-center py-1">
                                      <span>Base Product ({quantity} Cards)</span>
                                      <span className="font-extrabold text-slate-900 dark:text-white">
                                          ₹{(calculatedPrice.basePriceTotal ?? calculatedPrice.original ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                  </div>
                                  {calculatedPrice.discount > 0 && (
                                      <div className="flex justify-between items-center py-1 text-pink-600 dark:text-pink-400">
                                          <span>Volume Discount ({calculatedPrice.description})</span>
                                          <span className="font-extrabold">-₹{calculatedPrice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                  )}
                                  {calculatedPrice.addons.map((addon, idx) => (
                                      <div key={idx} className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800/60">
                                          <span>{addon.name}</span>
                                          <span className="font-extrabold text-slate-900 dark:text-white">
                                              {addon.totalAmount > 0 ? `₹${addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Free'}
                                          </span>
                                      </div>
                                  ))}
                                  <div className="flex justify-between items-center py-2 border-t-2 border-slate-200 dark:border-slate-800 font-black text-sm text-slate-900 dark:text-white">
                                      <span>Total Estimated Price</span>
                                      <span>₹{calculatedPrice.final.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Action CTAs Side-by-Side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-extrabold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all text-base gap-2">
                              <Link href={`/design/${product.slug}/templates?${constructedQuery}`}>
                                  <LayoutTemplate className="w-5 h-5" /> Design Template
                              </Link>
                          </Button>
                          <Button asChild variant="outline" className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 font-extrabold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-base gap-2">
                              <Link href={isLoggedIn ? `/design/${product.slug}/upload?${constructedQuery}` : `/login?redirect_url=/design/${product.slug}/upload%3F${constructedQuery}`}>
                                  <Upload className="w-5 h-5" /> Upload Artwork
                              </Link>
                          </Button>
                      </div>

                      <div className="text-center pt-2">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              Need a design? <Link href={`/client/contests/create?productId=${product.id}&subProductId=${subProduct.id}`} className="text-pink-600 dark:text-pink-400 font-extrabold hover:underline">Get a Free Quote</Link>
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* MIDDLE BANNER: Trust Badges Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8 px-8 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                      <Truck className="w-6 h-6" />
                  </div>
                  <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Free Shipping</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">On all orders over ₹5000</p>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">100% Satisfaction</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Quality is our priority</p>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
                      <Zap className="w-6 h-6" />
                  </div>
                  <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Fast Turnaround</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Get your prints on time</p>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-sm shrink-0">
                      <Lock className="w-6 h-6" />
                  </div>
                  <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Secure Payment</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Safe & secure checkout</p>
                  </div>
              </div>
          </div>

          {/* BOTTOM DETAILS SECTION: Tabs & Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8 border-t border-slate-200 dark:border-slate-800">
              {/* Sidebar Navigation Tabs */}
              <div className="lg:col-span-3 space-y-2">
                  {[
                      { id: 'details', label: 'Product Details', icon: FileText },
                      { id: 'templates', label: 'Templates', icon: LayoutTemplate },
                      { id: 'guidelines', label: 'Design Guidelines', icon: Sparkles },
                      { id: 'shipping', label: 'Shipping Information', icon: Truck },
                      { id: 'reviews', label: 'Reviews (245)', icon: MessageSquare },
                  ].map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-extrabold text-xs transition-all text-left",
                              activeTab === tab.id 
                                  ? "bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border-l-4 border-pink-600 dark:border-pink-500 shadow-sm pl-5" 
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                          )}
                      >
                          <tab.icon className="w-4 h-4 shrink-0" /> {tab.label}
                      </button>
                  ))}
              </div>

              {/* Tab Content Area */}
              <div className="lg:col-span-9 p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-8">
                  {activeTab === 'details' && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                          <div className="md:col-span-7 space-y-6">
                              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Product Details</h3>
                              {(subProduct?.description || product.description) && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                      {subProduct?.description || product.description}
                                  </p>
                              )}
                              <ul className="space-y-3 pt-2">
                                  {[
                                      "High-quality printing with vibrant colors",
                                      "Premium paper stock options",
                                      "Multiple finishes available",
                                      "Fast turnaround and delivery"
                                  ].map((bullet, idx) => (
                                      <li key={idx} className="flex items-center gap-3 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                          <div className="w-5 h-5 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 flex items-center justify-center shrink-0">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                          {bullet}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                          <div className="md:col-span-5 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner space-y-4">
                              <div className="w-full aspect-[3.5/2] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 relative shadow-sm">
                                  <LayoutTemplate className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">2&quot;</div>
                                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500">3.5&quot;</div>
                              </div>
                              <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2">Standard Dimensions</p>
                          </div>
                      </div>
                  )}

                  {activeTab === 'templates' && (
                      <div className="space-y-6">
                          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Professional Templates</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              Browse our extensive library of fully customizable, industry-standard design templates created by professional graphic designers.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                              {[1, 2, 3].map((i) => (
                                  <div key={i} className="aspect-[4/3] rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center group overflow-hidden relative shadow-sm">
                                      <LayoutTemplate className="w-10 h-10 text-slate-300 dark:text-slate-700 group-hover:scale-110 transition-transform" />
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <Button size="sm" className="h-8 rounded-xl font-bold text-xs" asChild>
                                              <Link href={`/design/${product.slug}/templates?${constructedQuery}`}>Use Template</Link>
                                          </Button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {activeTab === 'guidelines' && (
                      <div className="space-y-6">
                          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Design Guidelines</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              To ensure the highest quality print results, please ensure your uploaded artwork adheres to our pre-press technical specifications.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Bleed & Safety Margins</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Include a 3mm bleed around all edges. Keep critical text and logos within the safety margin.</p>
                              </div>
                              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Color Mode & Resolution</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Submit files in CMYK color space with a minimum resolution of 300 DPI for crystal clear printing.</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'shipping' && (
                      <div className="space-y-6">
                          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Shipping Information</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              We offer secure, insured courier delivery across all major destinations with complete tracking visibility from dispatch to your doorstep.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Standard Delivery</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">3-5 business days after dispatch.</p>
                              </div>
                              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Express Priority</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">1-2 business days after dispatch.</p>
                              </div>
                              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Packaging Assurance</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Weatherproof, rigid box transit packing.</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'reviews' && (
                      <div className="space-y-8">
                          <div className="space-y-6">
                              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                  <div>
                                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Customer Reviews</h3>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Based on 245 verified customer purchases</p>
                                  </div>
                                  <div className="flex items-center gap-1 text-amber-500 font-black text-xl">
                                      <Star className="w-5 h-5 fill-amber-500" /> 4.8 / 5.0
                                  </div>
                              </div>
                              <div className="space-y-4 pt-2">
                                  {[
                                      { name: "Rahul Sharma", date: "May 14, 2026", comment: "Absolutely stunning print quality! The premium matte finish feels incredibly professional and elegant." },
                                      { name: "Priya Patel", date: "May 10, 2026", comment: "Super fast turnaround time and the packaging was extremely secure. Will definitely order all my business cards here!" },
                                  ].map((rev, idx) => (
                                      <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                          <div className="flex items-center justify-between">
                                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">{rev.name}</span>
                                              <span className="text-[10px] font-bold text-slate-400">{rev.date}</span>
                                          </div>
                                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{rev.comment}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* SUB PRODUCT DESCRIPTION SECTION BELOW REVIEWS */}
                          {(subProduct?.description || product.description) && (
                              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-pink-600 dark:text-pink-400" /> About {subProduct?.name || product.name}
                                  </h4>
                                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-pink-50/30 dark:from-slate-950 dark:to-pink-950/20 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                          {subProduct?.description || product.description}
                                      </p>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>

          {/* PREMIUM PRODUCT STORY & VALUE PROPOSITION */}
          <div className="p-8 sm:p-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden space-y-12">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

              <div className="relative z-10 max-w-3xl space-y-4">
                  <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs px-3 py-1 rounded-full font-extrabold uppercase tracking-wider w-fit">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse text-indigo-600 dark:text-indigo-400" /> Premium Craftsmanship
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      Make an unforgettable first impression with business cards that feel as premium as your reputation.
                  </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {/* Key Features */}
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between">
                      <div className="space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <Star className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Key Features</h3>
                          <ul className="space-y-3.5 pt-1">
                              {[
                                  "300 GSM premium cardstock for a substantial, professional feel",
                                  "Stunning gloss lamination that catches light and protect against wear",
                                  "Single or double-sided printing options to match your brand",
                                  "Quick 4-5 day turnaround without compromising quality"
                              ].map((feat, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                                      <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900">
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </div>
                                      {feat}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>

                  {/* Top Benefits */}
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm hover:border-pink-500/50 transition-all duration-300 flex flex-col justify-between">
                      <div className="space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-100 dark:border-pink-900 flex items-center justify-center text-pink-600 dark:text-pink-400">
                              <Trophy className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Top Benefits</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed pt-1">
                              Your Gloss Laminated Business Card isn&apos;t just contact information—it&apos;s a tangible representation of your professionalism. The 300 GSM weight gives it a luxurious heft that instantly signals quality, while the gloss lamination creates a mirror-like finish that makes colors pop and text shimmer.
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              This protective layer also ensures your cards stay pristine through countless handshakes, coffee meetings, and desk shuffles.
                          </p>
                      </div>
                  </div>

                  {/* Who It's For */}
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between">
                      <div className="space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <Briefcase className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Who It&apos;s For</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed pt-1">
                              Perfect for entrepreneurs, executives, and professionals who refuse to settle for ordinary. Whether you&apos;re closing deals, networking at conferences, or building client relationships, these cards elevate your personal brand and make you memorable.
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              Clients won&apos;t toss these aside—they&apos;ll keep them on their desk as a reminder of your excellence.
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* RELATED PRODUCTS CAROUSEL: You May Also Like */}
          <div className="space-y-6 pt-12 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">You May Also Like</h3>
                  <div className="flex items-center gap-2">
                      <button className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
                          <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
                          <ChevronRight className="w-5 h-5" />
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {(() => {
                      const relatedSubProducts = product.subProducts.filter(sp => sp.id !== subProduct?.id);
                      const displaySubProducts = relatedSubProducts.length > 0 ? relatedSubProducts : product.subProducts;
                      return displaySubProducts.map((rel) => {
                          const imageSrc = rel.imageUrl || rel.imageUrls?.[0] || product.imageUrl;
                          return (
                              <Link 
                                  key={rel.id} 
                                  href={`/design/${product.slug}?subProductId=${rel.id}`}
                                  className="group border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col p-4 space-y-4"
                              >
                                  <div className="aspect-[4/3] rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden relative border border-slate-200/50 dark:border-slate-800/50">
                                      {imageSrc ? (
                                          <Image src={resolveImagePath(imageSrc)} alt={rel.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                      ) : (
                                          <LayoutTemplate className="w-10 h-10 text-slate-300 dark:text-slate-700 group-hover:scale-110 transition-transform duration-500" />
                                      )}
                                  </div>
                                  <div className="space-y-1 text-center sm:text-left flex-1 flex flex-col justify-between">
                                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{rel.name}</h4>
                                      <p className="text-xs font-extrabold text-slate-400 dark:text-slate-500 pt-2">From ₹{parseFloat(rel.price || '0').toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                                  </div>
                              </Link>
                          );
                      });
                  })()}
              </div>
          </div>

        </div>
    </main>
  );
}
