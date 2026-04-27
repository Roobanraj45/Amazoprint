'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  ChevronsUp,
  ChevronsDown,
  Undo,
  Redo,
  Layers,
  Copy,
  Trash2,
  Loader2,
  ShoppingCart,
  Eye,
  Save,
  Library,
  CirclePlay,
} from 'lucide-react';
import { PropertiesPanel } from '@/components/design/properties-panel';
import { DesignCanvas } from '@/components/design/design-canvas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { DesignElement, Product, Background, Guide, ViewState, Page, FoilType, PathPoint } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { LayersPanel } from '@/components/design/layers-panel';
import { saveDesign, updateDesign } from '@/app/actions/design-actions';
import { linkDesignToVerification } from '@/app/actions/verification-actions';
import { LoadDesignDialog } from '@/components/design/load-design-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { AmazoprintLogo } from '@/components/ui/logo';
import { EditorSidebarLeft } from '@/components/design/editor-sidebar-left';
import { cn } from '@/lib/utils';

const DPI = 300;
const MM_PER_INCH = 25.4;
const PX_TO_MM = MM_PER_INCH / DPI;
const MM_TO_PX = DPI / MM_PER_INCH;
const RULER_SIZE = 60;

const PEN_CURSOR = 'crosshair';

type DesignEditorProps = {
  product: Product;
  quantity: number;
  totalPages?: number;
  initialElements?: DesignElement[] | DesignElement[][];
  initialBackground?: Background | Background[];
  initialDesignId?: number | null;
  initialDesignName?: string | null;
  isAdmin?: boolean;
  allFoils?: FoilType[];
  availableFoils?: FoilType[];
  spotUvAllowed?: boolean;
  verificationId?: string | null;
};

