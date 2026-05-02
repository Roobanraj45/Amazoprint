'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { DesignElement, Product } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { X, Check, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, resolveImagePath } from '@/lib/utils';
import { MASK_SHAPES } from '@/lib/mask-shapes';
import { ScrollArea } from '@/components/ui/scroll-area';

type ImageMaskEditorProps = {
    isOpen: boolean;
    onClose: () => void;
    element: DesignElement;
    onUpdate: (id: string, updates: Partial<DesignElement>) => void;
};

export function ImageMaskEditor({ isOpen, onClose, element, onUpdate }: ImageMaskEditorProps) {
    const [selectedShape, setSelectedShape] = useState(element.shapeType || 'circle');
    const [isInverted, setIsInverted] = useState(element.maskInvert || false);
    const [maskScale, setMaskScale] = useState(element.maskScale || 0.2);
    const [maskOffset, setMaskOffset] = useState({ x: element.maskOffsetX || 0, y: element.maskOffsetY || 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0, os: 0 });

    const [imageAspectRatio, setImageAspectRatio] = useState(1);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedShape(element.shapeType || 'circle');
            setIsInverted(element.maskInvert || false);
            setMaskScale(element.maskScale || 1);
            setMaskOffset({ x: element.maskOffsetX || 0, y: element.maskOffsetY || 0 });

            const img = new Image();
            img.src = resolveImagePath(element.fillImageSrc || element.src);
            img.onload = () => {
                setImageAspectRatio(img.width / img.height);
                setIsImageLoaded(true);
            };
        }
    }, [isOpen, element]);

    // SVG Coordinate constants - Respect aspect ratio for "What You See Is What You Get"
    const VIEW_W = 1000;
    const VIEW_H = 1000 / imageAspectRatio;
    const CENTER_X = VIEW_W / 2;
    const CENTER_Y = VIEW_H / 2;

    // Helper to get SVG units from mouse event
    const getSvgUnits = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (VIEW_W / rect.width);
        const y = (e.clientY - rect.top) * (VIEW_H / rect.height);
        return { x, y };
    }, [imageAspectRatio]);

    // Handle Pan and Resize logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                const currentPos = getSvgUnits(e);
                const startPos = dragStart.current;

                // Calculate delta in SVG units
                const dx = currentPos.x - startPos.x;
                const dy = currentPos.y - startPos.y;

                setMaskOffset({
                    x: startPos.ox + dx,
                    y: startPos.oy + dy
                });
            } else if (isResizing.current) {
                const currentPos = getSvgUnits(e);
                const startPos = dragStart.current;

                // Calculate distance from center to current mouse pos
                const centerX = CENTER_X + startPos.ox;
                const centerY = CENTER_Y + startPos.oy;

                const initialDist = Math.sqrt(Math.pow(startPos.x - centerX, 2) + Math.pow(startPos.y - centerY, 2));
                const currentDist = Math.sqrt(Math.pow(currentPos.x - centerX, 2) + Math.pow(currentPos.y - centerY, 2));

                if (initialDist > 0) {
                    const newScale = (currentDist / initialDist) * startPos.os;
                    setMaskScale(Math.max(0.3, Math.min(10, newScale)));
                }
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            isResizing.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [getSvgUnits, imageAspectRatio]);

    const startPan = (e: React.MouseEvent) => {
        const pos = getSvgUnits(e);
        isDragging.current = true;
        dragStart.current = { x: pos.x, y: pos.y, ox: maskOffset.x, oy: maskOffset.y, os: maskScale };
    };

    const startResize = (e: React.MouseEvent) => {
        e.stopPropagation();
        const pos = getSvgUnits(e);
        isResizing.current = true;
        dragStart.current = { x: pos.x, y: pos.y, ox: maskOffset.x, oy: maskOffset.y, os: maskScale };
    };

    const handleApply = () => {
        // Calculate new dimensions to match image aspect ratio while keeping width
        const newHeight = element.width / imageAspectRatio;
        
        onUpdate(element.id, {
            type: 'shape',
            shapeType: selectedShape,
            fillType: 'image',
            fillImageSrc: element.fillImageSrc || element.src,
            maskScale,
            maskOffsetX: maskOffset.x,
            maskOffsetY: maskOffset.y,
            maskInvert: isInverted,
            height: newHeight // Update height to remove empty space
        });
        onClose();
    };

    const currentShapePath = useMemo(() => {
        const shape = MASK_SHAPES.find(s => s.id === selectedShape);
        return shape?.path || MASK_SHAPES[0].path;
    }, [selectedShape]);

    // Calculate transform string - Use scale 10 to match CanvasElement (100x100 path -> 1000x1000 area)
    const shapeTransform = `
        translate(${CENTER_X + maskOffset.x}, ${CENTER_Y + maskOffset.y})
        scale(${maskScale * 10})
        translate(-50, -50)
    `;

    // Calculate handle positions
    // The shape is 100x100, centered at 50,50. 
    // After transform, its corners are at:
    const halfSize = (maskScale * 10 * 100) / 2; // 500 * maskScale
    const hLeft = CENTER_X + maskOffset.x - halfSize;
    const hRight = CENTER_X + maskOffset.x + halfSize;
    const hTop = CENTER_Y + maskOffset.y - halfSize;
    const hBottom = CENTER_Y + maskOffset.y + halfSize;
    const hMidX = CENTER_X + maskOffset.x;
    const hMidY = CENTER_Y + maskOffset.y;

    return (
        <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden bg-white border-none shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b bg-white z-10">
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Advanced Mask Editor</DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex flex-1 min-h-0 bg-slate-50">
                    {/* LEFT PANEL */}
                    <aside className="w-80 border-r bg-white flex flex-col shadow-sm">
                        <ScrollArea className="flex-1">
                            <div className="p-8 space-y-10">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Invert Mask</Label>
                                        <Switch checked={isInverted} onCheckedChange={setIsInverted} className="data-[state=checked]:bg-blue-600" />
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">Toggle between showing the image inside or outside the chosen shape.</p>
                                </section>

                                <section className="space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Mask Shape</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {MASK_SHAPES.map(shape => (
                                            <button
                                                key={shape.id}
                                                onClick={() => setSelectedShape(shape.id)}
                                                className={cn(
                                                    "aspect-square border-2 rounded-2xl p-3 transition-all flex items-center justify-center group",
                                                    selectedShape === shape.id 
                                                        ? "border-blue-500 bg-blue-50/30 shadow-inner" 
                                                        : "border-slate-100 bg-white hover:border-slate-200"
                                                )}
                                                title={shape.label}
                                            >
                                                <svg viewBox="0 0 100 100" className={cn(
                                                    "w-full h-full transition-transform group-hover:scale-110",
                                                )}
                                                style={{ fill: shape.color || '#cbd5e1' }}
                                                >
                                                    <path d={shape.path} />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    </aside>

                    {/* RIGHT PREVIEW - Maximized space */}
                    <main className="flex-1 bg-slate-100 relative flex items-center justify-center overflow-hidden" ref={containerRef}>
                        {!isImageLoaded ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Loading...</span>
                            </div>
                        ) : (
                            <div
                                className="relative shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white rounded-lg overflow-hidden"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    maxHeight: 'calc(90vh - 180px)',
                                    aspectRatio: `${imageAspectRatio}`,
                                }}
                            >
                                <svg
                                    ref={svgRef}
                                    className="w-full h-full touch-none select-none cursor-move"
                                    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                                    onMouseDown={startPan}
                                >
                                    <defs>
                                        <mask id="editor-mask">
                                            <rect width="100%" height="100%" fill={isInverted ? "white" : "black"} />
                                            <path d={currentShapePath} fill={isInverted ? "black" : "white"} transform={shapeTransform} />
                                        </mask>
                                    </defs>

                                    {/* Image Layers - Proportional */}
                                    <image 
                                        href={resolveImagePath(element.fillImageSrc || element.src)} 
                                        width={VIEW_W} height={VIEW_H} 
                                        preserveAspectRatio="xMidYMid slice"
                                        opacity="0.15" 
                                    />
                                    <g mask="url(#editor-mask)">
                                        <image 
                                            href={resolveImagePath(element.fillImageSrc || element.src)} 
                                            width={VIEW_W} height={VIEW_H} 
                                            preserveAspectRatio="xMidYMid slice"
                                        />
                                    </g>

                                    {/* UI Overlay Layer */}
                                    <g className="pointer-events-none">
                                        {/* Main Outline */}
                                        <path d={currentShapePath} fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="12 6" transform={shapeTransform} />
                                    </g>

                                    {/* Interactive Handles */}
                                    <g className="interactive-layer">
                                        {/* Corner Handles */}
                                        {[
                                            { x: hLeft, y: hTop, cursor: 'nwse-resize' },
                                            { x: hRight, y: hTop, cursor: 'nesw-resize' },
                                            { x: hLeft, y: hBottom, cursor: 'nesw-resize' },
                                            { x: hRight, y: hBottom, cursor: 'nwse-resize' },
                                            // Mid Handles
                                            { x: hMidX, y: hTop, cursor: 'ns-resize' },
                                            { x: hMidX, y: hBottom, cursor: 'ns-resize' },
                                            { x: hLeft, y: hMidY, cursor: 'ew-resize' },
                                            { x: hRight, y: hMidY, cursor: 'ew-resize' }
                                        ].map((h, i) => (
                                            <circle
                                                key={i}
                                                cx={h.x}
                                                cy={h.y}
                                                r="14"
                                                fill="white"
                                                stroke="#3b82f6"
                                                strokeWidth="4"
                                                className={cn("cursor-pointer drop-shadow-lg transition-transform hover:scale-125", h.cursor)}
                                                onMouseDown={startResize}
                                                style={{ pointerEvents: 'auto' }}
                                            />
                                        ))}
                                    </g>
                                </svg>
                            </div>
                        )}
                    </main>
                </div>

                <div className="px-8 py-6 border-t bg-slate-50 flex items-center justify-between gap-6 z-10">
                    <div className="flex items-center gap-6 flex-1 max-w-md">
                        <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border shadow-sm flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Size</span>
                            <Slider
                                value={[maskScale]}
                                min={0.3}
                                max={4}
                                step={0.01}
                                onValueChange={(v) => setMaskScale(v[0])}
                                className="flex-1"
                            />
                            <span className="text-[11px] font-mono font-bold bg-slate-50 px-2.5 py-1 rounded-lg text-blue-600 min-w-[45px] text-center border">
                                {Math.round(maskScale * 100)}%
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={onClose} className="px-8 h-12 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all">
                            Cancel
                        </Button>
                        <Button onClick={handleApply} className="px-10 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 transition-all gap-2 active:scale-95">
                            <Check className="w-4 h-4" /> Save Mask
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
