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

import { NoticeSlider } from "./notice-slider";

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

  const isHome = pathname === '/';

  return (
    <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex flex-col justify-between",
        scrolled 
            ? isHome
              ? "bg-[#464674]/95 backdrop-blur-xl border-b border-white/10 shadow-lg text-white"
              : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm text-foreground" 
            : isHome
              ? "bg-transparent"
              : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs text-foreground"
    )}>
      {!scrolled && <NoticeSlider />}
      <div className="w-full h-20 sm:h-24 md:h-26 px-3 sm:px-4 lg:px-6 flex items-center justify-between py-2">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-all active:scale-95" prefetch={false}>
            <AmazoprintLogo variant="header" className={cn(
                "transition-all duration-300 origin-left",
                scrolled ? "scale-75" : "scale-100",
                isHome ? "brightness-0 invert" : ""
            )} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "text-[13px] font-semibold tracking-tight transition-all duration-200 relative group",
                  isHome
                    ? isActive 
                      ? "text-white" 
                      : "text-white/70 hover:text-white"
                    : isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                <span className={cn(
                  "absolute -bottom-1.5 left-0 h-[2px] transition-all duration-300 rounded-full",
                  isHome ? "bg-white" : "bg-primary",
                  isActive ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {session ? (
                <div className="flex items-center gap-4">
                   <Link 
                     href={dashboardUrl} 
                     className={cn(
                       "hidden sm:flex items-center gap-2 text-[12px] font-semibold transition-colors",
                       isHome
                         ? "text-white/80 hover:text-white"
                         : "text-foreground/70 hover:text-primary"
                     )}
                   >
                      <LayoutGrid className="w-4 h-4" />
                      Workspace
                   </Link>
                   <div className={cn("h-4 w-[1px] hidden sm:block", isHome ? "bg-white/20" : "bg-border")} />
                   <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                    <Button 
                      asChild 
                      variant="ghost" 
                      className={cn(
                        "rounded-full text-[13px] font-semibold tracking-tight px-6 h-10 transition-all",
                        isHome
                          ? "text-white hover:bg-white/10 hover:text-white"
                          : "hover:bg-slate-100"
                      )}
                    >
                        <Link href="/login">Log in</Link>
                    </Button>
                    <Button 
                      asChild 
                      className={cn(
                        "rounded-full text-[13px] font-semibold tracking-tight px-6 h-10 transition-all active:scale-95",
                        isHome
                          ? "bg-white hover:bg-slate-50 text-[#464674] border-none shadow-lg shadow-white/5"
                          : "shadow-lg shadow-primary/20"
                      )}
                    >
                        <Link href="/register">Join us</Link>
                    </Button>
                </div>
              )}
              
              <div className={cn("h-8 w-[1px] mx-1", isHome ? "bg-white/20" : "bg-border/60")} />
              <CartSheet className={isHome ? "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" : ""} />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "md:hidden rounded-full h-10 w-10",
                  isHome ? "text-white hover:bg-white/10 hover:text-white" : ""
                )}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
