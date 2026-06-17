'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Palette,
  ShieldCheck,
  Zap,
  Star,
  IndianRupee,
  CheckCircle2,
  Users,
  Globe,
  ShoppingCart,
  Clock,
  Award,
  Printer,
  LayoutGrid,
  Package,
  ChevronRight,
  Monitor,
  CheckCheck,
  Truck,
  CreditCard,
  Search,
  BadgeCheck,
  PenTool,
  MessageSquare,
  Flame,
  Gift,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn, resolveImagePath } from '@/lib/utils';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

// ─── Animation helpers ───────────────────────────────────────────────────────
const FU = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] },
});

const FI = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

// ─── Product category icons ──────────────────────────────────────────────────
const CATEGORIES = [
  { emoji: '🪪', name: 'Business Cards', from: '₹149', bg: 'from-blue-50 to-sky-100', dot: 'bg-blue-500' },
  { emoji: '📄', name: 'Flyers', from: '₹199', bg: 'from-orange-50 to-amber-100', dot: 'bg-orange-500' },
  { emoji: '📋', name: 'Brochures', from: '₹299', bg: 'from-violet-50 to-purple-100', dot: 'bg-violet-500' },
  { emoji: '⭐', name: 'Stickers', from: '₹99', bg: 'from-yellow-50 to-lime-100', dot: 'bg-yellow-500' },
  { emoji: '🖼️', name: 'Posters', from: '₹149', bg: 'from-green-50 to-emerald-100', dot: 'bg-emerald-500' },
  { emoji: '🏳️', name: 'Banners', from: '₹249', bg: 'from-red-50 to-rose-100', dot: 'bg-red-500' },
  { emoji: '📦', name: 'Packaging', from: '₹499', bg: 'from-amber-50 to-orange-100', dot: 'bg-amber-600' },
  { emoji: '👕', name: 'T-Shirts', from: '₹399', bg: 'from-pink-50 to-fuchsia-100', dot: 'bg-pink-500' },
];

const HOW_STEPS = [
  { n: '01', icon: <Search size={26} />, label: 'Choose Product', desc: 'Pick from 500+ print products across categories.', grad: 'from-blue-500 to-blue-600' },
  { n: '02', icon: <PenTool size={26} />, label: 'Customize Design', desc: 'Use our drag-and-drop studio or upload your own artwork.', grad: 'from-violet-500 to-purple-600' },
  { n: '03', icon: <ShoppingCart size={26} />, label: 'Place Order', desc: 'Instant quotes, pick a printer, pay securely.', grad: 'from-emerald-500 to-teal-600' },
  { n: '04', icon: <Truck size={26} />, label: 'Receive Delivery', desc: 'Pan-India delivery, tracked right to your door.', grad: 'from-orange-500 to-red-500' },
];

const TESTIMONIALS = [
  { name: 'Ravi Sharma', role: 'Marketing Head, TechNova', rating: 5, text: 'Amazing quality and super fast delivery. AmazoPrint is now our go-to for all business printing needs.' },
  { name: 'Priya Nair', role: 'Founder, Creative Lab', rating: 5, text: 'The design studio is incredibly easy to use. Got my brochures done in minutes — quality exceeded expectations!' },
  { name: 'Arjun Mehta', role: 'Graphic Designer', rating: 5, text: 'Great platform for designers. I earn consistently through template sales and verification jobs.' },
  { name: 'Sneha Reddy', role: 'Event Manager', rating: 5, text: 'Ordered banners and stickers for my event — absolutely loved the output and speed of delivery!' },
  { name: 'Deepak Joshi', role: 'SMB Owner', rating: 4, text: 'Very affordable pricing and great support team. Been a regular customer for 6 months now.' },
];

