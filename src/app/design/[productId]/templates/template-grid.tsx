'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { Product, DesignElement, Background, Guide } from '@/lib/types';

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

export function TemplateGrid({ templates, product, searchParams }: { templates: any[], product: any, searchParams?: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTemplates = templates.filter((template) => {
    return template.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const groupedTemplates = filteredTemplates.reduce((acc: Record<string, any[]>, template: any) => {
    const subProductName = template.subProduct?.name || 'Standard Templates';
    if (!acc[subProductName]) {
      acc[subProductName] = [];
    }
    acc[subProductName].push(template);
    return acc;
  }, {});

  // Sort groups: if a group matches current subProductId, bring it to front
  const sortedGroupNames = Object.keys(groupedTemplates).sort((a, b) => {
    // We don't easily have the current subProductName here without a lookup, 
    // but we can at least keep 'Standard Templates' at the bottom if there are others.
    if (a === 'Standard Templates') return 1;
    if (b === 'Standard Templates') return -1;
    return a.localeCompare(b);
  });

  const queryStr = searchParams ? new URLSearchParams(searchParams as any).toString() : '';

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:max-w-md">
          <Label htmlFor="search-templates" className="sr-only">Search templates</Label>
          <Input
            id="search-templates"
            placeholder="Search all templates..."
            className="h-12 px-5 rounded-2xl border-border/40 bg-card/50 backdrop-blur-sm focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {sortedGroupNames.map((groupName) => (
        <div key={groupName} className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              {groupName}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/40">
              {groupedTemplates[groupName].length} Designs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {groupedTemplates[groupName].map((template) => (
              <Link
                key={template.id}
                href={`/design/${product.slug}?templateId=${template.id}${queryStr ? `&${queryStr}` : ''}`}
                className="h-full block group"
                aria-label={`Use ${template.name} template`}
              >
                <Card className="h-full overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-2 group">
                  <CardHeader className="p-0 relative aspect-video bg-muted/30 overflow-hidden border-b border-border/40">
                    {(() => {
                        // Designs are always saved in mm in the database
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
                        
                        // Responsive fit calculation
                        const baseSize = 1000;
                        const scale = Math.min(baseSize / widthInPx, (baseSize * 0.5625) / heightInPx) * 0.95;

                        return (
                          <div className="absolute inset-0 flex items-center justify-center p-4 bg-zinc-950/40 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center">
                              <div style={{ 
                                width: widthInPx * scale, 
                                height: heightInPx * scale, 
                                position: 'relative', 
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                transform: `scale(${1 / (baseSize / 350)})`
                              }} className="scale-[0.35] transition-transform duration-700 group-hover:scale-[0.37]">
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
                                    bleed={18}
                                    safetyMargin={18}
                                    viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                                    isPreview={true}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                    })()}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                        <div className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            Use Template
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight truncate">
                      {template.name}
                    </h3>
                    <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                            Ready to edit
                        </div>
                        <ArrowRight size={16} className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {filteredTemplates.length === 0 && (
        <div className="col-span-full text-center py-32 border-2 border-dashed border-border/40 rounded-[3rem] bg-muted/10">
          <Palette className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No templates found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Try searching for something else or browse another product.</p>
        </div>
      )}
    </div>
  );
}
