'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Package2, Leaf, ShieldCheck, Palette, ArrowRight, CheckCircle2, IndianRupee, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resolveImagePath } from '@/lib/utils';
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

export function ProductsClient({ initialProducts }: { initialProducts: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');

    // Extract all unique categories (product names) for the filter pills
    const categories = ['All', ...Array.from(new Set(initialProducts.map(p => p.name)))];

    // Filter products based on search and category
    const filteredProducts = useMemo(() => {
        return initialProducts.map(product => {
            // If category is selected and doesn't match this product, return null (filter out entirely)
            if (activeCategory !== 'All' && product.name !== activeCategory) {
                return null;
            }

            // Filter subproducts based on search query
            const matchingSubProducts = product.subProducts.filter((sp: any) => {
                if (!sp.isActive) return false;
                
                const searchLower = searchQuery.toLowerCase();
                const matchesName = sp.name.toLowerCase().includes(searchLower);
                const matchesParent = product.name.toLowerCase().includes(searchLower);
                
                return matchesName || matchesParent;
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
    }, [initialProducts, searchQuery, activeCategory]);

    return (
        <div className="min-h-screen bg-background">
            {/* Minimalist Header */}
            <header className="pt-12 pb-6 border-b border-border/40 bg-muted/10">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                                <Sparkles className="w-3.5 h-3.5" />
                                Premium printing collection
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline text-slate-900 dark:text-white">
                                Choose your <span className="text-primary underline underline-offset-8 decoration-primary/20">canvas</span>
                            </h1>
                            <p className="text-muted-foreground max-w-md font-medium text-lg">
                                Professional-grade materials curated for high-impact branding.
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 md:gap-8 pb-1">
                            {[
                                { icon: ShieldCheck, text: "Quality verified", color: "text-blue-500" },
                                { icon: Leaf, text: "Eco-friendly", color: "text-emerald-500" },
                                { icon: CheckCircle2, text: "Pre-press review", color: "text-amber-500" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                                    <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Search by product, material, or size..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 bg-card border-border/50 focus-visible:ring-primary/20 rounded-2xl shadow-sm text-base font-medium" 
                            />
                        </div>
                        <ScrollArea className="w-full sm:w-auto whitespace-nowrap rounded-xl">
                            <div className="flex w-max space-x-2 p-1">
                                {categories.map(category => (
                                    <Button
                                        key={category}
                                        variant={activeCategory === category ? "default" : "outline"}
                                        onClick={() => setActiveCategory(category)}
                                        className={`rounded-2xl font-semibold px-8 h-12 transition-all ${
                                            activeCategory === category 
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                                : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="invisible" />
                        </ScrollArea>
                    </div>
                </div>
            </header>

            <section className="py-16 relative">
                <div className="container px-4 md:px-6">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-32 border border-dashed border-border/60 rounded-3xl bg-muted/10">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold font-headline mb-2">No products found</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">We couldn't find any products matching your search. Try adjusting your filters or search terms.</p>
                            <Button variant="outline" className="mt-8 rounded-2xl font-semibold text-sm px-8 h-12" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-24">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <div className="flex items-center gap-6">
                                        <h2 className="text-3xl font-bold tracking-tight font-headline text-slate-800 dark:text-slate-100">
                                            {product.name}
                                        </h2>
                                        <div className="h-[2px] flex-1 bg-gradient-to-r from-border/80 via-border/40 to-transparent" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                        {product.subProducts.map((subProduct: any) => {
                                            const imageUrl = resolveImagePath(subProduct.imageUrl || product.imageUrl);
                                            const spotUvAllowed = subProduct.spotUvAllowed ?? false;
                                            const price = Number(subProduct.price || 0);
                                            const discountText = getDiscountInfo(subProduct);
                                            
                                            return (
                                                <Link key={subProduct.id} href={`/design/${product.slug}/start?subProductId=${subProduct.id}`} className="group relative block h-full outline-none">
                                                    <Card className="h-full flex flex-col overflow-hidden rounded-2xl border-border/40 bg-card/40 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-2 group">
                                                        
                                                        {/* Image Container */}
                                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30 border-b border-border/40">
                                                            {imageUrl ? (
                                                                <Image
                                                                    src={imageUrl}
                                                                    alt={subProduct.name}
                                                                    fill
                                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full"><Palette className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700" /></div>
                                                            )}
                                                            
                                                            {/* Floating Badges */}
                                                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                                                {spotUvAllowed && (
                                                                    <Badge className="bg-amber-500/90 backdrop-blur-md text-white border-none shadow-lg text-[10px] font-bold px-3 py-1 rounded-full">
                                                                        Premium gloss
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {discountText && (
                                                                <div className="absolute top-4 right-4 z-10">
                                                                    <Badge variant="destructive" className="shadow-lg backdrop-blur-md bg-destructive/90 text-[10px] font-bold px-3 py-1 rounded-full">
                                                                        {discountText}
                                                                    </Badge>
                                                                </div>
                                                            )}

                                                            {/* Overlay Gradient for Price */}
                                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                                            {/* Price Tag Overlay */}
                                                            <div className="absolute bottom-4 right-4 z-10">
                                                                <div className="bg-background/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-border/50 flex flex-col items-end group-hover:border-primary/30 transition-all">
                                                                    <span className="text-[10px] text-muted-foreground font-medium leading-none mb-1.5">Starting at</span>
                                                                    <span className="text-xl font-bold text-primary flex items-center leading-none">
                                                                        <IndianRupee size={16} className="mr-0.5 stroke-[2.5]" />
                                                                        {price}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <CardContent className="p-6 flex-grow flex flex-col bg-card relative z-20">
                                                            <div className="mb-6">
                                                                <h3 className="text-xl font-bold tracking-tight leading-tight group-hover:text-primary transition-colors text-slate-800 dark:text-slate-100">
                                                                    {subProduct.name}
                                                                </h3>
                                                                <p className="text-[12px] text-muted-foreground mt-3 font-semibold flex items-center gap-1.5 bg-muted/50 w-fit px-3 py-1.5 rounded-xl border border-border/50">
                                                                    <Package2 size={14} className="text-primary/70" />
                                                                    {subProduct.width} &times; {subProduct.height} {subProduct.unitType || 'mm'}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="mt-auto pt-5 border-t border-border/40 flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <span>Bulk ready</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                                    Design now <ArrowRight size={14} />
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
