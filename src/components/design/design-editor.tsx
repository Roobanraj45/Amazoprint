'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
  Sidebar,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Download,
  Save,
  BringToFront,
  SendToBack,
  ChevronsUp,
  ChevronsDown,
  Home,
  ZoomIn,
  ZoomOut,
  Group,
  Ungroup,
  Redo,
  Loader2,
  Layers,
  Eye,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  MoreVertical,
  SlidersHorizontal,
  Library,
  Undo,
  AlignLeft,
  Blend,
  Copy,
  Trash2,
  PlayCircle,
  LayoutDashboard,
} from 'lucide-react';
import { PropertiesPanel } from '@/components/design/properties-panel';
import { DesignCanvas } from '@/components/design/design-canvas';
import { TextAddPanel } from '@/components/design/panels/text-add-panel';
import { MediaPanel } from '@/components/design/panels/media-panel';
import { QrCodePanel } from '@/components/design/panels/qrcode-panel';
import { BrushToolPanel } from '@/components/design/brush-tool-panel';
import { PenToolPanel } from '@/components/design/pen-tool-panel';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { DesignElement, Product, Background, Guide, ViewState, Page, RenderData, FoilType, PathPoint } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ElementToolbar } from '@/components/design/element-toolbar';
import { LayersPanel } from '@/components/design/layers-panel';
import { EditorHeader } from '@/components/design/editor-header';
import { buildBrushTip, renderBristleSegment, BristleProfile, BrushEngineTip } from '@/lib/brush-engine';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { getDesign, saveDesign, updateDesign, getMyDesigns } from '@/app/actions/design-actions';
import { submitContestEntry } from '@/app/actions/contest-actions';
import { linkDesignToVerification } from '@/app/actions/verification-actions';
import { LoadDesignDialog } from '@/components/design/load-design-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CropDialog } from '@/components/design/crop-dialog';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { AmazoprintLogo } from '@/components/ui/logo';
import { EditorSidebarLeft } from '@/components/design/editor-sidebar-left';

const DPI = 300;
const MM_PER_INCH = 25.4;
const PX_TO_MM = MM_PER_INCH / DPI;
const MM_TO_PX = DPI / MM_PER_INCH;
const RULER_SIZE = 60;

