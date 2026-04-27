import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Download,
    Save,
    BringToFront,
    SendToBack,
    ChevronsUp,
    ChevronsDown,
    Home,
    Layers,
    Eye,
    ChevronLeft,
    ShoppingCart,
    MoreVertical,
    Library,
    Undo,
    AlignLeft,
    Blend,
    Copy,
    Trash2,
    PlayCircle,
    LayoutDashboard,
    Redo,
    Loader2,
    ArrowRight,
    Group,
    Ungroup,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { LayersPanel } from '@/components/design/layers-panel';
import { AmazoprintLogo } from '@/components/ui/logo';
import { useRouter } from 'next/navigation';

export function EditorHeader(props: any) {
    const router = useRouter();

    const {
        product,
        currentDesignName,
        currentDesignId,
        verificationId,
        contestId,

        undo,
        redo,
        canUndo,
        canRedo,

        currentElements,
        selectedElementIds,
        selectedElement,
        selectedElements,

        handleSelectElement,
        handleToggleLayerVisibility,
        handleToggleLayerLock,
        handleDuplicateLayer,
        handleDeleteLayer,
        handleDeleteAll,
        handleDuplicateElement,
        handleDeleteElement,
        handleGroup,
        handleUngroup,

        moveLayer,
        handleAlign,
        updateElement,

        isSingleElementSelected,

        showRulers,
        setShowRulers,
        showGrid,
        setShowGrid,
        showPrintGuidelines,
        setShowPrintGuidelines,
        snapToGrid,
        setSnapToGrid,

        setIsLoadDialogOpen,
        handleSave,
        handlePreview,
        handleDownload,
        handleOrder,
        handleSubmitToContest,

        isAdmin,
        isDownloadingPdf,
        isOrdering,
        isSubmitting,

        confirmNavigation,
    } = props;

    return (
        <header className="relative z-20 flex h-12 items-center justify-between border-b bg-card px-2 lg:px-3 whitespace-nowrap overflow-hidden">

            {/* LEFT */}
            <div className="flex items-center gap-2">

                {/* Back FIRST */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-1 h-8 px-2 text-xs text-blue-500"
                    asChild
                    onClick={confirmNavigation}
                >
                    <Link href="/">
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="ml-1">Back</span>
                    </Link>
                </Button>

                {/* Mobile Back */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-8 w-8"
                    onClick={(e) => {
                        if (confirmNavigation(e as any)) router.back();
                    }}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Logo + Text */}
                <div className="flex items-center gap-1">
                    <AmazoprintLogo  />

                    <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-[11px] font-medium">
                            Design Editor
                        </span>
                        <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                            {product.name}
                        </span>
                    </div>
                </div>

            </div>

            {/* CENTER */}
            <div className="hidden lg:flex flex-1 justify-center items-center gap-0.5 overflow-x-auto">

                <Button onClick={undo} disabled={!canUndo} variant="ghost" className="h-8 px-2 text-xs">
                    <Undo className="h-3.5 w-3.5" />
                </Button>

                <Button onClick={redo} disabled={!canRedo} variant="ghost" className="h-8 px-2 text-xs">
                    <Redo className="h-3.5 w-3.5" />
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-8 px-2 text-xs">
                            <Layers className="h-3.5 w-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0">
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

                <Separator orientation="vertical" className="h-4 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-8 px-2 text-xs">
                            <AlignLeft className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleAlign('left')}>Left</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAlign('center')}>Center</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAlign('right')}>Right</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-8 px-2 text-xs">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => moveLayer('front')}>
                            <BringToFront className="mr-2 h-3.5 w-3.5" />
                            Front
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => moveLayer('back')}>
                            <SendToBack className="mr-2 h-3.5 w-3.5" />
                            Back
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-8 px-2 text-xs">
                            <Blend className="h-3.5 w-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3">
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={selectedElement?.opacity ?? 1}
                            onChange={(e) =>
                                selectedElement &&
                                updateElement(selectedElement.id, {
                                    opacity: parseFloat(e.target.value),
                                })
                            }
                            className="w-full"
                        />
                    </PopoverContent>
                </Popover>

                <Button onClick={handleDuplicateElement} disabled={!selectedElements.length} variant="ghost" className="h-8 px-2">
                    <Copy className="h-3.5 w-3.5" />
                </Button>

                <Button onClick={handleDeleteElement} disabled={!selectedElements.length} variant="ghost" className="h-8 px-2">
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <Separator orientation="vertical" className="h-4 mx-1" />

                <Button onClick={handleGroup} disabled={selectedElements.length < 2} variant="ghost" className="h-8 px-2" title="Group Elements">
                    <Group className="h-3.5 w-3.5" />
                </Button>

                <Button onClick={handleUngroup} disabled={!(isSingleElementSelected && selectedElement?.type === 'group')} variant="ghost" className="h-8 px-2" title="Ungroup Elements">
                    <Ungroup className="h-3.5 w-3.5" />
                </Button>

                <Separator orientation="vertical" className="h-4 mx-1" />

                <Button variant="ghost" className="h-8 px-2 text-xs text-red-500">
                    <PlayCircle className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-1">

                <div className="hidden lg:flex items-center gap-1">
                    <Button variant="outline" className="h-8 px-2 text-xs" onClick={handleSave}>
                        <Save className="h-3.5 w-3.5" />
                    </Button>

                    <Button variant="outline" className="h-8 px-2 text-xs" onClick={handlePreview}>
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="lg:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8">
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={handleSave}>Save</DropdownMenuItem>
                            <DropdownMenuItem onSelect={handlePreview}>Preview</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {isAdmin ? (
                    <Button onClick={handleDownload} className="h-8 px-2 text-xs">
                        {isDownloadingPdf ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Download className="h-3.5 w-3.5" />
                        )}
                    </Button>
                ) : (
                    <Button onClick={handleOrder} className="h-8 px-2 text-xs">
                        <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

        </header>
    );
}