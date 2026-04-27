'use client';

import React, { useRef, useEffect, memo } from 'react';
import type { DesignElement, Guide, PathPoint, Product } from '@/lib/types';
import * as lucide from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { TextCanvasElement } from './text-canvas-element';
import { generatePathD } from '@/lib/utils';
import { renderBristleSegment, buildBrushTip, BrushEngineTip, BristleProfile } from '@/lib/brush-engine';


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
  } else { // 'gradient'
    if (stopsToUse.length < 2) {
      return stopsToUse.length ? stopsToUse[0].color : null;
    }
    // For smooth gradients, distribute stops evenly regardless of weight.
    colorStopsString = stopsToUse
      .map((s, i) => `${s.color} ${(i / (stopsToUse.length - 1)) * 100}%`)
      .join(', ');
  }

  return `linear-gradient(${gradientDirection || 0}deg, ${colorStopsString})`;
};


const SvgFillDefs = ({ element }: { element: DesignElement }) => {
  const { fillType, gradientDirection = 90, gradientStops, fillImageSrc } = element;

  const defs: JSX.Element[] = [];

  // Gradient support
  if ((fillType === 'gradient' || fillType === 'stepped-gradient') && gradientStops && gradientStops.length > 0) {
    let stopElements: JSX.Element[] | null = null;
    
    if (fillType === 'stepped-gradient') {
      const totalWeight = gradientStops.reduce((sum, stop) => sum + (stop.weight ?? 1), 0);
      if (totalWeight > 0) {
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
      }
    } else { // 'gradient'
      if (gradientStops.length >= 2) {
        stopElements = gradientStops.map((stop, index) => (
          <stop key={stop.id || index} offset={`${(index / (gradientStops.length - 1)) * 100}%`} stopColor={stop.color} />
        ));
      }
    }

    if (stopElements) {
      defs.push(
        <linearGradient
          key={`grad-${element.id}`}
          id={`grad-${element.id}`}
          gradientUnits="objectBoundingBox"
          gradientTransform={`rotate(${gradientDirection - 90} 0.5 0.5)`}
        >
          {stopElements}
        </linearGradient>
      );
    }
  }

  // Image fill support
  if (fillType === 'image' && fillImageSrc) {
    const scale = element.fillImageScale || 1;
    const offsetX = element.fillImageOffsetX || 0;
    const offsetY = element.fillImageOffsetY || 0;
    
    defs.push(
      <pattern 
        key={`img-fill-${element.id}`}
        id={`img-fill-${element.id}`} 
        patternUnits="objectBoundingBox" 
        patternContentUnits="userSpaceOnUse"
        width="1" 
        height="1"
      >
        <image 
          href={fillImageSrc} 
          width={element.width} 
          height={element.height} 
          preserveAspectRatio="xMidYMid slice" 
          transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}
          style={{ transformOrigin: 'center' }}
        />
      </pattern>
    );
  }

  if (defs.length === 0) return null;

  return <defs>{defs}</defs>;
};

