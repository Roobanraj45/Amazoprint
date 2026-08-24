'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sparkles, Package2, Leaf, ShieldCheck, Palette, ArrowRight, CheckCircle2, IndianRupee, Search, Filter, Star, Zap, Flame, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resolveImagePath, cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Helper function to extract discount info
const getDiscountInfo = (subProduct: any) => {
    if (!subProduct.pricingRules || subProduct.pricingRules.length === 0) {
        return null;
    }

    const discountRules = subProduct.pricingRules
        .filter((r: any) => r.isDiscount && r.discountValue && Number(r.discountValue) > 0)
        .sort((a: any, b: any) => (a.minQuantity || 1) - (b.minQuantity || 1));

    if (discountRules.length === 0) {
        return null;
    }
    
    const bestDiscountRule = discountRules[0];

    if (bestDiscountRule.discountType === 'percentage') {
        return `${Number(bestDiscountRule.discountValue)}% OFF`;
    }
    if (bestDiscountRule.discountType === 'fixed') {
        const discountValue = Number(bestDiscountRule.discountValue);
        if (discountValue > 0) {
            return `₹${discountValue} OFF`;
        }
    }

    return null;
}

const CATEGORY_ASSETS: Record<string, { emoji: string, bg: string, label: string }> = {
    'All': { emoji: '🛍️', bg: 'from-slate-100 to-slate-200', label: 'All Categories' },
    'Business Cards': { emoji: '🪪', bg: 'from-[#464674]/5 to-[#464674]/20', label: 'Business Cards' },
    'Visiting Cards': { emoji: '🪪', bg: 'from-[#464674]/5 to-[#464674]/20', label: 'Visiting Cards' },
    'Letterhead': { emoji: '📄', bg: 'from-blue-50 to-indigo-100', label: 'Letterhead' },
    'Letterheads': { emoji: '📄', bg: 'from-blue-50 to-indigo-100', label: 'Letterheads' },
    'Flyers': { emoji: '📄', bg: 'from-orange-50 to-amber-100', label: 'Flyers' },
    'Brochures': { emoji: '📋', bg: 'from-violet-50 to-purple-100', label: 'Brochures' },
    'Stickers': { emoji: '⭐', bg: 'from-yellow-50 to-lime-100', label: 'Stickers' },
    'Posters': { emoji: '🖼️', bg: 'from-green-50 to-emerald-100', label: 'Posters' },
    'Banners': { emoji: '🏳️', bg: 'from-red-50 to-rose-100', label: 'Banners' },
    'Packaging': { emoji: '📦', bg: 'from-amber-50 to-orange-100', label: 'Packaging' },
    'T-Shirts': { emoji: '👕', bg: 'from-pink-50 to-fuchsia-100', label: 'T-Shirts' },
    'Invitations': { emoji: '💌', bg: 'from-purple-50 to-pink-100', label: 'Invitations' },
    'Envelopes': { emoji: '✉️', bg: 'from-emerald-50 to-teal-100', label: 'Envelopes' },
    'Gifts': { emoji: '🎁', bg: 'from-amber-50 to-yellow-100', label: 'Gifts' },
    'ID Cards': { emoji: '🪪', bg: 'from-sky-50 to-blue-100', label: 'ID Cards' },
    'Calendars': { emoji: '📅', bg: 'from-cyan-50 to-blue-100', label: 'Calendars' },
};

