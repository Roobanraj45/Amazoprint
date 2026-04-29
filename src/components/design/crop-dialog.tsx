'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { DesignElement } from '@/lib/types';
import { resolveImagePath, cn } from '@/lib/utils';
import {
  Crop as CropIcon,
  Square,
  RectangleHorizontal,
  Maximize,
  RotateCcw,
  Pipette,
  Eraser,
  Eye,
  Loader2,
} from 'lucide-react';
import { removeBackground } from '@/ai/flows/remove-background-flow';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CropData = { top: number; right: number; bottom: number; left: number };

export type CropDialogResult = {
  processedSrc: string;
  crop: CropData;
  removeColor: string | null;
  threshold: number;
  /** width / height of the processed output — lets parent resize the element correctly */
  newAspectRatio: number;
};

type CropDialogProps = {
  element: DesignElement;
  onClose: () => void;
  onApply: (data: CropDialogResult) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Pixel helpers
// ─────────────────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const n = parseInt(
    c.length === 3 ? c.split('').map((x) => x + x).join('') : c,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Load any src (URL, blob URL, or data-URL) into a canvas.
 * For regular URLs we fetch as blob first to avoid CORS canvas-taint errors.
 * For data-URLs we load directly (fetch of data-URLs is unnecessary overhead).
 */
async function srcToCanvas(src: string): Promise<HTMLCanvasElement> {
  const isDataUrl = src.startsWith('data:');

  const objectUrl = isDataUrl
    ? src
    : await fetch(src, { mode: 'cors' })
        .catch(() => fetch(src))           // retry without CORS hint
        .then((r) => r.blob())
        .then((b) => URL.createObjectURL(b));

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (!isDataUrl) URL.revokeObjectURL(objectUrl);
      const c = document.createElement('canvas');
      c.width  = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')!.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = (e) => { if (!isDataUrl) URL.revokeObjectURL(objectUrl); reject(e); };
    img.src = objectUrl;
  });
}

/**
 * BFS flood-fill from all four image edges.
 * Only edge-connected pixels within `threshold` distance of `targetHex` are
 * made transparent — interior pixels of the same colour are left intact.
 */
function floodFillRemove(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  targetHex: string,
  threshold: number,
) {
  const [tr, tg, tb] = hexToRgb(targetHex);
  const imageData    = ctx.getImageData(0, 0, w, h);
  const { data }     = imageData;
  const visited      = new Uint8Array(w * h);

  const matches = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return data[i + 3] > 0 && colorDist(data[i], data[i + 1], data[i + 2], tr, tg, tb) <= threshold;
  };

  const queue: number[] = [];
  const enqueue = (x: number, y: number) => {
    const pos = y * w + x;
    if (visited[pos] || !matches(x, y)) return;
    visited[pos] = 1;
    queue.push(x, y);
  };

  for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { enqueue(0, y); enqueue(w - 1, y); }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    data[(y * w + x) * 4 + 3] = 0;

    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const pos = ny * w + nx;
      if (!visited[pos] && matches(nx, ny)) { visited[pos] = 1; queue.push(nx, ny); }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert a ReactCrop PixelCrop (in *rendered* display pixels) to natural image pixels.
 *
 * ReactCrop's `onComplete` gives coordinates relative to the *displayed* image size,
 * NOT the natural image size. We must scale by (naturalWidth / displayWidth) before
 * using the values to slice the source canvas.
 */
function toNaturalPixelCrop(
  displayCrop: PixelCrop,
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): PixelCrop {
  const scaleX = naturalWidth  / displayWidth;
  const scaleY = naturalHeight / displayHeight;
  return {
    unit: 'px',
    x:      Math.round(displayCrop.x      * scaleX),
    y:      Math.round(displayCrop.y      * scaleY),
    width:  Math.round(displayCrop.width  * scaleX),
    height: Math.round(displayCrop.height * scaleY),
  };
}

/**
 * Full pipeline: load → BG remove → crop → PNG data-URL.
 * Returns the data-URL and the final output dimensions.
 */
