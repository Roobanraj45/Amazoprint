'use client';

import React from 'react';
import Link from 'next/link';
import { AmazoprintLogo } from '@/components/ui/logo';
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Truck,
  Send,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    heading: 'Quick Links',
    links: [
      { label: 'About Us',       href: '/about' },
      { label: 'How To Order',   href: '/how-to-order' },
      { label: 'Contact Us',     href: '/contact' },
      { label: 'Wishlist',       href: '/wishlist' },
      { label: 'Support Ticket', href: '/ticket' },
    ],
  },
  {
    heading: 'Customer Policies',
    links: [
      { label: 'Terms & Conditions',        href: '/terms' },
      { label: 'Privacy Policy',            href: '/privacy' },
      { label: 'Billing & Payments',        href: '/billing' },
      { label: 'Shipping Policy',           href: '/shipping' },
      { label: 'Refund and Returns Policy', href: '/refund' },
    ],
  },
  {
    heading: 'Portals & Community',
    links: [
      { label: 'Client Login',     href: '/login' },
      { label: 'AP Team Login',    href: '/admin-login' },
      { label: 'Freelancer Login', href: '/freelancer' },
      { label: 'Printers Login',   href: '/printer-login' },
    ],
  },
  {
    heading: 'Follow Us',
    links: [
      { label: 'Facebook',  href: '#' },
      { label: 'Twitter',   href: '#' },
      { label: 'Instagram', href: '#' },
      { label: 'Pinterest', href: '#' },
      { label: 'Youtube',   href: '#' },
    ],
  },
];

const SOCIAL_ICONS = [
  { Icon: Facebook,  href: '#', color: '#1877f2', label: 'Facebook' },
  { Icon: Twitter,   href: '#', color: '#1da1f2', label: 'Twitter' },
  { Icon: Instagram, href: '#', color: '#e1306c', label: 'Instagram' },
  { Icon: Linkedin,  href: '#', color: '#0077b5', label: 'LinkedIn' },
  { Icon: Youtube,   href: '#', color: '#ff0000', label: 'Youtube' },
];

// Payment method pill badges
const PAYMENT_METHODS = [
  'Visa', 'Mastercard', 'RuPay', 'UPI', 'GPay', 'PhonePe',
  'Paytm', 'NetBanking', 'EMI', 'COD',
];

export function Footer() {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#061033] text-slate-300 border-t border-white/10">

      {/* ── Main columns ─────────────────────────────────────────────────── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-8">

          {/* Brand Info (Spans 2 columns on desktop) */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <AmazoprintLogo variant="header" className="brightness-0 invert h-9" />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Amazoprint is India's leading technology-powered custom printing platform. We deliver premium business cards, merchandise, marketing materials, and packaging with industry-leading precision and door-to-door delivery.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#f07000] flex-shrink-0">
                  <Phone size={13} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Toll-Free 24/7 Hotline</span>
                  <a href="tel:1800818808" className="font-bold text-white hover:text-[#f07000] transition-colors">1800 818 808</a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#f07000] flex-shrink-0">
                  <Mail size={13} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Customer Support</span>
                  <a href="mailto:support@amazoprint.in" className="font-bold text-white hover:text-[#f07000] transition-colors">support@amazoprint.in</a>
                </div>
              </div>
            </div>

            {/* Social Icons in Clean Circles */}
            <div className="pt-2">
              <div className="flex items-center gap-2.5">
                {SOCIAL_ICONS.map(({ Icon, href, color, label }) => (
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#f07000] border border-white/15 flex items-center justify-center transition-all hover:-translate-y-1 group"
                  >
                    <Icon
                      size={15}
                      className="text-white transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          {FOOTER_COLUMNS.slice(0, 3).map((col) => (
            <div key={col.heading}>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.16em] mb-5 border-b border-white/10 pb-2">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[12px] text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group font-medium"
                    >
                      <ArrowRight
                        size={10}
                        className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#f07000] flex-shrink-0"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Payment & Security */}
          <div className="space-y-5">
            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.16em] mb-4 border-b border-white/10 pb-2">
                Security & Trust
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                256-bit SSL encrypted checkout with multi-layer fraud protection.
              </p>
              <div className="space-y-2 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck size={14} /> 100% Guaranteed Quality
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Truck size={14} /> Pan-India Express Delivery
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                Payment Gateways
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <span
                    key={method}
                    className="text-[9px] font-black text-slate-200 bg-white/[0.08] border border-white/20 hover:border-white/40 hover:bg-white/[0.12] transition-colors px-2.5 py-1 rounded-md tracking-wider shadow-2xs"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10" />

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="w-full bg-[#040b24] py-6 pb-8 md:pb-6">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-xs font-semibold text-center md:text-left">
            © {new Date().getFullYear()} <strong className="text-white">Amazoprint Technologies</strong>. All Rights Reserved. Built for high performance printing.
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
