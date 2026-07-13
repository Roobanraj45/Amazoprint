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
  { emoji: '🪪', name: 'Business Cards', from: '₹149', bg: 'from-[#464674]/5 to-[#464674]/20', dot: 'bg-[#464674]' },
  { emoji: '📄', name: 'Flyers', from: '₹199', bg: 'from-orange-50 to-amber-100', dot: 'bg-orange-500' },
  { emoji: '📋', name: 'Brochures', from: '₹299', bg: 'from-violet-50 to-purple-100', dot: 'bg-violet-500' },
  { emoji: '⭐', name: 'Stickers', from: '₹99', bg: 'from-yellow-50 to-lime-100', dot: 'bg-yellow-500' },
  { emoji: '🖼️', name: 'Posters', from: '₹149', bg: 'from-green-50 to-emerald-100', dot: 'bg-emerald-500' },
  { emoji: '🏳️', name: 'Banners', from: '₹249', bg: 'from-red-50 to-rose-100', dot: 'bg-red-500' },
  { emoji: '📦', name: 'Packaging', from: '₹499', bg: 'from-amber-50 to-orange-100', dot: 'bg-amber-600' },
  { emoji: '👕', name: 'T-Shirts', from: '₹399', bg: 'from-pink-50 to-fuchsia-100', dot: 'bg-pink-500' },
];

