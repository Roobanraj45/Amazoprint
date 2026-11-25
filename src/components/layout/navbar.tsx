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
        <div className="bg-[#091642] relative z-20 rounded-b-[1.75rem] lg:rounded-b-none shadow-md shadow-[#061033]/20">
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
              {/* My Quotes | Track Order Pill */}
              <div className="hidden xl:flex items-center rounded-full bg-gradient-to-r from-[#041d52] via-[#062463] to-[#03163f] border border-blue-400/50 shadow-[0_0_16px_rgba(37,99,235,0.28)] px-4 py-1.5 gap-3.5">
                <Link
                  href={session ? '/client/orders' : '/login?portal=client'}
                  className="flex items-center gap-2 text-xs font-semibold text-white hover:text-amber-300 transition-colors group"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 3.5h8.5L18.5 7.5V20.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5Z"
                      stroke="#fbbf24"
                      strokeWidth="1.6"
                      fill="#0a255c"
                    />
                    <path d="M14.5 3.5V7.5H18.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8.5 9.5c0-.9.6-1.5 1.4-1.5v1.6h-1.4Zm2.8 0c0-.9.6-1.5 1.4-1.5v1.6h-1.4Z" fill="#fbbf24" />
                    <path d="M8 13.5h8M8 16.5h6" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="whitespace-nowrap">My Quotes</span>
                </Link>

                <span className="w-px h-5 bg-blue-400/35" aria-hidden="true" />

                <Link
                  href={
                    session
                      ? session.role === 'printer'
                        ? '/printer/orders'
                        : session.role === 'freelancer'
                          ? '/freelancer/orders'
                          : '/client/orders'
                      : '/login?portal=client'
                  }
                  className="flex items-center gap-2 text-xs font-semibold text-white hover:text-amber-300 transition-colors group"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 8.5 11.5 4.5 19 8.5v7L11.5 19.5 4 15.5v-7Z"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      fill="#0a255c"
                    />
                    <path d="M4 8.5 11.5 12.5 19 8.5M11.5 12.5V19.5" stroke="#e2e8f0" strokeWidth="1.4" />
                    <path d="M8.5 6.1 16 10.1" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
                    <path
                      d="M17.5 12.2a2.7 2.7 0 0 0-2.7 2.7c0 2 2.7 5.1 2.7 5.1s2.7-3.1 2.7-5.1a2.7 2.7 0 0 0-2.7-2.7Z"
                      fill="#fbbf24"
                      stroke="#041d52"
                      strokeWidth="1"
                    />
                    <circle cx="17.5" cy="14.9" r="0.9" fill="#041d52" />
                  </svg>
                  <span className="whitespace-nowrap">Track Order</span>
                </Link>
              </div>

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

        {/* ── TIER 3: ROUNDED FLOATING NAVIGATION RIBBON ── */}
        <div className="hidden lg:block bg-gradient-to-b from-[#091642] via-[#091642]/80 to-transparent pb-2 px-4 lg:px-8">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 text-[#091642] rounded-full shadow-lg shadow-[#091642]/10 px-3 flex items-center justify-between h-[52px]">
            {/* Left: Rounded "Shop Product ▾" Pill Button */}
            <div className="flex items-center gap-2 xl:gap-3 h-full min-w-0">
              <div
                className="relative flex items-center flex-shrink-0"
                onMouseEnter={() => setIsCatMenuOpen(true)}
                onMouseLeave={() => setIsCatMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsCatMenuOpen(!isCatMenuOpen)}
                  className="bg-[#091642] hover:bg-[#061033] text-white px-4 xl:px-5 h-9 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer select-none shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                    <LayoutGrid className="w-3 h-3 text-white" />
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
                      className="absolute top-full left-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200/80 py-3 z-50 overflow-hidden"
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
                            className="flex items-center justify-between mx-2 px-3 py-2 rounded-2xl hover:bg-[#091642]/5 text-xs font-bold text-gray-700 hover:text-[#091642] transition-colors"
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
              <nav className="flex items-center gap-1 xl:gap-1.5 2xl:gap-2 text-[11px] xl:text-xs font-bold uppercase tracking-wider text-[#091642] whitespace-nowrap">
                <Link
                  href="/"
                  className={cn(
                    'transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                    pathname === '/' ? 'bg-orange-50 text-[#f07000] font-black' : 'hover:bg-slate-100 hover:text-[#f07000]'
                  )}
                >
                  <span>Home</span>
                  {pathname === '/' && <span className="w-1.5 h-1.5 rounded-full bg-[#f07000]" />}
                </Link>
                <Link href="/products" className="hover:bg-slate-100 hover:text-[#f07000] transition-all px-3 py-1.5 rounded-full">
                  All Products
                </Link>
                <Link href="/products?type=direct" className="hover:bg-slate-100 hover:text-[#f07000] transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                  <span>Direct Selling</span>
                  <span className="bg-[#f07000] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black leading-none">HOT</span>
                </Link>
                <Link href="/templates" className="hover:bg-slate-100 hover:text-[#f07000] transition-all px-3 py-1.5 rounded-full">
                  Templates
                </Link>
                <Link href="/contests" className="hover:bg-slate-100 hover:text-[#f07000] transition-all px-3 py-1.5 rounded-full">
                  Contests
                </Link>
                <Link href="/printer-registration" className="hover:bg-slate-100 hover:text-[#f07000] transition-all px-3 py-1.5 rounded-full">
                  Printers
                </Link>
                <Link href="/freelancer-registration" className="hover:bg-slate-100 hover:text-[#f07000] transition-all px-3 py-1.5 rounded-full">
                  Designers
                </Link>
                <Link href="/contact" className="hover:bg-slate-100 hover:text-[#f07000] transition-all px-3 py-1.5 rounded-full">
                  Contact
                </Link>
              </nav>
            </div>

            {/* Right: Promotional Flash Badge */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-auto pl-2">
              <div className="hidden xl:flex items-center gap-1.5 bg-orange-50/90 border border-orange-200/80 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-gray-700 shadow-2xs whitespace-nowrap">
                <span>🎉</span>
                <span className="text-[#091642] font-bold">20% OFF:</span>
                <span className="text-[#f07000] font-black tracking-wide">AMAZO20</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── HEIGHT SPACER (Matches Fixed Header Height) ── */}
      <div className="h-[74px] md:h-[110px] lg:h-[170px]" aria-hidden="true" />
    </>
  );
}