// ─────────────────────────────────────────────────────────────────────────────
export function HomeClient({
  subProducts,
  directSellingProducts,
}: {
  subProducts: any[];
  directSellingProducts: any[];
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      <main className="flex-1">

        {/* ═══════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0d1d6e] via-[#1535a0] to-[#2957d4] pt-14 pb-0">
          {/* Background blobs */}
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blue-300/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }} />

          {/* Trust badge */}
          <div className="flex justify-center mb-8">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              India's Most Trusted Printing Ecosystem
            </motion.span>
          </div>

          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
              {/* ── LEFT: Copy ── */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="pb-16 space-y-7"
              >
                <div className="space-y-3">
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white tracking-tight leading-[1.1]">
                    <span className="text-yellow-400">Print</span> Anything,{' '}
                    <br className="hidden sm:block" />
                    Design{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                      Everything.
                    </span>
                  </h1>
                  <p className="text-blue-100/80 text-base md:text-lg font-medium max-w-md leading-relaxed">
                    Create stunning designs, get instant quotes, connect with verified printers, and get your products delivered anywhere.
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 px-7 rounded-xl text-sm font-bold bg-yellow-400 hover:bg-yellow-300 text-gray-900 border-none shadow-2xl shadow-yellow-400/30 group"
                  >
                    <Link href="/products" className="flex items-center gap-2">
                      Start Designing
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="h-12 px-7 rounded-xl text-sm font-bold bg-white/10 border-white/25 hover:bg-white/20 text-white backdrop-blur-sm"
                  >
                    <Link href="/products" className="flex items-center gap-2">
                      <Printer size={15} />
                      Get Print Quotes
                    </Link>
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {[
                    { icon: <ShoppingCart size={16} />, val: '10,000+', lbl: 'Orders' },
                    { icon: <Printer size={16} />, val: '2,000+', lbl: 'Verified Printers' },
                    { icon: <PenTool size={16} />, val: '5,000+', lbl: 'Designers' },
                    { icon: <BadgeCheck size={16} />, val: '98%', lbl: 'Satisfaction' },
                  ].map((s) => (
                    <div
                      key={s.lbl}
                      className="flex items-center gap-2.5 bg-white/8 rounded-2xl px-3 py-2.5 border border-white/10 backdrop-blur-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-white font-black text-sm leading-tight">{s.val}</p>
                        <p className="text-blue-200/70 text-[10px] font-medium">{s.lbl}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ── RIGHT: Mockup ── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="relative flex items-end justify-center"
              >
                <div className="relative w-full max-w-[520px] mx-auto">
                  {/* Floating badge — left */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-10 -left-4 z-20 bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white flex-shrink-0">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Grand Opening</p>
                      <p className="text-sm font-black text-gray-900">Flat 30% OFF 🎉</p>
                    </div>
                  </motion.div>

                  {/* Floating badge — right */}
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                    className="absolute top-16 -right-6 z-20 bg-white rounded-2xl shadow-2xl px-4 py-3 border border-gray-100"
                  >
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Premium Quality</p>
                    <p className="text-sm font-black text-blue-600">We Print, You Grow 🚀</p>
                  </motion.div>

                  {/* Main studio card */}
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-t-3xl pt-8 px-6 overflow-hidden">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                      {/* Browser chrome */}
                      <div className="bg-gray-50 border-b border-gray-100 px-3 py-2.5 flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white rounded-md h-5 border border-gray-200 ml-2 flex items-center px-2">
                          <span className="text-[9px] text-gray-400 font-medium">amazoprint.in/design-studio</span>
                        </div>
                      </div>
                      {/* Studio body */}
                      <div className="p-5 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-[200px] flex items-center justify-center">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                            <Palette size={30} className="text-white" />
                          </div>
                          <h3 className="text-lg font-black text-gray-900">AmazoPrint Studio</h3>
                          <p className="text-xs text-gray-400 font-medium">Design. Customize. Order.</p>
                          <div className="flex gap-2 justify-center flex-wrap">
                            {['Business Cards', 'Banners', 'Brochures', 'T-Shirts'].map((t) => (
                              <span key={t} className="text-[9px] bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-full border border-blue-100">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: COMPLETE ECOSYSTEM
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            <motion.div {...FU()} className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full mb-3">
                <Globe size={12} /> One Platform — Three Pillars
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
                A Complete Printing Ecosystem
              </h2>
              <p className="text-gray-500 font-medium text-base max-w-xl mx-auto leading-relaxed">
                Connecting Customers, Printers & Designers in one seamless, powerful platform.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  grad: 'from-blue-500 to-sky-600',
                  shadow: 'shadow-blue-500/20',
                  ring: 'ring-blue-100',
                  bg: 'bg-blue-50/60',
                  icon: <ShoppingCart size={28} />,
                  label: 'Customers',
                  desc: 'Order premium print products with ease — online, fast, and fully tracked.',
                  points: ['Design online, no software', 'Choose products & quantities', 'Track orders in real time', 'Doorstep delivery pan India'],
                  href: '/products',
                  cta: 'Explore Products',
                  btnCls: 'bg-blue-600 hover:bg-blue-700 text-white',
                },
                {
                  grad: 'from-violet-500 to-indigo-600',
                  shadow: 'shadow-violet-500/20',
                  ring: 'ring-violet-100',
                  bg: 'bg-violet-50/60',
                  icon: <Printer size={28} />,
                  label: 'Print Partners',
                  desc: 'Receive verified print jobs directly to your dashboard and grow your press business.',
                  points: ['Receive printing orders', 'Manage production workflow', 'Update order status live', 'Grow business & earn more'],
                  href: '/printer-registration',
                  cta: 'Join as Printer',
                  btnCls: 'bg-violet-600 hover:bg-violet-700 text-white',
                },
                {
                  grad: 'from-emerald-500 to-teal-600',
                  shadow: 'shadow-emerald-500/20',
                  ring: 'ring-emerald-100',
                  bg: 'bg-emerald-50/60',
                  icon: <PenTool size={28} />,
                  label: 'Creative Designers',
                  desc: 'Turn creativity into income — sell templates, earn on contests, build your portfolio.',
                  points: ['Sell design templates', 'Earn from contests', 'Verify customer designs', 'Build reputation & clients'],
                  href: '/freelancer/verifications',
                  cta: 'Join as Designer',
                  btnCls: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                },
              ].map((p, i) => (
                <motion.div key={i} {...FU(i * 0.08)}>
                  <div className={cn('rounded-3xl p-7 h-full flex flex-col gap-5 border ring-1 hover:shadow-xl transition-all duration-300', p.ring, p.bg)}>
                    {/* Icon */}
                    <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg flex-shrink-0', p.grad, p.shadow)}>
                      {p.icon}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-black text-gray-900">{p.label}</h3>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">{p.desc}</p>
                    </div>
                    <ul className="space-y-2">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-center gap-2.5 text-sm text-gray-600 font-medium">
                          <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <Button asChild size="sm" className={cn('w-full rounded-xl h-10 text-xs font-bold border-none shadow group', p.btnCls)}>
                      <Link href={p.href} className="flex items-center justify-center gap-1.5">
                        {p.cta} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: POPULAR PRODUCTS
        ═══════════════════════════════════════════════════════════ */}
        <section className="overflow-hidden bg-white">

          {/* ── Dark header band ────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 relative overflow-hidden">
            {/* Dot-grid texture */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }}
            />
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Title + pill scroller */}
            <div className="max-w-screen-xl mx-auto px-4 lg:px-6 pt-16 pb-10 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <motion.div {...FU()}>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/70 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                    <Flame size={11} className="text-orange-400" /> Best Sellers · 2025
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                    Popular<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      Products
                    </span>
                  </h2>
                  <p className="text-gray-400 font-medium mt-3 text-sm max-w-xs leading-relaxed">
                    Handpicked bestsellers — premium print quality at unbeatable prices.
                  </p>
                </motion.div>

                {/* Category pills */}
                <motion.div {...FU(0.1)} className="flex flex-wrap gap-2 md:max-w-md">
                  {CATEGORIES.map((c, i) => (
                    <Link
                      key={c.name}
                      href="/products"
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-100',
                        i === 0
                          ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                      )}
                    >
                      <span className="text-sm leading-none">{c.emoji}</span>
                      {c.name}
                    </Link>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Category emoji cards */}
            <div className="pb-12 relative z-10">
              <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {CATEGORIES.map((c, i) => (
                    <motion.div key={c.name} {...FI(i * 0.04)}>
                      <Link href="/products" className="group block">
                        <div className={cn(
                          'relative rounded-2xl p-4 text-center overflow-hidden transition-all duration-300',
                          'hover:-translate-y-2 hover:shadow-2xl cursor-pointer border border-white/5 bg-gradient-to-br',
                          c.bg
                        )}>
                          <div className="text-3xl mb-2.5 drop-shadow">{c.emoji}</div>
                          <p className="text-[11px] font-black text-gray-800 leading-tight mb-2">{c.name}</p>
                          <span className={cn('inline-block text-[9px] text-white font-bold px-2.5 py-0.5 rounded-full', c.dot)}>
                            from {c.from}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Magazine-style product grid ─────────────────────────── */}
          {subProducts && subProducts.length > 0 && (
            <div className="bg-white pt-14 pb-20">
              <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
                {/* Sub-header */}
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Featured Items</h3>
                    <p className="text-sm text-gray-400 font-medium mt-0.5">Ready to order · Delivered fast</p>
                  </div>
                  <Button
                    variant="outline"
                    asChild
                    className="hidden md:flex items-center gap-1.5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm h-9"
                  >
                    <Link href="/products">Browse All <ArrowRight size={14} /></Link>
                  </Button>
                </div>

                {/* Editorial grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {subProducts.slice(0, 10).map((sp: any, i: number) => {
                    const price = Number(sp.price || 0);
                    const imgUrl = resolveImagePath(sp.imageUrl || sp.parentProductImageUrl);
                    const isWide = i === 0 || i === 5; // first + sixth span 2 cols

                    return (
                      <motion.div
                        key={sp.id}
                        {...FU(i * 0.04)}
                        className={cn(isWide ? 'md:col-span-2' : '')}
                      >
                        <Link
                          href={`/design/${sp.productSlug}/start?subProductId=${sp.id}`}
                          className="group block h-full"
                        >
                          <div className="relative h-full rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 bg-gray-100">

                            {/* Image */}
                            <div className={cn('relative overflow-hidden', isWide ? 'aspect-[2/1]' : 'aspect-square')}>
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={sp.name}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                  <Palette className="w-10 h-10 text-gray-300" />
                                </div>
                              )}

                              {/* Dark overlay gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                              {/* Hot / UV badges */}
                              <div className="absolute top-3 left-3 flex gap-1.5">
                                {i < 3 && (
                                  <span className="text-[9px] font-black text-white bg-orange-500 px-2 py-0.5 rounded-full">
                                    🔥 Hot
                                  </span>
                                )}
                                {sp.spotUvAllowed && (
                                  <span className="text-[9px] font-black text-white bg-violet-600 px-2 py-0.5 rounded-full">
                                    UV Coat
                                  </span>
                                )}
                              </div>

                              {/* Quick Order CTA — slides up on hover */}
                              <div className="absolute inset-x-3 bottom-[54px] flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-xl backdrop-blur-sm">
                                  <ShoppingCart size={12} /> Quick Order
                                </span>
                              </div>

                              {/* Name + category over image */}
                              <div className="absolute bottom-0 inset-x-0 p-3.5">
                                <p className="text-white font-black text-sm leading-tight line-clamp-1 drop-shadow-sm">
                                  {sp.name}
                                </p>
                                <p className="text-white/55 text-[10px] font-medium truncate mt-0.5">
                                  {sp.productName}
                                </p>
                              </div>
                            </div>

                            {/* Price strip */}
                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-white">
                              <div className="flex items-center gap-1.5">
                                <IndianRupee size={12} className="text-blue-600" />
                                <span className="text-sm font-black text-blue-600">
                                  {price > 0 ? price.toFixed(0) : '—'}
                                </span>
                                {price > 0 && (
                                  <span className="text-[10px] text-gray-300 font-medium line-through">
                                    ₹{(price * 1.3).toFixed(0)}
                                  </span>
                                )}
                                {price > 0 && (
                                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                                    30% OFF
                                  </span>
                                )}
                              </div>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" title="In Stock" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mobile: view all */}
                <div className="mt-8 flex justify-center md:hidden">
                  <Button asChild variant="outline" className="rounded-xl border-gray-200 font-bold h-11 px-8">
                    <Link href="/products" className="flex items-center gap-1.5">
                      Browse All Products <ArrowRight size={15} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: DESIGN STUDIO
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              {/* Text */}
              <motion.div {...FU()} className="space-y-6">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full border border-blue-100">
                  <Monitor size={12} /> Powerful Online Design Studio
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  Professional Design{' '}
                  <span className="text-blue-600">Studio</span>{' '}
                  in Your Browser
                </h2>
                <p className="text-gray-500 font-medium leading-relaxed text-base">
                  No software to install. Create, customize and preview your items in real time with our powerful drag & drop design studio.
                </p>
                <div className="space-y-3">
                  {[
                    'Thousands of ready-to-use templates',
                    'Millions of images, icons & graphics',
                    'Custom text, fonts & brand kit',
                    'Real-time product preview',
                    '300 DPI export ready for print',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CheckCheck size={11} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild size="lg" className="h-11 px-7 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 group">
                    <Link href="/design" className="flex items-center gap-2">
                      Open Design Studio <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="h-11 px-7 rounded-xl text-sm font-bold border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Link href="/templates" className="flex items-center gap-2">
                      <LayoutGrid size={15} /> Explore Templates
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Studio mockup */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-gray-200/80">
                  {/* Browser bar */}
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map((c) => (
                        <div key={c} className={cn('w-2.5 h-2.5 rounded-full', c)} />
                      ))}
                    </div>
                    <div className="flex-1 bg-white rounded-lg h-6 border border-gray-200 flex items-center px-2.5 mx-2">
                      <span className="text-[10px] text-gray-400 font-medium">amazoprint.in/design/business-card</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-md">Save</span>
                      <span className="text-[10px] font-bold text-white bg-blue-600 px-2.5 py-1 rounded-md">Preview</span>
                    </div>
                  </div>
                  {/* Editor grid */}
                  <div className="grid grid-cols-4 min-h-[280px]">
                    {/* Sidebar */}
                    <div className="col-span-1 bg-gray-50 border-r border-gray-100 p-3 space-y-1">
                      {['Templates', 'Photos', 'Elements', 'Text', 'Uploads', 'Shapes'].map((t, idx) => (
                        <div
                          key={t}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all',
                            idx === 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                          )}
                        >
                          <LayoutGrid size={11} />
                          <span className="text-[10px] font-bold">{t}</span>
                        </div>
                      ))}
                    </div>
                    {/* Canvas */}
                    <div className="col-span-2 bg-gray-200 flex items-center justify-center p-4">
                      <div className="w-full aspect-[1.75/1] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                          <div>
                            <p className="text-white font-black text-xs">JAMES ANDERSON</p>
                            <p className="text-blue-200 text-[8px] font-medium">Creative Director</p>
                          </div>
                          <div>
                            <p className="text-blue-100 text-[7px]">+91 98XXX XXXXX</p>
                            <p className="text-blue-100 text-[7px]">james@studio.com</p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                          <Sparkles size={14} className="text-white" />
                        </div>
                      </div>
                    </div>
                    {/* Properties */}
                    <div className="col-span-1 bg-gray-50 border-l border-gray-100 p-3 space-y-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Properties</p>
                      <div className="space-y-2">
                        {[['Size', '3.5 × 2 in'], ['Qty', '250 Units'], ['Paper', '350 GSM'], ['Finish', 'Matte']].map(([l, v]) => (
                          <div key={l} className="flex justify-between items-center bg-white rounded-lg px-2 py-1.5 border border-gray-100">
                            <span className="text-[9px] text-gray-400 font-medium">{l}</span>
                            <span className="text-[9px] font-black text-gray-700">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-blue-600 rounded-xl p-2.5 text-center mt-2">
                        <p className="text-[9px] text-blue-200 font-medium">Total Price</p>
                        <p className="text-base font-black text-white">₹249</p>
                        <button className="w-full mt-1.5 text-[9px] font-black text-blue-600 bg-white rounded-lg py-1 hover:bg-blue-50 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: HOW IT WORKS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 relative z-10">
            <motion.div {...FU()} className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full mb-3">
                <Zap size={12} className="text-yellow-300" /> Simple 4-Step Process
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                How AmazoPrint Works
              </h2>
              <p className="text-blue-200 font-medium text-base max-w-lg mx-auto">
                From choosing a product to receiving it at your door — fast, simple, and reliable.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
              {HOW_STEPS.map((s, i) => (
                <motion.div key={i} {...FU(i * 0.1)} className="relative">
                  {/* Connector arrow */}
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden lg:flex absolute top-8 left-[calc(100%-8px)] z-10 items-center justify-center w-8">
                      <ArrowRight className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                  <div className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4 hover:bg-white/15 transition-colors">
                    <div className="relative">
                      <div className={cn('w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-xl', s.grad)}>
                        {s.icon}
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-blue-700 text-[10px] font-black flex items-center justify-center shadow-lg">
                        {s.n}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base mb-1.5">{s.label}</h3>
                      <p className="text-blue-200/80 text-xs font-medium leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: STATS BAND
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-14 bg-white border-y border-gray-100">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-gray-100">
              {[
                { icon: <ShoppingCart size={22} className="text-blue-600" />, bg: 'bg-blue-50', val: '10,000+', lbl: 'Orders Completed' },
                { icon: <Clock size={22} className="text-indigo-600" />, bg: 'bg-indigo-50', val: '2,000+', lbl: 'Verified Printers' },
                { icon: <Users size={22} className="text-violet-600" />, bg: 'bg-violet-50', val: '5,000+', lbl: 'Creative Designers' },
                { icon: <Globe size={22} className="text-emerald-600" />, bg: 'bg-emerald-50', val: '500+', lbl: 'Cities Served' },
                { icon: <Award size={22} className="text-yellow-600" />, bg: 'bg-yellow-50', val: '98%', lbl: 'Satisfaction Rate' },
              ].map((s, i) => (
                <motion.div key={i} {...FI(i * 0.08)} className="flex flex-col items-center text-center gap-2.5 px-4">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', s.bg)}>{s.icon}</div>
                  <p className="text-2xl font-black text-gray-900">{s.val}</p>
                  <p className="text-xs text-gray-500 font-medium leading-tight">{s.lbl}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: TESTIMONIALS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            <motion.div {...FU()} className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-600 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full mb-3 border border-yellow-100">
                <Star size={12} className="fill-yellow-400 text-yellow-400" /> 4.9 / 5 Rating
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
                What Our Customers Say
              </h2>
              <p className="text-gray-500 font-medium text-base max-w-lg mx-auto">
                Trusted by 10,000+ businesses, designers and individuals across India.
              </p>
            </motion.div>

            <Carousel
              opts={{ align: 'start', loop: true }}
              plugins={[Autoplay({ delay: 5000 })]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {TESTIMONIALS.map((t, i) => {
                  const initials = t.name.split(' ').map((n) => n[0]).join('');
                  const grad = ['from-blue-500 to-blue-600', 'from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-red-500', 'from-pink-500 to-rose-600'][i % 5];
                  return (
                    <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col gap-4">
                        <div className="flex gap-0.5">
                          {Array(5).fill(0).map((_, j) => (
                            <Star key={j} size={14} className={j < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                          ))}
                        </div>
                        <div className="text-gray-400 opacity-40 flex-shrink-0">
                          <MessageSquare size={24} />
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed flex-1">{t.text}</p>
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                          <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br text-white text-sm font-black flex items-center justify-center flex-shrink-0', grad)}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{t.name}</p>
                            <p className="text-[11px] text-gray-400 font-medium">{t.role}</p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="flex items-center justify-center gap-3 mt-8">
                <CarouselPrevious className="static translate-y-0 h-9 w-9 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all" />
                <CarouselNext className="static translate-y-0 h-9 w-9 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: PLATFORM FEATURES
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              {/* Left: Feature grid */}
              <motion.div {...FU()} className="space-y-8">
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full border border-blue-100 mb-3">
                    <Sparkles size={12} /> AmazoPrint Platform
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
                    Your One-Stop{' '}
                    <span className="text-blue-600">Printing Marketplace</span>
                  </h2>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    From business cards to packaging — premium prints at competitive prices, delivered anywhere in India.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Palette size={18} />, label: '500+ Products', col: 'text-blue-600 bg-blue-50' },
                    { icon: <Printer size={18} />, label: 'Verified Printers', col: 'text-indigo-600 bg-indigo-50' },
                    { icon: <Zap size={18} />, label: 'Instant Quotes', col: 'text-yellow-600 bg-yellow-50' },
                    { icon: <Truck size={18} />, label: 'Pan India Delivery', col: 'text-emerald-600 bg-emerald-50' },
                    { icon: <ShieldCheck size={18} />, label: 'Quality Assured', col: 'text-violet-600 bg-violet-50' },
                    { icon: <CreditCard size={18} />, label: 'Secure Payments', col: 'text-pink-600 bg-pink-50' },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', f.col)}>
                        {f.icon}
                      </div>
                      <p className="text-sm font-bold text-gray-800">{f.label}</p>
                    </div>
                  ))}
                </div>
                <Button asChild size="lg" className="h-12 px-8 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 group">
                  <Link href="/products" className="flex items-center gap-2">
                    Start Ordering Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>

              {/* Right: Phone mockup */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="flex justify-center items-center"
              >
                <div className="relative">
                  {/* Phone shell */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-2.5 shadow-2xl">
                    <div className="bg-white rounded-[2.5rem] overflow-hidden w-[240px]">
                      {/* Status bar */}
                      <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                        <span className="text-[10px] text-white font-black">AmazoPrint</span>
                        <div className="flex gap-1">
                          {[60, 80, 100].map((o) => (
                            <div key={o} className={`w-1 h-1 rounded-full bg-white/${o}`} />
                          ))}
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-xs font-black text-gray-900">Hi there 👋</p>
                          <p className="text-[10px] text-gray-400 font-medium">What do you want to print?</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl flex items-center gap-2 px-3 py-2 border border-gray-200">
                          <Search size={11} className="text-gray-400" />
                          <span className="text-[10px] text-gray-300">Search products...</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['🪪 Cards', '📄 Flyers', '📦 Boxes', '👕 Shirts'].map((item) => (
                            <div key={item} className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                              <span className="text-[10px] font-bold text-gray-600">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-black text-white">🎉 30% OFF Today!</p>
                          <p className="text-[9px] text-blue-200 font-medium mt-0.5">Limited time offer</p>
                        </div>
                        <div className="space-y-2">
                          {[
                            { name: 'Business Card', price: '₹149', tag: '🔥 Hot' },
                            { name: 'Custom Banner', price: '₹299', tag: '⭐ New' },
                          ].map((p) => (
                            <div key={p.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                              <span className="text-[10px] font-bold text-gray-700">{p.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-blue-600">{p.price}</span>
                                <span className="text-[8px] bg-orange-50 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">{p.tag}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating notification */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -right-14 top-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 max-w-[140px]"
                  >
                    <p className="text-[10px] font-black text-gray-900">Order Ready! 🎉</p>
                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">Dispatch in 2 hrs</p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div className="h-full w-4/5 bg-emerald-500 rounded-full" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: FINAL CTA
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 relative z-10 text-center">
            <motion.div {...FU()} className="max-w-3xl mx-auto space-y-8">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide px-4 py-2 rounded-full">
                <Sparkles size={14} className="text-yellow-300" />
                Start Your Print Journey Today
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Ready to Create{' '}
                <br className="hidden md:block" />
                <span className="text-yellow-300">Something Amazing?</span>
              </h2>
              <p className="text-blue-100 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                Join 10,000+ businesses and designers who trust AmazoPrint for premium quality printing across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" asChild className="h-14 px-10 rounded-2xl text-base font-black bg-yellow-400 hover:bg-yellow-300 text-gray-900 border-none shadow-2xl shadow-yellow-400/30 group">
                  <Link href="/register" className="flex items-center gap-2">
                    Get Started Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-14 px-10 rounded-2xl text-base font-bold bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                  <Link href="/products">Browse Products</Link>
                </Button>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                {['🔒 Secure Payments', '✅ 100% Quality', '⭐ 98% Satisfaction', '🚀 Fast Delivery'].map((t) => (
                  <span key={t} className="text-[12px] font-bold text-blue-200">{t}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
