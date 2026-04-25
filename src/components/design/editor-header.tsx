'use client';

import React from 'react';
import Link from 'next/link';
import {
  Button
} from '@/components/ui/button';
import {
  Separator
} from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
  Undo2,
  Redo2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Library,
  Save,
  Download,
  ShoppingCart,
  ArrowRight,
  MoreVertical,
  Loader2,
  AlignCenter,
  BringToFront,
  SendToBack,
  ChevronsUp,
  ChevronsDown,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Copy,
  Trash2,
  CirclePlay,
  Blend,
  Grid3X3,
  CircleDashed,
  Group,
  Ungroup
} from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { LayersPanel } from '@/components/design/layers-panel';
import type { Product, DesignElement } from '@/lib/types';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';

type EditorHeaderProps = {
  product: Product;
  quantity: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentDesignId: number | null;
  currentDesignName: string | null;
  isDirty: boolean;
  confirmNavigation: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => boolean;
  handleSave: () => Promise<void>;
  handlePreview: () => void;
  handleDownload: () => void;
  handleOrder: () => Promise<void>;
  setIsLoadDialogOpen: (open: boolean) => void;
  handleSubmitToContest: () => Promise<void>;
  isAdmin: boolean;
  verificationId?: string | null;
  contestId?: string | null;
  isDownloadingPdf: boolean;
  isOrdering: boolean;
  isSubmitting: boolean;
  showRulers: boolean;
  setShowRulers: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  showPrintGuidelines: boolean;
  setShowPrintGuidelines: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  currentElements: DesignElement[];
  selectedElementIds: string[];
  handleSelectElement: (id: string | null, isShift?: boolean) => void;
  handleToggleLayerVisibility: (id: string) => void;
  handleToggleLayerLock: (id: string) => void;
  handleDuplicateLayer: (id: string) => void;
  handleDeleteLayer: (id: string) => void;
  handleDeleteAll: () => void;
  moveLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  handleGroup: () => void;
  handleUngroup: () => void;
  isMultiSelect: boolean;
  isGroupSelected: boolean;
  isSingleElementSelected: boolean;
  onUpdateElement: (id: string, props: Partial<DesignElement>) => void;
};

