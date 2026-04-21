
'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
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
  Type,
  Image as ImageIcon,
  LayoutGrid,
  Brush,
  Redo,
  X,
  Loader2,
  Layers,
  Eye,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  QrCode,
  ShoppingCart,
  PenTool,
  MoreVertical,
  SlidersHorizontal,
  Library,
  Undo,
  Crop as CropIcon,
} from 'lucide-react';
import { PropertiesPanel } from './properties-panel';
import { DesignCanvas } from './design-canvas';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DesignElement, Product, Design, Background, Guide, ViewState, Page, RenderData, FoilType, PathPoint } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ElementToolbar } from './element-toolbar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LayersPanel } from './layers-panel';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { getMyDesigns, saveDesign, updateDesign } from '@/app/actions/design-actions';
import { submitContestEntry } from '@/app/actions/contest-actions';
import { linkDesignToVerification } from '@/app/actions/verification-actions';
import { LoadDesignDialog } from './load-design-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn, resolveImagePath } from '@/lib/utils';
import { CropDialog } from './crop-dialog';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { TextAddPanel } from './panels/text-add-panel';
import { AmazoprintLogo } from '../ui/logo';

const MediaPanel = lazy(() => import('./panels/media-panel').then(m => ({ default: m.MediaPanel })));
const QrCodePanel = lazy(() => import('./panels/qrcode-panel').then(m => ({ default: m.QrCodePanel })));
const PencilToolPanel = lazy(() => import('./pencil-tool-panel').then(m => ({ default: m.PencilToolPanel })));
const PenToolPanel = lazy(() => import('./pen-tool-panel').then(m => ({ default: m.PenToolPanel })));

