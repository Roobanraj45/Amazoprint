'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Sparkles, Package2, Leaf, ShieldCheck, Palette, ArrowRight, CheckCircle2,
    IndianRupee, Search, Filter, Star, Zap, Flame, AlertCircle, ChevronLeft,
    ChevronRight, SlidersHorizontal, LayoutGrid, ListFilter, Info, Eye, Download,
    Play, Truck, FileText, Check, Layers, Scissors, Sparkle, Tag, Shield,
    Clock, ExternalLink, Box, Award, X, Maximize2
} from 'lucide-react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, resolveImagePath } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Helper function to extract discount info
const getDiscountInfo = (subProduct: any) => {
    if (!subProduct?.pricingRules || subProduct.pricingRules.length === 0) {
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
};

// YouTube embed helper
function getYouTubeEmbedUrl(url?: string | null): string | null {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = trimmed.match(regExp);
    if (match && match[1]) {
        return `https://www.youtube-nocookie.com/embed/${match[1]}`;
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return `https://www.youtube-nocookie.com/embed/${trimmed}`;
    }
    return null;
}

const CATEGORY_ASSETS: Record<string, { emoji: string; bg: string; label: string }> = {
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

// Build a clean URL from whatever the DB gives us (works seamlessly on localhost & production)
function buildImageUrl(raw: string | null | undefined): string {
    const FALLBACK = '/uploads/hero.png';
    if (!raw || typeof raw !== 'string' || !raw.trim()) return FALLBACK;
    return resolveImagePath(raw) || FALLBACK;
}

function ProductCardImage({ src, alt }: { src: string; alt: string }) {
    const [errored, setErrored] = useState(false);
    const imgUrl = errored ? '/uploads/hero.png' : buildImageUrl(src);

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imgUrl}
                alt={alt || 'AmazoPrint Product'}
                onError={() => setErrored(true)}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none"
                loading="lazy"
            />
        </div>
    );
}

function CategoryAvatarImage({ src, alt }: { src: string; alt: string }) {
    const [errored, setErrored] = useState(false);
    const imgUrl = errored ? '/uploads/hero.png' : buildImageUrl(src);
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={imgUrl}
            alt={alt || 'Category'}
            onError={() => setErrored(true)}
            className="w-full h-full object-contain p-1.5"
            loading="lazy"
        />
    );
}

