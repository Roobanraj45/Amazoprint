'use client';

import React, { useState } from "react";
import Image from "next/image";
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
    Underline, X, ImageIcon, Library,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    Type, Palette, WandSparkles,
} from "lucide-react";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { GradientPicker } from "./gradient-picker";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AssetLibrary } from "./asset-library";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

type TextPropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    product: Product;
    isAdmin?: boolean;
};

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Oswald", "Source Sans 3",
  "Raleway", "Ubuntu", "Playfair Display", "Merriweather", "PT Serif", "Lora", "Nunito",
  "Roboto Mono", "Fira Code", "Outfit", "Dancing Script", "Pacifico", "Caveat", "Righteous",
  "Lobster", "Bebas Neue", "Anton", "Josefin Sans", "Titillium Web", "Quicksand", "Rubik",
  "Inconsolata", "Cinzel", "Amatic SC", "Comfortaa", "Comic Neue", "Permanent Marker",
  "Bungee", "Rakkas", "Kalam", "Indie Flower", "Satisfy"
];

const PropSlider = ({ label, value, display, min, max, step, onChange }: any) => (
  <div className="space-y-2 py-1">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-foreground/80 min-w-[36px] text-center">{display}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
  </div>
);

const IconBtn = ({ icon: Icon, active, onClick, title }: any) => (
  <button title={title} onClick={onClick}
    className={cn("flex-1 flex items-center justify-center h-7 rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted/60",
      active && "bg-primary/15 text-primary ring-1 ring-primary/30 ring-inset")}>
    <Icon size={13} />
  </button>
);

