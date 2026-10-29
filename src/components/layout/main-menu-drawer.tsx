'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { AmazoprintLogo } from '@/components/ui/logo';
import { getSession } from '@/app/actions/user-actions';
import { getProducts } from '@/app/actions/product-actions';
import { LogoutButton } from './logout-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, resolveImagePath } from '@/lib/utils';
import {
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  Home,
  Package,
  Sparkles,
  Trophy,
  Upload,
  Printer,
  PenTool,
  LayoutGrid,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Layers,
  ChevronRight,
  User,
  LogIn,
  UserPlus,
  Compass,
  CreditCard,
  Gift,
  FileText,
  Tag,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import NextImage from 'next/image';

type Session = Awaited<ReturnType<typeof getSession>>;

// Rich Fallback Categories with detailed Sub-Products for Drill-Down
const FALLBACK_PRODUCTS_WITH_SUBS = [
  {
    id: 1,
    name: 'Visiting Cards',
    slug: 'visiting-cards',
    description: 'First impressions that last with premium stock & luxury finishes',
    icon: CreditCard,
    subProducts: [
      { id: 101, name: 'Standard Visiting Cards', width: 89, height: 51, unitType: 'mm', price: 199, spotUvAllowed: false, preview: '350 GSM Matte or Gloss finish' },
      { id: 102, name: 'Premium Velvet Touch Cards', width: 89, height: 51, unitType: 'mm', price: 349, spotUvAllowed: false, preview: 'Ultra soft-touch lamination' },
      { id: 103, name: 'Raised Spot UV Cards', width: 89, height: 51, unitType: 'mm', price: 499, spotUvAllowed: true, preview: 'Glossy 3D UV textures on matte' },
      { id: 104, name: 'Metallic Gold Foil Cards', width: 89, height: 51, unitType: 'mm', price: 599, spotUvAllowed: true, preview: 'Embossed gleaming foil accents' },
    ],
  },
  {
    id: 2,
    name: 'Flyers & Leaflets',
    slug: 'flyers',
    description: 'High-impact marketing flyers and handouts for events & promotions',
    icon: Layers,
    subProducts: [
      { id: 201, name: 'A5 Single Sided Flyers', width: 148, height: 210, unitType: 'mm', price: 299, preview: '130 GSM Gloss art paper' },
      { id: 202, name: 'A5 Double Sided Flyers', width: 148, height: 210, unitType: 'mm', price: 449, preview: '170 GSM Premium art paper' },
      { id: 203, name: 'A4 Tri-Fold Pamphlets', width: 210, height: 297, unitType: 'mm', price: 699, preview: '3-Panel creased & folded' },
      { id: 204, name: 'Square Promo Handouts', width: 120, height: 120, unitType: 'mm', price: 249, preview: 'Modern square cut leaflets' },
    ],
  },
  {
    id: 3,
    name: 'Packaging & Custom Boxes',
    slug: 'packaging',
    description: 'Custom mailers, rigid boxes, and retail packaging built to protect',
    icon: Package,
    subProducts: [
      { id: 301, name: 'Corrugated Shipping Mailers', width: 250, height: 180, unitType: 'mm', price: 499, preview: 'Heavy duty E-flute kraft mailers' },
      { id: 302, name: 'Rigid Luxury Magnetic Boxes', width: 220, height: 160, unitType: 'mm', price: 799, preview: 'Hardboard gift presentation box' },
      { id: 303, name: 'Stand-up Zipper Pouches', width: 150, height: 220, unitType: 'mm', price: 399, preview: 'Food-grade barrier film pouches' },
      { id: 304, name: 'Product Tuck-End Cartons', width: 100, height: 150, unitType: 'mm', price: 349, preview: 'Custom retail medicine & cosmetic boxes' },
    ],
  },
  {
    id: 4,
    name: 'Custom Stickers & Labels',
    slug: 'stickers',
    description: 'Waterproof die-cut stickers, sheet labels, and packaging seals',
    icon: Tag,
    subProducts: [
      { id: 401, name: 'Die-Cut Vinyl Stickers', width: 75, height: 75, unitType: 'mm', price: 149, preview: 'Waterproof outdoor grade vinyl' },
      { id: 402, name: 'Product Roll Labels', width: 50, height: 50, unitType: 'mm', price: 299, preview: 'Machine applicator roll packaging labels' },
      { id: 403, name: 'Holographic Metallic Stickers', width: 60, height: 60, unitType: 'mm', price: 249, preview: 'Shimmering rainbow prismatic film' },
      { id: 404, name: 'Transparent Clear Labels', width: 80, height: 40, unitType: 'mm', price: 199, preview: 'Crystal clear no-label look' },
    ],
  },
  {
    id: 5,
    name: 'Letterheads & Stationery',
    slug: 'letterhead',
    description: 'Corporate stationery, executive letterheads, and business envelopes',
    icon: FileText,
    subProducts: [
      { id: 501, name: 'Executive Bond Letterheads', width: 210, height: 297, unitType: 'mm', price: 399, preview: '100 GSM Alabaster watermark bond' },
      { id: 502, name: 'Official Peel & Seal Envelopes', width: 240, height: 110, unitType: 'mm', price: 349, preview: '120 GSM Royal texture with window option' },
      { id: 503, name: 'Custom Spiral Notepads', width: 148, height: 210, unitType: 'mm', price: 199, preview: '50 ruled/plain sheets with stiff backing' },
    ],
  },
  {
    id: 6,
    name: 'Large Format Posters & Banners',
    slug: 'posters',
    description: 'High-resolution large prints for exhibitions, stores & promotions',
    icon: Sparkles,
    subProducts: [
      { id: 601, name: 'Ultra-HD Glossy Posters', width: 297, height: 420, unitType: 'mm', price: 199, preview: 'A3 250 GSM vivid photo paper' },
      { id: 602, name: 'Roll-Up Standee Banners', width: 760, height: 1820, unitType: 'mm', price: 999, preview: 'Aluminum base with non-tearable PVC' },
      { id: 603, name: 'Heavy Duty Vinyl Flex Banners', width: 1200, height: 900, unitType: 'mm', price: 499, preview: 'Reinforced eyelets for outdoor display' },
    ],
  },
  {
    id: 7,
    name: 'Corporate Apparel & T-Shirts',
    slug: 't-shirt',
    description: 'Branded bio-wash t-shirts, polo shirts, and custom team wear',
    icon: Gift,
    subProducts: [
      { id: 701, name: '100% Cotton Bio-Wash Round Neck', width: 'S-XXL', height: 'Unisex', unitType: '', price: 399, preview: '180 GSM breathable screen / DTG print' },
      { id: 702, name: 'Corporate Embroidered Polo Shirts', width: 'S-XXL', height: 'Pique', unitType: '', price: 599, preview: '240 GSM heavy knit with collar' },
      { id: 703, name: 'Custom Branded Ceramic Mugs', width: '330', height: 'ml', unitType: '', price: 149, preview: 'Full wrap high-gloss sublimation' },
    ],
  },
  {
    id: 8,
    name: 'ID Cards & Lanyards',
    slug: 'id-cards',
    description: 'Durable PVC identification badges, smart RFID cards & ribbons',
    icon: User,
    subProducts: [
      { id: 801, name: 'PVC Smart Photo ID Cards', width: 86, height: 54, unitType: 'mm', price: 99, preview: 'Credit card thickness CR80 PVC' },
      { id: 802, name: 'Sublimated Satin Lanyards', width: 20, height: 900, unitType: 'mm', price: 49, preview: 'Full color printed ribbon with dog hook' },
      { id: 803, name: 'RFID Proximity Access Badges', width: 86, height: 54, unitType: 'mm', price: 149, preview: 'Embedded 13.56 MHz / 125 KHz chip' },
    ],
  },
  {
    id: 9,
    name: 'Brochures & Catalogs',
    slug: 'brochures',
    description: 'Multi-page product catalogs, annual reports & presentation folders',
    icon: Layers,
    subProducts: [
      { id: 901, name: 'Bi-Fold Showcase Brochures', width: 210, height: 297, unitType: 'mm', price: 499, preview: '4-Page 300 GSM cover with laminated finish' },
      { id: 902, name: 'Multi-Page Booklet Catalogs', width: 210, height: 297, unitType: 'mm', price: 899, preview: 'Center stapled / perfect bound' },
      { id: 903, name: 'Presentation Pocket Folders', width: 220, height: 310, unitType: 'mm', price: 599, preview: 'Die-cut pocket with card slot' },
    ],
  },
];

export interface MainMenuDrawerProps {
  theme?: 'light' | 'dark' | 'auto';
  buttonLabel?: string;
  showLabel?: boolean;
  className?: string;
}

export function MainMenuDrawer({
  theme = 'auto',
  buttonLabel = 'Menu',
  showLabel = true,
  className,
}: MainMenuDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Drill-down State: selected category for level-2 view
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    getProducts().then((data: any[]) => {
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data.filter((p) => p.isActive));
      }
    });
  }, []);

  // When drawer closes, reset drill-down state after animation
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setSelectedProduct(null), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const getDashboardUrl = (role?: string) => {
    if (!role) return '/';
    switch (role) {
      case 'freelancer':
        return '/freelancer/dashboard';
      case 'admin':
      case 'super_admin':
      case 'company_admin':
      case 'designer':
        return '/admin/dashboard';
      case 'accounts':
        return '/accounts/dashboard';
      case 'printer':
        return '/printer/dashboard';
      default:
        return '/client/dashboard';
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setOpen(false);
      setSearchQuery('');
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
  };

  const handleNavClick = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // Merge live database products with rich fallback sub-products
  const mergedProducts = React.useMemo(() => {
    if (products.length === 0) return FALLBACK_PRODUCTS_WITH_SUBS;

    return products.map((p) => {
      const fallbackMatch = FALLBACK_PRODUCTS_WITH_SUBS.find(
        (f) => f.name.toLowerCase() === p.name.toLowerCase() || f.slug === p.slug
      );

      const liveSubs = Array.isArray(p.subProducts)
        ? p.subProducts.filter((sp: any) => sp.isActive)
        : [];

      return {
        ...p,
        icon: fallbackMatch?.icon || Package,
        description: p.description || fallbackMatch?.description || 'Custom print specifications available',
        subProducts: liveSubs.length > 0 ? liveSubs : (fallbackMatch?.subProducts || []),
      };
    });
  }, [products]);

  // Live filter if searching
  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mergedProducts;

    return mergedProducts.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const subMatch = p.subProducts?.some((sp: any) => sp.name?.toLowerCase().includes(q));
      return nameMatch || subMatch;
    });
  }, [searchQuery, mergedProducts]);

  // Quick secondary navigation hubs
  const secondaryHubs = [
    { label: 'Home', href: '/', icon: Home, desc: 'Return to start page' },
    { label: 'Design Templates', href: '/templates', icon: Sparkles, desc: 'Customizable layouts' },
    { label: 'Design Quests', href: '/contests', icon: Trophy, desc: 'Enter design contests' },
    { label: 'Custom Artwork Upload', href: '/products', icon: Upload, desc: 'Upload PDF / CDR specs' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* ── THREE-LINE BAR BUTTON TRIGGER (HANDLE AT CORNER) ── */}
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open Navigation Menu"
          className={cn(
            'group relative inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all duration-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'active:scale-95 cursor-pointer',
            theme === 'dark'
              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/35 shadow-sm shadow-black/10'
              : theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 hover:border-slate-300 shadow-sm'
              : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-foreground border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md',
            className
          )}
        >
          {/* Animated Three Horizontal Lines */}
          <div className="relative flex flex-col justify-center gap-1 w-5 h-4.5 overflow-hidden">
            <span
              className={cn(
                'h-[2.5px] rounded-full transition-all duration-300 ease-out',
                'w-5 group-hover:w-3.5',
                theme === 'dark' ? 'bg-white' : 'bg-current'
              )}
            />
            <span
              className={cn(
                'h-[2.5px] rounded-full transition-all duration-300 ease-out',
                'w-3.5 group-hover:w-5 group-hover:translate-x-0.5',
                theme === 'dark' ? 'bg-white' : 'bg-current'
              )}
            />
            <span
              className={cn(
                'h-[2.5px] rounded-full transition-all duration-300 ease-out',
                'w-4.5 group-hover:w-4',
                theme === 'dark' ? 'bg-white' : 'bg-current'
              )}
            />
          </div>

          {showLabel && (
            <span className="text-[12px] font-bold tracking-wider uppercase transition-colors">
              {buttonLabel}
            </span>
          )}

          {/* Micro active pulse indicator */}
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </SheetTrigger>

      {/* ── SLIDE-OUT ALL-IN-ONE DRILL-DOWN DRAWER ── */}
      <SheetContent
        side="left"
        className={cn(
          'p-0 flex flex-col h-full',
          'w-[92vw] sm:max-w-md md:max-w-xl lg:max-w-xl',
          'bg-gradient-to-b from-white via-slate-50/70 to-white dark:from-[#0f111e] dark:via-[#161829] dark:to-[#0f111e]',
          'border-r border-slate-200/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl'
        )}
      >
        {/* TOP BRANDING BAR */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="hover:opacity-90 transition-opacity"
            >
              <AmazoprintLogo variant="sidebar" />
            </Link>
            <Badge
              variant="secondary"
              className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider py-0.5"
            >
              Print Catalog
            </Badge>
          </div>
        </div>

        {/* SEARCH BAR (Always accessible at top) */}
        <div className="px-5 pt-3 pb-2.5 bg-white/40 dark:bg-slate-900/20 border-b border-slate-200/40 dark:border-white/5 flex-shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, sizes, finishes..."
                className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                className="h-7 px-3 text-[11px] font-bold rounded-xl shadow-xs"
              >
                Find
              </Button>
            </div>
          </form>
        </div>

        {/* ── MAIN SCROLLABLE DRILL-DOWN CONTAINER ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            {/* ════════════════════════════════════════════════════════════
                LEVEL 1: DRILL-DOWN SUB-PRODUCTS VIEW
            ════════════════════════════════════════════════════════════ */}
            {selectedProduct ? (
              <motion.div
                key={`subproducts-${selectedProduct.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Back navigation button */}
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="group inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors py-1 px-2.5 rounded-xl bg-primary/10 hover:bg-primary/15"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  <span>Back to All Products</span>
                </button>

                {/* Selected Product Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-slate-100 dark:from-primary/20 dark:via-slate-800/60 dark:to-slate-800/40 border border-primary/20 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      Product Category
                    </span>
                    <h3 className="text-base font-black text-foreground mt-0.5 truncate">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <Link
                    href={`/products?category=${encodeURIComponent(selectedProduct.name)}`}
                    onClick={() => setOpen(false)}
                    className="flex-shrink-0 text-[11px] font-bold text-primary hover:underline flex items-center gap-1 whitespace-nowrap bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-primary/20 shadow-xs"
                  >
                    View All <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Sub-Products List (The Drill-Down Options) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Select Sub-Product / Finish ({selectedProduct.subProducts?.length || 0})
                    </p>
                    <span className="text-[10px] text-muted-foreground">Click to customize</span>
                  </div>

                  <div className="space-y-2">
                    {selectedProduct.subProducts?.map((sp: any) => {
                      const imgUrl = resolveImagePath(sp.imageUrl || selectedProduct.imageUrl);
                      const targetUrl = selectedProduct.slug
                        ? `/products?category=${encodeURIComponent(selectedProduct.name)}&q=${encodeURIComponent(sp.name)}`
                        : `/products?category=${encodeURIComponent(selectedProduct.name)}`;

                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => handleNavClick(targetUrl)}
                          className="w-full text-left group/sub flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          {/* Sub-product image thumbnail */}
                          <div className="w-13 h-13 rounded-xl bg-slate-100 dark:bg-slate-700/60 overflow-hidden relative flex-shrink-0 flex items-center justify-center border border-slate-200/50">
                            {imgUrl ? (
                              <NextImage
                                src={imgUrl}
                                alt={sp.name}
                                fill
                                className="object-cover group-hover/sub:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Sub-product info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover/sub:text-primary transition-colors truncate">
                                {sp.name}
                              </h4>
                              {sp.price && (
                                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  ₹{Number(sp.price).toFixed(0)}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                              {sp.preview || sp.description || 'Standard customized production & express delivery'}
                            </p>

                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {sp.width && (
                                <span className="text-[9px] font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                                  {sp.width}×{sp.height} {sp.unitType || 'mm'}
                                </span>
                              )}
                              {sp.spotUvAllowed && (
                                <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                                  ✨ Spot UV Available
                                </span>
                              )}
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                Custom Print
                              </span>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover/sub:text-primary group-hover/sub:translate-x-1 transition-all flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom spec / Upload CTA */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Need custom sizes or bulk specs?</p>
                      <p className="text-[10px] text-muted-foreground">Submit custom design requests with our team</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNavClick('/products')}
                    className="h-7 text-xs font-bold rounded-xl"
                  >
                    Custom Quote
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* ════════════════════════════════════════════════════════════
                  LEVEL 0: PRIMARY PRODUCTS DIRECTORY (PRIORITIZED FIRST!)
              ════════════════════════════════════════════════════════════ */
              <motion.div
                key="categories-root"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* 1. PRODUCTS & SUB-PRODUCTS DIRECTORY (PRIORITIZED AT TOP!) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Products & Sub-Products
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Click any product category to drill down into sub-products & finishes
                      </p>
                    </div>
                    <Link
                      href="/products"
                      onClick={() => setOpen(false)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 whitespace-nowrap ml-2"
                    >
                      All Catalog <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {filteredProducts.map((product) => {
                      const IconComponent = product.icon || Package;
                      const subCount = product.subProducts?.length || 0;
                      const previewNames = product.subProducts
                        ?.slice(0, 3)
                        .map((sp: any) => sp.name.replace(product.name, '').trim() || sp.name)
                        .join(' • ');

                      return (
                        <button
                          key={product.id || product.slug}
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="w-full text-left group/item flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          {/* Category Thumbnail / Icon */}
                          <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 relative overflow-hidden border border-primary/20">
                            {product.imageUrl ? (
                              <NextImage
                                src={resolveImagePath(product.imageUrl)}
                                alt={product.name}
                                fill
                                className="object-cover group-hover/item:scale-105 transition-transform"
                              />
                            ) : (
                              <IconComponent className="w-6 h-6 transition-transform group-hover/item:scale-110 duration-200" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-black text-foreground group-hover/item:text-primary transition-colors truncate">
                                {product.name}
                              </h4>
                              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                {subCount} options
                              </span>
                            </div>

                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                              {product.description}
                            </p>

                            {previewNames && (
                              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                                {previewNames}
                              </p>
                            )}
                          </div>

                          {/* Drill-down arrow button */}
                          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700/60 group-hover/item:bg-primary group-hover/item:text-white flex items-center justify-center flex-shrink-0 transition-all duration-200">
                            <ChevronRight className="w-4 h-4 group-hover/item:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. DIRECT PRINT ACTION BANNER */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Have print-ready artwork?</p>
                      <p className="text-[11px] text-muted-foreground">Upload your PDF/CDR or submit custom specs</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleNavClick('/products')}
                    className="w-full sm:w-auto h-8 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm"
                  >
                    Start Order <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                {/* 3. SECONDARY NAVIGATION HUBS */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5 px-0.5">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    Platform Navigation
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {secondaryHubs.map((hub) => {
                      const Icon = hub.icon;
                      const isActive = pathname === hub.href;
                      return (
                        <button
                          key={hub.href}
                          type="button"
                          onClick={() => handleNavClick(hub.href)}
                          className={cn(
                            'p-2.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-2.5',
                            isActive
                              ? 'bg-primary/10 border-primary/40'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{hub.label}</p>
                            <p className="text-[9px] text-muted-foreground truncate">{hub.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. PARTNER & CREATOR PORTALS */}
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Partner & Creator Ecosystem
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleNavClick('/printer-registration')}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-700/40 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                    >
                      <Printer className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold truncate">Printer Network</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('/freelancer/verifications')}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-700/40 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                    >
                      <PenTool className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold truncate">Freelance Designers</span>
                    </button>
                  </div>
                </div>

                {/* 5. USER WORKSPACE & AUTH STATUS */}
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                  {loading ? (
                    <div className="py-1 text-center text-xs text-muted-foreground">Checking authentication...</div>
                  ) : session ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs flex-shrink-0">
                          {session.name ? session.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{session.name || 'Account'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{session.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleNavClick(getDashboardUrl(session.role))}
                          className="h-7.5 px-3 text-xs font-bold rounded-xl"
                        >
                          <LayoutGrid className="w-3 h-3 mr-1" /> Workspace
                        </Button>
                        <LogoutButton />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-foreground">Sign In</p>
                        <p className="text-[10px] text-muted-foreground">Access saved orders & drafts</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavClick('/login')}
                          className="h-7.5 px-3 text-xs font-bold rounded-xl"
                        >
                          <LogIn className="w-3 h-3 mr-1" /> Login
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleNavClick('/register')}
                          className="h-7.5 px-3 text-xs font-bold rounded-xl shadow-xs"
                        >
                          <UserPlus className="w-3 h-3 mr-1" /> Register
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM SUPPORT BAR */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <a
                href="tel:+916001234567"
                className="flex items-center gap-1.5 hover:text-primary transition-colors text-[11px]"
              >
                <Phone className="w-3 h-3 text-primary" />
                <span className="font-semibold">+1600-123 456</span>
              </a>
              <a
                href="mailto:support@amazoprint.in"
                className="flex items-center gap-1.5 hover:text-primary transition-colors text-[11px]"
              >
                <Mail className="w-3 h-3 text-primary" />
                <span className="font-semibold">support@amazoprint.in</span>
              </a>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 100% Quality
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" /> Fast Dispatch
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