function DesignEditorInternal({
  product: initialProduct,
  quantity: initialQuantity,
  totalPages = 1,
  initialElements,
  initialBackground,
  initialDesignId,
  initialDesignName,
  isAdmin,
  availableFoils = [],
  spotUvAllowed = false,
  verificationId,
}: DesignEditorProps) {
  const router = useRouter();
  const { setLeftOpen } = useSidebar();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [currentDesignId, setCurrentDesignId] = useState<number | null>(initialDesignId || null);
  const [currentDesignName, setCurrentDesignName] = useState<string | null>(initialDesignName || null);
  const [croppingElementId, setCroppingElementId] = useState<string | null>(null);

  // Canvas settings
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [showPrintGuidelines, setShowPrintGuidelines] = useState(true);
  const [bleed, setBleed] = useState(18);
  const [safetyMargin, setSafetyMargin] = useState(18);

  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [activeSmartGuides, setActiveSmartGuides] = useState<Guide[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number, y: number, screenX?: number, screenY?: number } | null>(null);
  
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'brush'>('select');
  
  // Brush Tool States (Bristle Engine)
  const [isDrawing, setIsDrawing] = useState(false);
  const lastDrawingPos = useRef({ x: 0, y: 0 });
  const bristleTipRef = useRef<any[]>([]);
  const brushCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushOptions, setBrushOptions] = useState({
      tip: 'chisel' as 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink',
      size: 60,
      flow: 0.25,
      color: '#222222'
  });

  // Pen Tool States
  const [livePath, setLivePath] = useState<PathPoint[] | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{ index: number; type: 'anchor' | 'cp1' | 'cp2' } | null>(null);

  const isMobile = useIsMobile();

  type DesignState = {
    pages: Page[];
    guides: Guide[];
    product: Product;
    quantity: number;
  };

  const {
    state: currentState,
    set: setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
    beginTransaction,
    endTransaction,
  } = useUndoRedo<DesignState>({
    pages: Array.from({ length: totalPages }, () => ({
        elements: [],
        background: { type: 'solid', color: '#ffffff' }
    })),
    guides: [],
    product: initialProduct,
    quantity: initialQuantity,
  });
  
  const { pages, guides, product, quantity } = currentState;
  const currentElements = pages[currentPage]?.elements || [];
  const currentBackground = pages[currentPage]?.background || { type: 'solid', color: '#ffffff' };
  
  const [viewState, setViewState] = useState<ViewState>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Brush Tip Builder (The "Profile" of the brush head from HTML example)
  const buildBrushTip = useCallback(() => {
    const tip = [];
    const density = 80;
    const { tip: type, size } = brushOptions;

    for (let i = 0; i < density; i++) {
        let x, y;
        if (type === 'chisel') {
            x = (Math.random() - 0.5) * size;
            y = (Math.random() - 0.5) * 1.5;
        } else if (type === 'rake') {
            const gap = size / 4;
            x = (Math.round((Math.random() - 0.5) * 4) * gap);
            y = (Math.random() - 0.5) * 2;
        } else if (type === 'charcoal' || type === 'ink') {
            const r = (size/2) * Math.sqrt(Math.random());
            const th = Math.random() * Math.PI * 2;
            x = Math.cos(th) * r;
            y = Math.sin(th) * r;
        } else { // Dry Bristle
            x = (Math.random() - 0.5) * size;
            y = (Math.random() - 0.5) * (size * 0.3);
        }
        tip.push({
            dx: x, dy: y,
            length: Math.random() * 6 + 2,
            thickness: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.4 + 0.1
        });
    }
    bristleTipRef.current = tip;
  }, [brushOptions]);

  useEffect(() => {
    buildBrushTip();
  }, [buildBrushTip]);

  const drawBrushStroke = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const velocity = Math.min(dist / 25, 1);
    const pressure = 1 - (velocity * 0.4);

    for (let i = 0; i < dist; i += 0.8) {
        const cx = x1 + Math.cos(angle) * i;
        const cy = y1 + Math.sin(angle) * i;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        bristleTipRef.current.forEach(b => {
            let skip = 0.95;
            if (brushOptions.tip === 'charcoal') skip = 0.8;
            if (Math.random() > skip) return;

            ctx.globalAlpha = b.opacity * brushOptions.flow * pressure;
            ctx.fillStyle = brushOptions.color;
            const xPos = b.dy * pressure;
            const yPos = b.dx * pressure;
            ctx.fillRect(xPos, yPos, b.length, b.thickness);
        });
        ctx.restore();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const confirmNavigation = useCallback((e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        e.preventDefault();
        return false;
      }
    }
    return true;
  }, [isDirty]);

  const updatePage = useCallback((pageIndex: number, newPageData: Partial<Page>) => {
    setIsDirty(true);
    setState(prev => {
        if (!prev) return prev;
        const newPages = [...prev.pages];
        newPages[pageIndex] = { ...newPages[pageIndex], ...newPageData };
        return { ...prev, pages: newPages };
    })
  }, [setState]);

  const finalizePath = useCallback((pathOverride?: PathPoint[], forceClosed?: boolean) => {
    const pathToFinalize = pathOverride || livePath;
    if (!pathToFinalize || pathToFinalize.length < 2) {
        setLivePath(null);
        setDraggingPoint(null);
        setActiveTool('select');
        return;
    }
    const finalPath = [...pathToFinalize];
    const firstPoint = finalPath[0];
    const lastPoint = finalPath[finalPath.length - 1];
    const isClosed = forceClosed || (finalPath.length > 2 && Math.hypot(lastPoint.x - firstPoint.x, lastPoint.y - firstPoint.y) < 25 / viewState.zoom);
    const allX = finalPath.flatMap(p => [p.x, p.cp1x, p.cp2x]);
    const allY = finalPath.flatMap(p => [p.y, p.cp1y, p.cp2y]);
    const minX = Math.min(...allX) - 2;
    const minY = Math.min(...allY) - 2;
    const maxX = Math.max(...allX) + 2;
    const maxY = Math.max(...allY) + 2;
    const newPathElement: DesignElement = {
        id: crypto.randomUUID(), type: 'path', fillType: isClosed ? 'solid' : 'none', 
        x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY),
        rotation: 0, opacity: 1, color: '#cccccc', borderColor: '#000000', borderWidth: 2, borderStyle: 'solid',
        isPathClosed: isClosed, pathPoints: finalPath.map(p => ({ ...p, x: p.x - minX, y: p.y - minY, cp1x: p.cp1x - minX, cp1y: p.cp1y - minY, cp2x: p.cp2x - minX, cp2y: p.cp2y - minY, })),
        content: '', fontSize: 0, fontFamily: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle', backgroundColor: 'transparent', boxShadow: 'none',
    };
    updatePage(currentPage, { elements: [...currentElements, newPathElement] });
    setLivePath(null);
    setDraggingPoint(null);
    setActiveTool('select');
  }, [livePath, viewState.zoom, currentPage, currentElements, updatePage]);

  const getPointInCanvas = (e: React.MouseEvent | MouseEvent): [number, number] => {
      if (!mainCanvasRef.current) return [0, 0];
      const rect = mainCanvasRef.current.getBoundingClientRect();
      const rulerOffset = showRulers ? RULER_SIZE : 0;
      const x = (e.clientX - rect.left - viewState.pan.x) / viewState.zoom - rulerOffset - safetyMargin;
      const y = (e.clientY - rect.top - viewState.pan.y) / viewState.zoom - rulerOffset - safetyMargin;
      return [x, y];
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const [x, y] = getPointInCanvas(e);
    
    if (activeTool === 'brush') {
        e.stopPropagation();
        beginTransaction();
        setIsDrawing(true);
        lastDrawingPos.current = { x, y };

        if (!brushCanvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = product.width;
            canvas.height = product.height;
            brushCanvasRef.current = canvas;
        }
        return;
    }

    if (activeTool === 'pen') {
        e.stopPropagation();
        beginTransaction();
        if (livePath && livePath.length > 2) {
            const firstPoint = livePath[0];
            const hitRadius = 25 / viewState.zoom;
            if (Math.hypot(x - firstPoint.x, y - firstPoint.y) < hitRadius) {
                finalizePath(livePath, true);
                return;
            }
        }
        let updatedPath = livePath ? [...livePath] : [];
        const newPoint: PathPoint = { x, y, cp1x: x, cp1y: y, cp2x: x, cp2y: y };
        updatedPath.push(newPoint);
        setLivePath(updatedPath);
        setDraggingPoint({ index: updatedPath.length - 1, type: 'cp2' });
        return;
    }

    const target = e.target as HTMLElement;
    const isCanvasBackground = target.classList.contains('print-area');
    if (isCanvasBackground) handleSelectElement(null, e.shiftKey);
    if ((e.button === 0 && isCanvasBackground) || isSpacePressed || e.button === 1) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - viewState.pan.x, y: e.clientY - viewState.pan.y };
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const [x, y] = getPointInCanvas(e);
    setMousePos({ x, y, screenX: e.clientX, screenY: e.clientY });

    if (isDrawing && activeTool === 'brush' && brushCanvasRef.current) {
        const ctx = brushCanvasRef.current.getContext('2d');
        if (ctx) {
            drawBrushStroke(ctx, lastDrawingPos.current.x, lastDrawingPos.current.y, x, y);
            lastDrawingPos.current = { x, y };
        }
        return;
    }

    if (activeTool === 'pen' && draggingPoint) {
        setLivePath(prev => {
            if (!prev) return null;
            const newPath = prev.map(p => ({...p}));
            const point = newPath[draggingPoint.index];
            if (draggingPoint.type === 'anchor') {
                const dx = x - point.x;
                const dy = y - point.y;
                point.x = x; point.y = y;
                point.cp1x += dx; point.cp1y += dy;
                point.cp2x += dx; point.cp2y += dy;
            } else if (draggingPoint.type === 'cp2') {
                point.cp2x = x; point.cp2y = y;
                point.cp1x = point.x - (x - point.x);
                point.cp1y = point.y - (y - point.y);
            }
            return newPath;
        });
        return;
    }

    if (isPanning.current) {
      setViewState({ ...viewState, pan: { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y } });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeTool === 'brush' && brushCanvasRef.current) {
        setIsDrawing(false);
        const dataUrl = brushCanvasRef.current.toDataURL();
        const newElement: DesignElement = {
            id: crypto.randomUUID(), type: 'image', x: 0, y: 0, width: product.width, height: product.height, rotation: 0, opacity: 1, visible: true, locked: false,
            src: dataUrl, objectFit: 'contain', backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
            content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', shapeType: 'rectangle', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
        };
        updatePage(currentPage, { elements: [...currentElements, newElement] });
        const ctx = brushCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, brushCanvasRef.current.width, brushCanvasRef.current.height);
        endTransaction();
        return;
    }
    if (activeTool === 'pen') setDraggingPoint(null);
    if (isPanning.current) isPanning.current = false;
  };

  const handleZoomIn = () => setViewState(vs => ({...vs, zoom: Math.min(vs.zoom * 1.2, 5) }));
  const handleZoomOut = () => setViewState(vs => ({...vs, zoom: Math.max(vs.zoom / 1.2, 0.1) }));
  
  const handlePreview = () => {
    try {
      localStorage.setItem('design_preview', JSON.stringify({ elements: currentElements, product, background: currentBackground, bleed, safetyMargin }));
      window.open('/design/preview', '_blank');
    } catch (error) { toast({ variant: 'destructive', title: 'Could not open preview' }); }
  };

  const addQrCodeElement = (value: string, style: string) => {
    const size = 300;
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'qrcode', x: (product.width - size)/2, y: (product.height - size)/2, width: size, height: size, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
      qrValue: value || 'https://amazoprint.com', qrColor: '#000000', qrBgColor: '#FFFFFF', qrLevel: 'M', qrIconSize: 20, qrStylePreset: style as any || 'default',
      content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle'
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
  };
  
  const addTextElement = (options: Partial<DesignElement>) => {
    const defaultTextElement: DesignElement = {
      id: crypto.randomUUID(), type: 'text', x: 0, y: 0, width: 250, height: 50, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid', borderRadius: 0,
      content: 'Hello World', fontSize: 24, fontFamily: 'Inter', color: '#000000', fontWeight: 'normal', fontStyle: 'normal',
      textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', textTransform: 'none', verticalAlign: 'middle',
      src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle',
    };
    const newElement = { ...defaultTextElement, ...options };
    newElement.x = (product.width - (newElement.width || 250)) / 2;
    newElement.y = (product.height - (newElement.height || 50)) / 2;
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
  };
  
  const handleAddImageFromLibrary = (src: string) => {
    const size = 400;
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'image', x: (product.width - size)/2, y: (product.height - size)/2, width: size, height: size, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
      src, objectFit: 'contain', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
      content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', shapeType: 'rectangle',
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
  };

  const handleAddShape = (shapeType: string) => {
    const width = shapeType === 'line' ? 400 : 300;
    const height = shapeType === 'line' ? 2 : 300;
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'shape', shapeType, x: (product.width - width)/2, y: (product.height - height)/2, width, height, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 1, borderColor: '#000000', borderStyle: 'solid',
      color: '#cccccc', fillType: 'solid', content: '', fontSize: 0, fontFamily: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
  };

  const handleAddEmoji = (emoji: string) => {
    const size = 250;
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'text', x: (product.width - size)/2, y: (product.height - size)/2, width: size, height: size, rotation: 0, opacity: 1, backgroundColor: 'transparent', visible: true, locked: false,
      boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid', borderRadius: 0, content: emoji,
      fontSize: 200, fontFamily: 'Inter', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none',
      letterSpacing: 0, lineHeight: 1, textAlign: 'center', textTransform: 'none', verticalAlign: 'middle', src: '', objectFit: 'cover',
      filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle',
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
  };

  const handleAddGroupedElements = (elements: Partial<DesignElement>[]) => {
    if (elements.length === 0) return;
    const newElements = elements.map(el => ({ ...el, id: crypto.randomUUID() })) as DesignElement[];
    const minX = Math.min(...newElements.map(el => el.x));
    const minY = Math.min(...newElements.map(el => el.y));
    const maxX = Math.max(...newElements.map(el => el.x + el.width));
    const maxY = Math.max(...newElements.map(el => el.y + el.height));
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;
    const newGroup: DesignElement = {
        id: crypto.randomUUID(), type: 'group', x: (product.width - groupWidth)/2, y: (product.height - groupHeight)/2, width: groupWidth, height: groupHeight, rotation: 0, opacity: 1, visible: true, locked: false,
        children: newElements.map(el => ({ ...el, x: el.x - minX, y: el.y - minY })),
        backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
        borderRadius: 0, content: '', fontSize: 1, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal',
        textDecoration: 'none', letterSpacing: 0, lineHeight: 1, textAlign: 'left', src: '', objectFit: 'cover',
        filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle',
    };
    updatePage(currentPage, { elements: [...currentElements, newGroup] });
    setSelectedElementIds([newGroup.id]);
  };

  const findElementRecursive = (elements: DesignElement[], id: string): DesignElement | undefined => {
    for (const el of elements) {
      if (el.id === id) return el;
      if (el.type === 'group' && el.children) {
        const found = findElementRecursive(el.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleSelectElement = (id: string | null, isShift?: boolean) => {
    if (croppingElementId || activeTool === 'brush' || activeTool === 'pen') return;
    if (id) {
        const element = findElementRecursive(currentElements, id);
        if (element?.locked) { if (!isShift) setSelectedElementIds([]); return; }
    }
    setActiveTool('select');
    if (isShift) setSelectedElementIds(prev => id === null ? prev : (prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]));
    else setSelectedElementIds(id ? [id] : []);
  };

  const updateElement = (id: string, newProps: Partial<DesignElement>) => {
    const recursiveUpdate = (els: DesignElement[], targetId: string, props: Partial<DesignElement>): DesignElement[] => {
      return els.map(el => {
        if (el.id === targetId) return { ...el, ...props };
        if (el.type === 'group' && el.children) {
          const newChildren = recursiveUpdate(el.children, targetId, props);
          if (newChildren !== el.children) return { ...el, children: newChildren };
        }
        return el;
      });
    };
    let propsToUpdate = { ...newProps };
    if (snapToGrid) {
      if (propsToUpdate.x) propsToUpdate.x = Math.round(propsToUpdate.x / gridSize) * gridSize;
      if (propsToUpdate.y) propsToUpdate.y = Math.round(propsToUpdate.y / gridSize) * gridSize;
    }
    updatePage(currentPage, { elements: recursiveUpdate(currentElements, id, propsToUpdate) });
  };
  
  const handleSave = async () => {
    const saveData = { productSlug: product.id, elements: pages.map(p => p.elements), background: pages.map(p => p.background), guides, quantity, width: Math.round(product.width * PX_TO_MM), height: Math.round(product.height * PX_TO_MM) };
    if (currentDesignId && currentDesignName) {
      try { await updateDesign({ id: currentDesignId, name: currentDesignName, verificationId: verificationId || null, ...saveData }); toast({ title: 'Design Updated!' }); setIsDirty(false); }
      catch (error) { toast({ variant: 'destructive', title: 'Error Updating Design' }); }
    } else {
      const designName = prompt('Enter a name for your design:');
      if (designName) {
        try { const savedDesign = await saveDesign({ name: designName, ...saveData }); setCurrentDesignId(savedDesign.id); setCurrentDesignName(savedDesign.name); toast({ title: 'Design Saved!' }); setIsDirty(false); }
        catch (error) { toast({ variant: 'destructive', title: 'Error Saving Design' }); }
      }
    }
  };

  const handleOrder = async () => {
    setIsOrdering(true);
    let designId = currentDesignId;
    if (!designId) {
      const designName = currentDesignName || prompt('Please name your design to proceed to order:');
      if (designName) {
        try {
          const savedDesign = await saveDesign({ name: designName, productSlug: product.id, elements: pages.map(p => p.elements), background: pages.map(p => p.background), guides, quantity, width: Math.round(product.width * PX_TO_MM), height: Math.round(product.height * PX_TO_MM) });
          setCurrentDesignId(savedDesign.id); setCurrentDesignName(savedDesign.name); designId = savedDesign.id; setIsDirty(false); toast({ title: 'Design Saved!' });
        } catch (error) { toast({ variant: 'destructive', title: 'Error Saving Design' }); setIsOrdering(false); return; }
      } else { toast({ variant: 'destructive', title: 'Order Canceled', description: 'A design must be named and saved before ordering.' }); setIsOrdering(false); return; }
    }
    if (designId) router.push(`/checkout?designId=${designId}&quantity=${quantity}`);
    else setIsOrdering(false);
  };

  const handleLoadDesign = (design: any) => {
    const isMultiPageElements = design.elements && Array.isArray(design.elements) && design.elements.length > 0 && Array.isArray(design.elements[0]);
    const newTotalPages = isMultiPageElements ? (design.elements as DesignElement[][]).length : 1;
    let newPages: Page[] = [];
    for(let i = 0; i < newTotalPages; i++) {
        const pageElements = isMultiPageElements ? (design.elements as DesignElement[][])[i] : (i === 0 ? design.elements as DesignElement[] : []);
        newPages.push({ elements: pageElements?.map(el => ({ ...el, visible: el.visible ?? true, locked: el.locked ?? false })) || [], background: (Array.isArray(design.background) ? design.background[i] : (i === 0 ? design.background : { type: 'solid', color: '#ffffff' })) });
    }
    setCurrentDesignId(design.id); setCurrentDesignName(design.name);
    resetHistory({ pages: newPages, guides: (design.guides as Guide[]) || [], product: { ...product, width: Math.round(design.width * MM_TO_PX), height: Math.round(design.height * MM_TO_PX) }, quantity: design.quantity });
    setIsLoadDialogOpen(false); setIsDirty(false);
  };

  const handleDuplicateElement = () => {
    if (selectedElements.length === 0) return;
    const newElements = selectedElements.map(el => ({ ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 }));
    updatePage(currentPage, { elements: [...currentElements, ...newElements] });
    setSelectedElementIds(newElements.map(el => el.id));
  };

  const handleDeleteElement = () => {
    updatePage(currentPage, { elements: currentElements.filter(el => !selectedElementIds.includes(el.id)) });
    setSelectedElementIds([]);
  };

  const selectedElements = selectedElementIds.map(id => findElementRecursive(currentElements, id)).filter((el): el is DesignElement => !!el);
  const selectedElement = selectedElements[0];

  // ====================== KEYBOARD SHORTCUTS ======================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        if (croppingElementId) {
          setCroppingElementId(null);
        } else if (activeTool === 'pen') {
          // Force connect starting point when Escape is pressed
          finalizePath(livePath, true);
        } else {
          setSelectedElementIds([]);
          setActiveTool('select');
        }
      }

      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        else if (e.key === 'y') { e.preventDefault(); redo(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, activeTool, finalizePath, livePath, croppingElementId]);

  return (
    <>
      <div className="grid grid-rows-[auto_1fr] h-screen w-full bg-background print:hidden overflow-hidden">
        <header className="relative z-50 flex h-16 items-center gap-2 border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-all group" onClick={(e) => { if(!confirmNavigation(e as any)) e.preventDefault(); }}>
              <AmazoprintLogo isSimple className="w-12 h-12" />
              <div className="flex flex-col -space-y-0.5">
                <span className="font-bold text-sm text-zinc-900 leading-tight uppercase tracking-tight">{product.name}</span>
                <span className="text-[10px] font-black text-primary uppercase leading-none tracking-widest">ws</span>
              </div>
            </Link>
          </div>

          <Separator orientation="vertical" className="h-8 mx-4 opacity-30" />

          <div className="flex flex-1 items-center gap-0.5 overflow-hidden">
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} className="h-9 gap-1.5 px-3 hover:bg-zinc-100" title="Undo (Ctrl+Z)">
                <Undo size={16} className="text-zinc-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Undo</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} className="h-9 gap-1.5 px-3 hover:bg-zinc-100" title="Redo (Ctrl+Y)">
                <Redo size={16} className="text-zinc-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Redo</span>
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-zinc-100 shrink-0">
                  <Layers size={16} className="text-zinc-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Layers</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="bottom" align="start" sideOffset={10}>
                <LayersPanel elements={currentElements} selectedElementIds={selectedElementIds} onSelectElement={handleSelectElement} onToggleVisibility={id => updateElement(id, { visible: !findElementRecursive(currentElements, id)?.visible })} onToggleLock={id => updateElement(id, { locked: !findElementRecursive(currentElements, id)?.locked })} onDuplicate={id => { const el = findElementRecursive(currentElements, id); if (el) updatePage(currentPage, { elements: [...currentElements, { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 }] }); }} onDelete={id => updatePage(currentPage, { elements: currentElements.filter(el => el.id !== id) })} onDeleteAll={() => updatePage(currentPage, { elements: [] })} />
              </PopoverContent>
            </Popover>

            <div className={cn("flex items-center gap-0.5 transition-all duration-300 ml-1 shrink-0", selectedElements.length > 0 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none")}>
                <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-zinc-100" onClick={handleDuplicateElement}>
                    <Copy size={16} className="text-zinc-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Duplicate</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-red-50 text-red-500 hover:text-red-600" onClick={handleDeleteElement}>
                    <Trash2 size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Delete</span>
                </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 h-full shrink-0">
            <Button variant="ghost" size="sm" className="text-zinc-900 font-bold hover:bg-zinc-100 gap-2 h-9 px-4 rounded-lg hidden xl:flex">
                <CirclePlay className="h-5 w-5 text-red-600 fill-white" />
                <span className="text-[12px] font-bold">Video Tutorials</span>
            </Button>
            <div className="flex items-center gap-1.5 ml-2">
                <Button variant="outline" size="sm" onClick={() => setIsLoadDialogOpen(true)} className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold hidden md:flex">
                    <Library size={16} />
                    <span className="text-[11px] uppercase tracking-wider">Load</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold">
                    <Save size={16} />
                    <span className="text-[11px] uppercase tracking-wider">{currentDesignId ? 'Update' : 'Save'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreview} className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold hidden md:flex">
                    <Eye size={16} />
                    <span className="text-[11px] uppercase tracking-wider">Preview</span>
                </Button>
            </div>
            {!isAdmin && (
                <Button onClick={handleOrder} size="sm" disabled={isOrdering} className="h-10 px-6 bg-primary text-white rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 ml-4">
                    {isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={18} />}
                    <span className="text-[12px] font-black uppercase tracking-wider">Order Now</span>
                </Button>
            )}
          </div>
        </header>

        <div className="flex overflow-hidden relative h-full">
          <EditorSidebarLeft activeTool={activeTool} setActiveTool={setActiveTool} isAdmin={isAdmin} onAddImage={handleAddImageFromLibrary} onAddShape={handleAddShape} onAddEmoji={handleAddEmoji} onAddText={addTextElement} onAddGroupedElements={handleAddGroupedElements} onAddQrCode={addQrCodeElement} brushOptions={brushOptions} setBrushOptions={setBrushOptions} onClearBrush={() => { const ctx = brushCanvasRef.current?.getContext('2d'); ctx?.clearRect(0,0,product.width,product.height); }} finalizePath={finalizePath} />
          <SidebarInset className="min-h-0 flex-1 p-0 m-0 relative">
            <div ref={mainCanvasRef} className="flex-1 overflow-hidden relative h-full bg-muted" style={{ cursor: activeTool === 'brush' ? 'crosshair' : (activeTool === 'pen' ? PEN_CURSOR : 'default') }} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                <DesignCanvas product={product} elements={currentElements} selectedElementIds={selectedElementIds} onSelectElement={handleSelectElement} onUpdateElement={updateElement} background={currentBackground} showRulers={showRulers} showGrid={showGrid} gridSize={gridSize} guides={guides} smartGuides={activeSmartGuides} showPrintGuidelines={showPrintGuidelines} bleed={bleed} safetyMargin={safetyMargin} viewState={viewState} activeTool={activeTool} />
            </div>
          </SidebarInset>
          <Sidebar side="right" collapsible="icon" className="hidden lg:block w-80">
            <SidebarContent className="p-0 h-full"><ScrollArea className="h-full"><div className="p-4"><PropertiesPanel element={selectedElement} onUpdate={updateElement} product={product} onProductUpdate={p => setState(s => ({...s, product: {...s.product, ...p}}))} quantity={quantity} onQuantityChange={q => setState(s => ({...s, quantity: q}))} background={currentBackground} onBackgroundChange={onBackgroundChange} canvasSettings={{ showRulers, setShowRulers, showGrid, setShowGrid, snapToGrid, setSnapToGrid, gridSize, setGridSize, showPrintGuidelines, setShowPrintGuidelines, bleed, setBleed, safetyMargin, setSafetyMargin }} croppingElementId={croppingElementId} setCroppingElementId={setCroppingElementId} isAdmin={isAdmin} onMoveLayer={moveLayer} /></div></ScrollArea></SidebarContent>
          </Sidebar>
        </div>
      </div>
      <LoadDesignDialog isOpen={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen} onLoad={handleLoadDesign} />
    </>
  );
}

export function DesignEditor(props: DesignEditorProps) {
  return (
    <SidebarProvider defaultLeftOpen={false}>
      <DesignEditorInternal {...props} />
    </SidebarProvider>
  );
}