export function ProductsClient({ initialProducts, directSellingProducts = [] }: { initialProducts: any[]; directSellingProducts?: any[] }) {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [activeFinish, setActiveFinish] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('default');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Quick View / Full Info Modal State
    const [selectedProductItem, setSelectedProductItem] = useState<any | null>(null);
    const [selectedSubProductId, setSelectedSubProductId] = useState<number | null>(null);
    const [modalActiveImage, setModalActiveImage] = useState<string>('');

    // Popular Print Niches slider ref
    const nichesRef = useRef<HTMLDivElement>(null);
    const [canScrollNichesLeft, setCanScrollNichesLeft] = useState(false);
    const [canScrollNichesRight, setCanScrollNichesRight] = useState(true);

    const checkNichesScroll = useCallback(() => {
        const el = nichesRef.current;
        if (!el) return;
        setCanScrollNichesLeft(el.scrollLeft > 4);
        setCanScrollNichesRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    const slideNiches = (direction: 'left' | 'right') => {
        const el = nichesRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth * 0.75;
        el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    };

    // Extract all unique categories
    const categories = useMemo(() => {
        const productCategories = initialProducts.map(p => p.category?.trim()).filter(Boolean);
        const directCats = directSellingProducts.map(p => p.category?.trim()).filter(Boolean);
        return ['All', ...Array.from(new Set([...productCategories, ...directCats]))];
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
        if (catName === 'All') {
            const initialCount = initialProducts.reduce((acc, p) => {
                const activeSubs = (p.subProducts || []).filter((sp: any) => sp.isActive);
                return acc + (activeSubs.length > 0 ? activeSubs.length : 1);
            }, 0);
            return initialCount + directSellingProducts.length;
        }

        const catLower = catName.toLowerCase().trim();
        const initialCount = initialProducts
            .filter(p => (p.category && p.category.toLowerCase().trim() === catLower) || (p.name && p.name.toLowerCase().trim() === catLower))
            .reduce((acc, p) => {
                const activeSubs = (p.subProducts || []).filter((sp: any) => sp.isActive);
                return acc + (activeSubs.length > 0 ? activeSubs.length : 1);
            }, 0);

        const directCount = directSellingProducts.filter((p: any) => (p.category && p.category.toLowerCase().trim() === catLower) || (p.name && p.name.toLowerCase().trim() === catLower)).length;

        return initialCount + directCount;
    };

    // Filter and combine both standard sub-products and direct selling products
    const combinedProducts = useMemo(() => {
        const list: any[] = [];
        const searchLower = searchQuery.toLowerCase().trim();

        // 1. Process standard products & subproducts
        if (activeFinish !== '⚡ Direct Orders') {
            initialProducts.forEach(product => {
                if (!product.isActive) return;

                const prodCatLower = (product.category || '').toLowerCase().trim();
                const prodNameLower = (product.name || '').toLowerCase().trim();
                const activeCatLower = activeCategory.toLowerCase().trim();

                const matchesCategoryFilter = activeCategory === 'All' ||
                    prodCatLower === activeCatLower ||
                    prodNameLower === activeCatLower;

                if (!matchesCategoryFilter) {
                    return;
                }

                const activeSubs = (product.subProducts || []).filter((sp: any) => sp.isActive);

                if (activeSubs.length > 0) {
                    activeSubs.forEach((sp: any) => {
                        const matchesName = (sp.name || '').toLowerCase().includes(searchLower);
                        const matchesParent = prodNameLower.includes(searchLower);
                        const matchesCat = prodCatLower.includes(searchLower);
                        const matchesDesc = (sp.description || product.description || '').toLowerCase().includes(searchLower);
                        const matchesSku = (sp.sku || '').toLowerCase().includes(searchLower);
                        const matchesHsn = (sp.hsnCode || '').toLowerCase().includes(searchLower);

                        if (searchLower && !matchesName && !matchesParent && !matchesCat && !matchesDesc && !matchesSku && !matchesHsn) return;

                        if (activeFinish === '✨ Spot UV' && !sp.spotUvAllowed) return;
                        if (activeFinish === '🏷️ Discounted' && !getDiscountInfo(sp)) return;
                        if (activeFinish === '📐 Multi-Sizes' && (!sp.sizes || !sp.sizes.length)) return;
                        if (activeFinish === '🚚 Fast Dispatch' && (!sp.deliveryDays || sp.deliveryDays.includes('7+'))) return;

                        const imageUrl = sp.imageUrl || product.imageUrl || '/uploads/hero.png';
                        const discount = getDiscountInfo(sp);

                        list.push({
                            type: 'custom',
                            id: `custom-${sp.id}`,
                            rawId: sp.id,
                            name: sp.name,
                            category: product.category || product.name,
                            parentProductSlug: product.slug,
                            parentProductName: product.name,
                            parentProduct: product,
                            imageUrl: imageUrl,
                            galleryImages: [imageUrl, ...(Array.isArray(sp.imageUrls) ? sp.imageUrls : []), product.imageUrl].filter(Boolean),
                            price: Number(sp.price || product.basePrice || 0),
                            sku: sp.sku || `SKU-${sp.id}`,
                            width: sp.width,
                            height: sp.height,
                            unitType: sp.unitType || 'mm',
                            maxPages: sp.maxPages || 1,
                            spotUvAllowed: sp.spotUvAllowed ?? false,
                            backSideCost: sp.backSideCost || 0,
                            hsnCode: sp.hsnCode,
                            minOrderQuantity: sp.minOrderQuantity || 1,
                            maxOrderQuantity: sp.maxOrderQuantity || 100000,
                            deliveryDays: sp.deliveryDays || '3-5 Business Days',
                            deliveryAmount: sp.deliveryAmount || 0,
                            deliveryTiers: Array.isArray(sp.deliveryTiers) ? sp.deliveryTiers : [],
                            taxSlabs: Array.isArray(sp.taxSlabs) ? sp.taxSlabs : [],
                            sizes: Array.isArray(sp.sizes) ? sp.sizes : [],
                            priceSlabs: Array.isArray(sp.priceSlabs) ? sp.priceSlabs : [],
                            sampleFiles: Array.isArray(sp.sampleFiles) ? sp.sampleFiles : [],
                            youtubeUrl: sp.youtubeUrl || product.youtubeUrl,
                            description: sp.description || product.description,
                            discountText: discount,
                            rawSubProduct: sp,
                            allSiblingSubProducts: activeSubs,
                        });
                    });
                } else {
                    // Standalone master product with no subproducts
                    const matchesName = prodNameLower.includes(searchLower);
                    const matchesCat = prodCatLower.includes(searchLower);
                    const matchesDesc = (product.description || '').toLowerCase().includes(searchLower);

                    if (searchLower && !matchesName && !matchesCat && !matchesDesc) return;

                    if (activeFinish === '✨ Spot UV' || activeFinish === '🏷️ Discounted' || activeFinish === '📐 Multi-Sizes') return;

                    const imageUrl = product.imageUrl || '/uploads/hero.png';

                    list.push({
                        type: 'custom',
                        id: `custom-prod-${product.id}`,
                        rawId: null,
                        name: product.name,
                        category: product.category || product.name,
                        parentProductSlug: product.slug,
                        parentProductName: product.name,
                        parentProduct: product,
                        imageUrl: imageUrl,
                        galleryImages: [imageUrl],
                        price: Number(product.basePrice || 0),
                        sku: `PROD-${product.id}`,
                        width: 'Standard',
                        height: '',
                        unitType: '',
                        maxPages: 1,
                        spotUvAllowed: false,
                        backSideCost: 0,
                        hsnCode: null,
                        minOrderQuantity: 1,
                        maxOrderQuantity: 100000,
                        deliveryDays: '3-5 Business Days',
                        deliveryAmount: 0,
                        deliveryTiers: [],
                        taxSlabs: [],
                        sizes: [],
                        priceSlabs: [],
                        sampleFiles: [],
                        youtubeUrl: product.youtubeUrl,
                        description: product.description,
                        discountText: null,
                        rawSubProduct: null,
                        allSiblingSubProducts: [],
                    });
                }
            });
        }

        // 2. Process direct selling products
        if (activeFinish === 'All' || activeFinish === '⚡ Direct Orders' || activeFinish === '🏷️ Discounted') {
            directSellingProducts.forEach(product => {
                const prodCatLower = (product.category || '').toLowerCase().trim();
                const prodNameLower = (product.name || '').toLowerCase().trim();
                const activeCatLower = activeCategory.toLowerCase().trim();

                const matchesCategoryFilter = activeCategory === 'All' ||
                    prodCatLower === activeCatLower ||
                    prodNameLower === activeCatLower;

                if (!matchesCategoryFilter) {
                    return;
                }

                const matchesName = prodNameLower.includes(searchLower);
                const matchesCategory = prodCatLower.includes(searchLower);
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

                const mainImg = product.imageUrls?.[0] || '/uploads/hero.png';

                list.push({
                    type: 'direct',
                    id: `direct-${product.id}`,
                    rawId: product.id,
                    name: product.name,
                    category: product.category || 'Direct Order',
                    parentProductName: product.category || 'Direct Selling',
                    imageUrl: mainImg,
                    galleryImages: Array.isArray(product.imageUrls) && product.imageUrls.length ? product.imageUrls : [mainImg],
                    price: price,
                    basePrice: basePrice,
                    isDiscounted: isDiscounted,
                    discountText: isDiscounted ? `${Math.round(((basePrice - price) / basePrice) * 100)}% OFF` : null,
                    description: product.description,
                    textAllowed: product.textAllowed,
                    isFeatured: product.isFeatured,
                    stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : (parseInt(product.stockQuantity as any) || 0),
                    minStockLevel: product.minStockLevel || 5,
                    deliveryDays: '1-3 Business Days',
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

    // Attach scroll and resize listeners for Popular Print Niches slider
    useEffect(() => {
        const el = nichesRef.current;
        if (!el) return;
        checkNichesScroll();
        el.addEventListener('scroll', checkNichesScroll, { passive: true });
        window.addEventListener('resize', checkNichesScroll);
        return () => {
            el.removeEventListener('scroll', checkNichesScroll);
            window.removeEventListener('resize', checkNichesScroll);
        };
    }, [checkNichesScroll, categories]);

    // Open product info modal
    const openProductDetails = (item: any) => {
        setSelectedProductItem(item);
        setSelectedSubProductId(item.rawId);
        setModalActiveImage(item.imageUrl || '/uploads/hero.png');
    };

    // Active subproduct in modal
    const currentModalSubProduct = useMemo(() => {
        if (!selectedProductItem) return null;
        if (selectedProductItem.type === 'direct') return selectedProductItem;
        if (!selectedProductItem.allSiblingSubProducts?.length) return selectedProductItem.rawSubProduct;
        if (!selectedSubProductId) return selectedProductItem.allSiblingSubProducts[0];
        return selectedProductItem.allSiblingSubProducts.find((s: any) => s.id === selectedSubProductId) || selectedProductItem.allSiblingSubProducts[0];
    }, [selectedProductItem, selectedSubProductId]);

    // Update modal active image when subproduct switches
    useEffect(() => {
        if (currentModalSubProduct && selectedProductItem) {
            const img = currentModalSubProduct.imageUrl || selectedProductItem.imageUrl || '/uploads/hero.png';
            setModalActiveImage(img);
        }
    }, [currentModalSubProduct, selectedProductItem]);

    const activeYoutubeEmbed = useMemo(() => {
        if (!selectedProductItem) return null;
        const rawUrl = currentModalSubProduct?.youtubeUrl || selectedProductItem.youtubeUrl;
        return getYouTubeEmbedUrl(rawUrl);
    }, [selectedProductItem, currentModalSubProduct]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header with Background Pattern, Ambient Glow & Trust Badges */}
            <header className="pt-10 pb-6 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-tr from-sky-400/10 via-emerald-400/10 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />

                <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                        <div className="space-y-2.5 max-w-2xl">
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#464674]/10 via-indigo-500/10 to-purple-500/10 text-[#464674] dark:text-indigo-300 text-[11px] font-extrabold border border-[#464674]/20 shadow-xs backdrop-blur-md">
                                <Sparkles className="w-3.5 h-3.5 text-[#464674] dark:text-indigo-300 animate-pulse" />
                                <span>AmazoPrint Studio • Professional Print & Merch</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                                Explore Our Fresh <span className="bg-gradient-to-r from-[#464674] via-indigo-600 to-purple-600 bg-clip-text text-transparent">Product Lineup</span>
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed max-w-xl">
                                From premium business cards and marketing collateral to direct custom merchandise — high-fidelity CMYK printing with instant online pricing.
                            </p>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5">
                            {[
                                { icon: ShieldCheck, text: "100% Quality Verified", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/50" },
                                { icon: Truck, text: "Pan-India Express Dispatch", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50" },
                                { icon: CheckCircle2, text: "Free Automated Pre-Press", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50" },
                                { icon: FileText, text: "GST Invoice Compliant", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/50" },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-2 text-xs font-bold ${item.color} ${item.bg} border px-3.5 py-2.5 rounded-2xl shadow-xs backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-sm`}>
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Popular Print Categories Avatar Track */}
                    <div className="mt-2 bg-gradient-to-b from-white/90 to-slate-50/70 dark:from-slate-900/90 dark:to-slate-950/70 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md relative group/niches shadow-xs">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-[#464674]" /> Browse by Print Categories
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => slideNiches('left')}
                                    disabled={!canScrollNichesLeft}
                                    title="Scroll left"
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-[#464674] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => slideNiches('right')}
                                    disabled={!canScrollNichesRight}
                                    title="Scroll right"
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-[#464674] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => slideNiches('left')}
                                disabled={!canScrollNichesLeft}
                                aria-label="Slide left"
                                className={cn(
                                    "absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full",
                                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md",
                                    "flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all duration-200",
                                    "hover:bg-[#464674] hover:text-white hover:scale-105 active:scale-95",
                                    !canScrollNichesLeft && "opacity-0 pointer-events-none scale-90"
                                )}
                            >
                                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                            </button>

                            <button
                                type="button"
                                onClick={() => slideNiches('right')}
                                disabled={!canScrollNichesRight}
                                aria-label="Slide right"
                                className={cn(
                                    "absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full",
                                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md",
                                    "flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all duration-200",
                                    "hover:bg-[#464674] hover:text-white hover:scale-105 active:scale-95",
                                    !canScrollNichesRight && "opacity-0 pointer-events-none scale-90"
                                )}
                            >
                                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                            </button>

                            {/* Edge Fade Gradients */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none z-10 transition-opacity duration-300",
                                canScrollNichesLeft ? "opacity-100" : "opacity-0"
                            )} />
                            <div className={cn(
                                "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none z-10 transition-opacity duration-300",
                                canScrollNichesRight ? "opacity-100" : "opacity-0"
                            )} />

                            {/* Avatar Track */}
                            <div
                                ref={nichesRef}
                                className="flex flex-nowrap items-start gap-4 sm:gap-6 overflow-x-auto scroll-smooth py-2 px-2 snap-x scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {categories.map((category) => {
                                    const catLower = category.toLowerCase().trim();
                                    const prod = initialProducts.find(p => (p.category && p.category.toLowerCase().trim() === catLower) || (p.name && p.name.toLowerCase().trim() === catLower));
                                    const directProd = directSellingProducts.find(p => (p.category && p.category.toLowerCase().trim() === catLower) || (p.name && p.name.toLowerCase().trim() === catLower));
                                    const activeSubImg = prod?.subProducts?.find((s: any) => s.isActive && s.imageUrl)?.imageUrl || prod?.subProducts?.find((s: any) => s.imageUrl)?.imageUrl;
                                    const productImg = category === 'All'
                                        ? (initialProducts.find((p: any) => p.imageUrl)?.imageUrl || directSellingProducts[0]?.imageUrls?.[0] || '')
                                        : (activeSubImg || prod?.imageUrl || directProd?.imageUrls?.[0] || '');
                                    const asset = CATEGORY_ASSETS[category] || { emoji: '📦', bg: 'from-gray-50 to-slate-100', label: category };
                                    const count = getCategoryCount(category);
                                    const isActive = activeCategory === category;

                                    return (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className="group flex flex-col items-center outline-none transition-all duration-300 hover:-translate-y-1 shrink-0 snap-start w-20 sm:w-24"
                                        >
                                            <div className={cn(
                                                "w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-xs border overflow-hidden relative transition-all duration-300 bg-white dark:bg-slate-950",
                                                isActive
                                                    ? "border-[#464674] ring-4 ring-[#464674]/25 scale-105 shadow-md"
                                                    : "border-slate-200/90 dark:border-slate-800 hover:border-[#464674]/50 hover:shadow-md"
                                            )}>
                                                <div className="relative w-full h-full p-2">
                                                    <CategoryAvatarImage
                                                        src={productImg}
                                                        alt={category}
                                                    />
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[11px] sm:text-xs font-black mt-2 text-center truncate max-w-[90px] sm:max-w-[100px] transition-colors leading-tight",
                                                isActive ? "text-[#464674] dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                            )}>
                                                {asset.label}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 mt-0.5">{count} {count === 1 ? 'item' : 'items'}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Interactive Filter Pills Bar */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Filter:</span>
                                <button
                                    onClick={() => { setActiveFinish('All'); setActiveCategory('All'); }}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-2xs",
                                        activeCategory === 'All' && activeFinish === 'All'
                                            ? "bg-[#464674] text-white border-[#464674] shadow-xs"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#464674]"
                                    )}
                                >
                                    ✨ All Products ({combinedProducts.length})
                                </button>
                                <button
                                    onClick={() => setActiveFinish(activeFinish === '⚡ Direct Orders' ? 'All' : '⚡ Direct Orders')}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-2xs",
                                        activeFinish === '⚡ Direct Orders'
                                            ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                                    )}
                                >
                                    ⚡ Direct Store ({directSellingProducts.length})
                                </button>
                                <button
                                    onClick={() => setActiveFinish(activeFinish === '✨ Spot UV' ? 'All' : '✨ Spot UV')}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-2xs",
                                        activeFinish === '✨ Spot UV'
                                            ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400"
                                    )}
                                >
                                    ✨ Spot UV Ready
                                </button>
                                <button
                                    onClick={() => setActiveFinish(activeFinish === '📐 Multi-Sizes' ? 'All' : '📐 Multi-Sizes')}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-2xs",
                                        activeFinish === '📐 Multi-Sizes'
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                                    )}
                                >
                                    📐 Multi-Sizes
                                </button>
                                <button
                                    onClick={() => setActiveFinish(activeFinish === '🏷️ Discounted' ? 'All' : '🏷️ Discounted')}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-2xs",
                                        activeFinish === '🏷️ Discounted'
                                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400"
                                    )}
                                >
                                    🔥 On Sale
                                </button>
                            </div>

                            {/* Hero Search Box */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Quick search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-7 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#464674]/30 shadow-2xs"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Catalog Section */}
            <section className="py-10 relative">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ── LEFT COLUMN: SIDEBAR FILTERS ── */}
                        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
                            {/* Search Box */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/80 shadow-xs space-y-3.5">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-[#464674]" /> Search Catalog
                                </h3>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#464674] transition-colors" />
                                    <Input
                                        placeholder="Name, SKU, GSM, Size..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-[#464674]/30 rounded-xl text-xs font-semibold"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/80 shadow-xs space-y-3">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center justify-between">
                                    <span>Categories</span>
                                    <Badge variant="secondary" className="text-[10px]">{categories.length}</Badge>
                                </h3>
                                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                                    {categories.map(category => {
                                        const count = getCategoryCount(category);
                                        const isActive = activeCategory === category;
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setActiveCategory(category)}
                                                className={cn(
                                                    "w-full flex items-center justify-between text-xs font-bold py-2 px-3 rounded-xl transition-all duration-200 text-left",
                                                    isActive
                                                        ? "bg-[#464674] text-white shadow-xs"
                                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <span>{category}</span>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-full border",
                                                    isActive
                                                        ? "bg-white/20 border-white/30 text-white"
                                                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                                                )}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Finish & Feature Filters */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800/80 shadow-xs space-y-3">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#464674]" /> Feature Filter
                                </h3>
                                <div className="space-y-1.5">
                                    {[
                                        { label: 'All Finishes', value: 'All' },
                                        { label: '✨ Spot UV Coating', value: '✨ Spot UV' },
                                        { label: '🏷️ Discounted Slabs', value: '🏷️ Discounted' },
                                        { label: '⚡ Direct Orders', value: '⚡ Direct Orders' },
                                        { label: '📐 Multi-Sizes', value: '📐 Multi-Sizes' },
                                    ].map(finish => {
                                        const isActive = activeFinish === finish.value;
                                        return (
                                            <button
                                                key={finish.value}
                                                onClick={() => setActiveFinish(finish.value)}
                                                className={cn(
                                                    "w-full flex items-center justify-between text-xs font-bold py-2 px-3 rounded-xl transition-all duration-200 text-left",
                                                    isActive
                                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <span>{finish.label}</span>
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    isActive ? "bg-white dark:bg-slate-900" : "bg-transparent"
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Trust Guarantee Box */}
                            <div className="rounded-3xl p-5 bg-gradient-to-br from-[#464674] to-[#2f2f54] text-white shadow-xl space-y-3 border border-indigo-400/20">
                                <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                                    <Award className="w-3 h-3 text-amber-300" /> AmazoPrint Promise
                                </div>
                                <h4 className="text-base font-black leading-snug">Need Custom Printing or Bulk Quantities?</h4>
                                <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                                    Enjoy automated pre-flight checks, verified color accuracy, and direct printer assignment nationwide.
                                </p>
                            </div>
                        </aside>

                        {/* ── RIGHT COLUMN: CATALOG DISPLAY ── */}
                        <div className="lg:col-span-9 space-y-6">
                            {/* Toolbar: Result Counts, View Switcher & Sorting */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        Showing <span className="text-slate-900 dark:text-white font-black text-sm">{combinedProducts.length}</span> verified products
                                    </div>
                                    {activeCategory !== 'All' && (
                                        <Badge className="bg-[#464674]/10 text-[#464674] dark:text-indigo-300 border-none font-bold text-[10px]">
                                            {activeCategory}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* View Mode Toggle */}
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                                                viewMode === 'grid'
                                                    ? "bg-white dark:bg-slate-900 text-[#464674] dark:text-white shadow-xs"
                                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                            )}
                                            title="Grid View"
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                                                viewMode === 'list'
                                                    ? "bg-white dark:bg-slate-900 text-[#464674] dark:text-white shadow-xs"
                                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                            )}
                                            title="Detailed Specifications View"
                                        >
                                            <ListFilter className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Sort Dropdown */}
                                    <div className="flex items-center gap-1.5">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#464674]/20 transition-all cursor-pointer"
                                        >
                                            <option value="default">Default Sort</option>
                                            <option value="price-low">Price: Low to High</option>
                                            <option value="price-high">Price: High to Low</option>
                                            <option value="name">Product Name: A-Z</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Product List / Grid */}
                            {combinedProducts.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-xs">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No products found</h3>
                                    <p className="text-muted-foreground font-medium text-xs max-w-xs mx-auto">
                                        We couldn't find any products matching your selected search or filter criteria.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-6 rounded-2xl font-bold text-xs px-6 h-10"
                                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveFinish('All'); }}
                                    >
                                        Reset All Filters
                                    </Button>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {combinedProducts.map((item: any) => {
                                        const isCustom = item.type === 'custom';
                                        const targetHref = isCustom
                                            ? (item.rawId ? `/design/${item.parentProductSlug}/start?subProductId=${item.rawId}` : `/design/${item.parentProductSlug}/start`)
                                            : `/products/direct/${item.rawId}`;

                                        return (
                                            <Card
                                                key={item.id}
                                                className="h-full flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-[#464674]/50 hover:-translate-y-1.5 group"
                                            >
                                                {/* Image Container with Zoom */}
                                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800">
                                                    <ProductCardImage
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                    />

                                                    {/* Floating Feature Badges */}
                                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                                                        {isCustom ? (
                                                            <>
                                                                {item.spotUvAllowed && (
                                                                    <Badge className="bg-violet-600 text-white border-none shadow-md text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                        ✨ Spot UV
                                                                    </Badge>
                                                                )}
                                                                {item.sizes && item.sizes.length > 0 && (
                                                                    <Badge className="bg-blue-600 text-white border-none shadow-md text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                        📐 {item.sizes.length} Sizes
                                                                    </Badge>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-md text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                                <Zap className="w-2.5 h-2.5 fill-current" /> Direct Buy
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Discount Badge */}
                                                    {item.discountText && (
                                                        <div className="absolute top-3 right-3 z-10 pointer-events-none">
                                                            <Badge variant="destructive" className="bg-rose-500 text-white border-none shadow-md text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                {item.discountText}
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    {/* Quick View Button on Image Hover */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openProductDetails(item);
                                                        }}
                                                        className="absolute bottom-3 right-3 z-10 bg-white/95 dark:bg-slate-900/95 hover:bg-[#464674] hover:text-white text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700 backdrop-blur-md opacity-90 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-[11px] font-bold"
                                                        title="View Complete Specifications"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> Specs
                                                    </button>
                                                </div>

                                                {/* Content Details */}
                                                <CardContent className="p-5 flex-grow flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider truncate">
                                                                {item.category}
                                                            </p>
                                                            {item.sku && (
                                                                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                    {item.sku}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h3 className="text-base font-bold tracking-tight leading-snug group-hover:text-[#464674] dark:group-hover:text-indigo-400 transition-colors text-slate-900 dark:text-white line-clamp-2">
                                                            {item.name}
                                                        </h3>

                                                        {/* Specifications Badges (Width x Height, Turnaround, MOQ) */}
                                                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500 font-medium">
                                                            {item.width && item.height ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                                                                    📏 {item.width} × {item.height} {item.unitType || 'mm'}
                                                                </span>
                                                            ) : null}
                                                            {item.deliveryDays && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                                                                    🚚 {item.deliveryDays}
                                                                </span>
                                                            )}
                                                            {item.minOrderQuantity > 1 && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">
                                                                    Min: {item.minOrderQuantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Price & Action Row */}
                                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Starting from</span>
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-lg font-black text-slate-900 dark:text-white flex items-center leading-none">
                                                                    ₹{item.price}
                                                                </span>
                                                                {item.price > 0 && (
                                                                    <span className="text-[10px] text-slate-400 font-medium line-through">
                                                                        ₹{(item.price * 1.3).toFixed(0)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                className={cn(
                                                                    "h-9 px-3.5 rounded-xl font-bold text-xs shadow-xs transition-all group/btn",
                                                                    isCustom
                                                                        ? "bg-[#464674] hover:bg-[#38385e] text-white"
                                                                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                                                )}
                                                            >
                                                                <Link href={targetHref} className="flex items-center gap-1">
                                                                    <span>{isCustom ? 'Customize' : 'Order Now'}</span>
                                                                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Detailed Specification List View */
                                <div className="space-y-4">
                                    {combinedProducts.map((item: any) => {
                                        const isCustom = item.type === 'custom';
                                        const targetHref = isCustom
                                            ? (item.rawId ? `/design/${item.parentProductSlug}/start?subProductId=${item.rawId}` : `/design/${item.parentProductSlug}/start`)
                                            : `/products/direct/${item.rawId}`;

                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-6 group"
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative w-full md:w-48 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 shrink-0 border border-slate-100 dark:border-slate-800">
                                                    <ProductCardImage
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                    />
                                                    {item.discountText && (
                                                        <Badge variant="destructive" className="absolute top-2 right-2 text-[9px] font-black">
                                                            {item.discountText}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Information Columns */}
                                                <div className="flex-grow space-y-2.5 w-full">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[10px] font-bold">
                                                                {item.category}
                                                            </Badge>
                                                            {item.sku && (
                                                                <span className="text-[10px] font-mono text-slate-400">
                                                                    SKU: {item.sku}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.deliveryDays && (
                                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                <Truck className="w-3.5 h-3.5" /> {item.deliveryDays}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#464674] transition-colors">
                                                        {item.name}
                                                    </h3>

                                                    {item.description && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                    )}

                                                    {/* Specs tags */}
                                                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                                                        {item.width && item.height && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold">
                                                                📐 {item.width} × {item.height} {item.unitType || 'mm'}
                                                            </span>
                                                        )}
                                                        {item.spotUvAllowed && (
                                                            <span className="bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-lg font-semibold">
                                                                ✨ Spot UV Ready
                                                            </span>
                                                        )}
                                                        {item.sizes && item.sizes.length > 0 && (
                                                            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg font-semibold">
                                                                {item.sizes.length} Size Variations
                                                            </span>
                                                        )}
                                                        {item.hsnCode && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg font-mono text-[10px]">
                                                                HSN: {item.hsnCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price and CTA Block */}
                                                <div className="shrink-0 flex flex-col items-end justify-between gap-3 w-full md:w-auto md:min-w-[180px] pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Starting Price</span>
                                                        <div className="flex items-baseline justify-end gap-1.5">
                                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                                ₹{item.price}
                                                            </span>
                                                            {item.price > 0 && (
                                                                <span className="text-xs text-slate-400 line-through">
                                                                    ₹{(item.price * 1.3).toFixed(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 w-full">
                                                        <Button
                                                            asChild
                                                            className={cn(
                                                                "w-full rounded-xl font-bold text-xs h-10 shadow-xs group/btn transition-all",
                                                                isCustom
                                                                    ? "bg-[#464674] hover:bg-[#38385e] text-white"
                                                                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                                            )}
                                                        >
                                                            <Link href={targetHref} className="flex items-center justify-center gap-1.5">
                                                                <span>{isCustom ? 'Customize & Order' : 'Instant Order'}</span>
                                                                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                                                            </Link>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openProductDetails(item)}
                                                            className="w-full rounded-xl font-bold text-xs h-8 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 mr-1" /> View Full Specs
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── COMPREHENSIVE FULL-INFORMATION MODAL ── */}
            {selectedProductItem && (
                <Dialog open={!!selectedProductItem} onOpenChange={(open) => !open && setSelectedProductItem(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <DialogHeader className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-[#464674]/10 text-[#464674] dark:text-indigo-300 border-none font-bold text-[10px]">
                                    {selectedProductItem.category}
                                </Badge>
                                {currentModalSubProduct?.sku && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        SKU: {currentModalSubProduct.sku}
                                    </span>
                                )}
                            </div>
                            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                {currentModalSubProduct?.name || selectedProductItem.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                {selectedProductItem.parentProductName ? `Part of ${selectedProductItem.parentProductName} series` : 'Complete technical specifications and volume tier details'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
                            {/* Left Column: Image Gallery & Video Demo */}
                            <div className="md:col-span-5 space-y-4">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={buildImageUrl(modalActiveImage || selectedProductItem.imageUrl)}
                                        alt={selectedProductItem.name}
                                        className="w-full h-full object-contain p-2"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/hero.png'; }}
                                    />
                                </div>

                                {/* Thumbnail Switcher if gallery images exist */}
                                {selectedProductItem.galleryImages && selectedProductItem.galleryImages.length > 1 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                        {selectedProductItem.galleryImages.map((img: string, idx: number) => {
                                            const isSelected = modalActiveImage === img || (!modalActiveImage && idx === 0);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setModalActiveImage(img)}
                                                    className={cn(
                                                        "relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                                                        isSelected ? "border-[#464674] shadow-xs" : "border-slate-200 opacity-70 hover:opacity-100"
                                                    )}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={buildImageUrl(img)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/hero.png'; }} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* YouTube Video Embed if available */}
                                {activeYoutubeEmbed && (
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video relative">
                                        <iframe
                                            src={activeYoutubeEmbed}
                                            title="Product Video Demo"
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                )}

                                {/* Key Features Checklist */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                                    <div className="font-black text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider mb-1">
                                        Production Quality
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Professional 300+ DPI Pre-press verification
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" /> CMYK Calibrated offset & digital printing
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Free replacement on manufacturing defects
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Full Specifications Tabs */}
                            <div className="md:col-span-7 space-y-5">
                                {/* Subproduct Variant Switcher if master product has siblings */}
                                {selectedProductItem.allSiblingSubProducts && selectedProductItem.allSiblingSubProducts.length > 1 && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                            Select Variant ({selectedProductItem.allSiblingSubProducts.length} options)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProductItem.allSiblingSubProducts.map((sub: any) => {
                                                const isSelected = (currentModalSubProduct?.id || selectedSubProductId) === sub.id;
                                                return (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSubProductId(sub.id);
                                                            if (sub.imageUrl) setModalActiveImage(sub.imageUrl);
                                                        }}
                                                        className={cn(
                                                            "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5",
                                                            isSelected
                                                                ? "bg-[#464674] text-white border-[#464674] shadow-xs"
                                                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#464674]"
                                                        )}
                                                    >
                                                        <span>{sub.name}</span>
                                                        <span className={cn("text-[10px]", isSelected ? "text-indigo-200" : "text-slate-400")}>
                                                            ₹{sub.price || selectedProductItem.price}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Price Banner */}
                                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800 dark:to-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase block">
                                            Base Rate
                                        </span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                ₹{currentModalSubProduct?.price || selectedProductItem.price}
                                            </span>
                                            {selectedProductItem.discountText && (
                                                <Badge variant="destructive" className="text-[10px] font-black">
                                                    {selectedProductItem.discountText}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                                            🚚 {currentModalSubProduct?.deliveryDays || selectedProductItem.deliveryDays || '3-5 Business Days'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            Min Order: {currentModalSubProduct?.minOrderQuantity || selectedProductItem.minOrderQuantity || 1} pcs
                                        </span>
                                    </div>
                                </div>

                                {/* Detailed Specifications Tabs */}
                                <Tabs defaultValue="specs" className="w-full">
                                    <TabsList className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                        <TabsTrigger value="specs" className="rounded-lg text-xs font-bold">
                                            Specifications
                                        </TabsTrigger>
                                        <TabsTrigger value="pricing" className="rounded-lg text-xs font-bold">
                                            Price Slabs
                                        </TabsTrigger>
                                        <TabsTrigger value="delivery" className="rounded-lg text-xs font-bold">
                                            Delivery & Files
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Specs Tab */}
                                    <TabsContent value="specs" className="space-y-3 pt-3">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Standard Dimensions</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {currentModalSubProduct?.width || selectedProductItem.width || '89'} × {currentModalSubProduct?.height || selectedProductItem.height || '54'} {currentModalSubProduct?.unitType || selectedProductItem.unitType || 'mm'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Print Sides</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {(currentModalSubProduct?.maxPages || selectedProductItem.maxPages) > 1 ? 'Single / Double Sided' : 'Single Sided'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Spot UV Compatibility</span>
                                                <span className={cn("font-bold", (currentModalSubProduct?.spotUvAllowed ?? selectedProductItem.spotUvAllowed) ? "text-violet-600" : "text-slate-500")}>
                                                    {(currentModalSubProduct?.spotUvAllowed ?? selectedProductItem.spotUvAllowed) ? '✨ Supported' : 'Not Applicable'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] text-slate-400 font-bold block uppercase">HSN Code & Tax</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {currentModalSubProduct?.hsnCode || selectedProductItem.hsnCode || '4911'} (18% GST)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Size Variations List */}
                                        {currentModalSubProduct?.sizes && currentModalSubProduct.sizes.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                                    Available Size Variants ({currentModalSubProduct.sizes.length})
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {currentModalSubProduct.sizes.map((s: any, idx: number) => (
                                                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                            {s.name}: {s.width}×{s.height} {s.unit || 'mm'} {s.priceAdjustment > 0 ? `(+₹${s.priceAdjustment})` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Pricing Slabs Tab */}
                                    <TabsContent value="pricing" className="space-y-3 pt-3">
                                        {currentModalSubProduct?.priceSlabs && currentModalSubProduct.priceSlabs.length > 0 ? (
                                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-slate-100 dark:bg-slate-800 font-black text-slate-700 dark:text-slate-300">
                                                        <tr>
                                                            <th className="p-2.5">Quantity (Units)</th>
                                                            <th className="p-2.5">Total Price</th>
                                                            <th className="p-2.5">Per Piece Rate</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {currentModalSubProduct.priceSlabs.map((slab: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                <td className="p-2.5 font-bold">{slab.quantity} pcs</td>
                                                                <td className="p-2.5 font-black text-slate-900 dark:text-white">₹{slab.price}</td>
                                                                <td className="p-2.5 font-mono text-emerald-600">₹{(Number(slab.price) / Number(slab.quantity)).toFixed(2)} / pc</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-500">
                                                Standard base pricing of ₹{currentModalSubProduct?.price || selectedProductItem.price} per unit. Volume tier calculations apply automatically during design configuration.
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Delivery & Files Tab */}
                                    <TabsContent value="delivery" className="space-y-3 pt-3">
                                        {currentModalSubProduct?.deliveryTiers && currentModalSubProduct.deliveryTiers.length > 0 ? (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                                    Delivery Options
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {currentModalSubProduct.deliveryTiers.map((tier: any, idx: number) => (
                                                        <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                                            <div>
                                                                <span className="font-bold block">{tier.name}</span>
                                                                <span className="text-[10px] text-slate-400">{tier.estimatedTime}</span>
                                                            </div>
                                                            <span className="font-black text-slate-900 dark:text-white">
                                                                {Number(tier.amount) === 0 ? 'FREE' : `+₹${tier.amount}`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Sample Guideline Files Download */}
                                        {currentModalSubProduct?.sampleFiles && currentModalSubProduct.sampleFiles.length > 0 ? (
                                            <div className="space-y-2 pt-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                                    Download Design Guidelines & Templates
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentModalSubProduct.sampleFiles.map((file: any, idx: number) => (
                                                        <a
                                                            key={idx}
                                                            href={buildImageUrl(file.fileUrl)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#464674] hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> {file.name || `Template ${idx + 1}`} ({file.fileType || 'PDF'})
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </TabsContent>
                                </Tabs>

                                {/* Ordering Action Buttons */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                                    {selectedProductItem.type === 'custom' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <Button
                                                asChild
                                                className="bg-[#464674] hover:bg-[#38385e] text-white rounded-xl font-bold text-xs h-11 shadow-md"
                                            >
                                                <Link href={`/design/${selectedProductItem.parentProductSlug}/start?subProductId=${currentModalSubProduct?.id || selectedSubProductId}`}>
                                                    🎨 Design Online
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="rounded-xl font-bold text-xs h-11 border-[#464674]/40 hover:bg-[#464674]/10 text-[#464674] dark:text-white"
                                            >
                                                <Link href={`/design/${selectedProductItem.parentProductSlug}/contest?subProductId=${currentModalSubProduct?.id || selectedSubProductId}`}>
                                                    🏆 Post Contest
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="rounded-xl font-bold text-xs h-11 text-slate-700 dark:text-slate-300"
                                            >
                                                <Link href={`/design/${selectedProductItem.parentProductSlug}/upload?subProductId=${currentModalSubProduct?.id || selectedSubProductId}`}>
                                                    📤 Upload File
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            asChild
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm h-11 shadow-md"
                                        >
                                            <Link href={`/products/direct/${selectedProductItem.rawId}`}>
                                                Proceed to Direct Order →
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
