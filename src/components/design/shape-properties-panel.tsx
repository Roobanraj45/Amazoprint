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
import { X, ImageIcon, Library, PaintBucket, Edit3 } from "lucide-react";
import { Button } from "../ui/button";
import { cn, resolveImagePath } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AssetLibrary } from "./asset-library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ImageMaskEditor } from "./image-mask-editor";

type ShapePropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    isAdmin?: boolean;
};

const PropSlider = ({ label, value, display, min, max, step, onChange }: any) => (
  <div className="space-y-2 py-1">
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground/80 min-w-[40px] text-center">{display}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
  </div>
);

export function ShapePropertiesPanel({ element, onUpdate, isAdmin }: ShapePropertiesPanelProps) {
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);
    const [isImageMaskEditorOpen, setIsImageMaskEditorOpen] = useState(false);

    const handleUpdate = (props: Partial<DesignElement>) => onUpdate(element.id, props);

    const handleFillTypeChange = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'image' | 'none') => {
        const newProps: Partial<DesignElement> = { fillType };
        if (fillType === 'stepped-gradient') {
            const steps = element.gradientSteps || 2;
            const stops = element.gradientStops || [];
            const colors = ['#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#000000','#ffffff','#aaaaaa','#555555'];
            newProps.gradientStops = Array.from({ length: steps }, (_, i) => ({
                id: stops[i]?.id || crypto.randomUUID(), color: stops[i]?.color || colors[i % colors.length],
                position: 0, weight: stops[i]?.weight || 1,
            }));
            newProps.gradientSteps = steps;
            newProps.gradientDirection = 180;
        }
        handleUpdate(newProps);
    };

    const handleGradientStepsChange = (steps: number) => {
        const newSteps = Math.max(2, Math.min(10, steps));
        const stops = [...(element.gradientStops || [])];
        const colors = ['#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#000000','#ffffff','#aaaaaa','#555555'];
        const newStops = Array.from({ length: newSteps }, (_, i) => ({
            id: stops[i]?.id || crypto.randomUUID(), color: stops[i]?.color || colors[i % colors.length], position: 0, weight: stops[i]?.weight || 1,
        }));
        handleUpdate({ gradientSteps: newSteps, gradientStops: newStops });
    };

    const handleSteppedStopChange = (index: number, props: Partial<GradientStop>) => {
        const newStops = [...(element.gradientStops || [])];
        if (newStops[index]) { newStops[index] = { ...newStops[index], ...props }; handleUpdate({ gradientStops: newStops }); }
    };

    const shapeSupportsGradient = (element.type === 'shape' && !['line', 'arrow'].includes(element.shapeType || '')) || element.type === 'path';

    const gradientStops = element.gradientStops?.length
        ? element.gradientStops
        : [{ id: crypto.randomUUID(), color: '#000000', position: 0 }, { id: crypto.randomUUID(), color: '#ffffff', position: 1 }];

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
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color</p>
                </div>
                <TabsList className="h-8 grid grid-cols-2 bg-muted/60 rounded-lg w-full mb-3">
                    <TabsTrigger value="fill" className="text-xs font-semibold h-6 rounded-md data-[state=active]:bg-background">Fill</TabsTrigger>
                    <TabsTrigger value="stroke" className="text-xs font-semibold h-6 rounded-md data-[state=active]:bg-background">Stroke</TabsTrigger>
                </TabsList>

                <TabsContent value="fill" className="mt-0 space-y-3">
                    {shapeSupportsGradient && (
                        <div className="flex gap-1.5">
                            {fillTypes.map(({ value, label, preview, realValue }) => {
                                const actualValue = realValue || value;
                                const isActive = currentFill === actualValue || (actualValue === 'solid' && !element.fillType);
                                return (
                                    <button key={value} onClick={() => handleFillTypeChange(actualValue as any)}
                                        className={cn(
                                            "flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border text-[10px] font-semibold transition-all",
                                            isActive ? "bg-primary/10 border-primary/60 text-primary" : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60"
                                        )}>
                                        {preview}{label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="rounded-xl bg-muted/20 border border-border/40 p-2.5">
                        {(currentFill === 'solid' || !element.fillType) && (
                            <ColorPicker label="" color={element.color || '#cccccc'} onChange={(color) => handleUpdate({ color })} />
                        )}
                        {currentFill === 'gradient' && (
                            <div className="space-y-4">
                                <GradientPicker stops={gradientStops} direction={element.gradientDirection || 0}
                                    onDirectionChange={(d) => handleUpdate({ gradientDirection: d })}
                                    onStopsChange={(s) => handleUpdate({ gradientStops: s })} />
                                <div className="pt-2 border-t border-border/40 space-y-3">
                                    <ColorPicker label="Overlay Tint" color={element.color || '#000000'} onChange={(c) => handleUpdate({ color: c })} />
                                    <PropSlider label="Tint Opacity" value={element.tintOpacity || 0} display={`${Math.round((element.tintOpacity || 0) * 100)}%`} min={0} max={1} step={0.01} onChange={(v: number) => handleUpdate({ tintOpacity: v })} />
                                </div>
                            </div>
                        )}
                        {currentFill === 'stepped-gradient' && (
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                                    <PropSlider label="Angle" value={element.gradientDirection || 0} display={`${element.gradientDirection || 0}°`} min={0} max={360} step={1} onChange={(v: number) => handleUpdate({ gradientDirection: v })} />
                                    <div className="space-y-1 w-16">
                                        <Label className="text-[10px] uppercase text-muted-foreground/60">Steps</Label>
                                        <Input type="number" className="h-8 text-sm font-mono bg-background border-0" value={element.gradientSteps || 2}
                                            onChange={(e) => handleGradientStepsChange(parseInt(e.target.value))} min={2} max={10} />
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                                    {(element.gradientStops || []).map((stop, i) => (
                                        <div key={stop.id} className="flex items-center gap-3 p-2.5 bg-background/60 rounded-lg border border-border/40">
                                            <ColorPicker label={`Step ${i + 1}`} color={stop.color} onChange={(c) => handleSteppedStopChange(i, { color: c })} containerClassName="flex-1 space-y-0" />
                                            <div className="w-14 space-y-1">
                                                <Label className="text-[10px] uppercase text-muted-foreground/60">Ratio</Label>
                                                <Input type="number" className="h-7 text-xs font-mono bg-muted/40 border-0" value={stop.weight ?? 1}
                                                    onChange={(e) => handleSteppedStopChange(i, { weight: parseInt(e.target.value, 10) || 1 })} min={1} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="w-full h-8 text-sm" onClick={() => handleGradientStepsChange((element.gradientSteps || 2) + 1)}>+ Add Step</Button>
                            </div>
                        )}
                        {currentFill === 'image' && (
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-muted rounded-md shrink-0 flex items-center justify-center overflow-hidden border border-border/50">
                                        {element.fillImageSrc ? <Image src={resolveImagePath(element.fillImageSrc)} alt="" width={48} height={48} className="object-cover" /> : <ImageIcon size={16} className="text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Input type="text" value={element.fillImageSrc || ''} onChange={(e) => handleUpdate({ fillImageSrc: e.target.value })} placeholder="Image URL..." className="h-8 text-sm bg-muted/40 border-0" />
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => setIsAssetLibraryOpen(true)}>
                                                <Library size={12} className="mr-1.5" /> Browse
                                            </Button>
                                            {element.fillImageSrc && (
                                                <Button variant="secondary" size="sm" className="h-7 text-xs flex-1" onClick={() => setIsImageMaskEditorOpen(true)}>
                                                    <Edit3 size={12} className="mr-1.5" /> Adjust
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Dialog open={isAssetLibraryOpen} onOpenChange={setIsAssetLibraryOpen}>
                                    <DialogContent className="max-w-4xl h-[80vh]">
                                        <DialogHeader><DialogTitle>Image Library</DialogTitle><DialogDescription>Select an image to use as a fill texture.</DialogDescription></DialogHeader>
                                        <AssetLibrary onImageSelect={(url) => { handleUpdate({ fillImageSrc: url }); setIsAssetLibraryOpen(false); }} isAdmin={isAdmin} />
                                    </DialogContent>
                                </Dialog>
                                <ImageMaskEditor 
                                    isOpen={isImageMaskEditorOpen} 
                                    onClose={() => setIsImageMaskEditorOpen(false)} 
                                    element={element} 
                                    onUpdate={onUpdate} 
                                />
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
                        <ColorPicker label="Stroke Color" color={element.borderColor || '#000000'} onChange={(c) => handleUpdate({ borderColor: c })} />
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
