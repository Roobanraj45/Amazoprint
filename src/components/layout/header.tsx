'use client'

import Link from "next/link";
import { Button } from "../ui/button";
import { AmazoprintLogo } from "../ui/logo";
import { getSession } from "@/app/actions/user-actions";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CartSheet } from "../cart/cart-sheet";
import { cn } from "@/lib/utils";
import { LayoutGrid, Home, Settings, ShieldCheck, Menu, Search } from "lucide-react";

type Session = Awaited<ReturnType<typeof getSession>>;

export function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    getSession().then(s => {
      setSession(s);
      setLoading(false);
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
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/templates', label: 'Templates' },
    { href: '/contests', label: 'Design Quests' },
  ];

  return (
    <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
            ? "h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm" 
            : "h-24 bg-transparent"
    )}>
      <div className="container mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-all active:scale-95" prefetch={false}>
            <AmazoprintLogo className={cn(
                "transition-all duration-300 origin-left",
                scrolled ? "scale-75" : "scale-100"
            )} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-[13px] font-semibold transition-all duration-200 relative group",
                pathname === link.href 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
              <span className={cn(
                "absolute -bottom-1.5 left-0 h-[2px] bg-primary transition-all duration-300 rounded-full",
                pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
              )} />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {session ? (
                <div className="flex items-center gap-4">
                   <Link href={dashboardUrl} className="hidden sm:flex items-center gap-2 text-[12px] font-semibold text-foreground/70 hover:text-primary transition-colors">
                      <LayoutGrid className="w-4 h-4" />
                      Workspace
                   </Link>
                   <div className="h-4 w-[1px] bg-border hidden sm:block" />
                   <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" className="rounded-full text-[12px] font-semibold px-6 h-10 hover:bg-slate-100 transition-all">
                        <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild className="rounded-full text-[12px] font-semibold px-6 h-10 shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <Link href="/register">Join us</Link>
                    </Button>
                </div>
              )}
              
              <div className="h-8 w-[1px] bg-border/60 mx-1" />
              <CartSheet />
              
              <Button variant="ghost" size="icon" className="md:hidden rounded-full h-10 w-10">
                <Menu className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
