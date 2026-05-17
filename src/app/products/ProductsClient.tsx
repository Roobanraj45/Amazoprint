'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Package2, Leaf, ShieldCheck, Palette, ArrowRight, CheckCircle2, IndianRupee, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resolveImagePath } from '@/lib/utils';
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

export function ProductsClient({ initialProducts, directSellingProducts = [] }: { initialProducts: any[]; directSellingProducts?: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');

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
        <div className="min-h-screen bg-background">
            {/* Premium Glassmorphic Header */}
            <header className="pt-16 pb-12 border-b border-border/40 bg-gradient-to-b from-muted/30 via-background to-background relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
                <div className="container px-4 md:px-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold border border-primary/20 shadow-sm backdrop-blur-md">
                                <Sparkles className="w-4 h-4 animate-pulse" /> Premium Industrial Printing Collection
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                                Choose Your <span className="bg-gradient-to-r from-primary via-indigo-600 to-pink-600 bg-clip-text text-transparent">Canvas</span>
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg sm:text-xl leading-relaxed">
                                Professional-grade materials, precision die-cutting, and world-class laminations curated for high-impact brand identity.
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 md:gap-8 pb-1">
                            {[
                                { icon: ShieldCheck, text: "Quality verified", color: "text-blue-500" },
                                { icon: Leaf, text: "Eco-friendly", color: "text-emerald-500" },
                                { icon: CheckCircle2, text: "Pre-press review", color: "text-amber-500" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm font-bold text-foreground/80 bg-card/60 border border-border/50 px-4 py-2 rounded-2xl shadow-sm backdrop-blur-md">
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
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
                            {filteredProducts.map((product, index) => (
                                <div key={product.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <div className="flex items-center gap-6">
                                        <h2 className="text-3xl font-black tracking-tight font-headline text-slate-900 dark:text-white flex items-center gap-3">
                                            <span className="w-4 h-8 rounded-full bg-gradient-to-b from-primary to-indigo-600 inline-block" /> {product.name}
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
                                                    <Card className="h-full flex flex-col overflow-hidden rounded-3xl border-border/60 bg-card/40 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 hover:-translate-y-2 group">
                                                        
                                                        {/* Image Container */}
                                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-border/40 flex items-center justify-center">
                                                            {imageUrl ? (
                                                                <Image
                                                                    src={imageUrl}
                                                                    alt={subProduct.name}
                                                                    fill
                                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 p-4"
                                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full"><Palette className="h-16 w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700" /></div>
                                                            )}
                                                            
                                                            {/* Floating Badges */}
                                                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                                                {spotUvAllowed && (
                                                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md text-white border-none shadow-lg text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                                                        ✨ Premium Gloss
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {discountText && (
                                                                <div className="absolute top-4 right-4 z-10">
                                                                    <Badge variant="destructive" className="shadow-lg backdrop-blur-md bg-gradient-to-r from-rose-600 to-pink-600 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border-none">
                                                                        {discountText}
                                                                    </Badge>
                                                                </div>
                                                            )}

                                                            {/* Overlay Gradient for Price */}
                                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                                            {/* Price Tag Overlay */}
                                                            <div className="absolute bottom-4 right-4 z-10">
                                                                <div className="bg-white dark:bg-slate-900 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-end group-hover:border-primary/50 transition-all">
                                                                    <span className="text-[10px] text-slate-500 font-extrabold leading-none mb-1.5 uppercase tracking-wider">Starting at</span>
                                                                    <span className="text-xl font-black text-primary flex items-center leading-none">
                                                                        <IndianRupee size={16} className="mr-0.5 stroke-[3]" />
                                                                        {price}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <CardContent className="p-6 flex-grow flex flex-col bg-card relative z-20 space-y-4">
                                                            <div>
                                                                <h3 className="text-xl font-extrabold tracking-tight leading-tight group-hover:text-primary transition-colors text-slate-900 dark:text-white line-clamp-1">
                                                                    {subProduct.name}
                                                                </h3>
                                                                <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-2 font-bold flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 w-fit px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                                                                    <Package2 size={14} className="text-primary" />
                                                                    {subProduct.width} &times; {subProduct.height} {subProduct.unitType || 'mm'}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                                                                    <span>Bulk Ready</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                                    Design Now <ArrowRight size={14} className="stroke-[3]" />
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            )
                                        })}
                                    </div>

                                    {/* INJECT DIRECT SELLING FEATURED BUNDLES AFTER THE FIRST CATEGORY */}
                                    {index === 0 && directSellingProducts && directSellingProducts.length > 0 && (
                                        <div className="my-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-primary/30 shadow-2xl relative overflow-hidden text-white space-y-8 animate-in fade-in duration-700">
                                            {/* Background Glows */}
                                            <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:24px_24px]" />
                                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
                                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

                                            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                                                <div className="space-y-2 max-w-xl">
                                                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-xs px-4 py-1.5 rounded-full font-extrabold backdrop-blur-md uppercase tracking-wider">
                                                        🔥 Direct Order Showcase
                                                    </Badge>
                                                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                                                        Premium Direct Selling Bundles
                                                    </h2>
                                                    <p className="text-slate-300 text-sm font-medium">
                                                        Skip the custom design tool. Order our verified, high-demand industrial print packages directly with instant pre-press priority.
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
                                                        <div key={product.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-6 shadow-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 flex flex-col justify-between group">
                                                            <div className="space-y-4">
                                                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/40 border border-white/10">
                                                                    <Image src={resolveImagePath(img)} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110 p-2" />
                                                                    <div className="absolute top-3 left-3">
                                                                        <Badge className="bg-primary text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider border-none shadow-lg">
                                                                            {product.category || 'Featured'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <h3 className="text-xl font-extrabold text-white tracking-tight group-hover:text-primary transition-colors line-clamp-1">
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
                                                                    <span className="text-2xl font-black text-white">₹{price}</span>
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
                                                                    className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-primary hover:text-white font-bold transition-all shadow-lg group-hover:shadow-primary/20"
                                                                >
                                                                    Order Directly <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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
