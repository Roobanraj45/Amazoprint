'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Palette,
  Trophy,
  Leaf,
  ShieldCheck,
  Zap,
  Star,
  IndianRupee,
  CheckCircle2,
  Users,
  Briefcase,
  Globe,
  ShoppingCart,
  Clock,
  Award,
  Crown,
  MousePointer2,
  Building2,
  Flame,
  LayoutGrid,
  FileCheck,
} from 'lucide-react';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AmazoprintLogo } from '@/components/ui/logo';
import { cn, resolveImagePath } from '@/lib/utils';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNowStrict } from 'date-fns';

// --- Animation Variants ---
const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }
};

const STAGGER_CHILD = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' }
};

function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
      className={cn("relative z-10 w-full", className)}
    >
      {children}
    </motion.div>
  );
}

export function HomeClient({
  subProducts,
  directSellingProducts,
}: {
  subProducts: any[],
  directSellingProducts: any[],
}) {

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      <Navbar />

      <main className="flex-1">

        {/* --- 1. HERO SECTION (3D) --- */}
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-zinc-950 text-white min-h-[90vh] flex items-center">
          {/* Ambient animated background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-violet-600/20 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
          </div>

          <div className="container px-4 mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left text content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-8 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  The Future of Custom Print
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8 font-headline uppercase">
                  Design. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-primary bg-300% animate-gradient">Print.</span> <br />
                  Earn.
                </h1>
                <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed font-medium max-w-lg">
                  An immersive 3D-powered ecosystem connecting creative freelancers, global brands, and industrial printing presses.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button size="lg" asChild className="w-full sm:w-auto h-14 px-8 rounded-2xl text-sm font-black uppercase tracking-widest group shadow-[0_0_40px_-10px_hsl(var(--primary))] bg-primary hover:bg-primary/90 text-white">
                    <Link href="/products" className="flex items-center justify-center gap-2">
                      Start Designing <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="w-full sm:w-auto h-14 px-8 rounded-2xl text-sm font-black uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all backdrop-blur-sm">
                    <Link href="#ecosystem">
                      Explore Ecosystem
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Right 3D Interactive Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative perspective-1000 hidden lg:block"
              >
                <TiltCard>
                  <div className="relative w-[500px] h-[600px] mx-auto transform-gpu" style={{ transform: "translateZ(50px)" }}>
                    {/* Floating layers simulating a printed product being designed */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-[3rem] bg-white border border-white/10 shadow-2xl overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-b from-primary/10 to-transparent" />
                      <Image
                        src="/uploads/hero.png"
                        alt="Mockup"
                        fill
                        className="object-cover opacity-100 mix-blend-normal"
                        unoptimized
                      />
                    </motion.div>

                    {/* Floating UI Elements */}
                    <motion.div
                      animate={{ y: [0, 15, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="absolute -right-8 top-20 glass-card bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl transform-gpu" style={{ transform: "translateZ(80px)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Print Quality</p>
                          <p className="text-sm font-black text-white">Verified 300 DPI</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute -left-12 bottom-32 glass-card bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl transform-gpu" style={{ transform: "translateZ(100px)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <IndianRupee className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order Dispatched</p>
                          <p className="text-sm font-black text-white">+ ₹4,500 Earned</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </TiltCard>
              </motion.div>
            </div>
          </div>

          {/* Bottom curve */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[100px] md:h-[150px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-background"></path>
            </svg>
          </div>
        </section>

        {/* --- 2. ECOSYSTEM OVERVIEW (Three Pillars) --- */}
        <section id="ecosystem" className="py-32 bg-background relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
          <div className="container px-4 mx-auto relative z-10">
            <motion.div
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              variants={{
                initial: {},
                whileInView: { transition: { staggerChildren: 0.2 } }
              }}
              className="text-center mb-20"
            >
              <motion.div variants={FADE_UP} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-6">
                <Globe className="w-3 h-3" /> A Connected Network
              </motion.div>
              <motion.h2 variants={FADE_UP} className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-headline">
                The AmazoPrint <span className="text-primary">Ecosystem</span>
              </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-1000">
              {[
                {
                  title: 'For Brands',
                  desc: 'A professional 3D-ready design workspace with industrial printing output.',
                  icon: <Palette className="w-8 h-8 text-primary" />,
                  bg: 'bg-primary/5',
                  borderColor: 'border-primary/20',
                  delay: 0,
                  link: '/products',
                  btnText: 'Start Designing'
                },
                {
                  title: 'For Freelancers',
                  desc: 'Turn your creativity into steady income via live contests and verification jobs.',
                  icon: <Trophy className="w-8 h-8 text-violet-500" />,
                  bg: 'bg-violet-500/5',
                  borderColor: 'border-violet-500/20',
                  delay: 0.1,
                  link: '/contests',
                  btnText: 'Start Earning'
                },
                {
                  title: 'For Printing Presses',
                  desc: 'Connect to our global routing network and receive verified print orders instantly.',
                  icon: <Building2 className="w-8 h-8 text-emerald-500" />,
                  bg: 'bg-emerald-500/5',
                  borderColor: 'border-emerald-500/20',
                  delay: 0.2,
                  link: '/printer-registration',
                  btnText: 'Become a Partner'
                }
              ].map((pillar, i) => (
                <TiltCard key={i} className="h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: pillar.delay }}
                    className={cn("h-full rounded-3xl p-8 border backdrop-blur-sm flex flex-col items-start gap-6 group hover:shadow-2xl transition-all duration-300", pillar.bg, pillar.borderColor)}
                  >
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border bg-white/50 dark:bg-black/20", pillar.borderColor)}>
                      {pillar.icon}
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl font-black uppercase font-headline">{pillar.title}</h3>
                      <p className="text-muted-foreground font-medium leading-relaxed">{pillar.desc}</p>
                    </div>
                    <Button variant="ghost" asChild className="group/btn p-0 hover:bg-transparent h-auto mt-4 font-bold uppercase tracking-widest text-[11px]">
                      <Link href={pillar.link} className="flex items-center gap-2">
                        {pillar.btnText} <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </motion.div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* --- 3. TEMPLATE EXPLORATION --- */}
        <section className="py-24 relative overflow-hidden">
          <div className="container px-4 mx-auto">
            <TiltCard>
              <div className="relative overflow-hidden rounded-[3rem] bg-zinc-950 text-white p-12 md:p-20 border border-white/5 shadow-2xl">
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary font-black uppercase tracking-widest text-[10px]">
                      <LayoutGrid size={14} /> Design Ready
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline leading-[1.1]">
                      Don't Start from <br /><span className="text-primary">Scratch.</span>
                    </h2>
                    <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md">
                      Browse our library of premium, print-verified templates crafted by elite designers. Just swap your details and you're production-ready.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" asChild className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 group">
                        <Link href="/templates" className="flex items-center justify-center gap-2">
                          Explore Library <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="relative hidden lg:block">
                    {/* Mock template stack effect */}
                    <div className="relative w-full aspect-square max-w-md mx-auto">
                      <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-3xl rotate-6 translate-x-4 translate-y-4" />
                      <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-3xl -rotate-3 -translate-x-4 translate-y-2" />
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/20 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                        <Image 
                          src="/uploads/hero.png" 
                          alt="Template Preview" 
                          fill 
                          className="object-cover opacity-60 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center text-primary animate-pulse">
                            <Sparkles size={40} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* --- 4. JOIN & EARN --- */}
        <section className="py-24 bg-zinc-950 text-white overflow-hidden relative">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 blur-[180px] rounded-full opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container px-4 mx-auto relative z-10">
            {/* Section header */}
            <motion.div {...FADE_UP} className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-primary border border-white/10 text-[10px] font-black uppercase tracking-widest">
                <IndianRupee className="w-3 h-3" /> Join &amp; Earn
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline">
                Turn Your Talent <br className="hidden md:block" />
                into <span className="text-primary">Income.</span>
              </h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto font-medium leading-relaxed">
                Two powerful ways to earn. Pick your path and start making money with your creative skills today.
              </p>
            </motion.div>

            {/* Two cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

              {/* Card 1 — Contests */}
              <TiltCard>
                <div className="relative h-full rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 group shadow-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-primary/5 transform-gpu">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-10 flex flex-col h-full gap-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Quests</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase font-headline leading-tight">Design <br /> Contests</h3>
                      <p className="text-zinc-400 font-medium leading-relaxed text-sm">Compete in live design quests posted by real brands. Submit your best work, win prize money, and build a verified portfolio — all from one platform.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: <IndianRupee className="w-4 h-4" />, text: 'Cash Prizes' },
                        { icon: <Crown className="w-4 h-4" />, text: 'Top Rankings' },
                        { icon: <Users className="w-4 h-4" />, text: 'Community Voting' },
                        { icon: <Award className="w-4 h-4" />, text: 'Verified Wins' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
                          <span className="text-primary">{item.icon}</span>
                          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild size="lg" className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-[12px] uppercase tracking-widest group/btn shadow-lg shadow-primary/20">
                      <Link href="/contests" className="flex items-center justify-center gap-2">Browse Active Contests <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></Link>
                    </Button>
                  </div>
                </div>
              </TiltCard>

              {/* Card 2 — Verification Jobs */}
              <TiltCard>
                <div className="relative h-full rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-violet-400/50 transition-all duration-300 group shadow-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-500/5 transform-gpu">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-10 flex flex-col h-full gap-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
                        <FileCheck className="w-7 h-7 text-violet-400" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/20">
                        <Briefcase className="w-3 h-3 text-violet-400" />
                        <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Steady Income</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase font-headline leading-tight">Verification <br /> Jobs</h3>
                      <p className="text-zinc-400 font-medium leading-relaxed text-sm">Review and approve customer designs before they go to print. Earn per job, work at your own pace — perfect for designers who want consistent, flexible income.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: <Zap className="w-4 h-4" />, text: 'Per-Job Pay' },
                        { icon: <Clock className="w-4 h-4" />, text: 'Flexible Hours' },
                        { icon: <ShieldCheck className="w-4 h-4" />, text: 'Quality Control' },
                        { icon: <Globe className="w-4 h-4" />, text: 'Remote Work' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
                          <span className="text-violet-400">{item.icon}</span>
                          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild size="lg" className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[12px] uppercase tracking-widest group/btn shadow-lg shadow-violet-500/20">
                      <Link href="/freelancer/verifications" className="flex items-center justify-center gap-2">Start Verifying Designs <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></Link>
                    </Button>
                  </div>
                </div>
              </TiltCard>

            </div>
          </div>
        </section>

        {/* --- 4. INDUSTRIAL CATALOG (Staggered 3D Grid) --- */}
        {subProducts && subProducts.length > 0 && (
          <section className="py-32 bg-background relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-1/3 h-1/3 bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="container px-4 mx-auto relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-muted text-foreground border-border font-bold uppercase text-[10px] px-3 py-1.5">
                    Verified Material Specs
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline">Industrial <br /><span className="text-primary">Canvas.</span></h2>
                  <p className="text-lg text-muted-foreground font-medium max-w-xl leading-snug">Elite material specifications optimized for professional brand deployments. Start creating on premium stock.</p>
                </div>
                <Button asChild className="rounded-full h-12 px-6 font-bold uppercase tracking-widest group shadow-[0_10px_30px_-10px_hsl(var(--primary))]">
                  <Link href="/products" className="flex items-center gap-2">
                    View Enterprise Catalog <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {subProducts.map((subProduct: any, index: number) => {
                  const price = Number(subProduct.price || 0);
                  const imageUrl = resolveImagePath(subProduct.imageUrl || subProduct.parentProductImageUrl);
                  // Create a staggered masonry effect by pushing odd columns down
                  const transformClass = index % 2 !== 0 ? "lg:translate-y-12" : "";

                  return (
                    <motion.div
                      key={subProduct.id}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={transformClass}
                    >
                      <TiltCard className="h-full">
                        <Link href={`/design/${subProduct.productSlug}/start?subProductId=${subProduct.id}`} className="block h-full group">
                          <Card className="h-full flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border-border/40 bg-card/50 backdrop-blur-sm transform-gpu" style={{ transform: "translateZ(20px)" }}>
                            <CardHeader className="p-0 relative aspect-[3/4] overflow-hidden bg-muted/20">
                              {imageUrl ? (
                                <Image src={imageUrl} alt={subProduct.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Palette className="w-10 h-10 text-muted/30" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Price tag */}
                              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg transform translate-y-[-20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 border border-white/20">
                                <p className="text-xs font-black flex items-center text-primary"><IndianRupee size={12} />{price.toFixed(0)}</p>
                              </div>

                              <div className="absolute inset-x-0 bottom-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <Button className="w-full rounded-2xl bg-white text-primary hover:bg-zinc-100 font-bold uppercase text-[10px] tracking-widest shadow-xl">
                                  Select Material
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow space-y-4 relative bg-card border-t z-10">
                              <div className="space-y-1">
                                <h3 className="font-black text-xl group-hover:text-primary transition-colors uppercase font-headline tracking-tight leading-tight">{subProduct.name}</h3>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.1em]">{subProduct.productName}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">CMYK NATIVE</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </TiltCard>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>
        )}


        {/* --- 5. INFRASTRUCTURE GRID --- */}
        <section className="py-24 bg-zinc-900 text-white relative">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-3xl mb-20 space-y-4">
              <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[9px]">
                <ShieldCheck size={14} /> Technology Stack
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight uppercase font-headline">Engineered for <span className="text-primary">Scale.</span></h2>
              <p className="text-lg text-zinc-400 font-medium max-w-xl leading-relaxed">Industrial-grade precision meets cloud-native efficiency. Designed for zero-loss output at any production scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <motion.div {...FADE_UP} className="md:col-span-8 glass-card bg-white/5 border-white/5 rounded-[2.5rem] p-12 flex flex-col justify-between group">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-12 border border-primary/10 transition-transform group-hover:scale-110">
                  <Palette size={32} />
                </div>
                <div>
                  <h3 className="text-4xl font-black mb-6 font-headline uppercase leading-none">Vector-Native <br />Design Engine</h3>
                  <p className="text-zinc-400 text-lg max-w-md font-medium leading-relaxed">Precision studio built for raw asset fidelity. Full typography control and CMYK management.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card bg-gradient-to-br from-primary/10 to-transparent border-white/5 rounded-[2.5rem] p-12 flex flex-col justify-between">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-8 border border-primary/10">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black mb-4 font-headline uppercase leading-tight">Neural <br />Proofing</h3>
                  <p className="text-zinc-400 font-medium text-sm leading-relaxed">Automated high-res scaling and isolated background removal powered by AI.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card bg-white/5 border-white/5 rounded-[2.5rem] p-12 flex flex-col justify-between">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                  <FileCheck size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black mb-3 font-headline uppercase">Manual Audit</h4>
                  <p className="text-zinc-400 font-medium text-sm leading-relaxed">Pre-press checks by senior industrial designers for guaranteed output quality.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-8 glass-card bg-primary/5 border-white/5 rounded-[2.5rem] p-12 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                  <h4 className="text-3xl font-black font-headline uppercase">Global Routing</h4>
                  <p className="text-zinc-400 text-lg font-medium leading-relaxed">Real-time routing to optimal production hubs for zero-latency regional delivery.</p>
                </div>
                <div className="flex-shrink-0 w-32 h-32 bg-white/5 rounded-full flex items-center justify-center shadow-2xl border border-white/5">
                  <Globe className="w-16 h-16 text-primary" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 6. PARTNER CTA SECTION (Printer Dashboard Mockup) --- */}
        <section className="py-32 bg-zinc-50 dark:bg-zinc-950/50 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

          <div className="container px-4 mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true }}
                variants={{ initial: {}, whileInView: { transition: { staggerChildren: 0.15 } } }}
                className="space-y-6 order-2 lg:order-1"
              >
                <motion.div variants={FADE_UP}>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase text-[10px] px-3 py-1.5">
                    Printing Press Partner
                  </Badge>
                </motion.div>
                <motion.h2 variants={FADE_UP} className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline leading-[1.1]">
                  Fill Your <br />
                  <span className="text-emerald-500">Production</span> Capacity.
                </motion.h2>
                <motion.p variants={FADE_UP} className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
                  Transform your printing press into a global fulfillment node. Get ready-to-print verified files sent directly to your dashboard and get paid instantly.
                </motion.p>

                <motion.div variants={FADE_UP} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                  {[
                    { title: "Zero Pre-press", desc: "Files come 100% verified" },
                    { title: "Guaranteed Volume", desc: "Steady influx of orders" },
                    { title: "Instant Payouts", desc: "Automated settlements" },
                    { title: "Industrial Scale", desc: "API workflow integrations" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-black text-sm uppercase">{item.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={FADE_UP} className="pt-6">
                  <Button size="lg" asChild className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 group">
                    <Link href="/printer-registration" className="flex items-center gap-2">
                      Join Printing Network <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* 3D Dashboard Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 50, rotateY: 20 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, type: "spring", stiffness: 50 }}
                className="order-1 lg:order-2 perspective-1000 relative"
              >
                <TiltCard className="w-full max-w-lg mx-auto">
                  <div className="relative rounded-3xl bg-zinc-900 border border-zinc-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transform-gpu" style={{ transform: "translateZ(30px)" }}>
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">Active Partner</p>
                          <p className="text-sm font-bold text-white">Press Dashboard</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase">Online</Badge>
                    </div>

                    {/* Dashboard Content */}
                    <div className="p-6 space-y-4">
                      {/* Mock Incoming Order */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[9px] uppercase px-2 py-0 mb-2">New Order</Badge>
                            <p className="text-white font-black text-lg">500x Premium Cards</p>
                          </div>
                          <p className="text-emerald-400 font-black text-xl">₹2,400</p>
                        </div>
                        <div className="flex items-center gap-4 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1"><FileCheck className="w-3 h-3" /> Pre-verified</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due in 24h</span>
                        </div>
                      </motion.div>

                      {/* Mock Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-1">Today's Earnings</p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1 }}
                            className="text-white font-black text-2xl"
                          >₹18,500</motion.p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                          <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-1">Orders Queued</p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.2 }}
                            className="text-white font-black text-2xl"
                          >14</motion.p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating elements to add depth */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-6 top-1/3 glass-card bg-zinc-900 border border-emerald-500/30 p-3 rounded-xl shadow-2xl z-20"
                    style={{ transform: "translateZ(60px)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Receiving Files...</span>
                    </div>
                  </motion.div>
                </TiltCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 7. FINAL CTA --- */}
        <section className="py-32">
          <div className="container px-4 mx-auto">
            <div className="rounded-[4rem] p-16 md:p-32 text-center text-white relative overflow-hidden bg-zinc-950 shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_70%)]"></div>
              <div className="relative z-10 max-w-3xl mx-auto space-y-12">
                <h2 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase font-headline">Ready to <br /><span className="text-primary">Deploy?</span></h2>
                <p className="text-xl md:text-2xl opacity-80 font-medium tracking-tight leading-relaxed">Join the network of brands redefining the industrial print landscape.</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button size="xl" asChild className="h-16 px-12 rounded-full text-xl font-bold bg-white text-primary hover:bg-zinc-100 transition-all uppercase font-headline">
                    <Link href="/register">Initialize Account</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
