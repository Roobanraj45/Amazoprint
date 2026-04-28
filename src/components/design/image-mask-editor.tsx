'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import type { DesignElement, Product } from '@/lib/types';
import { NonInteractiveContent } from './canvas-element';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    const maxDimension = 300; // Reduced for smaller popup
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

    // Clamping logic to prevent image from "flying away"
    const clampOffset = useCallback((x: number, y: number, scale: number) => {
        const w = element.width;
        const h = element.height;
        const scaledW = w * scale;
        const scaledH = h * scale;

        const maxX = Math.max(scaledW, w);
        const maxY = Math.max(scaledH, h);

        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y))
        };
    }, [element]);

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

            const next = clampOffset(
                dragStart.current.ox + dx,
                dragStart.current.oy + dy,
                scaleRef.current
            );

            offsetRef.current = next;
            updateRender();
        };

        const up = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            
            onUpdate(element.id, {
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
    }, [clampOffset, previewScale, element.id, onUpdate]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const cx = (e.clientX - rect.left - rect.width / 2) / previewScale;
        const cy = (e.clientY - rect.top - rect.height / 2) / previewScale;

        const prevScale = scaleRef.current;
        const nextScale = Math.max(0.1, Math.min(10, prevScale * (e.deltaY > 0 ? 0.95 : 1.05)));
        const scaleRatio = nextScale / prevScale;

        const nextOffset = clampOffset(
            offsetRef.current.x - cx * (scaleRatio - 1),
            offsetRef.current.y - cy * (scaleRatio - 1),
            nextScale
        );

        scaleRef.current = nextScale;
        offsetRef.current = nextOffset;
        updateRender();
    }, [previewScale, clampOffset]);

    const previewElement = useMemo(() => ({
        ...element,
        fillImageOffsetX: offsetRef.current.x,
        fillImageOffsetY: offsetRef.current.y,
        fillImageScale: scaleRef.current,
        borderWidth: Math.max(element.borderWidth || 0, 2 / previewScale),
        borderColor: '#3b82f6',
        borderStyle: 'solid' as const,
        visible: true,
        opacity: 1
    }), [element, renderTick, previewScale]);

    if (!element) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md sm:max-w-lg w-full max-h-[90vh] border-none bg-zinc-950 text-white p-0 overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/5 flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                            <Move className="w-4 h-4 text-blue-400" />
                            Adjust Image Mask
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4 p-4 bg-zinc-900/50">
                        {/* Preview Area - Slightly smaller */}
                        <div 
                            ref={containerRef}
                            className="w-full h-[300px] bg-[#0a0a0a] rounded-xl overflow-hidden relative flex items-center justify-center cursor-move shadow-inner group active:cursor-grabbing border border-white/5"
                            onMouseDown={handleMouseDown}
                            onWheel={handleWheel}
                        >
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: 'conic-gradient(#fff 0.25turn, #000 0.25turn 0.5turn, #fff 0.5turn 0.75turn, #000 0.75turn)',
                                backgroundSize: '24px 24px'
                            }} />

                            <div style={{
                                width: element.width,
                                height: element.height,
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'center',
                                pointerEvents: 'none',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
                                    <img 
                                        src={element.fillImageSrc} 
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

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-full text-[9px] font-bold uppercase tracking-widest text-white/60 border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                Pan & Zoom
                            </div>
                        </div>

                        {/* Controls Panel - Compact */}
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-white/40">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        <Label className="text-[9px] font-bold uppercase tracking-widest">Zoom</Label>
                                    </div>
                                    <span className="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold min-w-[50px] text-center">
                                        {Math.round(scaleRef.current * 100)}%
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="ghost" size="icon"
                                        onClick={() => {
                                            scaleRef.current = Math.max(0.1, scaleRef.current - 0.1);
                                            updateRender();
                                        }}
                                        className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60"
                                    >
                                        <ZoomOut className="w-3.5 h-3.5" />
                                    </Button>
                                    <Slider 
                                        value={[scaleRef.current]} 
                                        min={0.1} 
                                        max={10} 
                                        step={0.01} 
                                        onValueChange={(v) => {
                                            scaleRef.current = v[0];
                                            updateRender();
                                        }}
                                        onValueCommit={(v) => onUpdate(element.id, { fillImageScale: v[0] })}
                                        className="cursor-pointer flex-1"
                                    />
                                    <Button 
                                        variant="ghost" size="icon"
                                        onClick={() => {
                                            scaleRef.current = Math.min(10, scaleRef.current + 0.1);
                                            updateRender();
                                        }}
                                        className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-1 flex justify-between items-center gap-3">
                                <Button 
                                    variant="ghost"
                                    onClick={() => {
                                        offsetRef.current = { x: 0, y: 0 };
                                        scaleRef.current = 1;
                                        updateRender();
                                        onUpdate(element.id, { fillImageOffsetX: 0, fillImageOffsetY: 0, fillImageScale: 1 });
                                    }}
                                    className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-blue-400 hover:bg-blue-400/5 gap-1.5"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset
                                </Button>
                                <Button 
                                    onClick={onClose}
                                    className="px-6 h-8 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}