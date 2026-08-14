'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Palette,
  ShieldCheck,
  Zap,
  Star,
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
  Tag,
  Megaphone,
  ChevronLeft,
  Eye,
  Gift,
  Phone,
  Mail,
  MapPin,
  ThumbsUp,
  RefreshCw,
  Layers,
  Store,
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

// ─── Data ────────────────────────────────────────────────────────────────────
const PROMO_ITEMS = [
  '🎉 Grand Opening Sale — Flat 30% OFF on all orders above ₹500',
  '🚚 FREE PAN-INDIA SHIPPING on orders above ₹999',
  '🖨️ Same-day dispatch for orders placed before 12 PM',
  '⭐ Use code AMAZO10 for extra 10% off your first order',
  '🎨 500+ Premium Design Templates — now FREE with every order!',
];

const ALL_CATEGORIES = [
  { emoji: '🪪', name: 'Business Cards', bg: '#4e46e5', light: '#ede9fe' },
  { emoji: '✉️', name: 'Invitations',   bg: '#db2777', light: '#fce7f3' },
  { emoji: '📄', name: 'Flyers',         bg: '#f97316', light: '#fff7ed' },
  { emoji: '✉️', name: 'Envelopes',      bg: '#0891b2', light: '#ecfeff' },
  { emoji: '🏷️', name: 'Labels',         bg: '#16a34a', light: '#dcfce7' },
  { emoji: '🏳️', name: 'Banners',        bg: '#dc2626', light: '#fef2f2' },
  { emoji: '⭐', name: 'Stickers',       bg: '#ca8a04', light: '#fefce8' },
  { emoji: '📅', name: 'Calendar',       bg: '#7c3aed', light: '#f5f3ff' },
  { emoji: '🖼️', name: 'Posters',        bg: '#059669', light: '#d1fae5' },
  { emoji: '🖼️', name: 'Photo Frames',   bg: '#9333ea', light: '#faf5ff' },
  { emoji: '🗺️', name: 'Photo Maps',     bg: '#2563eb', light: '#eff6ff' },
  { emoji: '👕', name: 'T-Shirts',       bg: '#e11d48', light: '#fff1f2' },
  { emoji: '🎁', name: 'Gifts',          bg: '#d97706', light: '#fffbeb' },
  { emoji: '📦', name: 'Printing Blanks',bg: '#64748b', light: '#f8fafc' },
];

const HOW_STEPS = [
  { n: '01', icon: <Search size={22} />, label: 'Choose Product',   desc: 'Pick from 500+ print products across categories.', col: 'from-[#464674] to-[#5c5c96]' },
  { n: '02', icon: <PenTool size={22} />,  label: 'Customize Design', desc: 'Use our drag-and-drop studio or upload your own artwork.', col: 'from-violet-500 to-purple-600' },
  { n: '03', icon: <ShoppingCart size={22} />, label: 'Place Order',  desc: 'Instant quotes, pick a printer, pay securely.', col: 'from-emerald-500 to-teal-600' },
  { n: '04', icon: <Truck size={22} />,    label: 'Receive Delivery', desc: 'Pan-India delivery, tracked right to your door.', col: 'from-orange-500 to-red-500' },
];

const TESTIMONIALS = [
  { name: 'Ravi Sharma',  role: 'Marketing Head, TechNova',    rating: 5, text: 'Amazing quality and super fast delivery. AmazoPrint is now our go-to for all business printing needs.' },
  { name: 'Priya Nair',   role: 'Founder, Creative Lab',       rating: 5, text: 'The design studio is incredibly easy to use. Got my brochures done in minutes — quality exceeded expectations!' },
  { name: 'Arjun Mehta',  role: 'Graphic Designer',            rating: 5, text: 'Great platform for designers. I earn consistently through template sales and verification jobs.' },
  { name: 'Sneha Reddy',  role: 'Event Manager',               rating: 5, text: 'Ordered banners and stickers for my event — absolutely loved the output and speed of delivery!' },
  { name: 'Deepak Joshi', role: 'SMB Owner',                   rating: 4, text: 'Very affordable pricing and great support team. Been a regular customer for 6 months now.' },
];

