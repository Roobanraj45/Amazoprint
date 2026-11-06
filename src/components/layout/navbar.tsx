'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Search,
  Phone,
  Mail,
  Heart,
  User,
  LayoutGrid,
  Printer,
  Flame,
  Gift,
  Home,
  FileText,
  Package,
  Star,
  Sparkles,
  LogIn,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AmazoprintLogo } from '@/components/ui/logo';
import { getSession } from '@/app/actions/user-actions';
import { LogoutButton } from '@/components/layout/logout-button';
import { Skeleton } from '@/components/ui/skeleton';
import { CartSheet } from '@/components/cart/cart-sheet';
import { NoticeSlider } from '@/components/layout/notice-slider';
import { cn, resolveImagePath } from '@/lib/utils';
import { getProducts } from '@/app/actions/product-actions';
import { MainMenuDrawer } from '@/components/layout/main-menu-drawer';
import NextImage from 'next/image';

type Session = Awaited<ReturnType<typeof getSession>>;



// ─────────────────────────────────────────────────────────────────────────────
// MAIN NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Visiting Cards', slug: 'visiting-cards', subProducts: [] },
  { id: 'p2', name: 'Letterheads', slug: 'letterhead', subProducts: [] },
  { id: 'p3', name: 'Flyers', slug: 'flyers', subProducts: [] },
  { id: 'p4', name: 'Invitations', slug: 'invitations', subProducts: [] },
  { id: 'p5', name: 'Stickers', slug: 'stickers', subProducts: [] },
  { id: 'p6', name: 'Envelopes', slug: 'envelope', subProducts: [] },
  { id: 'p7', name: 'Posters', slug: 'posters', subProducts: [] },
  { id: 'p8', name: 'T-Shirts', slug: 't-shirt', subProducts: [] },
  { id: 'p9', name: 'Gifts', slug: 'gifts', subProducts: [] },
  { id: 'p10', name: 'ID Cards', slug: 'id-cards', subProducts: [] },
  { id: 'p11', name: 'Calendars', slug: 'calendar', subProducts: [] },
  { id: 'p12', name: 'Brochures', slug: 'brochure', subProducts: [] },
];

