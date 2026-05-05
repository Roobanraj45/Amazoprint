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
  Sparkles,
  Loader2,
  Eraser,
  Circle,
  Square,
} from "lucide-react";
import { removeBackground } from "@imgly/background-removal";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { GradientPicker } from "./gradient-picker";
import { cn, resolveImagePath } from "@/lib/utils";
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
  activeTool?: 'select' | 'brush' | 'pen' | 'eraser';
  setActiveTool?: (tool: 'select' | 'brush' | 'pen' | 'eraser') => void;
  eraserOptions?: {
    size: number;
    brushTip: 'soft_round' | 'hard_round' | 'square';
    opacity: number;
  };
  setEraserOptions?: (options: any) => void;
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


export function ImagePropertiesPanel({ 
    element, onUpdate, croppingElementId, setCroppingElementId, maskingElementId, setMaskingElementId, onOpenColorPicker,
    activeTool, setActiveTool, eraserOptions, setEraserOptions 
}: Props) {
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

  const [isRemovingBackground, setIsRemovingBackground] = React.useState(false);

  const handleRemoveBackground = async () => {
    if (!element.src || isRemovingBackground) return;
    setIsRemovingBackground(true);
    try {
      const resolvedPath = resolveImagePath(element.src);
      const imageResponse = await fetch(resolvedPath);
      if (!imageResponse.ok) throw new Error("Image not found or inaccessible");
      const inputBlob = await imageResponse.blob();

      const blob = await removeBackground(inputBlob);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        update({ src: base64data });
        setIsRemovingBackground(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to remove background:", error);
      setIsRemovingBackground(false);
    }
  };

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

        {/* AI TOOLS SECTION */}
        <SectionCard title="AI Tools" icon={<Sparkles size={12} />} className="p-3 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-100 shadow-indigo-100/20">
            <div className="space-y-3">
                <p className="text-[10px] text-indigo-600 font-medium leading-tight">
                    Remove background from images instantly using local AI.
                </p>
                <Button 
                    variant="default"
                    className="w-full gap-2 h-10 text-xs font-bold rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-70"
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBackground || !element.src}
                >
                    {isRemovingBackground ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            Remove Background
                        </>
                    )}
                </Button>
            </div>
        </SectionCard>

        {/* MANUAL REFINEMENT SECTION */}
        <SectionCard title="Manual Refinement" icon={<Eraser size={12} />} className="p-3">
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        variant={activeTool === 'eraser' ? 'selected' : 'outline'}
                        className="flex-1 gap-2 h-10 text-xs font-bold rounded-xl transition-all"
                        onClick={() => setActiveTool?.(activeTool === 'eraser' ? 'select' : 'eraser')}
                    >
                        <Eraser size={14} />
                        Eraser Tool
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 px-3 text-xs font-bold rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => update({ eraserPaths: [] })}
                        disabled={!element.eraserPaths?.length}
                    >
                        Reset
                    </Button>
                </div>

                {activeTool === 'eraser' && eraserOptions && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                        <PropertyRow 
                            label="Brush Size" 
                            value={eraserOptions.size} 
                            display={`${eraserOptions.size}px`} 
                            min={2} max={200} step={1} 
                            onChange={(v: number) => setEraserOptions?.({ ...eraserOptions, size: v })} 
                        />
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Tip Shape
                            </Label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'soft_round', icon: <Circle size={14} className="opacity-40" />, label: 'Soft' },
                                    { id: 'hard_round', icon: <Circle size={14} />, label: 'Hard' },
                                    { id: 'square', icon: <Square size={14} />, label: 'Square' },
                                ].map((tip) => (
                                    <Button
                                        key={tip.id}
                                        variant={eraserOptions.brushTip === tip.id ? 'selected' : 'outline'}
                                        className="flex-1 h-9 gap-1.5 rounded-lg p-0"
                                        onClick={() => setEraserOptions?.({ ...eraserOptions, brushTip: tip.id })}
                                    >
                                        {tip.icon}
                                        <span className="text-[10px]">{tip.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <PropertyRow 
                            label="Opacity" 
                            value={eraserOptions.opacity} 
                            display={`${Math.round(eraserOptions.opacity * 100)}%`} 
                            min={0.1} max={1} step={0.05} 
                            onChange={(v: number) => setEraserOptions?.({ ...eraserOptions, opacity: v })} 
                        />
                    </div>
                )}
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
