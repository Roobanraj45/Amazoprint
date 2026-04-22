'use client';

import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { DesignElement } from "@/lib/types";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";

type BrushPropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
};

export function BrushPropertiesPanel({ element, onUpdate }: BrushPropertiesPanelProps) {
    const handleUpdate = (props: Partial<DesignElement>) => {
        onUpdate(element.id, props);
    };

    return (
        <div className="space-y-3">
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Size</Label>
                        <span className="font-mono">{element.strokeWidth || 5}px</span>
                    </div>
                    <Slider
                        value={[element.strokeWidth || 5]}
                        onValueChange={(v) => handleUpdate({ strokeWidth: v[0] })}
                        min={1}
                        max={200}
                        step={1}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Hardness</Label>
                        <span className="font-mono">{element.brushHardness ?? 100}%</span>
                    </div>
                    <Slider
                        value={[element.brushHardness ?? 100]}
                        onValueChange={(v) => handleUpdate({ brushHardness: v[0] })}
                        min={0}
                        max={100}
                        step={1}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Opacity</Label>
                        <span className="font-mono">{Math.round((element.opacity || 1) * 100)}%</span>
                    </div>
                    <Slider
                        value={[(element.opacity || 1) * 100]}
                        onValueChange={(v) => handleUpdate({ opacity: v[0] / 100 })}
                        min={1}
                        max={100}
                        step={1}
                    />
                </div>

                <div className="pt-2">
                    <ColorPicker
                        label="Brush Color"
                        color={element.strokeColor || '#000000'}
                        onChange={(color) => handleUpdate({ strokeColor: color })}
                    />
                </div>
            </div>
        </div>
    );
}
