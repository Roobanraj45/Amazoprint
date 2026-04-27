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
    const { setLeftOpen } = useSidebar();

    const panels = [
        { id: 'upload', label: 'Upload Design', icon: <UploadCloud size={24} />, color: 'text-lime-600 bg-lime-500/10 data-[state=active]:bg-lime-500 data-[state=active]:text-white' },
        { id: 'media', label: 'Media', icon: <LayoutGrid size={24} />, color: 'text-purple-600 bg-purple-500/10 data-[state=active]:bg-purple-600 data-[state=active]:text-white' },
        { id: 'pen', label: 'Pen', icon: <PenTool size={24} />, color: 'text-indigo-600 bg-indigo-500/10 data-[state=active]:bg-indigo-600 data-[state=active]:text-white' },
        { id: 'elements', label: 'Text', icon: <Type size={24} />, color: 'text-blue-600 bg-blue-500/10 data-[state=active]:bg-blue-600 data-[state=active]:text-white' },
        { id: 'brush', label: 'Draw', icon: <Paintbrush size={24} />, color: 'text-orange-600 bg-orange-500/10 data-[state=active]:bg-orange-600 data-[state=active]:text-white' },
        { id: 'ai', label: 'AI', icon: <Sparkles size={24} />, color: 'text-pink-600 bg-pink-500/10 data-[state=active]:bg-pink-600 data-[state=active]:text-white' },
        { id: 'qrcode', label: 'QR Code', icon: <QrCode size={24} />, color: 'text-emerald-600 bg-emerald-500/10 data-[state=active]:bg-emerald-600 data-[state=active]:text-white' },
    ];

    return (
        <Sidebar collapsible="icon" variant="floating" className="hidden lg:block">
            <SidebarContent className="p-0 overflow-y-hidden">
                <TooltipProvider>
                    <Tabs
                        defaultValue="upload"
                        orientation="vertical"
                        className="w-full h-full flex"
                        onValueChange={(val) => {
                            if (val === 'pen' || val === 'brush') {
                                setActiveTool(val as any);
                            } else {
                                setActiveTool('select');
                            }
                        }}
                    >
                        <TabsList className="flex flex-col h-full p-3 gap-3 bg-transparent shrink-0">
                            {panels.map((panel) => (
                                <Tooltip key={panel.id}>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger
                                            value={panel.id}
                                            className={cn(
                                                "h-16 w-16 p-0 flex flex-col gap-1 items-center justify-center rounded-2xl transition-all duration-200",
                                                "data-[state=active]:scale-110 data-[state=active]:shadow-lg",
                                                panel.color
                                            )}
                                            onClick={() => {
                                                if (panel.id === 'pen') {
                                                    setLeftOpen(false);
                                                } else {
                                                    setLeftOpen(true);
                                                }
                                            }}
                                        >
                                            {React.cloneElement(panel.icon as React.ReactElement, { size: 20 })}
                                            <span className="text-[9px] font-black uppercase text-center tracking-tight leading-tight px-1">
                                                {panel.label.split(' ')[0]}
                                            </span>
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>{panel.label}</p></TooltipContent>
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
