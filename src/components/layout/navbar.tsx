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

  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          FIXED HEADER
      ════════════════════════════════════════════════════════════ */}
      <header
        className={cn(
          'fixed top-0 w-full z-50 transition-all duration-300',
          scrolled && 'shadow-2xl shadow-[#1a1a4e]/30'
        )}
      >
        <NoticeSlider />
        {/* ── TOP ROW ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#1a1a4e] via-[#282860] to-[#1a1a4e] border-b border-white/10 relative z-20">
          <div className="w-full px-3 sm:px-4 lg:px-6 h-[72px] sm:h-[80px] flex items-center gap-3 lg:gap-4 xl:gap-5 py-2">

            {/* ── Three-Line Bar Option Handle at Corner ── */}
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

            {/* Search */}
            <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-xs lg:max-w-md xl:max-w-lg min-w-0 relative">
              <form onSubmit={handleSearchSubmit}>
                <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 focus-within:border-white/50 focus-within:bg-white/15 transition-all">
                  <Search className="w-4 h-4 text-white/70 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search cards, flyers, stickers, gifts..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/50 outline-none font-medium min-w-0"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-white/50 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                          Suggestions
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
                              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#464674]/5 transition-colors group"
                            >
                              <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                                {img ? (
                                  <NextImage src={img} alt={item.name} fill className="object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 group-hover:text-[#464674] truncate transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium truncate">
                                  {item.category}
                                </p>
                              </div>
                              {item.price && (
                                <span className="text-[11px] font-black text-[#464674]">
                                  ₹{Number(item.price).toFixed(0)}
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#464674] transition-colors flex-shrink-0" />
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
                        className="w-full py-2 px-3 text-left text-xs font-bold text-[#464674] hover:bg-[#464674]/5 rounded-xl transition-colors flex items-center justify-between"
                      >
                        <span>Search all for &quot;{searchQuery}&quot;</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Contact — on wide screens */}
            <div className="hidden 2xl:flex items-center gap-5 flex-shrink-0">
              <a href="tel:+916001234567" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors border border-white/15">
                  <Phone className="w-3.5 h-3.5 text-white/80" />
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-tight">+1600-123 456 789</p>
                  <p className="text-[10px] text-white/50 font-medium">24/7 Support</p>
                </div>
              </a>
              <a href="mailto:support@amazoprint.in" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors border border-white/15">
                  <Mail className="w-3.5 h-3.5 text-white/80" />
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-tight">support@amazoprint.in</p>
                  <p className="text-[10px] text-white/50 font-medium">Contact Email</p>
                </div>
              </a>
            </div>

            {/* Right action icons */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto flex-shrink-0">
              {/* Account */}
              {loading ? (
                <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
              ) : session ? (
                <Link
                  href={dashboardUrl}
                  title="My Workspace"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
                >
                  <User className="w-4 h-4 text-white" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  title="Login"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
                >
                  <LogIn className="w-4 h-4 text-white" />
                </Link>
              )}

              {/* Wishlist */}
              <button
                type="button"
                className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 text-rose-300" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">0</span>
              </button>

              {/* Cart */}
              <CartSheet />

              {/* Auth buttons */}
              {!loading && !session && (
                <div className="hidden sm:flex items-center gap-1.5 ml-1 pl-1.5 border-l border-white/15">
                  <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-white/80 hover:text-white hover:bg-white/10 h-8.5 px-3">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-[#464674] border-none h-8.5 px-3.5 shadow-md shadow-black/20">
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Three-Line Menu Button */}
              <div className="lg:hidden ml-1">
                <MainMenuDrawer
                  theme="dark"
                  showLabel={false}
                />
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* ── HEIGHT SPACER — matches single topbar height ─────────────── */}
      <div className="h-[72px] sm:h-[80px]" aria-hidden="true" />

    </>
  );
}
