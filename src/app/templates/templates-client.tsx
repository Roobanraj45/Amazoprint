'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Search,
  Filter,
  LayoutGrid,
  Palette,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { Product, DesignElement, Background, Guide } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

// --- Animation Variants ---
const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }
};

export function TemplatesClient({ templates }: { templates: any[] }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.productSlug.includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Visiting Card', 'T-Shirt', 'Flyer', 'Banner'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        {/* Filter Bar */}
        <section className="container px-4 mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-6 rounded-[2.5rem] bg-zinc-950 text-white border border-white/5 shadow-2xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                    selectedCategory === cat 
                      ? "bg-primary border-primary text-white shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]" 
                      : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={16} />
              <Input 
                placeholder="Search templates..." 
                className="pl-12 h-12 bg-white/5 border-white/10 focus-visible:ring-primary/20 rounded-full text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Grid Section */}
        <section className="container px-4 mx-auto">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link href={`/design/${template.productSlug}?templateId=${template.id}`} className="group block h-full">
                      <Card className="h-full overflow-hidden rounded-[2rem] border-border/40 bg-card hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                        <CardContent className="p-0">
                          <div className="aspect-[4/5] relative bg-muted overflow-hidden flex items-center justify-center">
                            {/* Live Design Rendering */}
                            {(() => {
                              const widthInPx = Math.round(template.width * MM_TO_PX);
                              const heightInPx = Math.round(template.height * MM_TO_PX);
                              const productForCanvas: Product = {
                                id: template.productSlug,
                                name: template.name,
                                description: '',
                                imageId: '',
                                width: widthInPx,
                                height: heightInPx,
                                type: '',
                              };
                              const isMultiPage = Array.isArray(template.elements) && template.elements.length > 0 && Array.isArray(template.elements[0]);
                              const elements: DesignElement[] = (isMultiPage ? template.elements[0] : template.elements) as DesignElement[];
                              const background: Background = (isMultiPage && Array.isArray(template.background) ? template.background[0] : template.background) as Background;
                              
                              // Calculate scale to fit aspect-[4/5]
                              // Max width is roughly 300-400px depending on screen
                              const containerWidth = 300; 
                              const containerHeight = (containerWidth * 5) / 4;
                              const scale = Math.min(containerWidth / widthInPx, containerHeight / heightInPx) * 0.9;

                              return (
                                <div className="relative" style={{ width: widthInPx * scale, height: heightInPx * scale }}>
                                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx }}>
                                    <DesignCanvas
                                      product={productForCanvas}
                                      elements={elements}
                                      background={background}
                                      guides={template.guides as Guide[] || []}
                                      showRulers={false}
                                      showGrid={false}
                                      showPrintGuidelines={false}
                                      gridSize={20}
                                      bleed={0}
                                      safetyMargin={0}
                                      viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {/* Template Badge */}
                            <div className="absolute top-4 left-4 z-20">
                              <Badge className="bg-zinc-950/80 backdrop-blur-md text-[9px] uppercase font-black tracking-widest border-white/10">
                                {template.productSlug.replace('-', ' ')}
                              </Badge>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-30">
                              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex flex-col items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-xl">
                                  <Palette size={24} />
                                </div>
                                <span className="text-white font-black uppercase text-[10px] tracking-[0.2em]">Customize Template</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 space-y-4 bg-white dark:bg-zinc-900 border-t">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="font-black text-lg uppercase font-headline tracking-tight leading-tight group-hover:text-primary transition-colors truncate w-full">
                                  {template.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {template.width}x{template.height}mm
                                  </p>
                                  <span className="w-1 h-1 rounded-full bg-border" />
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                    Print Ready
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-32 space-y-6">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase font-headline">No templates found</h3>
                <p className="text-muted-foreground font-medium">Try adjusting your search or category filters.</p>
              </div>
              <Button variant="outline" onClick={() => { setSearch(''); setSelectedCategory('All'); }} className="rounded-full px-8 uppercase font-bold text-[11px] tracking-widest">
                Clear all filters
              </Button>
            </div>
          )}
        </section>

        {/* Custom Request CTA */}
        <section className="container px-4 mx-auto mt-32">
          <div className="p-12 rounded-[3rem] bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800 text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase font-headline max-w-2xl mx-auto">
              Need Something <br /><span className="text-primary">Completely Unique?</span>
            </h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Work with our network of elite designers to create a custom template tailored specifically to your brand identity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="rounded-2xl px-8 h-14 uppercase font-black tracking-widest text-[12px] bg-zinc-950 text-white hover:bg-zinc-800 shadow-xl">
                Post a Design Quest
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl px-8 h-14 uppercase font-black tracking-widest text-[12px] border-zinc-200 hover:bg-zinc-100 shadow-sm">
                Contact Creative Support
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
