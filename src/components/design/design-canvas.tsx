'use client';

import React, { useRef } from 'react';
import type { DesignElement, Product, Background, Guide, ViewState, PathPoint } from '@/lib/types';
import { CanvasElement } from './canvas-element';
import { Scissors } from 'lucide-react';
import { PenToolCanvas } from './pen-tool-canvas';

const RULER_SIZE = 60; 

const GuideLine = ({ 
    guide, 
    onUpdate, 
    onRemove,
    canvasOffset,
    safetyMargin
}: { 
    guide: Guide;
    onUpdate?: (id: string, position: number) => void;
    onRemove?: (id: string) => void;
    canvasOffset: number;
    safetyMargin: number;
}) => {
    const guideRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!onUpdate || !onRemove) return;
        e.stopPropagation();
        const startPos = guide.orientation === 'horizontal' ? e.clientY : e.clientX;
        const initialPos = guide.position;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = (guide.orientation === 'horizontal' ? moveEvent.clientY : moveEvent.clientX) - startPos;
            onUpdate(guide.id, initialPos + delta);
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            const finalPos = guide.orientation === 'horizontal' ? upEvent.clientY : upEvent.clientX;
            const canvasRect = guideRef.current?.parentElement?.parentElement?.getBoundingClientRect();
            
            if (canvasRect) {
                if ((guide.orientation === 'horizontal' && finalPos < canvasRect.top + canvasOffset) ||
                    (guide.orientation === 'vertical' && finalPos < canvasRect.left + canvasOffset)) {
                    onRemove(guide.id);
                }
            }
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    
    const style: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: 'hsl(var(--primary))',
        zIndex: 50,
        cursor: (onUpdate && onRemove) ? (guide.orientation === 'horizontal' ? 'row-resize' : 'col-resize') : 'default',
    };

    if (guide.orientation === 'horizontal') {
        style.top = guide.position + safetyMargin;
        style.left = -canvasOffset + safetyMargin;
        style.width = `calc(100% - ${safetyMargin*2}px + ${canvasOffset}px)`;
        style.height = '1px';
    } else {
        style.top = -canvasOffset + safetyMargin;
        style.left = guide.position + safetyMargin;
        style.width = '1px';
        style.height = `calc(100% - ${safetyMargin*2}px + ${canvasOffset}px)`;
    }

    return <div ref={guideRef} style={style} onMouseDown={handleMouseDown} />;
};

