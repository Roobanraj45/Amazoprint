'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import type { DesignElement, Product } from '@/lib/types';
import { NonInteractiveContent } from './canvas-element';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, Move, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ImageMaskEditorProps = {
    isOpen: boolean;
    onClose: () => void;
    element: DesignElement;
    product?: Product;
    onUpdate: (id: string, updates: Partial<DesignElement>) => void;
};



export function ImageMaskEditor({ isOpen, onClose, element, product, onUpdate }: ImageMaskEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Performance optimized state management
    const offsetRef = useRef({
        x: element.fillImageOffsetX || 0,
        y: element.fillImageOffsetY || 0
    });
    const scaleRef = useRef(element.fillImageScale || 1);
    
    const [renderTick, setRenderTick] = useState(0);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

    const maxDimension = 320; 
    const elementMax = Math.max(element?.width || 1, element?.height || 1);
    const previewScale = elementMax > 0 ? Math.min(1, maxDimension / elementMax) : 1;

    // Reset local state when dialog opens or element changes
    useEffect(() => {
        if (isOpen) {
            offsetRef.current = {
                x: element.fillImageOffsetX || 0,
                y: element.fillImageOffsetY || 0
            };
            scaleRef.current = element.fillImageScale || 1;
            setRenderTick(t => t + 1);
        }
    }, [isOpen, element.id, element.fillImageOffsetX, element.fillImageOffsetY, element.fillImageScale]);

    const handleUpdateElement = useCallback((updates: Partial<DesignElement>) => {
        onUpdate(element.id, updates);
    }, [element.id, onUpdate]);

    const updateRender = () => {
        requestAnimationFrame(() => {
            setRenderTick(t => t + 1);
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            ox: offsetRef.current.x,
            oy: offsetRef.current.y
        };
    };

    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!isDragging.current) return;

            const dx = (e.clientX - dragStart.current.x) / previewScale;
            const dy = (e.clientY - dragStart.current.y) / previewScale;

            offsetRef.current = {
                x: dragStart.current.ox + dx,
                y: dragStart.current.oy + dy
            };
            updateRender();
        };

        const up = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            
            handleUpdateElement({
                fillImageOffsetX: offsetRef.current.x,
                fillImageOffsetY: offsetRef.current.y,
                fillImageScale: scaleRef.current
            });
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
    }, [previewScale, handleUpdateElement]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const cx = (e.clientX - rect.left - rect.width / 2) / previewScale;
        const cy = (e.clientY - rect.top - rect.height / 2) / previewScale;

        const prevScale = scaleRef.current;
        const nextScale = Math.max(0.1, Math.min(10, prevScale * (e.deltaY > 0 ? 0.95 : 1.05)));
        const scaleRatio = nextScale / prevScale;

        scaleRef.current = nextScale;
        offsetRef.current = {
            x: offsetRef.current.x - cx * (scaleRatio - 1),
            y: offsetRef.current.y - cy * (scaleRatio - 1)
        };
        
        updateRender();
        handleUpdateElement({
            fillImageOffsetX: offsetRef.current.x,
            fillImageOffsetY: offsetRef.current.y,
            fillImageScale: scaleRef.current
        });
    }, [previewScale, handleUpdateElement]);

    const previewElement = useMemo(() => ({
        ...element,
        fillImageOffsetX: offsetRef.current.x,
        fillImageOffsetY: offsetRef.current.y,
        fillImageScale: scaleRef.current,
        borderWidth: Math.max(element.borderWidth || 0, 1.5 / previewScale),
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderStyle: 'solid' as const,
        visible: true,
        opacity: 1
    }), [element, renderTick, previewScale]);

    if (!element) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg w-[95vw] sm:w-full p-0 overflow-hidden border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] bg-slate-950 rounded-[2rem] max-h-[90vh] flex flex-col">
                <div className="relative flex flex-col flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    {/* Atmospheric Background Layer */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-950 to-indigo-950/30" />
                        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-500/10 to-transparent blur-[120px]" />
                        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
                        
                        {/* Mist/Fog Effect */}
                        <div className="absolute inset-0 opacity-20 mix-blend-screen" style={{
                            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                            filter: 'blur(40px)'
                        }} />
                    </div>

                    {/* Header */}
                    <div className="relative z-10 px-8 pt-8 pb-4">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-xl">
                                            <ImageIcon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        Image Mask Editor
                                    </DialogTitle>
                                    <p className="text-slate-400 text-xs font-medium ml-12">
                                        Choose a shape and adjust the image placement
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Main Content Area */}
                    <div className="relative z-10 flex-1 flex flex-col px-8 pb-8 gap-6">
                        {/* Preview Section */}
                        <div 
                            ref={containerRef}
                            className="relative aspect-square w-full bg-black/40 rounded-[2.5rem] border border-white/5 overflow-hidden flex items-center justify-center cursor-move group transition-all duration-500 hover:border-blue-500/30 active:scale-[0.99] shadow-2xl"
                            onMouseDown={handleMouseDown}
                            onWheel={handleWheel}
                        >
                            {/* Interaction Hint */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 flex items-center gap-2 pointer-events-none">
                                <Move className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Drag to Reposition</span>
                            </div>

                            {/* Center Guides */}
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                            </div>

                            {/* Transparent/Underlay Layer */}
                            <div style={{
                                width: element.width,
                                height: element.height,
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'center',
                                pointerEvents: 'none',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <div className="absolute inset-0 opacity-20 grayscale" style={{ zIndex: -1 }}>
                                    <img 
                                        src={element.fillImageSrc || element.src} 
                                        alt=""
                                        className="w-full h-full object-cover"
                                        style={{
                                            transform: `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px) scale(${scaleRef.current})`,
                                            transformOrigin: 'center'
                                        }}
                                    />
                                </div>

                                <NonInteractiveContent element={previewElement as any} product={product!} />
                            </div>

                            {/* Status Indicators */}
                            <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <div className="px-3 py-1 bg-blue-500 rounded-full text-[9px] font-black text-white uppercase tracking-tighter shadow-lg shadow-blue-500/40">
                                    {Math.round(scaleRef.current * 100)}% Zoom
                                </div>
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-inner mt-auto space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <Label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Magnification</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => { scaleRef.current = Math.max(0.1, scaleRef.current - 0.1); updateRender(); handleUpdateElement({ fillImageScale: scaleRef.current }); }}><ZoomOut className="w-3 h-3" /></Button>
                                        <span className="text-[10px] font-mono font-bold text-white min-w-[40px] text-center">{Math.round(scaleRef.current * 100)}%</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => { scaleRef.current = Math.min(10, scaleRef.current + 0.1); updateRender(); handleUpdateElement({ fillImageScale: scaleRef.current }); }}><ZoomIn className="w-3 h-3" /></Button>
                                    </div>
                                </div>
                                <Slider 
                                    value={[scaleRef.current]} 
                                    min={0.1} 
                                    max={5} 
                                    step={0.01} 
                                    onValueChange={(v) => { scaleRef.current = v[0]; updateRender(); }}
                                    onValueCommit={(v) => handleUpdateElement({ fillImageScale: v[0] })}
                                    className="cursor-pointer"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <Button 
                                    variant="ghost"
                                    onClick={() => {
                                        offsetRef.current = { x: 0, y: 0 };
                                        scaleRef.current = 1;
                                        updateRender();
                                        handleUpdateElement({ fillImageOffsetX: 0, fillImageOffsetY: 0, fillImageScale: 1 });
                                    }}
                                    className="h-10 px-4 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl gap-2 transition-all uppercase tracking-widest"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset View
                                </Button>
                                
                                <Button 
                                    onClick={onClose}
                                    className="px-6 sm:px-10 h-10 bg-white hover:bg-blue-50 text-slate-950 text-[10px] sm:text-[11px] font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest"
                                >
                                    Apply Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}