export function ProductsClient({ initialProducts, directSellingProducts = [] }: { initialProducts: any[]; directSellingProducts?: any[] }) {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [activeFinish, setActiveFinish] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('default');

    // Extract all unique categories (product names and direct selling categories) for the filter pills
    const categories = useMemo(() => {
        const initialCats = initialProducts.map(p => p.name);
        const directCats = directSellingProducts.map(p => p.category).filter(Boolean);
        return ['All', ...Array.from(new Set([...initialCats, ...directCats]))];
    }, [initialProducts, directSellingProducts]);

    useEffect(() => {
        const catParam = searchParams.get('category') || searchParams.get('cat') || searchParams.get('product');
        const qParam = searchParams.get('q') || searchParams.get('search');
        if (catParam) {
            const cleanParam = decodeURIComponent(catParam).trim().toLowerCase();
            const matched = categories.find(
                c => c.toLowerCase() === cleanParam ||
                     c.toLowerCase().replace(/\s+/g, '-') === cleanParam ||
                     c.toLowerCase().replace(/-/g, ' ') === cleanParam ||
                     cleanParam.includes(c.toLowerCase()) ||
                     c.toLowerCase().includes(cleanParam)
            );
            if (matched) {
                setActiveCategory(matched);
            }
        }
        if (qParam) {
            setSearchQuery(decodeURIComponent(qParam).trim());
        }
    }, [searchParams, categories]);

    // Helper to get matching products count for a category
    const getCategoryCount = (catName: string) => {
        const initialCount = catName === 'All'
            ? initialProducts.reduce((acc, p) => acc + p.subProducts.filter((sp: any) => sp.isActive).length, 0)
            : (initialProducts.find(p => p.name === catName)?.subProducts.filter((sp: any) => sp.isActive).length || 0);

        const directCount = catName === 'All'
            ? directSellingProducts.length
            : directSellingProducts.filter((p: any) => p.category === catName).length;

        return initialCount + directCount;
    };

    // Filter and combine both standard sub-products and direct selling products
    const combinedProducts = useMemo(() => {
        const list: any[] = [];
        const searchLower = searchQuery.toLowerCase().trim();

        // 1. Process standard products & subproducts
        if (activeFinish !== '⚡ Direct Orders') {
            initialProducts.forEach(product => {
                if (activeCategory !== 'All' && product.name !== activeCategory) {
                    return;
                }

                product.subProducts.forEach((sp: any) => {
                    if (!sp.isActive) return;

                    const matchesName = sp.name.toLowerCase().includes(searchLower);
                    const matchesParent = product.name.toLowerCase().includes(searchLower);
                    if (searchLower && !matchesName && !matchesParent) return;

                    if (activeFinish === '✨ Spot UV' && !sp.spotUvAllowed) return;
                    if (activeFinish === '🏷️ Discounted' && !getDiscountInfo(sp)) return;

                    list.push({
                        type: 'custom',
                        id: `custom-${sp.id}`,
                        rawId: sp.id,
                        name: sp.name,
                        category: product.name,
                        parentProductSlug: product.slug,
                        parentProductName: product.name,
                        imageUrl: sp.imageUrl,
                        price: Number(sp.price || 0),
                        spotUvAllowed: sp.spotUvAllowed ?? false,
                        discountText: getDiscountInfo(sp),
                        rawItem: sp,
                    });
                });
            });
        }

        // 2. Process direct selling products
        if (activeFinish === 'All' || activeFinish === '⚡ Direct Orders' || activeFinish === '🏷️ Discounted') {
            directSellingProducts.forEach(product => {
                if (activeCategory !== 'All' && product.category !== activeCategory) {
                    return;
                }

                const matchesName = product.name.toLowerCase().includes(searchLower);
                const matchesCategory = (product.category || '').toLowerCase().includes(searchLower);
                const matchesDesc = (product.description || '').toLowerCase().includes(searchLower);
                const matchesTags = Array.isArray(product.tags) && product.tags.some((t: string) => t.toLowerCase().includes(searchLower));
                
                if (searchLower && !matchesName && !matchesCategory && !matchesDesc && !matchesTags) {
                    return;
                }

                const price = Number(product.sellingPrice || 0);
                const basePrice = Number(product.basePrice || 0);
                const isDiscounted = basePrice > price;

                if (activeFinish === '🏷️ Discounted' && !isDiscounted) {
                    return;
                }

                list.push({
                    type: 'direct',
                    id: `direct-${product.id}`,
                    rawId: product.id,
                    name: product.name,
                    category: product.category || 'Direct Order',
                    parentProductName: product.category || 'Direct Selling',
                    imageUrl: product.imageUrls?.[0],
                    price: price,
                    basePrice: basePrice,
                    isDiscounted: isDiscounted,
                    discountText: isDiscounted ? `${Math.round(((basePrice - price) / basePrice) * 100)}% OFF` : null,
                    description: product.description,
                    textAllowed: product.textAllowed,
                    isFeatured: product.isFeatured,
                    stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : (parseInt(product.stockQuantity as any) || 0),
                    minStockLevel: product.minStockLevel || 5,
                    rawItem: product,
                });
            });
        }

        // 3. Sort list
        if (sortBy === 'price-low') {
            list.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
            list.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }

        return list;
    }, [initialProducts, directSellingProducts, searchQuery, activeCategory, activeFinish, sortBy]);

    return (
        <div className="min-h-screen bg-[#F0F7FF] dark:bg-[#0B1528]">
            {/* Premium Header with subtle grid patterns */}
            <header className="pt-14 pb-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-[#F0F7FF] dark:bg-[#0B1528] relative overflow-hidden">
                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
                
                <div className="w-full px-3 sm:px-4 lg:px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                        <div className="space-y-2 max-w-xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold border border-primary/20 shadow-sm backdrop-blur-md">
                                <Sparkles className="w-3 h-3 animate-pulse" /> Print Shop
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                                Explore Our <span className="bg-gradient-to-r from-primary via-indigo-600 to-pink-600 bg-clip-text text-transparent">Products</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm leading-relaxed">
                                Customize dimensions, paper types, premium finishes, and instant direct orders.
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pb-1">
                            {[
                                { icon: ShieldCheck, text: "Quality verified", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
                                { icon: Leaf, text: "Eco-friendly", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
                                { icon: CheckCircle2, text: "Pre-press review", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" }
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-1.5 text-xs font-bold ${item.color} ${item.bg} border px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}>
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category bubbles grid (Shop Banner - Category Image style) */}
                    <div className="mt-4 bg-white/40 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
                        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-4">Popular Print Niches</p>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-4 justify-items-center">
                            {categories.map((category) => {
                                const prod = initialProducts.find(p => p.name === category);
                                const directProd = directSellingProducts.find(p => p.category === category);
                                const productImg = category === 'All'
                                    ? (initialProducts[0]?.imageUrl || directSellingProducts[0]?.imageUrls?.[0] || '/uploads/hero.png')
                                    : (prod?.imageUrl || prod?.subProducts?.[0]?.imageUrl || directProd?.imageUrls?.[0] || '/uploads/hero.png');
                                const resolvedImg = resolveImagePath(productImg);
                                const asset = CATEGORY_ASSETS[category] || { emoji: '📦', bg: 'from-gray-50 to-slate-100', label: category };
                                const count = getCategoryCount(category);
                                const isActive = activeCategory === category;
                                
                                return (
                                    <button 
                                        key={category} 
                                        onClick={() => setActiveCategory(category)}
                                        className="group flex flex-col items-center outline-none transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className={cn(
                                            "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-md border overflow-hidden relative transition-all duration-300 bg-slate-50 dark:bg-slate-950",
                                            isActive 
                                                ? "border-[#464674] ring-4 ring-[#464674]/15 scale-105 shadow-md shadow-[#464674]/20" 
                                                : "border-slate-200/80 dark:border-slate-850 hover:border-[#464674]/40 hover:shadow-lg"
                                        )}>
                                            <div className="relative w-full h-full p-2">
                                                <Image 
                                                    src={resolvedImg} 
                                                    alt={category} 
                                                    fill 
                                                    className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-110"
                                                    sizes="(max-width: 768px) 80px, 96px"
                                                />
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-xs sm:text-sm font-black mt-2 text-center truncate max-w-[100px] transition-colors leading-tight",
                                            isActive ? "text-[#464674] dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-950"
                                        )}>
                                            {asset.label}
                                        </span>
                                        <span className="text-[8px] font-extrabold text-slate-400 mt-0.5">{count} {count === 1 ? 'item' : 'items'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            <section className="py-14 relative bg-[#F0F7FF] dark:bg-[#0B1528]">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ── LEFT COLUMN: SIDEBAR ── */}
                        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
                            {/* Search Widget */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-3.5">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Search Catalog</h3>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#464674] transition-colors" />
                                    <Input 
                                        placeholder="Type keywords..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-[#464674]/20 rounded-xl text-xs font-semibold" 
                                    />
                                </div>
                            </div>

                            {/* Category Filter Widget */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-3">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Categories</h3>
                                <div className="space-y-1.5">
                                    {categories.map(category => {
                                        const count = getCategoryCount(category);
                                        const isActive = activeCategory === category;
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setActiveCategory(category)}
                                                className={cn(
                                                    "w-full flex items-center justify-between text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all duration-200 text-left",
                                                    isActive 
                                                        ? "bg-[#464674] text-white shadow-sm" 
                                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <span>{category}</span>
                                                <span className={cn(
                                                    "text-[9px] font-black px-1.5 py-0.5 rounded-full border",
                                                    isActive 
                                                        ? "bg-white/10 border-white/20 text-white" 
                                                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                                                )}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Finish Filters Widget */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-3">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Filter by Finish</h3>
                                <div className="space-y-1.5">
                                    {['All', '✨ Spot UV', '🏷️ Discounted', '⚡ Direct Orders'].map(finish => {
                                        const isActive = activeFinish === finish;
                                        return (
                                            <button
                                                key={finish}
                                                onClick={() => setActiveFinish(finish)}
                                                className={cn(
                                                    "w-full flex items-center justify-between text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all duration-200 text-left",
                                                    isActive 
                                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" 
                                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <span>{finish === 'All' ? 'All Finishes' : finish}</span>
                                                <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    isActive ? "bg-white dark:bg-slate-900" : "bg-transparent"
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Premium Offer Banner Card with White Border */}
                            <div className="relative rounded-3xl overflow-hidden border-2 border-white p-6 bg-gradient-to-br from-[#464674] to-[#2f2f54] text-white shadow-2xl ring-4 ring-white/10">
                                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_0)] bg-[size:16px_16px] opacity-5 pointer-events-none" />
                                <div className="relative z-10 space-y-4">
                                    <span className="text-[10px] font-black bg-white/20 border-2 border-white px-3 py-1 rounded-full uppercase tracking-wider shadow-sm inline-block">Limited Deal</span>
                                    <h4 className="text-lg font-black leading-tight">Get 25% Off Premium Gifts</h4>
                                    <p className="text-[11px] text-white/70 font-medium">Create customized stationary and print materials for your team today.</p>
                                    <Button asChild size="sm" className="w-full bg-white hover:bg-slate-50 text-[#464674] font-black rounded-xl">
                                        <Link href="/products">Shop Deals</Link>
                                    </Button>
                                </div>
                            </div>
                        </aside>

                        {/* ── RIGHT COLUMN: CATALOG ── */}
                        <div className="lg:col-span-9 space-y-8">
                            {/* Toolbar: results display & sorting */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-850 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    Showing <span className="text-slate-800 dark:text-white font-black">{combinedProducts.length}</span> results
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 outline-none focus:border-[#464674] transition-all duration-300 cursor-pointer"
                                    >
                                        <option value="default">Default Sorting</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="name">Sort by Name: A-Z</option>
                                    </select>
                                </div>
                            </div>

                            {combinedProducts.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No products found</h3>
                                    <p className="text-muted-foreground font-medium text-xs max-w-xs mx-auto">We couldn't find any products matching your search criteria.</p>
                                    <Button variant="outline" className="mt-6 rounded-2xl font-bold text-xs px-6 h-10" onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveFinish('All'); }}>
                                        Clear filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {combinedProducts.map((item: any) => {
                                        if (item.type === 'custom') {
                                            const imageUrl = resolveImagePath(item.imageUrl || '/uploads/hero.png');
                                            return (
                                                <Link key={item.id} href={`/design/${item.parentProductSlug}/start?subProductId=${item.rawId}`} className="group relative block h-full outline-none">
                                                    <Card className="h-full flex flex-col overflow-hidden rounded-3xl border border-slate-150/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#464674]/40 hover:-translate-y-1.5">
                                                        
                                                        {/* Image Container */}
                                                        <div className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 flex items-center justify-center">
                                                            {imageUrl ? (
                                                                <Image
                                                                    src={imageUrl}
                                                                    alt={item.name}
                                                                    fill
                                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full"><Palette className="h-16 w-16 text-muted-foreground/20 group-hover:scale-105 transition-transform duration-700" /></div>
                                                            )}
                                                            
                                                            {/* Floating Badges */}
                                                            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                                                                {item.spotUvAllowed && (
                                                                    <Badge className="bg-violet-600 text-white border-none shadow-md text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                        UV Coat
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {item.discountText && (
                                                                <div className="absolute top-3 right-3 z-10">
                                                                    <Badge variant="destructive" className="bg-rose-500 text-white border-none shadow-md text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                        {item.discountText}
                                                                    </Badge>
                                                                </div>
                                                            )}

                                                            {/* Quick Order CTA Overlay */}
                                                            <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                                                                <span className="inline-flex items-center gap-1.5 bg-[#464674] text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-xl">
                                                                    Select & Customize
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <CardContent className="p-5 flex-grow flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">
                                                                    {item.parentProductName}
                                                                </p>
                                                                <h3 className="text-base font-bold tracking-tight leading-snug group-hover:text-primary transition-colors text-slate-800 dark:text-white line-clamp-2">
                                                                    {item.name}
                                                                </h3>
                                                                
                                                                {/* Rating stars */}
                                                                <div className="flex gap-0.5 text-amber-400 py-1">
                                                                    {[1, 2, 3, 4, 5].map(star => (
                                                                        <Star key={star} size={11} fill="currentColor" className="stroke-none" />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                                                                <div className="space-y-0.5">
                                                                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">Starting at</span>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-sm font-black text-slate-900 dark:text-white flex items-center leading-none">
                                                                            ₹{item.price}
                                                                        </span>
                                                                        {item.price > 0 && (
                                                                            <span className="text-[9px] text-slate-400 font-medium line-through">
                                                                                ₹{(item.price * 1.3).toFixed(0)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[10px] font-black text-[#464674] dark:text-white/80 group-hover:translate-x-0.5 transition-transform">
                                                                    Design →
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            );
                                        } else {
                                            // Direct selling product card
                                            const imageUrl = resolveImagePath(item.imageUrl || '/uploads/hero.png');
                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={`/products/direct/${item.rawId}`}
                                                    className="group relative block h-full outline-none"
                                                >
                                                    <Card className="h-full flex flex-col overflow-hidden rounded-3xl border border-amber-200/70 dark:border-amber-900/40 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-amber-500/60 hover:-translate-y-1.5">
                                                        
                                                        {/* Image Container */}
                                                        <div className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 flex items-center justify-center">
                                                            {imageUrl ? (
                                                                <Image
                                                                    src={imageUrl}
                                                                    alt={item.name}
                                                                    fill
                                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full"><Package2 className="h-16 w-16 text-muted-foreground/20 group-hover:scale-105 transition-transform duration-700" /></div>
                                                            )}
                                                            
                                                            {/* Floating Badges */}
                                                            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                                    <Zap className="w-2.5 h-2.5 fill-current" /> Direct Order
                                                                </Badge>
                                                                {item.stockQuantity <= 0 ? (
                                                                    <Badge variant="destructive" className="bg-rose-600 text-white border-none shadow-md text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                        Out of Stock
                                                                    </Badge>
                                                                ) : item.stockQuantity <= item.minStockLevel ? (
                                                                    <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-none shadow-md text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                                                        <Flame size={10} className="fill-current" /> Only {item.stockQuantity} Left
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-emerald-600/90 text-white border-none shadow-md text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                        {item.stockQuantity} in Stock
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {item.discountText && (
                                                                <div className="absolute top-3 right-3 z-10">
                                                                    <Badge variant="destructive" className="bg-rose-500 text-white border-none shadow-md text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                        {item.discountText}
                                                                    </Badge>
                                                                </div>
                                                            )}

                                                            {/* Quick Order CTA Overlay */}
                                                            <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                                                                {item.stockQuantity <= 0 ? (
                                                                    <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 text-[10px] font-black px-4 py-2 rounded-xl shadow-xl">
                                                                        Out of Stock
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-xl">
                                                                        Order Directly <ArrowRight className="w-3 h-3 ml-1" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <CardContent className="p-5 flex-grow flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider leading-none">
                                                                        {item.category}
                                                                    </p>
                                                                    <span className={cn(
                                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                                                                        item.stockQuantity <= 0 
                                                                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" 
                                                                            : item.stockQuantity <= item.minStockLevel
                                                                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-extrabold"
                                                                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                                    )}>
                                                                        {item.stockQuantity <= 0 ? 'Out of stock' : `${item.stockQuantity} left`}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-base font-bold tracking-tight leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-slate-800 dark:text-white line-clamp-2">
                                                                    {item.name}
                                                                </h3>
                                                                
                                                                {/* Rating stars */}
                                                                <div className="flex gap-0.5 text-amber-400 py-1">
                                                                    {[1, 2, 3, 4, 5].map(star => (
                                                                        <Star key={star} size={11} fill="currentColor" className="stroke-none" />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                                                                <div className="space-y-0.5">
                                                                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">Direct Price</span>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-sm font-black text-slate-900 dark:text-white flex items-center leading-none">
                                                                            ₹{item.price}
                                                                        </span>
                                                                        {item.basePrice > item.price && (
                                                                            <span className="text-[9px] text-slate-400 font-medium line-through">
                                                                                ₹{item.basePrice}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                                                                    {item.stockQuantity <= 0 ? 'View Details →' : 'Order Now →'}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            );
                                        }
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
