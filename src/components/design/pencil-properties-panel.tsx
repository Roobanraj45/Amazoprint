
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { DesignElement } from "@/lib/types";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { Brush } from "lucide-react";

type BrushPropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
};

export function PencilPropertiesPanel({ element, onUpdate }: BrushPropertiesPanelProps) {
    const handleUpdate = (props: Partial<DesignElement>) => {
        onUpdate(element.id, props);
    };

    return (
        <AccordionItem value="brush-style" className="border-none">
            <AccordionTrigger className="hover:no-underline py-4 px-4 bg-secondary/20 rounded-xl group">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all">
                        <Brush size={16} />
                    </div>
                    <span className="text-sm font-bold">Brush Style</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-6 pt-4 space-y-3 bg-secondary/10">
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
                     <div className="space-y-2">
                         <Label className="text-xs font-medium">Stroke Cap</Label>
                        <Select value={element.strokeLineCap || 'round'} onValueChange={(v) => handleUpdate({ strokeLineCap: v as any })}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="round">Round</SelectItem>
                                <SelectItem value="butt">Butt</SelectItem>
                                <SelectItem value="square">Square</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
