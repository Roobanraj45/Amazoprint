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
                <Sparkles className="w-4 h-4 mr-2" /> Join 25 million+ users
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-8">
                Easy marketing for <br/> <span className="gradient-text">busy people.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
                The all-in-one platform for high-end custom prints. Use our AI designer, run a design contest, or upload your own files to get started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="h-14 px-8 rounded-full text-base font-bold group shadow-xl shadow-primary/20">
                  <Link href="/products">
                    Start creating <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild className="h-14 px-8 rounded-full text-base font-bold shadow-sm glass-card !bg-transparent !border-foreground/20 hover:!bg-foreground/10">
                  <Link href="/products">
                    Create with AI
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. THE DESIGN ARENA (NEW) --- */}
        {contests && contests.length > 0 && (
          <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
            
            <div className="container px-4 mx-auto relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div className="space-y-4">
                  <Badge className="bg-primary/20 text-primary-foreground border-primary/30 py-1.5 px-4 rounded-full font-bold uppercase tracking-widest text-[10px]">
                    <Trophy className="w-3 h-3 mr-2" /> Elite Design Challenges
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                    Showcase Talent. <br/><span className="text-primary">Earn Bounties.</span>
                  </h2>
                  <p className="text-slate-400 text-lg max-w-xl font-medium">
                    Compete in high-stakes design battles. Top designers walk away with thousands in prizes and premium project credits.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Active Bounty Pool</p>
                    <p className="text-4xl font-black text-emerald-400">₹{contests.reduce((acc, curr) => acc + Number(curr.contest.prizeAmount), 0).toLocaleString()}</p>
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
                              Earn ₹{Number(contest.prizeAmount).toLocaleString()}
                            </div>
                          </div>
                          <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {contest.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6 flex-grow">
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
                              <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-tighter">Arena Fill Rate</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-6 bg-white/5 border-t border-white/5">
                          <Button asChild className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Link href={`/contests/${contest.id}`}>Join Arena</Link>
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
                    View All Active Bounties <ArrowRight size={14} />
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
                  Explore Our Best Deals
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  Handpicked for you. Get the best prices on our most popular product variants.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {subProducts.map((subProduct: any) => {
                  const price = Number(subProduct.price || 0);
                  const originalPrice = price * 1.25; // Dummy original price for deal display
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
        
        {/* --- 3.6. Direct Selling Products --- */}
        {directSellingProducts && directSellingProducts.length > 0 && (
          <section className="py-24">
            <div className="container px-4 mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Ready to Ship
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  Explore our curated collection of products available for direct purchase.
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

        {/* --- 4. THE BENTO GRID FEATURES --- */}
        <section className="py-24 bg-muted/20">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mb-12">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 gradient-text">Built for Modern Brands.</h2>
              <p className="text-xl text-muted-foreground font-medium">We've reimagined every step of the printing process with intelligence.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
              <motion.div {...FADE_UP} className="md:col-span-8 glass-card relative overflow-hidden group min-h-[400px] bg-gradient-to-br from-primary/10 to-transparent">
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <Palette className="w-12 h-12 text-primary mb-8" />
                  <div>
                    <h3 className="text-4xl font-bold mb-4">Professional Design Studio</h3>
                    <p className="text-muted-foreground text-lg max-w-md">Our cloud editor handles vectors, high-res images, and CMYK profiles perfectly. No downloads required.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card flex flex-col justify-between min-h-[400px]">
                <Sparkles className="w-12 h-12 text-primary/70 animate-float" />
                <div>
                  <h3 className="text-3xl font-bold mb-4">AI Magic</h3>
                  <p className="text-muted-foreground">Instant layouts and background removal powered by neural networks.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-4 glass-card min-h-[300px] flex flex-col justify-between">
                <Trophy className="text-primary/70 w-10 h-10" />
                <div>
                  <h4 className="text-2xl font-bold mb-2">Crowdsourcing</h4>
                  <p className="text-muted-foreground">Launch a contest and let 15k designers compete for your project.</p>
                </div>
              </motion.div>

              <motion.div {...FADE_UP} className="md:col-span-8 glass-card flex flex-col md:flex-row gap-8 items-center min-h-[300px]">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-4">The Global Print Network</h4>
                  <p className="text-muted-foreground mb-6">We route your order to the nearest facility to reduce carbon emissions and ensure 48h delivery.</p>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="bg-background">150+ Countries</Badge>
                    <Badge variant="outline" className="bg-background">Next Day Shipping</Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 w-32 h-32 bg-background/50 rounded-2xl flex items-center justify-center shadow-inner">
                  <Globe className="w-16 h-16 text-primary/70 animate-spin-slow" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 5. STEP-BY-STEP PROCESS --- */}
        <section className="py-24">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <Badge className="bg-primary/10 text-primary mb-6">How it works</Badge>
                <h2 className="text-5xl font-black mb-12">From Concept to <br /> Doorstep in 72h.</h2>
                <div className="space-y-12">
                   {[
                     { step: '01', t: 'Design or Launch Contest', d: 'Use our AI studio or let thousands of freelancers create your vision.' },
                     { step: '02', t: 'Pro Proofing', d: 'Every design is automatically checked for resolution, bleed, and CMYK accuracy.' },
                     { step: '03', t: 'Eco-Smart Print', d: 'We print using soy-based inks at the facility closest to your location.' }
                   ].map((item, idx) => (
                     <div key={idx} className="flex gap-8 group">
                        <div className="text-5xl font-black text-foreground/10 group-hover:text-primary transition-colors">{item.step}</div>
                        <div>
                          <h4 className="text-2xl font-bold mb-2">{item.t}</h4>
                          <p className="text-muted-foreground max-w-sm leading-relaxed">{item.d}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
              <div className="relative aspect-square rounded-[3rem] overflow-hidden glass-card p-0 bg-gradient-to-br from-primary/10 to-transparent">
                <Image 
                  src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&q=100&w=1000" 
                  alt="Process" fill className="object-cover opacity-60 mix-blend-luminosity"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- 6. TESTIMONIALS --- */}
        <section className="py-24">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-4xl font-black mb-12 tracking-tight">Loved by 50k+ Businesses.</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="glass-card text-left p-8">
                  <Quote className="w-12 h-12 text-primary/20 mb-6" />
                  <div className="flex text-amber-400 mb-6"><Star className="fill-current"/><Star className="fill-current"/><Star className="fill-current"/><Star className="fill-current"/><Star className="fill-current"/></div>
                  <p className="text-lg text-muted-foreground mb-8 italic">"Amazoprint transformed our branding. The quality of the matte business cards is better than any local boutique printer we've used."</p>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 shadow-lg"><AvatarImage src={`https://i.pravatar.cc/150?u=${item}`} /></Avatar>
                    <div>
                      <p className="font-bold">Alex Rivera</p>
                      <p className="text-sm text-muted-foreground">Marketing Lead, TechFlow</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PRINTER CTA --- */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <Card className="p-10 flex flex-col items-center text-center bg-transparent bg-[radial-gradient(hsl(var(--muted))_1px,transparent_1px)] [background-size:16px_16px]">
              <Badge>For Production Houses</Badge>
              <h2 className="text-3xl font-bold mt-4">Join Our Print Network</h2>
              <p className="text-muted-foreground mt-4 mb-8 max-w-xl mx-auto">
                Expand your business by joining our network of printing partners. Get access to a steady stream of jobs from clients all over the world.
              </p>
              <div className="relative aspect-video rounded-2xl overflow-hidden w-full max-w-2xl mb-8 shadow-lg">
                <Image src="https://images.unsplash.com/photo-1555095582-93e2a8649cde?q=80&w=1000&auto=format&fit=crop" alt="Printing Press" fill className="object-cover" />
              </div>
              <Button asChild size="lg" className="rounded-full px-8 font-bold">
                <Link href="/printer-registration">
                  Register as a Printer <ArrowRight className="ml-2 h-4 w-4" />
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
                <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1]">Ready to make your mark?</h2>
                <p className="text-xl md:text-2xl mb-12 opacity-80 font-medium">Create your first design for free or hire a pro in seconds.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="xl" variant="secondary" asChild className="h-16 px-12 rounded-full text-xl font-bold shadow-2xl glass-card !bg-white/90 text-black hover:!bg-white">
                    <Link href="/register">Create Account</Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="h-16 px-12 rounded-full text-xl font-bold border-white/30 hover:bg-white/10">
                    <Link href="/contact">Talk to Sales</Link>
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
              <p className="text-muted-foreground max-w-xs">High-fidelity printing with AI intelligence and a global soul.</p>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"><Globe size={20}/></div>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer"><Briefcase size={20}/></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Explore</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href="/contests" className="hover:text-primary transition-colors">Design Contests</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">AI Studio</Link></li>
                <li><Link href="/freelancer/dashboard" className="hover:text-primary transition-colors">For Freelancers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/sustainability" className="hover:text-primary transition-colors">Sustainability</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-foreground">Support</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/printer-registration" className="hover:text-primary transition-colors">For Printers</Link></li>
                <li><Link href="/admin-login" className="hover:text-primary transition-colors">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-sm font-medium">© {new Date().getFullYear()} Amazoprint Inc. All rights reserved.</p>
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
