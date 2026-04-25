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
    const fontUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap`;

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

              const pageSpotUvElements = page.elements.filter(el => el.spotUv === true);
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
    const isSpotUv = activeLayer?.renderMode === 'spotuv';

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
          background: ${isSpotUv ? 'none' : 'white'} !important;
          background-color: ${isSpotUv ? 'transparent' : 'white'} !important;
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
          background: ${isSpotUv ? 'none' : 'white'} !important;
          background-color: ${isSpotUv ? 'transparent' : 'white'} !important;
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
    const isSpotUv = activeLayer?.renderMode === 'spotuv';

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 3, 
        backgroundColor: isSpotUv && format === 'png' ? null : '#ffffff',
        width: width,
        height: height,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('printable-area');
          if (el) {
            el.style.transform = 'none';
            if (isSpotUv) el.style.background = 'transparent';
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
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      <nav className="no-print h-16 border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.close()} className="text-zinc-400">
            <ArrowLeft className="mr-2 h-4 w-4" /> Close
          </Button>
          <div className="h-6 w-[1px] bg-zinc-800" />
          <span className="text-sm font-medium">{data.product.name}</span>
        </div>

        {isAdmin && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isExporting} className="bg-blue-600 hover:bg-blue-500">
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export File
                <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
                <Printer className="mr-2 h-4 w-4" /> PDF (Print)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadImage('png')} className="cursor-pointer">
                <FileImage className="mr-2 h-4 w-4" /> PNG Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadImage('jpeg')} className="cursor-pointer">
                <FileImage className="mr-2 h-4 w-4" /> JPG Image
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 border-r border-zinc-800 bg-zinc-900 no-print hidden md:block">
          <ScrollArea className="h-full p-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-4 tracking-tighter">Separations</p>
            <div className="space-y-4">
              {layers.map((layer) => {
                const scale = 140 / printWidth;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setActiveTab(layer.id)}
                    className={cn(
                      "w-full p-2 rounded-lg transition-all border",
                      activeTab === layer.id ? "border-blue-500 bg-blue-500/10" : "border-transparent hover:bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                        "overflow-hidden mb-2 mx-auto relative",
                        layer.renderMode === 'spotuv' ? "bg-transparent" : "bg-white"
                    )} style={{ width: 140, height: printHeight * scale }}>
                      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: printWidth, height: printHeight, position: 'absolute' }}>
                        <DesignCanvas 
                          product={data.product} elements={layer.elements} background={layer.background} 
                          bleed={data.bleed} safetyMargin={data.safetyMargin} renderMode={layer.renderMode} 
                          viewState={{ zoom: 1, pan: { x: 0, y: 0 } }} guides={[]}
                          highlightSpotUv={layer.isComposite}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-300 block truncate text-center">{layer.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#121212]">
          <div
            id="printable-area"
            ref={mainPreviewRef}
            className={cn(
                "shadow-2xl relative transition-all duration-200",
                activeLayerData.renderMode === 'spotuv' ? "bg-transparent" : "bg-white"
            )}
            style={{
              width: printWidth,
              height: printHeight,
              transform: `scale(min(0.85, calc(80vh / ${printHeight}px), calc(65vw / ${printWidth}px)))`,
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
            />
          </div>
        </main>
      </div>

      <footer className="no-print h-8 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-4 text-[10px] text-zinc-500 uppercase">
        <span>{printWidth} × {printHeight} px</span>
        <span className="opacity-30">|</span>
        <span>Bleed: {data.bleed}px</span>
      </footer>
    </div>
  );
}
