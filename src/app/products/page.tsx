
import { getProducts } from '@/app/actions/product-actions';
import { Sparkles, Package2, Leaf, ShieldCheck, Palette, Star, ArrowRight, CheckCircle2, IndianRupee } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveImagePath } from '@/lib/utils';

export default async function ProductsPage() {
    const productsFromDb = await getProducts();
    const activeProducts = productsFromDb.filter(p => p.isActive && p.subProducts.some(sp => sp.isActive));

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
        
        // For simplicity, we'll take the first discount rule (usually for lowest quantity)
        const bestDiscountRule = discountRules[0];
    
        if (bestDiscountRule.discountType === 'percentage') {
            return `${Number(bestDiscountRule.discountValue)}% OFF`;
        }
        if (bestDiscountRule.discountType === 'fixed') {
            const discountValue = Number(bestDiscountRule.discountValue);
            // Don't show fixed discount if it's very small
            if (discountValue > 0) {
                return `₹${discountValue} OFF`;
            }
        }
    
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Minimalist Header */}
            <header className="pt-12 pb-6 border-b bg-slate-50/50 dark:bg-slate-950/50">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" />
                                Premium Printing Collection
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl font-headline">
                                Choose Your <span className="text-primary">Canvas</span>
                            </h1>
                            <p className="text-muted-foreground max-w-md font-medium">
                                Professional-grade materials curated for high-impact branding.
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 md:gap-8 pb-1">
                            {[
                                { icon: ShieldCheck, text: "Quality Verified", color: "text-blue-500" },
                                { icon: Leaf, text: "Eco-Friendly", color: "text-emerald-500" },
                                { icon: CheckCircle2, text: "Pre-press Review", color: "text-amber-500" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <section className="py-12 relative">
                <div className="container px-4 md:px-6">
                    <div className="space-y-20">
                        {activeProducts.map((product) => (
                            <div key={product.id} className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-headline">
                                        {product.name}
                                    </h2>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-900" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {product.subProducts.filter(sp => sp.isActive).map(subProduct => {
                                        const imageUrl = resolveImagePath(subProduct.imageUrl || product.imageUrl);
                                        const spotUvAllowed = subProduct.spotUvAllowed ?? false;
                                        const price = Number(subProduct.price || 0);
                                        const discountText = getDiscountInfo(subProduct);
                                        
                                        return (
                                            <Link key={subProduct.id} href={`/design/${product.slug}/start?subProductId=${subProduct.id}`} className="group relative block h-full outline-none">
                                                <Card className="h-full flex flex-col overflow-hidden rounded-xl border-slate-200/60 dark:border-slate-800/60 bg-card transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                                                    
                                                    {/* Image Container */}
                                                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                                                        {imageUrl ? (
                                                            <Image
                                                                src={imageUrl}
                                                                alt={subProduct.name}
                                                                fill
                                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full"><Palette className="h-12 w-12 text-muted-foreground/20" /></div>
                                                        )}
                                                        
                                                        {/* Floating Badges */}
                                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                            {spotUvAllowed && (
                                                                <Badge className="bg-amber-500 text-white border-none shadow-md text-[10px] font-bold">
                                                                    PREMIUM GLOSS
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {discountText && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge variant="destructive" className="shadow-lg">
                                                                    {discountText}
                                                                </Badge>
                                                            </div>
                                                        )}

                                                        {/* Price Tag Overlay */}
                                                        <div className="absolute bottom-3 right-3">
                                                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-white/20 flex flex-col items-end">
                                                                <span className="text-[10px] text-muted-foreground font-bold uppercase leading-none mb-0.5">Starting at</span>
                                                                <span className="text-lg font-black text-primary flex items-center leading-none">
                                                                    <IndianRupee size={14} className="mr-0.5 stroke-[3]" />
                                                                    {price}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <CardContent className="p-5 flex-grow flex flex-col bg-white dark:bg-slate-950">
                                                        <div className="mb-4">
                                                            <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                                                                {subProduct.name}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground mt-1.5 font-medium flex items-center gap-1.5">
                                                                <Package2 size={12} />
                                                                {subProduct.width} &times; {subProduct.height} mm
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="mt-auto pt-4 border-t flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                <span>Bulk Ready</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                                Design Now <ArrowRight size={14} />
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
                </div>
            </section>
        </div>
    );
}
