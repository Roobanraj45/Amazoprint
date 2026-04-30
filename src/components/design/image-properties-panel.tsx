'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { DesignElement, GradientStop } from "@/lib/types";
import {
  FlipHorizontal,
  FlipVertical,
  Palette,
  SlidersHorizontal,
  Maximize,
  ListFilter,
  X,
  Crop as CropIcon,
} from "lucide-react";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { GradientPicker } from "./gradient-picker";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  element: DesignElement;
  onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
  croppingElementId: string | null;
  setCroppingElementId: (id: string | null) => void;
  maskingElementId: string | null;
  setMaskingElementId: (id: string | null) => void;
  isAdmin?: boolean;
  onOpenColorPicker: (label: string, color: string, onChange: (color: string) => void) => void;
};

const SectionCard = ({ title, icon, children, ...props }: any) => (
  <div {...props} className={cn("p-2 rounded-xl bg-white border border-slate-200 shadow-sm", props.className)}>
    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
      <div className="p-1 rounded-md bg-primary/10 border border-primary/20 text-primary">
        {icon}
      </div>
      {title}
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);


export function ImagePropertiesPanel({ element, onUpdate, croppingElementId, setCroppingElementId, maskingElementId, setMaskingElementId, onOpenColorPicker }: Props) {
  const update = (props: Partial<DesignElement>) =>
    onUpdate(element.id, props);


  const handleFillTypeChange = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'none') => {
    const newProps: Partial<DesignElement> = { fillType };
    if (fillType === 'stepped-gradient') {
        const steps = element.gradientSteps || 2;
        const currentStops = element.gradientStops || [];
        const defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];
        const newStops = Array.from({ length: steps }, (_, i) => ({
            id: currentStops[i]?.id || crypto.randomUUID(),
            color: currentStops[i]?.color || defaultColors[i % defaultColors.length],
            position: 0, 
            weight: currentStops[i]?.weight || 1
        }));
        newProps.gradientStops = newStops;
        newProps.gradientSteps = steps;
        newProps.gradientDirection = 180;
        newProps.gradientType = 'linear';
    }
    update(newProps);
  }

  const handleGradientStepsChange = (steps: number) => {
      const newSteps = Math.max(2, Math.min(10, steps));
      let currentStops = [...(element.gradientStops || [])];
      const defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];

      const newStops = Array.from({ length: newSteps }, (_, i) => ({
          id: currentStops[i]?.id || crypto.randomUUID(),
          color: currentStops[i]?.color || defaultColors[i % defaultColors.length],
          position: 0,
          weight: currentStops[i]?.weight || 1
      }));
      
      update({ gradientSteps: newSteps, gradientStops: newStops });
  }

  const handleSteppedStopChange = (index: number, newProps: Partial<GradientStop>) => {
      const newStops = [...(element.gradientStops || [])];
      if (newStops[index]) {
          newStops[index] = { ...newStops[index], ...newProps };
          update({ gradientStops: newStops });
      }
  }


  const gradientStops =
    element.gradientStops?.length
      ? element.gradientStops
      : [
          { id: crypto.randomUUID(), color: "#000", position: 0 },
          { id: crypto.randomUUID(), color: "#fff", position: 1 },
        ];

  // 🔹 Local state slider for silky smooth dragging
  const SmoothSlider = ({
    value,
    min,
    max,
    step,
    onChange,
  }: any) => {
    const [local, setLocal] = React.useState(value);

    React.useEffect(() => {
        setLocal(value);
    }, [value]);

    return (
      <Slider
        className="py-2"
        value={[local]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => setLocal(v[0])}
        onValueCommit={(v) => onChange(v[0])}
      />
    );
  };

  const PropertyRow = ({
    label,
    value,
    display,
    min,
    max,
    step,
    onChange,
  }: any) => (
    <div className="group space-y-1">
      <div className="flex justify-between items-center px-0.5">
        <Label className="text-[10px] font-bold text-muted-foreground">
          {label}
        </Label>
        <span className="text-[11px] font-mono tabular-nums bg-secondary/80 px-1.5 py-0.5 rounded text-foreground/80 border border-border/50">
          {display}
        </span>
      </div>
      <SmoothSlider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      />
    </div>
  );

  return (
    <div className="space-y-4">
        {/* TRANSFORM SECTION */}
        <SectionCard title="Transform" icon={<Maximize size={12} />} className="p-2">
            <div className="space-y-3">
                    <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                        Flip
                    </Label>

                    <div className="flex gap-2">
                        <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                            "h-9 flex-1 gap-1 rounded-lg transition-all",
                            "hover:bg-muted/60",
                            element.flipHorizontal && "bg-primary/10 text-primary border-primary/30 scale-[0.98]"
                        )}
                        onClick={() => update({ flipHorizontal: !element.flipHorizontal })}
                        >
                        <FlipHorizontal size={14} />
                        <span className="text-xs">Horizontal</span>
                        </Button>

                        <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                            "h-9 flex-1 gap-1 rounded-lg transition-all",
                            "hover:bg-muted/60",
                            element.flipVertical && "bg-primary/10 text-primary border-primary/30 scale-[0.98]"
                        )}
                        onClick={() => update({ flipVertical: !element.flipVertical })}
                        >
                        <FlipVertical size={14} />
                        <span className="text-xs">Vertical</span>
                        </Button>
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                        Object Fit
                    </Label>

                    <Select
                        value={element.objectFit || 'cover'}
                        onValueChange={(v) => update({ objectFit: v as any })}
                    >
                        <SelectTrigger className="h-9 w-full text-xs bg-background border-border/60 rounded-lg focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select fit" />
                        </SelectTrigger>

                        <SelectContent>
                        <SelectItem value="cover">Fill Area</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="fill">Stretch</SelectItem>
                        <SelectItem value="none">Original Size</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>

                    <div className="pt-3 border-t border-border/40 space-y-3">
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button 
                            variant="outline"
                            className="gap-2 h-9 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                            onClick={() => setCroppingElementId(element.id)}
                        >
                            <CropIcon size={14} />
                            Crop
                        </Button>
                        <Button 
                            variant="default"
                            className="gap-2 h-9 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                            onClick={() => setMaskingElementId(element.id)}
                        >
                            <Maximize size={14} />
                            Mask Editor
                        </Button>
                      </div>
                    </div>

                </div>
            </SectionCard>
        
        {/* APPEARANCE SECTION */}
        <SectionCard title="Appearance" icon={<Palette size={12} />} className="p-3">
            <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Overlay Type</Label>
                        <div className="flex gap-1">
                            {[
                                { value: 'solid', label: 'Solid', preview: <div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: element.color || '#3b82f6' }} /> },
                                { value: 'gradient', label: 'Gradient', preview: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm" /> },
                                { value: 'stepped-gradient', label: 'Stepped', preview: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 shadow-sm" /> },
                                { value: 'none', label: 'None', preview: <X size={14} className="text-slate-400" /> },
                            ].map(({ value, label, preview }) => (
                                <button key={value} onClick={() => handleFillTypeChange(value as any)}
                                    className={cn("flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg border text-[9px] font-bold transition-all shadow-sm",
                                        element.fillType === value || (value === 'solid' && !element.fillType)
                                            ? "bg-primary/10 border-primary/50 text-primary"
                                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                    {preview}{label}
                                </button>
                            ))}
                        </div>
                    </div>

                <div className="rounded-lg bg-slate-50/50 p-2 border border-slate-200 shadow-inner">
                    {(!element.fillType || element.fillType === "solid") && (
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 ml-1">Tint color</Label>
                            <Button 
                                variant="outline" 
                                className="h-9 w-full px-3 justify-start rounded-xl border-slate-200 bg-white hover:bg-slate-100 transition-all shadow-sm"
                                onClick={() => onOpenColorPicker("Tint color", element.color || "transparent", (c) => update({ color: c || "" }))}
                            >
                                <div className="w-4 h-4 rounded-md border border-slate-200 shadow-sm mr-3" style={{ backgroundColor: element.color || "transparent" }} />
                                <span className="text-[11px] font-mono leading-none tracking-tight text-slate-700">{element.color || "transparent"}</span>
                            </Button>
                        </div>
                    )}

                    {element.fillType === "gradient" && (
                    <GradientPicker
                        stops={gradientStops}
                        direction={element.gradientDirection || 0}
                        gradientType={element.gradientType || 'linear'}
                        onDirectionChange={(d) => update({ gradientDirection: d })}
                        onTypeChange={(t) => update({ gradientType: t })}
                        onStopsChange={(s) => update({ gradientStops: s })}
                        onOpenColorPicker={onOpenColorPicker}
                    />
                    )}

                    {element.fillType === 'stepped-gradient' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/40">
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                        <Label>Angle</Label>
                                        <span>{element.gradientDirection || 0}°</span>
                                    </div>
                                    <Slider value={[element.gradientDirection || 0]} onValueChange={v => update({gradientDirection: v[0]})} max={360} step={1} />
                                </div>
                                <div className="w-px h-10 bg-border/60" />
                                <div className="w-16 space-y-1">
                                    <Label className="text-[10px] font-bold text-muted-foreground">Steps</Label>
                                    <Input
                                        type="number"
                                        className="h-8 text-xs font-mono bg-background border-none"
                                        value={element.gradientSteps || 2}
                                        onChange={e => handleGradientStepsChange(parseInt(e.target.value))}
                                        min={2} max={10}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 mb-2">
                                    <ListFilter size={12} />
                                    Color Steps
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(element.gradientStops || []).map((stop, index) => (
                                        <div key={stop.id} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex gap-3 items-end">
                                                <div className="flex-1 space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-muted-foreground/60 ml-1">Step {index + 1}</Label>
                                                    <Button 
                                                        variant="outline" 
                                                        className="h-8 w-full px-2 justify-start rounded-lg border-slate-200 bg-white hover:bg-slate-100 transition-all shadow-sm"
                                                        onClick={() => onOpenColorPicker(`Step ${index + 1} color`, stop.color, (color) => handleSteppedStopChange(index, { color }))}
                                                    >
                                                        <div className="w-4 h-4 rounded-sm border border-slate-200 shadow-sm mr-2" style={{ backgroundColor: stop.color }} />
                                                        <span className="text-[10px] font-mono text-slate-700">{stop.color}</span>
                                                    </Button>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-center px-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ratio</Label>
                                                        <span className="text-[11px] font-mono font-bold text-primary">{(stop.weight ?? 1).toFixed(1)}</span>
                                                    </div>
                                                    <Slider value={[stop.weight ?? 1]} onValueChange={(v) => handleSteppedStopChange(index, { weight: v[0] })} min={1} max={10} step={0.1} className="py-1" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleGradientStepsChange((element.gradientSteps || 2) + 1)} className="w-full mt-2">Add Step</Button>
                            </div>
                        </div>
                    )}
                </div>

                <PropertyRow
                    label="Tint Strength"
                    value={element.tintOpacity || 0}
                    display={`${Math.round((element.tintOpacity || 0) * 100)}%`}
                    min={0}
                    max={1}
                    onChange={(v: number) => update({ tintOpacity: v })}
                />
                </div>
            </SectionCard>

        {/* ADJUSTMENTS SECTION */}
        <SectionCard title="Adjustments" icon={<SlidersHorizontal size={12} />} className="p-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                  <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="pt-4 space-y-4">
                  <PropertyRow label="Brightness" value={element.filterBrightness || 1} display={`${Math.round(((element.filterBrightness || 1) - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => update({ filterBrightness: v })} />
                  <PropertyRow label="Contrast" value={element.filterContrast || 1} display={`${Math.round(((element.filterContrast || 1) - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => update({ filterContrast: v })} />
                  <PropertyRow label="Saturation" value={element.filterSaturate || 1} display={`${Math.round(((element.filterSaturate || 1) - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => update({ filterSaturate: v })} />
              </TabsContent>
              <TabsContent value="effects" className="pt-4 space-y-4">
                  <PropertyRow label="Grayscale" value={element.filterGrayscale || 0} display={`${Math.round((element.filterGrayscale || 0) * 100)}%`} min={0} max={1} step={0.05} onChange={(v: number) => update({ filterGrayscale: v })} />
                  <PropertyRow label="Sepia" value={element.filterSepia || 0} display={`${Math.round((element.filterSepia || 0) * 100)}%`} min={0} max={1} step={0.05} onChange={(v: number) => update({ filterSepia: v })} />
                  <PropertyRow label="Invert Colors" value={element.filterInvert || 0} display={`${Math.round((element.filterInvert || 0) * 100)}%`} min={0} max={1} step={0.05} onChange={(v: number) => update({ filterInvert: v })} />
              </TabsContent>
               <TabsContent value="advanced" className="pt-4 space-y-4">
                  <PropertyRow label="Blur" value={element.filterBlur || 0} display={`${element.filterBlur || 0}px`} min={0} max={20} step={1} onChange={(v: number) => update({ filterBlur: v })}/>
                  <PropertyRow label="Hue Rotate" value={element.filterHueRotate || 0} display={`${element.filterHueRotate || 0}°`} min={0} max={360} step={1} onChange={(v: number) => update({ filterHueRotate: v })} />
              </TabsContent>
            </Tabs>
            </SectionCard>
    </div>
  );
}
