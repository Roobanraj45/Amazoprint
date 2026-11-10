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
  Heart,
  ArrowUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn, resolveImagePath } from '@/lib/utils';
import { FIREBASE_ASSETS } from '@/lib/firebase-assets';
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

const DEFAULT_ALL_CATEGORIES = [
  { name: 'Business Cards', category: 'Business Cards', imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80', startingPrice: 1.5, itemCount: 5 },
  { name: 'Invitations', category: 'Invitation Cards', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80', startingPrice: 6, itemCount: 3 },
  { name: 'Marketing & Flyers', category: 'Marketing', imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=80', startingPrice: 2.5, itemCount: 5 },
  { name: 'Envelopes', category: 'Envelopes', imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80', startingPrice: 9, itemCount: 1 },
  { name: 'Labels & Stickers', category: 'Stickers', imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80', startingPrice: 2.5, itemCount: 2 },
  { name: 'Custom Banners', category: 'Banners', imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&auto=format&fit=crop&q=80', startingPrice: 100, itemCount: 1 },
  { name: 'Posters & Prints', category: 'Posters', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80', startingPrice: 15, itemCount: 3 },
  { name: 'Stationery', category: 'Stationery', imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80', startingPrice: 15, itemCount: 3 },
  { name: 'Photo Frames', category: 'customize photo frame', imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80', startingPrice: 199, itemCount: 1 },
  { name: 'T-Shirts & Apparel', category: 'Apparel & Clothing', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80', startingPrice: 199, itemCount: 3 },
  { name: 'Packaging & Boxes', category: 'package', imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80', startingPrice: 49, itemCount: 1 },
  { name: 'Desk Calendars', category: 'Calendar', imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=80', startingPrice: 45, itemCount: 1 },
  { name: 'Gifts & Merch', category: 'Gifts', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80', startingPrice: 50, itemCount: 1 },
  { name: 'Printing Blanks', category: 'Printing Blanks', imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80', startingPrice: 20, itemCount: 1 },
];

const HOW_STEPS = [
  { n: '01', icon: <Search size={22} />, label: 'Choose Product', desc: 'Pick from 500+ commercial print products and blanks.', col: 'from-[#464674] to-[#5c5c96]' },
  { n: '02', icon: <PenTool size={22} />, label: 'Customize Design', desc: 'Design in vector canvas studio or upload print-ready files.', col: 'from-violet-500 to-purple-600' },
  { n: '03', icon: <ShoppingCart size={22} />, label: 'Pre-flight & Order', desc: 'Automated CMYK/DPI audit, certified press routing, secure checkout.', col: 'from-emerald-500 to-teal-600' },
  { n: '04', icon: <Truck size={22} />, label: 'Doorstep Delivery', desc: 'Real-time tracked dispatch across 28,000+ PIN codes in India.', col: 'from-orange-500 to-red-500' },
];

const TESTIMONIALS = [
  { name: 'Ravi Sharma', role: 'Marketing Head, TechNova', rating: 5, text: 'Amazing quality and super fast delivery. AmazoPrint is now our go-to for all business printing needs.' },
  { name: 'Priya Nair', role: 'Founder, Creative Lab', rating: 5, text: 'The design studio is incredibly easy to use. Got my brochures done in minutes — quality exceeded expectations!' },
  { name: 'Arjun Mehta', role: 'Graphic Designer', rating: 5, text: 'Great platform for designers. I earn consistently through template sales and verification jobs.' },
  { name: 'Sneha Reddy', role: 'Event Manager', rating: 5, text: 'Ordered banners and stickers for my event — absolutely loved the output and speed of delivery!' },
  { name: 'Deepak Joshi', role: 'SMB Owner', rating: 4, text: 'Very affordable pricing and great support team. Been a regular customer for 6 months now.' },
];

const ECOSYSTEM_TABS = [
  {
    id: 'studio',
    label: 'Design Studio',
    subtitle: 'Browser Vector Canvas',
    pill: 'Interactive WebGL Canvas',
    badge: '300 DPI Export',
    stat: '10K+ Layouts',
    theme: {
      accent: 'indigo',
      glow: 'from-indigo-500/20 via-purple-500/10 to-transparent',
      border: 'hover:border-indigo-500/40',
      activeBg: 'from-indigo-600/30 to-purple-600/30',
      activeBorder: 'border-indigo-500/80 shadow-indigo-500/25',
      tagBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      iconColor: 'text-indigo-400',
    },
    heading: 'Professional In-Browser Design Studio',
    highlight: 'No Software Required',
    description: 'Create, customize, and preview your artwork in real-time with our drag-and-drop studio. Built with live bleed safety margins, high-res SVG & PDF renderers, and typography tools.',
    ctaText: 'Launch Design Studio',
    ctaHref: '/products',
    subFeatures: [
      { title: 'Interactive Web Canvas', desc: 'Drag-and-drop text, logos, shapes with multi-layer blend controls.' },
      { title: 'Thousands of Templates', desc: 'Jumpstart with curated designs crafted by award-winning typography masters.' },
      { title: '300 DPI Vector PDF Export', desc: 'Automated CMYK vector rendering for flawless edge-to-edge printing.' },
      { title: 'Real-Time Bleed Margins', desc: 'Live visual safety guides ensure critical content is never trimmed.' },
    ],
  },
  {
    id: 'verification',
    label: 'Print Verification',
    subtitle: 'Pre-flight AI & Expert Audit',
    pill: 'Zero Errors Guarantee',
    badge: 'CMYK & DPI Audit',
    stat: '100% Guaranteed',
    theme: {
      accent: 'emerald',
      glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      border: 'hover:border-emerald-500/40',
      activeBg: 'from-emerald-600/30 to-teal-600/30',
      activeBorder: 'border-emerald-500/80 shadow-emerald-500/25',
      tagBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    heading: 'Automated Pre-Flight & Print Verification',
    highlight: 'Zero Print Mistakes',
    description: 'Ensure 100% print-ready perfection before you spend a single rupee. Our automated validation engine and certified pre-press technicians inspect every layout file.',
    ctaText: 'Verify Your Design File',
    ctaHref: '/products',
    subFeatures: [
      { title: 'Instant Pre-Flight Diagnostic', desc: 'Scans raster DPI, font curves, hairline rules, and transparency bounds.' },
      { title: 'CMYK Color Separation Audit', desc: 'Detects out-of-gamut RGB values and adjusts ink density for accurate reproduction.' },
      { title: 'Bleed, Safe Zone & Trim Validation', desc: 'Automatic 3mm bleed check guarantees zero edge cut-off.' },
      { title: 'Expert Designer Peer-Review', desc: 'Optional human verification by senior prepress technicians.' },
    ],
  },
  {
    id: 'contests',
    label: 'Design Contests',
    subtitle: 'Crowdsourced Creative Quests',
    pill: '500+ Freelancers',
    badge: '100% Money-Back',
    stat: '40+ Entries / Quest',
    theme: {
      accent: 'amber',
      glow: 'from-amber-500/20 via-orange-500/10 to-transparent',
      border: 'hover:border-amber-500/40',
      activeBg: 'from-amber-600/30 to-orange-600/30',
      activeBorder: 'border-amber-500/80 shadow-amber-500/25',
      tagBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconColor: 'text-amber-400',
    },
    heading: 'Crowdsource High-Impact Design Concepts',
    highlight: 'Dozens of Creative Pitches',
    description: "Get custom brand artwork and layouts from India's top graphic designers. Set your prize pool, review creative pitches, collaborate in real-time, and print the winning concept.",
    ctaText: 'Explore Design Contests',
    ctaHref: '/contests',
    subFeatures: [
      { title: 'Launch in Under 2 Minutes', desc: 'Post your project brief, brand style guide, and set your contest prize pool.' },
      { title: 'Dozens of Tailor-Made Submissions', desc: 'Receive dozens of creative concepts within 48 to 72 hours.' },
      { title: 'Interactive Feedback Loop', desc: 'Rate designs with stars, chat with designers, and request real-time revisions.' },
      { title: '1-Click Direct-to-Press Handoff', desc: 'Award the winner, claim full copyright vectors, and send straight to print.' },
    ],
  },
  {
    id: 'printing',
    label: 'Print Fulfillment',
    subtitle: 'Distributed Press Engine',
    pill: 'Offset & Digital Grid',
    badge: 'Pan-India 24-48h',
    stat: '500+ Press Hubs',
    theme: {
      accent: 'rose',
      glow: 'from-rose-500/20 via-pink-500/10 to-transparent',
      border: 'hover:border-rose-500/40',
      activeBg: 'from-rose-600/30 to-pink-600/30',
      activeBorder: 'border-rose-500/80 shadow-rose-500/25',
      tagBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      iconColor: 'text-rose-400',
    },
    heading: 'Smart Direct-to-Press Fulfillment Engine',
    highlight: 'Industrial Grade Quality',
    description: 'Our automated dispatch engine matches every job with vetted commercial print presses. Enjoy spot UV, gold/silver foiling, die cuts, and real-time live telemetry straight to your doorstep.',
    ctaText: 'Become a Print Partner',
    ctaHref: '/printer-registration',
    subFeatures: [
      { title: 'Commercial Offset & Digital Fleet', desc: 'High-speed industrial Heidelberg and HP Indigo presses delivering 2400 DPI fidelity.' },
      { title: 'Luxury Finishes & Die-Cuts', desc: 'Velvet soft-touch lamination, raised spot UV, metallic foils, and custom contour cutting.' },
      { title: 'Smart Intelligent Geo-Routing', desc: 'Dispatches production to the nearest regional print hub for faster transit.' },
      { title: 'Live Production Telemetry', desc: 'Track every stage from plate making, ink curing, cutting, to door delivery.' },
    ],
  },
  {
    id: 'templates',
    label: 'Templates & Products',
    subtitle: '10,000+ Starter Kits',
    pill: 'Ready-to-Print Library',
    badge: '100% Free Customization',
    stat: '500+ Print SKUs',
    theme: {
      accent: 'sky',
      glow: 'from-sky-500/20 via-cyan-500/10 to-transparent',
      border: 'hover:border-sky-500/40',
      activeBg: 'from-sky-600/30 to-cyan-600/30',
      activeBorder: 'border-sky-500/80 shadow-sky-500/25',
      tagBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      iconColor: 'text-sky-400',
    },
    heading: 'Vast Library of Free Templates & Products',
    highlight: 'Instant Customization',
    description: 'Kickstart any commercial print project with thousands of professionally crafted, print-ready templates tailored for business cards, brochures, flyers, banners, and merchandise.',
    ctaText: 'Explore Template Matrix',
    ctaHref: '/templates',
    subFeatures: [
      { title: '10,000+ Free Starter Templates', desc: 'Organized by industry: Corporate, Retail, Food & Beverage, Events, & Real Estate.' },
      { title: 'Fully Editable Vector Assets', desc: 'Swap fonts, colors, imagery, and layouts with zero quality loss.' },
      { title: 'Direct Product Alignment', desc: 'Pre-configured with precise dimensions, bleed margins, and paper textures.' },
      { title: 'Fresh Releases Every Week', desc: 'Curated by top visual designers to keep your branding modern and competitive.' },
    ],
  },
];

const PRODUCT_LINKS = [
  'Visiting Cards', 'Letterhead', 'Invitations', 'Stickers', 'Gifts',
  'Albums', 'Photo Print', 'Mug', 'T-Shirt', 'Envelope',
  'Pocket Cards', 'ID Cards', 'Brochure', 'Printed Books',
];

// ─── Studio Mockup (High Fidelity Canvas) ──────────────────────────────────
function StudioMockup() {
  return (
    <div className="w-full max-w-[490px] bg-[#0c101c] rounded-3xl border border-indigo-500/20 shadow-2xl shadow-indigo-950/60 overflow-hidden ring-1 ring-white/10">
      {/* Top Window Bar */}
      <div className="bg-[#121829] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold ml-2 font-mono">Amazo Studio v3.0</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
            300 DPI • CMYK
          </span>
          <span className="text-[9px] font-bold text-slate-400 font-mono">3.5 × 2.0 in</span>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="p-4 grid grid-cols-12 gap-3 min-h-[260px] bg-[#080b14] relative">
        {/* Left Toolbar */}
        <div className="col-span-3 space-y-1.5 border-r border-white/5 pr-2.5">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tools</span>
          {[
            { label: 'Select', active: false },
            { label: 'Typography', active: true },
            { label: 'Shapes & SVGs', active: false },
            { label: 'Brand Assets', active: false },
          ].map((t) => (
            <div
              key={t.label}
              className={cn(
                'text-[9px] font-bold p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between',
                t.active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <span>{t.label}</span>
              {t.active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
            </div>
          ))}

          <div className="pt-2 space-y-1">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Layers (3)</span>
            <div className="h-1.5 w-full bg-indigo-500/40 rounded-full" />
            <div className="h-1.5 w-3/4 bg-purple-500/30 rounded-full" />
            <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Center Live Interactive Canvas */}
        <div className="col-span-9 flex items-center justify-center p-3 relative bg-gradient-to-br from-[#10162a] to-[#0c1020] rounded-2xl border border-white/5 overflow-hidden group">
          {/* Card Mockup */}
          <div className="w-full aspect-[1.75/1] bg-gradient-to-br from-[#1b1e36] via-[#242647] to-[#16172e] rounded-xl shadow-2xl relative overflow-hidden p-4 flex flex-col justify-between border border-amber-400/20 group-hover:scale-[1.02] transition-transform duration-500">
            {/* Ambient Shine */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full blur-xl pointer-events-none" />

            {/* Header of Business Card */}
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[9px] font-black text-amber-400 tracking-wider font-display">
                  AMAZOPRINT STUDIO
                </p>
                <p className="text-[6px] text-slate-400 font-bold uppercase tracking-widest">
                  Velvet Matte • Gold Foil
                </p>
              </div>
              <div className="w-5 h-5 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Sparkles size={9} />
              </div>
            </div>

            {/* Content of Business Card */}
            <div className="relative z-10 space-y-0.5">
              <p className="text-[8px] font-black text-white tracking-tight">Alexander Vance</p>
              <p className="text-[6px] text-slate-400 font-medium">Chief Executive Officer</p>
            </div>

            {/* Bleed Safety Margin Overlay */}
            <div className="absolute inset-1.5 border border-dashed border-indigo-400/40 rounded-lg pointer-events-none flex items-start justify-end p-1">
              <span className="text-[5px] text-indigo-300/80 font-mono bg-indigo-950/80 px-1 rounded">
                Safety Safe Zone (3mm)
              </span>
            </div>
          </div>

          {/* Floating Live Inspector Chip */}
          <div className="absolute bottom-2 right-2 bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-xl px-2 py-1 text-[7px] space-y-0.5 shadow-xl">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-slate-200">Typography: Outfit Bold 14pt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Verification Mockup (Pre-Flight Diagnostic) ──────────────────────────
function VerificationMockup() {
  return (
    <div className="w-full max-w-[490px] bg-[#0c101c] rounded-3xl border border-emerald-500/20 shadow-2xl shadow-emerald-950/40 overflow-hidden ring-1 ring-white/10">
      {/* Window Header */}
      <div className="bg-[#121829] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold ml-2 font-mono">Pre-Flight Diagnostic AI</span>
        </div>
        <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 size={10} /> 100% Print-Ready
        </span>
      </div>

      {/* Main Diagnostic Panel */}
      <div className="p-4 space-y-3 bg-[#080b14] min-h-[260px] flex flex-col justify-between">
        {/* Main File Header */}
        <div className="bg-[#10162a] rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-white font-mono">catalog_brochure_v4.pdf</p>
            <p className="text-[8px] text-slate-400">Target Press: Heidelberg Offset 4-Color</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-emerald-400">100 / 100</span>
            <span className="text-[8px] text-slate-400 block font-medium">Quality Score</span>
          </div>
        </div>

        {/* 4 Diagnostic Checkpoints */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'CMYK Gamut', status: 'Passed (0 Out of Gamut)', icon: '🎨', col: 'text-emerald-400' },
            { label: 'Bleed Safety', status: 'Passed (+3.0mm Safe)', icon: '📐', col: 'text-emerald-400' },
            { label: 'Image Resolution', status: 'Passed (340 DPI High)', icon: '🔍', col: 'text-emerald-400' },
            { label: 'Font Outlines', status: 'Passed (All Vectorized)', icon: '🔤', col: 'text-emerald-400' },
          ].map((item, i) => (
            <div key={i} className="bg-[#10162a] p-2.5 rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-slate-400 font-bold">{item.label}</span>
                <span className="text-[9px]">{item.icon}</span>
              </div>
              <p className={cn('text-[9px] font-black', item.col)}>{item.status}</p>
            </div>
          ))}
        </div>

        {/* Ink Density Spectrum */}
        <div className="bg-[#10162a] p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-[8px] text-slate-300 font-mono">
          <span className="font-bold">Total Ink Coverage (TIC):</span>
          <div className="flex gap-2">
            <span className="text-cyan-400">C: 15%</span>
            <span className="text-pink-400">M: 65%</span>
            <span className="text-yellow-400">Y: 90%</span>
            <span className="text-slate-300">K: 0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contests Mockup (Design Quests Hub) ───────────────────────────────────
function ContestsMockup() {
  return (
    <div className="w-full max-w-[490px] bg-[#0c101c] rounded-3xl border border-amber-500/20 shadow-2xl shadow-amber-950/40 overflow-hidden ring-1 ring-white/10">
      {/* Window Header */}
      <div className="bg-[#121829] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold ml-2 font-mono">Active Design Quest #729</span>
        </div>
        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
          ₹5,000 Prize Pool
        </span>
      </div>

      {/* Quest Feed */}
      <div className="p-4 space-y-3 bg-[#080b14] min-h-[260px] flex flex-col justify-between">
        <div className="bg-[#10162a] p-3 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <h4 className="text-[10px] font-black text-white">&quot;Artisan Specialty Coffee Packaging&quot;</h4>
            <p className="text-[8px] text-slate-400 font-medium mt-0.5">14 Designers • 42 Submissions • 2 Days Left</p>
          </div>
          <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-black px-2 py-0.5 rounded-full">
            In Review
          </span>
        </div>

        {/* 3 Creative Entries */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { designer: 'Aravind K.', rating: '★ 5.0', tag: '🏆 Leading', bg: 'from-amber-600 to-amber-950', sel: true },
            { designer: 'Shalini S.', rating: '★ 4.9', tag: 'Entry #18', bg: 'from-purple-800 to-slate-950', sel: false },
            { designer: 'Neil D.', rating: '★ 4.8', tag: 'Entry #12', bg: 'from-emerald-800 to-slate-950', sel: false },
          ].map((e, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border overflow-hidden bg-[#10162a] transition-all relative group cursor-pointer',
                e.sel ? 'border-amber-500/80 shadow-lg shadow-amber-500/20' : 'border-white/5 hover:border-white/20'
              )}
            >
              <div className={cn('aspect-square bg-gradient-to-br flex flex-col items-center justify-center relative p-2', e.bg)}>
                <span className="text-sm font-black text-white">EB</span>
                <span className="text-[6px] text-white/80 font-bold uppercase tracking-widest mt-0.5">ROASTERY</span>
                <span className="absolute top-1 right-1 text-[6px] bg-black/60 backdrop-blur-sm text-white px-1 py-0.2 rounded font-bold">
                  {e.tag}
                </span>
              </div>
              <div className="p-1.5 flex items-center justify-between text-[7px]">
                <span className="text-slate-300 font-bold truncate max-w-[55px]">{e.designer}</span>
                <span className="text-amber-400 font-black">{e.rating}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button className="w-full text-[10px] font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 py-2 rounded-xl shadow-lg shadow-amber-600/20 transition-all">
          Award Winner & Send to Commercial Press →
        </button>
      </div>
    </div>
  );
}

// ─── Printing Mockup (Fulfillment Telemetry) ──────────────────────────────
function PrintingMockup() {
  return (
    <div className="w-full max-w-[490px] bg-[#0c101c] rounded-3xl border border-rose-500/20 shadow-2xl shadow-rose-950/40 overflow-hidden ring-1 ring-white/10">
      {/* Window Header */}
      <div className="bg-[#121829] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold ml-2 font-mono">Press Telemetry Engine</span>
        </div>
        <span className="text-[9px] bg-rose-500/20 text-rose-300 font-black px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" /> Live Pressing
        </span>
      </div>

      {/* Production Details */}
      <div className="p-4 space-y-3 bg-[#080b14] min-h-[260px] flex flex-col justify-between">
        <div className="bg-[#10162a] p-3 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-white">Order #ORD-84920 • 1,000 Luxury Cards</p>
            <p className="text-[8px] text-slate-400">Heidelberg Speedmaster XL 106 • Chennai Hub 04</p>
          </div>
          <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
            Speed: 18,000 SPH
          </span>
        </div>

        {/* Step-by-Step Progress Pipeline */}
        <div className="bg-[#10162a] p-3 rounded-2xl border border-white/5 space-y-2">
          {[
            { step: '01. Plate CTP Calibration', status: 'Completed (100% CTP)', done: true },
            { step: '02. 4-Color Offset Impression', status: 'Live Impression Running...', done: false, active: true },
            { step: '03. Velvet Lamination & Spot UV', status: 'In Production Queue', done: false },
            { step: '04. Die Cutting & Door Dispatch', status: 'Pending Finishing', done: false },
          ].map((st, i) => (
            <div key={i} className="flex items-center justify-between text-[8px]">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[6px]',
                    st.done
                      ? 'bg-emerald-500 text-white'
                      : st.active
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white/10 text-slate-400'
                  )}
                >
                  {st.done ? '✓' : i + 1}
                </div>
                <span className={cn('font-bold', st.done || st.active ? 'text-white' : 'text-slate-500')}>
                  {st.step}
                </span>
              </div>
              <span className={cn('font-mono text-[7px]', st.active ? 'text-rose-400 font-bold' : 'text-slate-500')}>
                {st.status}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between text-[8px] text-slate-400 px-1 font-medium">
          <span>Paper: 350 GSM Velvet Art Card</span>
          <span className="text-emerald-400 font-bold">Est. Dispatch: Tomorrow 2:00 PM</span>
        </div>
      </div>
    </div>
  );
}

// ─── Templates Mockup (Template Matrix) ────────────────────────────────────
function TemplatesMockup({ subProducts = [] }: { subProducts?: any[] }) {
  const [viewMode, setViewMode] = React.useState<'products' | 'templates'>('products');

  const existingTemplates = [
    { name: 'Executive Card', bg: 'from-indigo-600 to-slate-900', label: 'Classic', category: 'Corporate' },
    { name: 'Launch Flyer', bg: 'from-orange-500 to-red-600', label: 'Bold', category: 'Marketing' },
    { name: 'Concert Poster', bg: 'from-emerald-500 to-teal-700', label: 'Modern', category: 'Events' },
    { name: 'Corporate Letterhead', bg: 'from-purple-600 to-indigo-950', label: 'Pro', category: 'Stationery' },
  ];

  const displayProducts = subProducts && subProducts.length > 0 ? subProducts.slice(0, 4) : [];
  const showProducts = viewMode === 'products' && displayProducts.length > 0;

  return (
    <div className="w-full max-w-[490px] bg-[#0c101c] rounded-3xl border border-sky-500/20 shadow-2xl shadow-sky-950/40 overflow-hidden ring-1 ring-white/10">
      {/* Window Header */}
      <div className="bg-[#121829] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold ml-2 font-mono">
            {showProducts ? 'Catalog Products' : 'Template Matrix (10,000+)'}
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-[#080b14] p-0.5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('products')}
            className={cn(
              'text-[8px] font-black px-2.5 py-1 rounded-lg transition-all',
              viewMode === 'products' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            )}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => setViewMode('templates')}
            className={cn(
              'text-[8px] font-black px-2.5 py-1 rounded-lg transition-all',
              viewMode === 'templates' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            )}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-3.5 bg-[#080b14] min-h-[260px]">
        {showProducts ? (
          <div className="grid grid-cols-2 gap-2.5">
            {displayProducts.map((sp: any) => {
              const imgUrl = resolveImagePath(sp.imageUrl || sp.parentProductImageUrl);
              return (
                <Link
                  key={sp.id || sp.productSlug}
                  href={sp.id ? `/design/${sp.productSlug}/start?subProductId=${sp.id}` : `/design/${sp.productSlug}/start`}
                  className="rounded-2xl overflow-hidden border border-white/10 group cursor-pointer hover:border-sky-400 hover:shadow-lg transition-all bg-[#10162a] flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-900 overflow-hidden relative flex-shrink-0">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={sp.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-950 to-slate-900">
                        <Package className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                    <span className="absolute top-1.5 right-1.5 text-[7px] bg-slate-900/90 text-white font-black px-1.5 py-0.5 rounded backdrop-blur-sm shadow border border-white/10">
                      {sp.width && sp.height ? `${sp.width}×${sp.height}${sp.unitType || 'mm'}` : 'Custom'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[8px] font-black text-white bg-sky-600 px-2 py-0.5 rounded-lg w-full text-center shadow">
                        Customize Design →
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-1 flex-1">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {sp.name}
                      </p>
                      <p className="text-[7px] text-slate-400 truncate">
                        {sp.productName || 'Commercial Print'}
                      </p>
                    </div>
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-lg font-black flex-shrink-0 border border-emerald-500/20">
                      {sp.price ? `₹${Number(sp.price).toFixed(0)}` : 'FREE'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {existingTemplates.map((t, i) => (
              <Link
                key={i}
                href="/templates"
                className="rounded-2xl overflow-hidden border border-white/10 group cursor-pointer hover:border-sky-400/80 transition-all block bg-[#10162a]"
              >
                <div className={cn('aspect-[4/3] bg-gradient-to-br flex items-center justify-center relative p-2', t.bg)}>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-white">{t.name}</p>
                    <p className="text-[7px] text-white/70">{t.label} • {t.category}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] font-black text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md">
                      Use Template →
                    </span>
                  </div>
                </div>
                <div className="bg-[#10162a] px-2.5 py-2 flex items-center justify-between border-t border-white/5">
                  <span className="text-[8px] text-slate-300 font-bold truncate">{t.name}</span>
                  <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                    FREE
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero Computer & Emerging Multi-Product 3D Showcase (LEFT side) ────────
function HeroMonitorMockup() {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [activeStudioTab, setActiveStudioTab] = React.useState<'card' | 'flyer' | 'apparel' | 'box'>('card');

  // Studio canvas content variations
  const studioTemplates = {
    card: {
      title: 'LUXURY BUSINESS CARD',
      subtitle: '3.5 × 2.0 in · Velvet Matte & Spot UV',
      badge: 'Gold Foil Ready',
      color: 'from-[#1a1a40] to-[#282860]',
    },
    flyer: {
      title: 'MARKETING FLYER A5',
      subtitle: '5.8 × 8.3 in · 170 GSM Art Gloss',
      badge: 'High Speed Offset',
      color: 'from-orange-600/30 to-pink-600/30',
    },
    apparel: {
      title: 'CUSTOM BRANDED APPAREL',
      subtitle: 'DTF Printing · 220 GSM Cotton',
      badge: 'Screen & DTF HD',
      color: 'from-emerald-600/30 to-teal-600/30',
    },
    box: {
      title: 'RIGID PACKAGING BOX',
      subtitle: 'Custom Die-cut · Kraft & White',
      badge: '3D Folded Proof',
      color: 'from-purple-600/30 to-indigo-600/30',
    },
  };

  const activeTpl = studioTemplates[activeStudioTab];

  return (
    <div className="relative flex items-center justify-center min-h-[380px] sm:min-h-[460px] lg:min-h-[540px] w-full py-4 sm:py-6 lg:py-8 select-none overflow-visible">
      {/* Dynamic atmospheric lighting */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] bg-gradient-to-tr from-[#464674]/30 via-orange-500/20 to-pink-500/15 rounded-full blur-[70px] sm:blur-[100px] animate-pulse" />
      </div>

      {/* Floating CMYK Particle Drops */}
      <motion.div
        animate={{ y: [-5, 5, -5], rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute top-4 left-6 sm:left-12 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 hidden sm:block pointer-events-none opacity-80"
      />
      <motion.div
        animate={{ y: [6, -6, 6], rotate: [360, 180, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-10 right-8 sm:right-16 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50 hidden sm:block pointer-events-none opacity-80"
      />

      {/* ── CENTRAL STUDIO COMPUTER WORKSTATION ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] z-10 mx-auto"
      >
        {/* Curved Bezel Frame with Metallic Chamfer */}
        <div className="bg-gradient-to-b from-[#2a2a56] via-[#1a1a3a] to-[#101024] rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-2xl shadow-[#101028]/80 border-2 border-white/20 relative overflow-hidden backdrop-blur-md">
          {/* Glass Gloss Shimmer */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-white/15 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Screen Display */}
          <div className="bg-[#090918] rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 relative">
            {/* Top Workspace Bar */}
            <div className="bg-[#12122b] border-b border-white/10 px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500/90 shadow-xs" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500/90 shadow-xs" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500/90 shadow-xs" />
              </div>

              {/* Interactive Product Tabs in Studio Screen */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                {(['card', 'flyer', 'apparel', 'box'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveStudioTab(tab)}
                    className={cn(
                      'text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md transition-all capitalize',
                      activeStudioTab === tab
                        ? 'bg-[#464674] text-white shadow-xs'
                        : 'text-white/40 hover:text-white/80'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[7px] sm:text-[8px] font-black text-emerald-400">Live</span>
              </div>
            </div>

            {/* Main Studio Canvas */}
            <div className="p-3 sm:p-4 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between relative bg-gradient-to-b from-[#0e0e22] via-[#090918] to-[#050510]">
              {/* Ruler & Alignment Grid */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Studio Top Control Ribbon */}
              <div className="flex items-center justify-between relative z-10 pb-1.5 sm:pb-2 border-b border-white/5">
                <div className="flex items-center gap-1 bg-white/5 p-0.5 sm:p-1 rounded-lg">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-[#464674] flex items-center justify-center text-white shadow-xs">
                    <PenTool size={9} />
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded hover:bg-white/10 flex items-center justify-center text-white/60">
                    <Palette size={9} />
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded hover:bg-white/10 flex items-center justify-center text-white/60">
                    <Layers size={9} />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[7px] sm:text-[8px] font-semibold text-white/70">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    CMYK 300DPI
                  </span>
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded hidden sm:inline-block">
                    SPOT UV
                  </span>
                </div>
              </div>

              {/* Active Artwork Preview On Digital Canvas */}
              <div className="relative my-auto py-2 flex items-center justify-center">
                <motion.div
                  key={activeStudioTab}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'w-[160px] sm:w-[190px] h-[95px] sm:h-[110px] rounded-xl bg-gradient-to-br border-2 border-dashed border-[#464674]/70 p-2.5 relative shadow-inner flex flex-col justify-between',
                    activeTpl.color
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[8px] font-black text-slate-950 shadow">
                        AP
                      </div>
                      <span className="text-[7px] sm:text-[8px] font-black text-white tracking-wide">AMAZOPRINT</span>
                    </div>
                    <span className="text-[6px] sm:text-[7px] text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                      {activeTpl.badge}
                    </span>
                  </div>

                  <div>
                    <p className="text-[8px] sm:text-[9px] font-black text-white tracking-wider">{activeTpl.title}</p>
                    <p className="text-[6px] sm:text-[7px] text-white/60 font-medium">{activeTpl.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <div className="h-1 w-10 sm:w-14 bg-white/40 rounded-full" />
                    <span className="text-[5px] sm:text-[6px] font-mono text-cyan-300">PRINT READY ✔</span>
                  </div>

                  {/* Vector Pen Drawing Handle */}
                  <motion.div
                    animate={{
                      x: [0, 15, -8, 0],
                      y: [0, -8, 6, 0],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#464674] rounded-full shadow-lg flex items-center justify-center border-2 border-[#464674]"
                  >
                    <Sparkles size={8} />
                  </motion.div>
                </motion.div>

                {/* Laser Ray Burst Portals (Digital -> Physical Transfer) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{ scale: [0.92, 1.3, 0.92], opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-[170px] sm:w-[200px] h-[105px] sm:h-[120px] rounded-2xl border-2 border-cyan-400/40 bg-cyan-400/5 blur-xs"
                  />
                </div>
              </div>

              {/* Studio Bottom Stream Bar */}
              <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-white/50 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1 text-cyan-300 font-bold">
                  <Flame size={9} className="text-orange-400" /> Exporting into Real Print Products...
                </span>
                <span className="font-mono text-emerald-400 hidden sm:inline-block">100% Vector</span>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Stand */}
        <div className="flex flex-col items-center">
          <div className="w-16 sm:w-20 h-2.5 sm:h-3.5 bg-gradient-to-b from-[#2a2a56] to-[#1a1a38] rounded-b-sm shadow" />
          <div className="w-28 sm:w-36 h-2 sm:h-3 bg-gradient-to-b from-[#1a1a38] to-[#0e0e22] rounded-b-md" />
          <div className="w-36 sm:w-48 h-1.5 sm:h-2 bg-[#090918] rounded-full shadow-2xl" />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          RESPONSIVE 3D PHYSICAL PRODUCTS BURSTING OUT
      ═══════════════════════════════════════════════════════════════ */}

      {/* ── 1. LUXURY GOLD FOIL VISITING CARD (Top-Right) ──────────── */}
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [-8, -5, -8],
        }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.06, rotate: 0, zIndex: 50 }}
        onHoverStart={() => setHoveredItem('card')}
        onHoverEnd={() => setHoveredItem(null)}
        className="absolute -top-3 sm:-top-5 right-0 sm:-right-4 lg:-right-8 z-30 cursor-pointer scale-[0.80] sm:scale-95 lg:scale-100 origin-top-right"
      >
        <Link href="/products?category=Visiting%20Cards">
          <div className="w-[165px] sm:w-[190px] h-[100px] sm:h-[115px] bg-gradient-to-br from-[#1c1c3c] via-[#24244f] to-[#121228] rounded-xl p-2.5 sm:p-3 shadow-2xl shadow-black/70 border-2 border-amber-400/50 relative overflow-hidden group/card">
            {/* Metallic Gold Sheen */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-amber-300/20 to-transparent rotate-45 group-hover/card:animate-shimmer pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-[9px] sm:text-[10px] shadow">
                  ★
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] font-black text-white tracking-wider">AURA STUDIO</p>
                  <p className="text-[5px] sm:text-[6px] text-amber-300 font-bold uppercase tracking-widest">Executive Card</p>
                </div>
              </div>
              <span className="text-[6px] sm:text-[7px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Gold Foil
              </span>
            </div>

            <div className="mt-2">
              <p className="text-[9px] sm:text-[10px] font-bold text-white leading-tight">Alexander Vance</p>
              <p className="text-[6px] sm:text-[7px] text-white/60">Creative Director</p>
            </div>

            <div className="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[5px] sm:text-[6px] text-white/60 font-mono">
              <span>+91 98765 43210</span>
              <span className="text-amber-300 font-bold">350 GSM Velvet</span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── 2. VIBRANT GLOSS MARKETING FLYER (Top-Left) ────────────── */}
      <motion.div
        animate={{
          y: [0, 10, 0],
          rotate: [6, 9, 6],
        }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        whileHover={{ scale: 1.06, rotate: 0, zIndex: 50 }}
        onHoverStart={() => setHoveredItem('flyer')}
        onHoverEnd={() => setHoveredItem(null)}
        className="absolute top-8 sm:top-10 left-0 sm:-left-6 lg:-left-10 z-30 cursor-pointer scale-[0.75] sm:scale-90 lg:scale-100 origin-top-left"
      >
        <Link href="/products?category=Flyers">
          <div className="w-[145px] sm:w-[170px] h-[180px] sm:h-[210px] bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-orange-500/30 border-2 border-white/90 relative overflow-hidden text-white group/flyer">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-[6px] sm:text-[7px] font-black bg-white text-orange-600 px-1.5 py-0.5 rounded-full shadow">
                A5 FLYER
              </span>
              <span className="text-[7px] sm:text-[8px] font-black bg-black/30 px-1.5 py-0.5 rounded">
                170 GSM Art
              </span>
            </div>

            <div className="my-1.5 sm:my-2 text-center bg-white/10 rounded-xl p-1.5 sm:p-2 border border-white/20">
              <p className="text-[7px] sm:text-[8px] font-black tracking-widest text-amber-200 uppercase">SUMMER FEST</p>
              <p className="text-base sm:text-lg font-black leading-none my-0.5 text-white drop-shadow">50% OFF</p>
              <p className="text-[6px] sm:text-[7px] font-medium text-white/90">Grand Opening Event</p>
            </div>

            <div className="space-y-1 my-1">
              <div className="h-1 bg-white/30 rounded-full w-full" />
              <div className="h-1 bg-white/20 rounded-full w-4/5" />
            </div>

            <div className="mt-auto pt-1 border-t border-white/20 flex items-center justify-between text-[6px] sm:text-[7px] font-bold">
              <span className="bg-white text-rose-600 px-2 py-0.5 rounded-md font-black shadow">
                Order Now
              </span>
              <span className="text-white/90 font-mono">₹0.85/pc</span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── 3. CUSTOM BRANDED APPAREL TAG (Mid-Right on Desktop/Tablet) ── */}
      <motion.div
        animate={{
          y: [0, -7, 0],
          rotate: [-14, -10, -14],
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.0 }}
        whileHover={{ scale: 1.1, rotate: 0, zIndex: 50 }}
        className="absolute top-28 -right-2 sm:-right-6 lg:-right-8 z-20 cursor-pointer hidden sm:block scale-90 lg:scale-100"
      >
        <Link href="/products?category=T-Shirts">
          <div className="w-[125px] sm:w-[135px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-2.5 shadow-2xl shadow-black/50 border-2 border-emerald-400/40 relative text-white">
            <div className="w-2 h-2 rounded-full bg-slate-950 border border-white/30 mx-auto -mt-3.5 mb-1 shadow-inner" />
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full">
                APPAREL DTF
              </span>
              <span className="text-[6px] text-emerald-300 font-bold">100% Cotton</span>
            </div>
            <p className="text-[8px] font-black text-white mt-1">Custom T-Shirt</p>
            <p className="text-[6px] text-white/50">High-Density Print</p>
          </div>
        </Link>
      </motion.div>

      {/* ── 4. DIE-CUT HOLOGRAPHIC VINYL STICKER (Bottom-Right) ────── */}
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [10, 14, 10],
        }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        whileHover={{ scale: 1.12, rotate: 0, zIndex: 50 }}
        className="absolute -bottom-2 sm:-bottom-4 right-0 sm:right-4 lg:right-2 z-30 cursor-pointer scale-[0.75] sm:scale-90 lg:scale-100 origin-bottom-right"
      >
        <Link href="/products?category=Stickers">
          <div className="w-[95px] sm:w-[115px] h-[95px] sm:h-[115px] rounded-full bg-gradient-to-tr from-cyan-400 via-violet-500 to-pink-500 p-0.5 shadow-2xl shadow-purple-500/40 relative group/sticker flex items-center justify-center text-white">
            <div className="w-full h-full rounded-full bg-[#10102b] p-1.5 sm:p-2 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/20">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-300 to-orange-500 flex items-center justify-center text-slate-950 font-black text-[10px] shadow-md mb-0.5">
                ★
              </div>
              <p className="text-[7px] sm:text-[8px] font-black tracking-wide text-white">DIE-CUT</p>
              <p className="text-[5px] sm:text-[6px] text-cyan-300 font-bold">Holographic Vinyl</p>
              <span className="text-[5px] sm:text-[6px] bg-white/10 text-white/80 px-1.5 py-0.2 rounded-full mt-0.5">
                Waterproof
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-tl-lg bg-white/40 backdrop-blur-xs border border-white/60 shadow" />
          </div>
        </Link>
      </motion.div>

      {/* ── 5. SMART NFC ID CARD (Bottom-Left on Tablet/Desktop) ───── */}
      <motion.div
        animate={{
          y: [0, 8, 0],
          rotate: [-12, -9, -12],
        }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
        whileHover={{ scale: 1.08, rotate: 0, zIndex: 50 }}
        className="absolute -bottom-3 sm:-bottom-5 left-0 sm:left-2 lg:left-0 z-30 cursor-pointer scale-[0.75] sm:scale-90 lg:scale-100 origin-bottom-left"
      >
        <Link href="/products?category=ID%20Cards">
          <div className="w-[135px] sm:w-[155px] h-[80px] sm:h-[92px] bg-gradient-to-br from-white via-slate-50 to-slate-200 rounded-xl p-2 sm:p-2.5 shadow-2xl shadow-black/30 border-2 border-white relative text-slate-800">
            <div className="w-4 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-[#464674] flex items-center justify-center text-white text-[6px] font-bold">
                  AP
                </div>
                <span className="text-[6px] sm:text-[7px] font-black text-slate-900">amazoprint.in</span>
              </div>
              <span className="text-[5px] sm:text-[6px] font-bold text-emerald-600">● NFC Active</span>
            </div>
            <p className="text-[7px] sm:text-[8px] font-bold text-slate-700 mt-1">Smart Access Pass</p>
            <div className="flex items-center justify-between text-[5px] sm:text-[6px] text-slate-400 mt-0.5">
              <span>HD PVC Card</span>
              <span className="text-[#464674] font-black">2400 DPI</span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── 6. TOP PRESS QUALITY SEAL ─────────────────────────────── */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-3 sm:-top-4 left-2 sm:left-6 lg:left-8 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 border border-gray-100 ring-2 ring-orange-500/20"
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white flex-shrink-0 shadow">
          <Printer size={11} />
        </div>
        <div>
          <p className="text-[6px] sm:text-[7px] text-gray-400 font-black uppercase tracking-wider">Direct Press</p>
          <p className="text-[9px] sm:text-[10px] font-black text-gray-900">2400 DPI Offset</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Agista Perspective Stationery 3D Hero Mockup ──────────────────────────
function AgistaHeroMockup() {
  const [activeSlide, setActiveSlide] = React.useState(0);

  const heroSlides = [
    {
      badge: 'Professional Stationery Printing',
      tag: 'Desk Calendar 2026',
      title: 'Custom Business Stationery Solutions',
      specs: 'Spiral Bound · 250 GSM Matte Art Paper',
      price: 'From ₹45/pc',
      img: '/uploads/products/1791445283362-001.jpeg',
      floatingTag: 'Spot UV Gloss',
      floatingRating: '★ 4.9',
      floatingTitle: 'Desk Calendar & Planner',
      floatingSub: 'Monthly Desk Planner · Spiral Ring',
    },
    {
      badge: 'Luxury Business Printing',
      tag: 'Executive Visiting Cards',
      title: 'Velvet Touch & Raised Gold Foil',
      specs: '350 GSM Velvet Touch + Pure Gold Foil',
      price: 'From ₹1.5/pc',
      img: '/uploads/products/1791445210091-Amazoprint_business_printing_02.jpg',
      floatingTag: 'Gold Foil Gloss',
      floatingRating: '★ 4.95',
      floatingTitle: 'Executive Visiting Card',
      floatingSub: 'Heavy Cardstock · Gold Foil Edge',
    },
    {
      badge: 'Artisan Brand Packaging',
      tag: 'Rigid Gift Boxes',
      title: 'Custom Branded Packaging & Boxes',
      specs: 'Rigid Matte Laminated Boxes · Die-cut',
      price: 'From ₹49/pc',
      img: '/uploads/products/1775241468772-180_NT_Spot_UV_1.jpg.webp',
      floatingTag: 'Rigid Box',
      floatingRating: '★ 4.9',
      floatingTitle: 'Luxury Gift Box',
      floatingSub: 'Magnetic Closure · Foam Insert',
    },
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const slide = heroSlides[activeSlide];

  return (
    <div className="relative w-full max-w-[580px] mx-auto select-none py-6 sm:py-10">
      {/* Background Soft Glow Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] bg-gradient-to-tr from-[#091642]/10 via-[#f07000]/10 to-indigo-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Main 3D Perspective Stationery Composition */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center">

        {/* 1. Large Luxury Product Display Stage */}
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-20 w-[94%] sm:w-[90%] aspect-[16/10] rounded-3xl bg-white shadow-[0_20px_50px_rgba(9,22,66,0.14)] border border-slate-200/90 p-5 sm:p-7 overflow-hidden flex flex-col justify-between"
        >
          {/* Header pill & specs */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs sm:text-sm font-black tracking-wider text-[#091642] uppercase bg-[#091642]/5 border border-[#091642]/15 px-3.5 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f07000]" />
              {slide.tag}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-500 font-mono tracking-wider">
              CMYK 2400 DPI
            </span>
          </div>

          {/* Center 3D Showcase Image */}
          <div className="relative flex-1 my-3 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center group border border-slate-200/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.img}
              alt={slide.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/uploads/hero.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#091642]/75 via-[#091642]/25 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white">
              <div>
                <p className="text-sm sm:text-base font-black leading-tight drop-shadow-md">
                  {slide.specs}
                </p>
                <p className="text-xs text-white/90 font-semibold mt-0.5">Ready for instant commercial press dispatch</p>
              </div>
              <span className="bg-[#f07000] text-white text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full shadow-md">
                {slide.price}
              </span>
            </div>
          </div>

          {/* Footer Quality Verification Badges */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 font-semibold border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <CheckCircle2 size={16} /> 100% Pre-Flight Verified
            </span>
            <span className="text-[#091642] font-extrabold">Same-Day Dispatch Available</span>
          </div>
        </motion.div>

        {/* 2. Floating Perspective Visiting Card (Top Left Offset) */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-5 sm:-top-7 -left-3 sm:-left-6 z-30 bg-[#091642]/95 backdrop-blur-md text-white rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_36px_rgba(0,0,0,0.35)] border border-white/25 w-44 sm:w-52"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-[#f07000] tracking-wider bg-white/10 px-2 py-0.5 rounded-full">{slide.floatingTag}</span>
            <span className="text-xs text-amber-300 font-bold">{slide.floatingRating}</span>
          </div>
          <p className="text-xs sm:text-sm font-black text-white leading-tight">{slide.floatingTitle}</p>
          <p className="text-[11px] text-slate-300 mt-0.5 font-medium">{slide.floatingSub}</p>
        </motion.div>

        {/* 3. Floating Quality Guarantee Badge (Bottom Right) */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-4 sm:-bottom-6 -right-2 sm:-right-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-[0_14px_30px_rgba(9,22,66,0.12)] border border-slate-200/90 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f07000] to-[#d96500] text-white flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
            24H
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Express Press</p>
            <p className="text-xs font-black text-[#091642]">Doorstep Pan-India</p>
            <p className="text-[11px] text-emerald-600 font-bold">Free Over ₹999</p>
          </div>
        </motion.div>
      </div>

      {/* Agista-style Carousel Dots & Slide Switcher */}
      <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
        {heroSlides.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveSlide(idx)}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300 cursor-pointer',
              activeSlide === idx ? 'w-8 bg-[#091642]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
            )}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Agista Category & Order Constants ─────────────────────────────────────
const AGISTA_CIRCULAR_CATEGORIES = [
  { name: 'Visiting Cards', href: '/products?category=Business%20Cards', img: '/uploads/products/1775241468772-180_NT_Spot_UV_1.jpg.webp', count: '12+ Styles' },
  { name: 'T-Shirts & Apparel', href: '/products?category=Apparel%20%26%20Clothing', img: '/uploads/hero.png', count: '20+ Colors' },
  { name: 'Caps & Headwear', href: '/products?category=Apparel%20%26%20Clothing', img: '/uploads/hero.png', count: 'Embroidered' },
  { name: 'Promo & Marketing', href: '/products?category=Marketing', img: '/uploads/products/1788879169781-images.jpeg', count: 'Custom Branding' },
  { name: 'Desk Calendars', href: '/products?category=Calendar', img: '/uploads/products/1791445283362-001.jpeg', count: 'Year 2026' },
  { name: 'Mugs & Drinkware', href: '/products?category=Gifts', img: '/uploads/products/1791445210091-Amazoprint_business_printing_02.jpg', count: '8+ Models' },
  { name: 'Custom Packaging', href: '/products?category=package', img: '/uploads/products/1775241758168-4_.jpg.webp', count: '15+ Sizes' },
  { name: 'Flyers & Brochures', href: '/products?category=Marketing', img: '/uploads/sub-products/1775728837996-A4_130_1.jpg.webp', count: '6+ Finishes' },
];

const getProductSpecTags = (p: any): string[] => {
  const text = `${p?.category || ''} ${p?.productName || ''} ${p?.name || ''}`.toLowerCase();
  if (text.includes('shirt') || text.includes('apparel') || text.includes('cloth') || text.includes('hoodie') || text.includes('cap') || text.includes('polo')) {
    return ['100% Combed Cotton', 'Bio-Wash Soft', 'DTF Print HD'];
  }
  if (text.includes('mug') || text.includes('tumbler') || text.includes('drink') || text.includes('bottle') || text.includes('cup')) {
    return ['HD Sublimation', 'Dishwasher Safe', 'Food-Grade Ceramic'];
  }
  if (text.includes('card') || text.includes('visiting')) {
    return ['350 GSM Velvet', 'Spot UV / Gold Foil', 'Matte Finish'];
  }
  if (text.includes('box') || text.includes('package') || text.includes('packaging')) {
    return ['Rigid Board', 'Custom Die-Cut', 'Eco-Friendly'];
  }
  if (text.includes('flyer') || text.includes('brochure') || text.includes('letterhead') || text.includes('pamphlet')) {
    return ['170 GSM Art Gloss', 'True CMYK Press', 'Sharp Creasing'];
  }
  if (text.includes('poster') || text.includes('banner')) {
    return ['2400 DPI Offset', 'UV-Resistant Ink', 'Heavyweight Art'];
  }
  if (text.includes('sticker') || text.includes('label')) {
    return ['Waterproof Vinyl', 'Precision Die-Cut', 'Strong Adhesive'];
  }
  if (text.includes('calendar')) {
    return ['Spiral Bound', '250 GSM Matte Art', 'Full Color CMYK'];
  }
  return ['350 GSM Premium', 'True CMYK Press', 'Express Dispatch'];
};

const POPULAR_FILTER_TABS = [
  'All Items',
  'Mugs & Drinkware',
  'Pens & Stationery',
  'Apparel & Caps',
  'Packaging & Boxes',
];


// ─── Main export ─────────────────────────────────────────────────────────────
export function HomeClient({
  subProducts,
  directSellingProducts,
  categoryProducts = [],
}: {
  subProducts: any[];
  directSellingProducts: any[];
  categoryProducts?: any[];
}) {
  const [activeTab, setActiveTab] = React.useState('studio');
  const activeData = ECOSYSTEM_TABS.find((t) => t.id === activeTab) || ECOSYSTEM_TABS[0];

  // Category horizontal scroll state (max 2 rows)
  const categoryTrackRef = React.useRef<HTMLDivElement>(null);
  const [canScrollCatLeft, setCanScrollCatLeft] = React.useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = React.useState(true);

  const checkCatScroll = React.useCallback(() => {
    const el = categoryTrackRef.current;
    if (!el) return;
    setCanScrollCatLeft(el.scrollLeft > 6);
    setCanScrollCatRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  const scrollCategories = (direction: 'left' | 'right') => {
    const el = categoryTrackRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const el = categoryTrackRef.current;
    if (!el) return;
    checkCatScroll();
    el.addEventListener('scroll', checkCatScroll, { passive: true });
    window.addEventListener('resize', checkCatScroll);
    return () => {
      el.removeEventListener('scroll', checkCatScroll);
      window.removeEventListener('resize', checkCatScroll);
    };
  }, [checkCatScroll, categoryProducts]);

  // Agista "Shop Popular" Filter Tab State
  const [selectedPopularTab, setSelectedPopularTab] = React.useState('All Categories');

  // Filter products according to the selected tab
  const filteredPopularProducts = React.useMemo(() => {
    if (!subProducts || subProducts.length === 0) return [];
    if (selectedPopularTab === 'All Categories') return subProducts.slice(0, 8);
    const q = selectedPopularTab.toLowerCase();
    const matches = subProducts.filter(
      (p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches.slice(0, 8) : subProducts.slice(0, 8);
  }, [subProducts, selectedPopularTab]);

  const displayCategories = categoryProducts && categoryProducts.length > 0
    ? categoryProducts
    : DEFAULT_ALL_CATEGORIES;

  const tabIconMap: Record<string, React.ReactNode> = {
    studio: <Monitor size={13} />,
    verification: <CheckCheck size={13} />,
    contests: <Award size={13} />,
    printing: <Printer size={13} />,
    templates: <Layers size={13} />,
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans">
      <Navbar />

      <main className="flex-1">

        {/* ═══════════════════════════════════════════════════════════
            1. HERO SECTION (Agista Lavender/Periwinkle Pattern)
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#eef3ff] via-[#f4f7ff] to-[#e6eeff] border-b border-blue-100/60 py-10 sm:py-16 lg:py-20">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#091642]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#f07000]/5 rounded-full blur-[90px] pointer-events-none" />

          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

              {/* Left Column: Agista Brand Copy & CTA */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="lg:col-span-6 space-y-6 text-left"
              >
                {/* Defining Brand Identity Pill */}
                <div className="inline-flex items-center gap-2 bg-white/90 border border-[#091642]/15 text-[#091642] px-4 py-1.5 rounded-full shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#f07000]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Defining Brand Identity</span>
                </div>

                {/* Big Bold Headline in Agista Midnight Navy */}
                <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-[#091642] tracking-tight leading-[1.12]">
                  Branded Business &amp;{' '}
                  <span className="text-[#091642] block">Advertising Products</span>
                </h1>

                {/* Agista 3-Checklist Badges */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-bold text-[#091642]">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shadow-xs">✓</span>
                    Easy to customize
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shadow-xs">✓</span>
                    Premium quality
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black shadow-xs">✓</span>
                    Best value
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
                  Customize business cards, packaging, promotional apparel, and marketing essentials with instant digital proofs and high-speed door delivery across India.
                </p>

                {/* Agista Pill Button with Circular Orange Arrow */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-3.5 bg-[#091642] hover:bg-[#061033] text-white font-black text-sm pl-7 pr-2 py-2 rounded-full shadow-xl shadow-[#091642]/20 hover:shadow-2xl transition-all hover:-translate-y-0.5 group h-[52px]"
                  >
                    <span>Explore Products</span>
                    <span className="w-9 h-9 rounded-full bg-[#f07000] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <ArrowRight size={15} />
                    </span>
                  </Link>

                  <Link
                    href="/templates"
                    className="inline-flex items-center justify-center gap-2 border-2 border-[#091642]/20 hover:border-[#091642] text-[#091642] bg-white hover:bg-slate-50 font-bold text-sm px-7 h-[52px] rounded-full transition-all shadow-xs hover:-translate-y-0.5"
                  >
                    <span>Free Templates</span>
                    <ChevronRight size={15} />
                  </Link>
                </div>

                {/* Quick Trust Highlights */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">★★★★★</span>
                    <strong className="text-slate-800 font-bold">4.9/5</strong> (1,200+ Reviews)
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Same-Day Dispatch Available
                  </span>
                </div>
              </motion.div>

              {/* Right Column: 3D Perspective Hero Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.15 }}
                className="lg:col-span-6 w-full"
              >
                <AgistaHeroMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            2. SHOP BY CATEGORY (Agista Circular Pods)
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Heading */}
            <div className="text-center mb-12 space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#f07000] bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200/80 inline-block shadow-xs">
                Curated Collections
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#091642] tracking-tight">
                Shop By <span className="text-[#091642]">Category</span>
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed">
                Explore our full line of professional custom printing and brand merchandising solutions.
              </p>
            </div>

            {/* Circular Pods Grid (8 Columns on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 sm:gap-5 justify-center">
              {AGISTA_CIRCULAR_CATEGORIES.map((cat, idx) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                >
                  <Link
                    href={cat.href}
                    className="group flex flex-col items-center text-center space-y-3 h-full"
                  >
                    {/* Circle Image Pod with Pedestal Ring & Ambient Shadow */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-b from-[#f8fafc] to-[#edf2f9] shadow-[0_4px_16px_rgba(9,22,66,0.06)] group-hover:shadow-xl group-hover:-translate-y-1.5 transition-all duration-300 ring-2 ring-slate-200/90 group-hover:ring-4 group-hover:ring-[#f07000]/50 border border-slate-200/60 overflow-hidden flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white p-2.5 flex items-center justify-center relative border border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.img}
                          alt={cat.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/hero.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* Label & Count with Standard Readable Typography */}
                    <div className="pt-0.5 w-full flex flex-col items-center justify-between min-h-[56px]">
                      <p className="text-xs sm:text-sm font-extrabold text-[#091642] group-hover:text-[#f07000] transition-colors leading-snug line-clamp-2 px-1">
                        {cat.name}
                      </p>
                      <span className="text-[11px] text-slate-500 font-semibold mt-auto pt-1">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/80 inline-block font-semibold shadow-2xs">
                          {cat.count}
                        </span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            3. DUAL SPLIT PROMOTIONAL BANNERS (Agista Pattern)
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-6 sm:py-8 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

              {/* Banner 1: Emerald/Teal Gift Solutions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#005c53] via-[#042940] to-[#041f33] p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between min-h-[290px] group border border-emerald-400/30 ring-1 ring-white/10"
              >
                <div className="relative z-10 max-w-sm space-y-3">
                  <span className="text-xs font-black uppercase tracking-widest bg-white/20 text-emerald-200 px-3.5 py-1 rounded-full backdrop-blur-xs inline-block">
                    Corporate &amp; Luxury Gifts
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                    Elevate Your Brand Identity
                  </h3>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    Personalized corporate gift sets, luxury pen engravings, and branded executive mugs.
                  </p>
                </div>

                <div className="relative z-10 pt-6">
                  <Link
                    href="/products?category=Gifts"
                    className="inline-flex items-center gap-3 bg-white text-[#005c53] font-black text-sm pl-6 pr-2 py-2 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group/btn h-[48px]"
                  >
                    <span>Explore Gifts</span>
                    <span className="w-8 h-8 rounded-full bg-[#f07000] text-white flex items-center justify-center shadow-sm group-hover/btn:scale-105 transition-transform">
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                </div>

                {/* Decorative Background Product Illustration */}
                <div className="absolute -right-4 -bottom-6 w-52 h-52 opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/uploads/products/1791445210091-Amazoprint_business_printing_02.jpg"
                    alt="Gift solution"
                    className="w-full h-full object-cover rounded-full mix-blend-screen"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/uploads/hero.png';
                    }}
                  />
                </div>
              </motion.div>

              {/* Banner 2: Midnight/Cobalt Custom Apparel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#091642] via-[#102468] to-[#1c357f] p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between min-h-[290px] group border border-blue-400/30 ring-1 ring-white/10"
              >
                <div className="relative z-10 max-w-sm space-y-3">
                  <span className="text-xs font-black uppercase tracking-widest bg-white/20 text-cyan-200 px-3.5 py-1 rounded-full backdrop-blur-xs inline-block">
                    Custom Apparel &amp; Merch
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                    Define Your Unique Style
                  </h3>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    Heavyweight cotton t-shirts, embroidered caps, hoodies, and team uniform printing.
                  </p>
                </div>

                <div className="relative z-10 pt-6">
                  <Link
                    href="/products?category=Apparel%20%26%20Clothing"
                    className="inline-flex items-center gap-3 bg-white text-[#091642] font-black text-sm pl-6 pr-2 py-2 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group/btn h-[48px]"
                  >
                    <span>Explore Apparel</span>
                    <span className="w-8 h-8 rounded-full bg-[#f07000] text-white flex items-center justify-center shadow-sm group-hover/btn:scale-105 transition-transform">
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                </div>

                {/* Decorative Background Product Illustration */}
                <div className="absolute -right-4 -bottom-6 w-52 h-52 opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/uploads/hero.png"
                    alt="Custom apparel"
                    className="w-full h-full object-cover rounded-full mix-blend-screen"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/uploads/hero.png';
                    }}
                  />
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            4. SHOP POPULAR FILTERABLE SHOWCASE (Agista Asymmetric Grid)
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-slate-50/70">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header: Title on Left, Filter Pills on Right */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-4 border-b border-gray-200/70">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#f07000] bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-200/80 inline-block shadow-xs">
                  Top Rated Picks
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#091642] tracking-tight mt-2.5">
                  Shop <span className="text-[#091642]">Popular</span>
                </h2>
              </div>

              {/* Agista Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {POPULAR_FILTER_TABS.map((tab) => {
                  const isActive = selectedPopularTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedPopularTab(tab)}
                      className={cn(
                        'px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer',
                        isActive
                          ? 'bg-[#091642] text-white font-black shadow-md shadow-[#091642]/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
                      )}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asymmetric Grid: 1 Featured Banner + 3 Product Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Column 1: Agista Featured Vertical Promo Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="relative rounded-[26px] overflow-hidden bg-gradient-to-br from-[#101935] via-[#091642] to-[#061033] p-7 text-white shadow-xl flex flex-col justify-end min-h-[420px] group border border-white/15 ring-1 ring-white/10"
              >
                {/* Background Lifestyle Image */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/uploads/products/1791445210091-Amazoprint_business_printing_02.jpg"
                    alt="Mugs and Drinkware collection"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-60 mix-blend-overlay"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/uploads/hero.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061033] via-[#091642]/70 to-transparent" />
                </div>

                <div className="relative z-10 space-y-3.5">
                  <span className="text-xs font-black uppercase tracking-widest bg-white/20 text-orange-200 px-3 py-1 rounded-full inline-block backdrop-blur-xs">
                    Staff Favorite
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    Mugs &amp; Drinkware
                  </h3>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    Personalized insulated tumblers, ceramic mugs, and flasks with full-color press wrapping.
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/products?category=Gifts"
                      className="inline-flex items-center gap-3 bg-white text-[#091642] font-black text-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all group/btn"
                    >
                      <span>Browse Drinkware</span>
                      <span className="w-7 h-7 rounded-full bg-[#f07000] text-white flex items-center justify-center shadow-sm">
                        <ArrowRight size={14} />
                      </span>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Columns 2, 3, 4: Rich Popular Product Cards */}
              {filteredPopularProducts.slice(0, 6).map((prod: any, idx: number) => {
                const price = Number(prod.price || 0);
                const img = resolveImagePath(prod.imageUrl || prod.parentProductImageUrl);
                const discount = idx % 2 === 0 ? '-20%' : null;
                const specTags = getProductSpecTags(prod);

                return (
                  <motion.div
                    key={prod.id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                  >
                    <Link
                      href={prod.id ? `/design/${prod.productSlug}/start?subProductId=${prod.id}` : `/products`}
                      className="group block h-full"
                    >
                      <div className="bg-white rounded-[26px] p-5 border border-slate-200/90 hover:border-[#091642]/30 shadow-[0_4px_24px_rgba(9,22,66,0.04)] hover:shadow-[0_20px_48px_rgba(9,22,66,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">

                        {/* High-Fidelity Studio Pedestal Image */}
                        <div className="relative aspect-square rounded-[20px] overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e8edf6] p-4 mb-4 flex items-center justify-center border border-slate-200/70">
                          {img ? (
                            <Image
                              src={img}
                              alt={prod.name || 'Product'}
                              fill
                              className="object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-gray-400">
                              <Package size={32} />
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                            {discount && (
                              <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs border border-white/20">
                                {discount}
                              </span>
                            )}
                            <span className="bg-[#f07000] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs border border-white/20">
                              HOT
                            </span>
                          </div>

                          {/* Hover Action Overlay Icons (Agista Style) */}
                          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            <span
                              className="w-9 h-9 rounded-full bg-white text-slate-700 hover:text-[#f07000] shadow-md border border-slate-200/60 flex items-center justify-center transition-all hover:scale-110"
                              title="Add to Wishlist"
                            >
                              <Heart size={16} />
                            </span>
                            <span
                              className="w-9 h-9 rounded-full bg-white text-slate-700 hover:text-[#091642] shadow-md border border-slate-200/60 flex items-center justify-center transition-all hover:scale-110"
                              title="Quick View"
                            >
                              <Eye size={16} />
                            </span>
                          </div>
                        </div>

                        {/* Product Info & Tangible Specs */}
                        <div className="space-y-2 flex-1 text-left flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-black text-[#f07000] uppercase tracking-wider">
                                {prod.category || prod.productName || 'PREMIUM PRINT'}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                In Stock
                              </span>
                            </div>

                            <h4 className="text-sm sm:text-base font-extrabold text-[#091642] group-hover:text-[#f07000] transition-colors line-clamp-2 min-h-[44px] leading-snug">
                              {prod.name}
                            </h4>
                          </div>

                          {/* Spec Pills (Rich tangible card details) */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 min-h-[26px]">
                            {specTags.map((spec, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>

                          {/* 5-Star Rating with Review Count */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-amber-400 text-xs">★★★★★</span>
                            <span className="text-xs font-bold text-slate-700">4.9</span>
                            <span className="text-[11px] text-slate-400 font-medium">(48+ reviews)</span>
                          </div>
                        </div>

                        {/* Price & Action Button */}
                        <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-slate-100">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base sm:text-lg font-black text-[#091642] group-hover:text-[#f07000] transition-colors">
                                {price > 0 ? `₹${price.toFixed(2)}` : 'Get Quote'}
                              </span>
                              {discount && (
                                <span className="text-[11px] text-slate-400 line-through font-semibold">
                                  ₹{(price * 1.25).toFixed(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Min qty: 50 pcs</span>
                          </div>

                          <span className="inline-flex items-center gap-1.5 bg-[#f07000] hover:bg-[#d96500] text-white text-xs font-black px-4 py-2 rounded-full shadow-md shadow-[#f07000]/25 transition-all group-hover:scale-105 active:scale-95">
                            <span>Order</span>
                            <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* View Full Catalog */}
            <div className="mt-12 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[#091642] hover:bg-[#061033] text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-full shadow-md transition-all hover:scale-105"
              >
                <span>View Full Catalog</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            5. WE TURN IDEAS INTO BRANDED PRODUCTS (Agista 2-Col Showcase)
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 bg-white border-y border-gray-100">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

              {/* Left Column: Composite Visual (Polo, Lanyard, Mug, Bag) */}
              <div className="lg:col-span-6">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#ebf3ff] via-[#f0f5ff] to-[#e6efff] p-8 sm:p-12 border border-blue-100/60 shadow-lg min-h-[420px] flex items-center justify-center group">
                  {/* Subtle Background Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Visual Composition */}
                  <div className="relative z-10 w-full flex flex-col items-center space-y-6">
                    {/* Branded Polo Shirt Card */}
                    <div className="relative w-64 sm:w-72 aspect-[4/3] bg-gradient-to-br from-[#1a3db8] to-[#0f2575] rounded-2xl p-5 shadow-2xl text-white flex flex-col justify-between border border-white/20 transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full shadow-xs">
                          Polo T-Shirt DTF
                        </span>
                        <span className="text-xs text-cyan-200 font-bold">100% Bio-Wash</span>
                      </div>

                      <div className="my-auto text-center border-2 border-dashed border-white/40 rounded-xl p-4 bg-white/5 backdrop-blur-xs">
                        <p className="text-sm sm:text-base font-black uppercase tracking-widest text-white">
                          YOUR ARTWORK HERE
                        </p>
                        <p className="text-xs text-white/80 mt-1 font-medium">Vector Logo or Custom Print</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/90 font-bold">
                        <span>220 GSM Cotton</span>
                        <span className="text-amber-300 font-black">★ 4.9 Rating</span>
                      </div>
                    </div>

                    {/* Lanyard & Mug Floating Badges */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#f07000] flex items-center justify-center font-black text-sm shadow-xs">
                          🏷️
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#091642]">Lanyard Badges</p>
                          <p className="text-xs text-slate-500 font-medium">Custom Satin Ribbon</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm shadow-xs">
                          ☕
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#091642]">Ceramic Mugs</p>
                          <p className="text-xs text-slate-500 font-medium">Sublimation HD</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Title + 4 Agista Capability Badges */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#091642] bg-[#091642]/10 px-4 py-1.5 rounded-full border border-[#091642]/15 inline-block mb-3 shadow-xs">
                    Manufacturing Excellence
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#091642] tracking-tight leading-tight">
                    We Turn Ideas Into <span className="text-[#091642] block">Branded Products</span>
                  </h2>
                  <p className="text-gray-500 text-sm sm:text-base font-medium mt-3 leading-relaxed">
                    A rich collection of industrial capabilities and creative tools to visualize, proof, and manufacture your brand merchandise seamlessly.
                  </p>
                </div>

                {/* 4 Feature Items with Circular Colored Badges (Exact Agista Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <div className="w-11 h-11 rounded-full bg-[#f07000] text-white flex items-center justify-center shadow-md shadow-[#f07000]/25">
                      <Layers size={20} />
                    </div>
                    <h4 className="text-base font-black text-[#091642]">Rich Templates</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      A rich collection of modern, easy-to-read fonts and industry-tested layouts.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-11 h-11 rounded-full bg-[#3b5998] text-white flex items-center justify-center shadow-md shadow-[#3b5998]/25">
                      <Monitor size={20} />
                    </div>
                    <h4 className="text-base font-black text-[#091642]">Easy Customizer</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Adjust colors, upload vector logos, and inspect real-time 3D press-ready proofs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-11 h-11 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-md shadow-[#10b981]/25">
                      <Sparkles size={20} />
                    </div>
                    <h4 className="text-base font-black text-[#091642]">Free Icons &amp; Graphics</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Access a wide range of icons and graphic elements to enhance your designs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-11 h-11 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-md shadow-[#8b5cf6]/25">
                      <Printer size={20} />
                    </div>
                    <h4 className="text-base font-black text-[#091642]">Offset &amp; Screen HD</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Industrial grade 2400 DPI Heidelberg presses with true Pantone color fidelity.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: COMPLETE ECOSYSTEM (REDESIGNED ULTRA-PREMIUM BENTO HUB)
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-[#090D1A] text-white relative overflow-hidden">
          {/* Ambient Cosmic Background Lighting */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">

            {/* Section Header */}
            <motion.div {...FU()} className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide backdrop-blur-md shadow-lg shadow-indigo-500/5">
                <Sparkles size={13} className="text-indigo-400 animate-pulse" />
                <span>One Seamless Creative &amp; Manufacturing Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-headline leading-[1.15]">
                A Complete Printing{' '}
                <span className="text-indigo-400">
                  Ecosystem
                </span>
              </h2>
              <p className="text-slate-400 font-medium text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Bridging modern in-browser vector design, automated pre-flight verification, crowdsourced design quests, and high-precision commercial press production in one unified platform.
              </p>
            </motion.div>

            {/* 5-Pillar Interactive Bento Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {ECOSYSTEM_TABS.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'group relative text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden',
                      isActive
                        ? 'bg-slate-900/90 border-indigo-500/80 shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePillarGlow"
                        className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md',
                        isActive
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                          : 'bg-white/5 text-slate-400 border border-white/5 group-hover:text-white'
                      )}>
                        {tabIconMap[tab.id]}
                      </div>
                      <span className={cn(
                        'text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md font-mono',
                        isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500'
                      )}>
                        0{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <h4 className={cn('text-xs sm:text-sm font-bold tracking-tight transition-colors', isActive ? 'text-white' : 'text-slate-300 group-hover:text-white')}>
                        {tab.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                        {tab.subtitle}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-semibold text-slate-400 relative z-10">
                      <span>{tab.stat}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', tab.theme.tagBg)}>
                        {tab.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Central Showcase Card with Dynamic Stage */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 lg:p-12 relative overflow-hidden"
              >
                {/* Background Ambient Aura */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                  {/* Left Column: Details & Features */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border', activeData.theme.tagBg)}>
                          ● Pillar 0{ECOSYSTEM_TABS.findIndex(t => t.id === activeTab) + 1} / 05
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {activeData.pill}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight font-headline">
                        {activeData.heading}
                      </h3>
                      <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed">
                        {activeData.description}
                      </p>
                    </div>

                    {/* 4 Feature Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {activeData.subFeatures.map((sf, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all space-y-1.5 group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <CheckCircle2 size={12} />
                            </div>
                            <h5 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                              {sf.title}
                            </h5>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed pl-7">
                            {sf.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* CTA and Highlights */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <Button
                        asChild
                        size="lg"
                        className="h-12 px-7 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/25 group border-0"
                      >
                        <Link href={activeData.ctaHref} className="flex items-center gap-2">
                          <span>{activeData.ctaText}</span>
                          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span>Production Guaranteed</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: High-Fidelity Interactive Mockup */}
                  <div className="lg:col-span-6 flex justify-center lg:justify-end">
                    <div className="w-full max-w-[500px]">
                      {activeTab === 'studio' && <StudioMockup />}
                      {activeTab === 'verification' && <VerificationMockup />}
                      {activeTab === 'contests' && <ContestsMockup />}
                      {activeTab === 'printing' && <PrintingMockup />}
                      {activeTab === 'templates' && <TemplatesMockup subProducts={subProducts} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Pipeline: The 5-Step Unified Lifecycle */}
            <div className="pt-4">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-xl">
                <div className="text-center mb-6 space-y-1">
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-mono">End-to-End Synergy</p>
                  <h4 className="text-base sm:text-lg font-bold text-white">How the AmazoPrint Ecosystem Works Together</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
                  {[
                    { step: '01', title: 'Pick & Personalize', desc: 'Browse 10k+ templates or start with custom product blank.' },
                    { step: '02', title: 'Studio or Contest', desc: 'Design in vector canvas or crowdsource unique artist concepts.' },
                    { step: '03', title: 'Pre-flight Check', desc: 'Automated CMYK audit, DPI scan, and bleed safe zone inspection.' },
                    { step: '04', title: 'Commercial Press', desc: 'Smart geo-routed to nearest certified industrial offset/digital press.' },
                    { step: '05', title: 'Doorstep Delivery', desc: 'Real-time live courier tracking across 28,000+ PIN codes in India.' },
                  ].map((node, i) => (
                    <div
                      key={node.step}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-400/50 hover:bg-white/[0.06] transition-all flex flex-col justify-between space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          STEP {node.step}
                        </span>
                        {i < 4 && (
                          <ChevronRight size={14} className="text-slate-500 hidden lg:block" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">{node.title}</h5>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{node.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: LATEST PRODUCTS
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <motion.div {...FU()} className="text-center mb-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#f07000] border border-orange-200/80 text-xs font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full shadow-xs">
                <Flame size={13} className="text-[#f07000]" /> Featured Products
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#091642] tracking-tight">
                Latest Products
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-medium max-w-lg mx-auto">
                Discover our freshest additions — crafted for perfection.
              </p>
            </motion.div>

            {subProducts && subProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {subProducts.slice(0, 10).map((sp: any, i: number) => {
                  const price = Number(sp.price || 0);
                  const imgUrl = resolveImagePath(sp.imageUrl || sp.parentProductImageUrl);
                  return (
                    <motion.div key={sp.id || sp.productSlug || i} {...FU(i * 0.04)}>
                      <Link
                        href={sp.id ? `/design/${sp.productSlug}/start?subProductId=${sp.id}` : `/design/${sp.productSlug}/start`}
                        className="group block h-full"
                      >
                        <div className="h-full rounded-[22px] overflow-hidden border border-slate-200/90 bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(9,22,66,0.04)] hover:shadow-[0_20px_40px_rgba(9,22,66,0.12)] hover:border-[#f07000]/40 hover:-translate-y-1.5 flex flex-col justify-between">
                          {/* Image */}
                          <div className="relative overflow-hidden aspect-square bg-gradient-to-b from-[#f8fafc] to-[#edf2f9] p-3 flex items-center justify-center border-b border-slate-100">
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt={sp.name}
                                fill
                                className="object-contain p-3 transition-transform duration-700 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                <Palette className="w-8 h-8 text-slate-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                            {i < 3 && (
                              <span className="absolute top-2.5 left-2.5 text-[10px] font-black text-white bg-gradient-to-r from-orange-500 to-rose-500 px-2.5 py-0.5 rounded-full shadow-md border border-white/20">
                                🔥 Hot
                              </span>
                            )}
                            <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                              <span className="inline-flex items-center gap-1.5 bg-[#091642] text-white text-xs font-black px-4 py-2 rounded-full shadow-lg">
                                <ShoppingCart size={13} /> Quick Order
                              </span>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                            <div>
                              <p className="text-[11px] font-extrabold text-[#f07000] uppercase tracking-wider">{sp.category || sp.productName || 'PREMIUM PRINT'}</p>
                              <h4 className="text-sm sm:text-base font-extrabold text-[#091642] mt-1 line-clamp-2 min-h-[44px] group-hover:text-[#f07000] transition-colors leading-snug">{sp.name}</h4>
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-amber-400 text-xs">★★★★★</span>
                                <span className="text-xs font-bold text-slate-700">4.9</span>
                                <span className="text-[10px] text-slate-400 font-medium">(36+)</span>
                              </div>
                            </div>

                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block leading-none mb-1">FROM</span>
                                <span className="text-base sm:text-lg font-black text-[#091642]">₹{price > 0 ? price.toFixed(0) : '—'}</span>
                              </div>
                              {price > 0 && (
                                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 shadow-2xs px-2.5 py-0.5 rounded-full">
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
                className="inline-flex items-center gap-2 bg-[#091642] hover:bg-[#061033] text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-full transition-all shadow-lg shadow-[#091642]/20 hover:-translate-y-0.5"
              >
                <span>Browse All Products</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: TRUST BADGES
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-14 bg-gradient-to-br from-[#091642]/[0.02] via-slate-50 to-white border-y border-slate-200/60">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: <Package size={24} className="text-[#091642]" />,
                  bg: 'bg-[#091642]/10',
                  border: 'border-l-[#091642]',
                  title: 'Easy Online Design',
                  subtitle: 'Studio & File Upload',
                  desc: 'Design with interactive canvas tools or upload print-ready vector files.',
                },
                {
                  icon: <Printer size={24} className="text-emerald-600" />,
                  bg: 'bg-emerald-50',
                  border: 'border-l-emerald-500',
                  title: '99.99% Accuracy',
                  subtitle: 'Pre-Flight Verified',
                  desc: 'Every layout is audited for CMYK gamut, raster DPI, and hairline bleed bounds.',
                },
                {
                  icon: <Truck size={24} className="text-blue-600" />,
                  bg: 'bg-blue-50',
                  border: 'border-l-blue-500',
                  title: 'Pan-India Express',
                  subtitle: 'Fast Doorstep Delivery',
                  desc: 'Tracked dispatch across 28,000+ pincodes with guaranteed delivery timelines.',
                },
                {
                  icon: <ShieldCheck size={24} className="text-[#f07000]" />,
                  bg: 'bg-orange-50',
                  border: 'border-l-[#f07000]',
                  title: 'Price Beat Promise',
                  subtitle: 'Direct-to-Press Rates',
                  desc: 'Premium commercial offset & digital press pricing with zero hidden fees.',
                },
              ].map((item, i) => (
                <motion.div key={i} {...FU(i * 0.08)}>
                  <div className={cn('flex gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 border-l-4 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full items-start', item.border)}>
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs', item.bg)}>
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-[#091642] text-sm leading-tight">{item.title}</p>
                      <p className="text-xs text-[#f07000] font-bold">{item.subtitle}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{item.desc}</p>
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
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
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
                  <div className="bg-white/[0.08] border border-white/20 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4 hover:bg-white/[0.14] hover:border-white/35 transition-all shadow-lg shadow-black/20">
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
        <section className="py-16 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <motion.div {...FU()} className="text-center mb-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider shadow-xs">
                <Zap size={14} className="text-indigo-600 animate-pulse" />
                <span>Instant Direct Orders</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#091642] tracking-tight flex items-center justify-center gap-2">
                <Store size={28} className="text-[#f07000]" />
                Direct Selling Products
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto">
                Ready-to-ship printed goods &amp; merchandise available for immediate ordering from verified partners.
              </p>
            </motion.div>

            {directSellingProducts && directSellingProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {directSellingProducts.slice(0, 5).map((sp: any, i: number) => {
                  const price = Number(sp.sellingPrice || sp.price || 0);
                  const rawImg = (Array.isArray(sp.imageUrls) && sp.imageUrls.length > 0 ? sp.imageUrls[0] : null) || sp.imageUrl || '';
                  const imgUrl = rawImg ? resolveImagePath(rawImg) : null;
                  return (
                    <motion.div key={sp.id || i} {...FU(i * 0.04)}>
                      <Link href={`/products`} className="group block h-full">
                        <div className="h-full rounded-[22px] overflow-hidden border border-slate-200/90 bg-white hover:border-[#091642]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-[0_4px_20px_rgba(9,22,66,0.04)]">
                          <div>
                            <div className="relative overflow-hidden aspect-square bg-gradient-to-b from-[#f8fafc] to-[#edf2f9] p-3 flex items-center justify-center border-b border-slate-100">
                              {imgUrl ? (
                                <Image src={imgUrl} alt={sp.name || 'Product'} fill className="object-contain p-3 group-hover:scale-110 transition-transform duration-700" />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-slate-400" />
                                </div>
                              )}
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-xs border border-slate-200/80">
                                {sp.category || 'READY-TO-SHIP'}
                              </span>
                            </div>
                            <div className="p-4 pb-2">
                              <p className="text-sm sm:text-base font-extrabold text-[#091642] line-clamp-2 min-h-[44px] group-hover:text-[#f07000] transition-colors leading-snug">{sp.name || 'Product'}</p>
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-amber-400 text-xs">★★★★★</span>
                                <span className="text-xs font-bold text-slate-700">4.9</span>
                                <span className="text-[10px] text-slate-400 font-medium">(28+)</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 pt-3 flex items-center justify-between border-t border-slate-100 mt-2">
                            {price > 0 ? (
                              <p className="text-base sm:text-lg font-black text-[#091642]">₹{price.toFixed(0)}</p>
                            ) : (
                              <p className="text-sm font-bold text-slate-400">Get Quote</p>
                            )}
                            <span className="inline-flex items-center gap-1.5 bg-[#f07000] hover:bg-[#d96500] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md shadow-[#f07000]/25 transition-all group-hover:scale-105 active:scale-95">
                              <span>Order</span>
                              <ArrowRight size={13} />
                            </span>
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
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#091642]/10">
              {[
                { icon: <ShoppingCart size={22} className="text-[#464674]" />, bg: 'bg-[#464674]/10', val: '10,000+', lbl: 'Orders Completed' },
                { icon: <Clock size={22} className="text-indigo-600" />, bg: 'bg-indigo-50', val: '2,000+', lbl: 'Verified Printers' },
                { icon: <Users size={22} className="text-violet-600" />, bg: 'bg-violet-50', val: '5,000+', lbl: 'Creative Designers' },
                { icon: <Globe size={22} className="text-emerald-600" />, bg: 'bg-emerald-50', val: '500+', lbl: 'Cities Served' },
                { icon: <Award size={22} className="text-yellow-600" />, bg: 'bg-yellow-50', val: '98%', lbl: 'Satisfaction Rate' },
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
            SECTION: TESTIMONIALS (Agista "See What Our Customers Say")
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="bg-[#edf2fc] rounded-3xl p-8 sm:p-14 text-center border border-blue-100/80 shadow-xs">
              {/* Header */}
              <div className="space-y-3 mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-[#091642] tracking-tight">
                  See What Our <span className="text-[#f07000]">Customers Say</span>
                </h2>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-gray-700">
                  <span>4.82/5</span>
                  <span className="text-emerald-500 text-base">★</span>
                  <span className="text-gray-900 font-extrabold tracking-tight">Trustpilot</span>
                </div>
              </div>

              {/* 3 Agista Testimonial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  {
                    name: 'Esther Howard',
                    headline: 'T-shirt printing made easy.',
                    quote: 'Great quality apparel printing. The cotton feel is soft and breathable, and our company team logos came out incredibly sharp.',
                    role: 'Verified Buyer',
                  },
                  {
                    name: 'Robert Fox',
                    headline: 'Spot UV visiting cards are stunning!',
                    quote: 'Amazoprint delivered 1,000 spot UV gold foil visiting cards within 48 hours. The paper thickness and registration were immaculate.',
                    role: 'Creative Director, Studio Aura',
                  },
                  {
                    name: 'Eleanor Pena',
                    headline: 'Fast turnaround for company swag.',
                    quote: 'Ordered insulated tumblers and branded executive notebooks for our national sales meet. Every item was packed flawlessly.',
                    role: 'Operations Lead, NovaTech',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-slate-200/80 hover:border-slate-300 h-full"
                  >
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-base text-[#091642]">{item.name}</h4>
                          <div className="flex items-center text-amber-400 text-xs">
                            {'★★★★★'}
                          </div>
                        </div>
                        <h5 className="font-bold text-sm text-[#091642] pt-2">
                          {item.headline}
                        </h5>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium italic my-2 flex-1">
                        &quot;{item.quote}&quot;
                      </p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-semibold">{item.role}</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: NEWSLETTER BAR (Agista "Keep Me Updated")
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-14 bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="bg-[#091642] rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/10">
              {/* Left Column: Heading & Testimonial Quote */}
              <div className="space-y-3 max-w-lg text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#f07000] bg-white/10 px-3 py-1 rounded-full border border-white/10 shadow-2xs">
                  Keep Me Updated
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Get Special Offers &amp; Free Templates
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &quot;Fantastic print gear! Performed flawlessly, gave peace of mind throughout our pan-India launch. Felt confident and professional.&quot;
                </p>
                <p className="text-[11px] text-[#f07000] font-bold">— Ritu Sen, Creative Director at Apex Studio</p>
              </div>

              {/* Right Column: Pill Email Form with Orange Circular Arrow */}
              <div className="w-full max-w-md">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert('Thank you for subscribing to Amazoprint offers!');
                  }}
                  className="flex items-center bg-white rounded-full pl-5 pr-1.5 py-1.5 shadow-lg border border-transparent focus-within:border-[#f07000] focus-within:ring-2 focus-within:ring-[#f07000]/30 transition-all"
                >
                  <input
                    type="email"
                    required
                    placeholder="Your email address..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-full bg-[#f07000] hover:bg-[#d96500] text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md shadow-[#f07000]/30 cursor-pointer"
                    aria-label="Subscribe"
                  >
                    <ArrowRight size={16} />
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-2 text-center lg:text-left">
                  We respect your privacy. No spam, unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── AGISTA FLOATING BACK-TO-TOP BUTTON (Bottom-Right) ── */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#f07000] hover:bg-[#d96500] text-white shadow-xl shadow-[#f07000]/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/25"
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>

      <Footer />
    </div>
  );
}
