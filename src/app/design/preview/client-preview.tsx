'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Product, Background, ViewState } from '@/lib/types';
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PreviewData = {
  pages: { elements: DesignElement[]; background: Background }[];
  product: Product;
  bleed: number;
  safetyMargin: number;
  currentPage?: number;
};

export default function ClientPreview() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [currentPage, setCurrentPage] = useState(0);

  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('design_preview');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setData(parsed);
        if (parsed.currentPage !== undefined) {
          setCurrentPage(parsed.currentPage);
        }
      }
    } catch (error) {
      console.error('Failed to load preview data from localStorage', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetView = useCallback(() => {
    if (!mainCanvasRef.current || !data) return;
    const { width: containerWidth, height: containerHeight } = mainCanvasRef.current.getBoundingClientRect();

    const canvasWidth = data.product.width + data.safetyMargin * 2;
    const canvasHeight = data.product.height + data.safetyMargin * 2;

    const zoomX = containerWidth / canvasWidth;
    const zoomY = containerHeight / canvasHeight;
    const newZoom = Math.min(zoomX, zoomY) * 0.9;

    const newPanX = (containerWidth - canvasWidth * newZoom) / 2;
    const newPanY = (containerHeight - canvasHeight * newZoom) / 2;

    setViewState({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
  }, [data]);

  useEffect(() => {
    if (data) {
      resetView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!mainCanvasRef.current) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? viewState.zoom * zoomFactor : viewState.zoom / zoomFactor;
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - viewState.pan.x) / viewState.zoom;
    const worldY = (mouseY - viewState.pan.y) / viewState.zoom;

    const newPanX = mouseX - worldX * clampedZoom;
    const newPanY = mouseY - worldY * clampedZoom;

    setViewState({ zoom: clampedZoom, pan: { x: newPanX, y: newPanY } });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - viewState.pan.x, y: e.clientY - viewState.pan.y };
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      const newPan = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      };
      setViewState({ ...viewState, pan: newPan });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      isPanning.current = false;
      e.currentTarget.style.cursor = 'grab';
    }
  };

  const handleZoomIn = () => {
    setViewState(vs => {
      const newZoom = Math.min(vs.zoom * 1.2, 5);
      return { ...vs, zoom: newZoom };
    });
  };

  const handleZoomOut = () => {
    setViewState(vs => {
      const newZoom = Math.max(vs.zoom / 1.2, 0.1);
      return { ...vs, zoom: newZoom };
    });
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No preview data found.</p>
      </main>
    );
  }

  return (
    <main
      ref={mainCanvasRef}
      className="flex-1 pt-16 overflow-hidden relative"
      style={{ cursor: 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <DesignCanvas
        product={data.product}
        elements={data.pages[currentPage]?.elements || []}
        selectedElementIds={[]}
        onSelectElement={() => {}}
        onUpdateElement={() => {}}
        background={data.pages[currentPage]?.background || { type: 'solid', color: '#ffffff' }}
        showRulers={false}
        showGrid={false}
        gridSize={20}
        guides={[]}
        smartGuides={[]}
        onAddGuide={() => ''}
        onUpdateGuide={() => {}}
        onRemoveGuide={() => {}}
        onSmartGuidesChange={() => {}}
        showPrintGuidelines={true}
        bleed={data.bleed}
        safetyMargin={data.safetyMargin}
        viewState={viewState}
        onInteractionStart={() => {}}
        onInteractionEnd={() => {}}
      />
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {/* Page Navigation */}
        {data.pages.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-card p-1.5 shadow-md border">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex flex-col items-center justify-center min-w-[70px] leading-none">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Page</span>
                    <span className="text-xs font-bold text-primary">{currentPage + 1} / {data.pages.length}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === data.pages.length - 1}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-lg bg-card p-1.5 shadow-md border">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs w-16" onClick={resetView}>
            {Math.round(viewState.zoom * 100)}%
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </main>
  );
}