const Ruler = ({ orientation, size, offset, safetyMargin, onMouseDown }: { 
    orientation: 'horizontal' | 'vertical', 
    size: number, 
    offset: number, 
    safetyMargin: number,
    onMouseDown?: (e: React.MouseEvent) => void 
}) => {
    const PX_PER_MM = 300 / 25.4;
    const sizeInMm = size / PX_PER_MM;
    const ticks = [];
    for (let i = 0; i <= sizeInMm; i++) {
        ticks.push(i);
    }
    
    const rulerStyle: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: 'hsl(var(--card))',
        color: 'hsl(var(--muted-foreground))',
        fontSize: '15px',
        fontWeight: '500',
        userSelect: 'none',
        zIndex: 100,
    };

    if (orientation === 'horizontal') {
        rulerStyle.top = -offset;
        rulerStyle.left = safetyMargin;
        rulerStyle.width = size;
        rulerStyle.height = offset;
        rulerStyle.cursor = onMouseDown ? 'row-resize' : 'default';
        rulerStyle.borderBottom = '1px solid hsl(var(--border))';
    } else {
        rulerStyle.top = safetyMargin;
        rulerStyle.left = -offset;
        rulerStyle.width = offset;
        rulerStyle.height = size;
        rulerStyle.cursor = onMouseDown ? 'col-resize' : 'default';
        rulerStyle.borderRight = '1px solid hsl(var(--border))';
    }

    return (
        <div style={rulerStyle} onMouseDown={onMouseDown}>
            {ticks.map(t => {
                const t_px = t * PX_PER_MM;
                const isMajor = t % 10 === 0;
                const isMedium = t % 5 === 0;
                
                let tickHeight;
                if (isMajor) tickHeight = offset * 0.35; 
                else if (isMedium) tickHeight = offset * 0.2;
                else tickHeight = offset * 0.1;

                return (
                    <React.Fragment key={t_px}>
                        <div style={{
                            position: 'absolute',
                            backgroundColor: 'hsl(var(--muted-foreground))',
                            ...(orientation === 'horizontal' ? {
                                left: t_px,
                                bottom: 0,
                                width: 1,
                                height: tickHeight,
                            } : {
                                top: t_px,
                                right: 0,
                                width: tickHeight,
                                height: 1,
                            })
                        }}/>
                        {isMajor && t > 0 && (
                            <div style={{
                                position: 'absolute',
                                ...(orientation === 'horizontal' ? {
                                    left: t_px + 4,
                                    top: 4
                                } : {
                                    top: t_px + 4,
                                    left: 4,
                                    writingMode: 'vertical-rl'
                                })
                            }}>
                                {t}
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

const SmartGuideLine = ({ guide, showRulers, safetyMargin }: { guide: Guide; showRulers: boolean, safetyMargin: number }) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: 'hsl(var(--accent))',
        zIndex: 40,
        pointerEvents: 'none',
    };

    const rulerOffset = showRulers ? RULER_SIZE : 0;

    if (guide.orientation === 'horizontal') {
        style.top = guide.position + safetyMargin;
        style.left = -rulerOffset;
        style.width = `calc(100% + ${rulerOffset}px)`;
        style.height = '1px';
    } else {
        style.left = guide.position + safetyMargin;
        style.top = -rulerOffset;
        style.height = `calc(100% + ${rulerOffset}px)`;
        style.width = '1px';
    }

    return <div style={style} />;
};

type DesignCanvasProps = {
  product: Product;
  elements: DesignElement[];
  selectedElementIds?: string[];
  onSelectElement?: (id: string | null, isShift?: boolean) => void;
  onUpdateElement?: (id: string, newProps: Partial<DesignElement>) => void;
  background: Background;
  showRulers: boolean;
  showGrid: boolean;
  gridSize?: number;
  guides: Guide[];
  smartGuides?: Guide[];
  onAddGuide?: (orientation: 'horizontal' | 'vertical', position: number) => string;
  onUpdateGuide?: (id: string, position: number) => void;
  onRemoveGuide?: (id: string) => void;
  onSmartGuidesChange?: (guides: Guide[]) => void;
  showPrintGuidelines: boolean;
  showGuidelineLegend?: boolean;
  bleed: number;
  safetyMargin: number;
  viewState: ViewState;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  renderMode?: 'default' | 'cmyk' | 'spotuv';
  highlightSpotUv?: boolean;
  livePencilPath?: {
    path: [number, number][];
    strokeColor: string;
    strokeWidth: number;
    hardness: number;
    opacity: number;
    brushTip: 'round' | 'square' | 'chalk' | 'spraySoft' | 'texture' | 'scatter' | 'calligraphy';
    scatterData?: {x: number; y: number; r: number; w?: number; h?: number; opacity?: number}[];
  } | null;
  livePath?: PathPoint[] | null;
  mousePos?: { x: number, y: number } | null;
  activeTool?: 'select' | 'brush' | 'pen';
  croppingElementId?: string | null;
  setCroppingElementId?: (id: string | null) => void;
};


export function DesignCanvas({
  product,
  elements,
  selectedElementIds = [],
  onSelectElement,
  onUpdateElement,
  background,
  showRulers,
  showGrid,
  gridSize,
  guides,
  smartGuides = [],
  onAddGuide,
  onUpdateGuide,
  onRemoveGuide,
  onSmartGuidesChange,
  showPrintGuidelines,
  showGuidelineLegend = true,
  bleed,
  safetyMargin,
  viewState,
  onInteractionStart,
  onInteractionEnd,
  renderMode = 'default',
  highlightSpotUv,
  livePencilPath,
  livePath,
  mousePos,
  activeTool = 'select',
  croppingElementId,
  setCroppingElementId,
}: DesignCanvasProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { zoom, pan } = viewState;

  const editorCanvasWidth = product.width + safetyMargin * 2;
  const editorCanvasHeight = product.height + safetyMargin * 2;

  const handleRulerMouseDown = (e: React.MouseEvent, orientation: 'horizontal' | 'vertical') => {
    if (!onAddGuide || !onUpdateGuide || !onRemoveGuide) return;
    const parent = canvasContainerRef.current?.parentElement;
    if (!parent) return;
    const canvasRect = parent.getBoundingClientRect();

    const initialPosition = (orientation === 'horizontal' 
        ? (e.clientY - canvasRect.top) / zoom - safetyMargin 
        : (e.clientX - canvasRect.left) / zoom - safetyMargin);
    
    const newGuideId = onAddGuide(orientation, initialPosition);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newPosition = (orientation === 'horizontal' 
        ? (moveEvent.clientY - canvasRect.top) / zoom - safetyMargin 
        : (moveEvent.clientX - canvasRect.left) / zoom - safetyMargin);
      onUpdateGuide(newGuideId, newPosition);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const finalPos = orientation === 'horizontal' ? upEvent.clientY : upEvent.clientX;
      const threshold = orientation === 'horizontal' ? canvasRect.top : canvasRect.left;
      
      if (finalPos < threshold) {
        onRemoveGuide(newGuideId);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const canvasStyle: React.CSSProperties = {
    position: 'relative',
    width: editorCanvasWidth,
    height: editorCanvasHeight,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    backgroundColor: background.type === 'solid' ? background.color : 'white',
    overflow: 'hidden',
    padding: safetyMargin,
  };
  
  const bgImages: string[] = [];
  const bgSizes: string[] = [];
  const bgRepeats: string[] = [];
  const bgPositions: string[] = [];

  if (showGrid && gridSize && renderMode !== 'spotuv') {
    const gridColor = "rgba(0,0,0,0.3)"; 
    const gridSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${gridSize}' height='${gridSize}'><path d='M ${gridSize} 0 L 0 0 0 ${gridSize}' fill='none' stroke='${gridColor}' stroke-width='0.5'/></svg>`;
    bgImages.push(`url("data:image/svg+xml,${encodeURIComponent(gridSvg)}")`);
    bgSizes.push(`${gridSize}px ${gridSize}px`);
    bgRepeats.push('repeat');
    bgPositions.push('0% 0%');
  }

  if (renderMode !== 'spotuv' && background.type === 'image' && background.imageSrc) {
    bgImages.push(`url(${background.imageSrc})`);
    bgSizes.push(background.imagePosition === 'stretch' ? '100% 100%' : background.imagePosition || 'cover');
    bgRepeats.push('no-repeat');
    bgPositions.push('center');
  }

  if (renderMode !== 'spotuv' && (background.type === 'gradient' || background.type === 'stepped-gradient') && background.gradientStops) {
    if (background.type === 'stepped-gradient') {
      const stops = background.gradientStops;
      const totalWeight = stops.reduce((sum, stop) => sum + (stop.weight ?? 1), 0);
      if (totalWeight > 0) {
        let accumulatedPercentage = 0;
        const colorStops = stops.map((stop) => {
          const weight = stop.weight ?? 1;
          const startPercent = accumulatedPercentage;
          const stepPercentage = (weight / totalWeight) * 100;
          accumulatedPercentage += stepPercentage;
          const endPercent = accumulatedPercentage;
          return `${stop.color} ${startPercent}%, ${stop.color} ${endPercent}%`;
        }).join(', ');
        bgImages.push(`linear-gradient(${background.gradientDirection || 0}deg, ${colorStops})`);
      }
    } else {
      const sortedStops = [...background.gradientStops].sort((a,b) => a.position - b.position);
      const colorStops = sortedStops.map(s => `${s.color} ${s.position * 100}%`).join(', ');
      bgImages.push(`linear-gradient(${background.gradientDirection || 0}deg, ${colorStops})`);
    }
    bgSizes.push('cover');
    bgRepeats.push('no-repeat');
    bgPositions.push('center');
  }

  if(bgImages.length > 0) {
    canvasStyle.backgroundImage = bgImages.join(', ');
    canvasStyle.backgroundSize = bgSizes.join(', ');
    canvasStyle.backgroundRepeat = bgRepeats.join(', ');
    canvasStyle.backgroundPosition = bgPositions.join(', ');
  }

  const rulerOffset = showRulers ? RULER_SIZE : 0;
  
  const stdDeviation = livePencilPath?.hardness !== undefined 
    ? ((1 - livePencilPath.hardness)) * (livePencilPath.strokeWidth / 2)
    : 0;

  return (
    <div
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: 'top left',
        width: editorCanvasWidth + rulerOffset,
        height: editorCanvasHeight + rulerOffset,
        position: 'absolute',
      }}
    >
      <div 
        style={{
          position: 'relative',
          marginTop: rulerOffset,
          marginLeft: rulerOffset,
        }}
      >
        {showRulers && (
          <>
            <Ruler 
                orientation="horizontal" 
                size={product.width} 
                offset={rulerOffset} 
                safetyMargin={safetyMargin} 
                onMouseDown={onAddGuide ? (e) => handleRulerMouseDown(e, 'horizontal') : undefined}
            />
            <Ruler 
                orientation="vertical" 
                size={product.height} 
                offset={rulerOffset} 
                safetyMargin={safetyMargin} 
                onMouseDown={onAddGuide ? (e) => handleRulerMouseDown(e, 'vertical') : undefined}
            />
          </>
        )}

        <div
          ref={canvasContainerRef}
          className="print-area"
          style={canvasStyle}
        >
          {showPrintGuidelines && (
            <>
                <div style={{
                    position: 'absolute',
                    top: safetyMargin - bleed,
                    left: safetyMargin - bleed,
                    right: safetyMargin - bleed,
                    bottom: safetyMargin - bleed,
                    border: '1.5px dashed #ef4444',
                    pointerEvents: 'none',
                    zIndex: 20
                }} />
                
                <div style={{
                    position: 'absolute',
                    top: safetyMargin + safetyMargin,
                    bottom: safetyMargin + safetyMargin,
                    left: safetyMargin + safetyMargin,
                    right: safetyMargin + safetyMargin,
                    border: '1.5px dashed #22c55e',
                    pointerEvents: 'none',
                    zIndex: 20
                }} />
                
                <Scissors 
                    style={{ 
                        position: 'absolute', 
                        top: safetyMargin - 7, 
                        left: safetyMargin - 7, 
                        zIndex: 22, 
                        color: 'hsl(var(--foreground))' 
                    }} 
                    size={14} 
                />

                {showGuidelineLegend && (
                  <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', zIndex: 22, display: 'flex', gap: '20px', fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
                      <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full border border-dashed border-green-500"></div>
                          <span>Safe Line</span>
                      </div>
                       <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full border border-dashed border-red-500"></div>
                          <span>Bleed Line</span>
                      </div>
                  </div>
                )}
            </>
          )}

          {guides.map(guide => (
            <GuideLine 
                key={guide.id} 
                guide={guide} 
                onUpdate={onUpdateGuide} 
                onRemove={onRemoveGuide} 
                canvasOffset={rulerOffset} 
                safetyMargin={safetyMargin} 
            />
          ))}

          {smartGuides.map(guide => (
            <SmartGuideLine 
                key={guide.id} 
                guide={guide} 
                showRulers={showRulers} 
                safetyMargin={safetyMargin} 
            />
          ))}

          <div className="print-area" style={{ position: 'absolute', top: safetyMargin, left: safetyMargin, width: product.width, height: product.height, pointerEvents: 'none' }}>
            {elements.map((element) => (
                <CanvasElement
                key={element.id}
                element={element}
                product={product}
                isSelected={selectedElementIds.includes(element.id)}
                onSelect={onSelectElement ? (isShift) => onSelectElement(element.id, isShift) : undefined}
                onUpdate={onUpdateElement}
                canvasWidth={product.width}
                canvasHeight={product.height}
                guides={guides}
                otherElements={elements.filter(el => !selectedElementIds.includes(el.id))}
                onSmartGuidesChange={onSmartGuidesChange}
                zoom={zoom}
                onInteractionStart={onInteractionStart}
                onInteractionEnd={onInteractionEnd}
                renderMode={renderMode}
                activeTool={activeTool}
                croppingElementId={croppingElementId}
                setCroppingElementId={setCroppingElementId}
                />
            ))}
          </div>
          
          <PenToolCanvas livePath={livePath} mousePos={mousePos} zoom={zoom} safetyMargin={safetyMargin} />

          {livePencilPath && (
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 999, opacity: livePencilPath.opacity }}>
                  {stdDeviation > 0 && livePencilPath.brushTip !== 'square' && (
                    <defs>
                        <filter id="live-brush-blur" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation={stdDeviation} />
                        </filter>
                    </defs>
                  )}
                  {['chalk', 'spraySoft', 'texture', 'scatter'].includes(livePencilPath.brushTip) ? (
                      livePencilPath.scatterData?.map((p, i) => (
                          livePencilPath.brushTip === 'texture' ? (
                                <rect 
                                    key={i}
                                    x={p.x + safetyMargin} y={p.y + safetyMargin}
                                    width={p.w || 5} height={p.h || 5}
                                    fill={livePencilPath.strokeColor}
                                    opacity={p.opacity || 1}
                                    filter={stdDeviation > 0 ? "url(#live-brush-blur)" : undefined}
                                />
                          ) : (
                                <circle 
                                    key={i} 
                                    cx={p.x + safetyMargin} 
                                    cy={p.y + safetyMargin} 
                                    r={p.r} 
                                    fill={livePencilPath.strokeColor}
                                    opacity={p.opacity || 1}
                                    filter={stdDeviation > 0 ? "url(#live-brush-blur)" : undefined}
                                />
                          )
                      ))
                  ) : (
                    <path
                        d={"M " + livePencilPath.path.map(p => `${p[0] + safetyMargin} ${p[1] + safetyMargin}`).join(" L ")}
                        stroke={livePencilPath.strokeColor}
                        strokeWidth={livePencilPath.strokeWidth}
                        fill="none"
                        strokeLinecap={livePencilPath.brushTip === 'square' ? 'butt' : 'round'}
                        strokeLinejoin={livePencilPath.brushTip === 'square' ? 'miter' : 'round'}
                        filter={stdDeviation > 0 && livePencilPath.brushTip !== 'square' ? "url(#live-brush-blur)" : undefined}
                    />
                  )}
              </svg>
          )}
        </div>
      </div>
    </div>
  );
}
