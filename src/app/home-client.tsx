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
                <p className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-wider font-display">
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
            { designer: 'Neil D.',    rating: '★ 4.8', tag: 'Entry #12', bg: 'from-emerald-800 to-slate-950', sel: false },
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

          <div className="w-full px-3 sm:px-4 lg:px-6 py-6 sm:py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">

              {/* ── Visual Showcase (Order 2 on mobile, Order 1 on Desktop) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75 }}
                className="relative order-2 lg:order-1 w-full"
              >
                <HeroMonitorMockup />
              </motion.div>

              {/* ── Copy + CTA (Order 1 on mobile, Order 2 on Desktop) ── */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1 }}
                className="space-y-4 sm:space-y-6 lg:pl-4 order-1 lg:order-2"
              >
                {/* Trust badge */}
                <span className="inline-flex items-center gap-2 bg-[#464674]/10 border border-[#464674]/20 text-[#464674] text-[10px] sm:text-[11px] font-bold tracking-wide px-3.5 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  India's Most Trusted Printing Ecosystem
                </span>

                {/* Headline */}
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-2xl sm:text-4xl lg:text-[2.85rem] font-black text-gray-900 tracking-tight leading-[1.2] lg:leading-[1.15] font-display">
                    Create beautiful designs on{' '}
                    <span className="text-[#464674] font-classy italic font-black">Amazoprint</span>
                    <br />
                    <span className="text-gray-800 text-xl sm:text-3xl font-black font-display">and get printing delivered</span>{' '}
                    <span className="text-gray-500 text-lg sm:text-2xl font-semibold font-body">right on doorstep!</span>
                  </h1>

                  {/* Tagline */}
                  <p className="text-gray-800 text-lg sm:text-2xl font-black leading-tight font-display">
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
                <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-1">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#464674] to-[#5c5c96] hover:from-[#5c5c96] hover:to-[#464674] text-white font-black text-xs sm:text-sm px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl shadow-xl shadow-[#464674]/25 transition-all hover:-translate-y-0.5 group"
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
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
                      {activeTab === 'studio'       && <StudioMockup />}
                      {activeTab === 'verification' && <VerificationMockup />}
                      {activeTab === 'contests'     && <ContestsMockup />}
                      {activeTab === 'printing'     && <PrintingMockup />}
                      {activeTab === 'templates'    && <TemplatesMockup subProducts={subProducts} />}
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
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 transition-colors flex flex-col justify-between space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          STEP {node.step}
                        </span>
                        {i < 4 && (
                          <ChevronRight size={14} className="text-slate-600 hidden lg:block" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">{node.title}</h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{node.desc}</p>
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
                    <motion.div key={sp.id || sp.productSlug || i} {...FU(i * 0.04)}>
                      <Link
                        href={sp.id ? `/design/${sp.productSlug}/start?subProductId=${sp.id}` : `/design/${sp.productSlug}/start`}
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
