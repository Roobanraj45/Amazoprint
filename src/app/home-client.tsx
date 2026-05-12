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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary font-bold tracking-tight text-[11px] mb-8 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  The Future of Custom Print
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-[4rem] font-black tracking-tighter leading-[1.1] mb-6 font-headline text-white">
                  Design. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-primary bg-300% animate-gradient">Print.</span> <br />
                  Earn.
                </h1>
                <p className="text-base md:text-lg text-zinc-300 mb-8 leading-relaxed font-medium max-w-md">
                  An immersive 3D-powered ecosystem connecting creative freelancers, global brands, and industrial printing presses.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button size="lg" asChild className="w-full sm:w-auto h-12 px-6 rounded-xl text-[11px] font-bold tracking-tight group shadow-lg bg-primary hover:bg-primary/90 text-white border-none">
                    <Link href="/products" className="flex items-center justify-center gap-2">
                      Start Designing <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="w-full sm:w-auto h-12 px-6 rounded-xl text-[11px] font-bold tracking-tight bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all backdrop-blur-sm">
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
                          <p className="text-[10px] font-bold tracking-tight text-zinc-300">Print Quality</p>
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
                          <p className="text-[10px] font-bold tracking-tight text-zinc-300">Order Dispatched</p>
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

        {/* --- 2. FEATURED SLIDER --- */}
        <section className="py-24 bg-background overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="flex items-center justify-between mb-16">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] tracking-tight">
                  <Sparkles className="w-3 h-3" /> Popular Categories
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter font-headline">Explore <span className="text-primary">Featured</span> Products</h2>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-[11px] font-bold tracking-tight">
                  <Link href="/products" className="flex items-center gap-2">View All Products <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-4 md:-ml-6">
                {[
                  { title: "Premium Business Cards", image: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?w=800&auto=format&fit=crop&q=60", category: "Stationery" },
                  { title: "Luxury Packaging", image: "https://images.unsplash.com/photo-1512418490979-92798cedec3d?w=800&auto=format&fit=crop&q=60", category: "Box & Packing" },
                  { title: "Industrial Signage", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=60", category: "Marketing" },
                  { title: "Custom Apparels", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=60", category: "Branding" },
                  { title: "Promotional Flyers", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60", category: "Stationery" },
                  { title: "Bespoke Invitations", image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&auto=format&fit=crop&q=60", category: "Events" }
                ].map((item, index) => (
                  <CarouselItem key={index} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <TiltCard>
                      <div className="relative group cursor-pointer overflow-hidden rounded-3xl bg-card border border-border/40 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                        <div className="aspect-[4/5] relative">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                          <div className="absolute top-6 left-6">
                            <Badge className="bg-white/90 backdrop-blur-md text-primary hover:bg-white text-[9px] font-bold px-2 py-1 tracking-tight border-none">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="absolute bottom-8 left-8 right-8">
                            <h3 className="text-white text-2xl font-black font-headline tracking-tight leading-tight group-hover:translate-y-[-4px] transition-transform">
                              {item.title}
                            </h3>
                            <div className="h-1 w-0 group-hover:w-full bg-primary mt-3 transition-all duration-500" />
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex items-center justify-center gap-4 mt-12">
                <CarouselPrevious className="static translate-y-0 h-10 w-10 border-2 border-primary/20 hover:bg-primary hover:text-white transition-all" />
                <CarouselNext className="static translate-y-0 h-10 w-10 border-2 border-primary/20 hover:bg-primary hover:text-white transition-all" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* --- 3. AI STUDIO HIGHLIGHT --- */}
        <section className="py-24 relative overflow-hidden bg-background">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="container px-4 mx-auto relative z-10">
            <TiltCard>
              <div className="relative overflow-hidden rounded-[3rem] bg-zinc-950 text-white p-10 md:p-14 border border-primary/20 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-violet-500/20 pointer-events-none" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold tracking-tight text-[10px]">
                      <Zap className="w-4 h-4 animate-pulse" /> AI Powered Creative Studio
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter font-headline leading-tight">
                      Your Imagination, <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-emerald-400 animate-gradient bg-300%">AI-Generated.</span>
                    </h2>
                    <p className="text-base text-zinc-400 font-medium leading-relaxed max-w-lg">
                      Experience the next frontier of print design. Our integrated AI engine helps you generate stunning assets, remove backgrounds instantly, and optimize layouts for industrial-grade printing.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { title: "Generative Art", desc: "Create unique assets from text prompts", icon: <Sparkles className="w-5 h-5" /> },
                        { title: "Smart Eraser", desc: "Neural background removal in seconds", icon: <Zap className="w-5 h-5" /> },
                        { title: "Auto Layout", desc: "AI-optimized placement for print", icon: <LayoutGrid className="w-5 h-5" /> },
                        { title: "Resolution Upscale", desc: "Enhance low-res images for 300 DPI", icon: <ShieldCheck className="w-5 h-5" /> }
                      ].map((feature, i) => (
                        <div key={i} className="flex gap-5 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                            {feature.icon}
                          </div>
                          <div>
                            <h4 className="font-black text-sm tracking-tight mb-1">{feature.title}</h4>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6">
                      <Button size="lg" asChild className="rounded-2xl h-16 px-10 font-bold tracking-tight bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 group border-none">
                        <Link href="/products" className="flex items-center justify-center gap-2 text-lg">
                          Launch AI Studio <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative w-full aspect-square max-w-md mx-auto">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                      />
                      <div className="absolute inset-8 rounded-[3.5rem] bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                        <Image 
                          src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60" 
                          alt="AI Design Preview" 
                          fill 
                          className="object-cover opacity-40 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center space-y-6">
                            <div className="relative inline-block">
                              <Sparkles className="w-24 h-24 text-primary animate-pulse" />
                              <div className="absolute inset-0 blur-2xl bg-primary/50 -z-10" />
                            </div>
                            <div className="px-6 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                              <p className="text-xs font-mono text-emerald-400 font-bold tracking-widest">NEURAL ENGINE ACTIVE</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -right-8 top-1/4 glass-card bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-2xl shadow-2xl z-20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                          <span className="text-xs font-black text-white tracking-tight">Generating Assets...</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* --- 4. ECOSYSTEM OVERVIEW (Three Pillars) --- */}
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
              className="text-center mb-24"
            >
              <motion.div variants={FADE_UP} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-primary font-bold tracking-tight text-[10px] mb-4">
                <Globe className="w-3 h-3" /> A Connected Network
              </motion.div>
              <motion.h2 variants={FADE_UP} className="text-3xl md:text-4xl font-black tracking-tighter font-headline">
                The AmazoPrint <span className="text-primary">Ecosystem</span>
              </motion.h2>
              <motion.p variants={FADE_UP} className="mt-4 text-base text-muted-foreground max-w-xl mx-auto font-medium">
                We bring together the three vital pillars of the print industry into one seamless, high-performance platform.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
              {[
                {
                  title: 'For Brands',
                  desc: 'A professional 3D-ready design workspace with industrial printing output.',
                  icon: <Palette className="w-10 h-10 text-primary" />,
                  bg: 'bg-primary/5',
                  borderColor: 'border-primary/20',
                  delay: 0,
                  link: '/products',
                  btnText: 'Start Designing'
                },
                {
                  title: 'For Freelancers',
                  desc: 'Turn your creativity into steady income via live contests and verification jobs.',
                  icon: <Trophy className="w-10 h-10 text-violet-500" />,
                  bg: 'bg-violet-500/5',
                  borderColor: 'border-violet-500/20',
                  delay: 0.1,
                  link: '/contests',
                  btnText: 'Start Earning'
                },
                {
                  title: 'For Printing Presses',
                  desc: 'Connect to our global routing network and receive verified print orders instantly.',
                  icon: <Building2 className="w-10 h-10 text-emerald-500" />,
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
                    className={cn("h-full rounded-[2rem] p-8 border backdrop-blur-sm flex flex-col items-start gap-6 group hover:shadow-xl transition-all duration-500", pillar.bg, pillar.borderColor)}
                  >
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border bg-white/50 dark:bg-black/20 shadow-inner", pillar.borderColor)}>
                      {pillar.icon}
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl font-black font-headline tracking-tight">{pillar.title}</h3>
                      <p className="text-zinc-600 font-medium leading-relaxed text-sm">{pillar.desc}</p>
                    </div>
                    <Button variant="ghost" asChild className="group/btn p-0 hover:bg-transparent h-auto mt-4 font-bold tracking-tight text-[11px]">
                      <Link href={pillar.link} className="flex items-center gap-2">
                        {pillar.btnText} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                      </Link>
                    </Button>
                  </motion.div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* --- 5. JOIN & EARN --- */}
        <section className="py-32 bg-zinc-950 text-white overflow-hidden relative">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 blur-[180px] rounded-full opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container px-4 mx-auto relative z-10">
            <motion.div {...FADE_UP} className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-primary border border-white/10 text-[10px] font-bold tracking-tight">
                <IndianRupee className="w-3 h-3" /> Join &amp; Earn
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter font-headline">
                Turn Your Talent <br className="hidden md:block" />
                into <span className="text-primary text-white">Income.</span>
              </h2>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto font-medium leading-relaxed">
                Two powerful ways to earn. Pick your path and start making money with your creative skills today.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Card 1 — Contests */}
              <TiltCard>
                <div className="relative h-full rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-500 group shadow-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-primary/5 transform-gpu">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="p-8 md:p-10 flex flex-col h-full gap-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 tracking-tight">Live Quests</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl md:text-3xl font-black tracking-tighter font-headline leading-tight">Design <br /> Contests</h3>
                      <p className="text-zinc-400 font-medium leading-relaxed text-sm">Compete in live design quests posted by real brands. Submit your best work, win prize money, and build a verified portfolio — all from one platform.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: <IndianRupee className="w-4 h-4" />, text: 'Cash Prizes' },
                        { icon: <Crown className="w-4 h-4" />, text: 'Top Rankings' },
                        { icon: <Users className="w-4 h-4" />, text: 'Community Voting' },
                        { icon: <Award className="w-4 h-4" />, text: 'Verified Wins' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                          <span className="text-primary">{item.icon}</span>
                          <span className="text-[10px] font-bold text-zinc-100 tracking-tight">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild size="lg" className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-bold text-xs tracking-tight group/btn shadow-lg border-none">
                      <Link href="/contests" className="flex items-center justify-center gap-2">Browse Active Contests <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></Link>
                    </Button>
                  </div>
                </div>
              </TiltCard>

              {/* Card 2 — Verification Jobs */}
              <TiltCard>
                <div className="relative h-full rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-violet-400/50 transition-all duration-500 group shadow-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-500/5 transform-gpu">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="p-8 md:p-10 flex flex-col h-full gap-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
                        <FileCheck className="w-7 h-7 text-violet-400" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/20">
                        <Briefcase className="w-3 h-3 text-violet-400" />
                        <span className="text-[10px] font-bold text-violet-400 tracking-tight">Steady Income</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl md:text-3xl font-black tracking-tighter font-headline leading-tight">Verification <br /> Jobs</h3>
                      <p className="text-zinc-400 font-medium leading-relaxed text-sm">Review and approve customer designs before they go to print. Earn per job, work at your own pace — perfect for designers who want consistent, flexible income.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: <Zap className="w-4 h-4" />, text: 'Per-Job Pay' },
                        { icon: <Clock className="w-4 h-4" />, text: 'Flexible Hours' },
                        { icon: <ShieldCheck className="w-4 h-4" />, text: 'Quality Control' },
                        { icon: <Globe className="w-4 h-4" />, text: 'Remote Work' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                          <span className="text-violet-400">{item.icon}</span>
                          <span className="text-[10px] font-bold text-zinc-100 tracking-tight">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild size="lg" className="w-full rounded-xl h-12 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs tracking-tight group/btn shadow-lg border-none">
                      <Link href="/freelancer/verifications" className="flex items-center justify-center gap-2">Start Verifying Designs <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></Link>
                    </Button>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* --- 6. PARTNER CTA SECTION (Printer Dashboard Mockup) --- */}
        <section className="py-32 bg-zinc-50 dark:bg-zinc-950/50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

          <div className="container px-4 mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true }}
                variants={{ initial: {}, whileInView: { transition: { staggerChildren: 0.15 } } }}
                className="space-y-8 order-2 lg:order-1"
              >
                <motion.div variants={FADE_UP}>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[11px] px-4 py-2 rounded-full">
                    Printing Press Partner
                  </Badge>
                </motion.div>
                <motion.h2 variants={FADE_UP} className="text-4xl md:text-7xl font-black tracking-tighter font-headline leading-[1] text-zinc-900">
                  Fill Your <br />
                  <span className="text-emerald-600">Production</span> Capacity.
                </motion.h2>
                <motion.p variants={FADE_UP} className="text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">
                  Transform your printing press into a global fulfillment node. Get ready-to-print verified files sent directly to your dashboard and get paid instantly.
                </motion.p>

                <motion.div variants={FADE_UP} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                  {[
                    { title: "Zero Pre-press", desc: "Files come 100% verified" },
                    { title: "Guaranteed Volume", desc: "Steady influx of orders" },
                    { title: "Instant Payouts", desc: "Automated settlements" },
                    { title: "Industrial Scale", desc: "API workflow integrations" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="text-emerald-600 w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-base tracking-tight text-zinc-800">{item.title}</h4>
                        <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={FADE_UP} className="pt-6">
                  <Button size="lg" asChild className="rounded-xl h-12 px-8 font-bold tracking-tight bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 group border-none">
                    <Link href="/printer-registration" className="flex items-center gap-2 text-sm">
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
                <TiltCard className="w-full max-w-xl mx-auto">
                  <div className="relative rounded-[3rem] bg-zinc-900 border border-zinc-800 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden transform-gpu" style={{ transform: "translateZ(30px)" }}>
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                          <Building2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">Active Partner</p>
                          <p className="text-lg font-black text-white">Press Dashboard</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-3 py-1">Online</Badge>
                    </div>

                    <div className="p-8 space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-3 py-0.5 mb-3">New Order</Badge>
                            <p className="text-white font-black text-2xl">500x Premium Cards</p>
                          </div>
                          <p className="text-emerald-400 font-black text-3xl">₹2,400</p>
                        </div>
                        <div className="flex items-center gap-6 text-zinc-300 text-xs font-bold tracking-tight">
                          <span className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-400" /> Pre-verified</span>
                          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-400" /> Due in 24h</span>
                        </div>
                      </motion.div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 shadow-inner">
                          <p className="text-zinc-400 text-xs font-bold tracking-tight mb-2">Today's Earnings</p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1 }}
                            className="text-white font-black text-3xl"
                          >₹18,500</motion.p>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 shadow-inner">
                          <p className="text-zinc-400 text-xs font-bold tracking-tight mb-2">Orders Queued</p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.2 }}
                            className="text-white font-black text-3xl"
                          >14</motion.p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-10 top-1/3 glass-card bg-zinc-900 border border-emerald-500/40 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20"
                    style={{ transform: "translateZ(80px)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-white tracking-tight">Receiving Files...</span>
                    </div>
                  </motion.div>
                </TiltCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 7. INDUSTRIAL CATALOG (Staggered 3D Grid) --- */}
        {subProducts && subProducts.length > 0 && (
          <section className="py-32 bg-background relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-1/3 h-1/3 bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="container px-4 mx-auto relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
                <div className="space-y-3">
                  <Badge variant="outline" className="bg-muted text-zinc-900 border-border font-bold text-[10px] px-3 py-1 rounded-full">
                    Verified Material Specs
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter font-headline">Industrial <br /><span className="text-primary">Canvas.</span></h2>
                  <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">Elite material specifications optimized for professional brand deployments. Start creating on premium stock.</p>
                </div>
                <Button asChild className="rounded-xl h-12 px-8 font-bold tracking-tight group shadow-lg bg-primary hover:bg-primary/90 text-white border-none">
                  <Link href="/products" className="flex items-center gap-2 text-sm">
                    View Enterprise Catalog <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                {subProducts.map((subProduct: any, index: number) => {
                  const price = Number(subProduct.price || 0);
                  const imageUrl = resolveImagePath(subProduct.imageUrl || subProduct.parentProductImageUrl);
                  const transformClass = index % 2 !== 0 ? "lg:translate-y-16" : "";

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
                          <Card className="h-full flex flex-col overflow-hidden rounded-[2rem] transition-all duration-500 hover:shadow-xl border-border/40 bg-card/50 backdrop-blur-sm transform-gpu" style={{ transform: "translateZ(20px)" }}>
                            <CardHeader className="p-0 relative aspect-[3/4] overflow-hidden bg-muted/20">
                              {imageUrl ? (
                                <Image src={imageUrl} alt={subProduct.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Palette className="w-10 h-10 text-muted/30" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg transform translate-y-[-20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 border border-white/20">
                                <p className="text-xs font-black flex items-center text-primary"><IndianRupee size={12} />{price.toFixed(0)}</p>
                              </div>

                              <div className="absolute inset-x-0 bottom-0 p-6 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                <Button className="w-full h-12 rounded-xl bg-white text-primary hover:bg-zinc-100 font-bold text-xs tracking-tight shadow-xl border-none">
                                  Select Material
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow space-y-4 relative bg-card border-t border-border/50 z-10">
                              <div className="space-y-1">
                                <h3 className="font-black text-xl group-hover:text-primary transition-colors font-headline tracking-tight leading-tight">{subProduct.name}</h3>
                                <p className="text-[10px] font-bold text-zinc-600 tracking-tight">{subProduct.productName}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-tight">CMYK Native</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </TiltCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* --- 8. TEMPLATE EXPLORATION --- */}
        <section className="py-24 relative overflow-hidden">
          <div className="container px-4 mx-auto">
            <TiltCard>
              <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 text-white p-12 md:p-20 border border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary font-bold tracking-tight text-[10px]">
                      <LayoutGrid size={14} /> Design Ready
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter font-headline leading-[1] text-white">
                      Don't Start from <br /><span className="text-primary text-white">Scratch.</span>
                    </h2>
                    <p className="text-base md:text-lg text-zinc-400 font-medium leading-relaxed max-w-lg">
                      Browse our library of premium, print-verified templates crafted by elite designers. Just swap your details and you're production-ready.
                    </p>
                    <div className="pt-4">
                      <Button size="lg" asChild className="rounded-xl h-12 px-8 font-bold tracking-tight bg-primary hover:bg-primary/90 text-white shadow-lg border-none">
                        <Link href="/templates" className="flex items-center justify-center gap-2 text-sm">
                          Explore Library <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="relative hidden lg:block">
                    <div className="relative w-full aspect-square max-w-lg mx-auto transform-gpu" style={{ transform: "rotateX(10deg) rotateY(-10deg)" }}>
                      <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[3rem] rotate-12 translate-x-8 translate-y-8" />
                      <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[3rem] -rotate-6 -translate-x-8 translate-y-4" />
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/20 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden">
                        <Image 
                          src="/uploads/hero.png" 
                          alt="Template Preview" 
                          fill 
                          className="object-cover opacity-60 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-primary/20 backdrop-blur-2xl border border-primary/30 flex items-center justify-center text-primary animate-pulse shadow-[0_0_50px_hsl(var(--primary))]">
                            <Sparkles size={48} />
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

        {/* --- 9. INFRASTRUCTURE GRID (Technology Stack) --- */}
        <section className="py-24 bg-zinc-950 text-white relative">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-3xl mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 text-primary font-bold tracking-tight text-[10px]">
                <ShieldCheck size={14} /> Technology Stack
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight font-headline text-white">Engineered for <span className="text-primary text-white">Scale.</span></h2>
              <p className="text-base md:text-lg text-zinc-400 font-medium max-w-xl leading-relaxed">Industrial-grade precision meets cloud-native efficiency. Designed for zero-loss output at any production scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <motion.div {...FADE_UP} className="md:col-span-8 glass-card bg-white/5 border border-white/10 rounded-[2.5rem] p-12 flex flex-col justify-between group hover:border-primary/50 transition-all duration-500 min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-12 border border-primary/20 transition-transform group-hover:scale-110">
                  <Palette size={32} />
                </div>
                <div>
                  <h3 className="text-3xl md:text-4xl font-black mb-6 font-headline leading-tight text-white">Vector-Native <br />Design Engine</h3>
                  <p className="text-zinc-300 text-base max-w-md font-medium leading-relaxed">Precision studio built for raw asset fidelity. Full typography control and CMYK management.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card bg-gradient-to-br from-primary/10 to-transparent border border-white/10 rounded-[2.5rem] p-12 flex flex-col justify-between group hover:border-primary/50 transition-all duration-500 min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-8 border border-primary/20 group-hover:scale-110 transition-transform">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black mb-4 font-headline leading-tight text-white">Neural <br />Proofing</h3>
                  <p className="text-zinc-300 font-medium text-sm leading-relaxed">Automated high-res scaling and isolated background removal powered by AI.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card bg-white/5 border border-white/10 rounded-[2.5rem] p-12 flex flex-col justify-between group hover:border-violet-500/50 transition-all duration-500 min-h-[400px]">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:scale-110 transition-transform">
                  <FileCheck size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black mb-4 font-headline text-white">Manual Audit</h4>
                  <p className="text-zinc-300 font-medium text-base leading-relaxed">Pre-press checks by senior industrial designers for guaranteed output quality.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-8 glass-card bg-primary/5 border border-white/10 rounded-[2.5rem] p-12 flex flex-col md:flex-row gap-12 items-center group hover:border-primary/50 transition-all duration-500 min-h-[400px]">
                <div className="flex-1 space-y-6 text-white">
                  <h4 className="text-3xl md:text-4xl font-black font-headline leading-tight">Global Routing</h4>
                  <p className="text-zinc-300 text-lg font-medium leading-relaxed">Real-time routing to optimal production hubs for zero-latency regional delivery.</p>
                </div>
                <div className="flex-shrink-0 w-32 h-32 bg-white/5 rounded-full flex items-center justify-center shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                  <Globe className="w-16 h-16 text-primary" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 10. FINAL CTA --- */}
        <section className="py-32 bg-background">
          <div className="container px-4 mx-auto">
            <div className="rounded-[3rem] p-16 md:p-32 text-center text-white relative overflow-hidden bg-zinc-950 shadow-2xl border border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.2),transparent_70%)]"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-12">
                <h2 className="text-5xl md:text-7xl font-black leading-[1] tracking-tighter font-headline text-white">Ready to <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">Deploy?</span></h2>
                <p className="text-xl md:text-2xl opacity-80 font-medium tracking-tight leading-relaxed max-w-xl mx-auto">Join the network of brands redefining the industrial print landscape.</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6">
                  <Button size="xl" asChild className="h-16 px-10 rounded-full text-xl font-black bg-white text-zinc-950 hover:bg-zinc-100 transition-all font-headline border-none">
                    <Link href="/register">Initialize Account</Link>
                  </Button>
                  <Button variant="outline" size="xl" asChild className="h-16 px-8 rounded-full text-lg font-bold bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md">
                    <Link href="/contact">Speak to Sales</Link>
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
