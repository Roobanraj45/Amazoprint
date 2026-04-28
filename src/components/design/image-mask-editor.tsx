'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import type { DesignElement, Product } from '@/lib/types';
import { NonInteractiveContent } from './canvas-element';
import { Label } from '@/components/ui/label';

type ImageMaskEditorProps = {
    isOpen: boolean;
    onClose: () => void;
    element: DesignElement;
    product?: Product;
    onUpdate: (id: string, updates: Partial<DesignElement>) => void;
};

export function ImageMaskEditor({ isOpen, onClose, element, product, onUpdate }: ImageMaskEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

    const maxDimension = 400;
    const elementMax = Math.max(element?.width || 1, element?.height || 1);
    const scale = elementMax > 0 ? Math.min(1, maxDimension / elementMax) : 1;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            offsetX: element.fillImageOffsetX || 0,
            offsetY: element.fillImageOffsetY || 0,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = (e.clientX - dragStartRef.current.x) / scale;
            const dy = (e.clientY - dragStartRef.current.y) / scale;
            
            onUpdate(element.id, {
                fillImageOffsetX: dragStartRef.current.offsetX + dx,
                fillImageOffsetY: dragStartRef.current.offsetY + dy
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scale, element.id, onUpdate]);

    if (!element) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Adjust Image Mask</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 pt-2">
                    {/* Preview Area */}
                    <div 
                        ref={containerRef}
                        className="w-full h-[400px] bg-muted/20 border border-border/50 rounded-2xl overflow-hidden relative flex items-center justify-center cursor-move shadow-inner"
                        onMouseDown={handleMouseDown}
                        style={{
                            backgroundImage: 'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}
                    >
                        <div style={{
                            width: element.width,
                            height: element.height,
                            transform: `scale(${scale})`,
                            transformOrigin: 'center',
                            pointerEvents: 'none' // Let the container handle mouse events
                        }}>
                            <NonInteractiveContent element={element} product={product!} />
                        </div>

                        {/* Instruction overlay */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-background/80 backdrop-blur-md rounded-full text-xs font-semibold text-muted-foreground border border-border/50 pointer-events-none shadow-sm">
                            Click & drag to reposition
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 px-2 pb-2">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Zoom Level</Label>
                                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md min-w-[48px] text-center font-bold">
                                    {Math.round((element.fillImageScale || 1) * 100)}%
                                </span>
                            </div>
                            <Slider 
                                value={[element.fillImageScale || 1]} 
                                min={0.1} 
                                max={5} 
                                step={0.01} 
                                onValueChange={(v) => onUpdate(element.id, { fillImageScale: v[0] })} 
                                className="cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
