'use client';

import React from 'react';
import type { DesignElement, Product } from '@/lib/types';
import { cn } from "@/lib/utils";

const hexToRgba = (hex: string): { r: number; g: number; b: number; a: number } => {
  if (!hex || !hex.startsWith('#')) return { r: 0, g: 0, b: 0, a: 0 };
  let s = hex.slice(1);
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  if (s.length === 4) s = s.split('').map(c => c + c).join('').slice(0, 6) + s.slice(3, 4).repeat(2);

  const hasAlpha = s.length === 8;
  const r = parseInt(s.substring(0, 2), 16);
  const g = parseInt(s.substring(2, 4), 16);
  const b = parseInt(s.substring(4, 6), 16);
  const a = hasAlpha ? parseInt(s.substring(6, 8), 16) / 255 : 1;

  return { r, g, b, a };
};


const createGradientString = (element: DesignElement, { reversed = false } = {}): string | null => {
  const { fillType } = element;
  const isStepped = fillType === 'stepped-gradient';
  const stops = isStepped ? (element.steppedGradientStops || element.gradientStops) : element.gradientStops;
  const direction = isStepped ? (element.steppedGradientDirection ?? element.gradientDirection) : element.gradientDirection;
  const type = isStepped ? (element.steppedGradientType ?? element.gradientType) : (element.gradientType || 'linear');

  if (!stops || stops.length === 0 || (fillType !== 'gradient' && fillType !== 'stepped-gradient')) {
    return null;
  }
  
  const stopsToUse = reversed ? [...stops].reverse() : [...stops];
  let colorStopsString = '';

  if (fillType === 'stepped-gradient') {
    const totalWeight = stopsToUse.reduce((sum, stop) => sum + (stop.weight ?? 1), 0);
    if (totalWeight <= 0) return null;

    let accumulatedPercentage = 0;
    colorStopsString = stopsToUse.map((stop) => {
      const weight = stop.weight ?? 1;
      const startPercent = accumulatedPercentage;
      const stepPercentage = (weight / totalWeight) * 100;
      accumulatedPercentage += stepPercentage;
      const endPercent = accumulatedPercentage;
      return `${stop.color} ${startPercent}%, ${stop.color} ${endPercent}%`;
    }).join(', ');
  } else { // smooth gradient
    if (stopsToUse.length < 2) {
      return stopsToUse.length ? stopsToUse[0].color : null;
    }
    const totalWeight = stopsToUse.reduce((sum, stop) => sum + (stop.weight ?? 1), 0) || 1;
    let accumulatedWeight = 0;
    colorStopsString = stopsToUse
      .map((s, i) => {
          if (i === 0) return `${s.color} 0%`;
          accumulatedWeight += stopsToUse[i-1].weight ?? 1;
          const pos = Math.max(0, Math.min(100, (accumulatedWeight / totalWeight) * 100));
          return `${s.color} ${pos}%`;
      })
      .join(', ');
  }

  if (type === 'radial') {
    return `radial-gradient(circle at center, ${colorStopsString})`;
  }
  return `linear-gradient(${direction || 0}deg, ${colorStopsString})`;
};