export function TextPropertiesPanel({ element, onUpdate, product, isAdmin }: TextPropertiesPanelProps) {
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);
    const handleUpdate = (props: Partial<DesignElement>) => onUpdate(element.id, props);

    const handleFillTypeChange = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'image' | 'none') => {
        const newProps: Partial<DesignElement> = { fillType };
        if (fillType === 'stepped-gradient') {
            const steps = element.gradientSteps || 2;
            const stops = element.gradientStops || [];
            const colors = ['#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#000000','#ffffff','#aaaaaa','#555555'];
            newProps.gradientStops = Array.from({ length: steps }, (_, i) => ({
                id: stops[i]?.id || crypto.randomUUID(), color: stops[i]?.color || colors[i % colors.length], position: 0, weight: stops[i]?.weight || 1,
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
        handleUpdate({ gradientSteps: newStops.length, gradientStops: newStops });
    };

    const handleSteppedStopChange = (index: number, props: Partial<GradientStop>) => {
        const newStops = [...(element.gradientStops || [])];
        if (newStops[index]) { newStops[index] = { ...newStops[index], ...props }; handleUpdate({ gradientStops: newStops }); }
    };

    const gradientStops = element.gradientStops?.length
        ? element.gradientStops
        : [{ id: crypto.randomUUID(), color: '#000000', position: 0 }, { id: crypto.randomUUID(), color: '#ffffff', position: 1 }];

    const firstShadow = element.textShadows?.[0];
    const handleShadowChange = (props: Partial<Shadow>) => {
        if (!firstShadow) return;
        const newShadows = [...(element.textShadows || [])];
        newShadows[0] = { ...newShadows[0], ...props };
        handleUpdate({ textShadows: newShadows });
    };
    const toggleShadow = (enabled: boolean) => {
        handleUpdate({ textShadows: enabled ? [{ id: crypto.randomUUID(), offsetX: 2, offsetY: 2, blur: 4, color: '#00000080' }] : [] });
    };

    const warp = element.textWarp || { style: 'none' };
    const handleWarpChange = (props: Partial<TextWarp>) => onUpdate(element.id, { textWarp: { ...(element.textWarp || { style: 'none' }), ...props } });

    const currentFill = element.fillType || 'solid';

    return (
        <div className="space-y-4">
            {/* Text Content */}
            <Textarea value={element.content} className="min-h-[72px] bg-muted/30 border-0 shadow-inner resize-none text-sm focus-visible:ring-1 ring-primary/30"
                onChange={(e) => handleUpdate({ content: e.target.value })} placeholder="Type something..." />

            {/* Typography Block */}
            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                    <Type size={11} className="text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Typography</p>
                </div>
                <Select value={element.fontFamily || 'Inter'} onValueChange={(f) => handleUpdate({ fontFamily: f })}>
                    <SelectTrigger className="w-full bg-muted/40 border-0 h-8 text-xs" style={{ fontFamily: element.fontFamily || 'Inter' }}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[260px]">
                        {GOOGLE_FONTS.map(font => (
                            <SelectItem key={font} value={font} style={{ fontFamily: font, fontSize: '13px' }}>{font}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground/60 pointer-events-none">px</span>
                        <Input type="number" className="pl-7 h-8 bg-muted/40 border-0 text-xs font-mono"
                            value={element.fontSize} onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value, 10) })} />
                    </div>
                    {/* Bold / Italic / Underline */}
                    <div className="flex bg-muted/40 rounded-md p-0.5 gap-0.5">
                        <IconBtn icon={Bold} active={element.fontWeight === 'bold'} title="Bold"
                            onClick={() => handleUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })} />
                        <IconBtn icon={Italic} active={element.fontStyle === 'italic'} title="Italic"
                            onClick={() => handleUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })} />
                        <IconBtn icon={Underline} active={element.textDecoration === 'underline'} title="Underline"
                            onClick={() => handleUpdate({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })} />
                    </div>
                </div>

                {/* Alignment Row */}
                <div className="flex gap-1">
                    <div className="flex flex-1 bg-muted/40 rounded-md p-0.5 gap-0.5">
                        <IconBtn icon={AlignLeft} active={element.textAlign === 'left'} title="Left" onClick={() => handleUpdate({ textAlign: 'left' })} />
                        <IconBtn icon={AlignCenter} active={element.textAlign === 'center'} title="Center" onClick={() => handleUpdate({ textAlign: 'center' })} />
                        <IconBtn icon={AlignRight} active={element.textAlign === 'right'} title="Right" onClick={() => handleUpdate({ textAlign: 'right' })} />
                        <IconBtn icon={AlignJustify} active={element.textAlign === 'justify'} title="Justify" onClick={() => handleUpdate({ textAlign: 'justify' })} />
                    </div>
                    <div className="flex bg-muted/40 rounded-md p-0.5 gap-0.5">
                        <IconBtn icon={AlignVerticalJustifyStart} active={element.verticalAlign === 'top'} title="Align Top" onClick={() => handleUpdate({ verticalAlign: 'top' })} />
                        <IconBtn icon={AlignVerticalJustifyCenter} active={!element.verticalAlign || element.verticalAlign === 'middle'} title="Align Middle" onClick={() => handleUpdate({ verticalAlign: 'middle' })} />
                        <IconBtn icon={AlignVerticalJustifyEnd} active={element.verticalAlign === 'bottom'} title="Align Bottom" onClick={() => handleUpdate({ verticalAlign: 'bottom' })} />
                    </div>
                </div>

                {/* Spacing */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                        <Label className="text-[9px] uppercase text-muted-foreground/60">Letter Spacing</Label>
                        <Input type="number" className="h-7 bg-muted/40 border-0 text-xs font-mono"
                            value={element.letterSpacing} onChange={(e) => handleUpdate({ letterSpacing: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-0.5">
                        <Label className="text-[9px] uppercase text-muted-foreground/60">Line Height</Label>
                        <Input type="number" step={0.1} className="h-7 bg-muted/40 border-0 text-xs font-mono"
                            value={element.lineHeight} onChange={(e) => handleUpdate({ lineHeight: parseFloat(e.target.value) })} />
                    </div>
                </div>

                {/* Transform */}
                <div className="flex bg-muted/40 rounded-md p-0.5 gap-0.5">
                    {[
                        { icon: CaseUpper, value: 'uppercase', title: 'Uppercase' },
                        { icon: CaseLower, value: 'lowercase', title: 'Lowercase' },
                        { label: 'Aa', value: 'capitalize', title: 'Capitalize' },
                        { icon: X, value: 'none', title: 'None' },
                    ].map(({ icon: Icon, label, value, title }) => (
                        <button key={value} title={title} onClick={() => handleUpdate({ textTransform: value as any })}
                            className={cn("flex-1 flex items-center justify-center h-7 rounded-md text-[10px] font-bold transition-all text-muted-foreground hover:bg-muted/60",
                                (!element.textTransform && value === 'none' || element.textTransform === value) && "bg-primary/15 text-primary ring-1 ring-primary/30 ring-inset")}>
                            {Icon ? <Icon size={12} /> : label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* Fill & Stroke Tabs */}
            <Tabs defaultValue="fill" className="w-full">
                <div className="flex items-center gap-1.5 mb-2">
                    <Palette size={11} className="text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Color</p>
                </div>
                <TabsList className="h-7 grid grid-cols-2 bg-muted/60 rounded-lg w-full mb-2">
                    <TabsTrigger value="fill" className="text-[10px] font-semibold h-5 rounded-md data-[state=active]:bg-background">Fill</TabsTrigger>
                    <TabsTrigger value="stroke" className="text-[10px] font-semibold h-5 rounded-md data-[state=active]:bg-background">Stroke</TabsTrigger>
                </TabsList>

                <TabsContent value="fill" className="mt-0 space-y-2">
                    {/* Fill type pills */}
                    <div className="flex gap-1">
                        {[
                            { value: 'solid', label: 'Solid', preview: <div className="w-3 h-3 rounded-sm bg-gray-400 border" /> },
                            { value: 'gradient', label: 'Gradient', preview: <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-400 to-purple-500" /> },
                            { value: 'stepped-gradient', label: 'Stepped', preview: <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-red-500 via-yellow-400 to-green-400" /> },
                            { value: 'image', label: 'Image', preview: <ImageIcon size={9} /> },
                            { value: 'none', label: 'None', preview: <X size={9} /> },
                        ].map(({ value, label, preview }) => (
                            <button key={value} onClick={() => handleFillTypeChange(value as any)}
                                className={cn("flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg border text-[9px] font-semibold transition-all",
                                    currentFill === value ? "bg-primary/10 border-primary/60 text-primary" : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60")}>
                                {preview}{label}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-xl bg-muted/20 border border-border/40 p-2.5">
                        {(currentFill === 'solid' || !element.fillType) && (
                            <ColorPicker label="" color={element.color || '#000000'} onChange={(color) => handleUpdate({ color })} />
                        )}
                        {currentFill === 'gradient' && (
                            <GradientPicker stops={gradientStops} direction={element.gradientDirection || 0}
                                onDirectionChange={(d) => handleUpdate({ gradientDirection: d })}
                                onStopsChange={(s) => handleUpdate({ gradientStops: s })} />
                        )}
                        {currentFill === 'stepped-gradient' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                                    <PropSlider label="Angle" value={element.gradientDirection || 0} display={`${element.gradientDirection || 0}°`} min={0} max={360} step={1} onChange={(v: number) => handleUpdate({ gradientDirection: v })} />
                                    <div className="space-y-1 w-14">
                                        <Label className="text-[9px] uppercase text-muted-foreground/60">Steps</Label>
                                        <Input type="number" className="h-7 text-xs font-mono bg-background border-0" value={element.gradientSteps || 2}
                                            onChange={(e) => handleGradientStepsChange(parseInt(e.target.value))} min={2} max={10} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                    {(element.gradientStops || []).map((stop, i) => (
                                        <div key={stop.id} className="flex items-center gap-2 p-2 bg-background/60 rounded-lg border border-border/40">
                                            <ColorPicker label={`#${i + 1}`} color={stop.color} onChange={(c) => handleSteppedStopChange(i, { color: c })} containerClassName="flex-1 space-y-0" />
                                            <Input type="number" className="h-6 w-12 text-[10px] font-mono bg-muted/40 border-0" value={stop.weight ?? 1}
                                                onChange={(e) => handleSteppedStopChange(i, { weight: parseInt(e.target.value, 10) || 1 })} min={1} />
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => handleGradientStepsChange((element.gradientSteps || 2) + 1)}>+ Add Step</Button>
                            </div>
                        )}
                        {currentFill === 'image' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-muted rounded-md shrink-0 flex items-center justify-center overflow-hidden border border-border/50">
                                        {element.fillImageSrc ? <Image src={element.fillImageSrc} alt="" width={36} height={36} className="object-cover" /> : <ImageIcon size={12} className="text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Input type="text" value={element.fillImageSrc || ''} onChange={(e) => handleUpdate({ fillImageSrc: e.target.value })} placeholder="Image URL..." className="h-7 text-xs bg-muted/40 border-0" />
                                        <Button variant="outline" size="sm" className="h-6 text-[10px] w-full" onClick={() => setIsAssetLibraryOpen(true)}><Library size={9} className="mr-1" /> Browse</Button>
                                    </div>
                                </div>
                                <PropSlider label="Zoom" value={element.fillImageScale || 1} display={`${Math.round((element.fillImageScale || 1) * 100)}%`} min={0.1} max={5} step={0.01} onChange={(v: number) => handleUpdate({ fillImageScale: v })} />
                            </div>
                        )}
                        {currentFill === 'none' && <p className="text-xs text-muted-foreground py-2 text-center">No fill</p>}
                    </div>
                </TabsContent>

                <TabsContent value="stroke" className="mt-0 space-y-2">
                    <div className="rounded-xl bg-muted/20 border border-border/40 p-2.5 space-y-3">
                        <ColorPicker label="Stroke Color" color={element.textStrokeColor || '#000000'} onChange={(c) => handleUpdate({ textStrokeColor: c })} />
                        <PropSlider label="Width" value={element.textStrokeWidth || 0} display={`${element.textStrokeWidth || 0}px`} min={0} max={20} step={0.5} onChange={(v: number) => handleUpdate({ textStrokeWidth: v })} />
                    </div>
                </TabsContent>
            </Tabs>

            <div className="h-px bg-border/40" />

            {/* Effects */}
            <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                    <WandSparkles size={11} className="text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Effects</p>
                </div>

                {/* Shadow */}
                <div className="rounded-xl bg-muted/20 border border-border/40 p-2.5 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Shadow</Label>
                        <Switch checked={!!firstShadow} onCheckedChange={toggleShadow} className="scale-75 origin-right" />
                    </div>
                    {firstShadow && (
                        <div className="space-y-2 pt-2 border-t border-border/40">
                            <ColorPicker label="Color" color={firstShadow.color} onChange={(c) => handleShadowChange({ color: c })} />
                            <div className="grid grid-cols-3 gap-2">
                                <PropSlider label="X" value={firstShadow.offsetX} display={`${firstShadow.offsetX}px`} min={-20} max={20} step={0.5} onChange={(v: number) => handleShadowChange({ offsetX: v })} />
                                <PropSlider label="Y" value={firstShadow.offsetY} display={`${firstShadow.offsetY}px`} min={-20} max={20} step={0.5} onChange={(v: number) => handleShadowChange({ offsetY: v })} />
                                <PropSlider label="Blur" value={firstShadow.blur} display={`${firstShadow.blur}px`} min={0} max={50} step={1} onChange={(v: number) => handleShadowChange({ blur: v })} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Text Warp */}
                <div className="rounded-xl bg-muted/20 border border-border/40 p-2.5 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Warp</Label>
                        <Select value={warp.style} onValueChange={(v) => handleWarpChange({ style: v as any })}>
                            <SelectTrigger className="h-7 w-24 text-xs bg-background border-0"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="circle">Circle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {warp.style === 'circle' && (
                        <div className="space-y-2 pt-2 border-t border-border/40">
                            <PropSlider label="Radius" value={warp.radius || 100} display={`${warp.radius || 100}px`} min={10} max={500} step={1} onChange={(v: number) => handleWarpChange({ radius: v })} />
                            <PropSlider label="Rotation" value={warp.value || 0} display={`${warp.value || 0}°`} min={0} max={360} step={1} onChange={(v: number) => handleWarpChange({ value: v })} />
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Inside Circle</Label>
                                <Switch checked={warp.reverse || false} onCheckedChange={(c) => handleWarpChange({ reverse: c })} className="scale-75 origin-right" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Asset Library Dialog */}
            <Dialog open={isAssetLibraryOpen} onOpenChange={setIsAssetLibraryOpen}>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader><DialogTitle>Image Library</DialogTitle><DialogDescription>Select an image to use as a fill mask.</DialogDescription></DialogHeader>
                    <AssetLibrary onImageSelect={(url) => { handleUpdate({ fillImageSrc: url }); setIsAssetLibraryOpen(false); }} isAdmin={isAdmin} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
