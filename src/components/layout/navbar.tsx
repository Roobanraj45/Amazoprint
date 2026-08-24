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
import NextImage from 'next/image';

type Session = Awaited<ReturnType<typeof getSession>>;

// ─────────────────────────────────────────────────────────────────────────────
// MEGA-MENU DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function ProductsMegaMenu({
  productsData,
  activeIdx,
  setActiveIdx,
  onClose,
  align = 'left',
}: {
  productsData: any[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onClose: () => void;
  align?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="absolute top-full pt-2 z-[999]"
      style={{ left: 0, minWidth: 720 }}
    >
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
        <div className="flex" style={{ minHeight: 380 }}>
          {/* ── LEFT: Category list ── */}
          <div className="w-56 bg-gray-50 border-r border-gray-100 py-3 flex-shrink-0 overflow-y-auto" style={{ maxHeight: 440 }}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 pb-2 pt-1">Categories</p>
            {productsData.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-400 font-medium">Loading categories…</p>
              </div>
            ) : (
              productsData.map((product, idx) => {
                const active = activeIdx === idx;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => setActiveIdx(idx)}
                    className={cn(
                      'w-full text-left flex items-center justify-between px-4 py-2.5 transition-colors group/cat',
                      active
                        ? 'bg-[#464674] text-white'
                        : 'hover:bg-[#464674]/10 text-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                        active ? 'bg-white/20' : 'bg-white group-hover/cat:bg-[#464674]/10'
                      )}>
                        <LayoutGrid className={cn('w-3.5 h-3.5', active ? 'text-white' : 'text-[#464674]')} />
                      </div>
                      <span className={cn('text-xs font-bold leading-tight truncate', active ? 'text-white' : 'text-gray-700')}>
                        {product.name}
                      </span>
                    </div>
                    <ChevronRight className={cn('w-3 h-3 flex-shrink-0 ml-1', active ? 'text-white/60' : 'text-gray-300')} />
                  </button>
                );
              })
            )}
          </div>

          {/* ── RIGHT: Sub-products grid ── */}
          <div className="flex-1 p-5 overflow-y-auto" style={{ maxHeight: 440 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.14 }}
                className="h-full flex flex-col"
              >
                {productsData[activeIdx] ? (
                  <>
                    {/* Sub-header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-black text-gray-900">{productsData[activeIdx].name}</h4>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {productsData[activeIdx].subProducts?.filter((sp: any) => sp.isActive).length || 0} options available
                        </p>
                      </div>
                      <Link
                        href={`/products?category=${encodeURIComponent(productsData[activeIdx].name)}`}
                        onClick={onClose}
                        className="text-xs font-bold text-[#464674] hover:text-[#5c5c96] flex items-center gap-1 whitespace-nowrap"
                      >
                        View all <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Grid */}
                    {(productsData[activeIdx].subProducts?.filter((sp: any) => sp.isActive).length || 0) > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {productsData[activeIdx].subProducts
                          .filter((sp: any) => sp.isActive)
                          .slice(0, 9)
                          .map((sp: any) => {
                            const imgUrl = resolveImagePath(sp.imageUrl || sp.parentProductImageUrl);
                            return (
                              <Link
                                key={sp.id}
                                href={`/products?category=${encodeURIComponent(productsData[activeIdx].name)}&q=${encodeURIComponent(sp.name)}`}
                                onClick={onClose}
                                className="group/sub flex flex-col gap-1.5 p-2.5 rounded-xl border border-transparent hover:border-[#464674]/20 hover:bg-[#464674]/5 transition-all"
                              >
                                {/* Thumbnail */}
                                <div className="w-full aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                                  {imgUrl ? (
                                    <NextImage
                                      src={imgUrl}
                                      alt={sp.name}
                                      fill
                                      className="object-cover group-hover/sub:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-4 h-4 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                {/* Label */}
                                <p className="text-[11px] font-bold text-gray-700 group-hover/sub:text-[#464674] transition-colors leading-tight line-clamp-2">
                                  {sp.name}
                                </p>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {sp.width}×{sp.height}{sp.unitType}
                                  </span>
                                  {sp.spotUvAllowed && (
                                    <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">UV</span>
                                  )}
                                  {sp.price && (
                                    <span className="text-[9px] font-black text-[#464674]">₹{Number(sp.price).toFixed(0)}</span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-40">
                        <Package className="w-10 h-10 text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-400">No products added yet</p>
                      </div>
                    )}
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-[#1a1a4e] to-[#464674] px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">
              Premium quality • Fast delivery • 98% customer satisfaction
            </span>
          </div>
          <Link
            href="/products"
            onClick={onClose}
            className="text-[11px] font-black text-white flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap ml-4"
          >
            Browse All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE PRODUCT DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function SingleProductDropdown({
  product,
  onClose,
  align = 'left',
}: {
  product: any;
  onClose: () => void;
  align?: 'left' | 'right';
}) {
  const activeSubProducts = product.subProducts?.filter((sp: any) => sp.isActive) || [];

  const defaultOptions = [
    { id: 'opt-std', name: `Standard ${product.name}`, width: 'Standard', height: 'Size', price: '199' },
    { id: 'opt-prem', name: `Premium ${product.name}`, width: 'High GSM', height: 'Finish', price: '349' },
    { id: 'opt-matte', name: `Matte / Gloss ${product.name}`, width: 'Laminated', height: 'Quality', price: '499' },
    { id: 'opt-custom', name: `Custom ${product.name}`, width: 'Multi', height: 'Custom', price: '299' },
  ];

  const displayList = activeSubProducts.length > 0 ? activeSubProducts : defaultOptions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      className={cn(
        'absolute top-full pt-1.5 z-[9999]',
        align === 'right' ? 'right-0' : 'left-0'
      )}
      style={{ width: displayList.length > 2 ? 440 : 280 }}
    >
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/10 p-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2.5 px-1">
          <div>
            <h4 className="text-xs font-black text-gray-900">{product.name}</h4>
            <p className="text-[10px] text-gray-400 font-medium">
              {displayList.length} options available
            </p>
          </div>
          <Link
            href={`/products?category=${encodeURIComponent(product.name)}`}
            onClick={onClose}
            className="text-[11px] font-bold text-[#464674] hover:text-[#5c5c96] flex items-center gap-1 whitespace-nowrap"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className={cn(
          'grid gap-1.5',
          displayList.length > 2 ? 'grid-cols-2' : 'grid-cols-1'
        )}>
          {displayList.slice(0, 6).map((sp: any) => {
            const imgUrl = resolveImagePath(sp.imageUrl || product.imageUrl);
            const targetUrl = String(sp.id || '').startsWith('opt-')
              ? `/products?category=${encodeURIComponent(product.name)}`
              : `/products?category=${encodeURIComponent(product.name)}&q=${encodeURIComponent(sp.name)}`;

            return (
              <Link
                key={sp.id}
                href={targetUrl}
                onClick={onClose}
                className="group/sub flex items-center gap-2.5 p-2 rounded-xl border border-transparent hover:border-[#464674]/20 hover:bg-[#464674]/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                  {imgUrl ? (
                    <NextImage
                      src={imgUrl}
                      alt={sp.name}
                      fill
                      className="object-cover group-hover/sub:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#464674]/5">
                      <Package className="w-4 h-4 text-[#464674]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-gray-800 group-hover/sub:text-[#464674] transition-colors truncate">
                    {sp.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {sp.width && (
                      <span className="text-[8px] font-semibold text-gray-400 bg-gray-100 px-1 py-0.2 rounded whitespace-nowrap">
                        {sp.width}{sp.height ? `×${sp.height}` : ''}
                      </span>
                    )}
                    {sp.price && (
                      <span className="text-[9px] font-black text-[#464674]">
                        ₹{Number(sp.price).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-300 group-hover/sub:text-[#464674] flex-shrink-0" />
              </Link>
            );
          })}
        </div>

        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between px-1">
          <Link
            href={`/products?category=${encodeURIComponent(product.name)}`}
            onClick={onClose}
            className="w-full py-1.5 text-center text-[11px] font-bold text-white bg-[#464674] hover:bg-[#5c5c96] rounded-xl transition-colors flex items-center justify-center gap-1"
          >
            Browse {product.name} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMPLE DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function SimpleDropdown({
  items,
  onClose,
  align = 'left',
}: {
  items: { label: string; href: string; desc?: string; icon?: React.ReactNode }[];
  onClose: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.14 }}
      className={cn(
        'absolute top-full pt-1.5 z-[9999] min-w-[230px]',
        align === 'right' ? 'right-0' : 'left-0'
      )}
    >
      <div className="bg-white border border-[#464674]/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/10 py-1.5">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            onClick={onClose}
            className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#464674]/5 transition-colors group"
          >
            {item.icon && (
              <div className="w-7 h-7 rounded-lg bg-[#464674]/8 group-hover:bg-[#464674]/15 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                <span className="text-[#464674]">{item.icon}</span>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-800 group-hover:text-[#464674] transition-colors">{item.label}</p>
              {item.desc && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{item.desc}</p>}
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

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

  // Products to directly display in the bottom navbar bar — fills full width
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
          <div className="w-full px-3 sm:px-4 lg:px-6 h-[76px] sm:h-[84px] flex items-center gap-3 lg:gap-5 py-2">

            {/* Logo */}
            <Link href="/" prefetch={false} className="flex-shrink-0">
              <AmazoprintLogo variant="header" className="brightness-0 invert" />
            </Link>

            {/* ── "Categories" button — uses key 'categories-btn' ── */}
            <div
              className="relative flex-shrink-0 hidden md:block"
              onMouseEnter={() => enter('categories-btn')}
              onMouseLeave={leave}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-all',
                  openMenu === 'categories-btn' && 'bg-white/20 border-white/30'
                )}
              >
                <div className="grid grid-cols-2 gap-px w-3 h-3 flex-shrink-0">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-white rounded-[1px]" />
                  ))}
                </div>
                Categories
                <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', openMenu === 'categories-btn' && 'rotate-180')} />
              </button>

              {/* Mega-menu — keyed 'categories-btn' */}
              <AnimatePresence>
                {openMenu === 'categories-btn' && (
                  <div onMouseEnter={() => enter('categories-btn')} onMouseLeave={leave}>
                    <ProductsMegaMenu
                      productsData={productsData}
                      activeIdx={activeCatIdx}
                      setActiveIdx={setActiveCatIdx}
                      onClose={close}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Search */}
            <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-lg relative">
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

            {/* Contact — only on large screens */}
            <div className="hidden xl:flex items-center gap-5 flex-shrink-0">
              <a href="tel:+916001234567" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors border border-white/15">
                  <Phone className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-tight">+1600-123 456 789</p>
                  <p className="text-[10px] text-white/50 font-medium">24/7 Support</p>
                </div>
              </a>
              <a href="mailto:support@amazoprint.in" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors border border-white/15">
                  <Mail className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-tight">support@amazoprint.in</p>
                  <p className="text-[10px] text-white/50 font-medium">Contact Email</p>
                </div>
              </a>
            </div>

            {/* Right action icons */}
            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
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
                <div className="hidden sm:flex items-center gap-1.5 ml-1.5 pl-1.5 border-l border-white/15">
                  <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-white/80 hover:text-white hover:bg-white/10 h-9 px-3">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-[#464674] border-none h-9 px-4 shadow-md shadow-black/20">
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                className="lg:hidden w-9 h-9 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center ml-1 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV ROW — FULL-WIDTH DIRECT PRODUCTS & SERVICES ─── */}
        <div className="hidden lg:block bg-[#282860] border-b border-white/10 relative z-10">
          <div className="w-full px-2 sm:px-3 lg:px-4">
            <nav className="flex items-center justify-between h-11 w-full gap-0.5">
              {/* Product Direct Items — Fills available width */}
              <div className="flex items-center gap-0.5 xl:gap-1 flex-1 min-w-0">
                {activeProductsList.map((product) => {
                  const menuKey = `prod-${product.id || product.slug}`;
                  const isMenuOpen = openMenu === menuKey;
                  const isActive = pathname === '/products';

                  return (
                    <div
                      key={product.id || product.slug}
                      className="relative flex-shrink-0"
                      onMouseEnter={() => enter(menuKey)}
                      onMouseLeave={leave}
                    >
                      <Link
                        href={`/products?category=${encodeURIComponent(product.name)}`}
                        className={cn(
                          'flex items-center gap-1 px-2 xl:px-2.5 h-11 text-[12px] xl:text-[13px] font-bold transition-all relative group whitespace-nowrap',
                          'text-white/80 hover:text-white'
                        )}
                      >
                        {product.name}
                        <ChevronDown className={cn(
                          'w-3 h-3 transition-transform duration-200 opacity-60 group-hover:opacity-100',
                          isMenuOpen && 'rotate-180 opacity-100'
                        )} />
                        {/* Active + hover underline */}
                        <span className={cn(
                          'absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-white rounded-t-full transition-all duration-200',
                          'opacity-0 group-hover:opacity-60'
                        )} />
                      </Link>

                      {/* Single Product Dropdown */}
                      <AnimatePresence>
                        {isMenuOpen && (
                          <div onMouseEnter={() => enter(menuKey)} onMouseLeave={leave}>
                            <SingleProductDropdown
                              product={product}
                              onClose={close}
                            />
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Separator */}
              <div className="h-4 w-[1px] bg-white/20 mx-1 flex-shrink-0" />

              {/* Service Navigation Items: Printers, Designers, Freelancers */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {serviceNavItems.map((item) => {
                  const isMenuOpen = openMenu === item.key;
                  const isActive = pathname === item.href;

                  return (
                    <div
                      key={item.key}
                      className="relative flex-shrink-0"
                      onMouseEnter={() => enter(item.key)}
                      onMouseLeave={leave}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-1.5 px-2 xl:px-2.5 h-11 text-[12px] xl:text-[13px] font-bold transition-all relative group whitespace-nowrap',
                          isActive ? 'text-white' : 'text-white/80 hover:text-white'
                        )}
                      >
                        {item.icon}
                        {item.label}
                        <ChevronDown className={cn(
                          'w-3 h-3 transition-transform duration-200 opacity-60',
                          isMenuOpen && 'rotate-180 opacity-100'
                        )} />
                        <span className={cn(
                          'absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-white rounded-t-full transition-all duration-200',
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                        )} />
                      </Link>

                      {/* Simple Dropdown */}
                      <AnimatePresence>
                        {isMenuOpen && (
                          <div onMouseEnter={() => enter(item.key)} onMouseLeave={leave}>
                            <SimpleDropdown items={item.dropdown} onClose={close} align="right" />
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Right Side: Today's Deals */}
                <Link
                  href="/products"
                  className="ml-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] xl:text-[12px] font-bold hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-100 transition-all flex-shrink-0 whitespace-nowrap"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Today's Deals
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* ── HEIGHT SPACER — must match header height ─────────────── */}
      {/* Top row 64px + bottom nav 44px = 108px */}
      <div className="h-[64px] lg:h-[108px]" aria-hidden="true" />

      {/* ════════════════════════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="fixed top-[64px] left-0 w-full bg-[#1a1a4e] border-b border-white/10 shadow-2xl lg:hidden z-40 max-h-[calc(100vh-64px)] overflow-y-auto"
            >
              <div className="w-full px-3 sm:px-4 py-4 flex flex-col gap-1.5">
                {/* Search Bar in Mobile Menu */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      setIsOpen(false);
                      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="md:hidden mb-2"
                >
                  <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 focus-within:border-white/50 transition-all">
                    <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cards, flyers, gifts..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none font-medium min-w-0"
                    />
                    {searchQuery.trim() && (
                      <button
                        type="submit"
                        className="text-[11px] font-black bg-white text-[#464674] px-2.5 py-1 rounded-lg shadow-sm"
                      >
                        Search
                      </button>
                    )}
                  </div>
                </form>

                {/* Products */}
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 pb-1 pt-1">
                  Products
                </p>
                {activeProductsList.map((product) => (
                  <Link
                    key={product.id || product.slug}
                    href={`/products?category=${encodeURIComponent(product.name)}`}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all',
                      'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <LayoutGrid className="w-4 h-4 text-white/70" />
                      {product.name}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                ))}

                {/* Services */}
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 pb-1 pt-3 border-t border-white/10 mt-2">
                  Services & Portals
                </p>
                {serviceNavItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all',
                      pathname === item.href
                        ? 'bg-white text-[#464674] shadow-md'
                        : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                ))}

                <div className="mt-2 pt-3 border-t border-white/10 flex flex-col gap-2">
                  {loading ? (
                    <Skeleton className="h-11 rounded-xl bg-white/10" />
                  ) : session ? (
                    <>
                      <Link
                        href={dashboardUrl}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 bg-white/10 text-white rounded-xl font-bold text-sm border border-white/15"
                      >
                        <User className="w-4 h-4" /> My Workspace
                      </Link>
                      <LogoutButton />
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-xl font-bold border-white/30 text-white hover:bg-white/10 h-11">
                        <Link href="/login" onClick={() => setIsOpen(false)}>Login</Link>
                      </Button>
                      <Button asChild size="sm" className="rounded-xl font-bold bg-white hover:bg-slate-50 text-[#464674] border-none h-11 shadow-md">
                        <Link href="/register" onClick={() => setIsOpen(false)}>Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