const SvgGradientDefs = ({ element, product }: { element: DesignElement; product: Product }) => {
  const { fillType } = element;
  const isStepped = fillType === 'stepped-gradient';
  const stops = isStepped ? (element.steppedGradientStops || element.gradientStops) : element.gradientStops;
  const direction = isStepped ? (element.steppedGradientDirection ?? element.gradientDirection) : (element.gradientDirection ?? 90);
  const type = isStepped ? (element.steppedGradientType ?? element.gradientType) : (element.gradientType || 'linear');

  if (!stops || stops.length === 0 || (fillType !== 'gradient' && fillType !== 'stepped-gradient')) {
    return null;
  }

  let stopElements: React.ReactNode[] | null = null;
  
  if (fillType === 'stepped-gradient') {
    const totalWeight = stops.reduce((sum, stop) => sum + (stop.weight ?? 1), 0);
    if (totalWeight <= 0) return null;
    
    let accumulatedOffset = 0;
    stopElements = stops.flatMap((stop, index) => {
        const weight = stop.weight ?? 1;
        const startOffset = accumulatedOffset;
        const stepOffset = weight / totalWeight;
        accumulatedOffset += stepOffset;
        const endOffset = accumulatedOffset;

        return [
            <stop key={`${stop.id || index}-start`} offset={`${startOffset * 100}%`} stopColor={stop.color} />,
            <stop key={`${stop.id || index}-end`} offset={`${endOffset * 100}%`} stopColor={stop.color} />
        ];
    });
  } else { // 'gradient'
    if (stops.length < 2) return null;
    const totalWeight = stops.reduce((sum, stop) => sum + (stop.weight ?? 1), 0) || 1;
    let accumulatedWeight = 0;
    stopElements = stops.map((stop, index) => {
        let offset = 0;
        if (index === 0) offset = 0;
        else {
            accumulatedWeight += stops[index-1].weight ?? 1;
            offset = Math.max(0, Math.min(1, accumulatedWeight / totalWeight));
        }
        return <stop key={stop.id || index} offset={`${offset * 100}%`} stopColor={stop.color} />;
    });
  }
  
  if (type === 'radial') {
      return (
          <radialGradient
              id={`grad-${element.id}`}
              cx={element.width / 2}
              cy={element.height / 2}
              r={Math.max(element.width, element.height) / 2}
              fx={element.width / 2}
              fy={element.height / 2}
              gradientUnits="userSpaceOnUse"
          >
              {stopElements}
          </radialGradient>
      );
  }

  const cx = element.width / 2;
  const cy = element.height / 2;
  
  // Calculate distance along the angle to reach the box edges (CSS standard behavior)
  const angleRad = (direction - 90) * (Math.PI / 180);
  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));
  const dist = (element.width * cos + element.height * sin) / 2;
  
  const x1 = cx - Math.cos(angleRad) * dist;
  const y1 = cy - Math.sin(angleRad) * dist;
  const x2 = cx + Math.cos(angleRad) * dist;
  const y2 = cy + Math.sin(angleRad) * dist;

  return (
    <linearGradient
      id={`grad-${element.id}`}
      gradientUnits="userSpaceOnUse"
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
    >
      {stopElements}
    </linearGradient>
  );
};

