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

  // Derive dynamic categories from templates
  const dynamicCategories = ['All', ...Array.from(new Set(templates.map(t => {
    const slug = t.productSlug || 'Other';
    return slug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  })))];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const slug = (t.productSlug || '').toLowerCase().replace(/_/g, '-');
    
    // Convert category back to slug-like for comparison
    const categorySlug = selectedCategory.toLowerCase().replace(/\s+/g, '-');
    const matchesCategory = selectedCategory === 'All' || slug === categorySlug;
    
    return matchesSearch && matchesCategory;
  });

  // Group by Product Category, then by Sub-Product
  const groupedTemplates = filteredTemplates.reduce((acc: any, t: any) => {
    const productKey = (t.productSlug || 'Other').split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const subProductKey = t.subProduct?.name || 'Standard Variants';

    if (!acc[productKey]) acc[productKey] = {};
    if (!acc[productKey][subProductKey]) acc[productKey][subProductKey] = [];
    
    acc[productKey][subProductKey].push(t);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        {/* Filter Bar */}
        <section className="container px-4 mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-6 rounded-[2.5rem] bg-zinc-950 text-white border border-white/5 shadow-2xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide px-2">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                    selectedCategory === cat 
                      ? "bg-primary border-primary text-white shadow-[0_0_30px_-8px_rgba(var(--primary),0.6)] scale-105" 
                      : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-white hover:border-white/10"
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

        {/* Categorized Grid */}
        <section className="container px-4 mx-auto space-y-32">
          {Object.keys(groupedTemplates).length > 0 ? (
            Object.entries(groupedTemplates).map(([productCategory, subProducts]: [string, any], pIdx) => (
              <div key={productCategory} className="space-y-16">
                
                {/* Product Header */}
                <div className="flex items-center gap-8 group">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Category</span>
                        <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                            {productCategory}
                            <span className="h-2 w-2 rounded-full bg-primary" />
                        </h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/[0.05] to-transparent" />
                </div>

                {/* Sub-Products Loop */}
                <div className="space-y-20">
                  {Object.entries(subProducts).map(([subProduct, items]: [string, any]) => (
                    <div key={subProduct} className="space-y-8">
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-400 font-bold px-4 py-1 rounded-lg text-[10px] uppercase tracking-wider">
                                {subProduct}
                            </Badge>
                            <span className="text-[10px] font-bold text-zinc-600">{items.length} Templates available</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                            {items.map((template: any) => (
                                <Link
                                    key={template.id}
                                    href={`/design/${template.productSlug || 'other'}?templateId=${template.id}`}
                                    className="group relative block aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-700 hover:border-primary/50 hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
                                >
                                    {(() => {
                                      // Unit guard: if width is very large, it's likely already in pixels
                                      const rawWidth = template.width || 300;
                                      const rawHeight = template.height || 200;
                                      const widthInPx = rawWidth > 600 ? rawWidth : Math.round(rawWidth * MM_TO_PX);
                                      const heightInPx = rawHeight > 600 ? rawHeight : Math.round(rawHeight * MM_TO_PX);

                                      const productForCanvas: Product = {
                                        id: template.productSlug || 'custom',
                                        name: template.name || 'Untitled',
                                        description: '',
                                        imageId: '',
                                        width: widthInPx,
                                        height: heightInPx,
                                        type: '',
                                      };
                                      
                                      let elements: DesignElement[] = [];
                                      try {
                                        const rawElements = typeof template.elements === 'string' ? JSON.parse(template.elements) : (template.elements || []);
                                        if (Array.isArray(rawElements)) {
                                          const isMultiPage = rawElements.length > 0 && Array.isArray(rawElements[0]);
                                          elements = (isMultiPage ? rawElements[0] : rawElements) as DesignElement[];
                                        }
                                      } catch (e) {
                                        console.error('Error parsing elements:', e);
                                      }

                                      let background: Background = { type: 'solid', color: '#ffffff' };
                                      try {
                                        const rawBackground = typeof template.background === 'string' ? JSON.parse(template.background) : (template.background || { type: 'solid', color: '#ffffff' });
                                        if (Array.isArray(rawBackground) && rawBackground.length > 0) {
                                          background = rawBackground[0] as Background;
                                        } else if (rawBackground && typeof rawBackground === 'object' && !Array.isArray(rawBackground)) {
                                          background = rawBackground as Background;
                                        }
                                      } catch (e) {
                                        console.error('Error parsing background:', e);
                                      }
                                      
                                      // We use a high base resolution for calculation to maintain fidelity
                                      const baseSize = 1000;
                                      const scale = Math.min(baseSize / widthInPx, (baseSize * 0.75) / heightInPx) * 0.95;

                                      return (
                                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-zinc-950/60 overflow-hidden group-hover:bg-zinc-950/30 transition-colors duration-700">
                                          {/* This outer div scales the design to fit the card responsively */}
                                          <div className="w-full h-full flex items-center justify-center">
                                            <div style={{ 
                                              width: widthInPx * scale, 
                                              height: heightInPx * scale, 
                                              position: 'relative', 
                                              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
                                              transform: `scale(${1 / (baseSize / 300)})`, // Secondary scale to fit responsive container
                                              zoom: 'calc(100% * (1 / (baseSize / 350)))' // Fallback for browsers that support zoom
                                            }} className="scale-[0.3] sm:scale-[0.35] md:scale-[0.4] transition-transform duration-700 group-hover:scale-[0.32] sm:group-hover:scale-[0.37]">
                                              <div style={{ 
                                                transform: `scale(${scale})`, 
                                                transformOrigin: 'top left', 
                                                width: widthInPx, 
                                                height: heightInPx,
                                                position: 'relative',
                                                overflow: 'hidden'
                                              }}>
                                                <DesignCanvas
                                                  product={productForCanvas}
                                                  elements={elements}
                                                  background={background}
                                                  selectedElementIds={[]}
                                                  guides={template.guides as Guide[] || []}
                                                  showRulers={false}
                                                  showGrid={false}
                                                  showPrintGuidelines={false}
                                                  gridSize={20}
                                                  bleed={0}
                                                  safetyMargin={0}
                                                  viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                                                  isPreview={true}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Glass Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                                        <div className="flex flex-col gap-1.5">
                                            <h3 className="text-lg font-bold text-white truncate drop-shadow-md">
                                                {template.name}
                                            </h3>
                                            <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Customize Now</span>
                                                <ArrowRight size={14} className="text-primary -translate-x-4 group-hover:translate-x-0 transition-transform duration-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button Pop */}
                                    <div className="absolute top-6 right-6 h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500">
                                        <Sparkles size={18} className="text-white" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.02]">
                <LayoutGrid size={64} className="mx-auto mb-8 text-zinc-800" />
                <h3 className="text-2xl font-black text-white mb-2">No matching masterpieces</h3>
                <p className="text-zinc-500 font-medium">Try refining your search or browsing another collection.</p>
                <Button variant="link" className="mt-8 text-primary font-bold uppercase tracking-widest text-[10px]" onClick={() => { setSearch(''); setSelectedCategory('All'); }}>
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
