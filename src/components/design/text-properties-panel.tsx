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
    Type, Palette, WandSparkles, UploadCloud, Loader2, Trash2, Settings2
} from "lucide-react";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { GradientPicker } from "./gradient-picker";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AssetLibrary } from "./asset-library";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Edit3 } from "lucide-react";
import { ImageMaskEditor } from "./image-mask-editor";
import { useCustomFonts } from "@/hooks/use-custom-fonts";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground/80 min-w-[40px] text-center">{display}</span>
        </div>
        <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
);

const IconBtn = ({ icon: Icon, active, onClick, title }: any) => (
    <button title={title} onClick={onClick}
        className={cn(
            "flex-1 flex items-center justify-center h-full rounded-md transition-all",
            active
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}>
        <Icon size={16} strokeWidth={active ? 3 : 2} />
    </button>
);

export function TextPropertiesPanel({ element, onUpdate, product, isAdmin }: TextPropertiesPanelProps) {
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);
    const [isImageMaskEditorOpen, setIsImageMaskEditorOpen] = useState(false);
    const handleUpdate = (props: Partial<DesignElement>) => onUpdate(element.id, props);

    const { customFonts, refreshFonts } = useCustomFonts();
    const { toast } = useToast();
    const fontInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingFont, setIsUploadingFont] = useState(false);
    const [isManageFontsOpen, setIsManageFontsOpen] = useState(false);
    const [isDeletingFont, setIsDeletingFont] = useState<string | null>(null);

    const handleFontUpload = async (file: File) => {
        if (!file) return;

        // Prevent duplicate font uploads by name
        const filenameWithExt = file.name;
        const filename = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;
        const fontName = filename.replace(/_/g, ' ');
        if (customFonts.some(f => f.name.toLowerCase() === fontName.toLowerCase())) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'A custom font with this name already exists.' });
            if (fontInputRef.current) fontInputRef.current.value = '';
            return;
        }

        setIsUploadingFont(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'fonts');

        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Upload failed');

            await refreshFonts();
            toast({ title: 'Font Uploaded', description: 'Font has been added to the list.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload Error', description: error instanceof Error ? error.message : 'Could not upload font.' });
        } finally {
            setIsUploadingFont(false);
            if (fontInputRef.current) fontInputRef.current.value = '';
        }
    };

    const handleDeleteFont = async (fontUrl: string) => {
        setIsDeletingFont(fontUrl);
        try {
            const response = await fetch(`/api/upload?url=${encodeURIComponent(fontUrl)}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Failed to delete font');

            await refreshFonts();
            toast({ title: 'Font Deleted', description: 'The custom font has been removed.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Could not delete font.' });
        } finally {
            setIsDeletingFont(null);
        }
    };

    const handleFillTypeChange = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'image' | 'none') => {
        const newProps: Partial<DesignElement> = { fillType };
        if (fillType === 'stepped-gradient') {
            const steps = element.gradientSteps || 2;
            const stops = element.gradientStops || [];
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];
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
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];
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
            <div className="space-y-4 p-3.5 rounded-2xl bg-gradient-to-b from-muted/30 to-muted/10 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/40 mb-1">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 shadow-inner">
                        <Type size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[12px] font-black tracking-tight text-foreground leading-none">Typography</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 leading-none tracking-tight">Font & style settings</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Font Family Selection */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                            <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Font family</Label>
                            <div className="flex gap-1">
                                <input type="file" ref={fontInputRef} className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFontUpload(file);
                                }} />
                                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] text-primary hover:text-primary/80 hover:bg-primary/10" onClick={() => fontInputRef.current?.click()} disabled={isUploadingFont}>
                                    {isUploadingFont ? <Loader2 size={10} className="animate-spin mr-1" /> : <UploadCloud size={10} className="mr-1" />}
                                    Upload
                                </Button>
                                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setIsManageFontsOpen(true)}>
                                    <Settings2 size={10} className="mr-1" />
                                    {isAdmin ? "Manage" : "View List"}
                                </Button>
                            </div>
                        </div>
                        <Select value={element.fontFamily || 'Inter'} onValueChange={(f) => handleUpdate({ fontFamily: f })}>
                            <SelectTrigger className="w-full bg-background border-border/60 h-10 text-sm shadow-sm hover:border-primary/40 transition-colors" style={{ fontFamily: element.fontFamily || 'Inter' }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {customFonts.map(font => (
                                    <SelectItem key={font.name} value={font.name} style={{ fontFamily: font.name, fontSize: '15px' }}>
                                        {font.name} <span className="text-[9px] text-primary/70 ml-1">(Custom)</span>
                                    </SelectItem>
                                ))}
                                {GOOGLE_FONTS.map(font => (
                                    <SelectItem key={font} value={font} style={{ fontFamily: font, fontSize: '15px' }}>{font}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Size</Label>
                            <div className="relative group">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 pointer-events-none group-focus-within:text-primary transition-colors">PX</span>
                                <Input type="number" className="pl-8 h-10 bg-background border-border/60 text-sm font-mono shadow-sm focus-visible:ring-primary/20"
                                    value={element.fontSize} onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value, 10) })} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Format</Label>
                            <div className="flex bg-background border border-border/60 rounded-xl p-1 gap-1 shadow-sm h-10">
                                <IconBtn icon={Bold} active={element.fontWeight === 'bold'} title="Bold"
                                    onClick={() => handleUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })} />
                                <IconBtn icon={Italic} active={element.fontStyle === 'italic'} title="Italic"
                                    onClick={() => handleUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })} />
                                <IconBtn icon={Underline} active={element.textDecoration === 'underline'} title="Underline"
                                    onClick={() => handleUpdate({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })} />
                            </div>
                        </div>
                    </div>

                    {/* Alignment */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Alignment</Label>
                        <div className="flex gap-2">
                            <div className="flex flex-[1.4] bg-background border border-border/60 rounded-xl p-1 gap-1 shadow-sm h-10">
                                <IconBtn icon={AlignLeft} active={element.textAlign === 'left'} title="Left" onClick={() => handleUpdate({ textAlign: 'left' })} />
                                <IconBtn icon={AlignCenter} active={element.textAlign === 'center'} title="Center" onClick={() => handleUpdate({ textAlign: 'center' })} />
                                <IconBtn icon={AlignRight} active={element.textAlign === 'right'} title="Right" onClick={() => handleUpdate({ textAlign: 'right' })} />
                                <IconBtn icon={AlignJustify} active={element.textAlign === 'justify'} title="Justify" onClick={() => handleUpdate({ textAlign: 'justify' })} />
                            </div>
                            <div className="flex flex-1 bg-background border border-border/60 rounded-xl p-1 gap-1 shadow-sm h-10">
                                <IconBtn icon={AlignVerticalJustifyStart} active={element.verticalAlign === 'top'} title="Align Top" onClick={() => handleUpdate({ verticalAlign: 'top' })} />
                                <IconBtn icon={AlignVerticalJustifyCenter} active={!element.verticalAlign || element.verticalAlign === 'middle'} title="Align Middle" onClick={() => handleUpdate({ verticalAlign: 'middle' })} />
                                <IconBtn icon={AlignVerticalJustifyEnd} active={element.verticalAlign === 'bottom'} title="Align Bottom" onClick={() => handleUpdate({ verticalAlign: 'bottom' })} />
                            </div>
                        </div>
                    </div>

                    {/* Spacing */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Letter spacing</Label>
                            <Input type="number" className="h-10 bg-background border-border/60 text-sm font-mono shadow-sm"
                                value={element.letterSpacing} onChange={(e) => handleUpdate({ letterSpacing: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Line height</Label>
                            <Input type="number" step={0.1} className="h-10 bg-background border-border/60 text-sm font-mono shadow-sm"
                                value={element.lineHeight} onChange={(e) => handleUpdate({ lineHeight: parseFloat(e.target.value) })} />
                        </div>
                    </div>

                    {/* Case Transform */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Text case</Label>
                        <div className="flex bg-background border border-border/60 rounded-xl p-1 gap-1 shadow-sm h-10">
                            {[
                                { icon: CaseUpper, value: 'uppercase', title: 'Uppercase', bg: 'hover:bg-orange-500/10 hover:text-orange-600', activeBg: 'bg-orange-500 text-white shadow-orange-200' },
                                { icon: CaseLower, value: 'lowercase', title: 'Lowercase', bg: 'hover:bg-green-500/10 hover:text-green-600', activeBg: 'bg-green-500 text-white shadow-green-200' },
                                { label: 'Aa', value: 'capitalize', title: 'Capitalize', bg: 'hover:bg-blue-500/10 hover:text-blue-600', activeBg: 'bg-blue-500 text-white shadow-blue-200' },
                                { icon: X, value: 'none', title: 'None', bg: 'hover:bg-red-500/10 hover:text-red-600', activeBg: 'bg-red-500 text-white shadow-red-200' },
                            ].map(({ icon: Icon, label, value, title, bg, activeBg }) => (
                                <button key={value} title={title} onClick={() => handleUpdate({ textTransform: value as any })}
                                    className={cn("flex-1 flex items-center justify-center rounded-lg transition-all text-xs font-bold",
                                        (!element.textTransform && value === 'none' || element.textTransform === value)
                                            ? cn("shadow-md", activeBg)
                                            : cn("text-muted-foreground", bg))}>
                                    {Icon ? <Icon size={16} strokeWidth={3} /> : label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* Fill & Stroke Tabs */}
            <div className="space-y-4 p-3.5 rounded-2xl bg-gradient-to-b from-muted/30 to-muted/10 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/40 mb-1">
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 shadow-inner">
                        <Palette size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[12px] font-black tracking-tight text-foreground leading-none">Color & Fill</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 leading-none tracking-tight">Gradient & pattern styles</p>
                    </div>
                </div>

                <Tabs defaultValue="fill" className="w-full">
                    <TabsList className="h-10 grid grid-cols-2 bg-background/50 border border-border/40 rounded-xl p-1 w-full mb-4 shadow-inner">
                        <TabsTrigger value="fill" className="text-[11px] font-bold h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all">Fill</TabsTrigger>
                        <TabsTrigger value="stroke" className="text-[11px] font-bold h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all">Stroke</TabsTrigger>
                    </TabsList>

                    <TabsContent value="fill" className="mt-0 space-y-3">
                        {/* Fill type pills */}
                        <div className="flex gap-1.5 pt-1">
                            {[
                                { value: 'solid', label: 'Solid', preview: <div className="w-4 h-4 rounded-full bg-gray-400 border border-white/20 shadow-sm" />, activeBg: 'bg-gray-500/10 border-gray-500/40 text-gray-700' },
                                { value: 'gradient', label: 'Gradient', preview: <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-sm" />, activeBg: 'bg-blue-500/10 border-blue-500/40 text-blue-700' },
                                { value: 'stepped-gradient', label: 'Stepped', preview: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 shadow-sm" />, activeBg: 'bg-orange-500/10 border-orange-500/40 text-orange-700' },
                                { value: 'image', label: 'Image', preview: <ImageIcon size={14} className="text-indigo-500" />, activeBg: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-700' },
                                { value: 'none', label: 'None', preview: <X size={14} className="text-red-500" />, activeBg: 'bg-red-500/10 border-red-500/40 text-red-700' },
                            ].map(({ value, label, preview, activeBg }) => (
                                <button key={value} onClick={() => handleFillTypeChange(value as any)}
                                    className={cn("flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-bold transition-all shadow-sm",
                                        currentFill === value
                                            ? cn("ring-1 ring-inset", activeBg)
                                            : "bg-background border-border/50 text-muted-foreground hover:bg-muted/30")}>
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
                                                <ColorPicker label={`#${i + 1}`} color={stop.color} onChange={(c) => handleSteppedStopChange(i, { color: c })} containerClassName="flex-1 space-y-0" />
                                                <Input type="number" className="h-7 w-14 text-xs font-mono bg-muted/40 border-0" value={stop.weight ?? 1}
                                                    onChange={(e) => handleSteppedStopChange(i, { weight: parseInt(e.target.value, 10) || 1 })} min={1} />
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full h-8 text-sm" onClick={() => handleGradientStepsChange((element.gradientSteps || 2) + 1)}>+ Add Step</Button>
                                </div>
                            )}
                            {currentFill === 'image' && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-muted rounded-md shrink-0 flex items-center justify-center overflow-hidden border border-border/50">
                                            {element.fillImageSrc ? <Image src={element.fillImageSrc} alt="" width={48} height={48} className="object-cover" /> : <ImageIcon size={16} className="text-muted-foreground" />}
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
                                    <ImageMaskEditor
                                        isOpen={isImageMaskEditorOpen}
                                        onClose={() => setIsImageMaskEditorOpen(false)}
                                        element={element}
                                        product={product}
                                        onUpdate={onUpdate}
                                    />
                                </div>
                            )}
                            {currentFill === 'none' && <p className="text-sm text-muted-foreground py-3 text-center">No fill</p>}
                        </div>
                    </TabsContent>

                    <TabsContent value="stroke" className="mt-0 space-y-2">
                        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 space-y-4">
                            <ColorPicker label="Stroke Color" color={element.textStrokeColor || '#000000'} onChange={(c) => handleUpdate({ textStrokeColor: c })} />
                            <PropSlider label="Width" value={element.textStrokeWidth || 0} display={`${element.textStrokeWidth || 0}px`} min={0} max={20} step={0.5} onChange={(v: number) => handleUpdate({ textStrokeWidth: v })} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="h-px bg-border/40" />

            {/* Effects Block */}
            <div className="space-y-4 p-3.5 rounded-2xl bg-gradient-to-b from-muted/30 to-muted/10 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-border/40 mb-1">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 shadow-inner">
                        <WandSparkles size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[12px] font-black tracking-tight text-foreground leading-none">Effects</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 leading-none tracking-tight">Shadows & warp transformations</p>
                    </div>
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
                <div className="rounded-2xl bg-muted/20 border border-border/40 p-3.5 space-y-3.5 shadow-inner">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-[11px] font-bold text-foreground">Circular warp</Label>
                            <p className="text-[9px] text-muted-foreground font-medium leading-none mt-1">Bend text into a curve</p>
                        </div>
                        <Switch 
                            checked={warp.style === 'circle'} 
                            onCheckedChange={(c) => handleWarpChange({ style: c ? 'circle' : 'none' })} 
                            className="scale-90 origin-right data-[state=checked]:bg-primary" 
                        />
                    </div>
                    {warp.style === 'circle' && (
                        <div className="space-y-4 pt-3.5 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-300">
                            <PropSlider label="Radius" value={warp.radius || 100} display={`${warp.radius || 100}px`} min={10} max={500} step={1} onChange={(v: number) => handleWarpChange({ radius: v })} />
                            <PropSlider label="Rotation" value={warp.value || 0} display={`${warp.value || 0}°`} min={0} max={360} step={1} onChange={(v: number) => handleWarpChange({ value: v })} />
                            <div className="flex items-center justify-between px-1 py-1 bg-background/40 rounded-lg border border-border/40">
                                <Label className="text-[10px] font-bold text-muted-foreground/80">Reverse direction</Label>
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

            {/* Manage Fonts Dialog */}
            <Dialog open={isManageFontsOpen} onOpenChange={setIsManageFontsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Custom Font Library</DialogTitle>
                        <DialogDescription>View all custom fonts available for your designs.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-2">
                            {customFonts.map(font => (
                                <div key={font.name} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/10 group">
                                    <span style={{ fontFamily: font.name }} className="text-sm font-medium">{font.name}</span>
                                    {isAdmin && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteFont(font.url)}
                                            disabled={isDeletingFont === font.url}
                                        >
                                            {isDeletingFont === font.url ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {customFonts.length === 0 && (
                                <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                                    <p className="text-muted-foreground text-sm">No custom fonts uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
