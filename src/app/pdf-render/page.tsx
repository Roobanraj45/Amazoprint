'use client';

import { useEffect, useState, useRef } from 'react';
import type { RenderData } from '@/lib/types';
import { Loader2, Printer, Download, ChevronDown, FileImage, ArrowLeft } from 'lucide-react';
import { DesignCanvas } from '@/components/design/design-canvas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getUserRole } from '@/app/actions/user-actions';

export default function PdfRenderPage() {
  const [data, setData] = useState<RenderData | null>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const mainPreviewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // --- FONT LOADING LOGIC ---
    const fonts = [
        'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Poppins', 'Nunito',
        'Playfair Display', 'Merriweather', 'Ubuntu', 'PT Sans', 'Lora', 'Source Sans Pro',
        'Pacifico', 'Dancing Script', 'Lobster', 'Bebas Neue', 'Caveat',
        'Bevan', 'Bree Serif', 'Coda', 'Fugaz One', 'Jura'
    ];
    const fontUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, '+')}:wght@400;700;900`).join('&')}&display=swap`;

    const link = document.createElement('link');
    link.id = 'google-fonts-dynamic-render';
    link.href = fontUrl;
    link.rel = 'stylesheet';
    
    document.head.appendChild(link);
    // --- END FONT LOADING ---

    async function fetchData() {
        const savedData = localStorage.getItem('pdf_render_data');
        if (savedData) {
          try {
            const parsedData: RenderData = JSON.parse(savedData);
            setData(parsedData);

            const allLayers: any[] = [];
            parsedData.pages.forEach((page, pageIndex) => {
              const pageLabel = parsedData.pages.length > 1 ? `Page ${pageIndex + 1} - ` : '';

              allLayers.push({
                id: `page-${pageIndex}-final`,
                label: `${pageLabel}Altogether (Composite)`,
                elements: page.elements,
                background: page.background,
                renderMode: 'default',
                isComposite: true,
              });
              
              allLayers.push({
                id: `page-${pageIndex}-cmyk`,
                label: `${pageLabel}Full Design (CMYK)`,
                elements: page.elements,
                background: page.background,
                renderMode: 'cmyk',
                isComposite: false,
              });

              // Spot UV Mask (Excluding Foil)
              const pageSpotUvElements = page.elements.filter(el => el.spotUv === true && el.foilId === undefined);
              if (pageSpotUvElements.length > 0) {
                allLayers.push({
                  id: `page-${pageIndex}-spot-mask`,
                  label: `${pageLabel}Spot UV Mask`,
                  elements: pageSpotUvElements,
                  background: { type: 'solid', color: 'transparent' },
                  renderMode: 'spotuv',
                  isComposite: false,
                });
              }

              // Foil Mask
              const pageFoilElements = page.elements.filter(el => el.spotUv === true && el.foilId !== undefined);
              if (pageFoilElements.length > 0) {
                allLayers.push({
                  id: `page-${pageIndex}-foil-mask`,
                  label: `${pageLabel}Foil Mask`,
                  elements: pageFoilElements,
                  background: { type: 'solid', color: 'transparent' },
                  renderMode: 'foil',
                  isComposite: false,
                });
              }
            });
            
            setLayers(allLayers);
            if (allLayers.length > 0) setActiveTab(allLayers[0].id);
          } catch (e) {
            console.error(e);
          }
        }
        try {
            const role = await getUserRole();
            setUserRole(role || 'guest');
        } catch (e) {
            setUserRole('guest');
        }
    }
    fetchData();

    return () => {
      const existingLink = document.getElementById('google-fonts-dynamic-render');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  const handlePrint = () => {
    if (!data) return;

    const printWidth = data.product.width + (data.bleed * 2);
    const printHeight = data.product.height + (data.bleed * 2);
    const activeLayer = layers.find(l => l.id === activeTab);
    const isMask = activeLayer?.renderMode === 'spotuv' || activeLayer?.renderMode === 'foil';

    const styleEl = document.createElement('style');
    styleEl.id = 'print-fix';
    styleEl.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #printable-area, #printable-area * { visibility: visible !important; }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: ${printWidth}px !important;
          height: ${printHeight}px !important;
          background: ${isMask ? 'none' : 'white'} !important;
          background-color: ${isMask ? 'transparent' : 'white'} !important;
        }

        #printable-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${printWidth}px !important;
          height: ${printHeight}px !important;
          transform: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          display: block !important;
          /* FORCE NO BACKGROUND */
          background: ${isMask ? 'none' : 'white'} !important;
          background-color: ${isMask ? 'transparent' : 'white'} !important;
        }

        @page {
          size: ${printWidth}px ${printHeight}px;
          margin: 0 !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    setTimeout(() => {
      window.print();
      document.getElementById('print-fix')?.remove();
    }, 500);
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg') => {
    const element = mainPreviewRef.current;
    if (!element || !data || isExporting) return;

    setIsExporting(true);
    const width = data.product.width + (data.bleed * 2);
    const height = data.product.height + (data.bleed * 2);
    const activeLayer = layers.find(l => l.id === activeTab);
    const isMask = activeLayer?.renderMode === 'spotuv' || activeLayer?.renderMode === 'foil';

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 3, 
        backgroundColor: isMask && format === 'png' ? null : '#ffffff',
        width: width,
        height: height,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('printable-area');
          if (el) {
            el.style.transform = 'none';
            if (isMask) el.style.background = 'transparent';
          }
        }
      });
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL(`image/${format}`, 1.0);
      link.download = `${data.product.name.replace(/\s+/g, '_')}-${activeTab}.${format}`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const isAdmin = userRole && ['admin', 'super_admin', 'company_admin', 'designer'].includes(userRole);
  const activeLayerData = layers.find(l => l.id === activeTab);
  if (!data || !activeLayerData) return null;

  const printWidth = data.product.width + (data.bleed * 2);
  const printHeight = data.product.height + (data.bleed * 2);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <nav className="no-print h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.close()} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
          </Button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <span className="text-sm font-semibold text-slate-700">{data.product.name}</span>
        </div>

        {isAdmin && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isExporting} className="bg-blue-600 hover:bg-blue-700 h-9 px-4 text-sm font-medium">
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export Results
                <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-900">
                <DropdownMenuItem onClick={handlePrint} className="cursor-pointer focus:bg-slate-100">
                <Printer className="mr-2 h-4 w-4" /> Download PDF (Print)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadImage('png')} className="cursor-pointer focus:bg-slate-100">
                <FileImage className="mr-2 h-4 w-4" /> Download PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadImage('jpeg')} className="cursor-pointer focus:bg-slate-100">
                <FileImage className="mr-2 h-4 w-4" /> Download JPG
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-52 border-r border-slate-200 bg-white no-print hidden md:block overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Design Separations</p>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-3">
              {layers.map((layer) => {
                const scale = 160 / printWidth;
                const isMask = layer.renderMode === 'spotuv' || layer.renderMode === 'foil';
                return (
                  <button
                    key={layer.id}
                    onClick={() => setActiveTab(layer.id)}
                    className={cn(
                      "w-full p-2.5 rounded-lg transition-all border text-left",
                      activeTab === layer.id 
                        ? "border-blue-200 bg-blue-50/80 shadow-sm" 
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                        "overflow-hidden mb-2 mx-auto relative rounded shadow-sm border border-slate-200",
                        isMask ? "bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:8px_8px]" : "bg-white"
                    )} style={{ width: 160, height: printHeight * scale }}>
                      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: printWidth, height: printHeight, position: 'absolute' }}>
                        <DesignCanvas 
                          product={data.product} elements={layer.elements} background={layer.background} 
                          bleed={data.bleed} safetyMargin={data.safetyMargin} renderMode={layer.renderMode} 
                          viewState={{ zoom: 1, pan: { x: 0, y: 0 } }} guides={[]}
                          highlightSpotUv={layer.isComposite}
                          showRulers={false}
                          showGrid={false}
                          showPrintGuidelines={false}
                        />
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10.5px] font-medium block truncate",
                      activeTab === layer.id ? "text-blue-700" : "text-slate-600"
                    )}>{layer.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 overflow-auto flex items-center justify-center p-12 bg-slate-100">
          <div className="relative">
            <div
                id="printable-area"
                ref={mainPreviewRef}
                className={cn(
                    "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] relative transition-all duration-200 rounded-[2px]",
                    (activeLayerData.renderMode === 'spotuv' || activeLayerData.renderMode === 'foil') 
                      ? "bg-white bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" 
                      : "bg-white"
                )}
                style={{
                width: printWidth,
                height: printHeight,
                transform: `scale(min(0.85, calc(75vh / ${printHeight}px), calc(60vw / ${printWidth}px)))`,
                transformOrigin: 'center center',
                } as React.CSSProperties}
            >
                <DesignCanvas
                product={data.product}
                elements={activeLayerData.elements}
                background={activeLayerData.background}
                showPrintGuidelines={true}
                bleed={data.bleed}
                safetyMargin={data.safetyMargin}
                renderMode={activeLayerData.renderMode}
                viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                guides={(data as any).guides || []}
                highlightSpotUv={activeLayerData.isComposite}
                showRulers={false}
                showGrid={false}
                />
            </div>
            
            {/* Legend/Info Float */}
            <div className="absolute -bottom-16 left-0 right-0 no-print flex justify-center">
                <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200 shadow-sm text-[11px] font-medium text-slate-500 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Bleed Line
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Safety Margin
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <span>{printWidth} × {printHeight} PX</span>
                </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="no-print h-6 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[9px] text-slate-400 font-medium uppercase tracking-widest">
        <span>Design Engine Render System v2.0</span>
        <div className="flex items-center gap-4">
          <span>Bleed: {data.bleed}px</span>
          <span>Safety: {data.safetyMargin}px</span>
        </div>
      </footer>
    </div>
  );
}
