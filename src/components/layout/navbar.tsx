'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AmazoprintLogo } from '@/components/ui/logo';
import { getSession } from '@/app/actions/user-actions';
import { LogoutButton } from '@/components/layout/logout-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CartSheet } from '@/components/cart/cart-sheet';
import { usePathname } from 'next/navigation';

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
    <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border/40">
      <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" prefetch={false}>
          <AmazoprintLogo isSimple className="w-8 h-8 lg:hidden" />
          <AmazoprintLogo className="hidden lg:block" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full transition-colors",
                pathname === link.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-20 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            ) : session ? (
              <>
                <Button asChild variant="ghost" className="rounded-full font-bold">
                  <Link href={dashboardUrl}>Workspace</Link>
                </Button>
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-full font-bold px-6">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="rounded-full px-8 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Link href="/products">Create</Link>
                </Button>
              </>
            )}
          </div>
          
          <CartSheet />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-full hover:bg-primary/5" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-20 left-0 w-full bg-background border-b border-border shadow-2xl md:hidden overflow-hidden"
            >
              <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
                <div className="grid gap-2">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      className="flex items-center justify-between p-4 text-lg font-bold rounded-2xl bg-muted/30 hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex flex-col gap-3 pb-4">
                  {loading ? (
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  ) : session ? (
                    <>
                      <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 font-bold" onClick={() => setIsOpen(false)}>
                        <Link href={dashboardUrl} className="flex items-center justify-center gap-2">
                          <User className="w-5 h-5" /> My Workspace
                        </Link>
                      </Button>
                      <LogoutButton />
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 font-bold" onClick={() => setIsOpen(false)}>
                        <Link href="/login">Login to Account</Link>
                      </Button>
                      <Button asChild size="lg" className="rounded-2xl h-14 font-black text-lg shadow-xl shadow-primary/20" onClick={() => setIsOpen(false)}>
                        <Link href="/products" className="flex items-center justify-center gap-2">
                          Start Creating <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                    </>
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
