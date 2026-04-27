'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BrushOptions = {
    brushTip: 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink' | 'spray' | 'airbrush' | 'soft_round' | 'hard_round' | 'glow' | 'eraser';
    size: number;
    flow: number;
    color: string;
    softness: number;
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
        { id: 'spray',       label: 'Classic Spray' },
        { id: 'airbrush',    label: 'Airbrush (Mist)' },
        { id: 'soft_round',  label: 'Soft Round' },
        { id: 'hard_round',  label: 'Hard Round' },
        { id: 'glow',        label: 'Glow Brush' },
        { id: 'eraser',      label: 'Eraser' },
    ];

    const update = (field: keyof BrushOptions, value: any) =>
        setOptions(prev => ({ ...prev, [field]: value }));

    const sprayTips = tips.filter(tip => ['spray', 'airbrush', 'soft_round', 'hard_round', 'glow', 'eraser'].includes(tip.id));
    const brushTips = tips.filter(tip => !['airbrush', 'soft_round', 'hard_round', 'glow', 'eraser'].includes(tip.id));
    const currentTab = ['spray', 'airbrush', 'soft_round', 'hard_round', 'glow', 'eraser'].includes(options.brushTip) ? 'spray' : 'brush';

    const handleTabChange = (value: string) => {
        if (value === 'spray') {
            update('brushTip', 'airbrush'); // Default to airbrush when switching to spray tab
        } else if (currentTab === 'spray') {
            update('brushTip', 'chisel'); // Default back to chisel if coming from spray
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="p-5 space-y-6">

                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="brush" className="text-xs">Brush</TabsTrigger>
                        <TabsTrigger value="spray" className="text-xs">Spray</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="brush" className="space-y-4 mt-0 border-b border-border/40 pb-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brush Tip</Label>
                            <Select value={options.brushTip} onValueChange={(v) => update('brushTip', v)}>
                                <SelectTrigger className="w-full bg-background border-none shadow-sm h-10 text-xs text-left">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {brushTips.map(tip => (
                                        <SelectItem key={tip.id} value={tip.id} className="text-xs">{tip.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>

                    <TabsContent value="spray" className="mt-0 space-y-4 border-b border-border/40 pb-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Spray Mode</Label>
                            <Select value={options.brushTip} onValueChange={(v) => update('brushTip', v)}>
                                <SelectTrigger className="w-full bg-background border-none shadow-sm h-10 text-xs text-left">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sprayTips.map(tip => (
                                        <SelectItem key={tip.id} value={tip.id} className="text-xs">{tip.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Softness</Label>
                                <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">{Math.round(options.softness * 100)}%</span>
                            </div>
                            <Slider value={[options.softness * 100]} onValueChange={v => update('softness', v[0] / 100)} min={20} max={100} step={5} />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Size */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Size</Label>
                        <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">{options.size}px</span>
                    </div>
                    <Slider value={[options.size]} onValueChange={v => update('size', v[0])} min={5} max={500} step={1} />
                </div>

                {/* Flow */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hardness / Flow</Label>
                        <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">{Math.round(options.flow * 100)}%</span>
                    </div>
                    <Slider value={[options.flow * 100]} onValueChange={v => update('flow', v[0] / 100)} min={5} max={200} step={5} />
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
