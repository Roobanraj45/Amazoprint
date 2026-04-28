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
};

export function EditorSidebarLeft({
    activeTool,
    setActiveTool,
    isAdmin,
    onAddImage,
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
}: EditorSidebarLeftProps) {
    const [activePanel, setActivePanel] = React.useState('upload');
    const { setLeftOpen, leftOpen } = useSidebar();

    const panels = [
        { id: 'upload', label: 'Upload', icon: <UploadCloud />, color: 'text-blue-600' },
        { id: 'media', label: 'Elements', icon: <LayoutGrid />, color: 'text-indigo-600' },
        { id: 'pen', label: 'Pen Tool', icon: <PenTool />, color: 'text-orange-600' },
        { id: 'elements', label: 'Text', icon: <Type />, color: 'text-blue-600' },
        { id: 'brush', label: 'Draw', icon: <Paintbrush />, color: 'text-pink-600' },
        { id: 'ai', label: 'AI Magic', icon: <Sparkles />, color: 'text-purple-600' },
        { id: 'qrcode', label: 'QR Code', icon: <QrCode />, color: 'text-emerald-600' },
    ];

    return (
        <Sidebar collapsible="icon" variant="floating" className="hidden lg:block">
            <SidebarContent className="p-0 overflow-y-hidden">
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
                        <TabsList className="flex flex-col h-full w-[80px] py-4 gap-2 bg-white border-r border-zinc-100 shrink-0">
                            {panels.map((panel) => (
                                <Tooltip key={panel.id}>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger
                                            value={panel.id}
                                            className={cn(
                                                "h-[68px] w-full p-0 flex flex-col gap-1 items-center justify-center transition-all duration-200 relative group bg-transparent",
                                                "text-zinc-500 data-[state=active]:text-black hover:text-black"
                                            )}
                                            onClick={() => {
                                                if (panel.id === 'pen') {
                                                    // Don't toggle for pen tool
                                                    return;
                                                }

                                                if (activePanel === panel.id) {
                                                    setLeftOpen(!leftOpen);
                                                } else {
                                                    setLeftOpen(true);
                                                }
                                            }}
                                        >
                                            {/* Selection Highlight Detailing */}
                                            <div className="absolute left-0 top-2 bottom-2 w-[4px] rounded-r-md bg-primary opacity-0 scale-y-50 transition-all duration-300 group-data-[state=active]:opacity-100 group-data-[state=active]:scale-y-100" />
                                            
                                            <div className={cn(
                                                "p-1.5 rounded-lg transition-all duration-200",
                                                "group-data-[state=active]:scale-110",
                                                panel.color,
                                                "opacity-70 group-data-[state=active]:opacity-100 group-hover:opacity-100"
                                            )}>
                                                {React.cloneElement(panel.icon as React.ReactElement, { size: 24, strokeWidth: 2.5 })}
                                            </div>
                                            
                                            <span className="text-[10px] font-bold uppercase text-center tracking-wider leading-none px-1 transition-colors">
                                                {panel.label.split(' ')[0]}
                                            </span>
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-bold text-[10px] uppercase tracking-widest bg-black text-white border-0 py-2 px-4 rounded-md shadow-2xl">
                                        <p>{panel.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </TabsList>

                        <div className={cn(
                            "group-data-[collapsible=icon]:hidden flex-1 min-h-0 flex flex-col bg-background/50 border-l",
                            activeTool === 'pen' && "hidden"
                        )}>
                            <Suspense fallback={<div className="flex-1 flex items-center justify-center pt-20"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>}>
                                <TabsContent value="upload" className="flex-1 m-0 focus-visible:outline-none overflow-hidden h-full">
                                    <UploadPanel onImageSelect={onAddImage} isAdmin={isAdmin} />
                                </TabsContent>
                                <TabsContent value="media" className="flex-1 m-0 focus-visible:outline-none overflow-hidden h-full">
                                    <MediaPanel
                                        onImageSelect={onAddImage}
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
                                    <BrushToolPanel options={brushOptions} setOptions={setBrushOptions} onClear={onClearBrush} />
                                </TabsContent>
                                <TabsContent value="ai" className="flex-1 m-0 focus-visible:outline-none overflow-auto h-full">
                                    <AiPanel onImageProcessed={onAddImage} />
                                </TabsContent>
                                <TabsContent value="qrcode" className="flex-1 m-0 focus-visible:outline-none overflow-auto h-full">
                                    <QrCodePanel onAddQrCode={onAddQrCode} />
                                </TabsContent>
                            </Suspense>
                        </div>
                    </Tabs>
                </TooltipProvider>
            </SidebarContent>
        </Sidebar>
    );
}
