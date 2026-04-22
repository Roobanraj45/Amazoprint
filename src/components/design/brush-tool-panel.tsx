'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { Brush, SprayCan, Square, Cloud, Sparkles, WandSparkles, Move, Zap, Waves, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

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
    const tips = [
        { id: 'round', icon: Cloud, label: 'Soft Round' },
        { id: 'square', icon: Square, label: 'Chisel' },
        { id: 'chalk', icon: Sparkles, label: 'Chalk' },
        { id: 'spraySoft', icon: SprayCan, label: 'Airbrush' },
        { id: 'texture', icon: WandSparkles, label: 'Textured' },
    ];

    const PropertyControl = ({ label, icon: Icon, value, display, min, max, step, field }: any) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                    <Icon size={12} className="text-muted-foreground" />
                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                        {label}
                    </Label>
                </div>
                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded font-bold">
                    {display}
                </span>
            </div>
            <Slider
                value={[value]}
                onValueChange={(v) => setOptions((prev: any) => ({ ...prev, [field]: v[0] }))}
                min={min}
                max={max}
                step={step}
                className="py-1"
            />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="p-4 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-xs uppercase tracking-tighter text-foreground/80">Active Tools</h3>
                        <div className="flex bg-muted rounded-lg p-0.5 border border-border/50">
                            <button
                                onClick={() => setOptions((prev: any) => ({ ...prev, tool: 'brush' }))}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all",
                                    options.tool === 'brush' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Brush
                            </button>
                            <button
                                onClick={() => setOptions((prev: any) => ({ ...prev, tool: 'spray' }))}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all",
                                    options.tool === 'spray' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Spray
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {tips.map((tip) => (
                            <button
                                key={tip.id}
                                onClick={() => setOptions((prev: any) => ({ ...prev, brushTip: tip.id }))}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all",
                                    options.brushTip === tip.id 
                                        ? "border-primary bg-primary/5 text-primary" 
                                        : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                                title={tip.label}
                            >
                                <tip.icon size={18} />
                            </button>
                        ))}
                    </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-5">
                    <PropertyControl 
                        label="Master Size" 
                        icon={Zap} 
                        value={options.size} 
                        display={`${options.size}px`} 
                        min={1} max={300} step={1} 
                        field="size" 
                    />

                    <PropertyControl 
                        label="Edge Hardness" 
                        icon={Waves} 
                        value={options.hardness * 100} 
                        display={`${Math.round(options.hardness * 100)}%`} 
                        min={0} max={100} step={1} 
                        field="hardness" 
                        onChange={(v: number) => setOptions((prev: any) => ({ ...prev, hardness: v / 100 }))}
                    />

                    <PropertyControl 
                        label="Opacity" 
                        icon={Move} 
                        value={options.opacity * 100} 
                        display={`${Math.round(options.opacity * 100)}%`} 
                        min={1} max={100} step={1} 
                        field="opacity" 
                        onChange={(v: number) => setOptions((prev: any) => ({ ...prev, opacity: v / 100 }))}
                    />

                    <PropertyControl 
                        label="Flow Rate" 
                        icon={Activity} 
                        value={options.flow} 
                        display={`${options.flow}x`} 
                        min={1} max={10} step={1} 
                        field="flow" 
                    />
                </div>

                <div className="pt-2">
                   <Accordion type="single" collapsible>
                        <AccordionItem value="dynamics" className="border-none">
                            <AccordionTrigger className="py-2 hover:no-underline">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Advanced Dynamics</span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-5">
                                <PropertyControl 
                                    label="Scatter Amount" 
                                    icon={Zap} 
                                    value={options.scatter} 
                                    display={`${options.scatter}%`} 
                                    min={0} max={100} step={1} 
                                    field="scatter" 
                                />
                                <PropertyControl 
                                    label="Particle Count" 
                                    icon={Waves} 
                                    value={options.density} 
                                    display={options.density} 
                                    min={10} max={300} step={5} 
                                    field="density" 
                                />
                            </AccordionContent>
                        </AccordionItem>
                   </Accordion>
                </div>
            </div>

            <div className="mt-auto p-4 border-t bg-background/80 backdrop-blur-md">
                <ColorPicker
                    label="Stroke Pigment"
                    color={options.color}
                    onChange={(color: string) => setOptions((prev: any) => ({ ...prev, color }))}
                />
            </div>
        </div>
    );
}
