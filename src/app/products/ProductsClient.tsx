'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Package2, Leaf, ShieldCheck, Palette, ArrowRight, CheckCircle2, IndianRupee, Search, Filter, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resolveImagePath, cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
    'Flyers': { emoji: '📄', bg: 'from-orange-50 to-amber-100', label: 'Flyers' },
    'Brochures': { emoji: '📋', bg: 'from-violet-50 to-purple-100', label: 'Brochures' },
    'Stickers': { emoji: '⭐', bg: 'from-yellow-50 to-lime-100', label: 'Stickers' },
    'Posters': { emoji: '🖼️', bg: 'from-green-50 to-emerald-100', label: 'Posters' },
    'Banners': { emoji: '🏳️', bg: 'from-red-50 to-rose-100', label: 'Banners' },
    'Packaging': { emoji: '📦', bg: 'from-amber-50 to-orange-100', label: 'Packaging' },
    'T-Shirts': { emoji: '👕', bg: 'from-pink-50 to-fuchsia-100', label: 'T-Shirts' },
};

export function ProductsClient({ initialProducts, directSellingProducts = [] }: { initialProducts: any[]; directSellingProducts?: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [activeFinish, setActiveFinish] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('default');

    // Direct Order Modal State
    const [selectedDirectProduct, setSelectedDirectProduct] = useState<any | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [customText, setCustomText] = useState<string>('');
    const [shippingAddress, setShippingAddress] = useState({
        name: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
    });
    const router = useRouter();
    const { toast } = useToast();

    // Extract all unique categories (product names) for the filter pills
    const categories = ['All', ...Array.from(new Set(initialProducts.map(p => p.name)))];

    // Helper to get matching subproducts count
    const getCategoryCount = (catName: string) => {
        if (catName === 'All') {
            return initialProducts.reduce((acc, p) => acc + p.subProducts.filter(sp => sp.isActive).length, 0);
        }
        const prod = initialProducts.find(p => p.name === catName);
        return prod ? prod.subProducts.filter((sp: any) => sp.isActive).length : 0;
    };

    // Filter products based on search, category, and activeFinish
    const filteredProducts = useMemo(() => {
        return initialProducts.map(product => {
            // If category is selected and doesn't match this product, return null (filter out entirely)
            if (activeCategory !== 'All' && product.name !== activeCategory) {
                return null;
            }

            // Filter subproducts based on search query and activeFinish
            const matchingSubProducts = product.subProducts.filter((sp: any) => {
                if (!sp.isActive) return false;
                
                const searchLower = searchQuery.toLowerCase();
                const matchesName = sp.name.toLowerCase().includes(searchLower);
                const matchesParent = product.name.toLowerCase().includes(searchLower);
                const matchesSearch = matchesName || matchesParent;

                if (!matchesSearch) return false;

                if (activeFinish === '✨ Spot UV') {
                    return sp.spotUvAllowed === true;
                }
                if (activeFinish === '🏷️ Discounted') {
                    return getDiscountInfo(sp) !== null;
                }

                return true;
            });

            // If no subproducts match, filter out this product
            if (matchingSubProducts.length === 0) {
                return null;
            }

            // Return product with only matching subproducts
            return {
                ...product,
                subProducts: matchingSubProducts
            };
        }).filter(Boolean); // Remove nulls
    }, [initialProducts, searchQuery, activeCategory, activeFinish]);

    // Flat subproducts list with parent slug details, and sorting applied
    const flatSubProducts = useMemo(() => {
        const list: any[] = [];
        filteredProducts.forEach((product: any) => {
            product.subProducts.forEach((subProduct: any) => {
                list.push({
                    ...subProduct,
                    parentProductSlug: product.slug,
                    parentProductName: product.name,
                });
            });
        });

        // Apply sorting
        if (sortBy === 'price-low') {
            list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        } else if (sortBy === 'price-high') {
            list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        } else if (sortBy === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }

        return list;
    }, [filteredProducts, sortBy]);

    const handleDirectOrderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDirectProduct) return;

        if (selectedDirectProduct.textAllowed && !customText.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter the customization text.' });
            return;
        }

        if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all shipping address fields.' });
            return;
        }

        const totalAmount = Number(selectedDirectProduct.sellingPrice) * quantity;

        const orderPayload = {
            orderData: {
                items: [{
                    id: selectedDirectProduct.id,
                    name: selectedDirectProduct.name,
                    sellingPrice: selectedDirectProduct.sellingPrice,
                    quantity: quantity,
                    sku: selectedDirectProduct.sku,
                    customText: customText.trim() || undefined,
                }],
                shippingAddress: shippingAddress,
            },
            amount: totalAmount,
            items: [{ 
                name: selectedDirectProduct.name, 
                quantity: quantity,
                customText: customText.trim() || undefined,
            }],
            shippingAddress: shippingAddress,
        };

        const encodedData = btoa(encodeURIComponent(JSON.stringify(orderPayload)));
        router.push(`/payment?orderType=direct&orderData=${encodedData}`);
    };

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
                                Customize dimensions, paper types, and premium finishes.
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
                                const productImg = category === 'All'
                                    ? (initialProducts[0]?.imageUrl || '/uploads/hero.png')
                                    : (prod?.imageUrl || prod?.subProducts?.[0]?.imageUrl || '/uploads/hero.png');
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

                            {/* Premium Offer Banner Card */}
                            <div className="relative rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-850 p-6 bg-gradient-to-br from-[#464674] to-[#2f2f54] text-white shadow-md">
                                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_0)] bg-[size:16px_16px] opacity-5 pointer-events-none" />
                                <div className="relative z-10 space-y-4">
                                    <span className="text-[9px] font-black bg-white/15 px-2 py-0.5 rounded-full uppercase tracking-wider">Limited Deal</span>
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
                                    Showing <span className="text-slate-800 dark:text-white font-black">{activeFinish === '⚡ Direct Orders' ? directSellingProducts.length : flatSubProducts.length}</span> results
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

                            {activeFinish === '⚡ Direct Orders' ? (
                                <div className="space-y-24">
                                    {directSellingProducts && directSellingProducts.length > 0 ? (
                                        <div className="p-8 sm:p-12 rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-[#2f2f54] border border-white/5 shadow-2xl relative overflow-hidden text-white space-y-8">
                                            {/* Glows */}
                                            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:24px_24px]" />
                                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -mr-32 -mt-32" />
                                            
                                            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                                                <div className="space-y-2 max-w-xl">
                                                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-xs px-4 py-1.5 rounded-full font-bold backdrop-blur-md uppercase tracking-wider">
                                                        🔥 Direct Order Showcase
                                                    </Badge>
                                                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                                                        Premium Direct Selling Bundles
                                                    </h2>
                                                    <p className="text-slate-300 text-sm font-medium">
                                                        Skip the custom design tool. Order our verified, high-demand industrial print packages directly.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Same Day Pre-Press Dispatch
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                                                {directSellingProducts.map((product) => {
                                                    const img = product.imageUrls?.[0] || '/uploads/hero.png';
                                                    const price = Number(product.sellingPrice || 0);
                                                    const basePrice = Number(product.basePrice || 0);
                                                    
                                                    return (
                                                        <div key={product.id} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-6 shadow-xl hover:bg-white/[0.07] hover:border-primary/30 transition-all duration-300 hover:shadow-primary/5 flex flex-col justify-between group">
                                                            <div className="space-y-4">
                                                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950/60 border border-white/10">
                                                                    <Image src={resolveImagePath(img)} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110 p-2" />
                                                                    <div className="absolute top-3 left-3">
                                                                        <Badge className="bg-primary text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider border-none shadow-lg">
                                                                            {product.category || 'Featured'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                                                            {product.name}
                                                                        </h3>
                                                                        {basePrice > price && (
                                                                            <span className="text-xs font-bold text-slate-400 line-through">₹{basePrice}</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-300 font-medium leading-relaxed line-clamp-2">
                                                                        {product.description || 'Premium pre-configured industrial print package.'}
                                                                    </p>
                                                                </div>
                                                                <div className="pt-2 flex items-baseline gap-1">
                                                                    <span className="text-2xl font-bold text-white">₹{price}</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">/ unit</span>
                                                                </div>
                                                            </div>
                                                            <div className="pt-4 border-t border-white/10">
                                                                <Button 
                                                                    onClick={() => {
                                                                        setSelectedDirectProduct(product);
                                                                        setQuantity(1);
                                                                        setCustomText('');
                                                                    }}
                                                                    className="w-full h-12 rounded-xl bg-white text-slate-950 hover:bg-primary hover:text-white font-extrabold transition-all duration-300 shadow-md hover:shadow-lg"
                                                                >
                                                                    Order Directly <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
                                            <h3 className="text-xl font-bold mb-2">No direct products available</h3>
                                            <p className="text-muted-foreground font-medium text-xs max-w-xs mx-auto">There are currently no direct selling bundles available.</p>
                                            <Button variant="outline" className="mt-6 rounded-2xl font-bold text-xs px-6 h-10" onClick={() => setActiveFinish('All')}>
                                                View All Products
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : flatSubProducts.length === 0 ? (
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
                                    {flatSubProducts.map((subProduct: any) => {
                                        const imageUrl = resolveImagePath(subProduct.imageUrl || '/uploads/hero.png');
                                        const spotUvAllowed = subProduct.spotUvAllowed ?? false;
                                        const price = Number(subProduct.price || 0);
                                        const discountText = getDiscountInfo(subProduct);
                                        
                                        return (
                                            <Link key={subProduct.id} href={`/design/${subProduct.parentProductSlug}/start?subProductId=${subProduct.id}`} className="group relative block h-full outline-none">
                                                <Card className="h-full flex flex-col overflow-hidden rounded-3xl border border-slate-150/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#464674]/40 hover:-translate-y-1.5">
                                                    
                                                    {/* Image Container */}
                                                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-850 flex items-center justify-center">
                                                        {imageUrl ? (
                                                            <Image
                                                                src={imageUrl}
                                                                alt={subProduct.name}
                                                                fill
                                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full"><Palette className="h-16 w-16 text-muted-foreground/20 group-hover:scale-105 transition-transform duration-700" /></div>
                                                        )}
                                                        
                                                        {/* Floating Badges */}
                                                        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                                                            {spotUvAllowed && (
                                                                <Badge className="bg-violet-600 text-white border-none shadow-md text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                    UV Coat
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {discountText && (
                                                            <div className="absolute top-3 right-3 z-10">
                                                                <Badge variant="destructive" className="bg-rose-500 text-white border-none shadow-md text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                    {discountText}
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
                                                                {subProduct.parentProductName}
                                                            </p>
                                                            <h3 className="text-base font-bold tracking-tight leading-snug group-hover:text-primary transition-colors text-slate-800 dark:text-white line-clamp-2">
                                                                {subProduct.name}
                                                            </h3>
                                                            
                                                            {/* Rating stars matching Aprin layout */}
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
                                                                        ₹{price}
                                                                    </span>
                                                                    {price > 0 && (
                                                                        <span className="text-[9px] text-slate-400 font-medium line-through">
                                                                            ₹{(price * 1.3).toFixed(0)}
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
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Direct Order Checkout Dialog */}
            <Dialog open={!!selectedDirectProduct} onOpenChange={(open) => !open && setSelectedDirectProduct(null)}>
                <DialogContent className="sm:max-w-lg rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit text-xs font-extrabold border border-primary/20">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Instant Direct Order
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {selectedDirectProduct?.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground font-medium">
                            {selectedDirectProduct?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDirectProduct && (
                        <form onSubmit={handleDirectOrderSubmit} className="space-y-6 pt-4">
                            {/* Product & Price Summary */}
                            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Unit Price</span>
                                    <div className="text-lg font-extrabold text-primary flex items-center">
                                        <IndianRupee size={16} className="mr-0.5" />{Number(selectedDirectProduct.sellingPrice)}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Quantity</span>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 w-8 rounded-lg font-bold" 
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        >
                                            -
                                        </Button>
                                        <span className="font-extrabold text-base w-8 text-center">{quantity}</span>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 w-8 rounded-lg font-bold" 
                                            onClick={() => setQuantity(q => q + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1 text-right">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Amount</span>
                                    <div className="text-xl font-black text-primary flex items-center justify-end">
                                        <IndianRupee size={18} className="mr-0.5" />{Number(selectedDirectProduct.sellingPrice) * quantity}
                                    </div>
                                </div>
                            </div>

                            {/* Custom Text Field if Allowed */}
                            {selectedDirectProduct.textAllowed && (
                                <div className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in duration-500">
                                    <label className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles size={14} /> Customization Text / Inscription
                                    </label>
                                    <Input 
                                        required
                                        placeholder="Enter the custom text or name to be printed..." 
                                        value={customText} 
                                        onChange={e => setCustomText(e.target.value)}
                                        className="h-11 rounded-xl bg-background border-primary/30 focus-visible:ring-primary font-semibold"
                                    />
                                    <p className="text-[10px] text-muted-foreground font-medium">This product supports custom text engraving or printing. Please enter your desired text above.</p>
                                </div>
                            )}

                            {/* Shipping Address Form */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Package2 size={16} className="text-primary" /> Shipping Address
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Full Name</label>
                                        <Input 
                                            required 
                                            placeholder="John Doe" 
                                            value={shippingAddress.name} 
                                            onChange={e => setShippingAddress(s => ({ ...s, name: e.target.value }))}
                                            className="h-11 rounded-xl bg-background border-border/60"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                                        <Input 
                                            required 
                                            placeholder="+91 9876543210" 
                                            value={shippingAddress.phone} 
                                            onChange={e => setShippingAddress(s => ({ ...s, phone: e.target.value }))}
                                            className="h-11 rounded-xl bg-background border-border/60"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Address Line 1</label>
                                    <Input 
                                        required 
                                        placeholder="Flat / House No., Street Name" 
                                        value={shippingAddress.addressLine1} 
                                        onChange={e => setShippingAddress(s => ({ ...s, addressLine1: e.target.value }))}
                                        className="h-11 rounded-xl bg-background border-border/60"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">City</label>
                                        <Input 
                                            required 
                                            placeholder="Mumbai" 
                                            value={shippingAddress.city} 
                                            onChange={e => setShippingAddress(s => ({ ...s, city: e.target.value }))}
                                            className="h-11 rounded-xl bg-background border-border/60"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">State</label>
                                        <Input 
                                            required 
                                            placeholder="Maharashtra" 
                                            value={shippingAddress.state} 
                                            onChange={e => setShippingAddress(s => ({ ...s, state: e.target.value }))}
                                            className="h-11 rounded-xl bg-background border-border/60"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">ZIP Code</label>
                                        <Input 
                                            required 
                                            placeholder="400001" 
                                            value={shippingAddress.zip} 
                                            onChange={e => setShippingAddress(s => ({ ...s, zip: e.target.value }))}
                                            className="h-11 rounded-xl bg-background border-border/60"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-4 border-t border-border/40 gap-3 flex-col sm:flex-row">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setSelectedDirectProduct(null)}
                                    className="h-12 rounded-xl font-bold w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 w-full sm:w-auto"
                                >
                                    Proceed to Payment <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
