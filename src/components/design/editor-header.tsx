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
  CircleDashed
} from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { LayersPanel } from '@/components/design/layers-panel';
import type { Product, DesignElement, FoilType } from '@/lib/types';
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
      {/* Brand & Product Info */}
      <div className="flex items-center gap-3 pr-4">
        <AmazoprintLogo isSimple className="w-10 h-10" />
        <div className="flex flex-col -space-y-1">
          <span className="font-bold text-[13px] text-zinc-900 leading-tight">
            {product.name}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">WS</span>
        </div>
      </div>

      {/* Navigation & Basic Actions */}
      <div className="flex items-center gap-1 border-x px-2 h-full">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary font-bold text-xs hover:bg-primary/5 rounded-lg h-9 px-3"
          asChild
        >
          <Link href="/products" onClick={(e) => { if(!confirmNavigation(e as any)) e.preventDefault(); }}>
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Back to products
          </Link>
        </Button>
      </div>

      {/* Design Tools Toolbar */}
      <div className="flex flex-1 items-center gap-0.5 px-2">
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-9 w-9 text-zinc-600" title="Undo">
                <Undo2 className="h-4 w-4" />
                <span className="sr-only">Undo</span>
            </Button>
            <span className="text-[10px] text-zinc-400 font-medium ml-1 mr-2 hidden xl:inline">Undo</span>
            
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-9 w-9 text-zinc-600" title="Redo">
                <Redo2 className="h-4 w-4" />
                <span className="sr-only">Redo</span>
            </Button>
            <span className="text-[10px] text-zinc-400 font-medium ml-1 mr-2 hidden xl:inline">Redo</span>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-zinc-600 font-medium hover:bg-zinc-50">
              <Layers className="h-4 w-4" />
              <span className="text-xs">Layers</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" side="bottom" align="start">
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

        {/* Alignment & Arrangement (Contextual) */}
        <div className="flex items-center gap-1 px-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={!isSingleElementSelected} className="h-9 gap-1.5 text-zinc-600 font-medium">
                        <AlignCenter className="h-4 w-4" />
                        <span className="text-xs">Align</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <div className="grid grid-cols-3 gap-1 p-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onUpdateElement(selectedElementIds[0], { x: 0 })}>
                            <AlignHorizontalJustifyStart size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onUpdateElement(selectedElementIds[0], { x: (product.width - (selectedElement?.width || 0)) / 2 })}>
                            <AlignHorizontalJustifyCenter size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onUpdateElement(selectedElementIds[0], { x: product.width - (selectedElement?.width || 0) })}>
                            <AlignHorizontalJustifyEnd size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onUpdateElement(selectedElementIds[0], { y: 0 })}>
                            <AlignVerticalJustifyStart size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onUpdateElement(selectedElementIds[0], { y: (product.height - (selectedElement?.height || 0)) / 2 })}>
                            <AlignVerticalJustifyCenter size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onUpdateElement(selectedElementIds[0], { y: product.height - (selectedElement?.height || 0) })}>
                            <AlignVerticalJustifyEnd size={18} />
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={!isSingleElementSelected} className="h-9 gap-1.5 text-zinc-600 font-medium">
                        <BringToFront className="h-4 w-4" />
                        <span className="text-xs">Arrange</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => moveLayer('front')}><BringToFront className="mr-2 h-4 w-4"/> Bring to Front</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer('forward')}><ChevronsUp className="mr-2 h-4 w-4"/> Bring Forward</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer('backward')}><ChevronsDown className="mr-2 h-4 w-4"/> Send Backward</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer('back')}><SendToBack className="mr-2 h-4 w-4"/> Send to Back</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={!isSingleElementSelected} className="h-9 gap-1.5 text-zinc-600 font-medium">
                        <Blend className="h-4 w-4" />
                        <span className="text-xs">Opacity</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-4">
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                            <span>Transparency</span>
                            <span className="font-mono">{Math.round((selectedElement?.opacity || 1) * 100)}%</span>
                        </div>
                        <Slider 
                            value={[(selectedElement?.opacity || 1) * 100]} 
                            onValueChange={(v) => onUpdateElement(selectedElementIds[0], { opacity: v[0] / 100 })}
                            max={100} step={1}
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <Button variant="ghost" size="sm" disabled={!isSingleElementSelected} className="h-9 gap-1.5 text-zinc-600 font-medium" onClick={() => handleDuplicateLayer(selectedElementIds[0])}>
                <Copy className="h-4 w-4" />
                <span className="text-xs">Duplicate</span>
            </Button>

            <Button variant="ghost" size="sm" disabled={!isSingleElementSelected} className="h-9 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium" onClick={() => handleDeleteLayer(selectedElementIds[0])}>
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">Delete</span>
            </Button>
        </div>
      </div>

      {/* Tutorials & Secondary Actions */}
      <div className="flex items-center gap-1.5 border-l pl-4">
        <Button variant="ghost" size="sm" className="text-red-600 font-bold hover:bg-red-50 gap-2 h-9 px-3 rounded-lg hidden 2xl:flex">
            <CirclePlay className="h-5 w-5 fill-red-600 text-white" />
            <span className="text-xs">Video Tutorials</span>
        </Button>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-zinc-100/80 hover:bg-zinc-200 text-zinc-700 h-9 px-3 rounded-lg gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-semibold">View</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers} className="text-xs font-medium">Show Rulers</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid} className="text-xs font-medium">Show Grid</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showPrintGuidelines} onCheckedChange={setShowPrintGuidelines} className="text-xs font-medium">Show Print Guidelines</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid} className="text-xs font-medium">Snap to Grid</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="secondary" size="sm" onClick={() => setIsLoadDialogOpen(true)} className="bg-zinc-100/80 hover:bg-zinc-200 text-zinc-700 h-9 px-3 rounded-lg gap-2">
            <Library className="h-4 w-4" />
            <span className="text-xs font-semibold">Load</span>
        </Button>

        <Button variant="secondary" size="sm" onClick={handleSave} className="bg-zinc-100/80 hover:bg-zinc-200 text-zinc-700 h-9 px-3 rounded-lg gap-2">
            <Save className="h-4 w-4" />
            <span className="text-xs font-semibold">
                 {currentDesignId ? (verificationId ? 'Update' : 'Update') : 'Save'}
            </span>
        </Button>

        <Button variant="secondary" size="sm" onClick={handlePreview} className="bg-zinc-100/80 hover:bg-zinc-200 text-zinc-700 h-9 px-3 rounded-lg gap-2">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-semibold">Preview</span>
        </Button>

        {isAdmin && (
            <Button onClick={handleDownload} size="sm" disabled={isDownloadingPdf} className="h-9 px-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 gap-2">
                 {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                 <span className="text-xs font-bold uppercase tracking-tight">Export</span>
            </Button>
        )}

        {!isAdmin && !contestId && !verificationId && (
            <Button onClick={handleOrder} size="sm" disabled={isOrdering} className="h-10 px-5 bg-primary text-white rounded-full hover:bg-primary/90 shadow-md shadow-primary/20 gap-2 ml-1">
                {isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                <span className="text-xs font-black uppercase tracking-wider">{isOrdering ? 'Processing' : 'Order Now'}</span>
            </Button>
        )}

        {contestId && !isAdmin && (
            <Button onClick={handleSubmitToContest} disabled={isSubmitting} className="h-10 px-5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-md gap-2 ml-1">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                <span className="text-xs font-black uppercase tracking-wider">Submit Quest</span>
            </Button>
        )}
      </div>
    </header>
  );
}