export function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [scrolled, setScrolled] = React.useState(false);
  const [productsData, setProductsData] = React.useState<any[]>([]);
  const [activeCatIdx, setActiveCatIdx] = React.useState(0);

  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  React.useEffect(() => {
    getSession().then((s) => { setSession(s); setLoading(false); });
    getProducts().then((data: any[]) => {
      if (Array.isArray(data) && data.length > 0) {
        setProductsData(data.filter((p) => p.isActive));
      }
    });

    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close search suggestions on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardUrl = (role?: string) => {
    switch (role) {
      case 'freelancer': return '/freelancer/dashboard';
      case 'admin': case 'super_admin': case 'company_admin': case 'designer': return '/admin/dashboard';
      case 'accounts': return '/accounts/dashboard';
      case 'printer': return '/printer/dashboard';
      default: return '/client/dashboard';
    }
  };

  const dashboardUrl = getDashboardUrl(session?.role);

  const enter = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 180);
  };
  const close = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
  };

  // Products to directly display in the bottom navbar bar
  const activeProductsList = productsData.length > 0 ? productsData : FALLBACK_PRODUCTS;

  // Compute live search suggestions
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: any[] = [];

    // Search active products
    const list = productsData.length > 0 ? productsData : FALLBACK_PRODUCTS;
    for (const product of list) {
      if (product.name?.toLowerCase().includes(q)) {
        results.push({
          type: 'category',
          id: `cat-${product.id || product.slug}`,
          name: product.name,
          category: 'Category',
          imageUrl: product.imageUrl,
          href: `/products?category=${encodeURIComponent(product.name)}`,
        });
      }

      if (Array.isArray(product.subProducts)) {
        for (const sp of product.subProducts) {
          if (sp.isActive && (sp.name?.toLowerCase().includes(q) || product.name?.toLowerCase().includes(q))) {
            results.push({
              type: 'product',
              id: `sp-${sp.id}`,
              name: sp.name,
              category: product.name,
              imageUrl: sp.imageUrl || product.imageUrl,
              price: sp.price,
              href: `/products?category=${encodeURIComponent(product.name)}&q=${encodeURIComponent(sp.name)}`,
            });
          }
        }
      }
    }
    return results.slice(0, 7);
  }, [searchQuery, productsData]);

  // Handle Search Submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setIsSearchFocused(false);
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
  };

  // Service Navigation Items
  const serviceNavItems = [
    {
      key: 'printers',
      label: 'Printers',
      href: '/printer-registration',
      icon: <Printer className="w-3.5 h-3.5" />,
      dropdown: [
        { label: 'Become a Partner', href: '/printer-registration', desc: 'Register your printing press', icon: <Printer className="w-3.5 h-3.5" /> },
        { label: 'Printer Dashboard', href: '/printer/dashboard', desc: 'Manage your print orders', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
        { label: 'Printer Login', href: '/printer-login', desc: 'Access your partner account', icon: <LogIn className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: 'designers',
      label: 'Designers',
      href: '/freelancer/verifications',
      icon: <Star className="w-3.5 h-3.5" />,
      dropdown: [
        { label: 'Join as Designer', href: '/freelancer/verifications', desc: 'Earn with print verification', icon: <PenTool className="w-3.5 h-3.5" /> },
        { label: 'Design Contests', href: '/contests', desc: 'Compete, submit entries & win prizes', icon: <Star className="w-3.5 h-3.5" /> },
        { label: 'Hire a Designer', href: '/freelancer/verifications', desc: 'Get professional design assistance', icon: <Sparkles className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: 'freelancers',
      label: 'Freelancers',
      href: '/freelancer/dashboard',
      icon: <PenTool className="w-3.5 h-3.5" />,
      dropdown: [
        { label: 'Freelancer Dashboard', href: '/freelancer/dashboard', desc: 'View design jobs & payouts', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
        { label: 'Print Verifications', href: '/freelancer/verifications', desc: 'Verify client print files', icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Active Quests', href: '/contests', desc: 'Browse available contest briefs', icon: <Star className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  const [isCatMenuOpen, setIsCatMenuOpen] = React.useState(false);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          FIXED AGISTA 3-TIER HEADER
      ════════════════════════════════════════════════════════════ */}
      <header
        className={cn(
          'fixed top-0 w-full z-50 transition-all duration-300',
          scrolled && 'shadow-xl shadow-[#061033]/25'
        )}
      >
        {/* ── TIER 1: TOP TRUST & ANNOUNCEMENT BAR (Agista Navy #061033) ── */}
        <div className="bg-[#061033] text-white/90 text-xs border-b border-white/10 hidden md:block">
          <div className="w-full px-4 lg:px-8 h-9 flex items-center justify-between">
            {/* Google Review Badge */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide">Google</span>
              <div className="flex items-center text-amber-400 text-xs">
                {'★★★★★'}
              </div>
              <span className="text-[11px] text-white/80 font-medium">
                <strong className="text-white font-bold">4.9/5</strong> Based on 1,200+ Reviews
              </span>
            </div>

            {/* Core Agista Value Props */}
            <div className="flex items-center gap-6 text-[11px] font-semibold text-white/80">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                25+ Years in Business
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Fast delivery Worldwide
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f07000]" />
                Price Beat Promise
              </span>
              <span className="text-white/30">•</span>
              <a href="tel:1800818808" className="hover:text-white transition-colors text-amber-300 font-bold">
                Hotline: 1800 818 808
              </a>
            </div>
          </div>
        </div>

        {/* ── TIER 2: MAIN BRAND HEADER (Midnight Navy #091642) ── */}
        <div className="bg-[#091642] border-b border-white/10 relative z-20">
          <div className="w-full px-4 lg:px-8 h-[74px] flex items-center gap-4 lg:gap-6 py-2">

            {/* Hamburger / Menu drawer */}
            <div className="relative flex-shrink-0">
              <MainMenuDrawer
                theme="dark"
                buttonLabel="Menu"
                showLabel={true}
              />
            </div>

            {/* Logo */}
            <Link href="/" prefetch={false} className="flex-shrink-0">
              <AmazoprintLogo variant="header" className="brightness-0 invert" />
            </Link>

            {/* Agista Signature Search Pill (Full Rounded White with Circular Orange Button) */}
            <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-lg lg:max-w-xl xl:max-w-2xl min-w-0 relative">
              <form onSubmit={handleSearchSubmit}>
                <div className="flex items-center bg-white rounded-full pl-4 pr-1.5 py-1.5 shadow-md shadow-black/10 transition-all focus-within:ring-2 focus-within:ring-[#f07000]/50">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search over 10,000 products, prints & templates..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none font-medium min-w-0"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors mr-1.5"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {/* Agista Orange Circular Button */}
                  <button
                    type="submit"
                    className="w-9 h-9 rounded-full bg-[#f07000] hover:bg-[#d96500] text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md shadow-[#f07000]/30"
                    aria-label="Submit search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Live Search Autocomplete Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/10 z-[9999] p-2"
                  >
                    {searchResults.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1">
                          Product Suggestions
                        </p>
                        {searchResults.map((item) => {
                          const img = resolveImagePath(item.imageUrl);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setIsSearchFocused(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#091642]/5 transition-colors group"
                            >
                              <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                                {img ? (
                                  <NextImage src={img} alt={item.name} fill className="object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 group-hover:text-[#091642] truncate transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium truncate">
                                  {item.category}
                                </p>
                              </div>
                              {item.price && (
                                <span className="text-[11px] font-black text-[#f07000]">
                                  ₹{Number(item.price).toFixed(0)}
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#091642] transition-colors flex-shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                          No exact matches found for &quot;{searchQuery}&quot;
                        </p>
                      </div>
                    )}

                    <div className="pt-2 mt-1 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit()}
                        className="w-full py-2 px-3 text-left text-xs font-bold text-[#091642] hover:bg-[#091642]/5 rounded-xl transition-colors flex items-center justify-between"
                      >
                        <span>Search all for &quot;{searchQuery}&quot;</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
              {/* Hotline Pill (Agista Style) */}
              <a
                href="tel:1800818808"
                className="hidden xl:flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-full pl-2 pr-5 py-1.5 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-white text-[#091642] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4 text-[#091642]" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">24/7 Hotline</p>
                  <p className="text-xs font-black text-white group-hover:text-[#f07000] transition-colors">+ 1800 818 808</p>
                </div>
              </a>

              {/* Account */}
              {loading ? (
                <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
              ) : session ? (
                <Link
                  href={dashboardUrl}
                  title="My Workspace"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors text-white"
                >
                  <User className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  title="Login"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors text-white"
                >
                  <LogIn className="w-4 h-4" />
                </Link>
              )}

              {/* Wishlist */}
              <Link
                href="/products"
                className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors hidden sm:flex text-white"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 text-rose-300" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f07000] text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                  0
                </span>
              </Link>

              {/* Cart */}
              <CartSheet />

              {/* Auth links on large screens */}
              {!loading && !session && (
                <div className="hidden lg:flex items-center gap-1.5 ml-1 pl-2 border-l border-white/15">
                  <Button asChild variant="ghost" size="sm" className="rounded-full font-bold text-xs text-white hover:text-white hover:bg-white/10 h-9 px-3">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-full font-bold text-xs bg-[#f07000] hover:bg-[#d96500] text-white border-none h-9 px-4 shadow-md shadow-[#f07000]/30">
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              <div className="lg:hidden ml-1">
                <MainMenuDrawer
                  theme="dark"
                  showLabel={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── TIER 3: BOTTOM NAVIGATION RIBBON (Agista Clean White) ── */}
        <div className="bg-white border-b border-gray-200 text-[#091642] hidden lg:block shadow-xs relative">
          <div className="w-full px-4 lg:px-8 flex items-center justify-between h-[52px]">
            {/* Left: Agista "Shop Product ▾" Mega-Menu Button */}
            <div className="flex items-center gap-6 h-full">
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setIsCatMenuOpen(true)}
                onMouseLeave={() => setIsCatMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsCatMenuOpen(!isCatMenuOpen)}
                  className="bg-[#091642] hover:bg-[#061033] text-white px-5 h-full font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer select-none"
                >
                  <div className="w-5 h-5 rounded-sm bg-white/10 flex items-center justify-center">
                    <LayoutGrid className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>Shop <strong className="text-[#f07000]">Product</strong></span>
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform text-white/80', isCatMenuOpen && 'rotate-180')} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isCatMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 w-72 bg-white rounded-b-2xl shadow-2xl border border-gray-200 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">All Categories</span>
                        <Link href="/products" className="text-[10px] font-bold text-[#f07000] hover:underline">View All →</Link>
                      </div>
                      <div className="py-1 max-h-[360px] overflow-y-auto">
                        {activeProductsList.slice(0, 10).map((prod) => (
                          <Link
                            key={prod.id}
                            href={`/products?category=${encodeURIComponent(prod.name)}`}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-[#091642]/5 text-xs font-bold text-gray-700 hover:text-[#091642] transition-colors"
                          >
                            <span>{prod.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Main Nav Links */}
              <nav className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#091642]">
                <Link
                  href="/"
                  className={cn(
                    'transition-colors flex items-center gap-1',
                    pathname === '/' ? 'text-[#f07000] font-black' : 'hover:text-[#f07000]'
                  )}
                >
                  <span>Home</span>
                  {pathname === '/' && <span className="w-1.5 h-1.5 rounded-full bg-[#f07000]" />}
                </Link>
                <Link href="/products" className="hover:text-[#f07000] transition-colors">
                  All Products
                </Link>
                <Link href="/products?type=direct" className="hover:text-[#f07000] transition-colors flex items-center gap-1">
                  <span>Direct Selling</span>
                  <span className="bg-[#f07000] text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">HOT</span>
                </Link>
                <Link href="/templates" className="hover:text-[#f07000] transition-colors">
                  Templates
                </Link>
                <Link href="/contests" className="hover:text-[#f07000] transition-colors">
                  Contests
                </Link>
                <Link href="/printer-registration" className="hover:text-[#f07000] transition-colors">
                  Printers
                </Link>
                <Link href="/freelancer/dashboard" className="hover:text-[#f07000] transition-colors">
                  Designers
                </Link>
                <Link href="/contact" className="hover:text-[#f07000] transition-colors">
                  Contact
                </Link>
              </nav>
            </div>

            {/* Right: Promotional Flash Badge */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600 hidden xl:inline-block">
                🎉 <strong className="text-[#091642]">Special Offer:</strong> Flat 20% OFF with code{' '}
                <span className="text-[#f07000] font-black">AMAZO20</span>
              </span>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200 text-xs font-semibold text-gray-500">
                <span>INR (₹)</span>
                <span>•</span>
                <span>ENG</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── HEIGHT SPACER (Matches Fixed Header Height) ── */}
      <div className="h-[74px] md:h-[110px] lg:h-[162px]" aria-hidden="true" />
    </>
  );
}

