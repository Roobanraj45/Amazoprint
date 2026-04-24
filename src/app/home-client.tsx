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

  // Fixed summation logic to perform numeric addition
  const totalBountyPool = contests.reduce((acc, curr) => {
    const amount = parseFloat(curr.contest.prizeAmount || '0');
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  const topDesigners = [
    { name: 'Arun Kumar', wins: 12, earnings: '₹85,000', avatar: 'https://picsum.photos/seed/arun/200' },
    { name: 'Priya S.', wins: 8, earnings: '₹62,000', avatar: 'https://picsum.photos/seed/priya/200' },
    { name: 'Rahul V.', wins: 15, earnings: '₹1,20,000', avatar: 'https://picsum.photos/seed/rahul/200' },
    { name: 'Anita D.', wins: 5, earnings: '₹34,000', avatar: 'https://picsum.photos/seed/anita/200' },
  ];

  const brandLogos = [
    { name: 'TechScale', icon: <Building2 className="w-8 h-8 opacity-40" /> },
    { name: 'CreativeFlow', icon: <Palette className="w-8 h-8 opacity-40" /> },
    { name: 'GlobalPrint', icon: <Globe className="w-8 h-8 opacity-40" /> },
    { name: 'PureDesign', icon: <Leaf className="w-8 h-8 opacity-40" /> },
    { name: 'FastTrack', icon: <Zap className="w-8 h-8 opacity-40" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <Navbar />

      <main className="flex-1 pt-20">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 text-center overflow-hidden">
           <div className="absolute inset-x-0 top-[-200px] h-[500px] -z-20 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1),transparent_40%)]"></div>
           <div className="container px-4 mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-6 py-2 px-4 bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 rounded-full font-semibold">
                <Sparkles className="w-4 h-4 mr-2" /> Global Industrial Print Ecosystem
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight mb-8">
                Design. Compete. <br/> <span className="gradient-text">Get Paid Daily.</span>
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
                The high-performance platform for custom prints. Access industrial tools, win design bounties, or scale your production network with AI-driven efficiency.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="h-16 px-10 rounded-full text-lg font-black group shadow-2xl shadow-primary/30">
                  <Link href="/products">
                    Start Creating <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-16 px-10 rounded-full text-lg font-bold border-2 hover:bg-muted/50">
                  <Link href="/contests">
                    View Live Bounties
                  </Link>
                </Button>
              </div>

              {/* Trust Legends Row */}
              <div className="mt-20 flex flex-wrap justify-center items-center gap-12 grayscale">
                 {brandLogos.map((brand, i) => (
                    <div key={i} className="flex items-center gap-2">
                        {brand.icon}
                        <span className="text-sm font-black uppercase tracking-widest opacity-40">{brand.name}</span>
                    </div>
                 ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. PLATFORM STATS Row --- */}
        <section className="py-12 border-y bg-muted/10">
            <div className="container px-4 mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Prints Delivered', value: '1.2M+', icon: <ShoppingCart className="text-primary"/> },
                        { label: 'Top Designers', value: '50k+', icon: <Users className="text-indigo-500"/> },
                        { label: 'Prize Pool Given', value: '₹25L+', icon: <IndianRupee className="text-emerald-500"/> },
                        { label: 'Production Hubs', value: '200+', icon: <Building2 className="text-amber-500"/> },
                    ].map((stat, i) => (
                        <div key={i} className="text-center space-y-1">
                            <div className="flex justify-center mb-2">{stat.icon}</div>
                            <p className="text-3xl font-black">{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 3. THE DESIGN ARENA (Elite Competition Section) --- */}
        {contests && contests.length > 0 && (
          <section className="py-32 bg-slate-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full"></div>
            
            <div className="container px-4 mx-auto relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-black uppercase tracking-widest">
                    <Trophy className="w-4 h-4" /> Global Prize Pool
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                    Industrial <span className="text-primary">Bounties.</span>
                  </h2>
                  <p className="text-slate-400 text-xl max-w-2xl font-medium leading-relaxed">
                    Battle for elite project credits. Top creative talent earns significant payouts for high-fidelity brand work.
                  </p>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-4">
                  <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl min-w-[300px]">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">LIVE ARENA POOL</p>
                    <div className="flex items-center gap-3">
                        <Flame className="text-amber-500 animate-pulse" />
                        <p className="text-5xl font-black text-emerald-400 tabular-nums">₹{totalBountyPool.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {contests.map(({ contest, participantsCount }) => {
                  const progressValue = (participantsCount / contest.maxFreelancers) * 100;
                  return (
                    <motion.div key={contest.id} {...FADE_UP} whileHover={{ y: -10 }}>
                      <Card className="h-full flex flex-col bg-white/5 backdrop-blur-md border-white/10 hover:border-primary/50 transition-all duration-500 rounded-[2.5rem] overflow-hidden group">
                        <CardHeader className="p-8">
                          <div className="flex justify-between items-center mb-6">
                            <Badge variant="outline" className="border-white/20 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1">
                              {contest.productName}
                            </Badge>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <CardTitle className="text-2xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {contest.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8 flex-grow">
                          <div className="relative p-8 rounded-3xl bg-white/5 border border-white/5 overflow-hidden group-hover:bg-white/10 transition-colors">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">GRAND BOUNTY</p>
                              <p className="text-3xl font-black text-white">₹{parseFloat(contest.prizeAmount || '0').toLocaleString('en-IN')}</p>
                              <Crown className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-primary/10 rotate-12 group-hover:text-primary/20 transition-all" />
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
                            <div className="space-y-2">
                              <Progress value={progressValue} className="h-1 bg-white/5" />
                              <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 tracking-tighter">
                                <span>Arena Capacity</span>
                                <span>{Math.round(progressValue)}% Full</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-8 bg-white/5 border-t border-white/5">
                          <Button asChild className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                            <Link href={`/contests/${contest.id}`}>View Intel</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-20 text-center">
                <Button variant="link" asChild className="text-slate-500 hover:text-white font-black uppercase tracking-[0.3em] text-[10px]">
                  <Link href="/contests" className="flex items-center gap-2">
                    Enter the Professional Arena <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* --- 4. HOW IT WORKS (The Creator Journey) --- */}
        <section className="py-32">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight">The Creator <span className="text-primary">Journey.</span></h2>
                    <p className="text-xl text-muted-foreground font-medium">Simple steps to turn your creative mastery into consistent payouts.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { title: 'Join a Quest', desc: 'Browse live bounties and join the arena for your preferred industrial canvas.', icon: <Trophy />, color: 'bg-blue-500' },
                        { title: 'Design & Submit', desc: 'Use our high-fidelity AI studio to create pixel-perfect industrial designs.', icon: <MousePointer2 />, color: 'bg-indigo-500' },
                        { title: 'Get Paid Daily', desc: 'Winner funds are released instantly once the client finalizes the choice.', icon: <CreditCard />, color: 'bg-emerald-500' },
                    ].map((step, i) => (
                        <div key={i} className="relative group text-center space-y-6">
                            <div className={cn("mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110", step.color)}>
                                {React.cloneElement(step.icon as React.ReactElement, { size: 40 })}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
                            </div>
                            {i < 2 && <ArrowRight className="hidden md:block absolute top-10 -right-6 text-muted-foreground/30" size={32} />}
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 5. WALL OF FAME (Legends Row) --- */}
        <section className="py-32 bg-muted/20">
            <div className="container px-4 mx-auto">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Arena <span className="text-primary">Legends.</span></h2>
                        <p className="text-muted-foreground text-lg font-medium">Meet the top-earning creative elite on the platform.</p>
                    </div>
                    <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-2">View Leaderboard</Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {topDesigners.map((designer, i) => (
                        <motion.div key={i} {...FADE_UP} transition={{ delay: i * 0.1 }}>
                            <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all overflow-hidden bg-background group">
                                <div className="p-8 text-center space-y-6">
                                    <div className="relative mx-auto w-32 h-32">
                                        <Avatar className="w-full h-full border-4 border-muted group-hover:border-primary/30 transition-colors">
                                            <AvatarImage src={designer.avatar} />
                                            <AvatarFallback>{designer.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                                            TOP CREATOR
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-bold">{designer.name}</h4>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{designer.wins} Arena Wins</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earned</p>
                                        <p className="text-2xl font-black text-emerald-600">{designer.earnings}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- 6. INDUSTRIAL CANVAS SELECTION --- */}
        {subProducts && subProducts.length > 0 && (
          <section className="py-32">
            <div className="container px-4 mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div className="space-y-4">
                   <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Industrial <span className="gradient-text">Canvas.</span></h2>
                   <p className="text-xl text-muted-foreground font-medium max-w-xl">Elite material options for high-performance marketing deployments.</p>
                </div>
                <Button variant="link" asChild className="font-bold uppercase tracking-widest text-xs"><Link href="/products">Explore Catalog <ArrowRight size={14}/></Link></Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {subProducts.map((subProduct: any) => {
                  const price = Number(subProduct.price || 0);
                  const imageUrl = resolveImagePath(subProduct.imageUrl || subProduct.parentProductImageUrl);
                  return (
                    <motion.div key={subProduct.id} {...FADE_UP}>
                      <Link href={`/design/${subProduct.productSlug}/start?subProductId=${subProduct.id}`} className="block h-full">
                        <Card className="group h-full flex flex-col overflow-hidden rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 border-border/60">
                          <CardHeader className="p-0 relative aspect-[4/5]">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={subProduct.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Palette className="w-12 h-12 text-slate-300" />
                              </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase text-primary">Starts At</p>
                                    <p className="text-xl font-black flex items-center"><IndianRupee size={15}/>{price.toFixed(0)}</p>
                                </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-8 flex-grow space-y-4">
                            <div>
                                <h3 className="font-black text-xl mb-1 truncate group-hover:text-primary transition-colors">{subProduct.name}</h3>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">{subProduct.productName}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-muted text-[9px] font-bold">PRE-PRESS READY</Badge>
                                <Badge variant="secondary" className="bg-muted text-[9px] font-bold">INDUSTRIAL GRADE</Badge>
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
        
        {/* --- 7. THE BENTO GRID FEATURES --- */}
        <section className="py-32 bg-slate-900 text-white">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mb-20 space-y-6">
              <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                <ShieldCheck size={14} /> Technology Ecosystem
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">Built for <span className="text-primary">Global Impact.</span></h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed">Industrial-grade printing infrastructure reimagined with high-performance AI and real-time logistics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
              <motion.div {...FADE_UP} className="md:col-span-8 glass-card relative overflow-hidden group min-h-[450px] flex flex-col justify-between border-white/10">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Palette size={200} strokeWidth={0.5} />
                </div>
                <Palette className="w-16 h-16 text-primary mb-8" />
                <div className="relative z-10">
                    <h3 className="text-4xl font-black mb-6">Cloud-Native <br/>Design Studio</h3>
                    <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">A professional-grade vector engine designed for raw assets, custom typography, and zero-loss industrial exports.</p>
                    <div className="flex gap-4 mt-8">
                        <Badge className="bg-white/5 border-white/10 text-white font-bold text-[10px]">VECTOR RAW</Badge>
                        <Badge className="bg-white/5 border-white/10 text-white font-bold text-[10px]">CMYK NATIVE</Badge>
                    </div>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card flex flex-col justify-between min-h-[450px] border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent">
                <Sparkles className="w-16 h-16 text-primary/70 animate-float" />
                <div>
                  <h3 className="text-3xl font-black mb-4">Neural <br/>Proofing</h3>
                  <p className="text-slate-400 font-medium">Automated high-res scaling and background isolation powered by specialized GenAI models.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card min-h-[350px] flex flex-col justify-between border-white/10">
                <Trophy className="text-amber-500 w-12 h-12" />
                <div>
                  <h4 className="text-2xl font-black mb-2">Instant Payouts</h4>
                  <p className="text-slate-400 font-medium leading-relaxed">Winner funds are released within 24 hours of contest finalization. No waiting periods.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-8 glass-card flex flex-col md:flex-row gap-12 items-center min-h-[350px] border-white/10 bg-primary/5">
                <div className="flex-1 space-y-6">
                  <h4 className="text-3xl font-black">Precision Network</h4>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed">Real-time order routing to the optimal regional production hub for zero-latency delivery.</p>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-[9px] font-black uppercase">Global Fulfillment</Badge>
                    <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-[9px] font-black uppercase">Carbon Neutral</Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 w-40 h-40 bg-white/5 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10 relative overflow-hidden">
                   <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                  <Globe className="w-20 h-20 text-primary animate-spin-slow" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 8. FINAL CTA ARENA --- */}
        <section className="py-40">
          <div className="container px-4 mx-auto">
            <div className="rounded-[4rem] p-20 md:p-32 text-center text-primary-foreground relative overflow-hidden bg-gradient-to-br from-blue-600 via-primary to-indigo-700 shadow-2xl shadow-primary/20">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               <div className="relative z-10 max-w-4xl mx-auto space-y-12">
                <h2 className="text-6xl md:text-8xl font-black mb-8 leading-none tracking-tighter">Ready to <span className="text-black/20">Scale?</span></h2>
                <p className="text-2xl md:text-3xl mb-12 opacity-90 font-medium max-w-2xl mx-auto">Join the elite network of brands and creators redefining the industrial print landscape.</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button size="xl" variant="secondary" asChild className="h-20 px-16 rounded-full text-2xl font-black shadow-2xl bg-white text-primary hover:bg-slate-50 hover:scale-105 transition-all">
                    <Link href="/register">Start Account</Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="h-20 px-16 rounded-full text-2xl font-black border-white/30 hover:bg-white/10 hover:border-white transition-all">
                    <Link href="/contact">Talk to Scale</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-card/30 border-t py-24">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-16 mb-20">
            <div className="col-span-2 space-y-8">
              <AmazoprintLogo className="scale-110 origin-left" />
              <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xs">Industrial-grade precision. AI-powered creativity. Global delivery network.</p>
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm"><Globe size={24}/></div>
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm"><Briefcase size={24}/></div>
              </div>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-foreground">Explore</h4>
              <ul className="space-y-5 text-muted-foreground font-bold text-sm">
                <li><Link href="/products" className="hover:text-primary transition-colors">Industrial Catalog</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors">Arena Bounties</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Neural Editor</Link></li>
                <li><Link href="/freelancer/dashboard" className="hover:text-primary transition-colors">Creator Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-foreground">Scale</h4>
              <ul className="space-y-5 text-muted-foreground font-bold text-sm">
                <li><Link href="/about" className="hover:text-primary transition-colors">Company Ops</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Global Support</Link></li>
                <li><Link href="/printer-registration" className="hover:text-primary transition-colors">Partner Hub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-foreground">Privacy</h4>
              <ul className="space-y-5 text-muted-foreground font-bold text-sm">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of SLA</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Data Policy</Link></li>
                <li><Link href="/admin-login" className="hover:text-primary transition-colors">Admin Console</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-muted-foreground text-sm font-bold">© {new Date().getFullYear()} Amazoprint Inc. Precision Operations India.</p>
            <div className="flex gap-10 text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
              <Link href="/privacy" className="cursor-pointer hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="cursor-pointer hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
