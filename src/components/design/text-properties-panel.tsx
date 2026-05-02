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
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Edit3 } from "lucide-react";
import { useCustomFonts } from "@/hooks/use-custom-fonts";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

type TextPropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    product: Product;
    isAdmin?: boolean;
    onOpenColorPicker: (label: string, color: string, onChange: (color: string, cmyk?: { c: number, m: number, y: number, k: number } | null) => void, cmyk?: { c: number, m: number, y: number, k: number } | null) => void;
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

const SectionCard = ({ title, icon, children, ...props }: any) => (
    <div {...props} className={cn("p-2 rounded-xl bg-white border border-slate-200 shadow-sm", props.className)}>
        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="p-1 rounded-md bg-primary/10 border border-primary/20 text-primary">
                {icon}
            </div>
            {title}
        </div>
        <div className="space-y-2">{children}</div>
    </div>
);

export function TextPropertiesPanel({ element, onUpdate, product, isAdmin, onOpenColorPicker }: TextPropertiesPanelProps) {
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
            const newStops = Array.from({ length: steps }, (_, i) => ({
                id: stops[i]?.id || crypto.randomUUID(), color: stops[i]?.color || colors[i % colors.length], position: 0, weight: stops[i]?.weight || 1,
            }));
            newProps.gradientStops = newStops;
            newProps.gradientSteps = steps;
            newProps.gradientDirection = 180;
            newProps.gradientType = 'linear';
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
        <div className="space-y-2 px-1 pb-6 h-full overflow-y-auto custom-scrollbar bg-slate-50/30">
            {/* Content Section */}
            <SectionCard title="Content" icon={<Type size={12} />} className="p-1.5">
                <Textarea 
                    value={element.content} 
                    className="min-h-[60px] bg-white border-slate-200 rounded-lg shadow-sm resize-none text-xs focus-visible:ring-1 ring-primary/30"
                    onChange={(e) => handleUpdate({ content: e.target.value })} 
                    placeholder="Type something..." 
                />
            </SectionCard>

            {/* Typography Section */}
            <SectionCard title="Typography" icon={<Type size={12} />} className="p-1.5">
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Font family</Label>
                            <div className="flex gap-1">
                                <input type="file" ref={fontInputRef} className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFontUpload(file);
                                }} />
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] font-bold text-primary hover:bg-primary/5" onClick={() => setIsManageFontsOpen(true)}>
                                    <Settings2 size={10} className="mr-1" /> Manage
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] font-bold text-primary hover:bg-primary/5" onClick={() => fontInputRef.current?.click()}>
                                    <UploadCloud size={10} className="mr-1" /> Add
                                </Button>
                            </div>
                        </div>
                        <Select value={element.fontFamily || 'Inter'} onValueChange={(f) => handleUpdate({ fontFamily: f })}>
                            <SelectTrigger className="h-9 w-full text-xs bg-white border-slate-200 rounded-lg">
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
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Size</Label>
                            <div className="relative group">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors">PX</span>
                                <Input type="number" className="pl-7 h-9 bg-white border-slate-200 text-xs font-mono rounded-xl shadow-sm"
                                    value={element.fontSize} onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value, 10) })} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Format</Label>
                            <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5 h-9 shadow-sm">
                                <IconBtn icon={Bold} active={element.fontWeight === 'bold'} title="Bold"
                                    onClick={() => handleUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })} />
                                <IconBtn icon={Italic} active={element.fontStyle === 'italic'} title="Italic"
                                    onClick={() => handleUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })} />
                                <IconBtn icon={Underline} active={element.textDecoration === 'underline'} title="Underline"
                                    onClick={() => handleUpdate({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Alignment</Label>
                        <div className="flex gap-2">
                            <div className="flex flex-[1.4] bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5 h-9 shadow-sm">
                                <IconBtn icon={AlignLeft} active={element.textAlign === 'left'} title="Left" onClick={() => handleUpdate({ textAlign: 'left' })} />
                                <IconBtn icon={AlignCenter} active={element.textAlign === 'center'} title="Center" onClick={() => handleUpdate({ textAlign: 'center' })} />
                                <IconBtn icon={AlignRight} active={element.textAlign === 'right'} title="Right" onClick={() => handleUpdate({ textAlign: 'right' })} />
                                <IconBtn icon={AlignJustify} active={element.textAlign === 'justify'} title="Justify" onClick={() => handleUpdate({ textAlign: 'justify' })} />
                            </div>
                            <div className="flex flex-1 bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5 h-9 shadow-sm">
                                <IconBtn icon={AlignVerticalJustifyStart} active={element.verticalAlign === 'top'} title="Align Top" onClick={() => handleUpdate({ verticalAlign: 'top' })} />
                                <IconBtn icon={AlignVerticalJustifyCenter} active={!element.verticalAlign || element.verticalAlign === 'middle'} title="Align Middle" onClick={() => handleUpdate({ verticalAlign: 'middle' })} />
                                <IconBtn icon={AlignVerticalJustifyEnd} active={element.verticalAlign === 'bottom'} title="Align Bottom" onClick={() => handleUpdate({ verticalAlign: 'bottom' })} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Letter spacing</Label>
                            <Input type="number" className="h-9 bg-white border-slate-200 text-xs font-mono rounded-xl shadow-sm"
                                value={element.letterSpacing} onChange={(e) => handleUpdate({ letterSpacing: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Line height</Label>
                            <Input type="number" step={0.1} className="h-9 bg-white border-slate-200 text-xs font-mono rounded-xl shadow-sm"
                                value={element.lineHeight} onChange={(e) => handleUpdate({ lineHeight: parseFloat(e.target.value) })} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Text case</Label>
                        <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5 h-9 shadow-sm">
                            {[
                                { icon: CaseUpper, value: 'uppercase', title: 'Uppercase', bg: 'hover:bg-primary/5', activeBg: 'bg-primary text-white' },
                                { icon: CaseLower, value: 'lowercase', title: 'Lowercase', bg: 'hover:bg-primary/5', activeBg: 'bg-primary text-white' },
                                { label: 'Aa', value: 'capitalize', title: 'Capitalize', bg: 'hover:bg-primary/5', activeBg: 'bg-primary text-white' },
                                { icon: X, value: 'none', title: 'None', bg: 'hover:bg-red-50 hover:text-red-600', activeBg: 'bg-red-500 text-white' },
                            ].map(({ icon: Icon, label, value, title, bg, activeBg }) => (
                                <button key={value} title={title} onClick={() => handleUpdate({ textTransform: value as any })}
                                    className={cn("flex-1 flex items-center justify-center rounded-lg transition-all text-[11px] font-bold",
                                        (!element.textTransform && value === 'none' || element.textTransform === value)
                                            ? activeBg
                                            : cn("text-slate-500", bg))}>
                                    {Icon ? <Icon size={14} /> : label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionCard>

            <div className="h-px bg-slate-200/50 mx-2" />

            {/* Color & Fill Section */}
            <SectionCard title="Color & Fill" icon={<Palette size={12} />} className="p-1.5">
                <Tabs defaultValue="fill" className="w-full">
                    <TabsList className="h-9 grid grid-cols-2 bg-slate-50 border border-slate-200 rounded-lg p-1 w-full mb-3 shadow-inner">
                        <TabsTrigger value="fill" className="text-[11px] font-bold h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Fill</TabsTrigger>
                        <TabsTrigger value="stroke" className="text-[11px] font-bold h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Stroke</TabsTrigger>
                    </TabsList>

                    <TabsContent value="fill" className="mt-0 space-y-3">
                        <div className="flex gap-1.5 pt-1">
                            {[
                                { value: 'solid', label: 'Solid', preview: <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-white/20" /> },
                                { value: 'gradient', label: 'Gradient', preview: <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" /> },
                                { value: 'stepped-gradient', label: 'Stepped', preview: <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400" /> },
                                { value: 'none', label: 'None', preview: <X size={12} className="text-red-500" /> },
                            ].map(({ value, label, preview }) => (
                                <button key={value} onClick={() => handleFillTypeChange(value as any)}
                                    className={cn("flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg border text-[9px] font-bold transition-all shadow-sm",
                                        currentFill === value
                                            ? "bg-primary/10 border-primary/40 text-primary"
                                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                    {preview}{label}
                                </button>
                            ))}
                        </div>

                        <div className="rounded-xl bg-slate-50/50 border border-slate-200 p-2 shadow-inner">
                            {(currentFill === 'solid' || !element.fillType) && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Text color</Label>
                                    <Button variant="outline" className="h-9 w-full px-2 justify-start rounded-lg border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
                                        onClick={() => onOpenColorPicker("Text color", element.color || "#000000", (color, cmyk) => handleUpdate({ color, cmyk }), element.cmyk)}>
                                        <div className="w-4 h-4 rounded-md border border-slate-200 shadow-sm mr-2" style={{ backgroundColor: element.color || "#000000" }} />
                                        <span className="text-[10px] font-mono text-slate-700">{element.color || "#000000"}</span>
                                    </Button>
                                </div>
                            )}
                            {currentFill === 'gradient' && (
                                <GradientPicker stops={gradientStops} direction={element.gradientDirection || 0} gradientType={element.gradientType || 'linear'}
                                    onDirectionChange={(d) => handleUpdate({ gradientDirection: d })} onTypeChange={(t) => handleUpdate({ gradientType: t })}
                                    onStopsChange={(s) => handleUpdate({ gradientStops: s })} onOpenColorPicker={onOpenColorPicker} />
                            )}
                            {currentFill === 'stepped-gradient' && (
                                <div className="space-y-3 pt-1">
                                    <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                                        <PropSlider label="Angle" value={element.gradientDirection || 0} display={`${element.gradientDirection || 0}°`} min={0} max={360} step={1} onChange={(v: number) => handleUpdate({ gradientDirection: v })} />
                                        <div className="space-y-1 w-14">
                                            <Label className="text-[9px] uppercase font-bold text-slate-500">Steps</Label>
                                            <Input type="number" className="h-8 text-xs font-mono bg-white border-slate-200" value={element.gradientSteps || 2}
                                                onChange={(e) => handleGradientStepsChange(parseInt(e.target.value))} min={2} max={10} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                        {(element.gradientStops || []).map((stop, i) => (
                                            <div key={stop.id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-primary/20">
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-[9px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Step {i + 1}</Label>
                                                    <Button variant="outline" className="h-8 w-full px-2 justify-start rounded-lg border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all shadow-sm"
                                                        onClick={() => onOpenColorPicker(`Step ${i + 1} color`, stop.color, (c, cmyk) => handleSteppedStopChange(i, { color: c, cmyk }))}>
                                                        <div className="w-3.5 h-3.5 rounded-sm border border-slate-200 shadow-sm mr-2" style={{ backgroundColor: stop.color }} />
                                                        <span className="text-[10px] font-mono text-slate-700">{stop.color}</span>
                                                    </Button>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-center px-1">
                                                        <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ratio</Label>
                                                        <span className="text-[10px] font-mono font-bold text-primary">{(stop.weight ?? 1).toFixed(1)}</span>
                                                    </div>
                                                    <Slider value={[stop.weight ?? 1]} onValueChange={(v) => handleSteppedStopChange(i, { weight: v[0] })} min={1} max={10} step={0.1} className="py-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="ghost" size="sm" className="w-full h-8 text-[11px] font-bold text-primary hover:bg-primary/5" onClick={() => handleGradientStepsChange((element.gradientSteps || 2) + 1)}>+ Add Step</Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="stroke" className="mt-0 space-y-3">
                        <div className="rounded-xl bg-slate-50/50 border border-slate-200 p-3 space-y-4 shadow-inner">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Stroke color</Label>
                                <Button variant="outline" className="h-9 w-full px-2 justify-start rounded-lg border-slate-200 bg-white hover:bg-slate-100 transition-all shadow-sm"
                                    onClick={() => onOpenColorPicker("Stroke color", element.textStrokeColor || "#000000", (c, cmyk) => handleUpdate({ textStrokeColor: c, textStrokeCmyk: cmyk }), element.textStrokeCmyk)}>
                                    <div className="w-4 h-4 rounded-md border border-slate-200 shadow-sm mr-2" style={{ backgroundColor: element.textStrokeColor || "#000000" }} />
                                    <span className="text-[10px] font-mono text-slate-700">{element.textStrokeColor || "#000000"}</span>
                                </Button>
                            </div>
                            <PropSlider label="Width" value={element.textStrokeWidth || 0} display={`${element.textStrokeWidth || 0}px`} min={0} max={20} step={0.5} onChange={(v: number) => handleUpdate({ textStrokeWidth: v })} />
                        </div>
                    </TabsContent>
                </Tabs>
            </SectionCard>

            <div className="h-px bg-slate-200/50 mx-2" />

            {/* Effects Section */}
            <SectionCard title="Effects" icon={<WandSparkles size={12} />} className="p-1.5">
                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shadow</Label>
                            <Switch checked={element.textShadows?.length > 0} onCheckedChange={toggleShadow} className="scale-75 origin-right" />
                        </div>
                        {element.textShadows && element.textShadows.length > 0 && (
                            <div className="rounded-xl bg-slate-50/50 border border-slate-200 p-3 space-y-4 shadow-inner">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Shadow color</Label>
                                    <Button variant="outline" className="h-9 w-full px-2 justify-start rounded-lg border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
                                        onClick={() => onOpenColorPicker("Shadow color", firstShadow?.color || "#00000080", (c, cmyk) => handleShadowChange({ color: c, cmyk }), firstShadow?.cmyk)}>
                                        <div className="w-4 h-4 rounded-md border border-slate-200 shadow-sm mr-2" style={{ backgroundColor: firstShadow?.color || "#00000080" }} />
                                        <span className="text-[10px] font-mono text-slate-700">{firstShadow?.color || "#00000080"}</span>
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <PropSlider label="Offset X" value={firstShadow?.offsetX || 0} display={`${firstShadow?.offsetX || 0}px`} min={-20} max={20} step={1} onChange={(v: number) => handleShadowChange({ offsetX: v })} />
                                    <PropSlider label="Offset Y" value={firstShadow?.offsetY || 0} display={`${firstShadow?.offsetY || 0}px`} min={-20} max={20} step={1} onChange={(v: number) => handleShadowChange({ offsetY: v })} />
                                </div>
                                <PropSlider label="Blur" value={firstShadow?.blur || 0} display={`${firstShadow?.blur || 0}px`} min={0} max={30} step={1} onChange={(v: number) => handleShadowChange({ blur: v })} />
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Warp Style</Label>
                        <Select value={warp.style || 'none'} onValueChange={(v) => handleWarpChange({ style: v as any })}>
                            <SelectTrigger className="h-9 w-full text-xs bg-white border-slate-200 rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="arc">Arc</SelectItem>
                                <SelectItem value="arch">Arch</SelectItem>
                                <SelectItem value="flag">Flag</SelectItem>
                                <SelectItem value="wave">Wave</SelectItem>
                                <SelectItem value="rise">Rise</SelectItem>
                                <SelectItem value="circle">Circle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {warp.style !== 'none' && warp.style !== 'circle' && (
                        <div className="rounded-xl bg-slate-50/50 border border-slate-200 p-3 space-y-4 shadow-inner">
                            <PropSlider label="Bend" value={warp.bend || 50} display={`${warp.bend || 0}%`} min={-100} max={100} step={1} onChange={(v: number) => handleWarpChange({ bend: v })} />
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reverse</Label>
                                <Switch checked={warp.reverse || false} onCheckedChange={(c) => handleWarpChange({ reverse: c })} className="scale-75 origin-right" />
                            </div>
                        </div>
                    )}

                    {warp.style === 'circle' && (
                        <div className="rounded-xl bg-slate-50/50 border border-slate-200 p-3 space-y-4 shadow-inner">
                            <PropSlider label="Radius" value={warp.radius || 100} display={`${warp.radius || 100}px`} min={10} max={500} step={1} onChange={(v: number) => handleWarpChange({ radius: v })} />
                            <PropSlider label="Rotation" value={warp.value || 0} display={`${warp.value || 0}°`} min={0} max={360} step={1} onChange={(v: number) => handleWarpChange({ value: v })} />
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reverse</Label>
                                <Switch checked={warp.reverse || false} onCheckedChange={(c) => handleWarpChange({ reverse: c })} className="scale-75 origin-right" />
                            </div>
                        </div>
                    )}
                </div>
            </SectionCard>


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
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteFont(font.url)} disabled={isDeletingFont === font.url}>
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