const StyledQrCode = memo(function StyledQrCode({ element }: { element: DesignElement }) {
    const [dataUrl, setDataUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const prevUrlRef = React.useRef<string | null>(null);

    React.useEffect(() => {
        setIsLoading(true);
        let isMounted = true;
        
        import('qr-code-styling').then(module => {
            if (!isMounted) return;

            const QRCodeStyling = module.default;

            const options: any = {
                width: 300,
                height: 300,
                type: 'svg',
                data: element.qrValue || 'https://amazoprint.com',
                dotsOptions: {
                    color: element.qrColor || '#000000',
                    type: 'squares',
                },
                backgroundOptions: {
                    color: element.qrBgColor || '#FFFFFF',
                },
                cornersSquareOptions: {
                    type: 'square',
                    color: element.qrColor || '#000000',
                },
                cornersDotOptions: {
                    type: 'square',
                    color: element.qrColor || '#000000',
                },
                qrOptions: {
                    errorCorrectionLevel: element.qrLevel || 'M',
                },
            };

            switch (element.qrStylePreset) {
                case 'dots':
                    options.dotsOptions.type = 'dots';
                    options.cornersSquareOptions.type = 'dot';
                    options.cornersDotOptions.type = 'dot';
                    break;
                case 'rounded':
                    options.dotsOptions.type = 'rounded';
                    options.cornersSquareOptions.type = 'extra-rounded';
                    options.cornersDotOptions.type = 'square';
                    break;
                case 'extra-rounded':
                    options.dotsOptions.type = 'extra-rounded';
                    options.cornersSquareOptions.type = 'square';
                    options.cornersDotOptions.type = 'square';
                    break;
                case 'classy':
                    options.dotsOptions.type = 'classy';
                    options.cornersSquareOptions.type = 'square';
                    options.cornersDotOptions.type = 'square';
                    break;
                case 'classy-rounded':
                    options.dotsOptions.type = 'classy-rounded';
                    options.cornersSquareOptions.type = 'extra-rounded';
                    options.cornersDotOptions.type = 'square';
                    break;
                case 'fluid':
                    options.dotsOptions.type = 'classy';
                    options.cornersSquareOptions.type = 'dot';
                    options.cornersDotOptions.type = 'dot';
                    break;
                case 'grid':
                    options.dotsOptions.type = 'extra-rounded';
                    options.cornersSquareOptions.type = 'extra-rounded';
                    options.cornersDotOptions.type = 'extra-rounded';
                    break;
                default:
                    options.dotsOptions.type = 'squares';
                    options.cornersSquareOptions.type = 'square';
                    options.cornersDotOptions.type = 'square';
                    break;
            }
            
            if (element.qrIconSrc) {
                options.image = element.qrIconSrc;
                options.imageOptions = {
                    imageSize: (element.qrIconSize || 20) / 100,
                    margin: 4,
                    hideBackgroundDots: true,
                };
            }

            const qrCode = new QRCodeStyling(options);

            qrCode.getRawData('svg').then(blob => {
                if (blob && isMounted) {
                    const url = URL.createObjectURL(blob);
                    if (prevUrlRef.current) {
                        URL.revokeObjectURL(prevUrlRef.current);
                    }
                    prevUrlRef.current = url;
                    setDataUrl(url);
                    setIsLoading(false);
                }
            }).catch(err => {
                if(isMounted) setIsLoading(false);
                console.error("QR Generation error", err);
            });
        });

        return () => {
            isMounted = false;
            if (prevUrlRef.current) {
                URL.revokeObjectURL(prevUrlRef.current);
            }
        };
    }, [
        element.qrValue, 
        element.qrColor, 
        element.qrBgColor, 
        element.qrLevel, 
        element.qrIconSrc, 
        element.qrIconSize, 
        element.qrStylePreset
    ]);
    
    if (isLoading) {
        return <div className="w-full h-full flex items-center justify-center bg-muted/50"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
    }

    if (!dataUrl) {
        return <div className="w-full h-full flex items-center justify-center bg-muted/50 text-destructive text-xs p-2">Error generating QR</div>
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.qrBgColor || '#FFFFFF',
            backgroundImage: `url("${dataUrl}")`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }} />
    );
});
StyledQrCode.displayName = 'StyledQrCode';

type CanvasElementProps = {
  element: DesignElement;
  product: Product;
  isSelected: boolean;
  onSelect?: (isShift?: boolean) => void;
  onUpdate?: (id: string, newProps: Partial<DesignElement>) => void;
  canvasWidth: number;
  canvasHeight: number;
  guides: Guide[];
  otherElements: DesignElement[];
  onSmartGuidesChange?: (guides: Guide[]) => void;
  zoom: number;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  renderMode?: 'default' | 'cmyk' | 'spotuv' | 'foil';
  activeTool?: 'select' | 'pen' | 'brush' | 'spray';
  croppingElementId?: string | null;
  setCroppingElementId?: (id: string | null) => void;
};

type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';

const SNAP_THRESHOLD = 5;
const MIN_SIZE = 10;

const CanvasBrushRenderer = ({ element, isSpotUv }: { element: DesignElement, isSpotUv: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !element.path || element.path.length < 2) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const tip = (element.brushTip as BrushEngineTip) || 'chisel';
        const bristleTipData = buildBrushTip(tip, element.strokeWidth || 10);
        const color = isSpotUv ? '#000000' : (element.strokeColor || '#000000');

        for (let i = 1; i < element.path.length; i++) {
            const [x1, y1] = element.path[i - 1];
            const [x2, y2] = element.path[i];
            renderBristleSegment(
                ctx, x1, y1, x2, y2, 
                bristleTipData, tip, color, 
                element.brushFlow || 1,
                element.brushSoftness ?? 0.8
            );
        }
    }, [element, isSpotUv]);

    return (
        <canvas 
            ref={canvasRef}
            width={element.width}
            height={element.height}
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    );
};

