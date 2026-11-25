'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { AmazoprintLogo } from '@/components/ui/logo';
import { getSession } from '@/app/actions/user-actions';
import { getProducts } from '@/app/actions/product-actions';
import { LogoutButton } from './logout-button';
import { Button } from '@/components/ui/button';
import { cn, resolveImagePath } from '@/lib/utils';
import {
  Menu,
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
  ChevronRight,
  ChevronDown,
  User,
  LogIn,
  UserPlus,
  CreditCard,
  Layers,
  FileText,
  Tag,
  Gift,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import NextImage from 'next/image';

type Session = Awaited<ReturnType<typeof getSession>>;

// Clean, comprehensive product catalog with sub-products
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Visiting Cards',
    slug: 'visiting-cards',
    icon: CreditCard,
    subProducts: [
      { id: 101, name: 'Standard Visiting Cards', spec: '89×51 mm • 350 GSM Matte/Gloss', price: '₹199' },
      { id: 102, name: 'Premium Velvet Touch', spec: '89×51 mm • Soft-touch lamination', price: '₹349' },
      { id: 103, name: 'Raised Spot UV Cards', spec: '89×51 mm • Glossy 3D UV textures', price: '₹499' },
      { id: 104, name: 'Metallic Foil Cards', spec: '89×51 mm • Gold/Silver embossed foil', price: '₹599' },
    ],
  },
  {
    id: 2,
    name: 'Flyers & Leaflets',
    slug: 'flyers',
    icon: Layers,
    subProducts: [
      { id: 201, name: 'A5 Single Sided Flyers', spec: '148×210 mm • 130 GSM Gloss', price: '₹299' },
      { id: 202, name: 'A5 Double Sided Flyers', spec: '148×210 mm • 170 GSM Premium', price: '₹449' },
      { id: 203, name: 'A4 Tri-Fold Pamphlets', spec: '210×297 mm • 3-Panel folded', price: '₹699' },
      { id: 204, name: 'Square Promo Handouts', spec: '120×120 mm • Square cut', price: '₹249' },
    ],
  },
  {
    id: 3,
    name: 'Packaging & Custom Boxes',
    slug: 'packaging',
    icon: Package,
    subProducts: [
      { id: 301, name: 'Corrugated Shipping Mailers', spec: 'E-flute sturdy mailer box', price: '₹499' },
      { id: 302, name: 'Rigid Luxury Magnetic Boxes', spec: 'Premium presentation gift box', price: '₹799' },
      { id: 303, name: 'Stand-up Barrier Pouches', spec: 'Food-grade zipper pouch', price: '₹399' },
      { id: 304, name: 'Product Tuck Cartons', spec: 'Retail folding cartons', price: '₹349' },
    ],
  },
  {
    id: 4,
    name: 'Stickers & Labels',
    slug: 'stickers',
    icon: Tag,
    subProducts: [
      { id: 401, name: 'Die-Cut Vinyl Stickers', spec: 'Waterproof outdoor vinyl', price: '₹149' },
      { id: 402, name: 'Product Roll Labels', spec: 'Self-adhesive packaging roll', price: '₹299' },
      { id: 403, name: 'Holographic Stickers', spec: 'Metallic reflective prism', price: '₹249' },
      { id: 404, name: 'Transparent Clear Labels', spec: 'Clear film packaging seals', price: '₹199' },
    ],
  },
  {
    id: 5,
    name: 'Letterheads & Stationery',
    slug: 'letterhead',
    icon: FileText,
    subProducts: [
      { id: 501, name: 'Executive Bond Letterheads', spec: 'A4 • 100 GSM Bond watermark', price: '₹399' },
      { id: 502, name: 'Official Envelopes', spec: 'Peel & seal corporate envelopes', price: '₹349' },
      { id: 503, name: 'Custom Spiral Notepads', spec: '50-Sheet branded memo pads', price: '₹199' },
    ],
  },
  {
    id: 6,
    name: 'Posters & Banners',
    slug: 'posters',
    icon: Sparkles,
    subProducts: [
      { id: 601, name: 'Ultra-HD Glossy Posters', spec: 'A3/A2 • 250 GSM Photo paper', price: '₹199' },
      { id: 602, name: 'Roll-Up Standee Banners', spec: '6×2.5 Ft Aluminum pull-up', price: '₹999' },
      { id: 603, name: 'Heavy Duty Vinyl Banners', spec: 'Weatherproof with brass eyelets', price: '₹499' },
    ],
  },
  {
    id: 7,
    name: 'Corporate Apparel & T-Shirts',
    slug: 't-shirt',
    icon: Gift,
    subProducts: [
      { id: 701, name: 'Cotton Bio-Wash Round Neck', spec: '180 GSM Screen / DTG print', price: '₹399' },
      { id: 702, name: 'Embroidered Polo Shirts', spec: '240 GSM heavy knit collar', price: '₹599' },
      { id: 703, name: 'Custom Ceramic Mugs', spec: '330ml Full wrap sublimation', price: '₹149' },
    ],
  },
  {
    id: 8,
    name: 'ID Cards & Lanyards',
    slug: 'id-cards',
    icon: User,
    subProducts: [
      { id: 801, name: 'PVC Smart Photo ID Cards', spec: 'Standard CR80 plastic card', price: '₹99' },
      { id: 802, name: 'Satin Printed Lanyards', spec: '20mm Ribbon with metal clip', price: '₹49' },
      { id: 803, name: 'RFID Proximity Cards', spec: 'Smart chip access badge', price: '₹149' },
    ],
  },
  {
    id: 9,
    name: 'Brochures & Catalogs',
    slug: 'brochures',
    icon: Layers,
    subProducts: [
      { id: 901, name: 'Bi-Fold Showcase Brochures', spec: '4-Page laminated cover', price: '₹499' },
      { id: 902, name: 'Multi-Page Booklet Catalogs', spec: 'Center stapled booklet', price: '₹899' },
      { id: 903, name: 'Presentation Pocket Folders', spec: 'Card pocket presentation folder', price: '₹599' },
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

  // Expanded product ID for accordion
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

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

  const handleNavClick = (href: string) => {
    setOpen(false);
    router.push(href);
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

  // Combine live data with default specs
  const allProducts = React.useMemo(() => {
    if (products.length === 0) return DEFAULT_PRODUCTS;

    return products.map((p, index) => {
      const match = DEFAULT_PRODUCTS.find(
        (d) => d.name.toLowerCase() === p.name.toLowerCase() || d.slug === p.slug
      );

      const liveSubs = Array.isArray(p.subProducts)
        ? p.subProducts
            .filter((sp: any) => sp.isActive)
            .map((sp: any) => ({
              id: sp.id,
              name: sp.name,
              spec: `${sp.width && sp.height ? `${sp.width}×${sp.height} ${sp.unitType || 'mm'}` : 'Custom dimensions'}`,
              price: sp.price ? `₹${Number(sp.price).toFixed(0)}` : '',
              imageUrl: sp.imageUrl,
            }))
        : [];

      return {
        id: p.id || index + 1,
        name: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl,
        icon: match?.icon || Package,
        subProducts: liveSubs.length > 0 ? liveSubs : (match?.subProducts || []),
      };
    });
  }, [products]);

  // Filtered by search
  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allProducts;

    return allProducts.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const subMatch = p.subProducts?.some((sp: any) => sp.name?.toLowerCase().includes(q));
      return nameMatch || subMatch;
    });
  }, [searchQuery, allProducts]);

  const toggleProductAccordion = (id: number) => {
    setExpandedProductId((prev) => (prev === id ? null : id));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* ── ROUNDED MENU TRIGGER BUTTON ── */}
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Toggle menu"
          className={cn(
            'group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 cursor-pointer',
            theme === 'dark'
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200/90 text-slate-800 border border-slate-200'
              : 'bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-foreground border border-slate-200/80 dark:border-slate-700 shadow-xs',
            className
          )}
        >
          <Menu className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-105" strokeWidth={2.4} />

          {showLabel && (
            <span className="text-xs font-bold tracking-tight">
              {buttonLabel}
            </span>
          )}
        </button>
      </SheetTrigger>

      {/* ── CURVED PREMIUM SLIDE-OUT MENU DRAWER ── */}
      <SheetContent
        side="left"
        className={cn(
          'p-0 flex flex-col h-full overflow-hidden rounded-r-[2.25rem]',
          'w-[92vw] sm:max-w-md',
          'bg-gradient-to-b from-slate-50 via-white to-purple-50/40 dark:bg-slate-900 border-r border-purple-100/80 dark:border-slate-800 shadow-2xl'
        )}
      >
        {/* Curved Dark Navy Header with Search Pill */}
        <div className="relative bg-gradient-to-br from-[#061033] via-[#091642] to-[#1e1b4b] px-5 pt-5 pb-6 rounded-b-[2rem] shadow-lg flex-shrink-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#f07000]/20 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="hover:opacity-90 transition-opacity"
            >
              <AmazoprintLogo variant="sidebar" className="brightness-0 invert" />
            </Link>

            <SheetClose asChild>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </SheetClose>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative z-10">
            <div className="flex items-center gap-2 bg-white rounded-full pl-4 pr-1.5 py-1.5 text-xs shadow-md focus-within:ring-2 focus-within:ring-[#f07000]/60 transition-all">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, prints & templates..."
                className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="w-7 h-7 rounded-full bg-[#f07000] hover:bg-[#d96500] text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
                aria-label="Search"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* SECTION 1: QUICK NAVIGATION PILLS (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Home', href: '/', icon: Home, accent: 'bg-blue-50 text-blue-600' },
              { label: 'All Products', href: '/products', icon: Package, accent: 'bg-orange-50 text-[#f07000]' },
              { label: 'Templates', href: '/templates', icon: Sparkles, accent: 'bg-purple-50 text-purple-600' },
              { label: 'Design Quests', href: '/contests', icon: Trophy, accent: 'bg-amber-50 text-amber-600' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all',
                    isActive
                      ? 'bg-[#091642] text-white border-[#091642] shadow-md shadow-[#091642]/15'
                      : 'bg-white border-slate-200/80 text-slate-800 hover:border-purple-200 hover:shadow-sm'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isActive ? 'bg-white/15 text-white' : item.accent)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* SECTION 2: PRODUCTS & SUB-PRODUCTS ACCORDION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Print Categories
              </span>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold text-[#f07000] hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-2">
              {filteredProducts.map((product) => {
                const Icon = product.icon || Package;
                const isExpanded = expandedProductId === product.id;
                const subCount = product.subProducts?.length || 0;

                return (
                  <div
                    key={product.id || product.slug}
                    className={cn(
                      'rounded-3xl border transition-all overflow-hidden bg-white',
                      isExpanded
                        ? 'border-purple-200 shadow-md shadow-purple-900/5'
                        : 'border-slate-200/70 hover:border-purple-200/80'
                    )}
                  >
                    {/* Category Header Row */}
                    <button
                      type="button"
                      onClick={() => toggleProductAccordion(product.id)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-colors text-slate-800"
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span className={cn(
                          'w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 transition-colors',
                          isExpanded ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                        )}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="truncate">{product.name}</span>
                      </span>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
                          {subCount}
                        </span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-slate-400 transition-transform duration-200',
                            isExpanded && 'rotate-180 text-purple-600'
                          )}
                        />
                      </div>
                    </button>

                    {/* Sub-Products Drill-Down List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1 space-y-1.5">
                            {product.subProducts?.map((sub: any) => {
                              const targetUrl = product.slug
                                ? `/products?category=${encodeURIComponent(product.name)}&q=${encodeURIComponent(sub.name)}`
                                : `/products?category=${encodeURIComponent(product.name)}`;

                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => handleNavClick(targetUrl)}
                                  className="w-full text-left py-2 px-3 rounded-2xl text-xs bg-slate-50/80 hover:bg-purple-50 hover:text-purple-800 transition-colors flex items-center justify-between group"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="font-semibold text-slate-800 group-hover:text-purple-800 transition-colors truncate">
                                      {sub.name}
                                    </p>
                                    {sub.spec && (
                                      <p className="text-[10px] text-slate-500 truncate">
                                        {sub.spec}
                                      </p>
                                    )}
                                  </div>

                                  {sub.price && (
                                    <span className="text-[11px] font-black text-[#f07000] bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                      {sub.price}
                                    </span>
                                  )}
                                </button>
                              );
                            })}

                            <Link
                              href={`/products?category=${encodeURIComponent(product.name)}`}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1 px-3 pt-1 text-[11px] font-bold text-purple-700 hover:underline"
                            >
                              Browse all {product.name} <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: PARTNER & CREATOR PORTALS */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 block">
              Partners &amp; Services
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleNavClick('/printer-registration')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/70 hover:border-purple-200 text-xs font-semibold text-slate-800 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Printer className="w-4 h-4" />
                  </span>
                  Printers Portal
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/freelancer-registration')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/70 hover:border-purple-200 text-xs font-semibold text-slate-800 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </span>
                  Designers &amp; Freelancers
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* SECTION 4: USER WORKSPACE / AUTH */}
          <div>
            {loading ? (
              <div className="py-2 text-center text-xs text-muted-foreground">Loading...</div>
            ) : session ? (
              <div className="flex items-center justify-between p-3 rounded-3xl bg-white border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {session.name ? session.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{session.name || 'Account'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{session.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNavClick(getDashboardUrl(session.role))}
                    className="h-8 px-3 text-xs font-bold rounded-full border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Workspace
                  </Button>
                  <LogoutButton />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavClick('/login')}
                  className="flex-1 h-10 text-xs font-bold rounded-full border-slate-200 bg-white hover:bg-slate-50"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" /> Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNavClick('/register')}
                  className="flex-1 h-10 text-xs font-bold rounded-full bg-gradient-to-r from-[#f07000] to-orange-600 hover:from-[#d96500] hover:to-orange-700 text-white border-0 shadow-md shadow-orange-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Register
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Support & Helpline Footer Pill */}
        <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-slate-100 flex-shrink-0">
          <div className="rounded-full bg-[#091642] text-white px-4 py-2 text-[11px] flex items-center justify-between shadow-sm">
            <a
              href="tel:1800818808"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-semibold"
            >
              <Phone className="w-3.5 h-3.5 text-[#f07000]" />
              <span>1800 818 808</span>
            </a>
            <a
              href="mailto:support@amazoprint.in"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-semibold"
            >
              <Mail className="w-3.5 h-3.5 text-[#f07000]" />
              <span>support@amazoprint.in</span>
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
