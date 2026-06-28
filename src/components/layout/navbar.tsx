'use client';

import React from 'react';
import Link from 'next/link';
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
import { usePathname } from 'next/navigation';
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
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-blue-50 text-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                        active ? 'bg-white/20' : 'bg-white group-hover/cat:bg-blue-100'
                      )}>
                        <LayoutGrid className={cn('w-3.5 h-3.5', active ? 'text-white' : 'text-blue-500')} />
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
                        href={`/design/${productsData[activeIdx].slug}`}
                        onClick={onClose}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap"
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
                                href={`/design/${productsData[activeIdx].slug}/start?subProductId=${sp.id}`}
                                onClick={onClose}
                                className="group/sub flex flex-col gap-1.5 p-2.5 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/70 transition-all"
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
                                <p className="text-[11px] font-bold text-gray-700 group-hover/sub:text-blue-600 transition-colors leading-tight line-clamp-2">
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
                                    <span className="text-[9px] font-black text-blue-600">₹{Number(sp.price).toFixed(0)}</span>
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between flex-shrink-0">
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
// SIMPLE DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function SimpleDropdown({
  items,
  onClose,
}: {
  items: { label: string; href: string; desc?: string; icon?: React.ReactNode }[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.14 }}
      className="absolute top-full left-0 pt-2 z-[999] min-w-[220px]"
    >
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5 py-1.5">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            onClick={onClose}
            className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
          >
            {item.icon && (
              <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                <span className="text-blue-600">{item.icon}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{item.label}</p>
              {item.desc && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.desc}</p>}
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
export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [scrolled, setScrolled] = React.useState(false);
  const [productsData, setProductsData] = React.useState<any[]>([]);
  const [activeCatIdx, setActiveCatIdx] = React.useState(0);

  // Separate state keys prevent the top "Categories" btn and bottom "Products"
  // nav link from accidentally rendering two dropdowns at once.
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();

  React.useEffect(() => {
    getSession().then((s) => { setSession(s); setLoading(false); });
    getProducts().then((data: any[]) => setProductsData(data.filter((p) => p.isActive)));

    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
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

  // Bottom nav items — "products-nav" key is distinct from "categories-btn"
  const navItems = [
    {
      key: 'home',
      label: 'Home',
      href: '/',
      icon: <Home className="w-3.5 h-3.5" />,
    },
    {
      key: 'products-nav',   // ← different key from 'categories-btn'
      label: 'Products',
      href: '/products',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      hasMega: true,
    },
    {
      key: 'templates',
      label: 'Templates',
      href: '/templates',
      icon: <FileText className="w-3.5 h-3.5" />,
      dropdown: [
        { label: 'Business Templates', href: '/templates', desc: 'Cards, letterheads & more', icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Marketing Templates', href: '/templates', desc: 'Flyers, banners & posters', icon: <Flame className="w-3.5 h-3.5" /> },
        { label: 'Event Templates', href: '/templates', desc: 'Invitations & programs', icon: <Gift className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: 'design-studio',
      label: 'Design Studio',
      href: '/design',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      dropdown: [
        { label: 'Open Studio', href: '/design', desc: 'Create your design online', icon: <Sparkles className="w-3.5 h-3.5" /> },
        { label: 'Design Contests', href: '/contests', desc: 'Win prizes & recognition', icon: <Star className="w-3.5 h-3.5" /> },
        { label: 'Hire a Designer', href: '/freelancer/verifications', desc: 'Get professional help', icon: <PenTool className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: 'printers',
      label: 'Printers',
      href: '/printer-registration',
      icon: <Printer className="w-3.5 h-3.5" />,
      dropdown: [
        { label: 'Become a Partner', href: '/printer-registration', desc: 'Register your press', icon: <Printer className="w-3.5 h-3.5" /> },
        { label: 'Printer Dashboard', href: '/printer/dashboard', desc: 'Manage your orders', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
        { label: 'Printer Login', href: '/printer-login', desc: 'Access your account', icon: <LogIn className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: 'designers',
      label: 'Designers',
      href: '/freelancer/verifications',
      icon: <Star className="w-3.5 h-3.5" />,
      dropdown: [
        { label: 'Join as Designer', href: '/freelancer/verifications', desc: 'Start earning today', icon: <PenTool className="w-3.5 h-3.5" /> },
        { label: 'Design Contests', href: '/contests', desc: 'Compete & win prizes', icon: <Star className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: 'deals',
      label: "Today's Deals",
      href: '/products',
      icon: <Flame className="w-3.5 h-3.5 text-orange-500" />,
      isHighlight: true,
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
          scrolled && 'shadow-md'
        )}
      >
        {/* ── TOP ROW ─────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 h-[64px] flex items-center gap-3 lg:gap-5">

            {/* Logo */}
            <Link href="/" prefetch={false} className="flex-shrink-0">
              <AmazoprintLogo variant="header" />
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
                  'flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-colors',
                  openMenu === 'categories-btn' && 'bg-gray-700'
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
            <div className="hidden md:block flex-1 max-w-lg">
              <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium min-w-0"
                />
              </div>
            </div>

            {/* Contact — only on large screens */}
            <div className="hidden xl:flex items-center gap-5 flex-shrink-0">
              <a href="tel:+916001234567" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 leading-tight">+1600-123 456 789</p>
                  <p className="text-[10px] text-gray-400 font-medium">24/7 Support</p>
                </div>
              </a>
              <a href="mailto:support@amazoprint.in" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 leading-tight">support@amazoprint.in</p>
                  <p className="text-[10px] text-gray-400 font-medium">Contact Email</p>
                </div>
              </a>
            </div>

            {/* Right action icons */}
            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
              {/* Account */}
              {loading ? (
                <Skeleton className="h-9 w-9 rounded-full" />
              ) : session ? (
                <Link
                  href={dashboardUrl}
                  title="My Workspace"
                  className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <User className="w-4 h-4 text-blue-600" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  title="Login"
                  className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <LogIn className="w-4 h-4 text-blue-600" />
                </Link>
              )}

              {/* Wishlist */}
              <button
                type="button"
                className="relative w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">0</span>
              </button>

              {/* Cart */}
              <CartSheet />

              {/* Auth buttons */}
              {!loading && !session && (
                <div className="hidden sm:flex items-center gap-1.5 ml-1.5 pl-1.5 border-l border-gray-200">
                  <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-9 px-3">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white border-none h-9 px-4 shadow-md shadow-blue-500/20">
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                className="lg:hidden w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center ml-1 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-4 h-4 text-gray-700" /> : <Menu className="w-4 h-4 text-gray-700" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV ROW ──────────────────────────────────────── */}
        <div className="hidden lg:block bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            <nav className="flex items-center h-11">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isMenuOpen = openMenu === item.key;

                return (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => (item.dropdown || item.hasMega) ? enter(item.key) : undefined}
                    onMouseLeave={() => (item.dropdown || item.hasMega) ? leave() : undefined}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 h-11 text-[13px] font-bold transition-all relative group whitespace-nowrap',
                        isActive ? 'text-blue-600' : item.isHighlight
                          ? 'text-orange-500 hover:text-orange-600'
                          : 'text-gray-700 hover:text-blue-600'
                      )}
                    >
                      {item.icon}
                      {item.label}
                      {(item.dropdown || item.hasMega) && (
                        <ChevronDown className={cn(
                          'w-3 h-3 transition-transform duration-200',
                          isMenuOpen && 'rotate-180'
                        )} />
                      )}
                      {/* Active + hover underline */}
                      <span className={cn(
                        'absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-t-full transition-all duration-200',
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )} />
                    </Link>

                    {/* Mega-menu for Products — key 'products-nav' */}
                    {item.hasMega && (
                      <AnimatePresence>
                        {isMenuOpen && (
                          <div onMouseEnter={() => enter(item.key)} onMouseLeave={leave}>
                            <ProductsMegaMenu
                              productsData={productsData}
                              activeIdx={activeCatIdx}
                              setActiveIdx={setActiveCatIdx}
                              onClose={close}
                            />
                          </div>
                        )}
                      </AnimatePresence>
                    )}

                    {/* Simple dropdown */}
                    {item.dropdown && (
                      <AnimatePresence>
                        {isMenuOpen && (
                          <div onMouseEnter={() => enter(item.key)} onMouseLeave={leave}>
                            <SimpleDropdown items={item.dropdown} onClose={close} />
                          </div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}

              {/* Personalized Gifts pill */}
              <Link
                href="/products"
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[12px] font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-100 transition-all"
              >
                <Gift className="w-3.5 h-3.5" />
                Personalized Gifts
              </Link>
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
              className="fixed top-[64px] left-0 w-full bg-white border-b border-gray-200 shadow-2xl lg:hidden z-40 max-h-[calc(100vh-64px)] overflow-y-auto"
            >
              <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-col gap-1.5">
                {/* Search Bar in Mobile Menu */}
                <div className="md:hidden mb-2">
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="What are you looking for?"
                      className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-medium min-w-0"
                    />
                  </div>
                </div>

                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all',
                      pathname === item.href
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    )}
                  >
                    <span className="flex items-center gap-2.5">{item.icon} {item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                ))}

                <div className="mt-2 pt-3 border-t border-gray-100 flex flex-col gap-2">
                  {loading ? (
                    <Skeleton className="h-11 rounded-xl" />
                  ) : session ? (
                    <>
                      <Link
                        href={dashboardUrl}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm"
                      >
                        <User className="w-4 h-4" /> My Workspace
                      </Link>
                      <LogoutButton />
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-xl font-bold border-blue-200 text-blue-600 hover:bg-blue-50 h-11">
                        <Link href="/login" onClick={() => setIsOpen(false)}>Login</Link>
                      </Button>
                      <Button asChild size="sm" className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white border-none h-11 shadow-md shadow-blue-500/20">
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
