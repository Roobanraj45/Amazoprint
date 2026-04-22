'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';

type BrushToolPanelProps = {
    options: {
        size: number;
        hardness: number;
        opacity: number;
        color: string;
    };
    setOptions: (options: any) => void;
};

export function BrushToolPanel({ options, setOptions }: BrushToolPanelProps) {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">Brush Settings</h3>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Photoshop Mode
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Size</Label>
                            <span className="font-mono">{options.size}px</span>
                        </div>
                        <Slider
                            value={[options.size]}
                            onValueChange={(v) => setOptions({ ...options, size: v[0] })}
                            min={1}
                            max={200}
                            step={1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Hardness</Label>
                            <span className="font-mono">{options.hardness}%</span>
                        </div>
                        <Slider
                            value={[options.hardness]}
                            onValueChange={(v) => setOptions({ ...options, hardness: v[0] })}
                            min={0}
                            max={100}
                            step={1}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <Label className="font-bold uppercase tracking-widest text-muted-foreground/70">Opacity</Label>
                            <span className="font-mono">{Math.round(options.opacity * 100)}%</span>
                        </div>
                        <Slider
                            value={[options.opacity * 100]}
                            onValueChange={(v) => setOptions({ ...options, opacity: v[0] / 100 })}
                            min={1}
                            max={100}
                            step={1}
                        />
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