const ECOSYSTEM_TABS = [
  {
    id: 'studio',
    label: 'Design Studio',
    heading: 'Pro-level design tool in your browser',
    description: 'Create, customize, and preview your artwork in real-time. No design experience or expensive software installation required.',
    ctaText: 'Open Design Studio',
    ctaHref: '/design',
    subFeatures: [
      { title: 'Interactive Canvas', desc: 'Drag-and-drop text, images, shapes, and layer them dynamically.' },
      { title: 'Thousands of Templates', desc: 'Start with high-quality designs crafted by design professionals.' },
      { title: '300 DPI High-Res Export', desc: 'Generate print-ready vector PDF formats for pixel-perfect clarity.' },
      { title: 'Bleed Safety Margin', desc: 'Real-time safety guides ensure your content is never clipped.' },
    ],
  },
  {
    id: 'verification',
    label: 'Print Verification',
    heading: '100% Print-ready check, guaranteed',
    description: 'Ensure perfect print results before you pay. Our automated validation engine and expert designers review every layout file.',
    ctaText: 'Explore Templates',
    ctaHref: '/templates',
    subFeatures: [
      { title: 'Automated Pre-flight', desc: 'Checks image resolution, vector line thickness, and font outlines.' },
      { title: 'CMYK Color Space Audit', desc: 'Prevents color mismatches by checking ink values before press.' },
      { title: 'Bleed & Margin Safety', desc: 'Validates that safety zones and margins are properly formatted.' },
      { title: 'Expert Peer-Review', desc: 'Connect with a certified designer to manually verify your file.' },
    ],
  },
  {
    id: 'contests',
    label: 'Design Contests',
    heading: 'Crowdsource unique artwork concepts',
    description: 'Get custom layouts from our design community. Set a prize pool, receive entries, and select the ultimate winner.',
    ctaText: 'Browse Design Contests',
    ctaHref: '/contests',
    subFeatures: [
      { title: 'Launch in Minutes', desc: 'Publish your brief, upload brand assets, and choose your prize pool.' },
      { title: 'Dozens of Submissions', desc: 'Talented designers pitch unique mockups tailor-made for you.' },
      { title: 'Direct Collaboration', desc: 'Rate designs, leave critiques, and request adjustments.' },
      { title: 'Source File Delivery', desc: 'Download original vectors and trigger print queue on approval.' },
    ],
  },
  {
    id: 'printing',
    label: 'Print Fulfillment',
    heading: 'Direct-to-press print fulfillment engine',
    description: 'Our automated network routes jobs to top offset and digital print shops. Real-time production tracking right to your door.',
    ctaText: 'Become a Print Partner',
    ctaHref: '/printer-registration',
    subFeatures: [
      { title: 'Verified Press Network', desc: 'Only vetted commercial printers with high-capacity presses.' },
      { title: 'Industrial Finish Coatings', desc: 'Matte, gloss, spot UV, embossing, and custom die cuts.' },
      { title: 'Automated Order Routing', desc: 'Intelligent georouting matches orders for fast regional delivery.' },
      { title: 'Live Tracker Updates', desc: 'Follow progress through offset plates, print, cutting, and shipping.' },
    ],
  },
  {
    id: 'templates',
    label: 'Free Design Template',
    heading: 'Thousands of free premium templates',
    description: 'Start your print project instantly with our library of beautifully crafted, print-ready templates across every category.',
    ctaText: 'Browse Free Templates',
    ctaHref: '/templates',
    subFeatures: [
      { title: '10,000+ Templates', desc: 'Professionally designed for every industry and occasion.' },
      { title: 'Fully Customizable', desc: 'Edit text, colors, fonts, and images with our design studio.' },
      { title: 'Print-Ready Formats', desc: 'Every template exports at 300 DPI with proper bleed margins.' },
      { title: 'New Templates Weekly', desc: 'Our design team adds fresh templates every week for free.' },
    ],
  },
];

const PRODUCT_LINKS = [
  'Visiting Cards', 'Letterhead', 'Invitations', 'Stickers', 'Gifts',
  'Albums', 'Photo Print', 'Mug', 'T-Shirt', 'Envelope',
  'Pocket Cards', 'ID Cards', 'Brochure', 'Printed Books',
];

