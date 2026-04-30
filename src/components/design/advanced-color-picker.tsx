"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pipette, Copy, Check, X, GripHorizontal, Palette, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// --- Color Conversion Helpers ---
const hexToRgb = (hex: string) => {
    let s = hex.replace('#', '');
    if (s.length === 3) s = s.split('').map(c => c + c).join('');
    const res = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s);
    return res ? { r: parseInt(res[1], 16), g: parseInt(res[2], 16), b: parseInt(res[3], 16) } : { r: 255, g: 255, b: 255 };
};

const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')}`;

const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }
    return { h: h * 360, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
    s /= 100; v /= 100; h /= 360;
    let i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    let r = 0, g = 0, b = 0;
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
};

const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 1 - (r / 255), m = 1 - (g / 255), y = 1 - (b / 255), k = Math.min(c, m, y);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    return { c: Math.round(((c - k) / (1 - k)) * 100), m: Math.round(((m - k) / (1 - k)) * 100), y: Math.round(((y - k) / (1 - k)) * 100), k: Math.round(k * 100) };
};

const cmykToRgb = (c: number, m: number, y: number, k: number) => {
    const r = 255 * (1 - c / 100) * (1 - k / 100);
    const g = 255 * (1 - m / 100) * (1 - k / 100);
    const b = 255 * (1 - y / 100) * (1 - k / 100);
    return { r, g, b };
};

interface AdvancedColorPickerProps {
    color: string
    onChange: (color: string) => void
    onClose: () => void
    label?: string
}

