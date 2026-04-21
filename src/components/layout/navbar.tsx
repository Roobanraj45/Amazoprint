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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AmazoprintLogo } from '@/components/ui/logo';
import { getSession } from '@/app/actions/user-actions';
import { LogoutButton } from '@/components/layout/logout-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CartSheet } from '@/components/cart/cart-sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Session = Awaited<ReturnType<typeof getSession>>;

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const pathname = usePathname();

  React.useEffect(() => {
    getSession().then(s => {
      setSession(s);
      setLoading(false);
    });
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
    { href: '/contests', label: 'Contests' },
    { href: '/about', label: 'About' },
    { href: '/sustainability', label: 'Sustainability' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 lg:px-8 h-24 flex items-center justify-between">
        {/* Logo Section - Prominent and Large */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity" prefetch={false}>
            <AmazoprintLogo className="scale-100 sm:scale-110 md:scale-125 origin-left" />
          </Link>
        </div>

        {/* Desktop Navigation - Centered and Clean */}
        <div className="hidden lg:flex items-center gap-1 mx-auto bg-muted/30 p-1.5 rounded-full border border-border/40">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-200",
                pathname === link.href 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Buttons - Grouped for clarity */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-12 w-24 rounded-full" />
                <Skeleton className="h-12 w-32 rounded-full" />
              </div>
            ) : session ? (
              <>
                <Button asChild variant="outline" className="rounded-full font-bold h-12 px-6 border-2 hover:bg-primary/5">
                  <Link href={dashboardUrl}>
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Workspace
                  </Link>
                </Button>
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-full font-bold px-6 h-12 text-muted-foreground hover:text-foreground">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="rounded-full px-8 h-12 font-black text-md shadow-xl shadow-primary/30 hover:scale-105 transition-transform active:scale-95 bg-primary hover:bg-primary/90">
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
              className="lg:hidden rounded-2xl h-12 w-12 hover:bg-primary/5 border border-transparent active:border-primary/20" 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6" />}
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
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4 mb-2">Navigation</p>
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className={cn(
                        "flex items-center justify-between p-5 text-xl font-black rounded-3xl transition-all active:scale-[0.98]",
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
