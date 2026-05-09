'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronRight,
  User,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AmazoprintLogo } from '@/components/ui/logo';
import { getSession } from '@/app/actions/user-actions';
import { LogoutButton } from '@/components/layout/logout-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CartSheet } from '@/components/cart/cart-sheet';
import { usePathname } from 'next/navigation';
import { cn, resolveImagePath } from '@/lib/utils';
import { getProducts } from '@/app/actions/product-actions';
import Image from 'next/image';

type Session = Awaited<ReturnType<typeof getSession>>;

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [scrolled, setScrolled] = React.useState(false);
  const [productsData, setProductsData] = React.useState<any[]>([]);
  const [isProductsHovered, setIsProductsHovered] = React.useState(false);
  const [activeProductIndex, setActiveProductIndex] = React.useState(0);
  const pathname = usePathname();

  React.useEffect(() => {
    getSession().then(s => {
      setSession(s);
      setLoading(false);
    });

    getProducts().then(data => {
      setProductsData(data.filter(p => p.isActive));
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardUrl = (role?: string) => {
    if (!role) return '/';
    switch (role) {
      case 'freelancer': return '/freelancer/dashboard';
      case 'admin':
      case 'super_admin':
      case 'company_admin':
      case 'designer': return '/admin/dashboard';
      case 'accounts': return '/accounts/dashboard';
      case 'printer': return '/printer/dashboard';
      default: return '/client/dashboard';
    }
  };

  const dashboardUrl = getDashboardUrl(session?.role);

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/templates', label: 'Templates' },
    { href: '/contests', label: 'Contests' },
    { href: '/about', label: 'About' },
  ];

  const isHome = pathname === '/';

  return (
    <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500",
        scrolled 
            ? "bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-sm py-0" 
            : isHome 
                ? "bg-transparent border-transparent py-4" 
                : "bg-background border-b border-border/50 py-0"
    )}>
      <div className={cn(
          "container mx-auto px-4 lg:px-8 transition-all duration-500 flex items-center justify-between",
          scrolled ? "h-20" : "h-24"
      )}>
        {/* Logo Section */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity" prefetch={false}>
            <AmazoprintLogo className={cn(
                "transition-all duration-500 origin-left",
                scrolled ? "scale-90" : "scale-100",
                (!scrolled && isHome) && "brightness-0 invert"
            )} />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className={cn(
            "hidden lg:flex items-center gap-1 mx-auto transition-all duration-500 p-1.5 rounded-full border",
            scrolled 
                ? "bg-muted/30 border-border/40" 
                : isHome 
                    ? "bg-white/10 border-white/20 backdrop-blur-md" 
                    : "bg-muted/30 border-border/40"
        )}>
          {navLinks.map((link) => {
            const isProducts = link.label === 'Products';
            return (
              <div 
                key={link.href}
                className="relative"
                onMouseEnter={() => isProducts && setIsProductsHovered(true)}
                onMouseLeave={() => isProducts && setIsProductsHovered(false)}
              >
                <Link 
                  href={link.href} 
                  className={cn(
                    "px-6 py-2.5 text-[11px] font-bold tracking-tight transition-all duration-200 relative group flex items-center gap-1",
                    pathname === link.href 
                      ? "text-primary" 
                      : scrolled || !isHome
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-white/70 hover:text-white"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 bg-primary transition-all duration-300 rounded-full",
                    pathname === link.href ? "w-4" : "w-0 group-hover:w-4"
                  )} />
                </Link>

                {isProducts && (
                  <AnimatePresence>
                    {isProductsHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[600px] z-50"
                      >
                        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                          <div className="flex min-h-[350px]">
                            {/* Left Pane: Products */}
                            <div className="w-1/3 bg-muted/30 border-r border-border/50 p-3">
                              <p className="text-[10px] font-bold tracking-tight text-muted-foreground px-3 mb-3">Categories</p>
                              <div className="space-y-1">
                                {productsData.map((product, idx) => (
                                  <div 
                                    key={product.id}
                                    onMouseEnter={() => setActiveProductIndex(idx)}
                                    className={cn(
                                      "flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all group/item",
                                      activeProductIndex === idx ? "bg-background shadow-md border border-border/50" : "hover:bg-background/50"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                        activeProductIndex === idx ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover/item:text-primary"
                                      )}>
                                        <LayoutGrid className="w-4 h-4" />
                                      </div>
                                      <span className={cn(
                                        "text-xs font-bold transition-colors tracking-tight",
                                        activeProductIndex === idx ? "text-foreground" : "text-muted-foreground group-hover/item:text-foreground"
                                      )}>
                                        {product.name}
                                      </span>
                                    </div>
                                    <ChevronRight className={cn(
                                      "w-3 h-3 transition-all",
                                      activeProductIndex === idx ? "text-primary translate-x-0" : "text-muted-foreground opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0"
                                    )} />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right Pane: Sub-Products */}
                            <div className="flex-1 p-6 bg-background/50">
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={activeProductIndex}
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="h-full flex flex-col"
                                >
                                  <div className="flex items-center justify-between mb-6">
                                    <div>
                                      <h4 className="text-xl font-black tracking-tighter text-foreground font-headline">
                                        {productsData[activeProductIndex]?.name}
                                      </h4>
                                      <p className="text-[10px] font-bold text-muted-foreground tracking-tight mt-1">Available Materials & Specs</p>
                                    </div>
                                    <Link 
                                      href={`/design/${productsData[activeProductIndex]?.slug}`}
                                      className="text-[10px] font-bold text-primary tracking-tight hover:underline"
                                      onClick={() => setIsProductsHovered(false)}
                                    >
                                      View All
                                    </Link>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    {productsData[activeProductIndex]?.subProducts?.filter((sp: any) => sp.isActive).map((sp: any) => (
                                      <Link
                                        key={sp.id}
                                        href={`/design/${productsData[activeProductIndex]?.slug}/start?subProductId=${sp.id}`}
                                        className="group/sub relative p-4 rounded-2xl bg-muted/40 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all"
                                        onClick={() => setIsProductsHovered(false)}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-black text-foreground group-hover/sub:text-primary transition-colors">{sp.name}</span>
                                          <ArrowRight className="w-3 h-3 text-primary opacity-0 -translate-x-2 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all" />
                                        </div>
                                        <div className="flex gap-2">
                                          <span className="text-[9px] font-bold text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded border border-border/50">
                                            {sp.width}x{sp.height}{sp.unitType}
                                          </span>
                                          {sp.spotUvAllowed && (
                                            <span className="text-[9px] font-bold text-violet-500">UV</span>
                                          )}
                                        </div>
                                      </Link>
                                    ))}
                                  </div>

                                  {(!productsData[activeProductIndex]?.subProducts || productsData[activeProductIndex]?.subProducts.length === 0) && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                      <LayoutGrid className="w-12 h-12 mb-4 text-muted-foreground" />
                                      <p className="text-xs font-bold text-muted-foreground tracking-tight">No materials added yet</p>
                                    </div>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </div>
                          
                          <div className="bg-primary/5 p-4 border-t border-border/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              <p className="text-[10px] font-bold text-muted-foreground">Industrial-grade precision for every design.</p>
                            </div>
                            <Link 
                              href="/products" 
                              className="text-[10px] font-bold text-primary tracking-tight flex items-center gap-1 hover:gap-2 transition-all"
                              onClick={() => setIsProductsHovered(false)}
                            >
                              Explore Catalog <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24 rounded-full opacity-20" />
                <Skeleton className="h-10 w-32 rounded-full opacity-20" />
              </div>
            ) : session ? (
              <>
                <Button asChild variant="outline" className={cn(
                    "rounded-full font-bold h-11 px-6 border-2 transition-all text-[11px] tracking-tight",
                    scrolled || !isHome
                        ? "hover:bg-primary/5"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}>
                  <Link href={dashboardUrl}>
                    <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                    Workspace
                  </Link>
                </Button>
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className={cn(
                    "rounded-full font-bold px-6 h-11 transition-all text-[11px] tracking-tight",
                    scrolled || !isHome
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                )}>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="rounded-full px-8 h-11 font-bold text-[11px] tracking-tight shadow-xl shadow-primary/30 hover:scale-105 transition-transform active:scale-95 bg-primary hover:bg-primary/90">
                  <Link href="/products">Get Started</Link>
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <CartSheet />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                  "lg:hidden rounded-2xl h-11 w-11 transition-all border border-transparent",
                  scrolled || !isHome
                    ? "hover:bg-primary/5 active:border-primary/20"
                    : "text-white hover:bg-white/10 border-white/10"
              )}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className={cn("w-6 h-6", !scrolled && isHome && "text-white")} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-[6rem] left-0 w-full bg-background/95 backdrop-blur-3xl border-b border-border shadow-2xl lg:hidden overflow-hidden z-40"
            >
              <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-[10px] font-bold tracking-tight text-muted-foreground px-4 mb-2">Navigation</p>
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className={cn(
                        "flex items-center justify-between p-5 text-sm font-black rounded-3xl transition-all active:scale-[0.98] tracking-tight",
                        pathname === link.href ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                      <ChevronRight className={cn("w-6 h-6", pathname === link.href ? "text-primary-foreground/50" : "text-muted-foreground")} />
                    </Link>
                  ))}
                </div>
                
                <Separator className="opacity-50" />
                
                <div className="flex flex-col gap-4 pb-6">
                  {loading ? (
                    <Skeleton className="h-16 w-full rounded-3xl" />
                  ) : session ? (
                    <div className="space-y-4">
                      <Button asChild variant="outline" size="lg" className="rounded-3xl h-16 w-full font-black text-lg border-2" onClick={() => setIsOpen(false)}>
                        <Link href={dashboardUrl} className="flex items-center justify-center gap-3">
                          <LayoutGrid className="w-6 h-6" /> Go to Workspace
                        </Link>
                      </Button>
                      <LogoutButton />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <Button asChild variant="outline" size="lg" className="rounded-3xl h-16 font-black text-lg border-2 border-primary/20 hover:bg-primary/5" onClick={() => setIsOpen(false)}>
                        <Link href="/login">Login to Account</Link>
                      </Button>
                      <Button asChild size="lg" className="rounded-3xl h-16 font-black text-xl shadow-2xl shadow-primary/30 active:scale-95" onClick={() => setIsOpen(false)}>
                        <Link href="/products" className="flex items-center justify-center gap-3">
                          Start Creating <ArrowRight className="w-6 h-6" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
