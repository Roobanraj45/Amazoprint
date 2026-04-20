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

  let stopElements: JSX.Element[] | null = null;
  
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

const SteppedCurvedText = ({ element, isSpotUv, shadowFilterDef }: { element: DesignElement, isSpotUv: boolean, shadowFilterDef: React.ReactNode }) => {
    const { content = '', fontSize = 16, letterSpacing = 0, fontFamily, fontWeight, fontStyle, textTransform } = element;
    const { radius = 100, value: rotation = 0, reverse = false } = element.textWarp || {};

    const effectiveRadius = reverse ? radius - fontSize * 0.8 : radius;
    const textStyle: React.CSSProperties = { fontSize, fontFamily, fontWeight, fontStyle };
    const dominantBaseline = 'auto';

    let transformedContent = content;
    if (textTransform === 'uppercase') {
        transformedContent = content.toUpperCase();
    } else if (textTransform === 'lowercase') {
        transformedContent = content.toLowerCase();
    } else if (textTransform === 'capitalize') {
        transformedContent = content.replace(/\b\w/g, char => char.toUpperCase());
    }

    const chars = transformedContent.split('');
    const approximateCharWidth = fontSize * 0.6;
    
    const totalTextWidth = (chars.length * approximateCharWidth) + (Math.max(0, chars.length - 1) * letterSpacing);
    const circumference = 2 * Math.PI * effectiveRadius;
    const totalAngle = (totalTextWidth / circumference) * 360;

    let currentAngle = rotation - (totalAngle / 2);

    const centerX = element.width / 2;
    const pathCenterY = element.height / 2;

    const gradientStops = (element.gradientStops || []).length > 0 ? element.gradientStops : [{ id: '1', color: '#000', weight: 1 }];
    const totalWeight = gradientStops.reduce((sum, stop) => sum + (stop.weight ?? 1), 0);

    const charElements = chars.map((char) => {
      const charAngleWidth = ((approximateCharWidth + letterSpacing) / circumference) * 360;
      const midAngle = currentAngle + charAngleWidth / 2;
      const angleRad = midAngle * (Math.PI / 180);

      const x = centerX + effectiveRadius * Math.cos(angleRad);
      const y = pathCenterY + effectiveRadius * Math.sin(angleRad);
      
      const charRotation = midAngle + (reverse ? -90 : 90);
      
      currentAngle += charAngleWidth;

      return {
        char,
        x,
        y,
        transform: `rotate(${charRotation}, ${x}, ${y})`
      };
    });

    const getCharFill = (charIndex: number) => {
      if (isSpotUv) return 'black';
      
      const charProgress = charIndex / (chars.length - 1 || 1);
      
      if (!totalWeight) return element.color || '#000000';

      let accumulatedWeight = 0;
      for (const stop of gradientStops) {
        const stopEnd = (accumulatedWeight + (stop.weight ?? 1)) / totalWeight;
        if (charProgress <= stopEnd) {
          return stop.color;
        }
        accumulatedWeight += (stop.weight ?? 1);
      }
      return gradientStops[gradientStops.length - 1]?.color || '#000000';
    };


    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} style={{ overflow: 'visible' }}>
            {shadowFilterDef}
            <g filter={shadowFilterDef ? `url(#shadow-${element.id})` : undefined}>
                 {charElements.map(({ char, x, y, transform }, index) => {
                    const fill = getCharFill(index);
                    const strokeAndFill = (
                      <g key={`char-group-${index}`}>
                        {element.textStrokeWidth && element.textStrokeWidth > 0 && !isSpotUv ? (
                          <text
                              x={x} y={y} transform={transform} style={textStyle}
                              textAnchor="middle" dominantBaseline={dominantBaseline}
                              stroke={element.textStrokeColor || '#000000'} strokeWidth={element.textStrokeWidth}
                              strokeLinejoin="round" fill="none"
                          >
                              {char}
                          </text>
                        ) : null}
                        <text
                            x={x} y={y} transform={transform} style={textStyle}
                            textAnchor="middle" dominantBaseline={dominantBaseline} fill={fill}
                        >
                            {char}
                        </text>
                      </g>
                    )
                    return strokeAndFill;
                })}
            </g>
        </svg>
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
  const isSpotUv = renderMode === 'spotuv';
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

  if (warpStyle === 'circle' && element.fillType === 'stepped-gradient') {
      return <SteppedCurvedText element={element} isSpotUv={isSpotUv} shadowFilterDef={shadowFilterDef} />;
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
    if ((element.fillType === 'gradient' || element.fillType === 'stepped-gradient') && element.gradientStops?.length > 0) {
      return `url(#grad-${element.id})`;
    }
    if (element.fillType === 'none') return 'none';
    return element.color || '#000000';
  };
  
  if (warpStyle === 'circle') {
    const { radius = 100, value: rotation = 0, reverse = false } = warp;
    const fontSize = element.fontSize || 16;
    const effectiveRadius = reverse ? radius - fontSize * 0.8 : radius;

    const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
      return {
        x: centerX + (r * Math.cos(angleInRadians)),
        y: centerY + (r * Math.sin(angleInRadians)),
      };
    };

    const centerX = element.width / 2;
    const pathCenterY = element.height / 2;

    const startAngle = rotation;
    const endAngle = rotation + 359.99;

    const start = polarToCartesian(centerX, pathCenterY, effectiveRadius, startAngle);
    const end = polarToCartesian(centerX, pathCenterY, effectiveRadius, endAngle);

    const largeArcFlag = 1;
    const sweepFlag = 1;

    const d = `M ${start.x} ${start.y} A ${effectiveRadius} ${effectiveRadius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;

    const textContent = (
      <textPath 
        href={`#path-${element.id}`} 
        startOffset="50%" 
        textAnchor="middle"
        side={reverse ? "right" : "left"}
      >
        {element.content}
      </textPath>
    );

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${element.width} ${element.height}`} 
        style={{ overflow: 'visible' }}
      >
        <defs>
            {!isSpotUv && <SvgGradientDefs element={element} product={product} />}
            <path id={`path-${element.id}`} d={d} fill="none" />
            {shadowFilterDef}
        </defs>
        
        <g filter={shadowFilterDef ? `url(#shadow-${element.id})` : undefined}>
          <text style={textStyle} dominantBaseline={reverse ? "hanging" : "auto"}>
            {element.textStrokeWidth && element.textStrokeWidth > 0 && !isSpotUv ? (
                React.cloneElement(textContent, {
                    stroke: element.textStrokeColor || '#000000',
                    strokeWidth: element.textStrokeWidth,
                    strokeLinejoin: 'round',
                    fill: 'none',
                })
            ) : null}
          </text>
           <text style={textStyle} dominantBaseline={reverse ? "hanging" : "auto"}>
              {React.cloneElement(textContent, {
                  fill: getSvgFill(),
              })}
          </text>
        </g>
      </svg>
    );
  }

  // -- Normal Flat Text --
  const wrappedLines: string[] = [];
  if (element.content) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
          context.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize || 16}px "${element.fontFamily || 'sans-serif'}"`;
          context.letterSpacing = `${element.letterSpacing || 0}px`;
          
          let contentToWrap = element.content;
          if (element.textTransform === 'uppercase') {
            contentToWrap = contentToWrap.toUpperCase();
          } else if (element.textTransform === 'lowercase') {
            contentToWrap = contentToWrap.toLowerCase();
          } else if (element.textTransform === 'capitalize') {
            contentToWrap = contentToWrap.replace(/\b\w/g, char => char.toUpperCase());
          }

          const allLines = contentToWrap.split('\n');
          allLines.forEach(lineContent => {
              const words = lineContent.split(' ');
              let currentLine = '';
              for (let i = 0; i < words.length; i++) {
                  const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
                  const metrics = context.measureText(testLine);
                  if (metrics.width > element.width && i > 0) {
                      wrappedLines.push(currentLine);
                      currentLine = words[i];
                  } else {
                      currentLine = testLine;
                  }
              }
              wrappedLines.push(currentLine);
          });
      } else {
          wrappedLines.push(...(element.content.split('\n')));
      }
  }

  const lineHeightPx = (element.lineHeight || 1.2) * (element.fontSize || 16);
  const totalTextHeight = wrappedLines.length * lineHeightPx;
  let startY = 0;

  switch (element.verticalAlign) {
      case 'top':
          startY = lineHeightPx * 0.8;
          break;
      case 'bottom':
          startY = element.height - totalTextHeight + (lineHeightPx * 0.8);
          break;
      case 'middle':
      default:
          startY = (element.height - totalTextHeight) / 2 + (lineHeightPx * 0.8);
          break;
  }
  
  return (
    <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
            {!isSpotUv && <SvgGradientDefs element={element} product={product} />}
            {!isSpotUv && element.fillType === 'image' && element.fillImageSrc && (
                <pattern id={`img-fill-${element.id}`} patternUnits="userSpaceOnUse" width={element.width} height={element.height}>
                    <image href={element.fillImageSrc} x="0" y="0" width={element.width} height={element.height} />
                </pattern>
            )}
            {shadowFilterDef}
        </defs>

      <g filter={shadowFilterDef ? `url(#shadow-${element.id})` : undefined}>
            <text style={textStyle} textAnchor={element.textAlign === 'center' ? 'middle' : element.textAlign === 'right' ? 'end' : 'start'}>
                {wrappedLines.map((line, i) => {
                    const xPos = element.textAlign === 'center' ? element.width / 2 :
                                element.textAlign === 'right' ? element.width :
                                0;
                    const yPos = startY + i * lineHeightPx;
                    
                    // Render stroke first, then fill
                    return (
                        <React.Fragment key={`line-${i}`}>
                            {element.textStrokeWidth && element.textStrokeWidth > 0 && !isSpotUv && (
                                <tspan x={xPos} y={yPos} stroke={element.textStrokeColor || '#000000'} strokeWidth={element.textStrokeWidth} strokeLinejoin="round" fill="none">
                                    {line}
                                </tspan>
                            )}
                            <tspan x={xPos} y={yPos} fill={getSvgFill()}>
                                {line}
                            </tspan>
                        </React.Fragment>
                    )
                })}
            </text>
      </g>
    </svg>
  );
}
