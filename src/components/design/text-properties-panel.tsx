'use client';

import React, { useState } from "react";
import Image from "next/image";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import type { DesignElement, GradientStop, Shadow, TextWarp, Product } from "@/lib/types";
import { 
    AlignCenter, AlignJustify, AlignLeft, AlignRight, 
    Bold, CaseLower, CaseUpper, Italic, Strikethrough, 
    Underline, X, Type, Palette, Layout, ListFilter,
    Baseline, ArrowUpDown, WandSparkles, Edit3, Library, ImageIcon,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd
} from "lucide-react";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { GradientPicker } from "./gradient-picker";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AssetLibrary } from "./asset-library";
import { cn } from "@/lib/utils";

const fontFamilies = [
  'Inter', 'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Poppins', 'Nunito',
  'Playfair Display', 'Merriweather', 'Ubuntu', 'PT Sans', 'Lora', 'Source Sans Pro',
  'Pacifico', 'Dancing Script', 'Lobster', 'Bebas Neue', 'Caveat',
  'Bevan', 'Bree Serif', 'Coda', 'Fugaz One', 'Jura'
];

type TextPropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    product: Product;
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
    <div className="space-y-3">{children}</div>
  </div>
);

export function TextPropertiesPanel({ element, onUpdate, product, isAdmin }: TextPropertiesPanelProps) {
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

    const gradientStops = element.gradientStops?.length ? element.gradientStops : [
      { id: crypto.randomUUID(), color: (element as any).gradientStart || '#000000', position: 0 },
      { id: crypto.randomUUID(), color: (element as any).gradientEnd || '#ffffff', position: 1 }
    ];

    const firstShadow = element.textShadows?.[0];

    const handleShadowChange = (newShadowProps: Partial<Shadow>) => {
        if (!firstShadow) return;
        const newShadows = [...(element.textShadows || [])];
        newShadows[0] = { ...newShadows[0], ...newShadowProps };
        handleUpdate({ textShadows: newShadows });
    };

    const toggleShadow = (enabled: boolean) => {
        if (enabled) {
            handleUpdate({
                textShadows: [{
                    id: crypto.randomUUID(),
                    offsetX: 2,
                    offsetY: 2,
                    blur: 4,
                    color: '#00000080'
                }]
            });
        } else {
            handleUpdate({ textShadows: [] });
        }
    };

    const warp = element.textWarp || { style: 'none' };
    const handleWarpChange = (props: Partial<TextWarp>) => {
        onUpdate(element.id, { textWarp: { ...(element.textWarp || { style: 'none'}), ...props } });
    };
    const warpStyles = ['none', 'circle'];


    return (
        <>
            <Textarea
                value={element.content}
                className="min-h-[80px] bg-background/60 border-none shadow-inner resize-none text-base focus-visible:ring-1 ring-primary/30 m-3 w-auto"
                onChange={(e) => handleUpdate({ content: e.target.value })}
                placeholder="Type something..."
            />
            
            <div className="space-y-2 bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm mx-3">
                <SectionCard title="Typography" icon={<Type size={14} />}>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Font Family</Label>
                            <Select value={element.fontFamily} onValueChange={(v) => handleUpdate({ fontFamily: v })}>
                                <SelectTrigger className="h-9 bg-background border-none shadow-sm text-xs font-medium">
                                    <SelectValue placeholder="Font Family" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontFamilies.map(font => (
                                        <SelectItem key={font} value={font}>
                                            <span style={{ fontFamily: font }}>{font}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Size</Label>
                            <Input
                                type="number"
                                className="h-9 bg-background border-none shadow-sm text-xs font-mono"
                                value={element.fontSize}
                                onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value, 10) })}
                                suffix="px"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Format</Label>
                            <div className="flex bg-background rounded-md p-0.5 shadow-sm border border-border/50 h-9">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`flex-1 h-full px-0 ${element.fontWeight === 'bold' ? 'bg-secondary text-primary' : ''}`} 
                                    onClick={() => handleUpdate({fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold'})}
                                >
                                    <Bold className="h-3.5 w-3.5"/>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`flex-1 h-full px-0 ${element.fontStyle === 'italic' ? 'bg-secondary text-primary' : ''}`} 
                                    onClick={() => handleUpdate({fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic'})}
                                >
                                    <Italic className="h-3.5 w-3.5"/>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`flex-1 h-full px-0 ${element.textDecoration === 'underline' ? 'bg-secondary text-primary' : ''}`} 
                                    onClick={() => handleUpdate({textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline'})}
                                >
                                    <Underline className="h-3.5 w-3.5"/>
                                </Button>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <div className="space-y-2 bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm mx-3">
                <SectionCard title="Fill & Stroke" icon={<Palette size={14} />}>
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

                    <div className="pt-2">
                        {(!element.fillType || element.fillType === 'solid') && (
                            <ColorPicker
                                label=""
                                color={element.color}
                                onChange={(color) => handleUpdate({ color })}
                            />
                        )}
                        {element.fillType === 'gradient' && (
                            <GradientPicker
                                stops={gradientStops}
                                direction={element.gradientDirection || 0}
                                onDirectionChange={direction => handleUpdate({ gradientDirection: direction })}
                                onStopsChange={stops => handleUpdate({ gradientStops: stops })}
                            />
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
                                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
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
                            </div>
                        )}
                        {element.fillType === 'image' && (
                            <div className="space-y-3">
                                <Label className="text-xs">Mask Image</Label>
                                <div className="flex items-center gap-2">
                                    <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0 flex items-center justify-center">
                                        {element.fillImageSrc ? (
                                            <Image src={element.fillImageSrc} alt="Mask preview" width={48} height={48} className="object-cover rounded-md" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            type="text"
                                            value={element.fillImageSrc || ''}
                                            onChange={(e) => handleUpdate({ fillImageSrc: e.target.value })}
                                            placeholder="Enter image URL..."
                                            className="h-8 text-xs"
                                        />
                                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsAssetLibraryOpen(true)}>
                                            <Library className="mr-2 h-3 w-3" />
                                            Browse Library
                                        </Button>
                                    </div>
                                </div>
                                <Dialog open={isAssetLibraryOpen} onOpenChange={setIsAssetLibraryOpen}>
                                    <DialogContent className="max-w-4xl h-[80vh]">
                                        <DialogHeader>
                                            <DialogTitle>Image Library</DialogTitle>
                                            <DialogDescription>Select an image to use as a mask.</DialogDescription>
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
                        )}
                    </div>
                </SectionCard>
                <div className="pt-3 border-t border-border/40">
                    <SectionCard title="Stroke" icon={<Edit3 size={14} />}>
                       <ColorPicker
                            label="Stroke Color"
                            color={element.textStrokeColor || '#000000'}
                            onChange={(color) => handleUpdate({ textStrokeColor: color })}
                        />
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <Label>Stroke Width</Label>
                              <span>{element.textStrokeWidth || 0}px</span>
                            </div>
                            <Slider
                                value={[element.textStrokeWidth || 0]}
                                onValueChange={v => handleUpdate({ textStrokeWidth: v[0] })}
                                min={0} max={20} step={0.5}
                            />
                        </div>
                    </SectionCard>
                </div>
            </div>
            
            <div className="space-y-2 bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm mx-3">
                <SectionCard title="Layout & Spacing" icon={<Layout size={14}/>}>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Alignment</Label>
                        <div className="grid grid-cols-1 gap-2">
                            <div className='flex p-1 bg-background/50 rounded-lg border border-border/50'>
                                <Button variant={element.textAlign === 'left' ? 'secondary' : 'ghost'} size="icon" className="flex-1 h-8" onClick={() => handleUpdate({textAlign: 'left'})}><AlignLeft size={14}/></Button>
                                <Button variant={element.textAlign === 'center' ? 'secondary' : 'ghost'} size="icon" className="flex-1 h-8" onClick={() => handleUpdate({textAlign: 'center'})}><AlignCenter size={14}/></Button>
                                <Button variant={element.textAlign === 'right' ? 'secondary' : 'ghost'} size="icon" className="flex-1 h-8" onClick={() => handleUpdate({textAlign: 'right'})}><AlignRight size={14}/></Button>
                                <Button variant={element.textAlign === 'justify' ? 'secondary' : 'ghost'} size="icon" className="flex-1 h-8" onClick={() => handleUpdate({textAlign: 'justify'})}><AlignJustify size={14}/></Button>
                            </div>
                            <div className='flex p-1 bg-background/50 rounded-lg border border-border/50'>
                                <Button variant={element.verticalAlign === 'top' ? 'secondary' : 'ghost'} size="icon" className="flex-1 h-8" onClick={() => handleUpdate({verticalAlign: 'top'})}><AlignVerticalJustifyStart size={14}/></Button>
                                <Button variant={element.verticalAlign === 'middle' || 
                                !element.verticalAlign ? 'secondary' : 'ghost'} size="icon" className="flex-1 h-8" onClick={() => handleUpdate({verticalAlign: 'middle'})}><AlignVerticalJustifyCenter size={14}/></Button>
                                <Button variant={element.verticalAlign === 'bottom' ? 'secondary' : 'ghost'} size="icon" className="flex-1 h-8" onClick={() => handleUpdate({verticalAlign: 'bottom'})}><AlignVerticalJustifyEnd size={14}/></Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground ml-1">
                                <Baseline size={12}/>
                                Spacing
                            </div>
                            <Input 
                                type="number" 
                                className="h-9 bg-background/50 border-none shadow-sm text-xs font-mono" 
                                value={element.letterSpacing} 
                                onChange={(e) => handleUpdate({letterSpacing: parseFloat(e.target.value)})} 
                                suffix="px"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground ml-1">
                                <ArrowUpDown size={12}/>
                                Height
                            </div>
                            <Input 
                                type="number" 
                                className="h-9 bg-background/50 border-none shadow-sm text-xs font-mono" 
                                value={element.lineHeight} 
                                onChange={(e) => handleUpdate({lineHeight: parseFloat(e.target.value)})} 
                                step={0.1} 
                                suffix="x"
                            />
                        </div>
                    </div>
                     <div className="space-y-3 pt-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Transformations</Label>
                        <div className="grid grid-cols-4 gap-1.5 p-1 bg-background/40 rounded-xl border border-border/50">
                            <Button variant={element.textTransform === 'uppercase' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-full" onClick={() => handleUpdate({textTransform: 'uppercase'})}><CaseUpper size={14}/></Button>
                            <Button variant={element.textTransform === 'lowercase' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-full" onClick={() => handleUpdate({textTransform: 'lowercase'})}><CaseLower size={14}/></Button>
                            <Button variant={element.textTransform === 'capitalize' ? 'secondary' : 'ghost'} size="sm" className="h-8 w-full text-[10px] font-bold" onClick={() => handleUpdate({textTransform: 'capitalize'})}>Aa</Button>
                            <Button variant={!element.textTransform || element.textTransform === 'none' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-full" onClick={() => handleUpdate({textTransform: 'none'})}><X size={14}/></Button>
                        </div>
                    </div>
                </SectionCard>
            </div>
            
            <div className="space-y-2 bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm mx-3">
                <SectionCard title="Effects" icon={<WandSparkles size={14} />}>
                   <div className="space-y-3 px-1 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Shadow</Label>
                            <Switch checked={!!firstShadow} onCheckedChange={toggleShadow} />
                        </div>
                        {firstShadow && (
                            <div className="space-y-3 pt-3 border-t border-border/40">
                                <ColorPicker
                                    label="Shadow Color"
                                    color={firstShadow.color}
                                    onChange={(color) => handleShadowChange({ color })}
                                />
                                 <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <Label>Offset X</Label>
                                        <span>{firstShadow.offsetX.toFixed(1)}px</span>
                                    </div>
                                    <Slider
                                        value={[firstShadow.offsetX]}
                                        onValueChange={(v) => handleShadowChange({ offsetX: v[0] })}
                                        min={-20} max={20} step={0.5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <Label>Offset Y</Label>
                                        <span>{firstShadow.offsetY.toFixed(1)}px</span>
                                    </div>
                                    <Slider
                                        value={[firstShadow.offsetY]}
                                        onValueChange={(v) => handleShadowChange({ offsetY: v[0] })}
                                        min={-20} max={20} step={0.5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <Label>Blur</Label>
                                        <span>{firstShadow.blur}px</span>
                                    </div>
                                    <Slider value={[firstShadow.blur]} onValueChange={(v) => handleShadowChange({ blur: v[0] })} max={50} step={1} />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Warp</Label>
                        </div>
                        <div className="space-y-2">
                            <Label>Style</Label>
                            <Select value={warp.style} onValueChange={(v) => handleWarpChange({ style: v as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {warpStyles.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {warp.style === 'circle' && (
                          <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs"><Label>Radius</Label><span>{warp.radius || 100}px</span></div>
                              <Slider value={[warp.radius || 100]} onValueChange={v => handleWarpChange({ radius: v[0] })} min={10} max={500} step={1} />
                            </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs"><Label>Rotation</Label><span>{warp.value || 0}°</span></div>
                                <Slider value={[warp.value || 0]} onValueChange={v => handleWarpChange({ value: v[0] })} min={0} max={360} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Place Inside Circle</Label>
                              <Switch checked={warp.reverse || false} onCheckedChange={c => handleWarpChange({ reverse: c })} />
                            </div>
                          </div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