async function processImage(
  src: string,
  naturalCrop: PixelCrop,        // already in natural-image pixels
  removeColor: string | null,
  threshold: number,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const canvas = await srcToCanvas(src);
  const ctx    = canvas.getContext('2d', { willReadFrequently: true })!;

  if (removeColor) {
    floodFillRemove(ctx, canvas.width, canvas.height, removeColor, threshold);
  }

  const outW = Math.max(1, Math.round(naturalCrop.width));
  const outH = Math.max(1, Math.round(naturalCrop.height));

  const out = document.createElement('canvas');
  out.width  = outW;
  out.height = outH;
  out.getContext('2d')!.drawImage(
    canvas,
    Math.round(naturalCrop.x), Math.round(naturalCrop.y), outW, outH,
    0, 0, outW, outH,
  );

  return { dataUrl: out.toDataURL('image/png'), width: outW, height: outH };
}

/**
 * Sample a pixel colour at display coordinates (clientX/Y) from an img element.
 * Falls back to blob-fetch when the image would taint the canvas (cross-origin).
 */
async function samplePixelColor(
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
  fallbackSrc: string,
): Promise<string | null> {
  const rect   = img.getBoundingClientRect();
  const scaleX = img.naturalWidth  / rect.width;
  const scaleY = img.naturalHeight / rect.height;
  const px     = Math.round((clientX - rect.left) * scaleX);
  const py     = Math.round((clientY - rect.top)  * scaleY);

  const readPixel = (canvas: HTMLCanvasElement): string | null => {
    const [r, g, b, a] = canvas.getContext('2d', { willReadFrequently: true })!
      .getImageData(px, py, 1, 1).data;
    if (a === 0) return null;
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  };

  try {
    // Fast path: same-origin or already-loaded with crossOrigin attribute
    const c = document.createElement('canvas');
    c.width  = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    return readPixel(c);
  } catch {
    // Cross-origin taint → fetch as blob
    const canvas = await srcToCanvas(fallbackSrc);
    return readPixel(canvas);
  }
}

