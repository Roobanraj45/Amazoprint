'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AmazoprintLogo } from '@/components/ui/logo';
import { getSession } from '@/app/actions/user-actions';
import { LogoutButton } from '@/components/layout/logout-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CartSheet } from '@/components/cart/cart-sheet';

type Session = Awaited<ReturnType<typeof getSession>>;

const Logo = () => (
  <Link href="/" className="flex items-center justify-center" prefetch={false}>
    <AmazoprintLogo />
  </Link>
);

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSession().then(s => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  let dashboardUrl = '/';
  if (session) {
    switch (session.role) {
      case 'freelancer':
        dashboardUrl = '/freelancer/dashboard';
        break;
      case 'admin':
      case 'super_admin':
      case 'company_admin':
      case 'designer':
        dashboardUrl = '/admin/dashboard';
        break;
      case 'accounts':
        dashboardUrl = '/accounts/dashboard';
        break;
      case 'printer':
        dashboardUrl = '/printer/dashboard';
        break;
      default: // 'user'
        dashboardUrl = '/client/dashboard';
        break;
    }
  }

  const renderAuthButtons = () => {
    if (loading) {
      return (
        <div className="hidden md:flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      );
    }
    if (session) {
      return (
        <div className="hidden md:flex items-center gap-4">
          <Button asChild variant="ghost"><Link href={dashboardUrl}>Dashboard</Link></Button>
          <LogoutButton />
        </div>
      );
    }
    return (
      <div className="hidden md:flex items-center gap-4">
        <Button asChild variant="ghost"><Link href="/login">Login</Link></Button>
        <Button asChild className="rounded-full px-6"><Link href="/products">Create</Link></Button>
      </div>
    );
  };
  
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <Link href="/contests" className="hover:text-primary transition-colors">Contests</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          <Link href="/sustainability" className="hover:text-primary transition-colors">Sustainability</Link>
        </div>
        <div className="flex items-center gap-2">
          {renderAuthButtons()}
          <CartSheet />
          <button className="md:hidden -mr-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 w-full bg-background border-b md:hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                <Link href="/products" className="hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Products</Link>
                <Link href="/contests" className="hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Contests</Link>
                <Link href="/about" className="hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>About</Link>
                <Link href="/sustainability" className="hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Sustainability</Link>
                <Separator />
                {loading ? <Skeleton className="h-10 w-full" /> : session ? (
                  <>
                    <Button asChild variant="outline" className="w-full" onClick={() => setIsOpen(false)}><Link href={dashboardUrl}>Dashboard</Link></Button>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full" onClick={() => setIsOpen(false)}><Link href="/login">Login</Link></Button>
                    <Button asChild className="rounded-full w-full" onClick={() => setIsOpen(false)}><Link href="/products">Create</Link></Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};