const DPI = 300;
const MM_PER_INCH = 25.4;
const PX_TO_MM = MM_PER_INCH / DPI;
const MM_TO_PX = DPI / MM_PER_INCH;
const RULER_SIZE = 60;

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
  
  const [activeTool, setActiveTool] = useState<'select' | 'brush' | 'pen'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingPointsRef = useRef<[number, number][]>([]);
  const [livePencilPath, setLivePencilPath] = useState<{ path: [number, number][]; strokeColor: string; strokeWidth: number; } | null>(null);
  const [brushOptions, setBrushOptions] = useState({
      drawMode: 'freehand' as 'freehand' | 'straight',
      brushStyle: 'solid' as 'solid' | 'dashed' | 'dotted' | 'spray',
      strokeWidth: 5,
      strokeColor: '#000000',
      strokeLineCap: 'round' as 'butt' | 'round' | 'square',
      sprayDensity: 20,
      sprayRadius: 40,
  });
  
  // Pen Tool States
  const [livePath, setLivePath] = useState<PathPoint[] | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{ index: number; type: 'anchor' | 'cp1' | 'cp2' } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);

  const [sprayingState, setSprayingState] = useState<{ active: boolean; position: {x: number, y: number} | null }>({ active: false, position: null });
  const [liveSprayPuffs, setLiveSprayPuffs] = useState<{x: number; y: number; radius: number; color: string;}[]>([]);

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

  useEffect(() => {
    const fontFamilies = [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Poppins', 'Nunito',
      'Playfair Display', 'Merriweather', 'Ubuntu', 'PT Sans', 'Lora', 'Source Sans Pro',
      'Pacifico', 'Dancing Script', 'Lobster', 'Bebas Neue', 'Caveat',
      'Bevan', 'Bree Serif', 'Coda', 'Frijole', 'Fugaz One', 'Jura'
    ];
    const fontUrl = `https://fonts.googleapis.com/css2?${fontFamilies.map(f => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap`;

    const link = document.createElement('link');
    link.id = 'google-fonts-dynamic';
    link.href = fontUrl;
    link.rel = 'stylesheet';
    
    document.head.appendChild(link);

    return () => {
      const existingLink = document.getElementById('google-fonts-dynamic');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  const updatePage = useCallback((pageIndex: number, newPageData: Partial<Page>) => {
    setState(prev => {
        if (!prev) return prev;
        const newPages = [...prev.pages];
        newPages[pageIndex] = { ...newPages[pageIndex], ...newPageData };
        return { ...prev, pages: newPages };
    })
  }, [setState]);

  const finalizePath = useCallback(() => {
    if (!livePath || livePath.length < 2) {
        setLivePath(null);
        setDraggingPoint(null);
        setActiveTool('select');
        return;
    }

    const finalPath = [...livePath];
    
    // Calculate bounding box including handles
    const allX = finalPath.flatMap(p => [p.x, p.cp1x, p.cp2x]);
    const allY = finalPath.flatMap(p => [p.y, p.cp1y, p.cp2y]);
    
    const minX = Math.min(...allX) - 2;
    const minY = Math.min(...allY) - 2;
    const maxX = Math.max(...allX) + 2;
    const maxY = Math.max(...allY) + 2;

    const firstPoint = finalPath[0];
    const lastPoint = finalPath[finalPath.length - 1];
    const isClosed = finalPath.length > 2 && Math.hypot(lastPoint.x - firstPoint.x, lastPoint.y - firstPoint.y) < 25 / viewState.zoom;

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
        const pageElements = isMultiPageElements ? (initialElements as DesignElement[][])[i] : (i === 0 ? initialElements as DesignElement[] : undefined);
        const pageBackground = isMultiPageBackground ? (initialBackground as Background[])[i] : (i === 0 ? initialBackground as Background : undefined);

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

    const lastSprayPoint = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const spray = () => {
            if (sprayingState.active && sprayingState.position) {
                const currentPos = sprayingState.position;
                const startPos = lastSprayPoint.current || currentPos;

                const dx = currentPos.x - startPos.x;
                const dy = currentPos.y - startPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const steps = Math.max(1, Math.floor(dist / 2));

                const newPuffs = [];
                for (let i = 0; i < steps; i++) {
                    const t = i / steps;
                    const x = lerp(startPos.x, currentPos.x, t);
                    const y = lerp(startPos.y, currentPos.y, t);

                    newPuffs.push({
                        x,
                        y,
                        radius: brushOptions.sprayRadius,
                        color: brushOptions.strokeColor,
                    });
                }
                
                setLiveSprayPuffs(prev => [...prev, ...newPuffs]);
                lastSprayPoint.current = currentPos;
            }
            animationFrameId = requestAnimationFrame(spray);
        };

        if (sprayingState.active) {
            animationFrameId = requestAnimationFrame(spray);
        } else {
            lastSprayPoint.current = null;
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [sprayingState, brushOptions.sprayRadius, brushOptions.strokeColor, brushOptions.sprayDensity]);


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

      // Undo last point in Pen tool: Ctrl + X or Cmd + X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && activeTool === 'pen' && !isInput) {
          e.preventDefault();
          setLivePath(prev => {
              if (!prev || prev.length === 0) return null;
              if (prev.length === 1) return null;
              return prev.slice(0, -1);
          });
          toast({ title: 'Removed last point' });
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
  }, [undo, redo, activeTool, finalizePath, croppingElementId, setLeftOpen, toast]);


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
        if (brushOptions.brushStyle === 'spray') {
            const [x, y] = getPointInCanvas(e);
            setLiveSprayPuffs([]);
            lastSprayPoint.current = { x, y };
            setSprayingState({ active: true, position: { x, y } });
            return;
        }

        setIsDrawing(true);
        const startPoint = getPointInCanvas(e);
        drawingPointsRef.current = [startPoint];
        setLivePencilPath({
            path: [startPoint, startPoint],
            strokeColor: brushOptions.strokeColor,
            strokeWidth: brushOptions.strokeWidth,
        });
        return;
    }
     if (activeTool === 'pen') {
        e.stopPropagation();
        beginTransaction();
        const [x, y] = getPointInCanvas(e);

        if (livePath) {
            const hitRadius = 15 / viewState.zoom;
            
            // Check for closing path
            if (livePath.length > 2 && Math.hypot(x - livePath[0].x, y - livePath[0].y) < hitRadius) {
                // RETRACT PREVIOUS EXIT HANDLE TO ENSURE STRAIGHT FINISH ON CLOSE
                const updatedPath = [...livePath];
                const lastIdx = updatedPath.length - 1;
                updatedPath[lastIdx] = { ...updatedPath[lastIdx], cp2x: updatedPath[lastIdx].x, cp2y: updatedPath[lastIdx].y };
                setLivePath(updatedPath);
                finalizePath();
                return;
            }

            // Check for handle/anchor clicks
            for (let i = 0; i < livePath.length; i++) {
                const p = livePath[i];
                if (Math.hypot(x - p.x, y - p.y) < hitRadius) {
                    setDraggingPoint({ index: i, type: 'anchor' });
                    return;
                }
                if (Math.hypot(x - p.cp1x, p.cp1y) < hitRadius) {
                    setDraggingPoint({ index: i, type: 'cp1' });
                    return;
                }
                if (Math.hypot(x - p.cp2x, p.cp2y) < hitRadius) {
                    setDraggingPoint({ index: i, type: 'cp2' });
                    return;
                }
            }
        }

        // Add new point: initialized as straight (retract previous exit handle first)
        let updatedPath = livePath ? [...livePath] : [];
        if (updatedPath.length > 0) {
            const lastIdx = updatedPath.length - 1;
            updatedPath[lastIdx] = {
                ...updatedPath[lastIdx],
                cp2x: updatedPath[lastIdx].x,
                cp2y: updatedPath[lastIdx].y,
            };
        }

        const newPoint: PathPoint = { x, y, cp1x: x, cp1y: y, cp2x: x, cp2y: y };
        updatedPath.push(newPoint);
        setLivePath(updatedPath);
        
        // Start dragging the EXIT handle (cp2) for mirroring curvature on drag
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
    setMousePos({ x, y });

    if (sprayingState.active) {
        setSprayingState(s => (s.active ? { ...s, position: { x, y } } : s));
        return;
    }
    if (isDrawing && activeTool === 'brush' && brushOptions.brushStyle !== 'spray') {
        const currentPoint = [x, y] as [number, number];
        if (brushOptions.drawMode === 'freehand') {
            drawingPointsRef.current.push(currentPoint);
            setLivePencilPath(prev => prev ? { ...prev, path: [...drawingPointsRef.current] } : null);
        } else { // straight line
            const startPoint = drawingPointsRef.current[0];
            drawingPointsRef.current = [startPoint, currentPoint];
            setLivePencilPath(prev => prev ? { ...prev, path: [startPoint, currentPoint] } : null);
        }
        return;
    }

    if (activeTool === 'pen' && draggingPoint) {
        setLivePath(prev => {
            if (!prev) return null;
            const newPath = prev.map(p => ({...p}));
            const point = newPath[draggingPoint.index];
            if (!point) return prev; // Safety check

            if (draggingPoint.type === 'anchor') {
                const dx = x - point.x;
                const dy = y - point.y;
                point.x = x;
                point.y = y;
                point.cp1x += dx;
                point.cp1y += dy;
                point.cp2x += dx;
                point.cp2y += dy;
            } else if (draggingPoint.type === 'cp2') {
                point.cp2x = x;
                point.cp2y = y;
                // Mirrored CP1 for smooth curves
                point.cp1x = point.x - (x - point.x);
                point.cp1y = point.y - (y - point.y);
            } else if (draggingPoint.type === 'cp1') {
                point.cp1x = x;
                point.cp1y = y;
                // Mirrored CP2
                point.cp2x = point.x - (x - point.x);
                point.cp2y = point.y - (y - point.y);
            }
            return newPath;
        });
        return;
    }

    if (isPanning.current) {
      const newPan = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      };
      setViewState({ ...viewState, pan: newPan });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (sprayingState.active) {
        setSprayingState({ active: false, position: null });
        endTransaction();

        if (liveSprayPuffs.length > 0) {
            const puffs = [...liveSprayPuffs];
            setLiveSprayPuffs([]);

            const radius = brushOptions.sprayRadius;
            const minX = Math.min(...puffs.map(p => p.x - radius));
            const minY = Math.min(...puffs.map(p => p.y - radius));
            const maxX = Math.max(...puffs.map(p => p.x + radius));
            const maxY = Math.max(...puffs.map(p => p.y + radius));
            
            const width = maxX - minX;
            const height = maxY - minY;

            if (width <= 0 || height <= 0) return;

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = width;
            offscreenCanvas.height = height;
            const ctx = offscreenCanvas.getContext('2d');
            if (!ctx) return;

            const hexToRgbString = (hex: string) => {
                let s = hex.replace('#', '');
                if (s.length === 3) s = s.split('').map(c => c + c).join('');
                const num = parseInt(s, 16);
                return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
            };

            const addTexture = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
                const count = radius * (brushOptions.sprayDensity / 100);
                ctx.fillStyle = color;
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius;
                    const px = x + Math.cos(angle) * r;
                    const py = y + Math.sin(angle) * r;
                    ctx.globalAlpha = Math.random() * 0.05;
                    ctx.fillRect(px, py, 1, 1);
                }
                ctx.globalAlpha = 1;
            };

            puffs.forEach(puff => {
                const x = puff.x - minX;
                const y = puff.y - minY;
                const r = puff.radius;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
                const baseColor = hexToRgbString(puff.color);

                gradient.addColorStop(0, `rgba(${baseColor}, 0.25)`);
                gradient.addColorStop(0.3, `rgba(${baseColor}, 0.15)`);
                gradient.addColorStop(0.6, `rgba(${baseColor}, 0.07)`);
                gradient.addColorStop(1, `rgba(${baseColor}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();

                addTexture(ctx, x, y, r, puff.color);
            });

            const dataUrl = offscreenCanvas.toDataURL();
            const newElement: DesignElement = {
                id: crypto.randomUUID(), type: 'image', x: minX, y: minY, width, height, rotation: 0, opacity: 1, visible: true, locked: false,
                src: dataUrl, objectFit: 'contain',
                backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
                content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', shapeType: 'rectangle', filterBrightness: 1, filterContrast: 1, filterSaturate: 1,
            };

            updatePage(currentPage, { elements: [...currentElements, newElement] });
            setSelectedElementIds([newElement.id]);
        }
        return;
    }

    if (isDrawing && activeTool === 'brush' && brushOptions.brushStyle !== 'spray') {
        setIsDrawing(false);
        setLivePencilPath(null);
        endTransaction();

        const points = drawingPointsRef.current;
        if (points.length >= 2) {
            const minX = Math.min(...points.map(p => p[0]));
            const minY = Math.min(...points.map(p => p[1]));
            const maxX = Math.max(...points.map(p => p[0]));
            const maxY = Math.max(...points.map(p => p[1]));

            const newElement: DesignElement = {
                id: crypto.randomUUID(),
                type: 'brush',
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
                rotation: 0,
                opacity: 1,
                path: points.map(([px, py]) => [px - minX, py - minY]),
                strokeColor: brushOptions.strokeColor,
                strokeWidth: brushOptions.strokeWidth,
                brushStyle: brushOptions.brushStyle,
                strokeLineCap: brushOptions.strokeLineCap,
                content: '', fontSize: 0, fontFamily: '', color: '', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2, textAlign: 'left', src: '', objectFit: 'cover', filterBrightness: 1, filterContrast: 1, filterSaturate: 1, shapeType: 'rectangle', backgroundColor: 'transparent', boxShadow: 'none', borderWidth: 0, borderColor: '#000000', borderStyle: 'solid',
            };
            updatePage(currentPage, { elements: [...currentElements, newElement] });
            setSelectedElementIds([newElement.id]);
        }
        drawingPointsRef.current = [];
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
      else if (activeTool === 'brush' || activeTool === 'pen') newCursor = 'crosshair';
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
    newPoint.y = y;

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
    setState((prev) => ({ ...prev, guides: [...prev.guides, newGuide] }));
    return newGuide.id;
  };

  const updateGuide = (id: string, position: number) => setState((prev) => ({...prev, guides: prev.guides.map((g) => (g.id === id ? { ...g, position } : g))}));
  const removeGuide = (id: string) => setState((prev) => ({ ...prev, guides: prev.guides.filter((g) => g.id !== id) }));
  
  const selectedElements = selectedElementIds.map(id => findElementRecursive(currentElements, id)).filter((el): el is DesignElement => !!el);
  const selectedElement = selectedElements[0];

  const handleProductUpdate = (newProps: Partial<Product>) => setState(s => ({ ...s, product: { ...s.product, ...newProps }}));
  const onQuantityChange = (newQuantity: number) => setState(s => ({...s, quantity: newQuantity}));
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
        const pageBackground = isMultiPageBackground ? (design.background as Background[])[i] : (i === 0 ? design.background as Background : { type: 'solid', color: '#ffffff' });
        
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
        if (el.type === 'group' && el.children) return {...el, children: recursiveDelete(el.children, idToRemove)};
        return el;
      });
    }
    updatePage(currentPage, { elements: recursiveDelete(currentElements, id) });
    setSelectedElementIds(ids => ids.filter(selectedId => selectedId !== id));
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

  const isMultiSelect = selectedElements.length > 1;
  const isSingleElementSelected = selectedElements.length === 1;
  const isGroupSelected = isSingleElementSelected && selectedElement?.type === 'group';

  const editorPanels = [
    { id: 'elements', label: 'Text', icon: <Type size={24} />, color: 'text-blue-600 bg-blue-500/10 data-[state=active]:bg-blue-600 data-[state=active]:text-white' },
    { id: 'media', label: 'Media', icon: <LayoutGrid size={24} />, color: 'text-purple-600 bg-purple-500/10 data-[state=active]:bg-purple-600 data-[state=active]:text-white' },
    { id: 'qrcode', label: 'QR Code', icon: <QrCode size={24} />, color: 'text-emerald-600 bg-emerald-500/10 data-[state=active]:bg-emerald-600 data-[state=active]:text-white' },
    { id: 'brush', label: 'Brush', icon: <Brush size={24} />, color: 'text-orange-600 bg-orange-500/10 data-[state=active]:bg-orange-600 data-[state=active]:text-white' },
    { id: 'pen', label: 'Pen', icon: <PenTool size={24} />, color: 'text-indigo-600 bg-indigo-500/10 data-[state=active]:bg-indigo-600 data-[state=active]:text-white', className: 'mt-auto' },
  ];

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
        case 'brush': return <PencilToolPanel options={brushOptions} setOptions={setBrushOptions} />;
        case 'pen': return <PenToolPanel onFinish={finalizePath} />;
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
        <header className="relative z-20 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.back()}><Home/></Button>
              <Button variant="ghost" size="icon" className="hidden lg:flex" asChild><Link href="/"><Home /></Link></Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                  <AmazoprintLogo isSimple className="w-12 h-12" />
                  <div className="hidden md:block">
                      <h2 className="font-semibold text-sm">{product.name}</h2>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{product.description}</p>
                  </div>
              </div>
          </div>
          
          <div className="hidden lg:flex flex-1 justify-center items-center gap-1">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"><Undo className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"><Redo className="h-4 w-4" /></Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Layers"><Layers /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="bottom" align="center">
                <LayersPanel 
                    elements={currentElements} 
                    selectedElementIds={selectedElementIds} 
                    onSelectElement={handleSelectElement}
                    onToggleVisibility={handleToggleLayerVisibility}
                    onToggleLock={handleToggleLayerLock}
                    onDuplicate={handleDuplicateLayer}
                    onDelete={handleDeleteLayer}
                />
              </PopoverContent>
            </Popover>
            
            {(isMultiSelect || isGroupSelected || isSingleElementSelected) && (
              <>
                <Separator orientation="vertical" className="h-8 mx-1" />
                {isMultiSelect && <Button variant="ghost" size="icon" onClick={handleGroup} title="Group Elements"><Group /></Button>}
                {isGroupSelected && <Button variant="ghost" size="icon" onClick={handleUngroup} title="Ungroup Elements"><Ungroup /></Button>}
                {isSingleElementSelected && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => moveLayer('front')} title="Bring to Front"><BringToFront /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveLayer('forward')} title="Bring Forward"><ChevronsUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveLayer('backward')} title="Send Backward"><ChevronsDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveLayer('back')} title="Send to Back"><SendToBack /></Button>
                  </>
                )}
              </>
            )}
             {totalPages > 1 && (
                <>
                <Separator orientation="vertical" className="h-8 mx-1" />
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                        <ChevronLeft />
                    </Button>
                    <span className="text-xs font-mono w-24 text-center">
                        Page {currentPage + 1} / {totalPages}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}>
                        <ChevronRight />
                    </Button>
                </div>
                </>
            )}
          </div>

          <div className="flex flex-1 lg:hidden justify-center items-center">
              <span className="text-sm font-semibold">{currentDesignName || product.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" />View</Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>Show Rulers</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>Show Grid</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showPrintGuidelines} onCheckedChange={setShowPrintGuidelines}>Show Print Guidelines</DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>Snap to Grid</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline" size="sm" onClick={() => setIsLoadDialogOpen(true)}><Library className="mr-2 h-4 w-4" />Load</Button>
                <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    {currentDesignId ? (verificationId ? 'Update Revision' : 'Update') : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreview}><Eye className="mr-2 h-4 w-4" />Preview</Button>
            </div>
             <div className="lg:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            {currentDesignId ? (verificationId ? 'Update Revision' : 'Update') : 'Save'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsLoadDialogOpen(true)}><Library className="mr-2 h-4 w-4" />Load</DropdownMenuItem>
                        <DropdownMenuItem onSelect={handlePreview}><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                        {isAdmin && <DropdownMenuItem onSelect={handleDownload}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
            
            {isAdmin ? (
                <Button onClick={handleDownload} size="sm" disabled={isDownloadingPdf} className="h-10 hidden lg:flex">
                    {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download
                </Button>
            ) : (
                <>
                    {!contestId && !verificationId && (
                        <Button onClick={handleOrder} size="sm" disabled={isOrdering} className="h-10">
                            {isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                            <span className="hidden sm:inline">{isOrdering ? 'Processing...' : 'Order Now'}</span>
                        </Button>
                    )}
                    
                    {contestId && (
                        <Button onClick={handleSubmitToContest} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                            Submit to Contest
                        </Button>
                    )}
                </>
            )}
          </div>
        </header>

        <div className="flex overflow-hidden relative">
          <Sidebar collapsible="icon" variant="floating" className="hidden lg:block">
            <SidebarContent className="p-0 overflow-y-hidden">
              <TooltipProvider>
                <Tabs 
                  defaultValue="elements" 
                  orientation="vertical" 
                  className="w-full h-full flex" 
                  onValueChange={(val) => {
                    if (val === 'brush' || val === 'pen') {
                        setActiveTool(val as any);
                    } else {
                        setActiveTool('select');
                    }
                  }}
                >
                <TabsList className="flex flex-col h-full p-3 gap-3 bg-transparent">
                    {editorPanels.map((panel) => (
                      <Tooltip key={panel.id}>
                        <TooltipTrigger asChild>
                          <TabsTrigger
                            value={panel.id}
                            className={cn(
                              "h-20 w-20 p-0 flex flex-col gap-1 items-center justify-center rounded-2xl transition-all duration-200",
                              "data-[state=active]:scale-110 data-[state=active]:shadow-lg",
                              panel.color,
                              (panel as any).className
                            )}
                            onClick={() => setLeftOpen(true)}
                          >
                            {panel.icon}
                            <span className="text-xs font-bold">{panel.label}</span>
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>{panel.label}</p></TooltipContent>
                      </Tooltip>
                    ))}
                  </TabsList>
                  <div className={cn(
                    "group-data-[collapsible=icon]:hidden flex-1 min-h-0 flex", 
                    "w-[26rem]",
                    activeTool === 'pen' && "hidden" // Remove left panel space for pen tool
                  )}>
                    <TabsContent value="elements" className="flex-1 overflow-auto mt-0">
                      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}>
                          <TextAddPanel onAddText={addTextElement} onAddGroupedElements={handleAddGroupedElements} />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="media" className="flex-1 overflow-auto mt-0">
                      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}>
                        <MediaPanel 
                          onImageSelect={handleAddImageFromLibrary} 
                          onAddShape={handleAddShape}
                          onEmojiSelect={handleAddEmoji}
                          isAdmin={isAdmin}
                        />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="qrcode" className="flex-1 overflow-auto mt-0">
                      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}>
                        <QrCodePanel onAddQrCode={addQrCodeElement} />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="brush" className="flex-1 overflow-auto mt-0">
                      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}>
                        <PencilToolPanel options={brushOptions} setOptions={setBrushOptions} />
                      </Suspense>
                    </TabsContent>
                     <TabsContent value="pen" className="flex-1 overflow-auto mt-0">
                      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}>
                        <PenToolPanel onFinish={finalizePath} />
                      </Suspense>
                    </TabsContent>
                  </div>
                </Tabs>
              </TooltipProvider>
            </SidebarContent>
          </Sidebar>
          <SidebarRail side="left" />

          <SidebarInset className="min-h-0 flex-1 p-0 m-0 lg:pb-0" style={{ paddingBottom: isMobile ? '80px' : '0' }}>
            <div
              ref={mainCanvasRef}
              className="flex-1 overflow-hidden p-0 relative"
              style={{ cursor: isSpacePressed ? 'grab' : (activeTool === 'brush' || activeTool === 'pen') ? 'crosshair' : 'default', backgroundColor: 'hsl(var(--muted))' }}
              onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            >
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
                liveSprayPuffs={liveSprayPuffs}
                brushOptions={brushOptions}
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
                        {editorPanels.map(panel => (
                           <Button 
                            key={panel.id}
                            variant={activeMobilePanel === panel.id ? 'selected' : 'ghost'}
                            size="sm"
                            className="flex flex-col h-auto p-2 gap-1"
                            onClick={() => handleMobilePanelOpen(panel.id)}
                           >
                            {panel.icon}
                            <span className="text-[10px]">{panel.label}</span>
                           </Button> 
                        ))}
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