// High-precision crosshair cursor for pen tool
const PEN_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="16" y1="8" x2="16" y2="24" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="16" x2="24" y2="16" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="16" y1="8" x2="16" y2="24" stroke="black" stroke-width="1" stroke-linecap="round"/><line x1="8" y1="16" x2="24" y2="16" stroke="black" stroke-width="1" stroke-linecap="round"/></svg>') 16 16, crosshair`;

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
  allFoils = [],
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

  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  const [activeTool, setActiveTool] = useState<'select' | 'brush' | 'pen'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingPointsRef = useRef<[number, number][]>([]);
  const bristleTipRef = useRef<BristleProfile>([]);
  
  const [livePencilPath, setLivePencilPath] = useState<{ 
      path: [number, number][]; 
      strokeColor: string; 
      flow: number;
      brushTip: BrushEngineTip;
      bristleTipData: BristleProfile;
  } | null>(null);

  const [brushOptions, setBrushOptions] = useState<{
      brushTip: BrushEngineTip;
      size: number;
      flow: number;
      color: string;
  }>({
      brushTip: 'chisel',
      size: 60,
      flow: 0.25,
      color: '#222222',
  });
  
  // Pen Tool States
  const [livePath, setLivePath] = useState<PathPoint[] | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{ index: number; type: 'anchor' | 'cp1' | 'cp2' } | null>(null);

  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<string | null>(null);

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

  // --- Unsaved Changes Protection ---
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

    // Bounding box calculation for the new element
    const allX = finalPath.flatMap(p => [p.x, p.cp1x, p.cp2x]);
    const allY = finalPath.flatMap(p => [p.y, p.cp1y, p.cp2y]);
    
    const minX = Math.min(...allX) - 2;
    const minY = Math.min(...allY) - 2;
    const maxX = Math.max(...allX) + 2;
    const maxY = Math.max(...allY) + 2;

    const newPathElement: DesignElement = {
        id: crypto.randomUUID(),
        type: 'path',
        fillType: isClosed ? 'solid' : 'none', 
        x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY),
        rotation: 0, opacity: 1, color: '#cccccc', borderColor: '#000000', borderWidth: 2, borderStyle: 'solid',
        isPathClosed: isClosed,
        pathPoints: finalPath.map(p => ({
            ...p,
            x: p.x - minX, y: p.y - minY,
            cp1x: p.cp1x - minX, cp1y: p.cp1y - minY,
            cp2x: p.cp2x - minX, cp2y: p.cp2y - minY,
        })),
        content: '', fontSize: 0, fontFamily: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle', backgroundColor: 'transparent', boxShadow: 'none',
    };

    updatePage(currentPage, { elements: [...currentElements, newPathElement] });
    setLivePath(null);
    setDraggingPoint(null);
    setActiveTool('select');
  }, [livePath, viewState.zoom, currentPage, currentElements, updatePage]);


  useEffect(() => {
    const pagesToCreate = totalPages || 1;
    let newPages: Page[] = [];

    const isMultiPageElements = initialElements && initialElements.length > 0 && Array.isArray(initialElements[0]);
    const isMultiPageBackground = initialBackground && Array.isArray(initialBackground);

    for (let i = 0; i < pagesToCreate; i++) {
        const pageElements = isMultiPageElements ? (initialElements as DesignElement[][])[i] : (i === 0 ? initialElements as DesignElement[] : []);
        const pageBackground = isMultiPageBackground ? (initialBackground as Background[])[i] : (i === 0 ? initialBackground as Background : { type: 'solid', color: '#ffffff' });

        newPages.push({
            elements: pageElements?.map(el => ({ ...el, visible: el.visible ?? true, locked: el.locked ?? false })) || [],
            background: pageBackground || { type: 'solid', color: '#ffffff' }
        });
    }

    resetHistory({
        pages: newPages,
        guides: [],
        product: initialProduct,
        quantity: initialQuantity,
    });
    
    setCurrentDesignId(initialDesignId || null);
    setCurrentDesignName(initialDesignName || null);
    setCurrentPage(0);
    setSelectedElementIds([]);
    setIsDirty(false);
  }, [initialProduct, initialQuantity, initialElements, initialBackground, initialDesignId, initialDesignName, totalPages, resetHistory]);
  
  const editorCanvasWidth = product.width + (safetyMargin * 2);
  const editorCanvasHeight = product.height + (safetyMargin * 2);

  const resetView = useCallback(() => {
    if (!mainCanvasRef.current) return;
    const { width: containerWidth, height: containerHeight } = mainCanvasRef.current.getBoundingClientRect();
    
    const rulerSize = showRulers ? RULER_SIZE : 0;
    const canvasWidthWithRulers = editorCanvasWidth + rulerSize;
    const canvasHeightWithRulers = editorCanvasHeight + rulerSize;

    const zoomX = containerWidth / canvasWidthWithRulers;
    const zoomY = containerHeight / canvasHeightWithRulers;
    const newZoom = Math.min(zoomX, zoomY) * 0.9;

    const newPanX = (containerWidth - canvasWidthWithRulers * newZoom) / 2;
    const newPanY = (containerHeight - canvasHeightWithRulers * newZoom) / 2;

    setViewState({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
  }, [editorCanvasWidth, editorCanvasHeight, showRulers]);

  useEffect(() => {
    resetView();
  }, [resetView, product.width, product.height]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        if (croppingElementId) {
          setCroppingElementId(null);
        } else if (activeTool === 'pen') {
          finalizePath();
        } else {
          setSelectedElementIds([]);
          setActiveTool('select');
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && activeTool === 'pen' && !isInput) {
          e.preventDefault();
          setLivePath(prev => {
              if (!prev || prev.length <= 1) return null;
              return prev.slice(0, -1);
          });
      }

      if (e.key === ' ' && !e.repeat && !isInput) {
        e.preventDefault();
        setIsSpacePressed(true);
        if (mainCanvasRef.current) {
          mainCanvasRef.current.style.cursor = 'grab';
        }
      }

      if (e.key.toLowerCase() === 'p' && !isInput) {
        e.preventDefault();
        if (activeTool === 'pen') {
            finalizePath();
        } else {
            setActiveTool('pen');
            setLeftOpen(false);
        }
      }

      if (e.key === 'Enter' && activeTool === 'pen' && !isInput) {
          e.preventDefault();
          finalizePath();
      }
      
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
            e.preventDefault();
            redo();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
        if (mainCanvasRef.current && !isPanning.current) {
          mainCanvasRef.current.style.cursor = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [undo, redo, activeTool, finalizePath, croppingElementId, setLeftOpen]);


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
  
  const getPointInCanvas = (e: React.MouseEvent | MouseEvent): [number, number] => {
      if (!mainCanvasRef.current) return [0, 0];
      const parent = mainCanvasRef.current;
      if (!parent) return [0, 0];
      
      const rect = parent.getBoundingClientRect();
      const rulerOffset = showRulers ? RULER_SIZE : 0;
      
      const x = (e.clientX - rect.left - viewState.pan.x) / viewState.zoom - rulerOffset - safetyMargin;
      const y = (e.clientY - rect.top - viewState.pan.y) / viewState.zoom - rulerOffset - safetyMargin;
      return [x, y];
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'brush') {
        e.stopPropagation();
        beginTransaction();
        setIsDrawing(true);
        const [x, y] = getPointInCanvas(e);
        drawingPointsRef.current = [[x, y]];
        
        // Generate the bristle profile for this stroke
        bristleTipRef.current = buildBrushTip(brushOptions.brushTip as BrushEngineTip, brushOptions.size);

        setLivePencilPath({
            path: [[x, y], [x, y]],
            strokeColor: brushOptions.color,
            flow: brushOptions.flow,
            brushTip: brushOptions.brushTip as BrushEngineTip,
            bristleTipData: bristleTipRef.current
        });
        return;
    }
     if (activeTool === 'pen') {
        e.stopPropagation();
        beginTransaction();
        const [x, y] = getPointInCanvas(e);

        if (livePath && livePath.length > 2) {
            const firstPoint = livePath[0];
            const hitRadius = 25 / viewState.zoom;
            if (Math.hypot(x - firstPoint.x, y - firstPoint.y) < hitRadius) {
                // Clicking start point: Complete the shape.
                finalizePath(livePath, true);
                return;
            }
            
            for (let i = 1; i < livePath.length; i++) {
                const p = livePath[i];
                if (Math.hypot(x - p.x, y - p.y) < hitRadius) {
                    setDraggingPoint({ index: i, type: 'anchor' });
                    return;
                }
            }
        }

        let updatedPath = livePath ? [...livePath] : [];
        if (updatedPath.length > 0) {
            const lastIdx = updatedPath.length - 1;
            updatedPath[lastIdx] = { ...updatedPath[lastIdx], cp2x: updatedPath[lastIdx].x, cp2y: updatedPath[lastIdx].y };
        }

        const newPoint: PathPoint = { x, y, cp1x: x, cp1y: y, cp2x: x, cp2y: y };
        updatedPath.push(newPoint);
        setLivePath(updatedPath);
        setDraggingPoint({ index: updatedPath.length - 1, type: 'cp2' });
        return;
    }

    const target = e.target as HTMLElement;
    const isCanvasBackground = target.classList.contains('print-area');
    
    if (isCanvasBackground) {
        handleSelectElement(null, e.shiftKey);
    }
    
    if ((e.button === 0 && isCanvasBackground) || isSpacePressed || e.button === 1) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - viewState.pan.x, y: e.clientY - viewState.pan.y };
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const [x, y] = getPointInCanvas(e);
    setMousePos({ x, y, screenX: e.clientX, screenY: e.clientY });

    if (isDrawing && activeTool === 'brush') {
        const points = drawingPointsRef.current;
        const lastPoint = points[points.length - 1];
        if (!lastPoint) return;

        // Add point if we moved
        const dist = Math.hypot(x - lastPoint[0], y - lastPoint[1]);
        if (dist > 1) {
            points.push([x, y]);
            
            // Limit memory usage
            if (points.length > 2000) {
                points.splice(0, points.length - 2000);
            }

            setLivePencilPath(prev => prev ? { 
                ...prev, 
                path: [...points]
            } : null);
        }
        return;
    }

    if (activeTool === 'pen' && draggingPoint) {
        setLivePath(prev => {
            if (!prev) return null;
            const newPath = prev.map(p => ({...p}));
            const point = newPath[draggingPoint.index];
            if (!point) return prev;

            if (draggingPoint.type === 'anchor') {
                const dx = x - point.x;
                const dy = y - point.y;
                point.x = x; point.y = y;
                point.cp1x += dx; point.cp1y += dy;
                point.cp2x += dx; point.cp2y += dy;
            } else if (draggingPoint.type === 'cp2') {
                point.cp2x = x;
                point.cp2y = y;
                point.cp1x = point.x - (x - point.x);
                point.cp1y = point.y - (y - point.y);
            } else if (draggingPoint.type === 'cp1') {
                point.cp1x = x;
                point.cp1y = y;
                point.cp2x = point.x - (x - point.x);
                point.cp2y = point.y - (y - point.y);
            }
            return newPath;
        });
        return;
    }

    if (isPanning.current) {
      const newPan = { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y };
      setViewState({ ...viewState, pan: newPan });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawing && activeTool === 'brush') {
        setIsDrawing(false);
        setLivePencilPath(null);
        endTransaction();

        const points = drawingPointsRef.current;
        const bristleTipData = bristleTipRef.current;

        if (points.length >= 2) {
            const allX = points.map(p => p[0]);
            const allY = points.map(p => p[1]);
            
            // Add padding for the stroke thickness and bristle spread
            const padding = brushOptions.size * 1.5;
            const minX = Math.min(...allX) - padding;
            const minY = Math.min(...allY) - padding;
            const maxX = Math.max(...allX) + padding;
            const maxY = Math.max(...allY) + padding;
            
            const width = Math.max(1, maxX - minX);
            const height = Math.max(1, maxY - minY);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: true });
            
            if (ctx) {
                // Adjust points relative to the new cropped canvas
                const localPoints = points.map(([px, py]) => [px - minX, py - minY]);
                
                // Render the finalized stroke using the same engine
                for (let i = 1; i < localPoints.length; i++) {
                    const [x1, y1] = localPoints[i - 1];
                    const [x2, y2] = localPoints[i];
                    
                    renderBristleSegment(
                        ctx, 
                        x1, y1, x2, y2, 
                        bristleTipData, 
                        brushOptions.brushTip as BrushEngineTip, 
                        brushOptions.color, 
                        brushOptions.flow
                    );
                }
                
                const dataUrl = canvas.toDataURL();
                // We save it as an image layer to lock in the rendering. Fast and deterministic!
                const newElement: DesignElement = {
                    id: crypto.randomUUID(), type: 'image', x: minX, y: minY, width, height, rotation: 0, opacity: 1, visible: true, locked: false,
                    src: dataUrl, objectFit: 'contain', backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
                    content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', shapeType: 'rectangle', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
                };
                updatePage(currentPage, { elements: [...currentElements, newElement] });
                setSelectedElementIds([newElement.id]);
            }
        }
        drawingPointsRef.current = [];
        bristleTipRef.current = [];
        return;
    }

    if (activeTool === 'pen') {
        setDraggingPoint(null);
        endTransaction();
    }

    if (isPanning.current) {
      isPanning.current = false;
      let newCursor = 'default';
      if (isSpacePressed) newCursor = 'grab';
      else if (activeTool === 'pen') newCursor = PEN_CURSOR;
      else if (activeTool === 'brush') newCursor = 'none';
      e.currentTarget.style.cursor = newCursor;
    }
  };

  const handleZoomIn = () => setViewState(vs => ({...vs, zoom: Math.min(vs.zoom * 1.2, 5) }));
  const handleZoomOut = () => setViewState(vs => ({...vs, zoom: Math.max(vs.zoom / 1.2, 0.1) }));
  
  const handlePreview = () => {
    try {
      const designData = {
        elements: currentElements,
        product: currentState.product,
        background: currentBackground,
        bleed: bleed,
        safetyMargin: safetyMargin,
      };
      localStorage.setItem('design_preview', JSON.stringify(designData));
      window.open('/design/preview', '_blank');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not open preview' });
    }
  };

  const handleDownload = () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    toast({ title: 'Opening Print Preview...' });
    try {
        const designData: RenderData = {
            pages: pages,
            product: product,
            guides: guides,
            bleed: bleed,
            safetyMargin: safetyMargin,
        };
        localStorage.setItem('pdf_render_data', JSON.stringify(designData));
        const renderUrl = '/pdf-render';
        const pdfWindow = window.open(renderUrl, '_blank');
        if (!pdfWindow) throw new Error("Could not open new window. Please disable your pop-up blocker.");
    } catch (error) {
        toast({ variant: 'destructive', title: 'Could not prepare PDF' });
    } finally {
        setTimeout(() => setIsDownloadingPdf(false), 3000);
    }
  };

  const getCenterPosition = (elementWidth: number, elementHeight: number) => {
    const centerX = (product.width - elementWidth) / 2;
    const centerY = (product.height - elementHeight) / 2;
    return { x: centerX, y: centerY };
  };

  const addQrCodeElement = (value: string, style: string) => {
    const size = 300;
    const { x, y } = getCenterPosition(size, size);
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'qrcode', x, y, width: size, height: size, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
      qrValue: value || 'https://amazoprint.com',
      qrColor: '#000000',
      qrBgColor: '#FFFFFF',
      qrLevel: 'M',
      qrIconSize: 20,
      qrStylePreset: style as any || 'default',
      content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle'
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
    if (isMobile) { setMobileSheetOpen(false); } else { setLeftOpen(false); }
  };
  
  const addTextElement = (options: Partial<DesignElement>) => {
    const defaultTextElement: DesignElement = {
      id: crypto.randomUUID(), type: 'text', x: 0, y: 0, width: 250, height: 50, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid', borderRadius: 0,
      content: 'Hello World', fontSize: 24, fontFamily: 'Inter', color: '#000000', fontWeight: 'normal', fontStyle: 'normal',
      textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', textTransform: 'none', verticalAlign: 'middle',
      src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
      filterGrayscale: 0, filterSepia: 0, filterInvert: 0, filterHueRotate: 0, filterBlur: 0, flipHorizontal: false, flipVertical: false,
      shapeType: 'rectangle',
    };

    const newElement = { ...defaultTextElement, ...options };
    
    if (newElement.fontSize && !options.width && !options.height) {
        newElement.width = (newElement.content?.length || 10) * (newElement.fontSize / 1.8) + newElement.fontSize;
        newElement.height = newElement.fontSize * 1.5;
    }


    const { x, y } = getCenterPosition(newElement.width || 250, newElement.height || 50);
    newElement.x = x;
    newElement.y = y;

    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
    if (isMobile) { setMobileSheetOpen(false); } else { setLeftOpen(false); }
  };
  
  const handleAddImageFromLibrary = (src: string) => {
    const size = 400;
    const { x, y } = getCenterPosition(size, size);
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'image', x, y, width: size, height: size, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
      src, objectFit: 'contain', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
      content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', shapeType: 'rectangle',
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
    if (isMobile) { setMobileSheetOpen(false); } else { setLeftOpen(false); }
  };

  const handleAddShape = (shapeType: string) => {
    const isLine = shapeType === 'line';
    const width = isLine ? 400 : 300;
    const height = isLine ? 2 : 300;
    const { x, y } = getCenterPosition(width, height);
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'shape', shapeType, x, y, width, height, rotation: 0, opacity: 1, visible: true, locked: false,
      backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 1, borderColor: '#000000', borderStyle: 'solid',
      color: '#cccccc', fillType: 'solid',
      content: '', fontSize: 0, fontFamily: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
    if (isMobile) { setMobileSheetOpen(false); } else { setLeftOpen(false); }
  };

  const handleAddEmoji = (emoji: string) => {
    const size = 250;
    const { x, y } = getCenterPosition(size, size);
    const newElement: DesignElement = {
      id: crypto.randomUUID(), type: 'text', x, y, width: size, height: size, rotation: 0, opacity: 1, backgroundColor: 'transparent', visible: true, locked: false,
      boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid', borderRadius: 0, content: emoji,
      fontSize: 200, fontFamily: 'Inter', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none',
      letterSpacing: 0, lineHeight: 1, textAlign: 'center', textTransform: 'none', verticalAlign: 'middle', src: '', objectFit: 'cover',
      filterBrightness: 1, filterContrast: 1, filterSaturate: 1, filterGrayscale: 0, filterSepia: 0, filterInvert: 0, filterHueRotate: 0, filterBlur: 0,
      flipHorizontal: false, flipVertical: false, shapeType: 'rectangle',
    };
    updatePage(currentPage, { elements: [...currentElements, newElement] });
    setSelectedElementIds([newElement.id]);
    if (isMobile) { setMobileSheetOpen(false); } else { setLeftOpen(false); }
  };

  const handleAddGroupedElements = (elements: Partial<DesignElement>[]) => {
    if (elements.length === 0) return;

    const newElements = elements.map(el => ({
      ...el,
      id: crypto.randomUUID(),
    })) as DesignElement[];
    
    const minX = Math.min(...newElements.map(el => el.x));
    const minY = Math.min(...newElements.map(el => el.y));
    const maxX = Math.max(...newElements.map(el => el.x + el.width));
    const maxY = Math.max(...newElements.map(el => el.y + el.height));
    
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    const { x: groupX, y: groupY } = getCenterPosition(groupWidth, groupHeight);

    const newGroup: DesignElement = {
        id: crypto.randomUUID(), type: 'group', x: groupX, y: groupY, width: groupWidth, height: groupHeight, rotation: 0, opacity: 1, visible: true, locked: false,
        children: newElements.map(el => ({ ...el, x: el.x - minX, y: el.y - minY })),
        backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
        borderRadius: 0, content: '', fontSize: 1, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal',
        textDecoration: 'none', letterSpacing: 0, lineHeight: 1, textAlign: 'left', src: '', objectFit: 'cover',
        filterBrightness: 1, filterContrast: 1, filterSaturate: 1, filterGrayscale: 0, filterSepia: 0, filterInvert: 0,
        filterHueRotate: 0, filterBlur: 0, flipHorizontal: false, flipVertical: false, shapeType: 'rectangle', textTransform: 'none', verticalAlign: 'top',
    };
    
    updatePage(currentPage, { elements: [...currentElements, newGroup] });
    setSelectedElementIds([newGroup.id]);
    if (isMobile) { setMobileSheetOpen(false); } else { setLeftOpen(false); }
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
    if (croppingElementId) return;
    if (activeTool === 'brush' || activeTool === 'pen') return;

    if (id) {
        const element = findElementRecursive(currentElements, id);
        if (element?.locked) {
            if (!isShift) {
                setSelectedElementIds([]);
            }
            return;
        }
    }

    setActiveTool('select');
    if (isShift) {
      setSelectedElementIds(prev => id === null ? prev : (prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]));
    } else {
      setSelectedElementIds(id ? [id] : []);
    }
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
      if (propsToUpdate.width) propsToUpdate.width = Math.round(propsToUpdate.width / gridSize) * gridSize;
      if (propsToUpdate.height) propsToUpdate.height = Math.round(propsToUpdate.height / gridSize) * gridSize;
    }
    
    const newPageElements = recursiveUpdate(currentElements, id, propsToUpdate);
    updatePage(currentPage, { elements: newPageElements });
  };
  
  const addGuide = (orientation: 'horizontal' | 'vertical', position: number) => {
    const newGuide = { id: crypto.randomUUID(), orientation, position };
    setIsDirty(true);
    setState((prev) => ({ ...prev, guides: [...prev.guides, newGuide] }));
    return newGuide.id;
  };

  const updateGuide = (id: string, position: number) => {
    setIsDirty(true);
    setState((prev) => ({...prev, guides: prev.guides.map((g) => (g.id === id ? { ...g, position } : g))}));
  };

  const removeGuide = (id: string) => {
    setIsDirty(true);
    setState((prev) => ({ ...prev, guides: prev.guides.filter((g) => g.id !== id) }));
  };
  
  const selectedElements = selectedElementIds.map(id => findElementRecursive(currentElements, id)).filter((el): el is DesignElement => !!el);
  const selectedElement = selectedElements[0];

  const handleProductUpdate = (newProps: Partial<Product>) => {
    setIsDirty(true);
    setState(s => ({ ...s, product: { ...s.product, ...newProps }}));
  };

  const onQuantityChange = (newQuantity: number) => {
    setIsDirty(true);
    setState(s => ({...s, quantity: newQuantity}));
  };

  const onBackgroundChange = (newBackground: Background) => updatePage(currentPage, { background: newBackground });

  const handleSave = async () => {
    const saveData = {
        productSlug: product.id,
        elements: pages.map(p => p.elements),
        background: pages.map(p => p.background),
        guides,
        quantity,
        width: Math.round(product.width * PX_TO_MM),
        height: Math.round(product.height * PX_TO_MM),
    };

    if (currentDesignId && currentDesignName) {
      try {
        await updateDesign({ id: currentDesignId, name: currentDesignName, verificationId: verificationId || null, ...saveData });
        toast({ title: 'Design Updated!' });
        setIsDirty(false);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error Updating Design' });
      }
    } else {
      const designName = prompt('Enter a name for your design:');
      if (designName) {
        try {
          const savedDesign = await saveDesign({ name: designName, ...saveData });
          setCurrentDesignId(savedDesign.id);
          setCurrentDesignName(savedDesign.name);
          toast({ title: 'Design Saved!' });
          setIsDirty(false);

          if (verificationId) {
            await linkDesignToVerification(Number(verificationId), savedDesign.id);
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error Saving Design' });
        }
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
          const saveData = {
            name: designName,
            productSlug: product.id,
            elements: pages.map(p => p.elements),
            background: pages.map(p => p.background),
            guides,
            quantity,
            width: Math.round(product.width * PX_TO_MM),
            height: Math.round(product.height * PX_TO_MM),
          };
          const savedDesign = await saveDesign(saveData);
          setCurrentDesignId(savedDesign.id);
          setCurrentDesignName(savedDesign.name);
          designId = savedDesign.id;
          setIsDirty(false);
          toast({ title: 'Design Saved!' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error Saving Design', description: 'Could not save your design before ordering.' });
          setIsOrdering(false);
          return;
        }
      } else {
        toast({ variant: 'destructive', title: 'Order Canceled', description: 'A design must be named and saved before ordering.' });
        setIsOrdering(false);
        return;
      }
    }
    
    if (designId) {
      router.push(`/checkout?designId=${designId}&quantity=${quantity}`);
    } else {
        setIsOrdering(false);
    }
  };

  const handleLoadDesign = (design: Awaited<ReturnType<typeof getMyDesigns>>[0]) => {
    const isMultiPageElements = design.elements && Array.isArray(design.elements) && design.elements.length > 0 && Array.isArray(design.elements[0]);
    const isMultiPageBackground = design.background && Array.isArray(design.background);

    const newTotalPages = isMultiPageElements ? (design.elements as DesignElement[][]).length : 1;

    let newPages: Page[] = [];
    for(let i = 0; i < newTotalPages; i++) {
        const pageElements = isMultiPageElements ? (design.elements as DesignElement[][])[i] : (i === 0 ? design.elements as DesignElement[] : []);
        const pageBackground = isMultiPageBackground ? (initialBackground as Background[])[i] : (i === 0 ? design.background as Background : { type: 'solid', color: '#ffffff' });
        
        newPages.push({
            elements: pageElements?.map(el => ({ ...el, visible: el.visible ?? true, locked: el.locked ?? false })) || [],
            background: pageBackground || { type: 'solid', color: '#ffffff' }
        })
    }

    const loadedProduct: Product = {
      id: design.productSlug,
      name: design.name,
      description: '',
      imageId: design.thumbnailUrl || '',
      width: Math.round(design.width * MM_TO_PX),
      height: Math.round(design.height * MM_TO_PX),
      type: design.productSlug.replace('-', ' '),
    };

    setCurrentDesignId(design.id);
    setCurrentDesignName(design.name);

    resetHistory({
      pages: newPages,
      guides: (design.guides as Guide[]) || [],
      product: loadedProduct,
      quantity: design.quantity,
    });

    setIsLoadDialogOpen(false);
    setIsDirty(false);
    toast({
      title: "Design Loaded",
      description: `"${design.name}" is now ready for editing.`,
    });
  };

  const handleSubmitToContest = async () => {
    if (!contestId) return;
    setIsSubmitting(true);
    try {
        const designData = {
          productSlug: product.id,
          elements: currentElements,
          guides, quantity: quantity,
          width: Math.round(product.width * PX_TO_MM),
          height: Math.round(product.height * PX_TO_MM),
          background: currentBackground,
        };
        await submitContestEntry(Number(contestId), designData);
        toast({ title: 'Submission Successful!'});
    } catch (error) {
        toast({ variant: 'destructive', title: 'Submission Failed' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleSetSpecialFinish = (active: boolean, foil?: FoilType | null) => {
    if (selectedElementIds.length !== 1) return;
    const selectedId = selectedElementIds[0];

    if (!active) {
      updateElement(selectedId, { spotUv: false, foilId: undefined });
    } else {
      if (foil) {
        updateElement(selectedId, {
          spotUv: true,
          foilId: foil.id,
        });
      } else {
        updateElement(selectedId, {
          spotUv: true,
          foilId: undefined,
        });
      }
    }
  };

  const handleDuplicateElement = () => {
    if (selectedElements.length === 0) return;
    const newElementsToPush: DesignElement[] = [];
    const duplicateRecursive = (element: DesignElement): DesignElement => {
      const newEl = { ...element, id: crypto.randomUUID(), x: element.x + 10, y: element.y + 10, locked: false, visible: true };
      if (newEl.type === 'group' && newEl.children) {
        newEl.children = newEl.children.map(child => duplicateRecursive(child));
      }
      return newEl;
    }
    selectedElements.forEach(element => newElementsToPush.push(duplicateRecursive(element)));
    updatePage(currentPage, { elements: [...currentElements, ...newElementsToPush] });
    setSelectedElementIds(newElementsToPush.map(el => el.id));
  };
  
  const handleDuplicateLayer = (id: string) => {
    const elementToDuplicate = findElementRecursive(currentElements, id);
    if (!elementToDuplicate) return;

    const duplicateRecursive = (element: DesignElement): DesignElement => {
      const newEl = { ...element, id: crypto.randomUUID(), x: element.x + 10, y: element.y + 10, locked: false, visible: true };
      if (newEl.type === 'group' && newEl.children) {
        newEl.children = newEl.children.map(child => duplicateRecursive(child));
      }
      return newEl;
    }
    
    const newElement = duplicateRecursive(elementToDuplicate);
    
    const topLevelIndex = currentElements.findIndex(el => el.id === id || (el.children && findElementRecursive(el.children, id)));
    
    const newElements = [...currentElements];
    if(topLevelIndex !== -1) {
        newElements.splice(topLevelIndex + 1, 0, newElement);
    } else {
        newElements.push(newElement);
    }

    updatePage(currentPage, { elements: newElements });
    setSelectedElementIds([newElement.id]);
  };

  const handleDeleteElement = () => {
    if (selectedElementIds.length === 0) return;
    handleDeleteLayer(selectedElementIds[0]);
  };

  const handleDeleteLayer = (id: string) => {
    const recursiveDelete = (els: DesignElement[], idToRemove: string): DesignElement[] => {
      const filtered = els.filter(el => el.id !== idToRemove);
      return filtered.map(el => {
          if (el.type === 'group' && el.children) {
              return { ...el, children: recursiveDelete(el.children, idToRemove) };
          }
          return el;
      });
    };
    updatePage(currentPage, { elements: recursiveDelete(currentElements, id) });
    if (selectedElementIds.includes(id)) {
        setSelectedElementIds(ids => ids.filter(selectedId => selectedId !== id));
    }
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElement) return;
    const el = selectedElement;
    let newX = el.x;
    let newY = el.y;
    if (alignment === 'left') newX = 0;
    if (alignment === 'center') newX = (product.width - (el.width || 0)) / 2;
    if (alignment === 'right') newX = product.width - (el.width || 0);
    if (alignment === 'top') newY = 0;
    if (alignment === 'middle') newY = (product.height - (el.height || 0)) / 2;
    if (alignment === 'bottom') newY = product.height - (el.height || 0);
    updateElement(el.id, { x: newX, y: newY });
  };

  const handleDeleteAll = () => {
    updatePage(currentPage, { elements: [] });
    setSelectedElementIds([]);
  };

  const moveLayer = (direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (selectedElementIds.length !== 1) return;
    const selectedId = selectedElementIds[0];
    let newElements = [...currentElements];
    const currentIndex = newElements.findIndex(el => el.id === selectedId);
    if (currentIndex === -1) return;
    const [element] = newElements.splice(currentIndex, 1);
    if (direction === 'front') newElements.push(element);
    else if (direction === 'back') newElements.unshift(element);
    else if (direction === 'forward') newElements.splice(Math.min(newElements.length, currentIndex + 1), 0, element);
    else if (direction === 'backward') newElements.splice(Math.max(0, currentIndex - 1), 0, element);
    updatePage(currentPage, { elements: newElements });
  };

  const handleGroup = () => {
    if (selectedElements.length < 2) return;
    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
    
    const newGroup: DesignElement = {
        id: crypto.randomUUID(), type: 'group', x: minX, y: minY, width: maxX - minX, height: maxY - minY, rotation: 0, opacity: 1, visible: true, locked: false,
        children: selectedElements.map(el => ({ ...el, x: el.x - minX, y: el.y - minY })),
        backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
        borderRadius: 0, content: '', fontSize: 1, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal',
        textDecoration: 'none', letterSpacing: 0, lineHeight: 1, textAlign: 'left', src: '', objectFit: 'cover',
        filterBrightness: 1, filterContrast: 1, filterSaturate: 1, filterGrayscale: 0, filterSepia: 0, filterInvert: 0,
        filterHueRotate: 0, filterBlur: 0, flipHorizontal: false, flipVertical: false, shapeType: 'rectangle', textTransform: 'none', verticalAlign: 'top',
    };
    const elementsWithoutGrouped = currentElements.filter(el => !selectedElementIds.includes(el.id));
    updatePage(currentPage, { elements: [...elementsWithoutGrouped, newGroup] });
    setSelectedElementIds([newGroup.id]);
  };

  const handleUngroup = () => {
      if (!selectedElement || selectedElement.type !== 'group' || !selectedElement.children) return;
      const ungroupedChildren = selectedElement.children.map(child => ({ ...child, x: selectedElement.x + child.x, y: selectedElement.y + child.y, rotation: selectedElement.rotation + child.rotation }));
      const elementsWithoutGroup = currentElements.filter(el => el.id !== selectedElement.id);
      updatePage(currentPage, { elements: [...elementsWithoutGroup, ...ungroupedChildren] });
      setSelectedElementIds(ungroupedChildren.map(c => c.id));
  };
  
  const handleToggleLayerVisibility = (id: string) => {
    const recursiveToggle = (els: DesignElement[]): DesignElement[] => {
        return els.map(el => {
            if (el.id === id) {
                return { ...el, visible: !(el.visible ?? true) };
            }
            if (el.children) {
                return { ...el, children: recursiveToggle(el.children) };
            }
            return el;
        });
    };
    updatePage(currentPage, { elements: recursiveToggle(currentElements) });
  };
  
  const handleToggleLayerLock = (id: string) => {
    const recursiveToggle = (els: DesignElement[]): DesignElement[] => {
        return els.map(el => {
            if (el.id === id) {
                return { ...el, locked: !el.locked };
            }
            if (el.children) {
                return { ...el, children: recursiveToggle(el.children) };
            }
            return el;
        });
    };
    updatePage(currentPage, { elements: recursiveToggle(currentElements) });
    if (selectedElementIds.includes(id)) {
        setSelectedElementIds(ids => ids.filter(selectedId => selectedId !== id));
    }
  };

  const handleClearBrushStrokes = () => {
    // Remove brush-type elements and dataURL images (created by spray/complex brush tools)
    const filtered = currentElements.filter(el =>
      el.type !== 'brush' && !(el.type === 'image' && el.src?.startsWith('data:image'))
    );
    updatePage(currentPage, { elements: filtered });
    setSelectedElementIds([]);
  };

  const isMultiSelect = selectedElements.length > 1;
  const isSingleElementSelected = selectedElements.length === 1;
  const isGroupSelected = isSingleElementSelected && selectedElement?.type === 'group';

  const handleMobilePanelOpen = (panel: string) => {
    setActiveMobilePanel(panel);
    setMobileSheetOpen(true);
    if(panel === 'brush' || panel === 'pen') {
        setActiveTool(panel as any);
    } else {
        setActiveTool('select');
    }
  }

  const renderMobilePanelContent = () => {
    switch (activeMobilePanel) {
        case 'elements': return <TextAddPanel onAddText={addTextElement} onAddGroupedElements={handleAddGroupedElements} />;
        case 'media': return <MediaPanel onImageSelect={handleAddImageFromLibrary} onAddShape={handleAddShape} onEmojiSelect={handleAddEmoji} isAdmin={isAdmin} />;
        case 'qrcode': return <QrCodePanel onAddQrCode={addQrCodeElement} />;
        case 'brush': return <BrushToolPanel options={brushOptions} setOptions={setBrushOptions} onClear={handleClearBrushStrokes} />;
        case 'pen': return <PenToolPanel onFinish={() => finalizePath()} />;
        case 'properties': return (
            <div className="p-4">
                <PropertiesPanel
                    element={selectedElement} onUpdate={updateElement} product={product} onProductUpdate={handleProductUpdate}
                    quantity={quantity} onQuantityChange={onQuantityChange} background={currentBackground} onBackgroundChange={onBackgroundChange}
                    canvasSettings={{ showRulers, setShowRulers, showGrid, setShowGrid, snapToGrid, setSnapToGrid, gridSize, setGridSize, showPrintGuidelines, setShowPrintGuidelines, bleed, setBleed, safetyMargin, setSafetyMargin }}
                    croppingElementId={croppingElementId}
                    setCroppingElementId={setCroppingElementId}
                    isAdmin={isAdmin}
                    onMoveLayer={moveLayer}
                />
            </div>
        );
        default: return null;
    }
  }
  
  if (!currentState) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const elementToCrop = croppingElementId ? findElementRecursive(currentElements, croppingElementId) : undefined;

  return (
    <>
      <div className="grid grid-rows-[auto_1fr] h-screen w-full bg-background print:hidden">
        <EditorHeader 
          product={product}
          currentDesignName={currentDesignName}
          currentDesignId={currentDesignId}
          verificationId={verificationId}
          contestId={contestId}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          currentElements={currentElements}
          selectedElementIds={selectedElementIds}
          selectedElement={selectedElement}
          selectedElements={selectedElements}
          handleSelectElement={handleSelectElement}
          handleToggleLayerVisibility={handleToggleLayerVisibility}
          handleToggleLayerLock={handleToggleLayerLock}
          handleDuplicateLayer={handleDuplicateLayer}
          handleDeleteLayer={handleDeleteLayer}
          handleDeleteAll={handleDeleteAll}
          handleDuplicateElement={handleDuplicateElement}
          handleDeleteElement={handleDeleteElement}
          moveLayer={moveLayer}
          handleAlign={handleAlign}
          updateElement={updateElement}
          isSingleElementSelected={isSingleElementSelected}
          showRulers={showRulers}
          setShowRulers={setShowRulers}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showPrintGuidelines={showPrintGuidelines}
          setShowPrintGuidelines={setShowPrintGuidelines}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          setIsLoadDialogOpen={setIsLoadDialogOpen}
          handleSave={handleSave}
          handlePreview={handlePreview}
          handleDownload={handleDownload}
          handleOrder={handleOrder}
          handleSubmitToContest={handleSubmitToContest}
          isAdmin={isAdmin}
          isDownloadingPdf={isDownloadingPdf}
          isOrdering={isOrdering}
          isSubmitting={isSubmitting}
          confirmNavigation={confirmNavigation}
        />

        <div className="flex overflow-hidden relative">
          <EditorSidebarLeft
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              isAdmin={isAdmin}
              onAddImage={handleAddImageFromLibrary}
              onAddShape={handleAddShape}
              onAddEmoji={handleAddEmoji}
              onAddText={addTextElement}
              onAddGroupedElements={handleAddGroupedElements}
              onAddQrCode={addQrCodeElement}
              brushOptions={brushOptions}
              setBrushOptions={setBrushOptions}
              onClearBrush={handleClearBrushStrokes}
              finalizePath={finalizePath}
          />
          <SidebarRail side="left" />

          <SidebarInset className="min-h-0 flex-1 p-0 m-0 lg:pb-0" style={{ paddingBottom: isMobile ? '80px' : '0' }}>
            <div
              ref={mainCanvasRef}
              className="flex-1 overflow-hidden p-0 relative"
              style={{ cursor: isSpacePressed ? 'grab' : activeTool === 'pen' ? PEN_CURSOR : (activeTool === 'brush' ? 'none' : 'default'), backgroundColor: 'hsl(var(--muted))' }}
              onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            >
              {(activeTool === 'brush') && mousePos && !isPanning.current && (
                  <div 
                    style={{
                        position: 'fixed',
                        left: mousePos.screenX ?? 0,
                        top: mousePos.screenY ?? 0,
                        width: brushOptions.size * viewState.zoom,
                        height: brushOptions.size * viewState.zoom,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        border: '1.5px solid white',
                        boxShadow: '0 0 0 1px black, inset 0 0 4px rgba(0,0,0,0.2)',
                        borderRadius: brushOptions.brushTip === 'chisel' ? '2px' : '50%',
                        opacity: 0.8,
                        background: 'transparent'
                    }}
                  />
              )}

              {selectedElements.length > 0 && 
                <ElementToolbar 
                    selectedElements={selectedElements} 
                    viewState={viewState} 
                    onDuplicate={handleDuplicateElement} 
                    onDelete={handleDeleteElement}
                    spotUvAllowed={spotUvAllowed}
                    availableFoils={availableFoils}
                    onSetSpecialFinish={handleSetSpecialFinish}
                />}
              <DesignCanvas
                product={product} elements={currentElements} selectedElementIds={selectedElementIds} onSelectElement={handleSelectElement} onUpdateElement={updateElement} background={currentBackground}
                showRulers={showRulers} showGrid={showGrid} gridSize={gridSize} guides={guides} smartGuides={activeSmartGuides}
                onAddGuide={addGuide} onUpdateGuide={updateGuide} onRemoveGuide={removeGuide} onSmartGuidesChange={setActiveSmartGuides}
                showPrintGuidelines={showPrintGuidelines} bleed={bleed} safetyMargin={safetyMargin} viewState={viewState}
                onInteractionStart={beginTransaction} onInteractionEnd={endTransaction}
                livePencilPath={livePencilPath}
                livePath={livePath}
                mousePos={mousePos}
                activeTool={activeTool}
                croppingElementId={croppingElementId}
                setCroppingElementId={setCroppingElementId}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-end justify-center gap-2">
                <div className="hidden lg:flex items-center gap-1 rounded-lg bg-card p-1.5 shadow-md border">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs w-16" onClick={resetView}>{Math.round(viewState.zoom * 100)}%</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </SidebarInset>

          <SidebarRail side="right" />
          <Sidebar side="right" collapsible="icon" className="hidden lg:block">
            <SidebarContent className="p-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <PropertiesPanel
                    element={selectedElement} onUpdate={updateElement} product={product} onProductUpdate={handleProductUpdate}
                    quantity={quantity} onQuantityChange={onQuantityChange} background={currentBackground} onBackgroundChange={onBackgroundChange}
                    canvasSettings={{ showRulers, setShowRulers, showGrid, setShowGrid, snapToGrid, setSnapToGrid, gridSize, setGridSize, showPrintGuidelines, setShowPrintGuidelines, bleed, setBleed, safetyMargin, setSafetyMargin }}
                    croppingElementId={croppingElementId}
                    setCroppingElementId={setCroppingElementId}
                    isAdmin={isAdmin}
                    onMoveLayer={moveLayer}
                  />
                </div>
              </ScrollArea>
            </SidebarContent>
          </Sidebar>
          
           {isMobile && (
            <div className="lg:hidden">
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="capitalize">{activeMobilePanel} Panel</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1">
                    {renderMobilePanelContent()}
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <footer className="fixed bottom-0 left-0 right-0 z-10 bg-card border-t p-2">
                <ScrollArea orientation="horizontal" className="w-full">
                    <div className="flex gap-1 justify-center px-4">
                        <Button 
                            variant={activeMobilePanel === 'properties' ? 'selected' : 'ghost'}
                            size="sm"
                            className="flex flex-col h-auto p-2 gap-1"
                            disabled={!selectedElement}
                            onClick={() => handleMobilePanelOpen('properties')}
                           >
                            <SlidersHorizontal/>
                            <span className="text-[10px]">Properties</span>
                           </Button> 
                    </div>
                </ScrollArea>
              </footer>
            </div>
           )}
        </div>
      </div>
      <LoadDesignDialog isOpen={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen} onLoad={handleLoadDesign} />
      {elementToCrop && (
        <CropDialog
          element={elementToCrop}
          onClose={() => setCroppingElementId(null)}
          onApply={(cropData) => {
            const { processedSrc, crop, removeColor, threshold, newAspectRatio } = cropData;
            
            const currentElement = findElementRecursive(currentElements, elementToCrop.id);
            if (!currentElement) return;

            let newHeight = currentElement.height;
            if (newAspectRatio && isFinite(newAspectRatio) && newAspectRatio > 0) {
              newHeight = currentElement.width / newAspectRatio;
            }

            updateElement(elementToCrop.id, { 
              src: processedSrc,
              crop, 
              removeColor, 
              colorThreshold: threshold,
              height: newHeight,
            });
            setCroppingElementId(null);
          }}
        />
      )}
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

