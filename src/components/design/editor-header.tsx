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

    const iconClass = "h-5 w-5";
    const labelClass = "text-[9px] uppercase font-bold tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity";

    return (
        <header className="relative z-20 flex h-16 items-center justify-between border-b bg-card px-2 lg:px-4 whitespace-nowrap overflow-hidden">

            {/* LEFT */}
            <div className="flex items-center gap-3">

                {/* Back FIRST */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex flex-col items-center gap-1 h-12 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 group"
                    asChild
                    onClick={confirmNavigation}
                >
                    <Link href="/">
                        <ChevronLeft className="w-5 h-5" />
                        <span className={labelClass}>Go Back</span>
                    </Link>
                </Button>

                {/* Mobile Back */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-10 w-10"
                    onClick={(e) => {
                        if (confirmNavigation(e as any)) router.back();
                    }}
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>

                {/* Logo + Text */}
                <div className="flex items-center gap-2">
                    <img src="/uploads/amazoIcon.png" alt="Icon" className="w-10 h-10 object-contain drop-shadow-sm" />

                    <div className="hidden md:flex flex-col leading-tight">
                        <span className="text-xs font-black uppercase tracking-tight text-primary">
                            Design Editor
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px] font-medium">
                            {product.name}
                        </span>
                    </div>
                </div>

            </div>

            {/* CENTER */}
            <div className="hidden lg:flex flex-1 justify-center items-center gap-1.5 overflow-x-auto">

                <Button onClick={undo} disabled={!canUndo} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                    <Undo className={iconClass} />
                    <span className={labelClass}>Undo</span>
                </Button>

                <Button onClick={redo} disabled={!canRedo} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                    <Redo className={iconClass} />
                    <span className={labelClass}>Redo</span>
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                            <Layers className={iconClass} />
                            <span className={labelClass}>Layers</span>
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

                <Separator orientation="vertical" className="h-6 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                            <AlignLeft className={iconClass} />
                            <span className={labelClass}>Align</span>
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
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                            <LayoutDashboard className={iconClass} />
                            <span className={labelClass}>Move</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => moveLayer('front')}>
                            <BringToFront className="mr-2 h-4 w-4" />
                            Front
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => moveLayer('back')}>
                            <SendToBack className="mr-2 h-4 w-4" />
                            Back
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                            <Blend className={iconClass} />
                            <span className={labelClass}>Opacity</span>
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

                <Button onClick={handleDuplicateElement} disabled={!selectedElements.length} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                    <Copy className={iconClass} />
                    <span className={labelClass}>Copy</span>
                </Button>

                <Button onClick={handleDeleteElement} disabled={!selectedElements.length} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group text-red-500 hover:text-red-600 hover:bg-red-50/50">
                    <Trash2 className={iconClass} />
                    <span className={labelClass}>Delete</span>
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button onClick={handleGroup} disabled={selectedElements.length < 2} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                    <Group className={iconClass} />
                    <span className={labelClass}>Group</span>
                </Button>

                <Button onClick={handleUngroup} disabled={!(isSingleElementSelected && selectedElement?.type === 'group')} variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group">
                    <Ungroup className={iconClass} />
                    <span className={labelClass}>Ungroup</span>
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button variant="ghost" className="h-12 w-14 flex flex-col items-center gap-1 group text-red-500 hover:text-red-600 hover:bg-red-50/50">
                    <PlayCircle className={iconClass} />
                    <span className={labelClass}>Simulation</span>
                </Button>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">

                <div className="hidden lg:flex items-center gap-2">
                    <Button variant="outline" className="h-12 w-14 flex flex-col items-center gap-1 group" onClick={handleSave}>
                        <Save className={iconClass} />
                        <span className={labelClass}>Save</span>
                    </Button>

                    <Button variant="outline" className="h-12 w-14 flex flex-col items-center gap-1 group" onClick={handlePreview}>
                        <Eye className={iconClass} />
                        <span className={labelClass}>Preview</span>
                    </Button>
                </div>

                <div className="lg:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10">
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
                    <Button onClick={handleDownload} className="h-12 w-16 flex flex-col items-center justify-center gap-1 group bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isDownloadingPdf ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Download className="h-5 w-5" />
                                <span className="text-[9px] uppercase font-black">Export</span>
                            </>
                        )}
                    </Button>
                ) : (
                    <Button onClick={handleOrder} className="h-12 w-16 flex flex-col items-center justify-center gap-1 group bg-primary hover:bg-primary/90 text-primary-foreground">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="text-[9px] uppercase font-black">Order</span>
                    </Button>
                )}
            </div>

        </header>
    );
}