const NonInteractiveContent = memo(({ element, product, renderMode }: { element: DesignElement, product: Product, renderMode?: 'default' | 'cmyk' | 'spotuv' | 'foil' }) => {
  const isSpotUv = renderMode === 'spotuv' || renderMode === 'foil';

    switch (element.type) {
      case 'text': {
        return <TextCanvasElement element={element} product={product} renderMode={renderMode} />;
      }
      case 'image': {
        if (isSpotUv) {
          return <div style={{ width: '100%', height: '100%', backgroundColor: 'black' }} />;
        }
    
        const filters = [
          `brightness(${element.filterBrightness || 1})`,
          `contrast(${element.filterContrast || 1})`,
          `saturate(${element.filterSaturate || 1})`,
          `grayscale(${element.filterGrayscale || 0})`,
          `sepia(${element.filterSepia || 0})`,
          `invert(${element.filterInvert || 0})`,
          `hue-rotate(${element.filterHueRotate || 0}deg)`,
          `blur(${element.filterBlur || 0}px)`,
        ].join(' ');
    
        const transforms = [
            `scaleX(${element.flipHorizontal ? -1 : 1})`,
            `scaleY(${element.flipVertical ? -1 : 1})`,
        ].join(' ');
        
        if (!element.src) {
          return (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
              <lucide.ImageIcon size={32} />
            </div>
          )
        }
    
        const fillType = element.fillType || 'solid';
        const hasSolidTint = fillType === 'solid' && element.color && element.color !== 'transparent';
        const hasGradientTint = (fillType === 'gradient' || fillType === 'stepped-gradient') && element.gradientStops && element.gradientStops.length > 0;
        const hasTint = (element.tintOpacity ?? 0) > 0 && (hasSolidTint || hasGradientTint);
        const hasCrop = element.crop && (element.crop.top > 0 || element.crop.right > 0 || element.crop.bottom > 0 || element.crop.left > 0);
    
        if (hasTint) {
            let maskSizeValue: 'cover' | 'contain' | '100% 100%' | 'auto' | undefined;
            if (element.objectFit === 'fill') maskSizeValue = '100% 100%';
            else if (element.objectFit === 'none') maskSizeValue = 'auto';
            else if (element.objectFit === 'contain' || element.objectFit === 'cover') maskSizeValue = element.objectFit;
            
            const getTintBackground = () => {
                if (fillType === 'gradient' || fillType === 'stepped-gradient') return createGradientString(element);
                return element.color;
            };
    
            let finalMaskSize: string | undefined = maskSizeValue;
            let finalMaskPosition = 'center';
    
            if (hasCrop) {
                const crop = element.crop!;
                const cropWidthRatio = 1 - crop.left - crop.right;
                const cropHeightRatio = 1 - crop.top - crop.bottom;
                
                finalMaskSize = `${100 / cropWidthRatio}% ${100 / cropHeightRatio}%`;
                
                const posX = -100 * crop.left / cropWidthRatio;
                const posY = -100 * crop.top / cropHeightRatio;
                finalMaskPosition = `${posX}% ${posY}%`;
            }
    
            const tintedStyle: React.CSSProperties = {
                width: '100%',
                height: '100%',
                background: getTintBackground(),
                opacity: element.tintOpacity,
                maskImage: `url("${element.src}")`,
                WebkitMaskImage: `url("${element.src}")`,
                maskSize: finalMaskSize,
                WebkitMaskSize: finalMaskSize as any,
                maskPosition: finalMaskPosition,
                WebkitMaskPosition: finalMaskPosition,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                filter: filters,
                transform: transforms,
            };
            return <div style={tintedStyle} />;
        }
        
        if (hasCrop) {
            const crop = element.crop!;
            const cropWidthRatio = 1 - crop.left - crop.right;
            const cropHeightRatio = 1 - crop.top - crop.bottom;
            
            const imageWrapperStyle: React.CSSProperties = {
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
            };
    
            const imageStyle: React.CSSProperties = {
                position: 'absolute',
                width: `${100 / cropWidthRatio}%`,
                height: `${100 / cropHeightRatio}%`,
                left: `${-100 * crop.left / cropWidthRatio}%`,
                top: `${-100 * crop.top / cropHeightRatio}%`,
                maxWidth: 'none',
                maxHeight: 'none',
                filter: filters,
                transform: transforms,
            };
    
            return (
                <div style={imageWrapperStyle}>
                    <img src={element.src} alt={element.id} style={imageStyle} />
                </div>
            );
        }
        
        const imageStyle: React.CSSProperties = {
          width: '100%',
          height: '100%',
          objectFit: element.objectFit,
          filter: filters,
          transform: transforms,
        };
        
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img src={element.src} alt={element.id} style={imageStyle} />
          </div>
        );
      }
      case 'qrcode': {
        if (isSpotUv) {
          return <div style={{ width: '100%', height: '100%', backgroundColor: 'black' }} />;
        }
        
        return <StyledQrCode element={element} />;
      }
      case 'path': {
        if (!element.pathPoints || element.pathPoints.length === 0) return null;
        
        const pathData = generatePathD(element.pathPoints, element.isPathClosed || false);
        
        const getFillForSvg = () => {
          if (isSpotUv) return 'black';
          if (element.fillType === 'none') return 'none';
          if (element.fillType === 'image' && element.fillImageSrc) return `url(#img-fill-${element.id})`;
          if ((element.fillType === 'gradient' || element.fillType === 'stepped-gradient') && element.gradientStops) {
            return `url(#grad-${element.id})`;
          }
          if (element.fillType === 'solid') {
            return element.color;
          }
          return 'none';
        };

        const showTint = !isSpotUv && (element.fillType === 'gradient' || element.fillType === 'stepped-gradient' || element.fillType === 'image') && element.color && (element.tintOpacity ?? 0) > 0;
        
        const svgStrokeProps = {
          stroke: isSpotUv ? 'black' : element.borderColor,
          strokeWidth: element.borderWidth,
          strokeDasharray: element.borderStyle === 'dashed' ? '4 2' : (element.borderStyle === 'dotted' ? '1 2' : 'none'),
        }

        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} style={{ overflow: 'visible' }} preserveAspectRatio="none">
            {!isSpotUv && <SvgFillDefs element={element} />}
            <path
              d={pathData}
              fill={getFillForSvg()}
              {...svgStrokeProps}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showTint && (
              <path
                d={pathData}
                fill={element.color}
                fillOpacity={element.tintOpacity}
              />
            )}
          </svg>
        );
      }
      case 'shape': {
        const hexToRgba = (hex: string, alpha: number) => {
          if (!hex || !hex.startsWith('#') || hex.length !== 7) return `rgba(0,0,0,${alpha})`;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
      
        const getBackgroundForDiv = () => {
          if (isSpotUv) return 'black';
          if (element.fillType === 'none') return 'transparent';

          if (element.fillType === 'image' && element.fillImageSrc) {
            const imgLayer = `url("${element.fillImageSrc}") center/cover no-repeat`;
            if (element.color && (element.tintOpacity ?? 0) > 0) {
                const tintColor = hexToRgba(element.color, element.tintOpacity!);
                const tintLayer = `linear-gradient(${tintColor}, ${tintColor})`;
                return `${tintLayer}, ${imgLayer}`;
            }
            return imgLayer;
          }

          const gradientString = createGradientString(element);
          if (gradientString) {
            if (element.color && (element.tintOpacity ?? 0) > 0) {
              const tintColor = hexToRgba(element.color, element.tintOpacity!);
              const tintLayer = `linear-gradient(${tintColor}, ${tintColor})`;
              return `${tintLayer}, ${gradientString}`;
            }
            return gradientString;
          }
          if (element.fillType === 'solid') {
            return element.color;
          }
          return 'transparent'; // Default for 'none' or other cases
        };
      
        const getFillForSvg = () => {
          if (isSpotUv) return 'black';
          if (element.fillType === 'none') return 'none';
          if (element.fillType === 'image' && element.fillImageSrc) return `url(#img-fill-${element.id})`;
          if ((element.fillType === 'gradient' || element.fillType === 'stepped-gradient') && element.gradientStops) {
            return `url(#grad-${element.id})`;
          }
          if (element.fillType === 'solid') {
            return element.color;
          }
          return 'none';
        };

        const showTint = !isSpotUv && (element.fillType === 'gradient' || element.fillType === 'stepped-gradient' || element.fillType === 'image') && element.color && (element.tintOpacity ?? 0) > 0;
        
        const divStrokeProps = {
          borderWidth: element.borderWidth || 0,
          borderColor: isSpotUv ? 'black' : element.borderColor,
          borderStyle: element.borderStyle,
        };
        
        const svgStrokeProps = {
          stroke: isSpotUv ? 'black' : element.borderColor,
          strokeWidth: element.borderWidth,
          strokeDasharray: element.borderStyle === 'dashed' ? '4 2' : (element.borderStyle === 'dotted' ? '1 2' : 'none'),
        }

        switch (element.shapeType) {
          case 'oval':
            return (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: getBackgroundForDiv(),
                  borderRadius: '50%',
                  ...divStrokeProps
                }}
              />
            );
          case 'line':
             return (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: isSpotUv ? 'black' : (element.borderColor || element.color),
                }}
              />
            );
          case 'triangle':
            return (
              <div style={{ width: '100%', height: '100%' }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {!isSpotUv && <SvgFillDefs element={element} />}
                  <polygon points="50,0 100,100 0,100" fill={getFillForSvg()} {...svgStrokeProps} />
                  {showTint && (
                     <polygon points="50,0 100,100 0,100" fill={element.color} fillOpacity={element.tintOpacity} />
                  )}
                </svg>
              </div>
            );
          case 'star':
            return (
              <div style={{ width: '100%', height: '100%' }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {!isSpotUv && <SvgFillDefs element={element} />}
                  <polygon
                    points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
                    fill={getFillForSvg()}
                    {...svgStrokeProps}
                  />
                   {showTint && (
                    <polygon
                      points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
                      fill={element.color}
                      fillOpacity={element.tintOpacity}
                    />
                  )}
                </svg>
              </div>
            );
          case 'hexagon':
            return (
                <div style={{ width: '100%', height: '100%' }}>
                    <svg 
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                    >
                        {!isSpotUv && <SvgFillDefs element={element} />}
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill={getFillForSvg()} {...svgStrokeProps} />
                        {showTint && (
                           <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill={element.color} fillOpacity={element.tintOpacity} />
                        )}
                    </svg>
                </div>
            );
          case 'rectangle':
             return (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: getBackgroundForDiv(),
                  borderRadius: element.borderRadius || 0,
                  ...divStrokeProps
                }}
              />
            );
          default: {
            // Fallback for all other shapes to render from lucide-react
            const shapeNamePascal = element.shapeType
              ? element.shapeType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
              : 'Square';
            
            const Icon = (lucide as any)[shapeNamePascal];

            if (Icon) {
              const svgFill = getFillForSvg();
              return (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="100%" height="100%" viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
                    {!isSpotUv && <SvgFillDefs element={element} />}
                    <Icon
                      width="100%"
                      height="100%"
                      stroke={isSpotUv ? 'black' : element.borderColor}
                      fill={svgFill}
                      strokeWidth={element.borderWidth}
                      strokeDasharray={element.borderStyle === 'dashed' ? '4 2' : (element.borderStyle === 'dotted' ? '1 2' : 'none')}
                    />
                    {showTint && (
                        <Icon 
                           width="100%"
                           height="100%"
                           fill={element.color}
                           fillOpacity={element.tintOpacity}
                        />
                    )}
                  </svg>
                </div>
              );
            }

            // If it's not a special shape and not a lucide icon, render a default rectangle
            return (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: getBackgroundForDiv(),
                  borderRadius: element.borderRadius || 0,
                  ...divStrokeProps
                }}
              />
            );
          }
        }
      }
      case 'brush': {
        if (!element.path || element.path.length < 2) return null;
        
        const isAdvanced = ['chisel', 'dry_bristle', 'rake', 'charcoal', 'ink', 'spray', 'airbrush', 'soft_round', 'hard_round', 'glow', 'eraser'].includes(element.brushTip || '');
        
        if (isAdvanced) {
            return (
                <CanvasBrushRenderer 
                    element={element} 
                    isSpotUv={!!isSpotUv}
                />
            );
        }

        // Fallback to SVG for simple brushes
        const points = (element.path as [number, number][]).map(([px, py]) => `${px},${py}`).join(' ');
        const hardness = element.brushHardness ?? 0.5;
        // For round/square tips use a smooth polyline; for calligraphy use a skewed line cap
        const lineCap: 'round' | 'square' | 'butt' =
          element.brushTip === 'square' || element.brushTip === 'calligraphy' ? 'square' : 'round';
        const lineJoin: 'round' | 'bevel' | 'miter' = 'round';
        // Simulate hardness via a blur filter (soft brush → more blur)
        const blurAmount = (1 - hardness) * (element.strokeWidth ?? 10) * 0.25;
        const filterId = `brush-blur-${element.id}`;

        return (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${element.width} ${element.height}`}
            style={{ overflow: 'visible', display: 'block' }}
            preserveAspectRatio="none"
          >
            {blurAmount > 0.5 && (
              <defs>
                <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation={blurAmount} />
                </filter>
              </defs>
            )}
            <polyline
              points={points}
              fill="none"
              stroke={isSpotUv ? 'black' : (element.strokeColor || element.color || '#000000')}
              strokeWidth={element.strokeWidth ?? 10}
              strokeLinecap={lineCap}
              strokeLinejoin={lineJoin}
              filter={blurAmount > 0.5 ? `url(#${filterId})` : undefined}
            />
          </svg>
        );
      }
      default:
        return null;
    }
});
NonInteractiveContent.displayName = 'NonInteractiveContent';

