
'use client';

import React from "react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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
  Image as ImageIcon,
  Palette,
  SlidersHorizontal,
  Move,
  Maximize,
  Sparkles,
  ListFilter,
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
  isAdmin?: boolean;
};

const SectionCard = ({ title, icon, children, ...props }: any) => (
  <div {...props}>
    <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-foreground">
      <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
        {icon}
      </div>
      {title}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);


export function ImagePropertiesPanel({ element, onUpdate, croppingElementId, setCroppingElementId }: Props) {
  const isCropping = croppingElementId === element.id;

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
        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
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
    <AccordionItem value="image-style" className="border-none">
      <AccordionTrigger className="hover:no-underline py-4 px-4 bg-secondary/20 rounded-t-xl group">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all">
            <ImageIcon size={16} />
          </div>
          <span className="text-sm font-bold">Image Properties</span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-6 space-y-4 pt-2 bg-secondary/10">
        
       {/* TRANSFORM SECTION */}
        <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm">
            <SectionCard title="Transform" icon={<Maximize size={14} />}>
                <div className="space-y-4">
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
                        value={element.objectFit}
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

                    <div className="pt-4 border-t border-border/40 space-y-4">
                      <Button 
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setCroppingElementId(element.id)}
                      >
                        <CropIcon size={14} />
                        Crop Image
                      </Button>
                    </div>

                </div>
            </SectionCard>
        </div>
        
        {/* APPEARANCE SECTION */}
        <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm">
            <SectionCard title="Appearance" icon={<Palette size={12} />}>
                <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs text-muted-foreground font-medium">Overlay Type</Label>
                    <Select
                    value={element.fillType || "solid"}
                    onValueChange={(v) => handleFillTypeChange(v as any)}
                    >
                    <SelectTrigger className="h-9 w-32 text-xs bg-background/50 border-border/50">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="stepped-gradient">Stepped</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                <div className="rounded-lg bg-secondary/30 p-2 border border-border/40">
                    {(!element.fillType || element.fillType === "solid") && (
                    <ColorPicker
                        label=""
                        color={element.color}
                        onChange={(c) => update({ color: c || "" })}
                    />
                    )}

                    {element.fillType === "gradient" && (
                    <GradientPicker
                        stops={gradientStops}
                        direction={element.gradientDirection || 0}
                        onDirectionChange={(d) => update({ gradientDirection: d })}
                        onStopsChange={(s) => update({ gradientStops: s })}
                    />
                    )}

                    {element.fillType === 'stepped-gradient' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/40">
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                        <Label>Angle</Label>
                                        <span>{element.gradientDirection || 0}°</span>
                                    </div>
                                    <Slider value={[element.gradientDirection || 0]} onValueChange={v => update({gradientDirection: v[0]})} max={360} step={1} />
                                </div>
                                <div className="w-px h-10 bg-border/60" />
                                <div className="w-16 space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Steps</Label>
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
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                                    <ListFilter size={12} />
                                    Color Steps
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(element.gradientStops || []).map((stop, index) => (
                                        <div key={stop.id} className="bg-background/40 p-3 rounded-xl border border-border/40">
                                            <div className="flex gap-3 items-end">
                                                <ColorPicker
                                                    label={`Step ${''}${index + 1}`}
                                                    color={stop.color}
                                                    onChange={color => handleSteppedStopChange(index, { color })}
                                                    containerClassName="space-y-0 flex-1"
                                                />
                                                <div className="w-20 space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground text-center">Ratio</Label>
                                                    <Input
                                                        type="number"
                                                        className="h-8 text-xs font-mono bg-background border-border/50 focus-visible:ring-1 ring-primary/30"
                                                        value={stop.weight ?? 1}
                                                        onChange={e => handleSteppedStopChange(index, { weight: parseInt(e.target.value, 10) || 1 })}
                                                        min={1}
                                                    />
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
                    step={0.01}
                    onChange={(v: number) => update({ tintOpacity: v })}
                />
            </SectionCard>
        </div>

        {/* ADJUSTMENTS SECTION */}
        <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm">
            <SectionCard title="Adjustments" icon={<SlidersHorizontal size={12} />}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                  <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="pt-4 space-y-4">
                  <PropertyRow label="Brightness" value={element.filterBrightness} display={`${Math.round((element.filterBrightness - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => update({ filterBrightness: v })} />
                  <PropertyRow label="Contrast" value={element.filterContrast} display={`${Math.round((element.filterContrast - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => update({ filterContrast: v })} />
                  <PropertyRow label="Saturation" value={element.filterSaturate} display={`${Math.round((element.filterSaturate - 1) * 100)}%`} min={0} max={2} step={0.05} onChange={(v: number) => update({ filterSaturate: v })} />
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

      </AccordionContent>
    </AccordionItem>
  );
}
