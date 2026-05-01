'use client';

import React, { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { DesignElement, GradientStop } from "@/lib/types";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { GradientPicker } from "./gradient-picker";
import { Input } from "../ui/input";
import { X, ImageIcon, Library, PaintBucket, Edit3, Sparkles, Loader2, Maximize, FlipHorizontal, FlipVertical } from "lucide-react";
import { removeBackground } from "@imgly/background-removal";
import { Button } from "../ui/button";
import { cn, resolveImagePath } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { ImageLibrary } from "./image-library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type ShapePropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    croppingElementId: string | null;
    setCroppingElementId: (id: string | null) => void;
    maskingElementId: string | null;
    setMaskingElementId: (id: string | null) => void;
    isAdmin?: boolean;
    onOpenColorPicker: (label: string, color: string, onChange: (color: string) => void) => void;
};

const PropSlider = ({ label, value, display, min, max, step, onChange }: any) => (
    <div className="space-y-2 py-1">
        <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground/80 min-w-[40px] text-center">{display}</span>
        </div>
        <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
);

export function ShapePropertiesPanel({ element, onUpdate, maskingElementId, setMaskingElementId, isAdmin, onOpenColorPicker }: ShapePropertiesPanelProps) {
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);
    const [isRemovingBackground, setIsRemovingBackground] = useState(false);

    const handleRemoveBackground = async () => {
        if (!element.fillImageSrc || isRemovingBackground) return;
        setIsRemovingBackground(true);
        try {
            const resolvedPath = resolveImagePath(element.fillImageSrc);
            const imageResponse = await fetch(resolvedPath);
            if (!imageResponse.ok) throw new Error("Image not found or inaccessible");
            const inputBlob = await imageResponse.blob();

            const blob = await removeBackground(inputBlob);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                handleUpdate({ fillImageSrc: base64data });
                setIsRemovingBackground(false);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error("Failed to remove background:", error);
            setIsRemovingBackground(false);
        }
    };

    const handleUpdate = (props: Partial<DesignElement>) => onUpdate(element.id, props);

    const handleFillTypeChange = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'image' | 'none') => {
        const newProps: Partial<DesignElement> = { fillType };
        if (fillType === 'stepped-gradient') {
            if (!element.steppedGradientStops) {
                const steps = element.gradientSteps || 2;
                const stops = element.gradientStops || [];
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];
                newProps.steppedGradientStops = Array.from({ length: steps }, (_, i) => ({
                    id: stops[i]?.id || crypto.randomUUID(), color: stops[i]?.color || colors[i % colors.length],
                    position: 0, weight: stops[i]?.weight || 1,
                }));
                newProps.steppedGradientSteps = steps;
                newProps.steppedGradientDirection = element.gradientDirection ?? 180;
                newProps.steppedGradientType = element.gradientType ?? 'linear';
            }
        }
        handleUpdate(newProps);
    };

    const handleGradientStepsChange = (steps: number) => {
        const newSteps = Math.max(2, Math.min(10, steps));
        const isStepped = element.fillType === 'stepped-gradient';
        const stops = [...((isStepped ? element.steppedGradientStops : element.gradientStops) || [])];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];
        const newStops = Array.from({ length: newSteps }, (_, i) => ({
            id: stops[i]?.id || crypto.randomUUID(), color: stops[i]?.color || colors[i % colors.length], position: 0, weight: stops[i]?.weight || 1,
        }));

        if (isStepped) {
            handleUpdate({ steppedGradientSteps: newSteps, steppedGradientStops: newStops });
        } else {
            handleUpdate({ gradientSteps: newSteps, gradientStops: newStops });
        }
    };

    const handleSteppedStopChange = (index: number, props: Partial<GradientStop>) => {
        const isStepped = element.fillType === 'stepped-gradient';
        const stopsField = isStepped ? 'steppedGradientStops' : 'gradientStops';
        const newStops = [...((element[stopsField] as GradientStop[]) || [])];
        if (newStops[index]) {
            newStops[index] = { ...newStops[index], ...props };
            handleUpdate({ [stopsField]: newStops });
        }
    };

    const shapeSupportsGradient = (element.type === 'shape' && !['line', 'arrow'].includes(element.shapeType || '')) || element.type === 'path';

    const gradientStops = element.gradientStops?.length
        ? element.gradientStops
        : [{ id: crypto.randomUUID(), color: '#000000', position: 0 }, { id: crypto.randomUUID(), color: '#ffffff', position: 1 }];

    const steppedStops = element.steppedGradientStops?.length
        ? element.steppedGradientStops
        : [{ id: crypto.randomUUID(), color: '#000000', position: 0, weight: 1 }, { id: crypto.randomUUID(), color: '#ffffff', position: 1, weight: 1 }];

    const currentFill = element.fillType || 'solid';

    const fillTypes = shapeSupportsGradient
        ? [
            { value: 'solid', label: 'Solid', preview: <div className="w-4 h-4 rounded-sm bg-gray-400 border border-gray-300" /> },
            { value: 'gradient', label: 'Gradient', preview: <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-400 to-purple-500" /> },
            { value: 'stepped', label: 'Stepped', preview: <div className="w-4 h-4 rounded-sm bg-gradient-to-r from-red-500 via-yellow-400 to-green-400" />, realValue: 'stepped-gradient' },
            { value: 'image', label: 'Image', preview: <ImageIcon size={14} /> },
            { value: 'none', label: 'None', preview: <X size={14} /> },
        ]
        : [
            { value: 'solid', label: 'Solid', preview: <div className="w-4 h-4 rounded-sm bg-gray-400 border border-gray-300" /> },
            { value: 'none', label: 'None', preview: <X size={14} /> },
        ];

    return (
        <div className="space-y-4">
            <Tabs defaultValue="fill" className="w-full">
                <div className="flex items-center gap-2 mb-3">
                    <PaintBucket size={14} className="text-muted-foreground" />
                    <p className="text-xs font-bold text-muted-foreground">Color</p>
                </div>
                <TabsList className="h-7 grid grid-cols-2 bg-muted/60 rounded-lg w-full mb-2">
                    <TabsTrigger value="fill" className="text-[10px] font-bold h-5 rounded-md data-[state=active]:bg-background">Fill</TabsTrigger>
                    <TabsTrigger value="stroke" className="text-[10px] font-bold h-5 rounded-md data-[state=active]:bg-background">Stroke</TabsTrigger>
                </TabsList>

                <TabsContent value="fill" className="mt-0 space-y-2">
                    {shapeSupportsGradient && (
                        <div className="flex gap-1">
                            {fillTypes.map(({ value, label, preview, realValue }) => {
                                const actualValue = realValue || value;
                                const isActive = currentFill === actualValue || (actualValue === 'solid' && !element.fillType);
                                return (
                                    <button key={value} onClick={() => handleFillTypeChange(actualValue as any)}
                                        className={cn(
                                            "flex-1 flex flex-col items-center gap-0.5 py-1 px-0.5 rounded-lg border text-[9px] font-bold transition-all shadow-sm",
                                            isActive ? "bg-primary/10 border-primary/60 text-primary" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}>
                                        {preview}{label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="rounded-xl bg-slate-50/50 border border-slate-200 p-2 shadow-inner">
                        {(currentFill === 'solid' || !element.fillType) && (
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 ml-1">Shape color</Label>
                                <Button
                                    variant="outline"
                                    className="h-9 w-full px-3 justify-start rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all shadow-sm"
                                    onClick={() => onOpenColorPicker("Shape color", element.color || "#cccccc", (color) => handleUpdate({ color }))}
                                >
                                    <div className="w-4 h-4 rounded-md border border-slate-200 shadow-sm mr-3" style={{ backgroundColor: element.color || "#cccccc" }} />
                                    <span className="text-[11px] font-mono leading-none tracking-tight text-slate-700">{element.color || "#cccccc"}</span>
                                </Button>
                            </div>
                        )}
                        {currentFill === 'gradient' && (
                            <div className="space-y-4">
                                <GradientPicker
                                    stops={gradientStops}
                                    direction={element.gradientDirection || 0}
                                    gradientType={element.gradientType || 'linear'}
                                    onDirectionChange={(d) => handleUpdate({ gradientDirection: d })}
                                    onTypeChange={(t) => handleUpdate({ gradientType: t })}
                                    onStopsChange={(s) => handleUpdate({ gradientStops: s })}
                                    onOpenColorPicker={onOpenColorPicker}
                                />
                                <div className="pt-2 border-t border-border/40 space-y-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-muted-foreground/70 ml-1">Overlay tint</Label>
                                        <Button
                                            variant="outline"
                                            className="h-9 w-full px-3 justify-start rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                                            onClick={() => onOpenColorPicker("Overlay tint", element.color || "#000000", (c) => handleUpdate({ color: c }))}
                                        >
                                            <div className="w-4 h-4 rounded-md border border-white/20 shadow-sm mr-3" style={{ backgroundColor: element.color || "#000000" }} />
                                            <span className="text-[11px] font-mono leading-none tracking-tight">{element.color || "#000000"}</span>
                                        </Button>
                                    </div>
                                    <PropSlider label="Tint Opacity" value={element.tintOpacity || 0} display={`${Math.round((element.tintOpacity || 0) * 100)}%`} min={0} max={1} step={0.01} onChange={(v: number) => handleUpdate({ tintOpacity: v })} />
                                </div>
                            </div>
                        )}
                        {currentFill === 'stepped-gradient' && (
                            <div className="space-y-3 pt-1">
                                <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                                    <PropSlider
                                        label="Angle"
                                        value={element.steppedGradientDirection ?? element.gradientDirection ?? 0}
                                        display={`${element.steppedGradientDirection ?? element.gradientDirection ?? 0}°`}
                                        min={0} max={360} step={1}
                                        onChange={(v: number) => handleUpdate({ steppedGradientDirection: v })}
                                    />
                                    <div className="space-y-1 w-14">
                                        <Label className="text-[10px] font-bold text-muted-foreground/60">Steps</Label>
                                        <Input type="number" className="h-7 text-xs font-mono bg-background border-0" value={element.steppedGradientSteps || element.gradientSteps || 2}
                                            onChange={(e) => handleGradientStepsChange(parseInt(e.target.value))} min={2} max={10} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                    {steppedStops.map((stop, i) => (
                                        <div key={stop.id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-primary/20">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[9px] font-bold text-muted-foreground/50 uppercase ml-1 tracking-widest">Step {i + 1}</Label>
                                                <Button
                                                    variant="outline"
                                                    className="h-8 w-full px-2 justify-start rounded-lg border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all shadow-sm"
                                                    onClick={() => onOpenColorPicker(`Step ${i + 1} color`, stop.color, (c) => handleSteppedStopChange(i, { color: c }))}
                                                >
                                                    <div className="w-3.5 h-3.5 rounded-sm border border-slate-200 shadow-sm mr-2" style={{ backgroundColor: stop.color }} />
                                                    <span className="text-[10px] font-mono leading-none text-slate-700">{stop.color}</span>
                                                </Button>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-center px-1">
                                                    <Label className="text-[9px] uppercase text-muted-foreground/50 font-bold tracking-widest">Ratio</Label>
                                                    <span className="text-[10px] font-mono text-primary">{(stop.weight ?? 1).toFixed(1)}</span>
                                                </div>
                                                <Slider value={[stop.weight ?? 1]} onValueChange={(v) => handleSteppedStopChange(i, { weight: v[0] })} min={1} max={10} step={0.1} className="py-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="w-full h-8 text-[11px] font-bold uppercase tracking-wider" onClick={() => handleGradientStepsChange((element.steppedGradientSteps || element.gradientSteps || 2) + 1)}>+ Add Step</Button>
                            </div>
                        )}
                        {currentFill === 'image' && (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-primary/20">
                                        <div className="w-12 h-12 bg-slate-50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner group relative">
                                            {element.fillImageSrc ? (
                                                <Image src={resolveImagePath(element.fillImageSrc)} alt="" width={48} height={48} className="object-cover" />
                                            ) : (
                                                <ImageIcon size={18} className="text-slate-300" />
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center" onClick={() => setIsAssetLibraryOpen(true)}>
                                                <Library size={12} className="text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full h-9 text-[11px] font-bold rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 transition-all" 
                                                onClick={() => setIsAssetLibraryOpen(true)}
                                            >
                                                Change Image
                                            </Button>
                                            <Button 
                                                variant="default" 
                                                size="sm" 
                                                className="w-full h-9 text-[11px] font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2" 
                                                onClick={() => setMaskingElementId(element.id)}
                                            >
                                                <Maximize size={12} />
                                                Adjust Position
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200 mt-2 space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider">Transform</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={cn(
                                                    "h-9 flex-1 gap-1 rounded-lg transition-all text-[11px] font-bold",
                                                    element.fillImageFlipHorizontal && "bg-primary/10 text-primary border-primary/30"
                                                )}
                                                onClick={() => handleUpdate({ fillImageFlipHorizontal: !element.fillImageFlipHorizontal })}
                                            >
                                                <FlipHorizontal size={14} />
                                                Horizontal
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={cn(
                                                    "h-9 flex-1 gap-1 rounded-lg transition-all text-[11px] font-bold",
                                                    element.fillImageFlipVertical && "bg-primary/10 text-primary border-primary/30"
                                                )}
                                                onClick={() => handleUpdate({ fillImageFlipVertical: !element.fillImageFlipVertical })}
                                            >
                                                <FlipVertical size={14} />
                                                Vertical
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Dialog open={isAssetLibraryOpen} onOpenChange={setIsAssetLibraryOpen}>
                                    <DialogContent className="max-w-4xl h-[80vh]">
                                        <DialogHeader><DialogTitle>Image Library</DialogTitle><DialogDescription>Select an image to use as a fill texture.</DialogDescription></DialogHeader>
                                        <ImageLibrary onImageSelect={(url) => {
                                            handleUpdate({
                                                fillType: 'image',
                                                fillImageSrc: url,
                                                fillImageScale: 1,
                                                fillImageOffsetX: 0,
                                                fillImageOffsetY: 0
                                            });
                                            setIsAssetLibraryOpen(false);
                                        }} isAdmin={isAdmin} />
                                    </DialogContent>
                                </Dialog>

                                <div className="pt-2 border-t border-slate-200 mt-2 space-y-3">
                                    <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider">Image Adjustments</Label>
                                    <div className="space-y-4">
                                        <PropSlider label="Brightness" value={element.filterBrightness || 1} display={`${Math.round(((element.filterBrightness || 1) - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => handleUpdate({ filterBrightness: v })} />
                                        <PropSlider label="Contrast" value={element.filterContrast || 1} display={`${Math.round(((element.filterContrast || 1) - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => handleUpdate({ filterContrast: v })} />
                                        <PropSlider label="Saturation" value={element.filterSaturate || 1} display={`${Math.round(((element.filterSaturate || 1) - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => handleUpdate({ filterSaturate: v })} />
                                        <PropSlider label="Blur" value={element.filterBlur || 0} display={`${element.filterBlur || 0}px`} min={0} max={20} step={1} onChange={(v: number) => handleUpdate({ filterBlur: v })} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentFill === 'none' && (
                            <div className="flex items-center gap-2 text-muted-foreground py-3">
                                <X size={14} />
                                <span className="text-sm">No fill applied</span>
                            </div>
                        )}
                    </div>

                    {!shapeSupportsGradient && (
                        <button onClick={() => handleFillTypeChange(currentFill === 'none' ? 'solid' : 'none')}
                            className={cn("w-full text-sm py-2 rounded-lg border transition-all flex items-center justify-center gap-1.5",
                                currentFill === 'none' ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40")}>
                            <X size={14} /> {currentFill === 'none' ? 'Fill is Off' : 'Remove Fill'}
                        </button>
                    )}
                </TabsContent>

                <TabsContent value="stroke" className="mt-0 space-y-2">
                    <div className="rounded-xl bg-muted/20 border border-border/40 p-3 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground/70 ml-1">Stroke color</Label>
                            <Button
                                variant="outline"
                                className="h-10 w-full px-3 justify-start rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                                onClick={() => onOpenColorPicker("Stroke color", element.borderColor || "#000000", (c) => handleUpdate({ borderColor: c }))}
                            >
                                <div className="w-5 h-5 rounded-md border border-white/20 shadow-sm mr-3" style={{ backgroundColor: element.borderColor || "#000000" }} />
                                <span className="text-xs font-mono">{element.borderColor || "#000000"}</span>
                            </Button>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground/60">Style</Label>
                            <Select value={element.borderStyle || 'solid'} onValueChange={(v) => handleUpdate({ borderStyle: v as any })}>
                                <SelectTrigger className="h-8 text-sm bg-muted/40 border-0"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="solid">Solid</SelectItem>
                                    <SelectItem value="dashed">Dashed</SelectItem>
                                    <SelectItem value="dotted">Dotted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <PropSlider label="Width" value={element.borderWidth || 0} display={`${element.borderWidth || 0}px`} min={0} max={20} step={0.5} onChange={(v: number) => handleUpdate({ borderWidth: v })} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
