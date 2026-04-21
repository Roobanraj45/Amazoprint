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
    { href: '/products', label: 'Products' },
    { href: '/contests', label: 'Contests' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/70 backdrop-blur-xl border-border/40 px-4 lg:px-8">
      <div className="container mx-auto h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" prefetch={false}>
          <AmazoprintLogo isSimple className="w-8 h-8 lg:hidden" />
          <AmazoprintLogo className="hidden lg:block scale-90 origin-left" />
        </Link>

        <nav className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-full transition-colors",
                  pathname.startsWith(link.href) 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {!loading && (
            <div className="flex items-center gap-2">
              {session ? (
                <Button asChild variant="outline" size="sm" className="rounded-full text-xs font-bold hidden xs:flex">
                  <Link href={dashboardUrl}>Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm" className="rounded-full text-xs font-bold hidden xs:flex">
                  <Link href="/login">Login</Link>
                </Button>
              )}
              
              <CartSheet />
              
              {session && (
                <div className="hidden xs:block">
                  <LogoutButton />
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