export function AdvancedColorPicker({ color, onChange, onClose, label }: AdvancedColorPickerProps) {
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);
    const isTransparent = color === 'transparent' || !color;
    const workingColor = isTransparent ? '#ffffff' : color;
    const rgb = hexToRgb(workingColor);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    const palette = [
        '#FFFFFF', '#000000', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7',
        '#F3F4F6', '#9CA3AF', '#6B7280', '#4B5563', '#B91C1C', '#15803D', '#1D4ED8', 'transparent'
    ];

    const updateHsv = (h: number, s: number, v: number) => {
        const next = hsvToRgb(h, s, v);
        onChange(rgbToHex(next.r, next.g, next.b));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(workingColor);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Color copied!", description: `${workingColor} is now in your clipboard.` });
    };

    const handleEyeDropper = async () => {
        if (!('EyeDropper' in window)) {
            toast({ variant: "destructive", title: "EyeDropper not supported", description: "Your browser doesn't support the EyeDropper API." });
            return;
        }
        try {
            // @ts-ignore
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            onChange(result.sRGBHex);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            drag
            dragMomentum={false}
            className="fixed z-[100] w-64 bg-card/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
            style={{ left: 'calc(50% + 200px)', top: '20%' }}
        >
            {/* Header / Drag Handle */}
            <div className="flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing group border-b border-white/5">
                <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-primary/10">
                        <Palette size={12} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground/80">{label || "Color inspector"}</span>
                </div>
                <div className="flex items-center gap-1">
                    <GripHorizontal size={12} className="text-muted-foreground/20 group-hover:text-muted-foreground transition-colors" />
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors" onClick={onClose}>
                        <X size={12} />
                    </Button>
                </div>
            </div>

            <div className="p-3 space-y-3">
                {/* SV Canvas */}
                <div
                    className="relative h-28 w-full rounded-xl border border-white/5 shadow-inner overflow-hidden cursor-crosshair"
                    style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                    onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const move = (mE: MouseEvent) => {
                            const s = Math.min(100, Math.max(0, ((mE.clientX - rect.left) / rect.width) * 100));
                            const v = Math.min(100, Math.max(0, (1 - (mE.clientY - rect.top) / rect.height) * 100));
                            updateHsv(hsv.h, s, v);
                        };
                        move(e.nativeEvent);
                        window.addEventListener('mousemove', move);
                        window.addEventListener('mouseup', () => window.removeEventListener('mousemove', move), { once: true });
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                    <motion.div 
                        className="absolute w-5 h-5 border-2 border-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] -translate-x-1/2 translate-y-1/2 z-10 pointer-events-none" 
                        animate={{ left: `${hsv.s}%`, bottom: `${hsv.v}%` }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="absolute inset-0.5 rounded-full border border-black/20" />
                    </motion.div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Hue Slider */}
                    <div className="flex-1 relative h-2.5 flex items-center">
                        <input
                            type="range" min="0" max="360" value={hsv.h}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer shadow-sm hue-range z-10"
                            style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
                            onChange={(e) => updateHsv(Number(e.target.value), hsv.s, hsv.v)}
                        />
                    </div>
                    
                    {/* Eye Dropper */}
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg shadow-md border border-white/10 active:scale-95 transition-all bg-white/5 hover:bg-white/10"
                        onClick={handleEyeDropper}
                        title="Pick color from screen"
                    >
                        <Pipette size={14} />
                    </Button>
                </div>

                {/* Hex Input & Copy */}
                <div className="flex gap-1.5">
                    <div className="relative flex-1">
                        <Hash size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                        <Input 
                            value={workingColor.replace('#', '')} 
                            onChange={(e) => onChange(`#${e.target.value}`)} 
                            className="h-8 pl-6 pr-2 text-[10px] font-mono rounded-lg bg-white/5 border-white/10 focus-visible:ring-1"
                            placeholder="FFFFFF"
                        />
                    </div>
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg bg-white/5 border border-white/10"
                        onClick={handleCopy}
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </Button>
                </div>

                {/* Palette */}
                <div className="grid grid-cols-8 gap-1 pt-0.5">
                    {palette.map(c => {
                        const isTrans = c === 'transparent';
                        const isActive = color === c;
                        return (
                            <button
                                key={c}
                                className={cn(
                                    "w-full aspect-square rounded-md border border-white/10 shadow-sm relative overflow-hidden transition-all hover:scale-110 active:scale-90", 
                                    isActive && "ring-1 ring-primary ring-offset-1 ring-offset-card"
                                )}
                                style={{
                                    backgroundColor: isTrans ? undefined : c,
                                    backgroundImage: isTrans ? 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%)' : undefined,
                                    backgroundSize: '4px 4px'
                                }}
                                onClick={() => onChange(c)}
                            />
                        );
                    })}
                </div>

                {/* Color Formats Tabs */}
                <Tabs defaultValue="rgb" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-7 bg-white/5 rounded-lg border border-white/10 p-0.5">
                        <TabsTrigger value="rgb" className="text-[9px] font-bold rounded-md h-6">RGB</TabsTrigger>
                        <TabsTrigger value="cmyk" className="text-[9px] font-bold rounded-md h-6">CMYK</TabsTrigger>
                    </TabsList>
                    <TabsContent value="rgb" className="pt-2 grid grid-cols-3 gap-1.5">
                        <NumberField label="R" value={rgb.r} max={255} onChange={(v) => onChange(rgbToHex(v, rgb.g, rgb.b))} />
                        <NumberField label="G" value={rgb.g} max={255} onChange={(v) => onChange(rgbToHex(rgb.r, v, rgb.b))} />
                        <NumberField label="B" value={rgb.b} max={255} onChange={(v) => onChange(rgbToHex(rgb.r, rgb.g, v))} />
                    </TabsContent>
                    <TabsContent value="cmyk" className="pt-2 grid grid-cols-4 gap-1.5">
                        <NumberField label="C" value={cmyk.c} max={100} onChange={(v) => { const r = cmykToRgb(v, cmyk.m, cmyk.y, cmyk.k); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                        <NumberField label="M" value={cmyk.m} max={100} onChange={(v) => { const r = cmykToRgb(cmyk.c, v, cmyk.y, cmyk.k); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                        <NumberField label="Y" value={cmyk.y} max={100} onChange={(v) => { const r = cmykToRgb(cmyk.c, cmyk.m, v, cmyk.k); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                        <NumberField label="K" value={cmyk.k} max={100} onChange={(v) => { const r = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, v); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                    </TabsContent>
                </Tabs>
            </div>

            <style jsx global>{`
                .hue-range::-webkit-slider-thumb { 
                    appearance: none; 
                    width: 16px; 
                    height: 16px; 
                    background: white; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    cursor: pointer;
                }
            `}</style>
        </motion.div>
    );
}

function NumberField({ label, value, max, onChange }: { label: string, value: number, max: number, onChange: (v: number) => void }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">{label}</Label>
            <Input
                type="text"
                inputMode="numeric"
                value={Math.round(value)}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    onChange(val === '' ? 0 : Math.min(max, parseInt(val)));
                }}
                className="h-8 text-xs px-1 text-center font-mono bg-white/5 border-white/5 focus-visible:ring-1 rounded-lg"
            />
        </div>
    );
}
