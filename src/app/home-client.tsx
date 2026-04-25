
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
  Quote,
  Clock,
  Award,
  Crown,
  MousePointer2,
  CreditCard,
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
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNowStrict } from 'date-fns';

const AddToCartButton = ({ product }: { product: any }) => {
    const { addItem } = useCart();
    const { toast } = useToast();

    const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        toast({
            title: "Added to Cart",
            description: `"${product.name}" has been added to your cart.`,
        });
    };
    
    return (
        <Button onClick={handleAddToCart} className="w-full font-bold">
            <ShoppingCart size={16} className="mr-2"/>
            Add to Cart
        </Button>
    );
};

// --- Animation Variants ---
const FADE_UP = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }
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

  const topDesigners = [
    { name: 'Arun Kumar', wins: 12, rating: '4.9', avatar: 'https://picsum.photos/seed/arun/200' },
    { name: 'Priya S.', wins: 8, rating: '5.0', avatar: 'https://picsum.photos/seed/priya/200' },
    { name: 'Rahul V.', wins: 15, rating: '4.8', avatar: 'https://picsum.photos/seed/rahul/200' },
    { name: 'Anita D.', wins: 5, rating: '4.9', avatar: 'https://picsum.photos/seed/anita/200' },
  ];

  const brandLogos = [
    { name: 'Precision Print', icon: <FileCheck className="w-8 h-8 opacity-40" /> },
    { name: 'Creative Ops', icon: <Palette className="w-8 h-8 opacity-40" /> },
    { name: 'Global Hub', icon: <Globe className="w-8 h-8 opacity-40" /> },
    { name: 'Eco Scale', icon: <Leaf className="w-8 h-8 opacity-40" /> },
    { name: 'Fast Track', icon: <Zap className="w-8 h-8 opacity-40" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <Navbar />

      <main className="flex-1 pt-20">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-48 text-center overflow-hidden">
           <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_70%)]"></div>
           <div className="container px-4 mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-5xl mx-auto"
            >
              <Badge className="mb-8 py-2 px-5 bg-white dark:bg-slate-900 text-primary border-primary/20 shadow-sm rounded-full font-bold tracking-wider uppercase text-[10px]">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-500" /> Professional Industrial Print Studio
              </Badge>
              <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter leading-[0.85] mb-10 font-headline uppercase">
                Industrial <br/> <span className="gradient-text">Precision.</span>
              </h1>
              <p className="text-xl md:text-3xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto font-medium tracking-tight">
                High-performance studio for global brands. Precision design tools, scalable production workflows, and zero-latency delivery.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button size="xl" asChild className="h-20 px-12 rounded-2xl text-xl font-black group shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90">
                  <Link href="/products" className="flex items-center gap-3">
                    Enter Workspace <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild className="h-20 px-12 rounded-2xl text-xl font-bold border-2 bg-background/50 backdrop-blur-sm hover:bg-muted/50">
                  <Link href="/contests">
                    View Live Quests
                  </Link>
                </Button>
              </div>

              {/* Trust Legends Row */}
              <div className="mt-28 flex flex-wrap justify-center items-center gap-x-16 gap-y-8 grayscale opacity-60">
                 {brandLogos.map((brand, i) => (
                    <div key={i} className="flex items-center gap-3">
                        {brand.icon}
                        <span className="text-xs font-black uppercase tracking-[0.3em]">{brand.name}</span>
                    </div>
                 ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. PERFORMANCE STATS --- */}
        <section className="py-16 border-y bg-slate-50 dark:bg-slate-950/50">
            <div className="container px-4 mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                    {[
                        { label: 'Industrial Output', value: '1.2M+', icon: <Building2 className="text-primary"/> },
                        { label: 'Verified Experts', value: '50k+', icon: <Users className="text-indigo-500"/> },
                        { label: 'Project Throughput', value: '₹25L+', icon: <LayoutGrid className="text-emerald-500"/> },
                        { label: 'Global Dispatch', value: '24hrs', icon: <Clock className="text-amber-500"/> },
                    ].map((stat, i) => (
                        <div key={i} className="text-center space-y-2 group cursor-default">
                            <div className="flex justify-center mb-4 transform group-hover:scale-110 transition-transform">{stat.icon}</div>
                            <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 3. PREMIUM DESIGN ARENA --- */}
        {contests && contests.length > 0 && (
          <section className="py-32 bg-slate-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/20 blur-[180px] rounded-full opacity-30"></div>
            
            <div className="container px-4 mx-auto relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-primary border border-white/10 text-xs font-black uppercase tracking-widest">
                    <Trophy className="w-4 h-4" /> Global Design Quests
                  </div>
                  <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase font-headline">
                    Elite <span className="text-primary">Studio.</span>
                  </h2>
                  <p className="text-slate-400 text-xl max-w-2xl font-medium leading-relaxed">
                    Collaborate with world-class talent. Our community of verified designers produces industrial-grade creative assets for high-fidelity brand deployments.
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/10 shadow-2xl min-w-[320px]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">ACTIVE STUDIO CAPACITY</p>
                    <div className="flex items-center gap-4">
                        <Flame className="text-amber-500 w-8 h-8 animate-pulse" />
                        <p className="text-6xl font-black text-white tabular-nums">₹{totalBountyPool.toLocaleString('en-IN')}</p>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {contests.map(({ contest, participantsCount }) => {
                  const progressValue = (participantsCount / contest.maxFreelancers) * 100;
                  return (
                    <motion.div key={contest.id} {...FADE_UP} whileHover={{ y: -12 }}>
                      <Card className="h-full flex flex-col bg-white/5 backdrop-blur-xl border-white/10 hover:border-primary/60 transition-all duration-500 rounded-[3rem] overflow-hidden group shadow-2xl">
                        <CardHeader className="p-8">
                          <div className="flex justify-between items-center mb-8">
                            <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase font-black tracking-[0.2em] px-3 py-1.5 rounded-lg">
                              {contest.productName}
                            </Badge>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-emerald-400">Live</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            </div>
                          </div>
                          <CardTitle className="text-2xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight uppercase font-headline tracking-tight">
                            {contest.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-10 flex-grow">
                          <div className="relative p-8 rounded-[2rem] bg-white/5 border border-white/5 overflow-hidden group-hover:bg-white/10 transition-all">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">PROJECT CREDIT</p>
                              <p className="text-4xl font-black text-white">₹{parseFloat(contest.prizeAmount || '0').toLocaleString('en-IN')}</p>
                              <Crown className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-primary/10 rotate-12 group-hover:text-primary/20 transition-all duration-700" />
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                {formatDistanceToNowStrict(new Date(contest.endDate))}
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-400" />
                                {participantsCount}/{contest.maxFreelancers}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Progress value={progressValue} className="h-1 bg-white/5" />
                              <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 tracking-[0.1em]">
                                <span>Arena Occupancy</span>
                                <span>{Math.round(progressValue)}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-8 bg-white/5 border-t border-white/5">
                          <Button asChild className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20">
                            <Link href={`/contests/${contest.id}`}>Analyze Brief</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-24 text-center">
                <Button variant="link" asChild className="text-slate-500 hover:text-white font-black uppercase tracking-[0.4em] text-[11px] h-auto p-0">
                  <Link href="/contests" className="flex items-center gap-3">
                    Explore Professional Opportunities <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* --- 4. THE INDUSTRIAL WORKFLOW --- */}
        <section className="py-40">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-4xl mx-auto mb-28 space-y-6">
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase font-headline">The <span className="text-primary">Workflow.</span></h2>
                    <p className="text-2xl text-slate-500 font-medium tracking-tight">Streamlined industrial execution from initial concept to global delivery.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {[
                        { title: 'Project Brief', desc: 'Define your industrial requirements and material specifications.', icon: <Trophy />, color: 'bg-blue-600' },
                        { title: 'Neural Prototype', desc: 'Leverage AI studio tools for high-fidelity asset generation.', icon: <MousePointer2 />, color: 'bg-indigo-600' },
                        { title: 'Global Dispatch', desc: 'Zero-latency production routing to regional fulfillment hubs.', icon: <Globe />, color: 'bg-emerald-600' },
                    ].map((step, i) => (
                        <div key={i} className="relative group text-center space-y-8">
                            <div className={cn("mx-auto w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", step.color)}>
                                {React.cloneElement(step.icon as React.ReactElement, { size: 48 })}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-bold uppercase font-headline tracking-tight">{step.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-lg font-medium">{step.desc}</p>
                            </div>
                            {i < 2 && <div className="hidden lg:block absolute top-16 -right-8 w-16 h-[2px] bg-slate-100 dark:bg-slate-800" />}
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 5. TOP CREATIVE ELITE --- */}
        <section className="py-40 bg-slate-50 dark:bg-slate-950/30">
            <div className="container px-4 mx-auto">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-28">
                    <div className="space-y-4">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-headline">Verified <span className="text-primary">Elite.</span></h2>
                        <p className="text-slate-500 text-xl font-medium tracking-tight">Access top-tier creative talent vetted for industrial precision.</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl px-10 h-16 text-lg font-black border-2 hover:bg-white shadow-xl transition-all uppercase tracking-widest">Global Rankings</Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {topDesigners.map((designer, i) => (
                        <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.1 }}>
                            <Card className="rounded-[3rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-background group p-10 text-center space-y-8">
                                <div className="relative mx-auto w-40 h-40">
                                    <Avatar className="w-full h-full border-[6px] border-slate-50 group-hover:border-primary/20 transition-all duration-500">
                                        <AvatarImage src={designer.avatar} className="object-cover" />
                                        <AvatarFallback className="text-4xl font-black">{designer.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl uppercase tracking-wider">
                                        EXPERT
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black tracking-tight">{designer.name}</h4>
                                    <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                        <span>{designer.wins} Victories</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" /> {designer.rating}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Industrial Score</p>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                                        <div className="bg-primary h-full rounded-full" style={{ width: `${Number(designer.rating) * 20}%` }} />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 6. INDUSTRIAL CANVAS --- */}
        {subProducts && subProducts.length > 0 && (
          <section className="py-40">
            <div className="container px-4 mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
                <div className="space-y-4">
                   <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase font-headline">Professional <span className="gradient-text">Canvas.</span></h2>
                   <p className="text-2xl text-slate-500 font-medium tracking-tight max-w-2xl leading-tight">Elite material specifications optimized for professional brand deployments.</p>
                </div>
                <Button variant="link" asChild className="font-black uppercase tracking-[0.3em] text-xs h-auto p-0 hover:text-primary"><Link href="/products">Enterprise Catalog <ArrowRight size={18} className="ml-3"/></Link></Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {subProducts.map((subProduct: any) => {
                  const price = Number(subProduct.price || 0);
                  const imageUrl = resolveImagePath(subProduct.imageUrl || subProduct.parentProductImageUrl);
                  return (
                    <motion.div key={subProduct.id} {...FADE_UP}>
                      <Link href={`/design/${subProduct.productSlug}/start?subProductId=${subProduct.id}`} className="block h-full group">
                        <Card className="h-full flex flex-col overflow-hidden rounded-[3rem] transition-all duration-700 hover:shadow-2xl hover:shadow-primary/20 border-slate-200/60 shadow-xl bg-background">
                          <CardHeader className="p-0 relative aspect-[4/5] overflow-hidden">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={subProduct.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                <Palette className="w-14 h-14 text-slate-200" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                            <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-xl p-6 rounded-[1.5rem] border border-white shadow-2xl opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.1em]">Unit Standard</p>
                                    <p className="text-2xl font-black flex items-center tracking-tighter"><IndianRupee size={18} className="mr-0.5"/>{price.toFixed(0)}</p>
                                </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-10 flex-grow space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-black text-2xl group-hover:text-primary transition-colors uppercase font-headline tracking-tight">{subProduct.name}</h3>
                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">{subProduct.productName}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="secondary" className="bg-slate-100 text-[10px] font-black px-3 py-1 uppercase tracking-tight">PRE-PRESS NATIVE</Badge>
                                <Badge variant="secondary" className="bg-slate-100 text-[10px] font-black px-3 py-1 uppercase tracking-tight">CMYK READY</Badge>
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
        
        {/* --- 7. ECOSYSTEM BENTO --- */}
        <section className="py-40 bg-slate-900 text-white relative">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-4xl mb-32 space-y-8">
              <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.4em] text-[11px]">
                <ShieldCheck size={16} /> Technology Infrastructure
              </div>
              <h2 className="text-6xl md:text-[7rem] font-black tracking-tighter leading-[0.85] uppercase font-headline">Built for <span className="text-primary">Scale.</span></h2>
              <p className="text-2xl text-slate-400 font-medium tracking-tight max-w-2xl leading-relaxed">Industrial-grade precision meets cloud-native efficiency. Designed for zero-loss output at any scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              <motion.div {...FADE_UP} className="md:col-span-8 glass-card relative overflow-hidden group min-h-[500px] flex flex-col justify-between border-white/5 rounded-[3.5rem] p-16">
                <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Palette size={280} strokeWidth={0.3} />
                </div>
                <div className="w-20 h-20 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary mb-12 border border-primary/20">
                    <Palette className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-5xl font-black mb-8 font-headline uppercase leading-[0.9]">Vector-Native <br/>Design Engine</h3>
                    <p className="text-slate-400 text-xl max-w-lg font-medium tracking-tight leading-relaxed">Industrial studio built for raw asset fidelity. Custom typography, CMYK management, and zero-loss vector exports.</p>
                    <div className="flex gap-4 mt-12">
                        <Badge className="bg-white/5 border-white/10 text-white font-black text-[10px] tracking-widest px-4 py-2">PRE-PRESS PRO</Badge>
                        <Badge className="bg-white/5 border-white/10 text-white font-black text-[10px] tracking-widest px-4 py-2">CMYK ENGINE</Badge>
                    </div>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card flex flex-col justify-between min-h-[500px] border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-[3.5rem] p-16">
                <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 animate-float">
                    <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-4xl font-black mb-6 font-headline uppercase leading-[0.9]">Neural <br/>Proofing</h3>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed tracking-tight">Automated high-res scaling and background isolation powered by specialized GenAI models.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card min-h-[400px] flex flex-col justify-between border-white/5 rounded-[3.5rem] p-16">
                <div className="w-16 h-16 rounded-[1rem] bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-3xl font-black mb-4 font-headline uppercase">Manual Audit</h4>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed tracking-tight">Every industrial project undergoes a manual pre-press check by our senior designers.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-8 glass-card flex flex-col md:flex-row gap-16 items-center min-h-[400px] border-white/5 bg-primary/5 rounded-[3.5rem] p-16">
                <div className="flex-1 space-y-8 text-center md:text-left">
                  <h4 className="text-4xl font-black font-headline uppercase">Global Network</h4>
                  <p className="text-slate-400 text-xl font-medium tracking-tight leading-relaxed">Real-time order routing to the optimal regional production hub for zero-latency delivery.</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2">Fulfillment 200+</Badge>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2">Net Zero Logistics</Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 w-48 h-48 bg-white/5 rounded-[3rem] flex items-center justify-center shadow-2xl border border-white/10 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-primary/5 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Globe className="w-24 h-24 text-primary animate-spin-slow" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 8. FINAL CTA --- */}
        <section className="py-48">
          <div className="container px-4 mx-auto">
            <div className="rounded-[5rem] p-24 md:p-40 text-center text-white relative overflow-hidden bg-slate-900 shadow-2xl">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.2),transparent_70%)]"></div>
               <div className="relative z-10 max-w-4xl mx-auto space-y-16">
                <h2 className="text-7xl md:text-[10rem] font-black mb-8 leading-[0.8] tracking-tighter uppercase font-headline">Ready to <br/><span className="text-primary">Deploy?</span></h2>
                <p className="text-2xl md:text-4xl opacity-90 font-medium max-w-3xl mx-auto tracking-tight leading-relaxed">Join the elite network of brands redefining the industrial print landscape.</p>
                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                  <Button size="xl" variant="secondary" asChild className="h-24 px-20 rounded-[2rem] text-3xl font-black shadow-2xl bg-white text-primary hover:bg-slate-50 hover:scale-105 transition-all uppercase font-headline">
                    <Link href="/register">Initialize Account</Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="h-24 px-20 rounded-[2rem] text-2xl font-bold border-2 border-white/30 hover:bg-white/10 hover:border-white transition-all uppercase font-headline">
                    <Link href="/contact">Talk to Scale</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-50 dark:bg-slate-950 border-t py-32">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-20 mb-24">
            <div className="col-span-2 space-y-10">
              <AmazoprintLogo className="scale-125 origin-left" />
              <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-sm">Industrial-grade precision. AI-powered creativity. Global delivery network.</p>
              <div className="flex gap-6">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer shadow-xl border border-slate-100 dark:border-slate-800"><Globe size={28}/></div>
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer shadow-xl border border-slate-100 dark:border-slate-800"><Briefcase size={28}/></div>
              </div>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.4em] mb-10 text-foreground">Infrastructure</h4>
              <ul className="space-y-6 text-slate-500 font-bold text-sm uppercase tracking-widest">
                <li><Link href="/products" className="hover:text-primary transition-colors">Catalog</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors">Studio Quests</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Neural Studio</Link></li>
                <li><Link href="/freelancer/dashboard" className="hover:text-primary transition-colors">Expert Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.4em] mb-10 text-foreground">Global Ops</h4>
              <ul className="space-y-6 text-slate-500 font-bold text-sm uppercase tracking-widest">
                <li><Link href="/about" className="hover:text-primary transition-colors">Company</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Dispatch Hub</Link></li>
                <li><Link href="/printer-registration" className="hover:text-primary transition-colors">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.4em] mb-10 text-foreground">Policy</h4>
              <ul className="space-y-6 text-slate-500 font-bold text-sm uppercase tracking-widest">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of SLA</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Data Protocol</Link></li>
                <li><Link href="/admin-login" className="hover:text-primary transition-colors">Console</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-16 border-t flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">© {new Date().getFullYear()} Amazoprint Inc. Industrial Precision Operations.</p>
            <div className="flex gap-12 text-slate-400 font-black text-[11px] uppercase tracking-[0.4em]">
              <Link href="/privacy" className="cursor-pointer hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="cursor-pointer hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
