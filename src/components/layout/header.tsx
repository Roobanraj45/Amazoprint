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
import { LayoutGrid, Home, Settings, ShieldCheck } from "lucide-react";

type Session = Awaited<ReturnType<typeof getSession>>;

export function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
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
    { href: '/products', label: 'Products', icon: <Settings className="w-3.5 h-3.5" /> },
    { href: '/contests', label: 'Contests', icon: <Home className="w-3.5 h-3.5" /> },
    { href: '/client/verifications', label: 'Verification', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b bg-background/80 backdrop-blur-2xl border-border/40 px-4 lg:px-8">
      <div className="container mx-auto h-full flex items-center justify-between">
        {/* Large Brand Logo - Scale adjusted */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" prefetch={false}>
            <AmazoprintLogo className="scale-75 sm:scale-80 lg:scale-90 origin-left" />
          </Link>
        </div>

        {/* Compact Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/20 p-1 rounded-full border border-border/30">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "px-5 py-2 text-xs font-black uppercase tracking-widest rounded-full transition-all duration-200 flex items-center gap-2",
                pathname.startsWith(link.href) 
                  ? "bg-background text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!loading && (
            <>
              {session ? (
                <div className="flex items-center gap-2">
                   <Button asChild variant="outline" size="sm" className="rounded-full text-xs font-bold h-10 px-5 border-2 hover:bg-primary/5 hidden sm:flex">
                    <Link href={dashboardUrl}>
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      Workspace
                    </Link>
                  </Button>
                  <div className="hidden xs:block">
                    <LogoutButton />
                  </div>
                </div>
              ) : (
                <Button asChild variant="ghost" size="sm" className="rounded-full text-xs font-black uppercase tracking-widest h-10 px-5 hidden sm:flex">
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
              
              <CartSheet />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
