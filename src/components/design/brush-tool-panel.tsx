'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brush, SprayCan, Square, Cloud, Sparkles, WandSparkles } from 'lucide-react';

type BrushToolPanelProps = {
    options: {
        tool: 'brush' | 'spray';
        brushTip: 'round' | 'square' | 'chalk' | 'spraySoft' | 'texture';
        size: number;
        opacity: number;
        density: number;
        scatter: number;
        hardness: number;
        flow: number;
        color: string;
    };
    setOptions: (options: any) => void;
};

export function BrushToolPanel({ options, setOptions }: BrushToolPanelProps) {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">Advanced Brush</h3>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        PS Engine
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Tool</Label>
                        <Select value={options.tool} onValueChange={(v) => setOptions({ ...options, tool: v as any })}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brush"><div className="flex items-center gap-2"><Brush size={12}/> Brush</div></SelectItem>
                                <SelectItem value="spray"><div className="flex items-center gap-2"><SprayCan size={12}/> Spray</div></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Brush Tip</Label>
                        <Select value={options.brushTip} onValueChange={(v) => setOptions({ ...options, brushTip: v as any })}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="round"><div className="flex items-center gap-2"><Cloud size={12}/> Round</div></SelectItem>
                                <SelectItem value="square"><div className="flex items-center gap-2"><Square size={12}/> Square</div></SelectItem>
                                <SelectItem value="chalk"><div className="flex items-center gap-2"><Sparkles size={12}/> Chalk</div></SelectItem>
                                <SelectItem value="spraySoft"><div className="flex items-center gap-2"><Cloud size={12}/> Soft Spray</div></SelectItem>
                                <SelectItem value="texture"><div className="flex items-center gap-2"><WandSparkles size={12}/> Texture</div></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    {/* Size */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Size</Label>
                            <span className="font-mono">{options.size}px</span>
                        </div>
                        <Slider value={[options.size]} onValueChange={(v) => setOptions({ ...options, size: v[0] })} min={1} max={300} step={1} />
                    </div>

                    {/* Opacity */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Opacity</Label>
                            <span className="font-mono">{Math.round(options.opacity * 100)}%</span>
                        </div>
                        <Slider value={[options.opacity * 100]} onValueChange={(v) => setOptions({ ...options, opacity: v[0] / 100 })} min={1} max={100} step={1} />
                    </div>

                    {/* Hardness (only for brush) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Hardness</Label>
                            <span className="font-mono">{Math.round(options.hardness * 100)}%</span>
                        </div>
                        <Slider value={[options.hardness * 100]} onValueChange={(v) => setOptions({ ...options, hardness: v[0] / 100 })} min={0} max={100} step={1} />
                    </div>

                    {/* Density (only for spray) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Density</Label>
                            <span className="font-mono">{options.density}</span>
                        </div>
                        <Slider value={[options.density]} onValueChange={(v) => setOptions({ ...options, density: v[0] })} min={10} max={200} step={1} />
                    </div>

                    {/* Scatter */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Scatter</Label>
                            <span className="font-mono">{options.scatter}%</span>
                        </div>
                        <Slider value={[options.scatter]} onValueChange={(v) => setOptions({ ...options, scatter: v[0] })} min={1} max={100} step={1} />
                    </div>

                    {/* Flow */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Flow</Label>
                            <span className="font-mono">{options.flow}</span>
                        </div>
                        <Slider value={[options.flow]} onValueChange={(v) => setOptions({ ...options, flow: v[0] })} min={1} max={10} step={1} />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t">
                <ColorPicker
                    label="Brush Color"
                    color={options.color}
                    onChange={(color: string) => setOptions({ ...options, color })}
                />
            </div>
        </div>
    );
}
