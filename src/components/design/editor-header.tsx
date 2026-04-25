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
        <div className="flex items-center gap-3 px-2 mr-4">
          <AmazoprintLogo isSimple className="w-10 h-10" />
          <div className="flex flex-col -space-y-0.5">
            <span className="font-bold text-[13px] text-zinc-900 leading-tight uppercase tracking-tight">
              {product.name}
            </span>
            <span className="text-[10px] font-black text-zinc-400 uppercase leading-none">WS</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-primary border-primary/20 hover:bg-primary/5 font-bold text-[12px] rounded-lg h-9 px-4 transition-all"
          asChild
        >
          <Link href="/products" onClick={(e) => { if(!confirmNavigation(e as any)) e.preventDefault(); }}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to products
          </Link>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8 mx-2 opacity-30" />

      {/* 2. Central Design Tools Toolbar */}
      <div className="flex flex-1 items-center gap-0.5">
        <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3" title="Undo">
                <Undo2 size={16} />
                <span className="text-[11px] font-bold">Undo</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3" title="Redo">
                <Redo2 size={16} />
                <span className="text-[11px] font-bold">Redo</span>
            </Button>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1 opacity-30" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
              <Layers size={16} />
              <span className="text-[11px] font-bold">Layers</span>
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

        {/* Contextual Properties Bar (Active on Selection) */}
        <div className={cn(
          "flex items-center gap-0.5 transition-all duration-300",
          isSingleElementSelected ? "opacity-100 scale-100" : "opacity-30 pointer-events-none scale-95"
        )}>
            <Separator orientation="vertical" className="h-8 mx-1 opacity-30" />
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
                        <AlignCenter size={16} />
                        <span className="text-[11px] font-bold">Align</span>
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
                    <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
                        <BringToFront size={16} />
                        <span className="text-[11px] font-bold">Arrange</span>
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
                    <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3">
                        <Blend size={16} />
                        <span className="text-[11px] font-bold">Opacity</span>
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

            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3" onClick={() => handleDuplicateLayer(selectedElementIds[0])} title="Duplicate">
                <Copy size={16} />
                <span className="text-[11px] font-bold">Duplicate</span>
            </Button>

            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-red-500 font-bold hover:text-red-600 hover:bg-red-50 px-3" onClick={() => handleDeleteLayer(selectedElementIds[0])} title="Delete">
                <Trash2 size={16} />
                <span className="text-[11px] font-bold">Delete</span>
            </Button>
        </div>

        {/* Grouping Tools */}
        {(isMultiSelect || isGroupSelected) && (
           <div className="flex items-center gap-0.5 ml-1">
             <Separator orientation="vertical" className="h-8 mx-1 opacity-30" />
             {isMultiSelect && (
               <Button variant="ghost" size="sm" onClick={handleGroup} className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3" title="Group">
                 <Group size={16} />
                 <span className="text-[11px] font-bold">Group</span>
               </Button>
             )}
             {isGroupSelected && (
               <Button variant="ghost" size="sm" onClick={handleUngroup} className="h-9 gap-1.5 text-zinc-600 font-bold hover:bg-zinc-100 px-3" title="Ungroup">
                 <Ungroup size={16} />
                 <span className="text-[11px] font-bold">Ungroup</span>
               </Button>
             )}
           </div>
        )}
      </div>

      {/* 3. Right Action Suite */}
      <div className="flex items-center gap-2 h-full">
        <Button variant="ghost" size="sm" className="text-zinc-900 font-bold hover:bg-zinc-100 gap-2 h-9 px-4 rounded-lg flex transition-all">
            <CirclePlay className="h-5 w-5 text-red-600 fill-white" />
            <span className="text-[12px] font-bold">Video Tutorials</span>
        </Button>

        <div className="flex items-center gap-1.5 ml-2">
            <Button variant="outline" size="sm" className="bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-100 h-9 px-4 rounded-lg gap-2 font-bold" onClick={() => {}}>
                <Eye size={16} />
                <span className="text-[11px] uppercase">View</span>
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsLoadDialogOpen(true)} className="bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-100 h-9 px-4 rounded-lg gap-2 font-bold">
                <Library size={16} />
                <span className="text-[11px] uppercase">Load</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleSave} className="bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-100 h-9 px-4 rounded-lg gap-2 font-bold">
                <Save size={16} />
                <span className="text-[11px] uppercase">Save</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handlePreview} className="bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-100 h-9 px-4 rounded-lg gap-2 font-bold">
                <Eye size={16} />
                <span className="text-[11px] uppercase">Preview</span>
            </Button>
        </div>

        {!isAdmin && !contestId && !verificationId && (
            <Button onClick={handleOrder} size="sm" disabled={isOrdering} className="h-10 px-6 bg-primary text-white rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 ml-4">
                {isOrdering ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={18} />}
                <span className="text-[12px] font-black uppercase tracking-wider">Order Now</span>
            </Button>
        )}

        {contestId && !isAdmin && (
            <Button onClick={handleSubmitToContest} disabled={isSubmitting} className="h-10 px-6 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 gap-2 ml-4">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span className="text-[12px] font-black uppercase tracking-wider">Submit Entry</span>
            </Button>
        )}
      </div>
    </header>
  );
}