const HOW_STEPS = [
  { n: '01', icon: <Search size={26} />, label: 'Choose Product', desc: 'Pick from 500+ print products across categories.', grad: 'from-[#464674] to-[#5c5c96]' },
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
// ─── Complete Ecosystem Mockups ──────────────────────────────────────────────
const ECOSYSTEM_TABS = [
  {
    id: 'studio',
    label: '🎨 Design Studio',
    heading: 'Pro-level design tool in your browser',
    description: 'Create, customize, and preview your artwork in real-time. No design experience or expensive software installation required.',
    ctaText: 'Open Design Studio',
    ctaHref: '/design',
    subFeatures: [
      { title: 'Interactive Canvas', desc: 'Drag-and-drop text, images, shapes, and layer them dynamically.' },
      { title: 'Thousands of Templates', desc: 'Start with high-quality designs crafted by design professionals.' },
      { title: '300 DPI High-Res Export', desc: 'Generate print-ready vector PDF formats for pixel-perfect clarity.' },
      { title: 'Bleed Safety Margin safety', desc: 'Real-time safety guides ensure your content is never clipped.' }
    ]
  },
  {
    id: 'verification',
    label: '🔍 Print Verification',
    heading: '100% Print-ready check, guaranteed',
    description: 'Ensure perfect print results before you pay. Our automated validation engine and expert designers review every layout file.',
    ctaText: 'Explore Templates',
    ctaHref: '/templates',
    subFeatures: [
      { title: 'Automated Pre-flight Check', desc: 'Checks image resolution, vector line thickness, and font outlines.' },
      { title: 'CMYK Color Space Audit', desc: 'Prevents color mismatches by checking ink values before press.' },
      { title: 'Bleed & Margin Safety', desc: 'Validates that safety zones and margins are properly formatted.' },
      { title: 'Expert Peer-Review Option', desc: 'Connect with a certified designer to manually verify your file.' }
    ]
  },
  {
    id: 'contests',
    label: '🏆 Design Contests',
    heading: 'Crowdsource unique artwork concepts',
    description: 'Get custom layouts from our design community. Set a prize pool, receive entries, and select the ultimate winner.',
    ctaText: 'Browse Design Contests',
    ctaHref: '/contests',
    subFeatures: [
      { title: 'Launch in Minutes', desc: 'Publish your brief, upload brand assets, and choose your prize pool.' },
      { title: 'Dozens of Submissions', desc: 'Talented designers pitch unique mockups tailor-made for you.' },
      { title: 'Direct Collaboration', desc: 'Rate designs, leave critiques, and request adjustments.' },
      { title: 'Complete Source File Delivery', desc: 'Download original vectors and trigger print queue on approval.' }
    ]
  },
  {
    id: 'printing',
    label: '🖨️ Print Fulfillment',
    heading: 'Direct-to-press print fulfillment engine',
    description: 'Our automated network routes jobs to top offset and digital print shops. Real-time production tracking right to your door.',
    ctaText: 'Become a Print Partner',
    ctaHref: '/printer-registration',
    subFeatures: [
      { title: 'Verified Press Network', desc: 'Only vetted commercial printers with high-capacity presses.' },
      { title: 'Industrial Finish Coatings', desc: 'Matte, gloss, spot UV, embossing, and custom die cuts.' },
      { title: 'Automated Order Routing', desc: 'Intelligent georouting matches orders for fast regional delivery.' },
      { title: 'Live Tracker Updates', desc: 'Follow progress through offset plates, print, cutting, and shipping.' }
    ]
  }
];

function StudioMockup() {
  return (
    <div className="w-full max-w-[480px] bg-slate-950/90 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Window Header */}
      <div className="bg-slate-900/90 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Canvas Editor</span>
        <div className="w-8 h-2 bg-white/5 rounded-full" />
      </div>
      {/* Content Area */}
      <div className="p-4 grid grid-cols-12 gap-3 min-h-[260px] bg-slate-950">
        {/* Editor Sidebar */}
        <div className="col-span-3 space-y-1.5 border-r border-white/5 pr-2">
          {['Layouts', 'Text', 'Shapes', 'Uploads'].map((t, i) => (
            <div key={t} className={cn("text-[9px] font-black p-1.5 rounded-md cursor-pointer", i === 0 ? "bg-[#464674] text-white animate-pulse" : "text-gray-400 hover:text-white hover:bg-white/5")}>
              {t}
            </div>
          ))}
          <div className="pt-4 space-y-1">
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">Layers</span>
            <div className="h-1 w-full bg-white/10 rounded-full" />
            <div className="h-1 w-3/4 bg-white/10 rounded-full" />
          </div>
        </div>
        {/* Editor Workspace Canvas */}
        <div className="col-span-9 flex items-center justify-center p-2 relative bg-slate-900 rounded-xl overflow-hidden border border-white/5">
          {/* Business card preview */}
          <div className="w-full aspect-[1.75/1] bg-gradient-to-br from-[#464674] via-[#5c5c96] to-[#2f2f54] rounded-lg shadow-lg relative overflow-hidden p-3 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black text-white tracking-wide">AMAZOPRINT</p>
                <p className="text-[6px] text-white/60 font-semibold uppercase tracking-widest">Premium Card</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles size={8} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-white">Alexander Thorne</p>
              <p className="text-[5px] text-white/70">Co-Founder & CEO</p>
            </div>
            {/* Bleed line guide */}
            <div className="absolute inset-1.5 border border-dashed border-white/20 rounded pointer-events-none" />
            <span className="absolute bottom-1 right-2 text-[5px] text-white/30 tracking-widest font-mono">3.5 x 2.0 in</span>
          </div>
          {/* Floating properties palette */}
          <div className="absolute bottom-2 right-2 bg-slate-950/90 border border-white/10 rounded-lg p-1.5 shadow-xl text-[7px] space-y-1 backdrop-blur-md">
            <p className="font-bold text-gray-400">Typography</p>
            <div className="flex gap-1.5">
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
    <div className="w-full max-w-[480px] bg-slate-950/90 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Window Header */}
      <div className="bg-slate-900/90 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Pre-flight Checklist</span>
        <div className="flex gap-1">
          <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">CMYK</span>
        </div>
      </div>
      {/* Content Area */}
      <div className="p-4 space-y-3.5 bg-slate-950 min-h-[260px] flex flex-col justify-center">
        {/* Verification Status Card */}
        <div className="bg-slate-900 rounded-xl p-3 border border-white/5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <p className="text-[10px] font-black text-white">File Inspection: business_card.pdf</p>
              <p className="text-[7px] text-gray-400">Uploaded by Client • Checked automatically & peer-reviewed</p>
            </div>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ✓ Ready for Print
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Bleed Safety Margin (0.125")', status: 'Passed', val: 'Correctly padded' },
              { label: 'Color Format', status: 'CMYK Convert', val: 'Coated FOGRA39' },
              { label: 'Asset Resolution', status: '300+ DPI', val: 'Passed (340 DPI)' },
              { label: 'Fonts & Vectors', status: 'Embedded', val: 'Passed (Outlined)' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-950 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-gray-400">{item.label}</span>
                  <span className="text-[7px] font-black text-emerald-400">{item.status}</span>
                </div>
                <p className="text-[9px] font-black text-white mt-1">{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Checked By bubble */}
        <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-[9px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#464674] flex items-center justify-center text-white font-bold text-[8px]">
              RD
            </div>
            <div>
              <p className="font-black text-white">Reviewer: Rohan Das</p>
              <p className="text-[7px] text-gray-400">Certified Print Specialist • verified 2h ago</p>
            </div>
          </div>
          <span className="text-[7px] bg-[#464674] text-white font-bold px-1.5 py-0.5 rounded">Verified Freelancer</span>
        </div>
      </div>
    </div>
  );
}

function ContestsMockup() {
  return (
    <div className="w-full max-w-[480px] bg-slate-950/90 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Window Header */}
      <div className="bg-slate-900/90 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Active Design Quest</span>
        <span className="text-[8px] bg-yellow-500/20 text-yellow-400 font-black px-2 py-0.5 rounded-full">
          Prize: ₹5,000
        </span>
      </div>
      {/* Content Area */}
      <div className="p-4 space-y-3 bg-slate-950 min-h-[260px] flex flex-col justify-between">
        {/* Contest Header info */}
        <div>
          <h4 className="text-[11px] font-black text-white">Quest: "Elite Brews Coffee Brand Logo"</h4>
          <p className="text-[7px] text-gray-400">14 Active Designers • 42 Entries Submitted • 3 Days Left</p>
        </div>

        {/* Submissions Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { designer: 'Aravind K.', rating: 5, bg: 'from-amber-700 to-amber-950', isSelected: true },
            { designer: 'Shalini S.', rating: 4, bg: 'from-zinc-800 to-zinc-950', isSelected: false },
            { designer: 'Neil D.', rating: 3, bg: 'from-stone-800 to-stone-950', isSelected: false }
          ].map((entry, idx) => (
            <div key={idx} className={cn("rounded-lg border overflow-hidden transition-all bg-slate-900 flex flex-col justify-between", entry.isSelected ? "border-[#464674] ring-1 ring-[#464674]" : "border-white/5")}>
              {/* Graphic container */}
              <div className={cn("aspect-square bg-gradient-to-br flex items-center justify-center p-2 relative", entry.bg)}>
                <div className="text-center text-white space-y-1">
                  <p className="text-[8px] font-black tracking-widest leading-none">EB</p>
                  <p className="text-[4px] font-bold tracking-widest opacity-60">ELITE BREWS</p>
                </div>
                {entry.isSelected && (
                  <span className="absolute top-1 right-1 text-[5px] bg-[#464674] text-white px-1 py-0.2 rounded font-black">
                    Selected
                  </span>
                )}
              </div>
              {/* Info strip */}
              <div className="p-1 px-1.5 flex justify-between items-center text-[7px]">
                <span className="font-bold text-gray-400 truncate max-w-[40px]">{entry.designer}</span>
                <span className="text-yellow-400">★ {entry.rating}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Select Winner Panel */}
        <div className="bg-slate-900 border border-white/5 rounded-lg p-2 flex items-center justify-between">
          <div className="text-[8px]">
            <p className="font-black text-white">Design Quest Selection</p>
            <p className="text-gray-400">Pick winner to release prize & print files.</p>
          </div>
          <button className="text-[8px] font-black text-white bg-[#464674] hover:bg-[#5c5c96] px-3 py-1 rounded-md transition-colors">
            Choose Winner & Print
          </button>
        </div>
      </div>
    </div>
  );
}

function PrintingMockup() {
  return (
    <div className="w-full max-w-[480px] bg-slate-950/90 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Window Header */}
      <div className="bg-slate-900/90 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Fulfillment Engine</span>
        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full">
          Live Routing
        </span>
      </div>
      {/* Content Area */}
      <div className="p-4 space-y-3.5 bg-slate-950 min-h-[260px] flex flex-col justify-center">
        {/* Routing card */}
        <div className="bg-slate-900 border border-white/5 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center text-[9px] font-black">
            <span className="text-white">Order Routing: #ORD-7392</span>
            <span className="text-emerald-400">● Printing Live</span>
          </div>
          {/* Step list */}
          <div className="space-y-2">
            {[
              { step: 'Order Placed', status: 'Completed', detail: 'Checked & Approved', isDone: true },
              { step: 'Routed to Local Press', status: 'Completed', detail: 'Galaxy Printers, Chennai (Offset)', isDone: true },
              { step: 'Production', status: 'In Progress', detail: '350 GSM Matte Cardstock + UV Coat', isDone: false, isCurrent: true },
              { step: 'Delivery Dispatch', status: 'Pending', detail: 'Tracked pan-India via Bluedart', isDone: false }
            ].map((s, idx) => (
              <div key={idx} className="flex gap-2 text-[8px]">
                <div className="flex flex-col items-center">
                  <div className={cn("w-3 h-3 rounded-full flex items-center justify-center font-bold text-[6px]", s.isDone ? "bg-emerald-500 text-white" : s.isCurrent ? "bg-[#464674] text-white animate-pulse" : "bg-white/10 text-gray-400")}>
                    {s.isDone ? "✓" : idx + 1}
                  </div>
                  {idx < 3 && <div className={cn("w-[1.5px] h-3", s.isDone ? "bg-emerald-500" : "bg-white/10")} />}
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className={cn("font-black", s.isDone || s.isCurrent ? "text-white" : "text-gray-500")}>{s.step}</p>
                    <p className="text-[7px] text-gray-400">{s.detail}</p>
                  </div>
                  <span className={cn("font-bold text-[7px]", s.isDone ? "text-emerald-400" : s.isCurrent ? "text-[#8b8bb3]" : "text-gray-500")}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeClient({
  subProducts,
  directSellingProducts,
}: {
  subProducts: any[];
  directSellingProducts: any[];
}) {
  const [activeTab, setActiveTab] = React.useState('studio');
  const activeData = ECOSYSTEM_TABS.find((t) => t.id === activeTab) || ECOSYSTEM_TABS[0];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      <main className="flex-1">

        {/* ═══════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#464674] via-[#5c5c96] to-[#2f2f54] pt-14 pb-0">
          {/* Background blobs */}
          <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-white/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
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
                    <span className="text-white">Print</span> Anything,{' '}
                    <br className="hidden sm:block" />
                    Design{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#b4b4d1] to-white">
                      Everything.
                    </span>
                  </h1>
                  <p className="text-white/80 text-base md:text-lg font-medium max-w-md leading-relaxed">
                    Create stunning designs, get instant quotes, connect with verified printers, and get your products delivered anywhere.
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 px-7 rounded-xl text-sm font-bold bg-white hover:bg-slate-50 text-[#464674] border-none shadow-2xl shadow-white/10 group"
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
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-white font-black text-sm leading-tight">{s.val}</p>
                        <p className="text-white/70 text-[10px] font-medium">{s.lbl}</p>
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
                    <p className="text-sm font-black text-[#464674]">We Print, You Grow 🚀</p>
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
                      <div className="p-5 bg-gradient-to-br from-slate-50 via-white to-[#464674]/5 min-h-[200px] flex items-center justify-center">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#464674] to-[#5c5c96] flex items-center justify-center shadow-xl">
                            <Palette size={30} className="text-white" />
                          </div>
                          <h3 className="text-lg font-black text-gray-900">AmazoPrint Studio</h3>
                          <p className="text-xs text-gray-400 font-medium">Design. Customize. Order.</p>
                          <div className="flex gap-2 justify-center flex-wrap">
                            {['Business Cards', 'Banners', 'Brochures', 'T-Shirts'].map((t) => (
                              <span key={t} className="text-[9px] bg-[#464674]/10 text-[#464674] font-bold px-2 py-1 rounded-full border border-[#464674]/20">{t}</span>
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
            SECTION: COMPLETE ECOSYSTEM (TABBED)
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            <motion.div {...FU()} className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-[#464674]/10 text-[#464674] border border-[#464674]/20 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full mb-3">
                <Globe size={12} /> One Platform — Four Pillars
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">
                A Complete Printing Ecosystem
              </h2>
              <p className="text-gray-500 font-medium text-base max-w-xl mx-auto leading-relaxed">
                Empowering customers, designers, and print partners with a high-fidelity workspace.
              </p>
            </motion.div>

            {/* Horizontal Tabs selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {ECOSYSTEM_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-xs font-black transition-all duration-300 border uppercase tracking-wider",
                    activeTab === tab.id
                      ? "bg-[#464674] border-[#464674] text-white shadow-lg shadow-[#464674]/25 scale-105"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Main Interactive Card */}
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-[#1f1f35] rounded-[2.5rem] border border-[#464674]/35 shadow-2xl p-6 lg:p-10 relative overflow-hidden min-h-[460px] flex flex-col justify-center"
            >
              {/* Light background glow effect */}
              <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#464674]/15 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                {/* Left side text contents */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-2xl lg:text-3xl font-black text-white leading-tight">
                      {activeData.heading}
                    </h3>
                    <p className="text-gray-300 text-xs md:text-sm font-medium leading-relaxed">
                      {activeData.description}
                    </p>
                  </div>

                  {/* Bullet points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeData.subFeatures.map((sf, idx) => (
                      <div key={idx} className="flex gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 size={11} className="text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white leading-tight">{sf.title}</h4>
                          <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">{sf.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Action */}
                  <div className="pt-2">
                    <Button asChild size="lg" className="h-11 px-7 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-[#464674] border-none shadow-xl shadow-white/5 group">
                      <Link href={activeData.ctaHref} className="flex items-center gap-1.5">
                        {activeData.ctaText}
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Right side mockups */}
                <div className="lg:col-span-6 flex justify-center lg:justify-end">
                  {activeTab === 'studio' && <StudioMockup />}
                  {activeTab === 'verification' && <VerificationMockup />}
                  {activeTab === 'contests' && <ContestsMockup />}
                  {activeTab === 'printing' && <PrintingMockup />}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION: POPULAR PRODUCTS
        ═══════════════════════════════════════════════════════════ */}
        <section className="overflow-hidden bg-white">

          {/* ── Dark header band ────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-[#2e2e4f] relative overflow-hidden">
            {/* Dot-grid texture */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }}
            />
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Title + pill scroller */}
            <div className="max-w-screen-xl mx-auto px-4 lg:px-6 pt-16 pb-10 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <motion.div {...FU()}>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/70 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                    <Flame size={11} className="text-orange-400" /> Best Sellers · 2025
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                    Popular<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b8bb3] to-white">
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
                          ? 'bg-[#464674] border-[#5c5c96] text-white shadow-lg shadow-[#464674]/30'
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
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {CATEGORIES.map((c, i) => (
                    <motion.div key={c.name} {...FI(i * 0.04)}>
                      <Link href="/products" className="group block">
                        <div className="relative rounded-2xl p-4 text-center bg-white border border-gray-150/60 shadow-sm hover:border-[#464674]/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
                          {/* Top-right color corner accent */}
                          <div className={cn("absolute top-0 right-0 w-12 h-12 rounded-bl-full opacity-10 bg-gradient-to-br group-hover:scale-110 transition-transform duration-500", c.bg)} />
                          
                          <div className="text-3xl mb-2 drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{c.emoji}</div>
                          <p className="text-[11px] font-black text-gray-900 leading-tight truncate group-hover:text-[#464674] transition-colors">{c.name}</p>
                          
                          <span className="inline-block text-[9px] text-white bg-[#464674] font-black px-2 py-0.5 rounded-full mt-2.5 shadow-sm shadow-[#464674]/15">
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
                          <div className={cn(
                            "h-full rounded-3xl overflow-hidden border border-gray-150/60 bg-white transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between",
                            isWide ? "md:flex-row" : ""
                          )}>
                            {/* Image Container */}
                            <div className={cn(
                              "relative overflow-hidden",
                              isWide ? "md:w-1/2 aspect-video md:aspect-auto h-full min-h-[220px]" : "aspect-square"
                            )}>
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={sp.name}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                  <Palette className="w-10 h-10 text-gray-300" />
                                </div>
                              )}
                              
                              {/* Dark overlay gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />

                              {/* Top Badges */}
                              <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                                {i < 3 && (
                                  <span className="text-[9px] font-black text-white bg-orange-500 px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                                    🔥 Hot
                                  </span>
                                )}
                                {sp.spotUvAllowed && (
                                  <span className="text-[9px] font-black text-white bg-violet-600 px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                                    UV Coat
                                  </span>
                                )}
                              </div>

                              {/* Quick Order CTA — slides up on hover */}
                              <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                                <span className="inline-flex items-center gap-1.5 bg-[#464674] text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-xl">
                                  <ShoppingCart size={11} /> Quick Order
                                </span>
                              </div>
                            </div>

                            {/* Info / Pricing Section */}
                            <div className={cn(
                              "p-5 flex flex-col justify-between flex-1",
                              isWide ? "md:w-1/2 md:p-6" : ""
                            )}>
                              <div className="space-y-1.5">
                                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">{sp.productName}</p>
                                <h4 className={cn(
                                  "font-black text-gray-900 leading-tight group-hover:text-[#464674] transition-colors",
                                  isWide ? "text-base md:text-lg" : "text-sm line-clamp-2"
                                )}>
                                  {sp.name}
                                </h4>
                              </div>

                              <div className="mt-5 pt-3 border-t border-gray-100 flex items-end justify-between">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] text-gray-400 font-extrabold block leading-none tracking-wider uppercase">STARTING AT</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-base font-black text-[#464674]">
                                      ₹{price > 0 ? price.toFixed(0) : '—'}
                                    </span>
                                    {price > 0 && (
                                      <span className="text-[9px] text-gray-300 font-medium line-through">
                                        ₹{(price * 1.3).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1.5">
                                  {price > 0 && (
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
                                      30% OFF
                                    </span>
                                  )}
                                  {isWide && (
                                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black text-[#464674] group-hover:translate-x-1 transition-transform duration-300">
                                      Customize →
                                    </span>
                                  )}
                                </div>
                              </div>
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
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#464674]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              {/* Text */}
              <motion.div {...FU()} className="space-y-6">
                <span className="inline-flex items-center gap-1.5 bg-[#464674]/10 text-[#464674] text-[11px] font-bold tracking-wide px-3 py-1 rounded-full border border-[#464674]/20">
                  <Monitor size={12} /> Powerful Online Design Studio
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  Professional Design{' '}
                  <span className="text-[#464674]">Studio</span>{' '}
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
                      <div className="w-5 h-5 rounded-full bg-[#464674]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCheck size={11} className="text-[#464674]" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild size="lg" className="h-11 px-7 rounded-xl text-sm font-bold bg-[#464674] hover:bg-[#5c5c96] text-white border-none shadow-lg shadow-[#464674]/20 group">
                    <Link href="/design" className="flex items-center gap-2">
                      Open Design Studio <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="h-11 px-7 rounded-xl text-sm font-bold border-[#464674]/20 text-[#464674] hover:bg-[#464674]/5">
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
                      <span className="text-[10px] font-bold text-white bg-[#464674] px-2.5 py-1 rounded-md">Preview</span>
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
                            idx === 0 ? 'bg-[#464674]/10 text-[#464674]' : 'text-gray-500 hover:bg-gray-100'
                          )}
                        >
                          <LayoutGrid size={11} />
                          <span className="text-[10px] font-bold">{t}</span>
                        </div>
                      ))}
                    </div>
                    {/* Canvas */}
                    <div className="col-span-2 bg-gray-200 flex items-center justify-center p-4">
                      <div className="w-full aspect-[1.75/1] bg-gradient-to-br from-[#464674] to-[#5c5c96] rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                          <div>
                            <p className="text-white font-black text-xs">JAMES ANDERSON</p>
                            <p className="text-white/60 text-[8px] font-medium">Creative Director</p>
                          </div>
                          <div>
                            <p className="text-white/80 text-[7px]">+91 98XXX XXXXX</p>
                            <p className="text-white/80 text-[7px]">james@studio.com</p>
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
                      <div className="bg-[#464674] rounded-xl p-2.5 text-center mt-2">
                        <p className="text-[9px] text-white/60 font-medium">Total Price</p>
                        <p className="text-base font-black text-white">₹249</p>
                        <button className="w-full mt-1.5 text-[9px] font-black text-[#464674] bg-white rounded-lg py-1 hover:bg-slate-50 transition-colors">
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
        <section className="py-20 bg-gradient-to-br from-[#464674] via-[#5c5c96] to-[#2f2f54] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 relative z-10">
            <motion.div {...FU()} className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full mb-3">
                <Zap size={12} className="text-yellow-300" /> Simple 4-Step Process
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                How AmazoPrint Works
              </h2>
              <p className="text-white/80 font-medium text-base max-w-lg mx-auto">
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
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#464674] text-[10px] font-black flex items-center justify-center shadow-lg">
                        {s.n}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base mb-1.5">{s.label}</h3>
                      <p className="text-white/70 text-xs font-medium leading-relaxed">{s.desc}</p>
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
                { icon: <ShoppingCart size={22} className="text-[#464674]" />, bg: 'bg-[#464674]/10', val: '10,000+', lbl: 'Orders Completed' },
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
        <section className="py-20 bg-gradient-to-br from-gray-50 to-[#464674]/5">
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
                  const grad = ['from-[#464674] to-[#5c5c96]', 'from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-red-500', 'from-pink-500 to-rose-600'][i % 5];
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
                <CarouselPrevious className="static translate-y-0 h-9 w-9 border-gray-200 hover:bg-[#464674] hover:text-white hover:border-[#464674] transition-all" />
                <CarouselNext className="static translate-y-0 h-9 w-9 border-gray-200 hover:bg-[#464674] hover:text-white hover:border-[#464674] transition-all" />
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
                  <span className="inline-flex items-center gap-1.5 bg-[#464674]/10 text-[#464674] border border-[#464674]/20 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full mb-3">
                    <Sparkles size={12} /> AmazoPrint Platform
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
                    Your One-Stop{' '}
                    <span className="text-[#464674]">Printing Marketplace</span>
                  </h2>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    From business cards to packaging — premium prints at competitive prices, delivered anywhere in India.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Palette size={18} />, label: '500+ Products', col: 'text-[#464674] bg-[#464674]/10' },
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
                <Button asChild size="lg" className="h-12 px-8 rounded-xl text-sm font-bold bg-[#464674] hover:bg-[#5c5c96] text-white border-none shadow-lg shadow-[#464674]/20 group">
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
                      <div className="bg-[#464674] px-5 py-3 flex items-center justify-between">
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
                        <div className="bg-gradient-to-r from-[#464674] to-[#5c5c96] rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-black text-white">🎉 30% OFF Today!</p>
                          <p className="text-[9px] text-white/70 font-medium mt-0.5">Limited time offer</p>
                        </div>
                        <div className="space-y-2">
                          {[
                            { name: 'Business Card', price: '₹149', tag: '🔥 Hot' },
                            { name: 'Custom Banner', price: '₹299', tag: '⭐ New' },
                          ].map((p) => (
                            <div key={p.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                              <span className="text-[10px] font-bold text-gray-700">{p.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-[#464674]">{p.price}</span>
                                <span className="text-[8px] bg-orange-55 text-orange-700 font-bold px-1.5 py-0.5 rounded-full">{p.tag}</span>
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
        <section className="py-24 bg-gradient-to-br from-[#464674] via-[#5c5c96] to-[#2f2f54] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 relative z-10 text-center">
            <motion.div {...FU()} className="max-w-3xl mx-auto space-y-8">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wide px-4 py-2 rounded-full">
                <Sparkles size={14} className="text-yellow-300" />
                Start Your Print Journey Today
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Ready to Create{' '}
                <br className="hidden md:block" />
                <span className="text-white">Something Amazing?</span>
              </h2>
              <p className="text-white/80 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                Join 10,000+ businesses and designers who trust AmazoPrint for premium quality printing across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" asChild className="h-14 px-10 rounded-2xl text-base font-black bg-white hover:bg-slate-50 text-[#464674] border-none shadow-2xl shadow-white/10 group">
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
                  <span key={t} className="text-[12px] font-bold text-white/85">{t}</span>
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