export function TextCanvasElement({ 
  element, 
  product, 
  renderMode,
  isEditing,
  setEditingId,
  onUpdate 
}: { 
  element: DesignElement; 
  product: Product; 
  renderMode?: string;
  isEditing?: boolean;
  setEditingId?: (id: string | null) => void;
  onUpdate?: (id: string, updates: Partial<DesignElement>) => void;
}) {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  React.useEffect(() => {
    // Initial check
    document.fonts.ready.then(() => setFontsLoaded(true));

    // Listen for new fonts (like after an upload)
    const handleFontLoad = () => setFontsLoaded(true);
    document.fonts.addEventListener('loadingdone', handleFontLoad);
    return () => document.fonts.removeEventListener('loadingdone', handleFontLoad);
  }, []);

  const isSpotUv = renderMode === 'spotuv' || renderMode === 'foil';
  const warp = element.textWarp;
  const warpStyle = warp?.style;

  const firstShadow = element.textShadows?.[0];
  let shadowFilterDef: React.ReactNode = null;

  if (firstShadow && !isSpotUv) {
      const { r, g, b, a } = hexToRgba(firstShadow.color);
      const shadowColor = `rgb(${r},${g},${b})`;
      const shadowOpacity = a;
      shadowFilterDef = (
        <defs>
          <filter id={`shadow-${element.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                  dx={firstShadow.offsetX}
                  dy={firstShadow.offsetY}
                  stdDeviation={firstShadow.blur}
                  floodColor={shadowColor}
                  floodOpacity={shadowOpacity}
              />
          </filter>
        </defs>
      );
  }
  
  const textStyle: React.CSSProperties = {
    fontSize: element.fontSize,
    fontFamily: `"${element.fontFamily}"`,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    letterSpacing: `${element.letterSpacing}px`,
    lineHeight: element.lineHeight,
    textTransform: element.textTransform,
  };

  const getSvgFill = () => {
    if (isSpotUv) return 'black';
    if (element.fillType === 'image' && element.fillImageSrc) return `url(#img-fill-${element.id})`;
    if ((element.fillType === 'gradient' || element.fillType === 'stepped-gradient') && element.gradientStops && element.gradientStops.length > 0) {
      return `url(#grad-${element.id})`;
    }
    if (element.fillType === 'none') return 'none';
    return element.color || '#000000';
  };
  
  if (warpStyle && warpStyle !== 'none') {
    const { radius = 100, value: rotation = 0, reverse = false, bend = 50 } = warp || {};
    const fontSize = element.fontSize || 16;
    
    const centerX = element.width / 2;
    const centerY = element.height / 2;

    let contentToWrap = element.content || '';
    if (element.textTransform === 'uppercase') contentToWrap = contentToWrap.toUpperCase();
    else if (element.textTransform === 'lowercase') contentToWrap = contentToWrap.toLowerCase();
    else if (element.textTransform === 'capitalize') contentToWrap = contentToWrap.replace(/\b\w/g, char => char.toUpperCase());

    const charData = React.useMemo(() => {
        if (typeof document === 'undefined') return [];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return [];
        context.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize || 16}px "${element.fontFamily || 'sans-serif'}"`;
        
        const chars = Array.from(contentToWrap);
        const spacing = element.letterSpacing || 0;
        
        const widths = chars.map(char => context.measureText(char).width);
        const totalWidth = widths.reduce((a, b) => a + b, 0) + (chars.length - 1) * spacing;

        if (warpStyle === 'circle') {
            const effectiveRadius = reverse ? radius - fontSize * 0.8 : radius;
            const totalArcDegrees = (totalWidth / (2 * Math.PI * effectiveRadius)) * 360;
            let currentAngle = rotation - (totalArcDegrees / 2);
            
            return chars.map((char, i) => {
                const charWidth = widths[i];
                const charAngleWidth = (charWidth / (2 * Math.PI * effectiveRadius)) * 360;
                const midAngle = currentAngle + (charAngleWidth / 2);
                currentAngle += charAngleWidth + (spacing / (2 * Math.PI * effectiveRadius)) * 360;
                const angleInRadians = (midAngle - 90) * Math.PI / 180;
                return {
                    char,
                    x: centerX + (effectiveRadius * Math.cos(angleInRadians)),
                    y: centerY + (effectiveRadius * Math.sin(angleInRadians)),
                    rotation: midAngle + (reverse ? 180 : 0)
                };
            });
        }

        // For other styles (arc, arch, wave, flag, rise)
        // We calculate positions along a 0 to 1 progress line
        let currentXOffset = 0;
        return chars.map((char, i) => {
            const charWidth = widths[i];
            const midXInLine = currentXOffset + (charWidth / 2);
            currentXOffset += charWidth + spacing;
            
            // Progress from -0.5 to 0.5 (centered at 0)
            const progress = (midXInLine / totalWidth) - 0.5;
            const x = centerX + (progress * totalWidth);
            let y = centerY;
            let charRotation = 0;

            const bendFactor = bend / 100;
            const bendAmount = element.height * 0.4 * bendFactor;

            switch (warpStyle) {
                case 'arc': {
                    // Parabolic arc
                    const arcY = (1 - 4 * (progress * progress)) * bendAmount;
                    y = centerY - arcY;
                    // Rotation based on tangent
                    const slope = -8 * progress * bendAmount / totalWidth;
                    charRotation = Math.atan(slope) * 180 / Math.PI;
                    break;
                }
                case 'arch': {
                    // Similar to arc but steeper
                    const archY = Math.cos(progress * Math.PI) * bendAmount;
                    y = centerY - archY;
                    const slope = -Math.sin(progress * Math.PI) * (bendAmount * Math.PI / totalWidth);
                    charRotation = Math.atan(slope) * 180 / Math.PI;
                    break;
                }
                case 'wave': {
                    const waveY = Math.sin(progress * Math.PI * 2) * bendAmount;
                    y = centerY - waveY;
                    const slope = -Math.cos(progress * Math.PI * 2) * (bendAmount * Math.PI * 2 / totalWidth);
                    charRotation = Math.atan(slope) * 180 / Math.PI;
                    break;
                }
                case 'flag': {
                    const flagY = Math.sin(progress * Math.PI) * bendAmount;
                    y = centerY - flagY;
                    const slope = -Math.cos(progress * Math.PI) * (bendAmount * Math.PI / totalWidth);
                    charRotation = Math.atan(slope) * 180 / Math.PI;
                    break;
                }
                case 'rise': {
                    const riseY = progress * bendAmount * 2;
                    y = centerY - riseY;
                    const slope = -bendAmount * 2 / totalWidth;
                    charRotation = Math.atan(slope) * 180 / Math.PI;
                    break;
                }
            }

            return {
                char,
                x,
                y,
                rotation: charRotation
            };
        });
    }, [contentToWrap, element.fontStyle, element.fontWeight, element.fontSize, element.fontFamily, element.letterSpacing, radius, rotation, reverse, bend, warpStyle, centerX, centerY, fontsLoaded, element.width, element.height]);

    const isSmoothGradient = element.fillType === 'gradient';

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${element.width} ${element.height}`} 
        style={{ overflow: 'visible' }}
      >
        <defs>
            {!isSpotUv && <SvgGradientDefs element={element} product={product} />}
            {shadowFilterDef}
        </defs>
        
        <g 
            filter={shadowFilterDef ? `url(#shadow-${element.id})` : undefined}
            fill={isSmoothGradient ? getSvgFill() : undefined}
        >
          {charData.map((data, i) => (
            <text 
                key={i}
                style={{
                    ...textStyle,
                    paintOrder: 'stroke fill',
                }} 
                textAnchor="middle" 
                dominantBaseline="middle"
                transform={`translate(${data.x}, ${data.y}) rotate(${data.rotation})`}
                stroke={!isSpotUv && element.textStrokeWidth ? (element.textStrokeColor || '#000000') : 'none'}
                strokeWidth={!isSpotUv ? (element.textStrokeWidth || 0) : 0}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill={isSmoothGradient ? 'inherit' : getSvgFill()}
            >
                {data.char}
            </text>
          ))}
        </g>
      </svg>
    );
  }

  // -- Normal Flat Text --
  const lineData = React.useMemo(() => {
    if (!element.content) return [];
    if (typeof document === 'undefined') return [];
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [];
    context.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize || 16}px "${element.fontFamily || 'sans-serif'}"`;
    context.letterSpacing = `${element.letterSpacing || 0}px`;

    let contentToWrap = element.content;
    if (element.textTransform === 'uppercase') contentToWrap = contentToWrap.toUpperCase();
    else if (element.textTransform === 'lowercase') contentToWrap = contentToWrap.toLowerCase();
    else if (element.textTransform === 'capitalize') contentToWrap = contentToWrap.replace(/\b\w/g, char => char.toUpperCase());

    const allLines = contentToWrap.split('\n');
    const lines: { text: string; y: number; width: number }[] = [];
    const lineHeightPx = (element.lineHeight || 1.2) * (element.fontSize || 16);

    allLines.forEach((lineContent) => {
        const words = lineContent.split(' ');
        let currentLine = "";
        
        words.forEach((word) => {
            const testLine = currentLine ? currentLine + " " + word : word;
            const testWidth = context.measureText(testLine).width;
            
            if (testWidth > element.width && currentLine) {
                lines.push({ text: currentLine, y: 0, width: context.measureText(currentLine).width });
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push({ text: currentLine, y: 0, width: context.measureText(currentLine).width });
    });

    const totalTextHeight = lines.length * lineHeightPx;
    let startY = 0;
    switch (element.verticalAlign) {
        case 'top': startY = lineHeightPx * 0.8; break;
        case 'bottom': startY = element.height - totalTextHeight + (lineHeightPx * 0.8); break;
        default: startY = (element.height - totalTextHeight) / 2 + (lineHeightPx * 0.8); break;
    }

    return lines.map((line, i) => ({
        ...line,
        y: startY + i * lineHeightPx
    }));
  }, [element, element.content, element.width, element.height, element.textAlign, element.verticalAlign, fontsLoaded]);

  const isGradient = element.fillType === 'gradient' || element.fillType === 'stepped-gradient';

  return (
    <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
            {!isSpotUv && <SvgGradientDefs element={element} product={product} />}
            {!isSpotUv && element.fillType === 'image' && element.fillImageSrc && (() => {
                const scaleX = element.fillImageScaleX || element.fillImageScale || 1;
                const scaleY = element.fillImageScaleY || element.fillImageScale || 1;
                const offsetX = element.fillImageOffsetX || 0;
                const offsetY = element.fillImageOffsetY || 0;
                
                // When using objectBoundingBox:
                // 1.0 = 100% of the element's width/height
                // We normalize offset to be relative (0.5 = center)
                const relativeOffsetX = offsetX / element.width;
                const relativeOffsetY = offsetY / element.height;
                
                // Scale around the center (0.5, 0.5)
                const transformStr = `translate(${0.5 + relativeOffsetX}, ${0.5 + relativeOffsetY}) scale(${scaleX}, ${scaleY}) translate(-0.5, -0.5)`;
                
                return (
                    <pattern 
                      id={`img-fill-${element.id}`} 
                      patternUnits="objectBoundingBox" 
                      width="1" 
                      height="1"
                    >
                        <image 
                            href={element.fillImageSrc} 
                            x="0"
                            y="0"
                            width="1" 
                            height="1" 
                            preserveAspectRatio="none"
                            transform={transformStr}
                        />
                    </pattern>
                );
            })()}
            {shadowFilterDef}
        </defs>

      {isEditing ? (
        <foreignObject x={0} y={0} width={element.width} height={element.height}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: element.verticalAlign === 'top' ? 'flex-start' : (element.verticalAlign === 'bottom' ? 'flex-end' : 'center'),
            padding: 0
          }}>
            <textarea
              ref={textareaRef}
              autoFocus
              style={{
                width: '100%',
                height: 'auto', // Let flex container control vertical space
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: element.color,
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
                textAlign: element.textAlign,
                fontWeight: element.fontWeight,
                fontStyle: element.fontStyle,
                lineHeight: element.lineHeight,
                padding: 0,
                margin: 0,
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                display: 'block'
              }}
              value={element.content}
              onChange={(e) => onUpdate?.(element.id, { content: e.target.value })}
              onBlur={() => setEditingId?.(null)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingId?.(null);
                e.stopPropagation();
              }}
            />
          </div>
        </foreignObject>
      ) : (
        <g 
          filter={shadowFilterDef ? `url(#shadow-${element.id})` : undefined}
          fill={isGradient ? getSvgFill() : undefined}
        >
          {lineData.map((line, lineIdx) => {
              let x = 0;
              if (element.textAlign === 'center') x = element.width / 2;
              else if (element.textAlign === 'right') x = element.width;
              
              const textAlignMap = {
                  left: 'start',
                  center: 'middle',
                  right: 'end',
                  justify: 'start'
              };

              return (
                  <text 
                    key={lineIdx} 
                    style={{
                        ...textStyle,
                        paintOrder: 'stroke fill',
                    }} 
                    x={x}
                    y={line.y}
                    textAnchor={textAlignMap[element.textAlign || 'left'] as any}
                    stroke={!isSpotUv && element.textStrokeWidth ? (element.textStrokeColor || '#000000') : 'none'}
                    strokeWidth={!isSpotUv ? (element.textStrokeWidth || 0) : 0}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill={isGradient ? 'inherit' : getSvgFill()}
                  >
                    {line.text}
                  </text>
              );
          })}
      </g>
      )}
    </svg>
  );
}
