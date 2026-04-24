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
} from 'lucide-react';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AmazoprintLogo } from '@/components/ui/logo';
import { resolveImagePath } from '@/lib/utils';
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

  // Numeric summation to avoid concatenation
  const totalBountyPool = contests.reduce((acc, curr) => acc + parseFloat(curr.contest.prizeAmount || '0'), 0);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <Navbar />

      <main className="flex-1 pt-20">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="relative pt-12 pb-28 md:pt-20 md:pb-40 text-center overflow-hidden">
           <div className="absolute inset-x-0 top-[-200px] h-[500px] -z-20 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1),transparent_40%)]"></div>
           <div className="container px-4 mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-6 py-2 px-4 bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 rounded-full font-semibold">
                <Sparkles className="w-4 h-4 mr-2" /> Redefining the Print Industry
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-8">
                Design. Compete. <br/> <span className="gradient-text">Get Paid.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
                The all-in-one ecosystem for high-end custom prints. Use our professional AI studio, run a design battle, or showcase your talent to earn bounties.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="h-14 px-8 rounded-full text-base font-bold group shadow-xl shadow-primary/20">
                  <Link href="/products">
                    Start creating <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild className="h-14 px-8 rounded-full text-base font-bold shadow-sm glass-card !bg-transparent !border-foreground/20 hover:!bg-foreground/10">
                  <Link href="/contests">
                    Browse Bounties
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. THE DESIGN ARENA --- */}
        {contests && contests.length > 0 && (
          <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
            
            <div className="container px-4 mx-auto relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div className="space-y-4">
                  <Badge className="bg-primary/20 text-primary-foreground border-primary/30 py-1.5 px-4 rounded-full font-bold uppercase tracking-widest text-[10px]">
                    <Trophy className="w-3 h-3 mr-2" /> Elite Design Arena
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                    Showcase Talent. <br/><span className="text-primary">Earn Bounties.</span>
                  </h2>
                  <p className="text-slate-400 text-lg max-w-xl font-medium">
                    Compete in high-stakes design battles. Top designers walk away with thousands in prizes and industrial project credits.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Active Bounty Pool</p>
                    <p className="text-4xl font-black text-emerald-400">₹{totalBountyPool.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {contests.map(({ contest, participantsCount }) => {
                  const progressValue = (participantsCount / contest.maxFreelancers) * 100;
                  return (
                    <motion.div key={contest.id} {...FADE_UP} whileHover={{ y: -5 }}>
                      <Card className="h-full flex flex-col bg-white/5 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all rounded-[2rem] overflow-hidden group">
                        <CardHeader className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <Badge variant="outline" className="border-white/20 text-white text-[10px] uppercase font-bold">
                              {contest.productName}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                              ₹{parseFloat(contest.prizeAmount || '0').toLocaleString('en-IN')} Bounty
                            </div>
                          </div>
                          <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {contest.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6 flex-grow">
                          {/* Visual Prize Box */}
                          <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Winning Prize</p>
                              <p className="text-2xl font-black text-white">₹{parseFloat(contest.prizeAmount || '0').toLocaleString('en-IN')}</p>
                              <Award className="absolute right-[-10px] bottom-[-10px] w-16 h-16 text-primary/10 rotate-12" />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-tight">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                {formatDistanceToNowStrict(new Date(contest.endDate))} left
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                {participantsCount}/{contest.maxFreelancers}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Progress value={progressValue} className="h-1.5 bg-white/5" />
                              <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-tighter">Arena Capacity</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-6 bg-white/5 border-t border-white/5">
                          <Button asChild className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Link href={`/contests/${contest.id}`}>View Intel</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-16 text-center">
                <Button variant="link" asChild className="text-slate-400 hover:text-white font-bold uppercase tracking-widest text-xs">
                  <Link href="/contests" className="flex items-center gap-2">
                    View All Elite Bounties <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* --- 3. SUB-PRODUCTS DEALS --- */}
        {subProducts && subProducts.length > 0 && (
          <section className="py-24 bg-muted/20">
            <div className="container px-4 mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Explore Industrial Canvas
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  Premium materials curated for high-impact branding and marketing.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {subProducts.map((subProduct: any) => {
                  const price = Number(subProduct.price || 0);
                  const originalPrice = price * 1.25;
                  const imageUrl = resolveImagePath(subProduct.imageUrl || subProduct.parentProductImageUrl);
                  return (
                    <motion.div key={subProduct.id} {...FADE_UP} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <Link href={`/design/${subProduct.productSlug}/start?subProductId=${subProduct.id}`} className="block h-full">
                        <Card className="group h-full flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border">
                          <CardHeader className="p-0 relative aspect-square">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={subProduct.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Palette className="w-12 h-12 text-slate-300" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <Badge variant="destructive" className="shadow-lg">20% OFF</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-5 flex-grow">
                            <h3 className="font-bold text-base mb-1 truncate group-hover:text-primary">{subProduct.name}</h3>
                            <p className="text-xs text-muted-foreground mb-3 font-medium">{subProduct.productName}</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-xl font-black text-primary flex items-center"><IndianRupee size={15} className="mr-0.5" />{price.toFixed(0)}</p>
                              <p className="text-sm line-through text-muted-foreground">₹{originalPrice.toFixed(0)}</p>
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
        
        {/* --- 4. Direct Selling Products --- */}
        {directSellingProducts && directSellingProducts.length > 0 && (
          <section className="py-24">
            <div className="container px-4 mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Shop Ready-to-Ship
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  Curated business essentials available for instant industrial delivery.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {directSellingProducts.map((product: any) => {
                  const price = Number(product.sellingPrice || 0);
                  const imageUrl = product.imageUrls?.[0] ? resolveImagePath(product.imageUrls[0]) : null;
                  return (
                    <motion.div key={product.id} {...FADE_UP} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <div className="block h-full">
                        <Card className="group h-full flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border">
                          <CardHeader className="p-0 relative aspect-square">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <Palette className="w-12 h-12 text-slate-300" />
                              </div>
                            )}
                            {product.isFeatured && (
                               <div className="absolute top-3 right-3">
                                <Badge className="shadow-lg bg-amber-400 text-amber-900 border-amber-500">Featured</Badge>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="p-5 flex-grow">
                            <h3 className="font-bold text-base mb-1 truncate group-hover:text-primary">{product.name}</h3>
                            <p className="text-xs text-muted-foreground mb-3 font-medium">{product.category || 'General'}</p>
                            <div className="flex items-baseline justify-between">
                              <p className="text-xl font-black text-primary flex items-center"><IndianRupee size={15} className="mr-0.5" />{price.toFixed(0)}</p>
                              <Badge variant={product.stockQuantity > (product.minStockLevel || 0) ? "secondary" : "destructive"} className="text-xs">{product.stockQuantity} in stock</Badge>
                            </div>
                          </CardContent>
                           <CardContent className="p-4 pt-0">
                             <AddToCartButton product={product} />
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* --- 5. THE BENTO GRID FEATURES --- */}
        <section className="py-24 bg-muted/20">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mb-12">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 gradient-text">Built for Global Brands.</h2>
              <p className="text-xl text-muted-foreground font-medium">Reimagined printing with industrial-grade AI and precision engineering.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
              <motion.div {...FADE_UP} className="md:col-span-8 glass-card relative overflow-hidden group min-h-[400px] bg-gradient-to-br from-primary/10 to-transparent">
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <Palette className="w-12 h-12 text-primary mb-8" />
                  <div>
                    <h3 className="text-4xl font-bold mb-4">Industrial Design Studio</h3>
                    <p className="text-muted-foreground text-lg max-w-md">Cloud-native engine supporting high-fidelity vectors, raw assets, and perfect pre-press accuracy.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card flex flex-col justify-between min-h-[400px]">
                <Sparkles className="w-12 h-12 text-primary/70 animate-float" />
                <div>
                  <h3 className="text-3xl font-bold mb-4">Neural Proofing</h3>
                  <p className="text-muted-foreground">Automated resolution checking and background isolation powered by GenAI.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card min-h-[300px] flex flex-col justify-between">
                <Trophy className="text-primary/70 w-10 h-10" />
                <div>
                  <h4 className="text-2xl font-bold mb-2">Bounty Network</h4>
                  <p className="text-muted-foreground">Connect with global creative talent through high-stakes design battles.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-8 glass-card flex flex-col md:flex-row gap-8 items-center min-h-[300px]">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-4">Precision Print Network</h4>
                  <p className="text-muted-foreground mb-6">Real-time routing to the optimal production facility for maximum speed and minimum carbon footprint.</p>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="bg-background">Global Fulfillment</Badge>
                    <Badge variant="outline" className="bg-background">Industrial Speed</Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 w-32 h-32 bg-background/50 rounded-2xl flex items-center justify-center shadow-inner">
                  <Globe className="w-16 h-16 text-primary/70 animate-spin-slow" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 6. PRINTER CTA --- */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <Card className="p-10 flex flex-col items-center text-center bg-transparent bg-[radial-gradient(hsl(var(--muted))_1px,transparent_1px)] [background-size:16px_16px]">
              <Badge>Production Operations</Badge>
              <h2 className="text-3xl font-bold mt-4">Scale Your Press</h2>
              <p className="text-muted-foreground mt-4 mb-8 max-w-xl mx-auto">
                Join our decentralized print network. Gain access to a continuous stream of verified industrial and custom orders from global clients.
              </p>
              <div className="relative aspect-video rounded-2xl overflow-hidden w-full max-w-2xl mb-8 shadow-lg">
                <Image src="https://images.unsplash.com/photo-1555095582-93e2a8649cde?q=80&w=1000&auto=format&fit=crop" alt="Industrial Press" fill className="object-cover" />
              </div>
              <Button asChild size="lg" className="rounded-full px-8 font-bold">
                <Link href="/printer-registration">
                  Register Facility <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* --- 7. FINAL CTA --- */}
        <section className="py-24">
          <div className="container px-4 mx-auto">
            <div className="rounded-[4rem] p-16 md:p-32 text-center text-primary-foreground relative overflow-hidden bg-gradient-to-br from-blue-600 via-primary to-indigo-700">
               <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1]">Join the Arena.</h2>
                <p className="text-xl md:text-2xl mb-12 opacity-80 font-medium">Create your first industrial project for free or hire an elite designer today.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="xl" variant="secondary" asChild className="h-16 px-12 rounded-full text-xl font-bold shadow-2xl glass-card !bg-white/90 text-black hover:!bg-white">
                    <Link href="/register">Scale Account</Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="h-16 px-12 rounded-full text-xl font-bold border-white/30 hover:bg-white/10">
                    <Link href="/contact">Talk to Scale</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-card/30 border-t py-16">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <AmazoprintLogo />
              <p className="text-muted-foreground max-w-xs">Industrial-grade printing powered by high-performance AI and global logistics.</p>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"><Globe size={20}/></div>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"><Briefcase size={20}/></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Explore</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/products" className="hover:text-primary transition-colors">Industrial Catalog</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors">Design Battles</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Neural Studio</Link></li>
                <li><Link href="/freelancer/dashboard" className="hover:text-primary transition-colors">Designer Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/sustainability" className="hover:text-primary transition-colors">Sustainability</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Operations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Support</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/help" className="hover:text-primary transition-colors">Command Center</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Service Level Agreement</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Data Policy</Link></li>
                <li><Link href="/printer-registration" className="hover:text-primary transition-colors">Facility Enrollment</Link></li>
                <li><Link href="/admin-login" className="hover:text-primary transition-colors">Admin Console</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-sm font-medium">© {new Date().getFullYear()} Amazoprint Inc. Precision Operations.</p>
            <div className="flex gap-8 text-muted-foreground font-bold text-xs uppercase tracking-widest">
              <Link href="/privacy" className="cursor-pointer hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="cursor-pointer hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
