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
    ChevronRight,
    ShoppingCart,
    MoreVertical,
    Library,
    Undo,
    RectangleHorizontal,
    RectangleVertical,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
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
    FlipHorizontal,
    FlipVertical,
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
    const [isLayersOpen, setIsLayersOpen] = React.useState(false);

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
        onRotateCanvas,
        currentPage,
        totalPages,
        setCurrentPage,
    } = props;

    const iconClass = "h-4.5 w-4.5";
    const labelClass = "text-[10px] font-bold opacity-70 group-hover:opacity-100 transition-opacity";

    return (
        <header className="relative z-20 flex h-16 items-center justify-between border-b bg-white px-2 lg:px-4 whitespace-nowrap overflow-hidden shadow-sm">

            {/* LEFT */}
            <div className="flex items-center gap-3">

                {/* Back FIRST */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex flex-col items-center gap-1 h-12 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 group"
                    asChild
                    onClick={confirmNavigation}
                >
                    <Link href="/">
                        <ChevronLeft className="w-5 h-5" />
                        <span className={labelClass}>Go back</span>
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
                        <span className="text-xs font-bold text-primary">
                            Design editor
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px] font-medium">
                            {product.name}
                        </span>
                    </div>
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5 px-1.5 py-1 bg-muted/40 rounded-xl border border-border/40 backdrop-blur-sm ml-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-background/80"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col items-center justify-center min-w-[70px] leading-none">
                            <span className="text-[10px] font-bold text-muted-foreground">Page</span>
                            <span className="text-xs font-bold text-primary">{currentPage + 1} / {totalPages}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-background/80"
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

            </div>

            {/* CENTER - Scrollable Toolbar */}
            <div className="hidden lg:flex flex-1 items-center justify-center px-2">
                <div className="flex items-center gap-0.5 py-1">

                <Button onClick={undo} disabled={!canUndo} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
                    <Undo className={iconClass} />
                    <span className={labelClass}>Undo</span>
                </Button>

                <Button onClick={redo} disabled={!canRedo} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
                    <Redo className={iconClass} />
                    <span className={labelClass}>Redo</span>
                </Button>

                <Popover open={isLayersOpen} onOpenChange={setIsLayersOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
                            <Layers className={iconClass} />
                            <span className={labelClass}>Layers</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0">
                        <LayersPanel
                            elements={currentElements}
                            selectedElementIds={selectedElementIds}
                            onSelectElement={(id) => {
                                handleSelectElement(id);
                                setIsLayersOpen(false);
                            }}
                            onToggleVisibility={handleToggleLayerVisibility}
                            onToggleLock={handleToggleLayerLock}
                            onDuplicate={handleDuplicateLayer}
                            onDelete={handleDeleteLayer}
                            onDeleteAll={handleDeleteAll}
                        />
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-5 mx-0.5 shrink-0" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
                            <AlignLeft className={iconClass} />
                            <span className={labelClass}>Align</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-36 p-1 bg-background/95 backdrop-blur-md border-border/50">
                        <div className="grid grid-cols-3 gap-1">
                            <DropdownMenuItem className="justify-center h-10 hover:bg-primary/10 transition-colors" onSelect={(e) => e.preventDefault()} onClick={() => handleAlign('left')} title="Align Left">
                                <AlignLeft className="h-4 w-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="justify-center h-10 hover:bg-primary/10 transition-colors" onSelect={(e) => e.preventDefault()} onClick={() => handleAlign('center')} title="Center Horizontal">
                                <AlignCenter className="h-4 w-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="justify-center h-10 hover:bg-primary/10 transition-colors" onSelect={(e) => e.preventDefault()} onClick={() => handleAlign('right')} title="Align Right">
                                <AlignRight className="h-4 w-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="justify-center h-10 hover:bg-primary/10 transition-colors" onSelect={(e) => e.preventDefault()} onClick={() => handleAlign('top')} title="Align Top">
                                <AlignStartVertical className="h-4 w-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="justify-center h-10 hover:bg-primary/10 transition-colors" onSelect={(e) => e.preventDefault()} onClick={() => handleAlign('middle')} title="Center Vertical">
                                <AlignCenterVertical className="h-4 w-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem className="justify-center h-10 hover:bg-primary/10 transition-colors" onSelect={(e) => e.preventDefault()} onClick={() => handleAlign('bottom')} title="Align Bottom">
                                <AlignEndVertical className="h-4 w-4" />
                            </DropdownMenuItem>
                        </div>
                        <div className="h-px bg-border/40 my-1 mx-1" />
                        <div className="grid grid-cols-2 gap-1">
                            <DropdownMenuItem 
                                className="justify-center h-10 hover:bg-primary/10 transition-colors" 
                                onSelect={(e) => e.preventDefault()}
                                onClick={() => selectedElement && updateElement(selectedElement.id, { flipHorizontal: !selectedElement.flipHorizontal })} 
                                title="Flip Horizontal"
                            >
                                <FlipHorizontal className="h-4 w-4" />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="justify-center h-10 hover:bg-primary/10 transition-colors" 
                                onSelect={(e) => e.preventDefault()}
                                onClick={() => selectedElement && updateElement(selectedElement.id, { flipVertical: !selectedElement.flipVertical })} 
                                title="Flip Vertical"
                            >
                                <FlipVertical className="h-4 w-4" />
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
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
                        <Button disabled={!isSingleElementSelected} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
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

                <Button onClick={handleDuplicateElement} disabled={!selectedElements.length} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
                    <Copy className={iconClass} />
                    <span className={labelClass}>Copy</span>
                </Button>

                <Button onClick={handleDeleteElement} disabled={!selectedElements.length} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group text-red-500 hover:text-red-600 hover:bg-red-50/50 shrink-0">
                    <Trash2 className={iconClass} />
                    <span className={labelClass}>Delete</span>
                </Button>

                <Separator orientation="vertical" className="h-5 mx-0.5 shrink-0" />

                <Button onClick={handleGroup} disabled={selectedElements.length < 2} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
                    <Group className={iconClass} />
                    <span className={labelClass}>Group</span>
                </Button>

                <Button onClick={handleUngroup} disabled={!(isSingleElementSelected && selectedElement?.type === 'group')} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group shrink-0">
                    <Ungroup className={iconClass} />
                    <span className={labelClass}>Ungroup</span>
                </Button>

                <div className="w-2 shrink-0" />

                <Button onClick={onRotateCanvas} variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50 shrink-0">
                    {product.width > product.height ? <RectangleVertical className={iconClass} /> : <RectangleHorizontal className={iconClass} />}
                    <span className={labelClass}>{product.width > product.height ? 'Portrait' : 'Landscape'}</span>
                </Button>

                <div className="w-2 shrink-0" />

                <Button variant="ghost" className="h-11 w-12 flex flex-col items-center justify-center gap-0.5 group text-red-500 hover:text-red-600 hover:bg-red-50/50 shrink-0">
                    <PlayCircle className={iconClass} />
                    <span className={labelClass}>Simulation</span>
                </Button>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">

                <div className="hidden lg:flex items-center gap-2">
                    <Button variant="outline" className="h-12 w-14 flex flex-col items-center gap-1 group" onClick={handleSave} disabled={props.isSaving}>
                        {props.isSaving ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        ) : (
                            <Save className={iconClass} />
                        )}
                        <span className={labelClass}>{props.isSaving ? 'Saving' : 'Save'}</span>
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
                                <span className="text-[10px] font-bold">Export</span>
                            </>
                        )}
                    </Button>
                ) : (
                    <Button onClick={handleOrder} className="h-12 w-16 flex flex-col items-center justify-center gap-1 group bg-primary hover:bg-primary/90 text-primary-foreground">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="text-[10px] font-bold">Order</span>
                    </Button>
                )}
            </div>

        </header>
    );
}