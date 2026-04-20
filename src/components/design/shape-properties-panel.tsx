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
import { PaintBucket, Edit3, ListFilter, X, ImageIcon, Library } from "lucide-react";
import { Button } from "../ui/button";
import { cn, resolveImagePath } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AssetLibrary } from "./asset-library";

type ShapePropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    isAdmin?: boolean;
};

const SectionCard = ({ title, icon, children, ...props }: any) => (
  <div {...props}>
    <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-foreground">
      <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
        {icon}
      </div>
      {title}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);


export function ShapePropertiesPanel({ element, onUpdate, isAdmin }: ShapePropertiesPanelProps) {
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);

    const handleUpdate = (props: Partial<DesignElement>) => {
        onUpdate(element.id, props);
    };

    const handleFillTypeChange = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'image' | 'none') => {
        const newProps: Partial<DesignElement> = { fillType };
        if (fillType === 'stepped-gradient') {
            const steps = element.gradientSteps || 2;
            const currentStops = element.gradientStops || [];
            const defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];
            const newStops = Array.from({ length: steps }, (_, i) => ({
                id: currentStops[i]?.id || crypto.randomUUID(),
                color: currentStops[i]?.color || defaultColors[i % defaultColors.length],
                position: 0, 
                weight: currentStops[i]?.weight || 1
            }));
            newProps.gradientStops = newStops;
            newProps.gradientSteps = steps;
        }
        handleUpdate(newProps);
    }
    
    const handleGradientStepsChange = (steps: number) => {
        const newSteps = Math.max(2, Math.min(10, steps));
        let currentStops = [...(element.gradientStops || [])];
        const defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];

        const newStops = Array.from({ length: newSteps }, (_, i) => ({
            id: currentStops[i]?.id || crypto.randomUUID(),
            color: currentStops[i]?.color || defaultColors[i % defaultColors.length],
            position: 0,
            weight: currentStops[i]?.weight || 1
        }));
        
        handleUpdate({ gradientSteps: newSteps, gradientStops: newStops });
    }

    const handleSteppedStopChange = (index: number, newProps: Partial<GradientStop>) => {
        const newStops = [...(element.gradientStops || [])];
        if (newStops[index]) {
            newStops[index] = { ...newStops[index], ...newProps };
            handleUpdate({ gradientStops: newStops });
        }
    }

    const shapeSupportsGradient = (element.type === 'shape' && !['line', 'arrow'].includes(element.shapeType || '')) || element.type === 'path';

    const gradientStops = element.gradientStops?.length ? element.gradientStops : [
        { id: crypto.randomUUID(), color: '#000000', position: 0 },
        { id: crypto.randomUUID(), color: '#ffffff', position: 1 }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <SectionCard title="Fill" icon={<PaintBucket size={14}/>}>
                        {shapeSupportsGradient && (
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fill Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFillTypeChange('solid')}
                                    className={cn(
                                        "h-10 flex items-center justify-start gap-2 text-xs",
                                        (!element.fillType || element.fillType === 'solid') && "border-primary ring-1 ring-primary"
                                    )}
                                >
                                    <div className="w-5 h-5 rounded-sm border bg-gray-400" />
                                    Solid Color
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFillTypeChange('gradient')}
                                    className={cn(
                                        "h-10 flex items-center justify-start gap-2 text-xs",
                                        (element.fillType === 'gradient') && "border-primary ring-1 ring-primary"
                                    )}
                                >
                                    <div className="w-5 h-5 rounded-sm border bg-gradient-to-br from-blue-400 to-purple-500" />
                                    Gradient
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFillTypeChange('stepped-gradient')}
                                    className={cn(
                                        "h-10 flex items-center justify-start gap-2 text-xs",
                                        (element.fillType === 'stepped-gradient') && "border-primary ring-1 ring-primary"
                                    )}
                                >
                                    <div className="w-5 h-5 rounded-sm border bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                                    Stepped
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFillTypeChange('image')}
                                    className={cn(
                                        "h-10 flex items-center justify-start gap-2 text-xs",
                                        (element.fillType === 'image') && "border-primary ring-1 ring-primary"
                                    )}
                                >
                                    <ImageIcon size={14} className="text-muted-foreground" />
                                    Image Texture
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFillTypeChange('none')}
                                className={cn(
                                    "w-full text-xs",
                                    element.fillType === 'none' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                                )}
                            >
                                <X className="mr-2 h-3 w-3" />
                                No Fill
                            </Button>
                        </div>
                    )}

                    <div className="pt-2">
                        {(!element.fillType || element.fillType === 'solid') && (
                            <ColorPicker
                                label=""
                                color={element.color || '#cccccc'}
                                onChange={(color) => handleUpdate({ color })}
                            />
                        )}
                        
                        {element.fillType === 'gradient' && (
                            <div className="space-y-6">
                                <GradientPicker
                                    stops={gradientStops}
                                    direction={element.gradientDirection || 0}
                                    onDirectionChange={direction => handleUpdate({ gradientDirection: direction })}
                                    onStopsChange={stops => handleUpdate({ gradientStops: stops })}
                                />
                                <div className="pt-4 border-t border-border/40 space-y-4">
                                    <ColorPicker
                                        label="Overlay Tint"
                                        color={element.color || '#000000'}
                                        onChange={color => handleUpdate({ color })}
                                    />
                                    <div className="space-y-2 px-1">
                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                            <Label>Tint Opacity</Label>
                                            <span>{Math.round((element.tintOpacity || 0) * 100)}%</span>
                                        </div>
                                        <Slider value={[element.tintOpacity || 0]} onValueChange={v => handleUpdate({ tintOpacity: v[0]})} max={1} step={0.01} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {element.fillType === 'stepped-gradient' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/40">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                            <Label>Angle</Label>
                                            <span>{element.gradientDirection || 0}°</span>
                                        </div>
                                        <Slider value={[element.gradientDirection || 0]} onValueChange={v => handleUpdate({gradientDirection: v[0]})} max={360} step={1} />
                                    </div>
                                    <div className="w-px h-10 bg-border/60" />
                                    <div className="w-16 space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Steps</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs font-mono bg-background border-none"
                                            value={element.gradientSteps || 2}
                                            onChange={e => handleGradientStepsChange(parseInt(e.target.value))}
                                            min={2} max={10}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                                        <ListFilter size={12} />
                                        Color Steps
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {(element.gradientStops || []).map((stop, index) => (
                                            <div key={stop.id} className="bg-background/40 p-3 rounded-xl border border-border/40">
                                                <div className="flex gap-3 items-end">
                                                    <ColorPicker
                                                        label={`Step ${''}${index + 1}`}
                                                        color={stop.color}
                                                        onChange={color => handleSteppedStopChange(index, { color })}
                                                        containerClassName="space-y-0 flex-1"
                                                    />
                                                    <div className="w-20 space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground text-center">Ratio</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs font-mono bg-background border-border/50 focus-visible:ring-1 ring-primary/30"
                                                            value={stop.weight ?? 1}
                                                            onChange={e => handleSteppedStopChange(index, { weight: parseInt(e.target.value, 10) || 1 })}
                                                            min={1}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleGradientStepsChange((element.gradientSteps || 2) + 1)} className="w-full mt-2">Add Step</Button>
                                </div>
                                
                                <div className="pt-4 border-t border-border/40 space-y-4">
                                    <ColorPicker
                                        label="Overlay Tint"
                                        color={element.color || '#000000'}
                                        onChange={color => handleUpdate({ color })}
                                    />
                                    <div className="space-y-2 px-1">
                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                            <Label>Tint Opacity</Label>
                                            <span>{Math.round((element.tintOpacity || 0) * 100)}%</span>
                                        </div>
                                        <Slider value={[element.tintOpacity || 0]} onValueChange={v => handleUpdate({ tintOpacity: v[0]})} max={1} step={0.01} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {element.fillType === 'image' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border">
                                        {element.fillImageSrc ? (
                                            <img src={resolveImagePath(element.fillImageSrc)} alt="Fill preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Button variant="outline" size="sm" className="w-full text-xs h-9" onClick={() => setIsAssetLibraryOpen(true)}>
                                            <Library className="mr-2 h-4 w-4" /> Browse Library
                                        </Button>
                                        {element.fillImageSrc && (
                                            <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] text-destructive hover:text-destructive" onClick={() => handleUpdate({ fillImageSrc: '' })}>
                                                <X className="mr-1 h-3 w-3" /> Remove Texture
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border/40 space-y-4">
                                    <ColorPicker
                                        label="Texture Tint"
                                        color={element.color || '#000000'}
                                        onChange={color => handleUpdate({ color })}
                                    />
                                    <div className="space-y-2 px-1">
                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                            <Label>Tint Opacity</Label>
                                            <span>{Math.round((element.tintOpacity || 0) * 100)}%</span>
                                        </div>
                                        <Slider value={[element.tintOpacity || 0]} onValueChange={v => handleUpdate({ tintOpacity: v[0]})} max={1} step={0.01} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <SectionCard title="Stroke" icon={<Edit3 size={14}/>}>
                    <ColorPicker
                        label="Stroke Color"
                        color={element.borderColor || '#000000'}
                        onChange={(color) => handleUpdate({ borderColor: color })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Weight</Label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/50">px</span>
                                <Input
                                    type="number"
                                    className="pl-8 h-9 text-xs font-mono bg-background/50 border-border/50"
                                    value={element.borderWidth || 0}
                                    onChange={(e) => handleUpdate({ borderWidth: parseInt(e.target.value, 10) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Style</Label>
                            <Select value={element.borderStyle || 'solid'} onValueChange={(v) => handleUpdate({ borderStyle: v as any })}>
                                <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50 shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="solid">Solid</SelectItem>
                                    <SelectItem value="dashed">Dashed</SelectItem>
                                    <SelectItem value="dotted">Dotted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <Dialog open={isAssetLibraryOpen} onOpenChange={setIsAssetLibraryOpen}>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Fill Texture Library</DialogTitle>
                        <DialogDescription>Select an image to use as the fill for this shape.</DialogDescription>
                    </DialogHeader>
                    <AssetLibrary 
                        onImageSelect={(url) => {
                            handleUpdate({ fillImageSrc: url });
                            setIsAssetLibraryOpen(false);
                        }}
                        isAdmin={isAdmin} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
