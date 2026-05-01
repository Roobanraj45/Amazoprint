'use client';

import React, { Suspense, lazy } from 'react';
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Type,
  LayoutGrid,
  Paintbrush,
  QrCode,
  UploadCloud,
  Sparkles,
  PenTool,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

// Lazy load panels
const MediaPanel = lazy(() => import('./panels/media-panel').then(m => ({ default: m.MediaPanel })));
const QrCodePanel = lazy(() => import('./panels/qrcode-panel').then(m => ({ default: m.QrCodePanel })));
const PenToolPanel = lazy(() => import('./pen-tool-panel').then(m => ({ default: m.PenToolPanel })));
const UploadPanel = lazy(() => import('./panels/upload-panel').then(m => ({ default: m.UploadPanel })));
const AiPanel = lazy(() => import('./panels/ai-panel').then(m => ({ default: m.AiPanel })));
const TextAddPanel = lazy(() => import('./panels/text-add-panel').then(m => ({ default: m.TextAddPanel })));
const BrushToolPanel = lazy(() => import('./brush-tool-panel').then(m => ({ default: m.BrushToolPanel })));

type EditorSidebarLeftProps = {
    activeTool: 'select' | 'pen' | 'brush';
    setActiveTool: (tool: 'select' | 'pen' | 'brush') => void;
    isAdmin?: boolean;
    onAddImage: (src: string) => void;
    onAddImageNoMask: (src: string) => void;
    onAddSvgShape: (src: string) => void;
    onAddShape: (shapeType: string) => void;
    onAddEmoji: (emoji: string) => void;
    onAddText: (options: any) => void;
    onAddGroupedElements: (elements: any[]) => void;
    onAddQrCode: (value: string, style: string) => void;
    brushOptions: any;
    setBrushOptions: any;
    onClearBrush: () => void;
    finalizePath: () => void;
    onOpenColorPicker: (label: string, color: string, onChange: (color: string) => void) => void;
    product?: any;
    canvasWidth?: number;
    canvasHeight?: number;
    onAddAIElements?: (elements: any[]) => void;
    currentElements?: any[];
};

