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
  const { fillType, gradientDirection, gradientStops } = element;

  if (!gradientStops || gradientStops.length === 0 || (fillType !== 'gradient' && fillType !== 'stepped-gradient')) {
    return null;
  }
  
  const stopsToUse = reversed ? [...gradientStops].reverse() : [...gradientStops];
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
    colorStopsString = stopsToUse
      .map((s, i) => `${s.color} ${(i / (stopsToUse.length - 1)) * 100}%`)
      .join(', ');
  }

  return `linear-gradient(${gradientDirection || 0}deg, ${colorStopsString})`;
};

const SvgGradientDefs = ({ element, product }: { element: DesignElement; product: Product }) => {
  const { fillType, gradientDirection = 90, gradientStops, width, height } = element;

  if (!gradientStops || gradientStops.length === 0 || (fillType !== 'gradient' && fillType !== 'stepped-gradient')) {
    return null;
  }

  let stopElements: React.ReactNode[] | null = null;
  
  if (fillType === 'stepped-gradient') {
    const totalWeight = gradientStops.reduce((sum, stop) => sum + (stop.weight ?? 1), 0);
    if (totalWeight <= 0) return null;
    
    let accumulatedOffset = 0;
    stopElements = gradientStops.flatMap((stop, index) => {
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
    if (gradientStops.length < 2) return null;
    stopElements = gradientStops.map((stop, index) => (
      <stop key={stop.id || index} offset={`${(index / (gradientStops.length - 1)) * 100}%`} stopColor={stop.color} />
    ));
  }
  
  const angleRad = (gradientDirection - 90) * (Math.PI / 180);
  const x1 = 0.5 - Math.cos(angleRad) * 0.5;
  const y1 = 0.5 - Math.sin(angleRad) * 0.5;
  const x2 = 0.5 + Math.cos(angleRad) * 0.5;
  const y2 = 0.5 + Math.sin(angleRad) * 0.5;

  return (
    <defs>
      <linearGradient
        id={`grad-${element.id}`}
        gradientUnits="objectBoundingBox"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
      >
        {stopElements}
      </linearGradient>
    </defs>
  );
};

export function TextCanvasElement({ 
  element, 
  product, 
  renderMode 
}: { 
  element: DesignElement; 
  product: Product; 
  renderMode?: string 
}) {
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
  
  if (warpStyle === 'circle') {
    const { radius = 100, value: rotation = 0, reverse = false } = warp || {};
    const fontSize = element.fontSize || 16;
    const effectiveRadius = reverse ? radius - fontSize * 0.8 : radius;

    const centerX = element.width / 2;
    const pathCenterY = element.height / 2;

    let contentToWrap = element.content || '';
    if (element.textTransform === 'uppercase') contentToWrap = contentToWrap.toUpperCase();
    else if (element.textTransform === 'lowercase') contentToWrap = contentToWrap.toLowerCase();
    else if (element.textTransform === 'capitalize') contentToWrap = contentToWrap.replace(/\b\w/g, char => char.toUpperCase());

    const charData = React.useMemo(() => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return [];
        context.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize || 16}px "${element.fontFamily || 'sans-serif'}"`;
        
        const chars = Array.from(contentToWrap);
        const spacing = element.letterSpacing || 0;
        
        const widths = chars.map(char => context.measureText(char).width);
        const totalWidth = widths.reduce((a, b) => a + b, 0) + (chars.length - 1) * spacing;
        
        const totalArcDegrees = (totalWidth / (2 * Math.PI * effectiveRadius)) * 360;
        let currentAngle = rotation - (totalArcDegrees / 2);
        
        return chars.map((char, i) => {
            const charWidth = widths[i];
            const charAngleWidth = (charWidth / (2 * Math.PI * effectiveRadius)) * 360;
            const midAngle = currentAngle + (charAngleWidth / 2);
            
            // Advance for next char
            currentAngle += charAngleWidth + (spacing / (2 * Math.PI * effectiveRadius)) * 360;
            
            const angleInRadians = (midAngle - 90) * Math.PI / 180;
            const x = centerX + (effectiveRadius * Math.cos(angleInRadians));
            const y = pathCenterY + (effectiveRadius * Math.sin(angleInRadians));
            
            return {
                char,
                x,
                y,
                rotation: midAngle + (reverse ? 180 : 0)
            };
        });
    }, [contentToWrap, element.fontStyle, element.fontWeight, element.fontSize, element.fontFamily, element.letterSpacing, effectiveRadius, rotation, reverse, centerX, pathCenterY]);

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
        
        <g filter={shadowFilterDef ? `url(#shadow-${element.id})` : undefined}>
          {charData.map((data, i) => (
            <React.Fragment key={i}>
                <text 
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
                    fill={getSvgFill()}
                >
                    {data.char}
                </text>
            </React.Fragment>
          ))}
        </g>
      </svg>
    );
  }

  // -- Normal Flat Text --
  const charData = React.useMemo(() => {
    if (!element.content) return [];
    
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
    const lines: { char: string; x: number; y: number; width: number }[][] = [];
    const lineHeightPx = (element.lineHeight || 1.2) * (element.fontSize || 16);
    const spacing = element.letterSpacing || 0;

    allLines.forEach((lineContent, lineIdx) => {
        const words = lineContent.split(' ');
        let currentLineChars: { char: string; x: number; width: number }[] = [];
        let currentLineWidth = 0;

        words.forEach((word, wordIdx) => {
            const wordWithSpace = wordIdx > 0 ? ' ' + word : word;
            const wordChars = Array.from(wordWithSpace);
            const wordWidth = context.measureText(wordWithSpace).width;

            if (currentLineWidth + wordWidth > element.width && currentLineChars.length > 0) {
                // Push current line and reset
                lines.push(currentLineChars.map(c => ({ ...c, y: 0, width: 0 }))); // Y will be set later
                currentLineChars = [];
                currentLineWidth = 0;
                
                // Process word again without leading space
                const cleanWord = word;
                const cleanChars = Array.from(cleanWord);
                let xOffset = 0;
                cleanChars.forEach(char => {
                    const w = context.measureText(char).width;
                    currentLineChars.push({ char, x: xOffset, width: w });
                    xOffset += w + spacing;
                });
                currentLineWidth = xOffset - spacing;
            } else {
                let xOffset = currentLineWidth > 0 ? currentLineWidth + spacing : 0;
                wordChars.forEach(char => {
                    const w = context.measureText(char).width;
                    currentLineChars.push({ char, x: xOffset, width: w });
                    xOffset += w + spacing;
                });
                currentLineWidth = xOffset - spacing;
            }
        });
        if (currentLineChars.length > 0) lines.push(currentLineChars.map(c => ({ ...c, y: 0, width: 0 })));
    });

    const totalTextHeight = lines.length * lineHeightPx;
    let startY = 0;
    switch (element.verticalAlign) {
        case 'top': startY = lineHeightPx * 0.8; break;
        case 'bottom': startY = element.height - totalTextHeight + (lineHeightPx * 0.8); break;
        default: startY = (element.height - totalTextHeight) / 2 + (lineHeightPx * 0.8); break;
    }

    return lines.map((line, i) => {
        const lineTotalWidth = line.length > 0 ? (line[line.length - 1].x + line[line.length - 1].width) : 0;
        let lineXOffset = 0;
        if (element.textAlign === 'center') lineXOffset = (element.width - lineTotalWidth) / 2;
        else if (element.textAlign === 'right') lineXOffset = element.width - lineTotalWidth;

        const yPos = startY + i * lineHeightPx;
        return line.map(c => ({
            char: c.char,
            x: c.x + lineXOffset,
            y: yPos
        }));
    });
  }, [element, element.content, element.width, element.height, element.textAlign, element.verticalAlign]);

  return (
    <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
            {!isSpotUv && <SvgGradientDefs element={element} product={product} />}
            {!isSpotUv && element.fillType === 'image' && element.fillImageSrc && (() => {
                const scale = element.fillImageScale || 1;
                const offsetX = element.fillImageOffsetX || 0;
                const offsetY = element.fillImageOffsetY || 0;
                const cx = element.width / 2;
                const cy = element.height / 2;
                const transformStr = `translate(${cx + offsetX}, ${cy + offsetY}) scale(${scale}) translate(${-cx}, ${-cy})`;
                
                return (
                    <pattern id={`img-fill-${element.id}`} patternUnits="userSpaceOnUse" width={element.width} height={element.height}>
                        <image 
                            href={element.fillImageSrc} 
                            width={element.width} 
                            height={element.height} 
                            preserveAspectRatio="xMidYMid slice"
                            transform={transformStr}
                        />
                    </pattern>
                );
            })()}
            {shadowFilterDef}
        </defs>

      <g filter={shadowFilterDef ? `url(#shadow-${element.id})` : undefined}>
          {charData.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                  {line.map((c, charIdx) => (
                      <text 
                        key={charIdx} 
                        style={{
                            ...textStyle,
                            paintOrder: 'stroke fill',
                        }} 
                        transform={`translate(${c.x}, ${c.y})`}
                        stroke={!isSpotUv && element.textStrokeWidth ? (element.textStrokeColor || '#000000') : 'none'}
                        strokeWidth={!isSpotUv ? (element.textStrokeWidth || 0) : 0}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        fill={getSvgFill()}
                      >
                        {c.char}
                      </text>
                  ))}
              </React.Fragment>
          ))}
      </g>
    </svg>
  );
}