// ─── Studio Mockup ───────────────────────────────────────────────────────────
function StudioMockup() {
  return (
    <div className="w-full max-w-[460px] bg-slate-950/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Canvas Editor</span>
        <div className="w-8 h-2 bg-white/5 rounded-full" />
      </div>
      <div className="p-3 grid grid-cols-12 gap-2 min-h-[220px] bg-slate-950">
        <div className="col-span-3 space-y-1 border-r border-white/5 pr-2">
          {['Layouts', 'Text', 'Shapes', 'Uploads'].map((t, i) => (
            <div key={t} className={cn('text-[8px] font-black p-1.5 rounded cursor-pointer', i === 0 ? 'bg-[#464674] text-white' : 'text-gray-400 hover:text-white')}>
              {t}
            </div>
          ))}
          <div className="pt-3 space-y-1">
            <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest block">Layers</span>
            <div className="h-1 w-full bg-white/10 rounded-full" />
            <div className="h-1 w-3/4 bg-white/10 rounded-full" />
          </div>
        </div>
        <div className="col-span-9 flex items-center justify-center p-1.5 relative bg-slate-900 rounded-lg border border-white/5 overflow-hidden">
          <div className="w-full aspect-[1.75/1] bg-gradient-to-br from-[#464674] via-[#5c5c96] to-[#2f2f54] rounded-lg shadow-lg relative overflow-hidden p-3 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-black text-white tracking-wide">AMAZOPRINT</p>
                <p className="text-[5px] text-white/60 font-semibold uppercase tracking-widest">Premium Card</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles size={7} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-[7px] font-black text-white">Alexander Thorne</p>
              <p className="text-[5px] text-white/70">Co-Founder & CEO</p>
            </div>
            <div className="absolute inset-1.5 border border-dashed border-white/20 rounded pointer-events-none" />
            <span className="absolute bottom-1 right-2 text-[5px] text-white/30 tracking-widest font-mono">3.5 × 2.0 in</span>
          </div>
          <div className="absolute bottom-1.5 right-1.5 bg-slate-950/90 border border-white/10 rounded-md p-1 text-[6px] space-y-0.5">
            <p className="font-bold text-gray-400">Typography</p>
            <div className="flex gap-1">
              <span className="bg-[#464674] px-1 rounded text-white font-mono">Outfit Bold</span>
              <span className="bg-white/10 px-1 rounded text-gray-300">12px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationMockup() {
  return (
    <div className="w-full max-w-[460px] bg-slate-950/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Pre-flight Checklist</span>
        <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">CMYK</span>
      </div>
      <div className="p-4 space-y-3 bg-slate-950 min-h-[220px] flex flex-col justify-center">
        <div className="bg-slate-900 rounded-xl p-3 border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <p className="text-[9px] font-black text-white">File: business_card.pdf</p>
            <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">✓ Print Ready</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Bleed Margin', status: 'Passed' },
              { label: 'Color Format', status: 'CMYK ✓' },
              { label: 'Resolution', status: '340 DPI ✓' },
              { label: 'Fonts', status: 'Embedded ✓' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-950 p-1.5 rounded-md border border-white/5">
                <span className="text-[7px] text-gray-400 block">{item.label}</span>
                <span className="text-[8px] font-black text-emerald-400">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContestsMockup() {
  return (
    <div className="w-full max-w-[460px] bg-slate-950/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Active Design Quest</span>
        <span className="text-[8px] bg-yellow-500/20 text-yellow-400 font-black px-2 py-0.5 rounded-full">₹5,000</span>
      </div>
      <div className="p-4 space-y-3 bg-slate-950 min-h-[220px] flex flex-col justify-between">
        <div>
          <h4 className="text-[10px] font-black text-white">"Elite Brews Coffee Brand Logo"</h4>
          <p className="text-[7px] text-gray-400">14 Designers • 42 Entries • 3 Days Left</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { designer: 'Aravind K.', bg: 'from-amber-700 to-amber-950', sel: true },
            { designer: 'Shalini S.', bg: 'from-zinc-800 to-zinc-950', sel: false },
            { designer: 'Neil D.',    bg: 'from-stone-800 to-stone-950', sel: false },
          ].map((e, i) => (
            <div key={i} className={cn('rounded-lg border overflow-hidden bg-slate-900', e.sel ? 'border-[#464674]' : 'border-white/5')}>
              <div className={cn('aspect-square bg-gradient-to-br flex items-center justify-center relative', e.bg)}>
                <p className="text-[8px] font-black text-white">EB</p>
                {e.sel && <span className="absolute top-1 right-1 text-[5px] bg-[#464674] text-white px-1 rounded font-black">✓</span>}
              </div>
              <div className="px-1.5 py-1 flex justify-between text-[7px]">
                <span className="text-gray-400 truncate">{e.designer}</span>
                <span className="text-yellow-400">★5</span>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full text-[9px] font-black text-white bg-[#464674] hover:bg-[#5c5c96] py-1.5 rounded-lg transition-colors">Choose Winner & Print</button>
      </div>
    </div>
  );
}

function PrintingMockup() {
  return (
    <div className="w-full max-w-[460px] bg-slate-950/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Fulfillment Engine</span>
        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full">Live Routing</span>
      </div>
      <div className="p-4 space-y-3 bg-slate-950 min-h-[220px] flex flex-col justify-center">
        <div className="bg-slate-900 border border-white/5 rounded-xl p-3 space-y-2.5">
          <div className="flex justify-between text-[9px] font-black">
            <span className="text-white">Order: #ORD-7392</span>
            <span className="text-emerald-400">● Printing Live</span>
          </div>
          <div className="space-y-2">
            {[
              { step: 'Order Placed', done: true },
              { step: 'Routed to Press', done: true },
              { step: 'Production', done: false, cur: true },
              { step: 'Delivery Dispatch', done: false },
            ].map((s, i) => (
              <div key={i} className="flex gap-2 text-[8px] items-center">
                <div className={cn('w-3 h-3 rounded-full flex items-center justify-center font-bold text-[6px] flex-shrink-0', s.done ? 'bg-emerald-500 text-white' : s.cur ? 'bg-[#464674] text-white animate-pulse' : 'bg-white/10 text-gray-400')}>
                  {s.done ? '✓' : i + 1}
                </div>
                <span className={cn('font-bold', s.done || s.cur ? 'text-white' : 'text-gray-500')}>{s.step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatesMockup() {
  const templates = [
    { name: 'Business Card', bg: 'from-[#464674] to-[#5c5c96]', label: 'Classic' },
    { name: 'Flyer Design', bg: 'from-orange-500 to-red-500', label: 'Bold' },
    { name: 'Event Poster', bg: 'from-emerald-500 to-teal-600', label: 'Modern' },
    { name: 'Letterhead', bg: 'from-violet-500 to-purple-600', label: 'Pro' },
  ];
  return (
    <div className="w-full max-w-[460px] bg-slate-950/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Template Library</span>
        <span className="text-[8px] bg-[#464674]/30 text-[#8b8bb3] font-black px-2 py-0.5 rounded-full">10,000+ Free</span>
      </div>
      <div className="p-4 bg-slate-950 min-h-[220px]">
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-white/5 group cursor-pointer hover:border-[#464674]/60 transition-all">
              <div className={cn('aspect-[4/3] bg-gradient-to-br flex items-center justify-center', t.bg)}>
                <div className="text-center">
                  <p className="text-[8px] font-black text-white">{t.name}</p>
                  <p className="text-[6px] text-white/60">{t.label}</p>
                </div>
              </div>
              <div className="bg-slate-900 px-2 py-1.5 flex items-center justify-between">
                <span className="text-[8px] text-gray-300 font-bold">{t.name}</span>
                <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded font-black">FREE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Bar ─────────────────────────────────────────────────────────
function AnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-[#1a1a4e] via-[#464674] to-[#1a1a4e] text-white py-2 overflow-hidden relative">
      <div className="flex items-center">
        <motion.div
          animate={{ x: [0, -2000] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="flex items-center gap-12 whitespace-nowrap text-[11px] font-semibold tracking-wide"
        >
          {[...PROMO_ITEMS, ...PROMO_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {item}
              <span className="text-white/30 mx-3">|</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Hero Monitor Mockup (LEFT side) ─────────────────────────────────────────
function HeroMonitorMockup() {
  const steps = [
    { num: '1', label: 'Choose Your Brand Printing Product', color: 'bg-[#464674]' },
    { num: '2', label: 'Start Design & Check Corrections', color: 'bg-orange-500' },
    { num: '3', label: 'Add To Cart & Place Order',        color: 'bg-emerald-500' },
  ];
  return (
    <div className="relative flex items-end justify-center">
      {/* CUSTOMIZED DESIGN — vertical left label */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 hidden lg:flex">
        <span
          className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Customized Design
        </span>
      </div>

      {/* HIGH QUALITY PRINTING — vertical right label */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 hidden lg:flex">
        <span
          className="text-[9px] font-black text-white/60 uppercase tracking-[0.25em]"
          style={{ writingMode: 'vertical-rl' }}
        >
          High Quality Printing
        </span>
      </div>

      {/* Monitor frame */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-[460px] mx-8"
      >
        {/* Screen bezel */}
        <div className="bg-gradient-to-b from-[#2a2a5a] to-[#1a1a3e] rounded-2xl p-2 shadow-2xl shadow-[#464674]/40 border border-white/10">
          {/* Screen content */}
          <div className="bg-[#0d0d20] rounded-xl overflow-hidden">
            {/* Browser bar */}
            <div className="bg-[#1a1a35] border-b border-white/5 px-3 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/80" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <div className="w-2 h-2 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 bg-white/5 rounded h-4 flex items-center px-2">
                <span className="text-[8px] text-white/30 font-medium">amazoprint.in/design</span>
              </div>
            </div>

            {/* Main screen area */}
            <div className="p-5 min-h-[280px] flex flex-col justify-center gap-4">
              {/* Design studio preview area */}
              <div className="bg-gradient-to-br from-[#464674]/30 to-[#2f2f54]/40 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#464674] to-[#5c5c96] flex items-center justify-center shadow-lg">
                    <Palette size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white">AmazoPrint Design Studio</p>
                    <p className="text-[7px] text-white/50">Create · Customize · Order</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black">● Live</span>
                  </div>
                </div>
                {/* Mini canvas preview */}
                <div className="bg-gradient-to-br from-[#464674] to-[#5c5c96] rounded-lg aspect-[2.5/1] relative overflow-hidden flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-white tracking-wide">YOUR BRAND HERE</p>
                    <p className="text-[6px] text-white/60 mt-0.5">Business Card · 3.5 × 2 in</p>
                  </div>
                  <div className="absolute inset-2 border border-dashed border-white/20 rounded pointer-events-none" />
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1 right-1 w-4 h-4 rounded bg-white/20 flex items-center justify-center"
                  >
                    <Sparkles size={8} className="text-white" />
                  </motion.div>
                </div>
              </div>

              {/* Step list */}
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0', s.color)}>
                      {s.num}
                    </div>
                    <p className="text-[9px] text-white/70 font-medium">{s.label}</p>
                    {i < 2 && <ArrowRight size={8} className="text-white/30 flex-shrink-0 ml-auto" />}
                    {i === 2 && <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black ml-auto">Done!</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monitor stand */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-3 bg-gradient-to-b from-[#2a2a5a] to-[#1e1e48] rounded-b-sm" />
          <div className="w-32 h-2 bg-gradient-to-b from-[#1e1e48] to-[#141430] rounded-b-md" />
          <div className="w-40 h-1.5 bg-[#141430] rounded-full shadow-lg" />
        </div>
      </motion.div>

      {/* Floating badges */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 -left-4 z-20 bg-white rounded-xl shadow-2xl px-3.5 py-2 flex items-center gap-2 border-2 border-white ring-2 ring-orange-500/20"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white flex-shrink-0">
          <Tag size={13} />
        </div>
        <div>
          <p className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Grand Opening</p>
          <p className="text-xs font-black text-gray-900">Flat 30% OFF 🎉</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-16 -right-4 z-20 bg-white rounded-xl shadow-xl px-3 py-2 border border-gray-100"
      >
        <p className="text-[8px] text-gray-400 font-black uppercase tracking-wider">All Over India</p>
        <p className="text-xs font-black text-[#464674] flex items-center gap-1">
          <Truck size={11} /> Shipping Available
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function HomeClient({
  subProducts,
  directSellingProducts,
}: {
  subProducts: any[];
  directSellingProducts: any[];
}) {
  const [activeTab, setActiveTab] = React.useState('studio');
  const activeData = ECOSYSTEM_TABS.find((t) => t.id === activeTab) || ECOSYSTEM_TABS[0];

  const tabIconMap: Record<string, React.ReactNode> = {
    studio:       <Monitor size={13} />,
    verification: <CheckCheck size={13} />,
    contests:     <Award size={13} />,
    printing:     <Printer size={13} />,
    templates:    <Layers size={13} />,
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ─── Announcement Bar ─────────────────────────────────────────── */}
      <AnnouncementBar />

      <Navbar />

      <main className="flex-1">

        {/* ═══════════════════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-white border-b border-gray-100">
          {/* Subtle grid bg */}
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(#464674 1px, transparent 1px), linear-gradient(90deg, #464674 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {/* Soft colour blobs */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#464674]/8 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-400/6 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4" />

          <div className="w-full px-3 sm:px-4 lg:px-6 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* ── LEFT: Monitor Mockup ── */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75 }}
                className="relative"
              >
                <HeroMonitorMockup />
              </motion.div>

              {/* ── RIGHT: Copy + CTA ── */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, delay: 0.1 }}
                className="space-y-6 lg:pl-4"
              >
                {/* Trust badge */}
                <span className="inline-flex items-center gap-2 bg-[#464674]/10 border border-[#464674]/20 text-[#464674] text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  India's Most Trusted Printing Ecosystem
                </span>

                {/* Headline */}
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-black text-gray-900 tracking-tight leading-[1.15] font-display">
                    Create beautiful designs on{' '}
                    <span className="text-[#464674] font-classy italic font-black">Amazoprint</span>
                    <br />
                    <span className="text-gray-800 text-2xl sm:text-3xl font-black font-display">and get printing delivered</span>{' '}
                    <span className="text-gray-500 text-xl sm:text-2xl font-semibold font-body">right on doorstep!</span>
                  </h1>

                  {/* Tagline */}
                  <p className="text-gray-800 text-xl md:text-2xl font-black leading-tight font-display">
                    Let's execute thoughts{' '}
                    <span className="relative inline-block">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 font-classy italic font-bold">with color</span>
                      <motion.span
                        animate={{ scaleX: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-400 to-pink-500 rounded-full origin-left"
                      />
                    </span>
                  </p>
                </div>

                {/* CTA button */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#464674] to-[#5c5c96] hover:from-[#5c5c96] hover:to-[#464674] text-white font-black text-sm px-7 py-3.5 rounded-xl shadow-xl shadow-[#464674]/25 transition-all hover:-translate-y-0.5 group"
                  >
                    Start Your Unique Designs
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 border-2 border-[#464674]/20 text-[#464674] hover:border-[#464674] hover:bg-[#464674]/5 font-bold text-sm px-6 py-3.5 rounded-xl transition-all"
                  >
                    <Printer size={15} />
                    Get Print Quotes
                  </Link>
                </div>

                {/* Pipe-separated product quick links */}
                <div className="space-y-1.5">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Popular Categories</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    {PRODUCT_LINKS.map((item, i) => (
                      <React.Fragment key={item}>
                        <Link href="/products" className="text-[#464674] hover:text-[#5c5c96] hover:underline font-semibold transition-colors">
                          {item}
                        </Link>
                        {i < PRODUCT_LINKS.length - 1 && (
                          <span className="text-gray-300 mx-1.5">|</span>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                {/* Carousel dots (decorative) */}
                <div className="flex items-center gap-2 pt-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: i === 0 ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      className={cn(
                        'rounded-full transition-all',
                        i === 0 ? 'w-6 h-2 bg-[#464674]' : 'w-2 h-2 bg-gray-300'
                      )}
                    />
                  ))}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {[
                    { icon: <ShoppingCart size={14} />, val: '10K+',  lbl: 'Orders', color: 'text-[#464674] bg-[#464674]/10' },
                    { icon: <Printer size={14} />,      val: '2K+',   lbl: 'Printers', color: 'text-indigo-600 bg-indigo-50' },
                    { icon: <PenTool size={14} />,      val: '5K+',   lbl: 'Designers', color: 'text-violet-600 bg-violet-50' },
                    { icon: <BadgeCheck size={14} />,   val: '98%',   lbl: 'Satisfied', color: 'text-emerald-600 bg-emerald-50' },
                  ].map((s) => (
                    <div key={s.lbl} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-gray-900 font-black text-sm leading-tight">{s.val}</p>
                        <p className="text-gray-400 text-[9px] font-medium">{s.lbl}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: SHOP CATEGORIES
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-14 bg-white relative overflow-hidden">
          {/* Soft decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#464674]/4 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="w-full px-3 sm:px-4 lg:px-6 relative z-10">
            <motion.div {...FU()} className="text-center mb-12">
              <span className="inline-flex items-center gap-2 bg-[#464674]/10 text-[#464674] border border-[#464674]/20 text-xs sm:text-sm font-black tracking-widest uppercase px-4 py-2 rounded-full mb-4 font-display">
                <LayoutGrid size={15} /> All Categories
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight font-headline">
                Shop Customize Premium Printing
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#464674] to-[#8b8bb3] font-classy italic font-extrabold">&amp; Unprinting Blank Products</span>
              </h2>
            </motion.div>

            {/* Category circles */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 pb-4">
              {ALL_CATEGORIES.map((cat, i) => (
                <motion.div key={cat.name} {...FI(i * 0.03)}>
                  <Link href="/products" className="group flex flex-col items-center gap-2.5 min-w-[85px] sm:min-w-[105px]">
                    {/* Circle */}
                    <div
                      className="w-18 h-18 sm:w-22 sm:h-22 lg:w-24 lg:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:ring-4 group-hover:ring-offset-2 transition-all duration-300 border-4 border-white"
                      style={{ backgroundColor: cat.light, boxShadow: `0 6px 24px ${cat.bg}25`, ['--tw-ring-color' as any]: cat.bg + '55' }}
                    >
                      <span>{cat.emoji}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700 text-center leading-tight group-hover:text-[#464674] transition-colors w-full">
                      {cat.name}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* See More button */}
            <div className="mt-10 flex justify-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#464674] to-[#5c5c96] hover:from-[#5c5c96] hover:to-[#464674] text-white font-bold text-sm px-8 py-2.5 rounded-full transition-all shadow-lg shadow-[#464674]/25 hover:-translate-y-0.5"
              >
                View All Products <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: COMPLETE ECOSYSTEM (TABBED)
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 bg-[#f7f7fc] border-t border-[#464674]/8">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <motion.div {...FU()} className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 bg-[#464674]/10 text-[#464674] border border-[#464674]/20 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full mb-3 font-display">
                <Globe size={12} /> One Platform — Five Pillars
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2 font-headline">
                A Complete Printing Ecosystem
              </h2>
              <p className="text-gray-500 font-medium text-sm max-w-lg mx-auto leading-relaxed font-body">
                Empowering customers, designers, and print partners with a high-fidelity workspace.
              </p>
            </motion.div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {ECOSYSTEM_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black transition-all duration-300 border uppercase tracking-wide',
                    activeTab === tab.id
                      ? 'bg-[#464674] border-[#464674] text-white shadow-lg shadow-[#464674]/25'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-[#464674]/40 hover:text-[#464674]'
                  )}
                >
                  {tabIconMap[tab.id]}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Main card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="bg-gradient-to-br from-[#16163c] via-[#1a1a4e] to-[#282860] rounded-3xl border border-[#464674]/30 shadow-2xl p-6 lg:p-10 relative overflow-hidden min-h-[420px] flex flex-col justify-center"
              >
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#464674]/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-white/3 rounded-full blur-[80px] pointer-events-none" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  {/* Left text */}
                  <div className="lg:col-span-6 space-y-5">
                    <div className="space-y-3">
                      <h3 className="text-2xl lg:text-3xl font-black text-white leading-tight font-headline">{activeData.heading}</h3>
                      <p className="text-slate-300 text-sm font-medium leading-relaxed font-body">{activeData.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeData.subFeatures.map((sf, idx) => (
                        <div key={idx} className="flex gap-2.5 bg-white/5 rounded-xl p-3 border border-white/8 hover:border-white/15 transition-colors">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white leading-tight">{sf.title}</h4>
                            <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{sf.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button asChild size="lg" className="h-10 px-6 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-[#464674] border-none shadow-xl shadow-white/10 group">
                      <Link href={activeData.ctaHref} className="flex items-center gap-1.5">
                        {activeData.ctaText}
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                  {/* Right mockup */}
                  <div className="lg:col-span-6 flex justify-center lg:justify-end">
                    {activeTab === 'studio'       && <StudioMockup />}
                    {activeTab === 'verification' && <VerificationMockup />}
                    {activeTab === 'contests'     && <ContestsMockup />}
                    {activeTab === 'printing'     && <PrintingMockup />}
                    {activeTab === 'templates'    && <TemplatesMockup />}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: LATEST PRODUCTS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 bg-white">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <motion.div {...FU()} className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black tracking-[0.15em] uppercase px-3 py-1 rounded-full mb-3 font-display">
                <Flame size={11} /> Featured Products
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight font-headline">
                Latest Products
              </h2>
              <p className="text-gray-400 text-sm font-medium mt-1 font-body">Discover our freshest additions — crafted for perfection.</p>
            </motion.div>

            {subProducts && subProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {subProducts.slice(0, 10).map((sp: any, i: number) => {
                  const price = Number(sp.price || 0);
                  const imgUrl = resolveImagePath(sp.imageUrl || sp.parentProductImageUrl);
                  return (
                    <motion.div key={sp.id} {...FU(i * 0.04)}>
                      <Link
                        href={`/design/${sp.productSlug}/start?subProductId=${sp.id}`}
                        className="group block h-full"
                      >
                        <div className="h-full rounded-2xl overflow-hidden border border-gray-100 bg-white transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 hover:border-[#464674]/20 flex flex-col">
                          {/* Image */}
                          <div className="relative overflow-hidden aspect-square">
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt={sp.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-108"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#464674]/10 to-[#5c5c96]/10">
                                <Palette className="w-8 h-8 text-[#464674]/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                            {i < 3 && (
                              <span className="absolute top-2 left-2 text-[9px] font-black text-white bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 rounded-full shadow-lg">
                                🔥 Hot
                              </span>
                            )}
                            <div className="absolute inset-x-2 bottom-2 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                              <span className="inline-flex items-center gap-1 bg-[#464674] text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-lg">
                                <ShoppingCart size={10} /> Quick Order
                              </span>
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-3 flex flex-col flex-1 justify-between">
                            <div>
                              <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest">{sp.productName}</p>
                              <h4 className="text-xs font-black text-gray-900 mt-0.5 line-clamp-2 group-hover:text-[#464674] transition-colors">{sp.name}</h4>
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                              <div>
                                <span className="text-[8px] text-gray-400 font-bold block leading-none">FROM</span>
                                <span className="text-sm font-black text-[#464674]">₹{price > 0 ? price.toFixed(0) : '—'}</span>
                              </div>
                              {price > 0 && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 border-2 border-white shadow-sm px-2.5 py-0.5 rounded-full">
                                  30% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Skeleton when no products */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#464674] to-[#5c5c96] hover:from-[#5c5c96] hover:to-[#464674] text-white font-bold text-sm px-8 py-3 rounded-full transition-all shadow-lg shadow-[#464674]/25 hover:-translate-y-0.5"
              >
                Browse All Products <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: TRUST BADGES
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-12 bg-gradient-to-br from-[#1a1a4e]/5 via-white to-[#464674]/5 border-y border-[#464674]/10">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  icon: <Package size={26} className="text-[#464674]" />,
                  bg: 'bg-[#464674]/10',
                  border: 'border-l-[#464674]',
                  title: 'Easy on',
                  subtitle: 'Printing Product',
                  desc: 'Create your Design and your Design file Upload',
                },
                {
                  icon: <Printer size={26} className="text-emerald-600" />,
                  bg: 'bg-emerald-50',
                  border: 'border-l-emerald-500',
                  title: '99.99%',
                  subtitle: 'Accuracy in Printing',
                  desc: 'All printing orders only after its Administration are approved',
                },
                {
                  icon: <Truck size={26} className="text-blue-600" />,
                  bg: 'bg-blue-50',
                  border: 'border-l-blue-500',
                  title: '100%',
                  subtitle: 'If each print order',
                  desc: 'is shipped to the customer with its final destination',
                },
                {
                  icon: <ShieldCheck size={26} className="text-orange-600" />,
                  bg: 'bg-orange-50',
                  border: 'border-l-orange-500',
                  title: 'Quality product',
                  subtitle: 'Amazoprint offers only quality',
                  desc: 'print at the right price',
                },
              ].map((item, i) => (
                <motion.div key={i} {...FU(i * 0.08)}>
                  <div className={cn('flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 border-l-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full', item.border)}>
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0', item.bg)}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm leading-tight">{item.title}</p>
                      <p className="text-xs text-[#464674] font-bold mt-0.5">{item.subtitle}</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: HOW IT WORKS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 bg-gradient-to-br from-[#1a1a4e] via-[#464674] to-[#2f2f54] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="w-full px-3 sm:px-4 lg:px-6 relative z-10">
            <motion.div {...FU()} className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full mb-3 font-display">
                <Zap size={12} className="text-yellow-300" /> Simple 4-Step Process
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 font-headline">
                How AmazoPrint Works
              </h2>
              <p className="text-white/70 font-medium text-sm max-w-lg mx-auto font-body">
                From choosing a product to receiving it at your door — fast, simple, and reliable.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {HOW_STEPS.map((s, i) => (
                <motion.div key={i} {...FU(i * 0.1)} className="relative">
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden lg:flex absolute top-8 left-[calc(100%-8px)] z-10 items-center justify-center w-8">
                      <ArrowRight className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                  <div className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4 hover:bg-white/15 transition-colors">
                    <div className="relative">
                      <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-xl', s.col)}>
                        {s.icon}
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#464674] text-[10px] font-black flex items-center justify-center shadow-lg">
                        {s.n}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-sm mb-1.5">{s.label}</h3>
                      <p className="text-white/70 text-xs font-medium leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: DIRECT SELLING PRODUCTS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-14 bg-white">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <motion.div {...FU()} className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#464674]/10 text-[#464674] text-xs font-black uppercase tracking-wider mb-3">
                <Zap size={14} className="text-[#464674] animate-pulse" />
                <span>Instant Direct Orders</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-2 font-headline">
                <Store size={26} className="text-[#464674]" />
                Direct Selling Products
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mt-1.5 max-w-xl mx-auto">
                Ready-to-ship printed goods & merchandise available for immediate ordering from verified partners.
              </p>
            </motion.div>

            {directSellingProducts && directSellingProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {directSellingProducts.slice(0, 5).map((sp: any, i: number) => {
                  const price = Number(sp.sellingPrice || sp.price || 0);
                  const rawImg = (Array.isArray(sp.imageUrls) && sp.imageUrls.length > 0 ? sp.imageUrls[0] : null) || sp.imageUrl || '';
                  const imgUrl = rawImg ? resolveImagePath(rawImg) : null;
                  return (
                    <motion.div key={sp.id || i} {...FU(i * 0.04)}>
                      <Link href={`/products`} className="group block h-full">
                        <div className="h-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                          <div>
                            <div className="relative overflow-hidden aspect-square bg-slate-100">
                              {imgUrl ? (
                                <Image src={imgUrl} alt={sp.name || 'Product'} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              {sp.category && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[9px] font-black text-[#464674] uppercase tracking-wider shadow-sm">
                                  {sp.category}
                                </span>
                              )}
                            </div>
                            <div className="p-3 pb-1">
                              <p className="text-xs font-black text-gray-800 line-clamp-1 group-hover:text-[#464674] transition-colors">{sp.name || 'Product'}</p>
                            </div>
                          </div>
                          <div className="p-3 pt-0">
                            {price > 0 && <p className="text-sm font-black text-[#464674] mt-1">₹{price.toFixed(0)}</p>}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Skeleton placeholders */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: STATS BAND
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-14 bg-gradient-to-br from-[#1a1a4e]/5 via-[#f7f7fc] to-white border-y border-[#464674]/8">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#464674]/10">
              {[
                { icon: <ShoppingCart size={22} className="text-[#464674]" />, bg: 'bg-[#464674]/10', val: '10,000+', lbl: 'Orders Completed' },
                { icon: <Clock size={22} className="text-indigo-600" />,       bg: 'bg-indigo-50',    val: '2,000+',  lbl: 'Verified Printers' },
                { icon: <Users size={22} className="text-violet-600" />,       bg: 'bg-violet-50',    val: '5,000+',  lbl: 'Creative Designers' },
                { icon: <Globe size={22} className="text-emerald-600" />,      bg: 'bg-emerald-50',   val: '500+',    lbl: 'Cities Served' },
                { icon: <Award size={22} className="text-yellow-600" />,       bg: 'bg-yellow-50',    val: '98%',     lbl: 'Satisfaction Rate' },
              ].map((s, i) => (
                <motion.div key={i} {...FI(i * 0.08)} className="flex flex-col items-center text-center gap-2.5 px-4 py-4">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm', s.bg)}>{s.icon}</div>
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
        <section className="py-16 bg-white">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <motion.div {...FU()} className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-600 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full mb-3 border border-yellow-100 font-display">
                <Star size={12} className="fill-yellow-400 text-yellow-400" /> 4.9 / 5 Rating
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2 font-headline">
                What Our Customers Say
              </h2>
              <p className="text-gray-500 font-medium text-sm max-w-lg mx-auto font-body">
                Trusted by 10,000+ businesses, designers and individuals across India.
              </p>
            </motion.div>

            <Carousel opts={{ align: 'start', loop: true }} plugins={[Autoplay({ delay: 5000 })]} className="w-full">
              <CarouselContent className="-ml-4">
                {TESTIMONIALS.map((t, i) => {
                  const initials = t.name.split(' ').map((n) => n[0]).join('');
                  const grad = ['from-[#464674] to-[#5c5c96]', 'from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-red-500', 'from-pink-500 to-rose-600'][i % 5];
                  return (
                    <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="bg-white rounded-3xl border border-gray-100 border-l-4 border-l-[#464674] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col gap-4">
                        <div className="flex gap-0.5">
                          {Array(5).fill(0).map((_, j) => (
                            <Star key={j} size={13} className={j < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed flex-1 italic">"{t.text}"</p>
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                          <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br text-white text-sm font-black flex items-center justify-center flex-shrink-0 shadow-md', grad)}>
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
                <CarouselPrevious className="static translate-y-0 h-9 w-9 border-gray-200 hover:bg-[#464674] hover:text-white hover:border-[#464674] transition-all" />
                <CarouselNext className="static translate-y-0 h-9 w-9 border-gray-200 hover:bg-[#464674] hover:text-white hover:border-[#464674] transition-all" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: FINAL CTA
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-br from-[#1a1a4e] via-[#282860] to-[#464674] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="w-full px-3 sm:px-4 lg:px-6 relative z-10 text-center">
            <motion.div {...FU()} className="max-w-3xl mx-auto space-y-7">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide px-4 py-2 rounded-full font-display">
                <Sparkles size={13} className="text-yellow-300" />
                Start Your Print Journey Today
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1] font-headline">
                Ready to Create{' '}
                <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 font-classy italic font-extrabold">Something Amazing?</span>
              </h2>
              <p className="text-white/80 text-base font-medium max-w-xl mx-auto leading-relaxed">
                Join 10,000+ businesses and designers who trust AmazoPrint for premium quality printing across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" asChild className="h-12 px-9 rounded-2xl text-sm font-black bg-white hover:bg-slate-50 text-[#464674] border-none shadow-2xl shadow-white/10 group">
                  <Link href="/register" className="flex items-center gap-2">
                    Get Started Free <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-12 px-9 rounded-2xl text-sm font-bold bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                  <Link href="/products">Browse Products</Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {['🔒 Secure Payments', '✅ 100% Quality', '⭐ 98% Satisfaction', '🚀 Fast Delivery'].map((t) => (
                  <span key={t} className="text-[11px] font-bold text-white/75 bg-white/10 border border-white/15 px-3 py-1 rounded-full">{t}</span>
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
