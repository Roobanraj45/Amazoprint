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
  Home,
  Undo,
  Redo,
  Layers,
  Group,
  Ungroup,
  BringToFront,
  SendToBack,
  ChevronsUp,
  ChevronsDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Library,
  Save,
  Download,
  ShoppingCart,
  ArrowRight,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { AmazoprintLogo } from '@/components/ui/logo';
import { LayersPanel } from '@/components/design/layers-panel';
import type { Product, DesignElement, FoilType } from '@/lib/types';

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
}: EditorHeaderProps) {
  return (
    <header className="relative z-20 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={(e) => { 
            if(confirmNavigation(e as any)) window.history.back(); 
          }}
        >
          <Home />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden lg:flex" 
          asChild
        >
          <Link href="/" onClick={confirmNavigation}>
            <Home />
          </Link>
        </Button>
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
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <Redo className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Layers">
              <Layers />
            </Button>
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
              onDeleteAll={handleDeleteAll}
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
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />View
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
  );
}