export function EditorHeader({
  product,
  quantity,
  totalPages,
  currentPage,
  setCurrentPage,
  undo,
  redo,
  canUndo,
  canRedo,
  currentDesignId,
  currentDesignName,
  isDirty,
  confirmNavigation,
  handleSave,
  handlePreview,
  handleDownload,
  handleOrder,
  setIsLoadDialogOpen,
  handleSubmitToContest,
  isAdmin,
  verificationId,
  contestId,
  isDownloadingPdf,
  isOrdering,
  isSubmitting,
  showRulers,
  setShowRulers,
  showGrid,
  setShowGrid,
  showPrintGuidelines,
  setShowPrintGuidelines,
  snapToGrid,
  setSnapToGrid,
  currentElements,
  selectedElementIds,
  handleSelectElement,
  handleToggleLayerVisibility,
  handleToggleLayerLock,
  handleDuplicateLayer,
  handleDeleteLayer,
  handleDeleteAll,
  moveLayer,
  handleGroup,
  handleUngroup,
  isMultiSelect,
  isGroupSelected,
  isSingleElementSelected,
  onUpdateElement,
}: EditorHeaderProps) {
  
  const selectedElement = currentElements.find(el => selectedElementIds.includes(el.id));

  return (
    <header className="relative z-50 flex h-14 items-center gap-2 border-b bg-white px-4 shadow-sm">
      {/* 1. Left Brand & Navigation Section */}
      <div className="flex items-center gap-1.5 h-full">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary font-black text-[11px] uppercase tracking-tighter hover:bg-primary/5 rounded-lg h-9 px-3"
          asChild
        >
          <Link href="/products" onClick={(e) => { if(!confirmNavigation(e as any)) e.preventDefault(); }}>
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Back to products
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6 opacity-30" />
        <div className="flex items-center gap-3 px-2">
          <AmazoprintLogo isSimple className="w-9 h-9" />
          <div className="flex flex-col -space-y-0.5">
            <span className="font-bold text-[12px] text-zinc-900 leading-tight uppercase tracking-tight">
              {product.name}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-white bg-zinc-800 px-1.5 py-0.5 rounded leading-none">WS</span>
              {currentDesignName && (
                <span className="text-[10px] font-medium text-zinc-400 truncate max-w-[120px]">/ {currentDesignName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />

      {/* 2. Central Design Tools Toolbar */}
      <div className="flex flex-1 items-center gap-0.5">
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-9 w-9 text-zinc-600 hover:bg-zinc-100" title="Undo (Ctrl+Z)">
                <Undo2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-9 w-9 text-zinc-600 hover:bg-zinc-100" title="Redo (Ctrl+Y)">
                <Redo2 size={16} />
            </Button>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1 opacity-30" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
              <Layers size={16} />
              <span className="text-[11px] uppercase tracking-wider">Layers</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" side="bottom" align="start" sideOffset={10}>
            <LayersPanel 
              elements={currentElements} 
              selectedElementIds={selectedElementIds} 
              onSelectElement={handleSelectElement}
              onToggleVisibility={handleToggleLayerVisibility}
              onToggleLock={handleToggleLayerLock}
              onDuplicate={handleDuplicateLayer}
              onDelete={handleDeleteLayer}
              onDeleteAll={handleDeleteAll}
            />
          </PopoverContent>
        </Popover>

        {/* Grouping Tools */}
        {(isMultiSelect || isGroupSelected) && (
           <div className="flex items-center gap-0.5 ml-1">
             <Separator orientation="vertical" className="h-8 mx-1 opacity-30" />
             {isMultiSelect && <Button variant="ghost" size="icon" onClick={handleGroup} className="h-9 w-9 text-zinc-600" title="Group"><Group size={16} /></Button>}
             {isGroupSelected && <Button variant="ghost" size="icon" onClick={handleUngroup} className="h-9 w-9 text-zinc-600" title="Ungroup"><Ungroup size={16} /></Button>}
           </div>
        )}

        {/* Contextual Properties Bar (Active on Selection) */}
        <div className={cn(
          "flex items-center gap-0.5 transition-all duration-300",
          isSingleElementSelected ? "opacity-100 scale-100" : "opacity-30 pointer-events-none scale-95"
        )}>
            <Separator orientation="vertical" className="h-8 mx-1 opacity-30" />
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 gap-2 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
                        <AlignCenter size={16} />
                        <span className="text-[11px] uppercase tracking-wider">Align</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="p-1">
                    <div className="grid grid-cols-3 gap-1 p-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onUpdateElement(selectedElementIds[0], { x: 0 })} title="Align Left">
                            <AlignHorizontalJustifyStart size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onUpdateElement(selectedElementIds[0], { x: (product.width - (selectedElement?.width || 0)) / 2 })} title="Align Center">
                            <AlignHorizontalJustifyCenter size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onUpdateElement(selectedElementIds[0], { x: product.width - (selectedElement?.width || 0) })} title="Align Right">
                            <AlignHorizontalJustifyEnd size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onUpdateElement(selectedElementIds[0], { y: 0 })} title="Align Top">
                            <AlignVerticalJustifyStart size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onUpdateElement(selectedElementIds[0], { y: (product.height - (selectedElement?.height || 0)) / 2 })} title="Align Middle">
                            <AlignVerticalJustifyCenter size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onUpdateElement(selectedElementIds[0], { y: product.height - (selectedElement?.height || 0) })} title="Align Bottom">
                            <AlignVerticalJustifyEnd size={16} />
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 gap-2 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
                        <BringToFront size={16} />
                        <span className="text-[11px] uppercase tracking-wider">Arrange</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => moveLayer('front')}><BringToFront className="mr-2 h-4 w-4"/> Bring to Front</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer('forward')}><ChevronsUp className="mr-2 h-4 w-4"/> Bring Forward</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer('backward')}><ChevronsDown className="mr-2 h-4 w-4"/> Send Backward</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer('back')}><SendToBack className="mr-2 h-4 w-4"/> Send to Back</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 gap-2 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
                        <Blend size={16} />
                        <span className="text-[11px] uppercase tracking-wider">Opacity</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-5" sideOffset={10}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                            <span>Transparency</span>
                            <span className="font-mono text-primary text-[12px]">{Math.round((selectedElement?.opacity || 1) * 100)}%</span>
                        </div>
                        <Slider 
                            value={[(selectedElement?.opacity || 1) * 100]} 
                            onValueChange={(v) => onUpdateElement(selectedElementIds[0], { opacity: v[0] / 100 })}
                            max={100} step={1}
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-600" onClick={() => handleDuplicateLayer(selectedElementIds[0])} title="Duplicate">
                <Copy size={16} />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteLayer(selectedElementIds[0])} title="Delete">
                <Trash2 size={16} />
            </Button>
        </div>

        {/* Page Switcher for Multi-page Designs */}
        {totalPages > 1 && (
            <div className="flex items-center gap-1.5 ml-4 px-3 py-1 bg-zinc-50 rounded-full border border-zinc-100">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                    <ChevronLeft size={14} />
                </Button>
                <span className="text-[10px] font-black uppercase text-zinc-500 w-16 text-center tabular-nums">
                    Pg {currentPage + 1} / {totalPages}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}>
                    <ChevronRight size={14} />
                </Button>
            </div>
        )}
      </div>

      {/* 3. Right Action Suite */}
      <div className="flex items-center gap-2 border-l pl-4 h-full">
        <Button variant="ghost" size="sm" className="text-red-600 font-black hover:bg-red-50 gap-2 h-9 px-3 rounded-lg hidden 2xl:flex transition-all">
            <CirclePlay className="h-5 w-5 fill-red-600 text-white" />
            <span className="text-[10px] uppercase tracking-widest">Video Tutorials</span>
        </Button>

        <div className="flex items-center gap-1 bg-zinc-100/50 p-1 rounded-xl">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-white text-zinc-700 h-8 px-3 rounded-lg gap-1.5">
                        <Eye size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">View</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers} className="text-xs font-medium">Show Rulers</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid} className="text-xs font-medium">Show Grid</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showPrintGuidelines} onCheckedChange={setShowPrintGuidelines} className="text-xs font-medium">Show Guidelines</DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid} className="text-xs font-medium">Snap to Grid</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={() => setIsLoadDialogOpen(true)} className="hover:bg-white text-zinc-700 h-8 px-3 rounded-lg gap-1.5">
                <Library size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Load</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleSave} className="hover:bg-white text-zinc-700 h-8 px-3 rounded-lg gap-1.5">
                <Save size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                    {currentDesignId ? 'Update' : 'Save'}
                </span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handlePreview} className="hover:bg-white text-zinc-700 h-8 px-3 rounded-lg gap-1.5">
                <Eye size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Preview</span>
            </Button>
        </div>

        {isAdmin && (
            <Button onClick={handleDownload} size="sm" disabled={isDownloadingPdf} className="h-9 px-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 gap-2 border-none">
                 {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
            </Button>
        )}

        {!isAdmin && !contestId && !verificationId && (
            <Button onClick={handleOrder} size="sm" disabled={isOrdering} className="h-10 px-6 bg-primary text-white rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 ml-2">
                {isOrdering ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">{isOrdering ? 'Processing' : 'Order Now'}</span>
            </Button>
        )}

        {contestId && !isAdmin && (
            <Button onClick={handleSubmitToContest} disabled={isSubmitting} className="h-10 px-6 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 gap-2 ml-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">Submit Quest</span>
            </Button>
        )}
      </div>
    </header>
  );
}
