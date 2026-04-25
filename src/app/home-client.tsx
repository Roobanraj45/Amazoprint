'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNowStrict } from 'date-fns';

// --- Animation Variants ---
const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }
};

export function HomeClient({ 
  subProducts, 
  directSellingProducts, 
  contests 
}: { 
  subProducts: any[], 
  directSellingProducts: any[],
  contests: any[]
}) {

  const totalBountyPool = contests.reduce((acc, curr) => {
    const amount = parseFloat(curr.contest.prizeAmount || '0');
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden">
           <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_60%)]"></div>
           <div className="container px-4 mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="outline" className="mb-8 py-1.5 px-4 bg-background/50 backdrop-blur-sm border-primary/20 text-primary rounded-full font-bold tracking-wider uppercase text-[10px]">
                <Sparkles className="w-3 h-3 mr-2 text-primary" /> The New Industrial Standard
              </Badge>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-[1.05] mb-8 font-headline">
                Industrial Precision. <br/> <span className="gradient-text">Redefined.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                High-performance print studio built for global brands. Precision design tools, scalable production, and zero-latency delivery.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="h-14 px-8 rounded-full text-md font-bold group shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                  <Link href="/products" className="flex items-center gap-2">
                    Enter Workspace <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-14 px-8 rounded-full text-md font-bold bg-background/50 backdrop-blur-sm border-border/60 hover:bg-muted/50 transition-all">
                  <Link href="/contests">
                    Explore Active Quests
                  </Link>
                </Button>
              </div>

              {/* Verified Logos */}
              <div className="mt-24 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 grayscale opacity-40">
                 {['Precision Print', 'Global Hub', 'Creative Ops', 'Eco Scale', 'Fast Track'].map((brand, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-foreground/10" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{brand}</span>
                    </div>
                 ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. STATS BAR --- */}
        <section className="py-12 border-y bg-muted/20 backdrop-blur-sm">
            <div className="container px-4 mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Industrial Output', value: '1.2M+', icon: <Building2 size={20} className="text-primary"/> },
                        { label: 'Verified Experts', value: '50k+', icon: <Users size={20} className="text-primary"/> },
                        { label: 'Market Volume', value: '₹25L+', icon: <LayoutGrid size={20} className="text-primary"/> },
                        { label: 'Dispatch Lead', value: '24hrs', icon: <Clock size={20} className="text-primary"/> },
                    ].map((stat, i) => (
                        <div key={i} className="text-center space-y-1">
                            <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 3. PROFESSIONAL STUDIO ARENA --- */}
        {contests && contests.length > 0 && (
          <section className="py-24 bg-zinc-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full opacity-40"></div>
            
            <div className="container px-4 mx-auto relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8 text-center lg:text-left">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-primary border border-white/10 text-[9px] font-black uppercase tracking-widest">
                    <Trophy className="w-3 h-3" /> Global Design Quests
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline">
                    Professional <span className="text-primary">Studio.</span>
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                    Collaborate with elite designers. High-fidelity creative assets vetted for industrial deployment.
                  </p>
                </div>
                <div className="glass-card bg-white/5 rounded-3xl p-8 border border-white/5 shadow-2xl min-w-[280px]">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">STUDY BOUNTY CAPACITY</p>
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                        <Flame className="text-primary w-6 h-6" />
                        <p className="text-4xl font-black text-white">₹{totalBountyPool.toLocaleString('en-IN')}</p>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {contests.map(({ contest, participantsCount }) => {
                  const progressValue = (participantsCount / contest.maxFreelancers) * 100;
                  return (
                    <motion.div key={contest.id} {...FADE_UP} whileHover={{ y: -8 }}>
                      <Card className="h-full flex flex-col bg-white/5 border-white/10 hover:border-primary/50 transition-all duration-300 rounded-[2rem] overflow-hidden group shadow-xl">
                        <CardHeader className="p-6">
                          <div className="flex justify-between items-center mb-6">
                            <Badge variant="outline" className="border-white/10 text-zinc-400 text-[8px] uppercase font-bold tracking-[0.1em] px-2 py-0.5 rounded-md">
                              {contest.productName}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-black uppercase text-emerald-400">Live</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                          </div>
                          <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight uppercase font-headline">
                            {contest.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-8 flex-grow">
                          <div className="relative p-6 rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.1em] mb-1">PROJECT VALUE</p>
                              <p className="text-3xl font-black text-white">₹{parseFloat(contest.prizeAmount || '0').toLocaleString('en-IN')}</p>
                              <Crown className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-primary/5 rotate-12" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                {formatDistanceToNowStrict(new Date(contest.endDate))} left
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-zinc-400" />
                                {participantsCount}/{contest.maxFreelancers}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Progress value={progressValue} className="h-1 bg-white/5" />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-6 pt-0">
                          <Button asChild className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-[11px] uppercase tracking-widest">
                            <Link href={`/contests/${contest.id}`}>View Intel</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* --- 4. INDUSTRIAL CATALOG --- */}
        {subProducts && subProducts.length > 0 && (
          <section className="py-24">
            <div className="container px-4 mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div className="space-y-3">
                   <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-headline">Industrial <span className="gradient-text">Canvas.</span></h2>
                   <p className="text-lg text-muted-foreground font-medium max-w-xl leading-snug">Elite material specifications optimized for professional brand deployments.</p>
                </div>
                <Button variant="link" asChild className="font-bold uppercase tracking-[0.2em] text-[10px] h-auto p-0 hover:text-primary"><Link href="/products">Enterprise Catalog <ArrowRight size={14} className="ml-2"/></Link></Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {subProducts.map((subProduct: any) => {
                  const price = Number(subProduct.price || 0);
                  const imageUrl = resolveImagePath(subProduct.imageUrl || subProduct.parentProductImageUrl);
                  return (
                    <motion.div key={subProduct.id} {...FADE_UP}>
                      <Link href={`/design/${subProduct.productSlug}/start?subProductId=${subProduct.id}`} className="block h-full group">
                        <Card className="h-full flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300 hover:shadow-2xl border-border/40 bg-card">
                          <CardHeader className="p-0 relative aspect-[4/5] overflow-hidden bg-muted/20">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={subProduct.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Palette className="w-10 h-10 text-muted/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <p className="text-[8px] font-black uppercase text-primary tracking-widest">Starts at</p>
                                    <p className="text-xl font-black flex items-center"><IndianRupee size={14} className="mr-0.5"/>{price.toFixed(0)}</p>
                                </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-8 flex-grow space-y-4">
                            <div className="space-y-1">
                                <h3 className="font-black text-xl group-hover:text-primary transition-colors uppercase font-headline tracking-tight">{subProduct.name}</h3>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-[0.1em]">{subProduct.productName}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-muted/50 text-[8px] font-bold px-2 py-0.5 uppercase tracking-tighter">CMYK NATIVE</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
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
                    <h3 className="text-4xl font-black mb-6 font-headline uppercase leading-none">Vector-Native <br/>Design Engine</h3>
                    <p className="text-zinc-400 text-lg max-w-md font-medium leading-relaxed">Precision studio built for raw asset fidelity. Full typography control and CMYK management.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card bg-gradient-to-br from-primary/10 to-transparent border-white/5 rounded-[2.5rem] p-12 flex flex-col justify-between">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-8 border border-primary/10">
                    <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black mb-4 font-headline uppercase leading-tight">Neural <br/>Proofing</h3>
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

        {/* --- 6. PARTNER CTA SECTION --- */}
        <section className="py-24 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div {...FADE_UP} className="space-y-6">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[10px]">
                        Production Network
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-headline">Join as a <span className="text-primary">Printing Partner.</span></h2>
                    <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">Expand your reach and fill your production capacity. Join our global network of verified printing presses and receive steady, high-quality orders directly to your dashboard.</p>
                    <div className="space-y-4 pt-4">
                        {[
                            "Reliable order volume from global brands",
                            "Automated pre-press and file handling",
                            "Seamless payment and financial tracking",
                            "Industrial-grade workflow management"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="text-primary w-5 h-5" />
                                <span className="font-semibold text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                    <Button size="lg" asChild className="rounded-full h-14 px-8 font-bold mt-4 shadow-lg shadow-primary/20">
                        <Link href="/printer-registration" className="flex items-center gap-2">
                          Get Registered <ArrowRight className="w-4 h-4"/>
                        </Link>
                    </Button>
                </motion.div>
                
                <motion.div {...FADE_UP} className="relative aspect-square lg:aspect-auto lg:h-[500px] rounded-[3rem] overflow-hidden border border-border/40 shadow-2xl">
                    <Image 
                        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000" 
                        alt="Printing Press" 
                        fill 
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-10 left-10 text-white">
                        <p className="text-3xl font-black uppercase font-headline leading-none mb-2">Enterprise Grade</p>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Global Fulfillment Logic</p>
                    </div>
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
                <h2 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase font-headline">Ready to <br/><span className="text-primary">Deploy?</span></h2>
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

      {/* --- FOOTER --- */}
      <footer className="bg-muted/20 border-t py-24">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-16 mb-16">
            <div className="col-span-2 space-y-8">
              <AmazoprintLogo className="scale-110 origin-left" />
              <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xs">Industrial precision. AI-powered creativity. Global delivery.</p>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8">Infrastructure</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/products" className="hover:text-primary transition-colors">Catalog</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors">Quests</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Studio</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/printer-registration" className="hover:text-primary transition-colors">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8">Legal</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">© {new Date().getFullYear()} Amazoprint Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