function makeFullPixelCrop(naturalWidth: number, naturalHeight: number): PixelCrop {
  return { unit: 'px', x: 0, y: 0, width: naturalWidth, height: naturalHeight };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CropDialog({ element, onClose, onApply }: CropDialogProps) {
  // ── Crop ───────────────────────────────────────────────────────────────────
  const [crop, setCrop]                     = useState<Crop>();
  const [completedCrop, setCompletedCrop]   = useState<PixelCrop | null>(null);
  const [aspect, setAspect]                 = useState<number | undefined>(undefined);
  const [currentSrc, setCurrentSrc]         = useState(resolveImagePath(element.src));

  // ── BG remover ─────────────────────────────────────────────────────────────
  const [removeColor, setRemoveColor]       = useState<string | null>(element.removeColor ?? null);
  const [threshold, setThreshold]           = useState<number>(element.colorThreshold ?? 30);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [isRemovingBg, setIsRemovingBg]     = useState(false);

  // ── Preview ────────────────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing]     = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);

  const imgRef    = useRef<HTMLImageElement>(null);
  const aspectRef = useRef(aspect);
  useEffect(() => { aspectRef.current = aspect; }, [aspect]);

  // Revoke preview object-URL on unmount to prevent memory leaks
  useEffect(() => () => { if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const invalidatePreview = useCallback(() => {
    setIsPreviewing(false);
    setPreviewUrl((old) => {
      if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
      return null;
    });
  }, []);

  /**
   * Build a natural-pixel crop from the current state.
   * If no crop has been completed yet, returns the full image.
   */
  const getNaturalCrop = useCallback((): PixelCrop => {
    const img = imgRef.current;
    if (!img) return makeFullPixelCrop(1, 1);

    const { naturalWidth, naturalHeight, width: displayW, height: displayH } = img;

    if (!completedCrop) {
      return makeFullPixelCrop(naturalWidth, naturalHeight);
    }

    return toNaturalPixelCrop(completedCrop, displayW, displayH, naturalWidth, naturalHeight);
  }, [completedCrop]);

  // ── Image load ─────────────────────────────────────────────────────────────
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: nw, naturalHeight: nh, width: dw, height: dh } = e.currentTarget;

      let initial: Crop;
      if (element.crop) {
        initial = {
          unit: '%',
          x:      element.crop.left  * 100,
          y:      element.crop.top   * 100,
          width:  (1 - element.crop.left - element.crop.right)  * 100,
          height: (1 - element.crop.top  - element.crop.bottom) * 100,
        };
      } else {
        initial = centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, aspectRef.current ?? nw / nh, dw, dh),
          dw,
          dh,
        );
      }

      setCrop(initial);
      // seed completedCrop so Save works without a drag interaction
      setCompletedCrop(convertToPixelCrop(initial, dw, dh));
    },
    [element.crop],
  );

  // ── Aspect change ──────────────────────────────────────────────────────────
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const { naturalWidth: nw, naturalHeight: nh, width: dw, height: dh } = img;
    const next = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect ?? nw / nh, dw, dh),
      dw,
      dh,
    );
    setCrop(next);
    setCompletedCrop(convertToPixelCrop(next, dw, dh));
    invalidatePreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  // ── Color pick ─────────────────────────────────────────────────────────────
  const handleImageClick = useCallback(
    async (e: React.MouseEvent<HTMLImageElement>) => {
      if (!isPickingColor || !imgRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const color = await samplePixelColor(
        imgRef.current,
        e.clientX,
        e.clientY,
        currentSrc,
      );

      if (color) setRemoveColor(color);
      setIsPickingColor(false);
      invalidatePreview();
    },
    [isPickingColor, currentSrc, invalidatePreview],
  );

  // ── Preview ────────────────────────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    if (!removeColor) return;
    setIsProcessing(true);
    try {
      const naturalCrop = getNaturalCrop();
      const { dataUrl } = await processImage(
        currentSrc,
        naturalCrop,
        removeColor,
        threshold,
      );
      setPreviewUrl((old) => { if (old && old.startsWith('blob:')) URL.revokeObjectURL(old); return dataUrl; });
      setIsPreviewing(true);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [getNaturalCrop, removeColor, threshold, currentSrc]);

  // -- AI Background Removal ---
  const handleAIRemoveBackground = async () => {
    setIsRemovingBg(true);
    try {
      const result = await removeBackground({ imageUrl: currentSrc });
      if (result.imageUrl) {
        setCurrentSrc(result.imageUrl);
        // Reset crop and color removal as the image has fundamentally changed
        handleReset();
      }
    } catch (error) {
      console.error("AI background removal failed", error);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // ── Apply ──────────────────────────────────────────────────────────────────
  const handleApply = useCallback(async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);

    try {
      const naturalCrop = getNaturalCrop();

      const { dataUrl, width: outW, height: outH } = await processImage(
        currentSrc,
        naturalCrop,
        removeColor,
        threshold,
      );

      onApply({
        processedSrc: dataUrl,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        removeColor,
        threshold,
        newAspectRatio: outW / outH,
      });

      onClose();
    } catch (err) {
      console.error('Apply error:', err);
      setIsProcessing(false);
    }
  }, [getNaturalCrop, currentSrc, removeColor, threshold, onApply, onClose]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setAspect(undefined);
    setRemoveColor(null);
    setCurrentSrc(resolveImagePath(element.src));
    invalidatePreview();

    const img = imgRef.current;
    if (img) {
      const { width: dw, height: dh } = img;
      const full: Crop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };
      setCrop(full);
      setCompletedCrop(convertToPixelCrop(full, dw, dh));
    }
  }, [invalidatePreview, element.src]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const displaySize = completedCrop
    ? `${Math.round(completedCrop.width)} × ${Math.round(completedCrop.height)}`
    : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

        <DialogHeader className="p-4 border-b shrink-0 bg-background">
          <DialogTitle className="flex items-center gap-2">
            <CropIcon size={18} className="text-primary" />
            Image Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="w-64 bg-background p-4 space-y-6 border-r shrink-0 overflow-y-auto">

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground">
                Aspect Ratio
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    [undefined, <Maximize            key="free" size={12} />, 'Free'],
                    [1,         <Square              key="11"   size={12} />, '1:1'],
                    [4 / 3,     <RectangleHorizontal key="43"   size={12} />, '4:3'],
                    [16 / 9,    <RectangleHorizontal key="169"  size={12} />, '16:9'],
                  ] as const
                ).map(([val, icon, label]) => (
                  <Button
                    key={label}
                    variant={aspect === val ? 'secondary' : 'outline'}
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => {
                      setAspect(val as number | undefined);
                      setIsPickingColor(false);
                    }}
                  >
                    {icon}{label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <p className="text-[10px] font-bold text-muted-foreground tracking-tight flex items-center gap-2">
                <Eraser size={12} /> Manual Background Remover
              </p>

            <Button
              variant={isPickingColor ? 'destructive' : 'outline'}
              className="w-full gap-2 h-10"
              onClick={() => setIsPickingColor((v) => !v)}
            >
              <Pipette size={14} />
              {isPickingColor ? 'Cancel — click image' : 'Pick Color from Image'}
            </Button>

            {removeColor && (
              <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: removeColor }}
                    />
                    <span className="text-xs font-mono">{removeColor.toUpperCase()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    title="Clear colour"
                    onClick={() => { setRemoveColor(null); invalidatePreview(); }}
                  >
                    <RotateCcw size={12} />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-3 text-[11px] font-bold text-foreground">
                    <span>Tolerance</span>
                    <span>{threshold}</span>
                  </div>
                  <Slider
                    value={[threshold]}
                    onValueChange={([v]) => { setThreshold(v); invalidatePreview(); }}
                    min={0}
                    max={150}
                    step={1}
                  />
                  <Label className="text-[10px] font-bold">Zoom</Label>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Higher = remove more similar shades
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handlePreview}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                  {isPreviewing ? 'Refresh Preview' : 'Preview Result'}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
             <p className="text-[10px] font-bold text-muted-foreground tracking-tight flex items-center gap-2">
              AI Tools
            </p>
            <Button
              variant="outline"
              className="w-full gap-2 h-10"
              onClick={handleAIRemoveBackground}
              disabled={isRemovingBg}
            >
              {isRemovingBg ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
              {isRemovingBg ? "Processing..." : "Remove Background"}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={handleReset}
          >
            <RotateCcw size={14} className="mr-2" /> Reset All
          </Button>
        </div>

        {/* ── Workspace ───────────────────────────────────────────────── */}
        <div
          className="flex-1 relative flex items-center justify-center p-6 overflow-auto"
          style={{
            backgroundImage: 'repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className={cn("flex flex-col items-center gap-3", !isPreviewing && "hidden")}>
            {previewUrl && (
              <>
                <span className="text-xs text-zinc-300 bg-zinc-800/80 px-3 py-1 rounded-full">
                  Preview — exactly what will be saved
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview result"
                  style={{ maxHeight: 'calc(90vh - 180px)' }}
                  className="w-auto object-contain"
                />
                <Button size="sm" variant="secondary" onClick={() => setIsPreviewing(false)}>
                  ← Back to Editor
                </Button>
              </>
            )}
          </div>

          <div className={cn("w-full h-full flex items-center justify-center", isPreviewing && "hidden")}>
            <ReactCrop
              crop={isPickingColor ? undefined : crop}
              onChange={(c) => { if (!isPickingColor) setCrop(c); invalidatePreview(); }}
              onComplete={(c) => { if (!isPickingColor) setCompletedCrop(c); }}
              aspect={aspect}
              disabled={isPickingColor}
              keepSelection
              className="max-h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Edit target"
                src={currentSrc}
                key={currentSrc}
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                onClick={handleImageClick}
                draggable={false}
                style={{
                  maxHeight: 'calc(90vh - 140px)',
                  cursor: isPickingColor ? 'crosshair' : 'default',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  display: 'block',
                }}
                className="w-auto object-contain"
              />
            </ReactCrop>
          </div>

          {isPickingColor && !isPreviewing && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-full text-[9px] font-bold text-white/60 border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold shadow-2xl animate-pulse flex items-center gap-2">
                <Pipette size={16} />
                Click on the image to select background colour
              </div>
              <div className="bg-zinc-800/90 text-zinc-300 px-3 py-1 rounded-md text-[10px] tracking-tight font-semibold border border-zinc-700">
                Crop tool temporarily paused
              </div>
            </div>
          )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-background shrink-0">
          <div className="flex w-full items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {displaySize ? `${displaySize} px (display)` : 'Drag handles to crop'}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={isProcessing}>
                {isProcessing && <Loader2 size={14} className="mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