export function EditorSidebarLeft({
    activeTool,
    setActiveTool,
    isAdmin,
    onAddImage,
    onAddImageNoMask,
    onAddSvgShape,
    onAddShape,
    onAddEmoji,
    onAddText,
    onAddGroupedElements,
    onAddQrCode,
    brushOptions,
    setBrushOptions,
    onClearBrush,
    finalizePath,
    onOpenColorPicker,
    product,
    canvasWidth,
    canvasHeight,
    onAddAIElements,
    currentElements,
}: EditorSidebarLeftProps) {
    const [activePanel, setActivePanel] = React.useState('upload');
    const [highlightedTab, setHighlightedTab] = React.useState<string | null>(null);
    const { setLeftOpen, leftOpen } = useSidebar();

    React.useEffect(() => {
        const handleHighlight = (e: any) => {
            const tabId = e.detail;
            setHighlightedTab(tabId);
            // Remove highlight after 5 seconds
            setTimeout(() => setHighlightedTab(null), 5000);
        };
        window.addEventListener('amazoprint_highlight_tab', handleHighlight);
        return () => window.removeEventListener('amazoprint_highlight_tab', handleHighlight);
    }, []);

    const panels = [
        { id: 'upload', label: 'Upload', icon: <UploadCloud />, color: 'text-blue-600' },
        { id: 'elements', label: 'Text', icon: <Type />, color: 'text-blue-600' },
        { id: 'pen', label: 'Pen Tool', icon: <PenTool />, color: 'text-orange-600' },
        { id: 'ai', label: 'AI Magic', icon: <Sparkles />, color: 'text-purple-600' },
        { id: 'media', label: 'Elements', icon: <LayoutGrid />, color: 'text-indigo-600' },
        { id: 'brush', label: 'Draw', icon: <Paintbrush />, color: 'text-pink-600' },
        { id: 'qrcode', label: 'QR Code', icon: <QrCode />, color: 'text-emerald-600' },
    ];

    return (
        <div className={cn(
            "absolute left-4 top-4 bottom-4 z-[40] hidden lg:flex transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
            leftOpen ? "w-[400px]" : "w-[80px]"
        )}>
            <div className="h-full w-full bg-white border border-border/60 rounded-[1.25rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden flex">
                <TooltipProvider>
                    <Tabs
                        value={activePanel}
                        orientation="vertical"
                        className="w-full h-full flex"
                        onValueChange={(val) => {
                            setActivePanel(val);
                            if (val === 'pen' || val === 'brush') {
                                setActiveTool(val as any);
                            } else {
                                setActiveTool('select');
                            }
                        }}
                    >
                        {/* Vertical Icon Bar */}
                        <TabsList className="flex flex-col h-full w-[80px] py-4 gap-2 bg-slate-50/50 border-r border-border/40 shrink-0">
                            {panels.map((panel) => (
                                <Tooltip key={panel.id} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger
                                            value={panel.id}
                                            className={cn(
                                                "h-[58px] w-full p-0 flex flex-col gap-1 items-center justify-center transition-all duration-300 relative group bg-transparent",
                                                "text-muted-foreground/80 data-[state=active]:text-primary hover:text-foreground"
                                            )}
                                            onPointerDown={(e) => {
                                                if (panel.id === 'pen') {
                                                    setLeftOpen(false);
                                                    return;
                                                }
                                                
                                                // If we're clicking the ALREADY active panel, toggle the sidebar
                                                if (activePanel === panel.id) {
                                                    setLeftOpen(!leftOpen);
                                                } else {
                                                    // If we're switching to a NEW panel, always ensure sidebar is open
                                                    setLeftOpen(true);
                                                }
                                                
                                                if (highlightedTab === panel.id) setHighlightedTab(null);
                                            }}
                                        >
                                            {/* Selection Highlight */}
                                            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary opacity-0 scale-y-50 transition-all duration-300 group-data-[state=active]:opacity-100 group-data-[state=active]:scale-y-100" />
                                            
                                            <div className={cn(
                                                "p-2.5 rounded-2xl transition-all duration-300 shadow-none",
                                                "group-data-[state=active]:shadow-[0_8px_20px_-4px_rgba(59,130,246,0.35)]",
                                                "group-data-[state=active]:scale-110 group-data-[state=active]:bg-primary group-data-[state=active]:text-white",
                                                panel.color,
                                                "opacity-80 group-data-[state=active]:opacity-100 group-hover:opacity-100 relative",
                                                highlightedTab === panel.id && "animate-bounce"
                                            )}>
                                                {/* Pulsing circle highlight */}
                                                {highlightedTab === panel.id && (
                                                    <div className="absolute inset-[-4px] rounded-2xl border-2 border-primary animate-ping opacity-75" />
                                                )}
                                                {highlightedTab === panel.id && (
                                                    <div className="absolute inset-[-8px] rounded-2xl border border-primary/50 animate-pulse" />
                                                )}

                                                {React.cloneElement(panel.icon as React.ReactElement, { size: 22, strokeWidth: 2.2 })}
                                            </div>
                                            
                                            <span className="text-[10px] font-bold tracking-tight text-center leading-none px-1 transition-colors">
                                                {panel.label.split(' ')[0]}
                                            </span>
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-bold text-[10px] bg-foreground text-background border-0 py-2.5 px-4 rounded-xl shadow-2xl">
                                        <p>{panel.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </TabsList>

                        {/* Content Panel */}
                        <div className={cn(
                            "flex-1 min-h-0 flex flex-col bg-white transition-all duration-300",
                            !leftOpen && "opacity-0 pointer-events-none hidden",
                            activeTool === 'pen' && "hidden"
                        )}>
                            <div className="flex-1 overflow-hidden relative">
                                <Suspense fallback={<div className="flex-1 flex items-center justify-center pt-20"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>}>
                                    <TabsContent value="upload" className="flex-1 m-0 focus-visible:outline-none overflow-hidden h-full">
                                        <UploadPanel onImageSelect={onAddImageNoMask} isAdmin={isAdmin} />
                                    </TabsContent>
                                    <TabsContent value="media" className="flex-1 m-0 focus-visible:outline-none overflow-hidden h-full">
                                        <MediaPanel
                                            onImageSelect={onAddImageNoMask}
                                            onAddSvgShape={onAddSvgShape}
                                            onAddShape={onAddShape}
                                            onEmojiSelect={onAddEmoji}
                                            isAdmin={isAdmin}
                                        />
                                    </TabsContent>
                                    <TabsContent value="elements" className="flex-1 m-0 focus-visible:outline-none overflow-auto h-full">
                                        <TextAddPanel onAddText={onAddText} onAddGroupedElements={onAddGroupedElements} />
                                    </TabsContent>
                                    <TabsContent value="brush" className="flex-1 m-0 focus-visible:outline-none overflow-auto h-full">
                                        <BrushToolPanel options={brushOptions} setOptions={setBrushOptions} onClear={onClearBrush} onOpenColorPicker={onOpenColorPicker} />
                                    </TabsContent>
                                    <TabsContent value="ai" className="flex-1 m-0 focus-visible:outline-none overflow-auto h-full">
                                        <AiPanel 
                                            onImageProcessed={onAddImageNoMask} 
                                            product={product}
                                            canvasWidth={canvasWidth}
                                            canvasHeight={canvasHeight}
                                            onAddElements={onAddAIElements}
                                            currentElements={currentElements}
                                        />
                                    </TabsContent>
                                    <TabsContent value="qrcode" className="flex-1 m-0 focus-visible:outline-none overflow-auto h-full">
                                        <QrCodePanel onAddQrCode={onAddQrCode} />
                                    </TabsContent>
                                </Suspense>
                            </div>
                        </div>
                    </Tabs>
                </TooltipProvider>
            </div>
        </div>
    );
}
