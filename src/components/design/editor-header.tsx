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
  Group,
  Ungroup,
  ChevronLeft,
  ChevronRight
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
      {/* Brand Identity - Larger Logo as Home Link */}
      <div className="flex items-center gap-3">
        <Link 
          href="/" 
          className="flex items-center gap-4 hover:opacity-80 transition-all group"
          onClick={(e) => { if(!confirmNavigation(e as any)) e.preventDefault(); }}
        >
          <AmazoprintLogo isSimple className="w-12 h-12" />
          <div className="flex flex-col -space-y-0.5">
            <span className="font-bold text-sm text-zinc-900 leading-tight uppercase tracking-tight">
              {product.name}
            </span>
            <span className="text-[10px] font-black text-primary uppercase leading-none tracking-widest">ws</span>
          </div>
        </Link>
      </div>

      <Separator orientation="vertical" className="h-8 mx-4 opacity-30" />

      {/* Main Toolbar */}
      <div className="flex flex-1 items-center gap-0.5 overflow-hidden">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} className="h-9 gap-1.5 px-3 hover:bg-zinc-100" title="Undo (Ctrl+Z)">
            <Undo2 size={16} className="text-zinc-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Undo</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} className="h-9 gap-1.5 px-3 hover:bg-zinc-100" title="Redo (Ctrl+Y)">
            <Redo2 size={16} className="text-zinc-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Redo</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />

        {/* Layers */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-zinc-100 shrink-0">
              <Layers size={16} className="text-zinc-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Layers</span>
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

        {/* Contextual Tools (Align, Arrange, Opacity, Duplicate, Delete) */}
        <div className={cn(
          "flex items-center gap-0.5 transition-all duration-300 ml-1 shrink-0",
          isSingleElementSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
        )}>
            <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-zinc-100">
                  <AlignCenter size={16} className="text-zinc-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Align</span>
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
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-zinc-100">
                  <BringToFront size={16} className="text-zinc-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Arrange</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => moveLayer('front')}><BringToFront className="mr-2 h-4 w-4"/> Bring to Front</DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveLayer('forward')}><ChevronsUp className="mr-2 h-4 w-4"/> Bring Forward</DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveLayer('backward')}><ChevronsDown className="mr-2 h-4 w-4"/> Send Backward</DropdownMenuItem>
                <DropdownMenuItem onClick={() => moveLayer('back')}><SendToBack className="mr-2 h-4 w-4"/> Send to Back</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-zinc-100">
                  <Blend size={16} className="text-zinc-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Opacity</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" sideOffset={10}>
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

            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-zinc-100" onClick={() => handleDuplicateLayer(selectedElementIds[0])}>
                <Copy size={16} className="text-zinc-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Duplicate</span>
            </Button>

            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 hover:bg-red-50 text-red-500 hover:text-red-600" onClick={() => handleDeleteLayer(selectedElementIds[0])}>
                <Trash2 size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Delete</span>
            </Button>
        </div>

        {/* Grouping (Only on Multi-select) */}
        {isMultiSelect && (
           <div className="flex items-center gap-0.5 ml-1 shrink-0">
             <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />
             <Button variant="ghost" size="sm" onClick={handleGroup} className="h-9 gap-1.5 px-3 hover:bg-zinc-100">
               <Group size={16} className="text-zinc-500" />
               <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Group</span>
             </Button>
           </div>
        )}
        {isGroupSelected && (
           <div className="flex items-center gap-0.5 ml-1 shrink-0">
             <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />
             <Button variant="ghost" size="sm" onClick={handleUngroup} className="h-9 gap-1.5 px-3 hover:bg-zinc-100">
               <Ungroup size={16} className="text-zinc-500" />
               <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Ungroup</span>
             </Button>
           </div>
        )}
      </div>

      {/* Right Action Suite */}
      <div className="flex items-center gap-2 h-full shrink-0">
        <Button variant="ghost" size="sm" className="text-zinc-900 font-bold hover:bg-zinc-100 gap-2 h-9 px-4 rounded-lg hidden xl:flex">
            <CirclePlay className="h-5 w-5 text-red-600 fill-white" />
            <span className="text-[12px] font-bold">Video Tutorials</span>
        </Button>

        <div className="flex items-center gap-1.5 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold hidden lg:flex">
                    <Eye size={16} />
                    <span className="text-[11px] uppercase tracking-wider">View</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>Show Rulers</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>Show Grid</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showPrintGuidelines} onCheckedChange={setShowPrintGuidelines}>Show Print Guidelines</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>Snap to Grid</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => setIsLoadDialogOpen(true)} className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold hidden md:flex">
                <Library size={16} />
                <span className="text-[11px] uppercase tracking-wider">Load</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleSave} className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold">
                <Save size={16} />
                <span className="text-[11px] uppercase tracking-wider">{currentDesignId ? (verificationId ? 'Update Revision' : 'Update') : 'Save'}</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handlePreview} className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold hidden md:flex">
                <Eye size={16} />
                <span className="text-[11px] uppercase tracking-wider">Preview</span>
            </Button>
            
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloadingPdf} className="bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 h-9 px-4 rounded-lg gap-2 font-bold">
                {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />}
                <span className="text-[11px] uppercase tracking-wider">Download</span>
              </Button>
            )}
        </div>

        {!isAdmin && !contestId && !verificationId && (
            <Button onClick={handleOrder} size="sm" disabled={isOrdering} className="h-10 px-6 bg-primary text-white rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 ml-4">
                {isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={18} />}
                <span className="text-[12px] font-black uppercase tracking-wider">Order Now</span>
            </Button>
        )}

        {contestId && !isAdmin && (
            <Button onClick={handleSubmitToContest} disabled={isSubmitting} className="h-10 px-6 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 gap-2 ml-4">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-16 w-16" />}
                <span className="text-[12px] font-black uppercase tracking-wider">Submit Entry</span>
            </Button>
        )}
      </div>
    </header>
  );
}
