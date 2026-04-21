'use client';

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { DesignElement } from "@/lib/types";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";

type BrushPropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
};

export function PencilPropertiesPanel({ element, onUpdate }: BrushPropertiesPanelProps) {
    const handleUpdate = (props: Partial<DesignElement>) => {
        onUpdate(element.id, props);
    };

    return (
        <div className="space-y-3">
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <ColorPicker
                    label="Stroke Color"
                    color={element.strokeColor || '#000000'}
                    onChange={(color) => handleUpdate({ strokeColor: color })}
                />
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <Label className="font-medium">Stroke Width</Label>
                        <span>{element.strokeWidth || 2}px</span>
                    </div>
                    <Slider
                        value={[element.strokeWidth || 2]}
                        onValueChange={(v) => handleUpdate({ strokeWidth: v[0] })}
                        min={1}
                        max={50}
                        step={1}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Brush Style</Label>
                    <Select value={element.brushStyle || 'solid'} onValueChange={(v) => handleUpdate({ brushStyle: v as any })}>
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
