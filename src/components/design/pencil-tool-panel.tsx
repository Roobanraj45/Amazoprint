'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { Button } from '@/components/ui/button';
import { Spline, Minus, SprayCan } from 'lucide-react';
import { cn } from '@/lib/utils';

type BrushToolPanelProps = {
    options: {
        drawMode: 'freehand' | 'straight';
        brushStyle: 'solid' | 'dashed' | 'dotted' | 'spray';
        strokeWidth: number;
        strokeColor: string;
        strokeLineCap: 'butt' | 'round' | 'square';
        sprayDensity: number;
        sprayRadius: number;
    };
    setOptions: (options: BrushToolPanelProps['options']) => void;
};

const ToggleButtonGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-1 p-1 bg-muted rounded-lg border">
            {children}
        </div>
    </div>
);

const ToggleButton = ({
    isActive,
    onClick,
    children,
    title
}: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
}) => (
    <Button
        variant={isActive ? 'selected' : 'ghost'}
        size="icon"
        onClick={onClick}
        title={title}
        className="flex-1 h-10"
    >
        {children}
    </Button>
);

export function PencilToolPanel({ options, setOptions }: BrushToolPanelProps) {
    return (
        <div className="p-4 space-y-6">
            <ToggleButtonGroup label="Draw Mode">
                <ToggleButton
                    isActive={options.drawMode === 'freehand'}
                    onClick={() => setOptions({ ...options, drawMode: 'freehand' })}
                    title="Freestyle"
                >
                    <Spline className="w-5 h-5" />
                </ToggleButton>
                <ToggleButton
                    isActive={options.drawMode === 'straight'}
                    onClick={() => setOptions({ ...options, drawMode: 'straight' })}
                    title="Straight Line"
                >
                    <Minus className="w-5 h-5" />
                </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup label="Brush Style">
                <ToggleButton
                    isActive={options.brushStyle === 'solid'}
                    onClick={() => setOptions({ ...options, brushStyle: 'solid' })}
                    title="Solid"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </ToggleButton>
                <ToggleButton
                    isActive={options.brushStyle === 'dashed'}
                    onClick={() => setOptions({ ...options, brushStyle: 'dashed' })}
                    title="Dashed"
                >
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3"/>
                    </svg>
                </ToggleButton>
                <ToggleButton
                    isActive={options.brushStyle === 'dotted'}
                    onClick={() => setOptions({ ...options, brushStyle: 'dotted' })}
                    title="Dotted"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="3" strokeDasharray="0 5" strokeLinecap="round"/>
                    </svg>
                </ToggleButton>
                 <ToggleButton
                    isActive={options.brushStyle === 'spray'}
                    onClick={() => setOptions({ ...options, brushStyle: 'spray' })}
                    title="Spray"
                >
                    <SprayCan className="w-5 h-5" />
                </ToggleButton>
            </ToggleButtonGroup>

            <ColorPicker
                label="Stroke Color"
                color={options.strokeColor}
                onChange={(color: string) => setOptions({ ...options, strokeColor: color })}
            />
            
            {options.brushStyle === 'spray' ? (
                 <>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <Label>Spray Radius</Label>
                            <span>{options.sprayRadius}px</span>
                        </div>
                        <Slider
                            value={[options.sprayRadius]}
                            onValueChange={(v) => setOptions({ ...options, sprayRadius: v[0] })}
                            min={10}
                            max={100}
                            step={1}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <Label>Spray Intensity</Label>
                            <span>{options.sprayDensity}</span>
                        </div>
                        <Slider
                            value={[options.sprayDensity]}
                            onValueChange={(v) => setOptions({ ...options, sprayDensity: v[0] })}
                            min={1}
                            max={100}
                            step={1}
                        />
                    </div>
                </>
            ) : (
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <Label>Stroke Width</Label>
                        <span>{options.strokeWidth}px</span>
                    </div>
                    <Slider
                        value={[options.strokeWidth]}
                        onValueChange={(v) => setOptions({ ...options, strokeWidth: v[0] })}
                        min={1}
                        max={50}
                        step={1}
                    />
                </div>
            )}
        </div>
    );
}
