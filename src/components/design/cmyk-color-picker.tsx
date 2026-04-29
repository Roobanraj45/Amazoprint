"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from "@/lib/utils"

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

// --- Sub-Components ---

function CleanNumberInput({ label, value, max, onChange }: any) {
    return (
        <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground font-bold">{label}</Label>
            <Input
                type="text"
                inputMode="numeric"
                value={Math.round(value)}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    onChange(val === '' ? 0 : Math.min(max, parseInt(val)));
                }}
                className="h-7 text-xs px-1 text-center font-mono focus-visible:ring-1"
            />
        </div>
    );
}

export function CMYKColorPicker({ label, color, onChange, containerClassName }: { label?: string, color: string, onChange: (color: string) => void, containerClassName?: string }) {
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

    return (
        <div className={cn("space-y-1", containerClassName)}>
            {label && <Label className="text-[10px] font-bold text-muted-foreground px-1">{label}</Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-full px-2 justify-start shadow-sm">
                        <div
                            className="w-5 h-5 rounded border"
                            style={{
                                backgroundColor: isTransparent ? undefined : color,
                                backgroundImage: isTransparent ? 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%)' : undefined,
                                backgroundSize: '6px 6px'
                            }}
                        />
                        <span className="ml-2 text-xs font-mono">{isTransparent ? 'Transparent' : color}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[280px] p-2 select-none"
                    sideOffset={8}
                    align="start"
                    collisionPadding={10}
                >
                    <div className="space-y-3">
                        {/* SV Canvas */}
                        <div
                            className="relative h-32 w-full rounded-md border shadow-inner"
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
                            <div className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg -translate-x-1/2 translate-y-1/2" style={{ left: `${hsv.s}%`, bottom: `${hsv.v}%` }} />
                        </div>

                        {/* Hue Slider */}
                        <input
                            type="range" min="0" max="360" value={hsv.h}
                            className="w-full h-3 rounded-full appearance-none cursor-pointer border shadow-sm hue-range"
                            style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
                            onChange={(e) => updateHsv(Number(e.target.value), hsv.s, hsv.v)}
                        />

                        <Tabs defaultValue="hex" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-8">
                                <TabsTrigger value="hex" className="text-[10px]">HEX</TabsTrigger>
                                <TabsTrigger value="rgb" className="text-[10px]">RGB</TabsTrigger>
                                <TabsTrigger value="cmyk" className="text-[10px]">CMYK</TabsTrigger>
                            </TabsList>
                            <TabsContent value="hex" className="pt-3">
                                <Input value={workingColor} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs font-mono text-center" />
                            </TabsContent>
                            <TabsContent value="rgb" className="pt-3 grid grid-cols-3 gap-2">
                                <CleanNumberInput label="R" value={rgb.r} max={255} onChange={(v: any) => onChange(rgbToHex(v, rgb.g, rgb.b))} />
                                <CleanNumberInput label="G" value={rgb.g} max={255} onChange={(v: any) => onChange(rgbToHex(rgb.r, v, rgb.b))} />
                                <CleanNumberInput label="B" value={rgb.b} max={255} onChange={(v: any) => onChange(rgbToHex(rgb.r, rgb.g, v))} />
                            </TabsContent>
                            <TabsContent value="cmyk" className="pt-3 grid grid-cols-4 gap-2">
                                <CleanNumberInput label="C" value={cmyk.c} max={100} onChange={(v: any) => { const r = cmykToRgb(v, cmyk.m, cmyk.y, cmyk.k); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                                <CleanNumberInput label="M" value={cmyk.m} max={100} onChange={(v: any) => { const r = cmykToRgb(cmyk.c, v, cmyk.y, cmyk.k); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                                <CleanNumberInput label="Y" value={cmyk.y} max={100} onChange={(v: any) => { const r = cmykToRgb(cmyk.c, cmyk.m, v, cmyk.k); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                                <CleanNumberInput label="K" value={cmyk.k} max={100} onChange={(v: any) => { const r = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, v); onChange(rgbToHex(r.r, r.g, r.b)); }} />
                            </TabsContent>
                        </Tabs>

                        <div className="grid grid-cols-8 gap-1">
                            {palette.map(c => {
                                const isTrans = c === 'transparent';
                                return (
                                    <button
                                        key={c}
                                        className={cn("w-full aspect-square rounded-sm border shadow-sm relative overflow-hidden", (color === c) && "ring-2 ring-primary")}
                                        style={{
                                            backgroundColor: isTrans ? undefined : c,
                                            backgroundImage: isTrans ? 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%)' : undefined,
                                            backgroundSize: '6px 6px'
                                        }}
                                        onClick={() => onChange(c)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <style jsx global>{`
                .hue-range::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; background: white; border: 2px solid #555; border-radius: 50%; }
            `}</style>
        </div>
    );
}
