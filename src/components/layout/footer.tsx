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
      { label: 'About Us',    href: '/about' },
      { label: 'How To Order',href: '/how-to-order' },
      { label: 'Contact Us',  href: '/contact' },
      { label: 'Wishlist',    href: '/wishlist' },
      { label: 'Ticket',      href: '/ticket' },
    ],
  },
  {
    heading: 'Our Policy',
    links: [
      { label: 'Terms & Conditions',      href: '/terms' },
      { label: 'Privacy Policy',          href: '/privacy' },
      { label: 'Billing & Payments',      href: '/billing' },
      { label: 'Shipping Policy',         href: '/shipping' },
      { label: 'Refund and Returns Policy', href: '/refund' },
    ],
  },
  {
    heading: 'Connect Our Community',
    links: [
      { label: 'Client Login',      href: '/login' },
      { label: 'AP Team Login',     href: '/admin-login' },
      { label: 'Freelancer Login',  href: '/freelancer' },
      { label: 'Printers Login',    href: '/printer-login' },
    ],
  },
  {
    heading: 'Follow',
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
    <footer className="bg-[#0f1117] text-slate-300 border-t border-white/5">

      {/* ── Main columns ─────────────────────────────────────────────────── */}
      <div className="w-full px-3 sm:px-4 lg:px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">

          {/* Quick Links */}
          {FOOTER_COLUMNS.slice(0, 3).map((col) => (
            <div key={col.heading}>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.18em] mb-5 border-b border-white/10 pb-2">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[12px] text-slate-400 hover:text-[#8b8bb3] transition-colors flex items-center gap-1.5 group"
                    >
                      <ArrowRight
                        size={10}
                        className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#464674] flex-shrink-0"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Follow column */}
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.18em] mb-5 border-b border-white/10 pb-2">
              Follow
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_COLUMNS[3].links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-slate-400 hover:text-[#8b8bb3] transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight
                      size={10}
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#464674] flex-shrink-0"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Social — spans 2 cols */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-5">
            {/* Newsletter */}
            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.18em] mb-4">
                Sign up to our newsletter
              </h4>
              {subscribed ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-[12px] text-emerald-400 font-bold">
                  ✅ You're subscribed! Thank you.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[12px] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#464674]/60 focus:bg-white/8 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-[#464674] hover:bg-[#5c5c96] text-white rounded-xl px-3.5 py-2.5 flex items-center gap-1.5 text-[12px] font-bold transition-all hover:-translate-y-0.5 flex-shrink-0"
                  >
                    <Send size={13} />
                  </button>
                </form>
              )}
            </div>

            {/* Follow Us social icons */}
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-[0.18em] mb-3">
                Follow as
              </p>
              <div className="flex flex-wrap gap-2.5">
                {SOCIAL_ICONS.map(({ Icon, href, color, label }) => (
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:border-white/20 group"
                  >
                    <Icon
                      size={15}
                      className="text-slate-400 group-hover:text-white transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Payment methods */}
             <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
                We Accept
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <span
                    key={method}
                    className="text-[9px] font-black text-slate-400 bg-white/5 border border-white/10 px-2 py-1 rounded-md tracking-wide"
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
      <div className="border-t border-white/5" />

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left: trust items */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-5">
            {[
              { Icon: ShieldCheck, text: 'Secure Payments',   color: 'text-emerald-400' },
              { Icon: Truck,       text: 'Pan-India Shipping', color: 'text-blue-400' },
              { Icon: CreditCard,  text: 'Multiple Gateways', color: 'text-violet-400' },
            ].map(({ Icon, text, color }) => (
              <div key={text} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <Icon size={13} className={color} />
                {text}
              </div>
            ))}
          </div>

          {/* Right: copyright */}
          <p className="text-slate-500 text-[11px] font-semibold text-center md:text-right">
            © {new Date().getFullYear()} Amazoprint | All Right Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