const _CanvasElement = ({
  element,
  product,
  isSelected,
  onSelect,
  onUpdate,
  canvasWidth,
  canvasHeight,
  guides,
  otherElements,
  onSmartGuidesChange,
  zoom,
  onInteractionStart,
  onInteractionEnd,
  renderMode = 'default',
  activeTool = 'select',
  croppingElementId,
  setCroppingElementId,
}: CanvasElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  const resizeRef = useRef<ResizeHandle | null>(null);
  const dragRef = useRef(false);

  const startRef = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fontSize: 0,
    children: [] as DesignElement[]
  });
  
  if (element.visible === false) {
      return null;
  }

  if (renderMode === 'cmyk' && element.spotUv) {
    return null;
  }
  if (renderMode === 'spotuv' && (!element.spotUv || element.foilId !== undefined)) {
    return null;
  }
  if (renderMode === 'foil' && (!element.spotUv || element.foilId === undefined)) {
    return null;
  }

  const isCroppingThisElement = croppingElementId === element.id;
  const isInteractive = !!onUpdate && activeTool === 'select' && !element.locked;

  const handleMouseUp = () => {
    dragRef.current = false;
    resizeRef.current = null;

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleMouseUp);
    onInteractionEnd?.();
    onSmartGuidesChange?.([]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInteractionStart?.();
    onSelect?.(e.shiftKey);

    dragRef.current = true;
    
    if (elementRef.current) {
        elementRef.current.style.cursor = 'grabbing';
    }

    startRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize || 0,
      children: element.children || []
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleDragMove = (e: MouseEvent) => {
    if (!dragRef.current) return;

    let newX = startRef.current.x + (e.clientX - startRef.current.mouseX) / zoom;
    let newY = startRef.current.y + (e.clientY - startRef.current.mouseY) / zoom;
    
    const snapThreshold = SNAP_THRESHOLD / zoom;
    const activeSmartGuides: Guide[] = [];

    // --- Smart Guides Logic ---
    const elementSnapPoints = {
        v: [newX, newX + element.width / 2, newX + element.width],
        h: [newY, newY + element.height / 2, newY + element.height]
    };

    const targetSnapPoints = {
        v: [canvasWidth / 2],
        h: [canvasHeight / 2]
    };

    otherElements.forEach(other => {
        if (!other || other.locked) return;
        targetSnapPoints.v.push(other.x, other.x + other.width / 2, other.x + other.width);
        targetSnapPoints.h.push(other.y, other.y + other.height / 2, other.y + other.height);
    });

    guides.forEach(guide => {
      if (guide.orientation === 'vertical') {
        targetSnapPoints.v.push(guide.position);
      } else {
        targetSnapPoints.h.push(guide.position);
      }
    });

    let bestSnapX = { dist: Infinity, newPos: newX, guidePos: 0 };
    let bestSnapY = { dist: Infinity, newPos: newY, guidePos: 0 };

    elementSnapPoints.v.forEach((elementPoint, i) => {
        targetSnapPoints.v.forEach(targetPoint => {
            const dist = Math.abs(elementPoint - targetPoint);
            if (dist < snapThreshold && dist < bestSnapX.dist) {
                bestSnapX = {
                    dist,
                    newPos: newX - (elementPoint - targetPoint),
                    guidePos: targetPoint,
                };
            }
        });
    });

    elementSnapPoints.h.forEach((elementPoint) => {
        targetSnapPoints.h.forEach(targetPoint => {
            const dist = Math.abs(elementPoint - targetPoint);
            if (dist < snapThreshold && dist < bestSnapY.dist) {
                bestSnapY = {
                    dist,
                    newPos: newY - (elementPoint - targetPoint),
                    guidePos: targetPoint,
                };
            }
        });
    });

    if (bestSnapX.dist < Infinity) {
        newX = bestSnapX.newPos;
        activeSmartGuides.push({ id: `smart-guide-v-${bestSnapX.guidePos}`, orientation: 'vertical', position: bestSnapX.guidePos });
    }
    if (bestSnapY.dist < Infinity) {
        newY = bestSnapY.newPos;
        activeSmartGuides.push({ id: `smart-guide-h-${bestSnapY.guidePos}`, orientation: 'horizontal', position: bestSnapY.guidePos });
    }
    
    onSmartGuidesChange?.(activeSmartGuides);
    onUpdate?.(element.id, { x: newX, y: newY });
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    handle: ResizeHandle
  ) => {
    e.stopPropagation();
    onInteractionStart?.();
    onSelect?.(e.shiftKey);
    resizeRef.current = handle;
    startRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize || 0,
      children: element.children || []
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizeRef.current) return;

    const handle = resizeRef.current;
    const { x, y, width, height, mouseX, mouseY, fontSize, children } = startRef.current;
    
    const dx = (e.clientX - mouseX) / zoom;
    const dy = (e.clientY - mouseY) / zoom;

    let newWidth = width;
    let newHeight = height;
    let newX = x;
    let newY = y;
    
    if (handle.includes('right')) newWidth = Math.max(MIN_SIZE, width + dx);
    if (handle.includes('left')) {
      newWidth = Math.max(MIN_SIZE, width - dx);
      newX = x + width - newWidth;
    }
    if (handle.includes('bottom')) newHeight = Math.max(MIN_SIZE, height + dy);
    if (handle.includes('top')) {
      newHeight = Math.max(MIN_SIZE, height - dy);
      newY = y + height - newHeight;
    }

    const newProps: Partial<DesignElement> = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
    
    const isCornerResize = handle.includes('-');
    const isHorizontalResize = handle === 'left' || handle === 'right';

    if (element.type === 'text') {
        const widthChanged = newWidth !== width;
        if ((isCornerResize || isHorizontalResize) && widthChanged && width > 0) {
            const scale = newWidth / width;
            if (isFinite(scale) && scale > 0) {
                newProps.fontSize = Math.max(8, fontSize * scale);
            }
        }
    } else if (isCornerResize) { // Proportional resize for other elements on corner drag
        const aspectRatio = width / height;
        if (Math.abs(dx) > Math.abs(dy)) {
            newHeight = newWidth / aspectRatio;
        } else {
            newWidth = newHeight * aspectRatio;
        }
        if (handle.includes('top')) newY = y + height - newHeight;
        if (handle.includes('left')) newX = x + width - newWidth;

        newProps.x = newX;
        newProps.y = newY;
        newProps.width = newWidth;
        newProps.height = newHeight;
    }
    
    if (element.type === 'group' || element.type === 'path') {
      const scaleX = newWidth / width;
      const scaleY = newHeight / height;

      if(isFinite(scaleX) && isFinite(scaleY) && scaleX > 0 && scaleY > 0) {
        if(element.type === 'group' && children) {
          newProps.children = children.map(child => {
            const scaledChild: DesignElement = {
              ...child,
              x: child.x * scaleX,
              y: child.y * scaleY,
              width: child.width * scaleX,
              height: child.height * scaleY,
            };
            if (child.type === 'text') {
              scaledChild.fontSize = (child.fontSize || 0) * Math.min(scaleX, scaleY);
            }
            return scaledChild;
          });
        }
        if (element.type === 'path' && element.pathPoints) {
          newProps.pathPoints = element.pathPoints.map(p => ({
            ...p,
            x: p.x * scaleX,
            y: p.y * scaleY,
            cp1x: p.cp1x * scaleX,
            cp1y: p.cp1y * scaleY,
            cp2x: p.cp2x * scaleX,
            cp2y: p.cp2y * scaleY,
          }));
        }
      }
    }

    onUpdate?.(element.id, newProps);
  };
  
  const existingShadow = element.boxShadow && element.boxShadow !== 'none' ? `${element.boxShadow}` : 'none';
  const isWarped = element.type === 'text' && element.textWarp && element.textWarp.style !== 'none';

  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation}deg) skewX(${element.skewX || 0}deg) skewY(${element.skewY || 0}deg)`,
    pointerEvents: isInteractive ? 'auto' : 'none',
    outline: isSelected && !element.locked && !isCroppingThisElement ? `${2 / zoom}px solid hsl(var(--primary))` : 'none',
    outlineOffset: `${2 / zoom}px`,
    userSelect: 'none',
    opacity: (renderMode === 'spotuv' || renderMode === 'foil') ? 1 : element.opacity,
    boxShadow: (renderMode === 'spotuv' || renderMode === 'foil') ? 'none' : (element.spotUv ? `0 0 8px 2px hsla(var(--accent), 0.8), ${existingShadow}` : existingShadow),
    backgroundColor: (renderMode === 'spotuv' || renderMode === 'foil') ? 'transparent' : ((element.type === 'text' || element.type === 'group') ? element.backgroundColor : 'transparent'),
    borderWidth: element.type === 'shape' || element.type === 'qrcode' || element.type === 'path' ? 0 : element.borderWidth,
    borderColor: renderMode === 'spotuv' ? 'transparent' : (element.type === 'shape' || element.type === 'qrcode' || element.type === 'path' ? 'transparent' : element.borderColor),
    borderStyle: element.type === 'shape' || element.type === 'qrcode' || element.type === 'path' ? 'solid' : element.borderStyle,
    borderRadius: renderMode === 'spotuv' ? 0 : (element.type !== 'shape' ? element.borderRadius : 0),
    overflow: (isWarped || element.type === 'path') ? 'visible' : 'hidden', // Ensure paths can render curves slightly outside bounds
  };
  
  const resizeHandles: ResizeHandle[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'];

  const getHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
      const handleSize = 8 / zoom;
      const style: React.CSSProperties = {
          position: 'absolute',
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          backgroundColor: 'hsl(var(--primary))',
          border: `${1 / zoom}px solid white`,
          borderRadius: '50%',
          zIndex: 1
      };
      const offset = `-${handleSize / 2}px`;
      if (handle.includes('top')) style.top = offset;
      if (handle.includes('bottom')) style.bottom = offset;
      if (handle.includes('left')) style.left = offset;
      if (handle.includes('right')) style.right = offset;
      if (handle === 'top' || handle === 'bottom') {
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        style.cursor = 'ns-resize';
      }
      if (handle === 'left' || handle === 'right') {
        style.top = '50%';
        style.transform = 'translateY(-50%)';
        style.cursor = 'ew-resize';
      }
      if (handle === 'top-left' || handle === 'bottom-right') style.cursor = 'nwse-resize';
      if (handle === 'top-right' || handle === 'bottom-left') style.cursor = 'nesw-resize';
      
      return style;
  }

  const renderContent = () => {
    if (element.type === 'group') {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {element.children?.map(child => {
            if (renderMode === 'cmyk' && child.spotUv) return null;
            if (renderMode === 'spotuv' && !child.spotUv) return null;

            const childStyle: React.CSSProperties = {
              position: 'absolute',
              left: child.x,
              top: child.y,
              width: child.width,
              height: child.height,
              transform: `rotate(${child.rotation}deg)`,
              opacity: child.opacity,
              backgroundColor: renderMode === 'spotuv' || child.type === 'image' || child.type === 'qrcode' || child.type === 'path' ? 'transparent' : child.backgroundColor,
              boxShadow: renderMode === 'spotuv' ? 'none' : child.boxShadow,
              borderWidth: renderMode === 'spotuv' ? 0 : child.borderWidth,
              borderColor: renderMode === 'spotuv' ? 'transparent' : child.borderColor,
              borderStyle: child.borderStyle,
            };
            return (
              <div key={child.id} style={childStyle}>
                <NonInteractiveContent element={child} product={product} renderMode={renderMode} />
              </div>
            );
          })}
        </div>
      );
    }
    return <NonInteractiveContent element={element} product={product} renderMode={renderMode} />
  };

  return (
    <div
      ref={elementRef}
      style={elementStyle}
      onMouseDown={isInteractive && !isCroppingThisElement ? handleMouseDown : undefined}
    >
      {renderContent()}
      {isSelected && isInteractive && !isCroppingThisElement && renderMode !== 'spotuv' && renderMode !== 'foil' && resizeHandles.map(handle => (
          <div key={handle} style={getHandleStyle(handle)} onMouseDown={(e) => handleResizeMouseDown(e, handle)}/>
      ))}
      {isCroppingThisElement && (
        <div className="absolute inset-0 border-2 border-dashed border-primary pointer-events-none">
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
    </div>
  );
}

export const CanvasElement = memo(_CanvasElement);
