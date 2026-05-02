"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from "@/lib/utils"

// ---------------- HELPERS ----------------

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const hexToRgb = (hex: string) => {
    let s = hex.replace('#', '')
    if (s.length === 3) s = s.split('').map(c => c + c).join('')
    const res = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s)
    return res ? { r: parseInt(res[1], 16), g: parseInt(res[2], 16), b: parseInt(res[3], 16) } : { r: 255, g: 255, b: 255 }
}

const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map(x => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('')}`

const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
    let h = 0
    if (d !== 0) {
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h /= 6
    }
    return { h: h * 360, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 }
}

const hsvToRgb = (h: number, s: number, v: number) => {
    s /= 100; v /= 100; h /= 360
    let i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
    let r = 0, g = 0, b = 0
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break
        case 1: r = q; g = v; b = p; break
        case 2: r = p; g = v; b = t; break
        case 3: r = p; g = q; b = v; break
        case 4: r = t; g = p; b = v; break
        case 5: r = v; g = p; b = q; break
    }
    return { r: r * 255, g: g * 255, b: b * 255 }
}

const rgbToCmyk = (r: number, g: number, b: number) => {
    const r1 = r / 255, g1 = g / 255, b1 = b / 255
    const k = 1 - Math.max(r1, g1, b1)
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
    return {
        c: Math.round(((1 - r1 - k) / (1 - k)) * 100),
        m: Math.round(((1 - g1 - k) / (1 - k)) * 100),
        y: Math.round(((1 - b1 - k) / (1 - k)) * 100),
        k: Math.round(k * 100),
    }
}

const cmykToRgb = (c: number, m: number, y: number, k: number) => ({
    r: 255 * (1 - c / 100) * (1 - k / 100),
    g: 255 * (1 - m / 100) * (1 - k / 100),
    b: 255 * (1 - y / 100) * (1 - k / 100),
})

// ---------------- INPUT ----------------

function CleanNumberInput({ label, value, max, onChange }: any) {
    const [localVal, setLocalVal] = React.useState(String(value))
    React.useEffect(() => { setLocalVal(String(value)) }, [value])

    return (
        <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground font-bold">{label}</Label>
            <Input
                value={localVal}
                onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    setLocalVal(v)
                    if (v !== '') onChange(clamp(parseInt(v), 0, max))
                }}
                onBlur={() => setLocalVal(String(value))}
                className="h-7 text-xs text-center px-1 font-mono focus-visible:ring-1"
            />
        </div>
    )
}

// ---------------- COMPONENT ----------------

export function CMYKColorPicker({ label, color, cmyk, onChange, containerClassName }: { 
    label?: string; 
    color: string; 
    cmyk?: { c: number; m: number; y: number; k: number } | null;
    onChange: (color: string, cmyk?: { c: number; m: number; y: number; k: number } | null) => void;
    containerClassName?: string;
}) {
    const isTransparent = color === 'transparent' || !color
    const workingColor = isTransparent ? '#ffffff' : color
    const initialRgb = hexToRgb(workingColor)

    // Independent state for each color space to prevent feedback loops
    const [localCmyk, setLocalCmyk] = React.useState(cmyk || rgbToCmyk(initialRgb.r, initialRgb.g, initialRgb.b))
    const [localRgb, setLocalRgb] = React.useState(initialRgb)
    const [localHsv, setLocalHsv] = React.useState(rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b))
    const [localHex, setLocalHex] = React.useState(workingColor)

    // Sync only when external color or cmyk changes
    React.useEffect(() => {
        if (color !== 'transparent' && color !== localHex) {
            const rgb = hexToRgb(color)
            setLocalHex(color)
            setLocalRgb(rgb)
            // If explicit CMYK is provided, use it; otherwise convert from RGB
            setLocalCmyk(cmyk || rgbToCmyk(rgb.r, rgb.g, rgb.b))
            setLocalHsv(rgbToHsv(rgb.r, rgb.g, rgb.b))
        }
    }, [color, cmyk])

    const updateCmyk = (key: string, value: number) => {
        const next = { ...localCmyk, [key]: value }
        setLocalCmyk(next)
        const rgb = cmykToRgb(next.c, next.m, next.y, next.k)
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
        setLocalHex(hex)
        setLocalRgb(rgb)
        onChange(hex, next)
    }

    const updateRgb = (key: string, value: number) => {
        const next = { ...localRgb, [key]: value }
        setLocalRgb(next)
        const hex = rgbToHex(next.r, next.g, next.b)
        const nextCmyk = rgbToCmyk(next.r, next.g, next.b)
        setLocalHex(hex)
        setLocalCmyk(nextCmyk)
        onChange(hex, nextCmyk)
    }

    const updateHsv = (h: number, s: number, v: number) => {
        const rgb = hsvToRgb(h, s, v)
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
        const nextCmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
        setLocalHsv({ h, s, v })
        setLocalHex(hex)
        setLocalRgb(rgb)
        setLocalCmyk(nextCmyk)
        onChange(hex, nextCmyk)
    }

    const palette = [
        '#FFFFFF', '#000000', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7',
        '#F3F4F6', '#9CA3AF', '#6B7280', '#4B5563', '#B91C1C', '#15803D', '#1D4ED8', 'transparent'
    ]

    return (
        <div className={cn("space-y-1", containerClassName)}>
            {label && <Label className="text-[10px] font-bold text-muted-foreground px-1">{label}</Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-full px-2 justify-start shadow-sm hover:border-primary/50 transition-colors">
                        <div className="w-5 h-5 rounded border" style={{ backgroundColor: isTransparent ? undefined : color, backgroundImage: isTransparent ? 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%)' : undefined, backgroundSize: '6px 6px' }} />
                        <span className="ml-2 text-xs font-mono">{isTransparent ? 'Transparent' : color}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-2 select-none shadow-2xl border-white/10" sideOffset={8} align="start">
                    <div className="space-y-3">
                        <div className="relative h-32 w-full rounded-md border shadow-inner cursor-crosshair" style={{ backgroundColor: `hsl(${localHsv.h}, 100%, 50%)` }}
                            onMouseDown={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const move = (mE: any) => {
                                    const s = clamp(((mE.clientX - rect.left) / rect.width) * 100, 0, 100)
                                    const v = clamp((1 - (mE.clientY - rect.top) / rect.height) * 100, 0, 100)
                                    updateHsv(localHsv.h, s, v)
                                }
                                move(e); window.addEventListener('mousemove', move); window.addEventListener('mouseup', () => window.removeEventListener('mousemove', move), { once: true })
                            }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                            <div className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg -translate-x-1/2 translate-y-1/2 pointer-events-none" style={{ left: `${localHsv.s}%`, bottom: `${localHsv.v}%` }} />
                        </div>
                        <input type="range" min="0" max="360" value={localHsv.h} className="w-full h-3 rounded-full appearance-none cursor-pointer border shadow-sm hue-range" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} onChange={(e) => updateHsv(Number(e.target.value), localHsv.s, localHsv.v)} />
                        <Tabs defaultValue="cmyk" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-8 bg-muted/50 p-1">
                                <TabsTrigger value="hex" className="text-[10px] uppercase font-bold">HEX</TabsTrigger>
                                <TabsTrigger value="rgb" className="text-[10px] uppercase font-bold">RGB</TabsTrigger>
                                <TabsTrigger value="cmyk" className="text-[10px] uppercase font-bold">CMYK</TabsTrigger>
                            </TabsList>
                            <TabsContent value="hex" className="pt-3">
                                <Input value={localHex} onChange={(e) => { const val = e.target.value; setLocalHex(val); if (/^#[0-9A-F]{6}$/i.test(val)) { const rgb = hexToRgb(val); updateRgb('r', rgb.r); } }} className="h-9 text-xs font-mono text-center focus-visible:ring-1" />
                            </TabsContent>
                            <TabsContent value="rgb" className="pt-3 grid grid-cols-3 gap-2">
                                <CleanNumberInput label="R" value={localRgb.r} max={255} onChange={(v: number) => updateRgb('r', v)} />
                                <CleanNumberInput label="G" value={localRgb.g} max={255} onChange={(v: number) => updateRgb('g', v)} />
                                <CleanNumberInput label="B" value={localRgb.b} max={255} onChange={(v: number) => updateRgb('b', v)} />
                            </TabsContent>
                            <TabsContent value="cmyk" className="pt-3 grid grid-cols-4 gap-2">
                                <CleanNumberInput label="C" value={localCmyk.c} max={100} onChange={(v: number) => updateCmyk('c', v)} />
                                <CleanNumberInput label="M" value={localCmyk.m} max={100} onChange={(v: number) => updateCmyk('m', v)} />
                                <CleanNumberInput label="Y" value={localCmyk.y} max={100} onChange={(v: number) => updateCmyk('y', v)} />
                                <CleanNumberInput label="K" value={localCmyk.k} max={100} onChange={(v: number) => updateCmyk('k', v)} />
                            </TabsContent>
                        </Tabs>
                        <div className="grid grid-cols-8 gap-1.5 pt-1">
                            {palette.map(c => (
                                <button key={c} className={cn("w-full aspect-square rounded-sm border shadow-sm relative overflow-hidden transition-transform hover:scale-110", (color === c) && "ring-2 ring-primary ring-offset-1")} style={{ backgroundColor: c === 'transparent' ? undefined : c, backgroundImage: c === 'transparent' ? 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%)' : undefined, backgroundSize: '6px 6px' }} onClick={() => onChange(c)} />
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <style jsx global>{` .hue-range::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; background: white; border: 2px solid #555; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); } `}</style>
        </div>
    )
}