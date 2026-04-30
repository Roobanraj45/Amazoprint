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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { resolveImagePath, cn } from '@/lib/utils';
import { removeBackground } from '@imgly/background-removal';
import { Slider } from '@/components/ui/slider';
import type { DesignElement } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
  Sparkles,
} from 'lucide-react';

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
 * Full pipeline: load → crop → PNG data-URL.
 * Returns the data-URL and the final output dimensions.
 */
async function processImage(
  src: string,
  naturalCrop: PixelCrop,        // already in natural-image pixels
): Promise<{ dataUrl: string; width: number; height: number }> {
  const canvas = await srcToCanvas(src);
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

function makeFullPixelCrop(naturalWidth: number, naturalHeight: number): PixelCrop {
  return { unit: 'px', x: 0, y: 0, width: naturalWidth, height: naturalHeight };
}

function toNaturalPixelCrop(
  pixelCrop: PixelCrop,
  displayW: number,
  displayH: number,
  naturalWidth: number,
  naturalHeight: number,
): PixelCrop {
  const scaleX = naturalWidth / displayW;
  const scaleY = naturalHeight / displayH;

  return {
    unit: 'px',
    x: pixelCrop.x * scaleX,
    y: pixelCrop.y * scaleY,
    width: pixelCrop.width * scaleX,
    height: pixelCrop.height * scaleY,
  };
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


  // ── Preview ────────────────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing]     = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);
  const { toast }                           = useToast();

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



  // ── AI Tools ──────────────────────────────────────────────────────────────
  const handleRemoveBackgroundAI = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);
    try {
      const blob = await removeBackground(currentSrc);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCurrentSrc(dataUrl);
        invalidatePreview();
        window.dispatchEvent(new CustomEvent('amazoprint_assets_updated'));
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('AI BG Removal error:', err);
      toast({ variant: 'destructive', title: 'Background Removal Failed', description: 'Could not process the image.' });
    } finally {
      setIsProcessing(false);
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
      );

      onApply({
        processedSrc: dataUrl,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        removeColor: null,
        threshold: 30,
        newAspectRatio: outW / outH,
      });

      onClose();
    } catch (err) {
      console.error('Apply error:', err);
      setIsProcessing(false);
    }
  }, [getNaturalCrop, currentSrc, onApply, onClose]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setAspect(undefined);
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
                    }}
                  >
                    {icon}{label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  AI Tools
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 border-primary/20 hover:bg-primary/5 hover:border-primary/40 group transition-all"
                onClick={handleRemoveBackgroundAI}
                disabled={isProcessing}
              >
                <div className="p-1 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Sparkles size={12} />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-bold">Remove BG</span>
                  <span className="text-[8px] text-muted-foreground">High-precision AI</span>
                </div>
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
              crop={crop}
              onChange={(c) => { setCrop(c); invalidatePreview(); }}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
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
                draggable={false}
                style={{
                  maxHeight: 'calc(90vh - 140px)',
                  cursor: 'default',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  display: 'block',
                }}
                className="w-auto object-contain"
              />
            </ReactCrop>
          </div>
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
