'use client'

import Link from "next/link";
import { Button } from "../ui/button";
import { AmazoprintLogo } from "../ui/logo";
import { getSession } from "@/app/actions/user-actions";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";

type Session = Awaited<ReturnType<typeof getSession>>;

export function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const renderNavContent = () => {
    if (loading) {
      return null;
    }

    if (session) {
      return (
        <>
          <Button asChild variant="outline">
            <Link href={dashboardUrl}>Dashboard</Link>
          </Button>
          <LogoutButton />
        </>
      );
    }

    return (
      <>
        <Link
          href="/#features"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          prefetch={false}
        >
          How It Works
        </Link>
        <Link
          href="/products"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          prefetch={false}
        >
          Products
        </Link>
        <Link
          href="/contests"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          prefetch={false}
        >
          Contests
        </Link>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm border-b">
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <AmazoprintLogo />
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        {renderNavContent()}
      </nav>
    </header>
  );
}
