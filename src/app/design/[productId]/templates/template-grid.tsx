'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { Product, DesignElement, Background, Guide } from '@/lib/types';
import { useCustomFonts } from '@/hooks/use-custom-fonts';

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

const TemplateCard = memo(({ template, product, queryStr }: { template: any, product: any, queryStr: string }) => {
  const [isReady, setIsReady] = useState(false);
  
  const widthInPx = Math.round((template.width || 300) * MM_TO_PX);
  const heightInPx = Math.round((template.height || 200) * MM_TO_PX);

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

  const containerWidth = 350;
  const containerHeight = 220;
  const scale = Math.min(containerWidth / (widthInPx || 1), containerHeight / (heightInPx || 1)) * 0.92;

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Link
      href={`/design/${product.slug}?templateId=${template.id}${queryStr ? `&${queryStr}` : ''}`}
      className="group block"
    >
      <div className="relative aspect-[4/3] bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-center overflow-hidden transition-all duration-700 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/50 to-transparent dark:from-zinc-800/20 pointer-events-none" />
        
        {!isReady ? (
          <div className="flex flex-col items-center gap-3">
             <div className="w-10 h-10 rounded-full border-2 border-zinc-100 dark:border-zinc-800 border-t-primary animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Loading</span>
          </div>
        ) : (
          <div className="relative transition-all duration-1000 group-hover:scale-[1.02]" style={{ width: widthInPx * scale, height: heightInPx * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx }} className="shadow-2xl">
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
                isPreview={true}
              />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-8 text-center">
            <div className="space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-white text-sm font-medium leading-tight">Start designing with this <br /> professional layout</p>
                <Button size="lg" className="rounded-full bg-white text-black hover:bg-zinc-100 font-bold px-8">
                   Use Template
                </Button>
            </div>
        </div>
      </div>
      
      <div className="mt-6 px-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-primary transition-colors">
              {template.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{template.width}x{template.height}mm</span>
                <div className="w-1 h-1 rounded-full bg-zinc-300" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Premium</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-all group-hover:bg-primary group-hover:border-primary group-hover:text-white">
             <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
});
TemplateCard.displayName = 'TemplateCard';

export function TemplateGrid({ templates, product, searchParams }: { templates: any[], product: any, searchParams?: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  useCustomFonts();
  
  const filteredTemplates = templates.filter((template) => {
    return template.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const groupedTemplates = filteredTemplates.reduce((acc: Record<string, any[]>, template: any) => {
    const subProductName = template.subProduct?.name || 'All Templates';
    if (!acc[subProductName]) {
      acc[acc[subProductName] ? subProductName : (subProductName || 'All Templates')] = [];
      acc[subProductName] = [];
    }
    acc[subProductName].push(template);
    return acc;
  }, {});

  const sortedGroupNames = Object.keys(groupedTemplates).sort((a, b) => {
    if (a === 'All Templates') return 1;
    if (b === 'All Templates') return -1;
    return a.localeCompare(b);
  });

  const queryStr = searchParams ? new URLSearchParams(searchParams as any).toString() : '';

  return (
    <div className="space-y-24">
      {/* Search & Filter Bar */}
      <div className="sticky top-24 z-30 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl py-6 border-y border-zinc-200 dark:border-zinc-800 -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative w-full md:max-w-xl group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Palette className="h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    placeholder="Search templates, styles, or keywords..."
                    className="h-14 pl-14 pr-6 rounded-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-base focus-visible:ring-primary/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Categories</span>
                <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-[300px] no-scrollbar">
                   {sortedGroupNames.map(group => (
                       <button key={group} className="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-white dark:hover:bg-zinc-800 whitespace-nowrap">
                           {group}
                       </button>
                   ))}
                </div>
            </div>
        </div>
      </div>

      {sortedGroupNames.map((groupName) => (
        <div key={groupName} className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both">
          <div className="flex items-end justify-between gap-6 border-b border-zinc-100 dark:border-zinc-900 pb-8">
            <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em]">
                    <div className="w-8 h-px bg-primary" />
                    Collection
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                {groupName}
                </h2>
            </div>
            <div className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">
              {groupedTemplates[groupName].length} Curated Layouts
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {groupedTemplates[groupName].map((template) => (
              <TemplateCard key={template.id} template={template} product={product} queryStr={queryStr} />
            ))}
          </div>
        </div>
      ))}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-40 animate-in zoom-in duration-700">
          <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-8 border border-zinc-200 dark:border-zinc-800">
            <Palette className="h-10 w-10 text-zinc-300" />
          </div>
          <h3 className="text-3xl font-black tracking-tight mb-3">No matches found</h3>
          <p className="text-zinc-500 max-w-sm mx-auto font-medium">We couldn't find any templates matching your search. Try different keywords or browse our standard collections.</p>
          <Button 
            variant="outline" 
            className="mt-8 rounded-full px-8"
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}
