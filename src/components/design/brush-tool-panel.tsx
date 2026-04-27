'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '../ui/button';

type BrushOptions = {
    brushTip: 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink';
    size: number;
    flow: number;
    color: string;
};

type BrushToolPanelProps = {
    options: BrushOptions;
    setOptions: React.Dispatch<React.SetStateAction<BrushOptions>>;
    onClear: () => void;
};

export function BrushToolPanel({ options, setOptions, onClear }: BrushToolPanelProps) {
    const tips = [
        { id: 'chisel',      label: 'Sharp Chisel (Crisp Edges)' },
        { id: 'dry_bristle', label: 'Dry Bristle (Textured)' },
        { id: 'rake',        label: 'Rake (Multi-Line)' },
        { id: 'charcoal',    label: 'Vine Charcoal (Grainy)' },
        { id: 'ink',         label: 'Flowing Ink (Smooth)' },
    ];

    const update = (field: keyof BrushOptions, value: any) =>
        setOptions(prev => ({ ...prev, [field]: value }));

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="p-5 space-y-6">

                {/* Brush Tip */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Brush Engine</Label>
                    <Select value={options.brushTip} onValueChange={(v) => update('brushTip', v)}>
                        <SelectTrigger className="w-full bg-background border-none shadow-sm h-10 text-xs text-left">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {tips.map(tip => (
                                <SelectItem key={tip.id} value={tip.id} className="text-xs">{tip.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Size */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Size</Label>
                        <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">{options.size}px</span>
                    </div>
                    <Slider value={[options.size]} onValueChange={v => update('size', v[0])} min={5} max={200} step={1} />
                </div>

                {/* Flow */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hardness / Flow</Label>
                        <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">{Math.round(options.flow * 100)}%</span>
                    </div>
                    <Slider value={[options.flow * 100]} onValueChange={v => update('flow', v[0] / 100)} min={5} max={100} step={5} />
                </div>

                {/* Color */}
                <div className="space-y-2">
                    <ColorPicker
                        label="Color"
                        color={options.color}
                        onChange={(color) => update('color', color)}
                    />
                </div>

                {/* Clear */}
                <div className="pt-2 border-t border-border/40">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={onClear}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Canvas
                    </Button>
                </div>
            </div>
        </div>
    );
}
