'use client';

import React from 'react';
import Link from 'next/link';
import { Palette, Printer, ShieldCheck, User } from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

export type LoginPortal = 'client' | 'freelancer' | 'printer' | 'admin';

interface LoginShellProps {
  activePortal: LoginPortal;
  badgeText: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

const PORTALS: Array<{
  id: LoginPortal;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'client', label: 'Client', href: '/login?portal=client', icon: User },
  { id: 'freelancer', label: 'Freelancer', href: '/login?portal=freelancer', icon: Palette },
  { id: 'printer', label: 'Printer', href: '/printer-login', icon: Printer },
  { id: 'admin', label: 'Admin', href: '/admin-login', icon: ShieldCheck },
];

export function LoginShell({
  activePortal,
  badgeText,
  title,
  subtitle,
  children,
  footerContent,
}: LoginShellProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Soft Curved Background Blobs */}
      <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg space-y-5">
        {/* Segregated Portal Switcher */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-sm">
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = activePortal === portal.id;
            return (
              <Link
                key={portal.id}
                href={portal.href}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all',
                  isActive
                    ? portal.id === 'admin'
                      ? 'bg-gradient-to-r from-rose-600 to-purple-700 text-white shadow-sm'
                      : 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{portal.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Curved Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-purple-100/80 p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2.5">
            <Link href="/" className="inline-flex flex-col items-center">
              <AmazoprintLogo />
            </Link>

            <div className="pt-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
                  activePortal === 'admin'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                    : 'bg-purple-50 text-purple-700 border border-purple-200/80'
                )}
              >
                {badgeText}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}

          {footerContent && (
            <div className="pt-4 border-t border-slate-100 text-center space-y-2">
              {footerContent}
            </div>
          )}
        </div>

        {/* Bottom Legal & Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-purple-700 transition-colors">
            Back to Store
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-purple-700 transition-colors">
            Terms &amp; Conditions
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-purple-700 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/help" className="hover:text-purple-700 transition-colors">
            Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
