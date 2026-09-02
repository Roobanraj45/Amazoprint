'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ZoomIn, Maximize2, X, Plus, Minus, RotateCcw, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductImageZoomProps {
    src: string;
    alt: string;
    className?: string;
    imageClassName?: string;
    objectFit?: 'cover' | 'contain';
    zoomScale?: number;
    priority?: boolean;
    sizes?: string;
    badgeOverlay?: React.ReactNode;
}

export function ProductImageZoom({
    src,
    alt,
    className,
    imageClassName,
    objectFit = 'contain',
    zoomScale = 2.8,
    priority = false,
    sizes = "(max-width: 768px) 100vw, 50vw",
    badgeOverlay
}: ProductImageZoomProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [lensStyle, setLensStyle] = useState({ left: 0, top: 0, width: 140, height: 140, visible: false });
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, percentX: 0, percentY: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [modalZoom, setModalZoom] = useState(1);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Dynamic lens dimensions based on zoom scale
        const lensWidth = Math.max(70, Math.min(rect.width * 0.45, rect.width / zoomScale));
        const lensHeight = Math.max(70, Math.min(rect.height * 0.45, rect.height / zoomScale));

        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        // Clamp lens within image container
        const left = Math.max(0, Math.min(rect.width - lensWidth, cursorX - lensWidth / 2));
        const top = Math.max(0, Math.min(rect.height - lensHeight, cursorY - lensHeight / 2));

        const maxLeft = rect.width - lensWidth;
        const maxTop = rect.height - lensHeight;

        const percentX = maxLeft > 0 ? (left / maxLeft) * 100 : 50;
        const percentY = maxTop > 0 ? (top / maxTop) * 100 : 50;

        setLensStyle({
            left,
            top,
            width: lensWidth,
            height: lensHeight,
            visible: true
        });

        setZoomPos({
            x: left,
            y: top,
            percentX,
            percentY
        });
    }, [zoomScale]);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setLensStyle(prev => ({ ...prev, visible: false }));
    };

    return (
        <div className="relative w-full h-full">
            {/* Main Interactive Product Image Container */}
            <div
                ref={containerRef}
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "relative w-full h-full overflow-hidden select-none cursor-crosshair group rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center",
                    className
                )}
            >
                {/* Base Product Image */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        priority={priority}
                        className={cn(
                            objectFit === 'contain' ? "object-contain p-6" : "object-cover",
                            "pointer-events-none transition-transform duration-300",
                            imageClassName
                        )}
                        sizes={sizes}
                    />
                </div>

                {/* Badges / Floating tags */}
                {badgeOverlay && (
                    <div className="pointer-events-none z-20">
                        {badgeOverlay}
                    </div>
                )}

                {/* Flipkart-Style Rectangular Loupe Lens */}
                {isHovered && lensStyle.visible && (
                    <div
                        className="absolute pointer-events-none border-2 border-indigo-500 bg-indigo-500/20 dark:bg-indigo-400/25 backdrop-blur-[1px] shadow-lg z-30 transition-none hidden lg:block rounded-xl ring-2 ring-indigo-500/20"
                        style={{
                            left: `${lensStyle.left}px`,
                            top: `${lensStyle.top}px`,
                            width: `${lensStyle.width}px`,
                            height: `${lensStyle.height}px`,
                        }}
                    >
                        {/* Lens Corner Marks */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-indigo-600 dark:border-indigo-400 rounded-tl" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-indigo-600 dark:border-indigo-400 rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-br" />
                    </div>
                )}

                {/* Mobile/Tablet Fallback: Inner Magnification */}
                <div
                    className="absolute inset-0 pointer-events-none lg:hidden transition-transform duration-100 ease-out z-10"
                    style={{
                        transform: isHovered ? `scale(${zoomScale})` : 'scale(1)',
                        transformOrigin: `${zoomPos.percentX}% ${zoomPos.percentY}%`,
                        opacity: isHovered ? 1 : 0
                    }}
                >
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className={cn(objectFit === 'contain' ? "object-contain p-6" : "object-cover")}
                        sizes={sizes}
                    />
                </div>

                {/* Interactive Tooling Badge & Fullscreen Expand */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-40 transition-all duration-300 pointer-events-auto">
                    <div
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md transition-all duration-300",
                            isHovered
                                ? "bg-slate-900 text-indigo-400 border border-indigo-500/40 ring-2 ring-indigo-500/20"
                                : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 opacity-80 group-hover:opacity-100"
                        )}
                    >
                        <ZoomIn size={12} className={cn("transition-transform duration-300", isHovered ? "scale-125 text-indigo-400 animate-pulse" : "")} />
                        <span>{isHovered ? `${zoomScale}x Zoom` : 'Hover to Zoom'}</span>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(true);
                            setModalZoom(1);
                        }}
                        className="p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200/80 dark:border-slate-800 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110"
                        title="Open Fullscreen Lightbox"
                    >
                        <Maximize2 size={12} />
                    </button>
                </div>
            </div>

            {/* Flipkart-Style Separate Side Zoom Popup Window (Floats to the right of main image) */}
            {isHovered && (
                <div
                    className="absolute top-0 left-[calc(100%+1.5rem)] w-full h-full rounded-3xl overflow-hidden bg-white dark:bg-slate-950 border-2 border-indigo-500/60 shadow-2xl z-50 pointer-events-none hidden lg:block animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundPosition: `${zoomPos.percentX}% ${zoomPos.percentY}%`,
                        backgroundSize: `${zoomScale * 100}%`,
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Header Label inside zoom window */}
                    <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                        <Sparkles size={11} className="animate-spin text-indigo-400" /> High-Definition Inspection ({zoomScale}x)
                    </div>
                </div>
            )}

            {/* High-Resolution Fullscreen Modal */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
                    <DialogTitle className="sr-only">{alt} High-Resolution Preview</DialogTitle>
                    <div className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden p-6 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
                        {/* Control Bar */}
                        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-xl">
                            <span className="text-xs font-black text-slate-300 truncate max-w-xs">{alt}</span>
                        </div>

                        <div className="absolute top-4 right-14 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
                                onClick={() => setModalZoom(z => Math.max(0.5, z - 0.25))}
                                title="Zoom Out"
                            >
                                <Minus size={14} />
                            </Button>
                            <span className="text-[11px] font-mono font-black text-indigo-400 px-2 min-w-[3rem] text-center">
                                {Math.round(modalZoom * 100)}%
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
                                onClick={() => setModalZoom(z => Math.min(4, z + 0.25))}
                                title="Zoom In"
                            >
                                <Plus size={14} />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
                                onClick={() => setModalZoom(1)}
                                title="Reset Zoom"
                            >
                                <RotateCcw size={13} />
                            </Button>
                        </div>

                        <DialogClose className="absolute top-4 right-4 z-30 p-2 rounded-2xl bg-slate-900/90 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-800 transition-colors">
                            <X size={16} />
                        </DialogClose>

                        {/* Interactive Zoomable Modal View */}
                        <div
                            className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing"
                            style={{ transform: `scale(${modalZoom})` }}
                        >
                            <Image
                                src={src}
                                alt={alt}
                                fill
                                className="object-contain"
                                sizes="(max-width: 1200px) 100vw, 1200px"
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
