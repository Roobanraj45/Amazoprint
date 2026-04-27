'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { 
    Cloud, 
    Square, 
    Wind, 
    Zap, 
    Activity, 
    Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '../ui/button';

type BrushToolPanelProps = {
    options: {
        tip: 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink';
        size: number;
        flow: number;
        color: string;
    };
    setOptions: React.Dispatch<React.SetStateAction<{
        tip: 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink';
        size: number;
        flow: number;
        color: string;
    }>>;
    onClear: () => void;
};

export function BrushToolPanel({ options, setOptions, onClear }: BrushToolPanelProps) {
    const tips = [
        { id: 'chisel', label: 'Sharp Chisel (Crisp Edges)' },
        { id: 'dry_bristle', label: 'Dry Bristle (Textured)' },
        { id: 'rake', label: 'Rake (Multi-Line)' },
        { id: 'charcoal', label: 'Vine Charcoal (Grainy)' },
        { id: 'ink', label: 'Flowing Ink (Smooth)' },
    ];

    const updateOption = (field: string, value: any) => {
        setOptions(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="p-5 space-y-8">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Brush Engine</Label>
                    <Select value={options.tip} onValueChange={(v) => updateOption('tip', v)}>
                        <SelectTrigger className="w-full bg-background border-none shadow-sm h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {tips.map(tip => (
                                <SelectItem key={tip.id} value={tip.id}>{tip.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Activity size={14} />
                                <Label className="text-[10px] font-black uppercase tracking-widest">Size</Label>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">{options.size}px</span>
                        </div>
                        <Slider
                            value={[options.size]}
                            onValueChange={(v) => updateOption('size', v[0])}
                            min={5}
                            max={200}
                            step={1}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Wind size={14} />
                                <Label className="text-[10px] font-black uppercase tracking-widest">Hardness / Flow</Label>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">{Math.round(options.flow * 100)}%</span>
                        </div>
                        <Slider
                            value={[options.flow]}
                            onValueChange={(v) => updateOption('flow', v[0])}
                            min={0.05}
                            max={1}
                            step={0.05}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <ColorPicker
                        label="Stroke Pigment"
                        color={options.color}
                        onChange={(color) => updateOption('color', color)}
                    />
                </div>

                <div className="pt-4 border-t border-border/40">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={onClear}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Drawing Layer
                    </Button>
                </div>
            </div>
            
            <div className="mt-auto p-5 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                    Strokes are committed as image layers upon release.
                </p>
            </div>
        </div>
    );
}