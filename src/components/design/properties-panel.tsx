'use client';

import type { DesignElement, Product, Background, GradientStop } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '../ui/switch';
import { TextPropertiesPanel } from './text-properties-panel';
import { ImagePropertiesPanel } from './image-properties-panel';
import { ShapePropertiesPanel } from './shape-properties-panel';
import { QrCodePropertiesPanel } from './qrcode-properties-panel';
import { PathPropertiesPanel } from './path-properties-panel';
import { Slider } from '../ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GradientPicker } from './gradient-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Maximize, Palette, Target, ShoppingCart, Move, RotateCw, Layers,
  UploadCloud, Grid3X3, Square, ListFilter, ImageIcon, BringToFront,
  SendToBack, ChevronsUp, ChevronsDown, AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Type, Wand2, Settings2, LayoutTemplate, Crop, FlipHorizontal, FlipVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import React from 'react';

const DPI = 300;
const MM_PER_INCH = 25.4;
const PX_TO_MM = MM_PER_INCH / DPI;
const MM_TO_PX = DPI / MM_PER_INCH;

type PropertiesPanelProps = {
  element: DesignElement | undefined;
  onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
  product: Product;
  onProductUpdate: (newProps: Partial<Product>) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  background: Background;
  onBackgroundChange: (background: Background) => void;
  canvasSettings: {
    showRulers: boolean;
    setShowRulers: (show: boolean) => void;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    gridSize: number;
    setGridSize: (size: number) => void;
    showPrintGuidelines: boolean;
    setShowPrintGuidelines: (show: boolean) => void;
    bleed: number;
    setBleed: (size: number) => void;
    safetyMargin: number;
    setSafetyMargin: (size: number) => void;
    unit: 'mm' | 'inch' | 'ft';
    setUnit: (unit: 'mm' | 'inch' | 'ft') => void;
  };
  croppingElementId: string | null;
  setCroppingElementId: (id: string | null) => void;
  maskingElementId: string | null;
  setMaskingElementId: (id: string | null) => void;
  isAdmin?: boolean;
  onMoveLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  onOpenColorPicker: (label: string, color: string, onChange: (color: string) => void) => void;
  design?: any;
};

const PropSlider = ({ label, value, display, min, max, step, onChange }: any) => (
  <div className="space-y-2 py-1">
    <div className="flex justify-between items-center px-0.5">
      <span className="text-[10px] font-bold text-muted-foreground/80">{label}</span>
      <span className="text-[10px] font-mono font-bold bg-primary/5 px-2 py-0.5 rounded-lg text-primary min-w-[40px] text-center border border-primary/10">{display}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
  </div>
);

// Compact XY / WH input pair
const CoordInput = ({ label, value, onChange, step = 0.1, disabled = false }: any) => (
  <div className="relative group">
    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded bg-primary/10 border border-primary/20 pointer-events-none z-10">
        <span className="text-[10px] font-bold text-primary leading-none">{label}</span>
    </div>
    <Input
      className="pl-8 h-10 bg-muted/30 text-xs font-bold border-0 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl disabled:opacity-50"
      type="number" step={step}
      value={typeof value === 'number' ? parseFloat(value.toFixed(1)) : value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      disabled={disabled}
    />
  </div>
);

// Icon toggle button
const IconToggle = ({ icon: Icon, active, onClick, title }: any) => (
  <button
    title={title}
    onClick={onClick}
    className={cn(
      "flex items-center justify-center h-9 w-full rounded-lg transition-all text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent",
      active && "bg-primary/10 text-primary border-primary/20 shadow-[0_2px_10px_-4px_rgba(var(--primary),0.3)]"
    )}
  >
    <Icon size={16} />
  </button>
);

export function PropertiesPanel({
  element, onUpdate, product, onProductUpdate, quantity, onQuantityChange,
  background, onBackgroundChange, canvasSettings, croppingElementId,
  setCroppingElementId, maskingElementId, setMaskingElementId, isAdmin, onMoveLayer, onOpenColorPicker,
  design,
}: PropertiesPanelProps) {

  // =================== NO ELEMENT → CANVAS SETTINGS ===================
  if (!element) {
    const handleBg = (props: Partial<Background>) => onBackgroundChange({ ...background, ...props });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => handleBg({ imageSrc: ev.target?.result as string });
      reader.readAsDataURL(file);
    };

    const handleBgFill = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'image') => {
      const newProps: Partial<Background> = { type: fillType };
      
      if (fillType === 'stepped-gradient') {
        if (!background.steppedGradientStops) {
            const steps = background.gradientSteps || 2;
            const stops = background.gradientStops || [];
            const colors = ['#3b82f6','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#64748b'];
            newProps.steppedGradientStops = Array.from({ length: steps }, (_, i) => ({
              id: stops[i]?.id || crypto.randomUUID(), 
              color: stops[i]?.color || colors[i % colors.length], 
              position: 0, 
              weight: stops[i]?.weight || 1,
            }));
            newProps.steppedGradientSteps = steps;
            newProps.steppedGradientDirection = background.gradientDirection ?? 180;
            newProps.steppedGradientType = background.gradientType ?? 'linear';
        }
      } else if (fillType === 'gradient' && (!background.gradientStops || background.gradientStops.length === 0)) {
        newProps.gradientStops = [
          { id: crypto.randomUUID(), color: background.color || '#3b82f6', position: 0, weight: 1 },
          { id: crypto.randomUUID(), color: '#ffffff', position: 1, weight: 1 }
        ];
        newProps.gradientType = 'linear';
        newProps.gradientDirection = 180;
      }
      
      handleBg(newProps);
    };

    const bgGradientStops = background.gradientStops?.length
      ? background.gradientStops
      : [{ id: crypto.randomUUID(), color: background.color || '#000000', position: 0 }, { id: crypto.randomUUID(), color: '#ffffff', position: 1 }];

    const bgSteppedStops = background.steppedGradientStops?.length
      ? background.steppedGradientStops
      : [{ id: crypto.randomUUID(), color: background.color || '#000000', position: 0, weight: 1 }, { id: crypto.randomUUID(), color: '#ffffff', position: 1, weight: 1 }];

    return (
      <div className="h-full flex flex-col overflow-hidden bg-white border-l shadow-sm">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Settings2 size={18} />
            </div>
            <div>
                <h2 className="text-[12px] font-black tracking-tight text-foreground leading-none uppercase">Canvas</h2>
                <p className="text-[9px] text-muted-foreground font-bold mt-1 tracking-tight">Layout settings</p>
            </div>
          </div>
        </div>

        <Tabs key="canvas-settings" defaultValue="canvas" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="shrink-0 mx-4 mt-2 h-9 grid grid-cols-3 bg-muted/40 rounded-xl p-1 border border-border/20">
            <TabsTrigger value="canvas" className="text-[10px] font-bold h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">Canvas</TabsTrigger>
            <TabsTrigger value="background" className="text-[10px] font-bold h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">Background</TabsTrigger>
            <TabsTrigger value="production" className="text-[10px] font-bold h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">Production</TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-2 pb-4 space-y-3 mt-0">
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground">Dimensions</p>
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const DPI = 300;
                  const unit = canvasSettings.unit;
                  let pxToUnit = 25.4 / DPI; // default mm
                  let unitToPx = DPI / 25.4;
                  let step = 1;

                  if (unit === 'inch') {
                    pxToUnit = 1 / DPI;
                    unitToPx = DPI;
                    step = 0.1;
                  } else if (unit === 'ft') {
                    pxToUnit = 1 / (DPI * 12);
                    unitToPx = DPI * 12;
                    step = 0.01;
                  }

                  const formatVal = (px: number) => {
                    const val = px * pxToUnit;
                    return unit === 'mm' ? Math.round(val) : parseFloat(val.toFixed(2));
                  };

                  return (
                    <>
                      <CoordInput 
                        label="W" 
                        value={formatVal(product?.width)} 
                        onChange={(v: number) => onProductUpdate({ width: Math.round(v * unitToPx) })} 
                        step={step} 
                        disabled={!isAdmin} 
                      />
                      <CoordInput 
                        label="H" 
                        value={formatVal(product?.height)} 
                        onChange={(v: number) => onProductUpdate({ height: Math.round(v * unitToPx) })} 
                        step={step} 
                        disabled={!isAdmin} 
                      />
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-muted-foreground font-bold">Canvas unit</p>
                <div className="flex bg-muted/40 p-0.5 rounded-md w-32">
                    {['mm', 'inch', 'ft'].map((u) => (
                        <button
                            key={u}
                            onClick={() => canvasSettings.setUnit(u as any)}
                            className={cn(
                                "flex-1 h-6 text-[10px] font-bold rounded transition-all",
                                canvasSettings.unit === u 
                                    ? "bg-background shadow-sm text-primary" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {u}
                        </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">View options</p>
              {[
                { label: "Rulers", checked: canvasSettings.showRulers, fn: canvasSettings.setShowRulers },
                { label: "Grid Lines", checked: canvasSettings.showGrid, fn: canvasSettings.setShowGrid },
                { label: "Snap to Grid", checked: canvasSettings.snapToGrid, fn: canvasSettings.setSnapToGrid },
                { label: "Print Guidelines", checked: canvasSettings.showPrintGuidelines, fn: canvasSettings.setShowPrintGuidelines },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/20">
                  <Label className="text-xs font-medium cursor-pointer">{item.label}</Label>
                  <Switch className="scale-75 origin-right" checked={item.checked} onCheckedChange={item.fn} />
                </div>
              ))}
            </div>

            {canvasSettings.showGrid && (
              <PropSlider label="Grid Size" value={canvasSettings.gridSize} display={`${canvasSettings.gridSize}px`} min={5} max={100} step={1} onChange={canvasSettings.setGridSize} />
            )}

            <div className="h-px bg-border/40" />

            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground">Print setup</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground/70">Bleed (mm)</Label>
                  <Input className="h-8 text-xs font-mono bg-muted/40 border-0 disabled:opacity-50 disabled:cursor-not-allowed" type="number" value={canvasSettings.bleed} onChange={(e) => canvasSettings.setBleed(parseFloat(e.target.value) || 0)} disabled={!isAdmin} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground/70">Safety (mm)</Label>
                  <Input className="h-8 text-xs font-mono bg-muted/40 border-0 disabled:opacity-50 disabled:cursor-not-allowed" type="number" value={canvasSettings.safetyMargin} onChange={(e) => canvasSettings.setSafetyMargin(parseFloat(e.target.value) || 0)} disabled={!isAdmin} />
                </div>
              </div>
            </div>

            {design?.user && (
              <>
                <div className="h-px bg-border/40 my-4" />
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-muted-foreground">User Information</p>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                    {design.user.profileImage ? (
                      <img src={design.user.profileImage} alt={design.user.name} className="h-10 w-10 rounded-xl object-cover border border-white shadow-sm" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {design.user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate leading-tight">{design.user.name || 'Anonymous User'}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{design.user.email}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* BACKGROUND TAB */}
          <TabsContent value="background" className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-2 pb-4 space-y-3 mt-0">
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fill type</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'solid', preview: <div className="w-4 h-4 rounded-full bg-slate-400 border border-slate-300" />, label: 'Solid' },
                  { value: 'gradient', preview: <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />, label: 'Gradient' },
                  { value: 'stepped-gradient', preview: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400" />, label: 'Stepped' },
                  { value: 'image', preview: <ImageIcon size={16} className="text-slate-500" />, label: 'Image' },
                ].map(({ value, preview, label }) => (
                  <button key={value} onClick={() => handleBgFill(value as any)}
                    className={cn("flex flex-col items-center gap-1.5 py-2 rounded-xl border text-[10px] font-bold transition-all shadow-sm", 
                      background.type === value 
                        ? "bg-primary/10 border-primary/50 text-primary" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                    {preview}{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/50 border border-slate-200 p-3 shadow-inner">
              {background.type === 'solid' && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 ml-1">Background color</Label>
                  <Button 
                    variant="outline" 
                    className="h-10 w-full px-3 justify-start rounded-xl border-slate-200 bg-white hover:bg-slate-100 transition-all shadow-sm"
                    onClick={() => onOpenColorPicker("Background color", background.color || "#ffffff", (color) => handleBg({ color }))}
                  >
                    <div className="w-5 h-5 rounded-md border border-slate-200 shadow-sm mr-3" style={{ backgroundColor: background.color || "#ffffff" }} />
                    <span className="text-[11px] font-mono text-slate-700">{background.color || "#ffffff"}</span>
                  </Button>
                </div>
              )}
              {background.type === 'gradient' && (
                <GradientPicker 
                  stops={bgGradientStops} 
                  direction={background.gradientDirection || 0}
                  gradientType={background.gradientType || 'linear'}
                  onDirectionChange={(d) => handleBg({ gradientDirection: d })}
                  onTypeChange={(t) => handleBg({ gradientType: t })}
                  onStopsChange={(s) => handleBg({ gradientStops: s })}
                  onOpenColorPicker={onOpenColorPicker} 
                />
              )}
              {background.type === 'stepped-gradient' && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                    <PropSlider 
                      label="Angle" 
                      value={background.steppedGradientDirection ?? background.gradientDirection ?? 0} 
                      display={`${background.steppedGradientDirection ?? background.gradientDirection ?? 0}°`} 
                      min={0} max={360} step={1} 
                      onChange={(v) => handleBg({ steppedGradientDirection: v })} 
                    />
                    <div className="space-y-1 w-14">
                      <Label className="text-[9px] uppercase font-bold text-slate-500">Steps</Label>
                      <Input type="number" className="h-8 text-xs font-mono bg-white border-slate-200" value={background.steppedGradientSteps || background.gradientSteps || 2}
                        onChange={(e) => {
                          const steps = Math.max(2, Math.min(10, parseInt(e.target.value) || 2));
                          const stops = [...bgSteppedStops];
                          const colors = ['#3b82f6','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#64748b'];
                          const newStops = Array.from({ length: steps }, (_, i) => stops[i] || { id: crypto.randomUUID(), color: colors[i % colors.length], position: 0, weight: 1 });
                          handleBg({ steppedGradientSteps: steps, steppedGradientStops: newStops });
                        }} min={2} max={10} />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {bgSteppedStops.map((stop, i) => (
                      <div key={stop.id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-primary/20">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[9px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Step {i + 1}</Label>
                          <Button 
                            variant="outline" 
                            className="h-8 w-full px-2 justify-start rounded-lg border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all shadow-sm"
                            onClick={() => onOpenColorPicker(`Step ${i + 1} color`, stop.color, (c) => {
                              const newStops = [...bgSteppedStops];
                              if (newStops[i]) { newStops[i] = { ...newStops[i], color: c }; handleBg({ steppedGradientStops: newStops }); }
                            })}
                          >
                            <div className="w-3.5 h-3.5 rounded-sm border border-slate-200 shadow-sm mr-2" style={{ backgroundColor: stop.color }} />
                            <span className="text-[10px] font-mono text-slate-700">{stop.color}</span>
                          </Button>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center px-1">
                            <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ratio</Label>
                            <span className="text-[10px] font-mono font-bold text-primary">{(stop.weight ?? 1).toFixed(1)}</span>
                          </div>
                          <Slider value={[stop.weight ?? 1]} onValueChange={(v) => {
                            const newStops = [...bgSteppedStops];
                            if (newStops[i]) { newStops[i] = { ...newStops[i], weight: v[0] }; handleBg({ steppedGradientStops: newStops }); }
                          }} min={1} max={10} step={0.1} className="py-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {background.type === 'image' && (
                <div className="space-y-3">
                  <div className="relative group">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="h-16 opacity-0 absolute inset-0 cursor-pointer z-10" />
                    <div className="h-16 rounded-lg border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground">
                      <UploadCloud size={16} />
                      <span className="text-[10px]">Click to upload</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={background.imagePosition || 'fill'} onValueChange={(v) => handleBg({ imagePosition: v as any })} className="flex-1">
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fill">Fill</SelectItem>
                        <SelectItem value="fit">Fit</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 gap-2 text-xs font-bold rounded-lg border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex-1"
                      onClick={() => setCroppingElementId('background')}
                      disabled={!background.imageSrc}
                    >
                      <Crop size={14} />
                      Crop
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PRODUCTION TAB */}
          <TabsContent value="production" className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-3 pb-4 mt-0">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-2">
              <Label className="text-xs font-bold text-primary">Order Quantity</Label>
              <Input className="bg-background border-primary/20 font-mono disabled:opacity-50 disabled:cursor-not-allowed" type="number" value={quantity || 0} min="1"
                onChange={(e) => onQuantityChange(parseInt(e.target.value, 10) || 1)} disabled={!isAdmin} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // =================== ELEMENT SELECTED ===================
  const elementTypeLabel: Record<string, string> = {
    text: 'Text', image: 'Image', shape: 'Shape', path: 'Path', qrcode: 'QR Code', group: 'Group',
  };

  const typeIcon: Record<string, React.ReactNode> = {
    text: <Type size={16} />,
    image: <ImageIcon size={16} />,
    shape: <Square size={16} />,
    path: <Palette size={16} />,
    qrcode: <Grid3X3 size={16} />,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-l shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-primary/10 text-primary shadow-inner">
            {typeIcon[element.type]}
          </div>
          <div>
            <h2 className="text-[12px] font-bold tracking-tight text-foreground leading-none uppercase">{elementTypeLabel[element.type] || element.type}</h2>
            <p className="text-[9px] text-muted-foreground font-semibold mt-1 tracking-tight">Appearance</p>
          </div>
        </div>
          <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-bold text-primary tracking-tight">Live</span>
        </div>
      </div>

      <Tabs key={element.id} defaultValue="design" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="shrink-0 mx-4 mt-3 h-10 grid grid-cols-3 bg-muted/40 rounded-xl p-1 border border-border/20">
          <TabsTrigger value="design" className="text-[10px] font-bold h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
            <Palette size={14} className="mr-1.5" />Design
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-[10px] font-bold h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
            <LayoutTemplate size={14} className="mr-1.5" />Layout
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-[10px] font-bold h-7 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
            <Wand2 size={14} className="mr-1.5" />Effects
          </TabsTrigger>
        </TabsList>

        {/* ===== DESIGN TAB ===== */}
        <TabsContent value="design" className="flex-1 overflow-y-auto custom-scrollbar px-2 pt-2 pb-6 mt-0">
          {element.type === 'text' && <TextPropertiesPanel element={element} onUpdate={onUpdate} product={product} isAdmin={isAdmin} onOpenColorPicker={onOpenColorPicker} />}
          {element.type === 'image' && (
            <ImagePropertiesPanel element={element} onUpdate={onUpdate}
              croppingElementId={croppingElementId} setCroppingElementId={setCroppingElementId}
              maskingElementId={maskingElementId} setMaskingElementId={setMaskingElementId}
              isAdmin={isAdmin} onOpenColorPicker={onOpenColorPicker} />
          )}
          {element.type === 'shape' && <ShapePropertiesPanel element={element} onUpdate={onUpdate} 
            maskingElementId={maskingElementId} setMaskingElementId={setMaskingElementId}
            isAdmin={isAdmin} onOpenColorPicker={onOpenColorPicker} />}
          {element.type === 'path' && <PathPropertiesPanel element={element} onUpdate={onUpdate} onOpenColorPicker={onOpenColorPicker} />}
          {element.type === 'qrcode' && <QrCodePropertiesPanel element={element} onUpdate={onUpdate} isAdmin={isAdmin} onOpenColorPicker={onOpenColorPicker} />}
          {element.type === 'group' && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <Layers size={24} className="opacity-40" />
              <p className="text-xs">Group element selected</p>
              <p className="text-[10px] text-muted-foreground/60">Enter the group to edit children</p>
            </div>
          )}
        </TabsContent>

        {/* ===== LAYOUT TAB ===== */}
        <TabsContent value="layout" className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-2 pb-4 space-y-4 mt-0">
          {/* Transform */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Transform</p>
            <div className="grid grid-cols-2 gap-3">
              <CoordInput label="X" value={element.x} onChange={(v: number) => onUpdate(element.id, { x: v })} />
              <CoordInput label="Y" value={element.y} onChange={(v: number) => onUpdate(element.id, { y: v })} />
              <CoordInput label="W" value={element.width} onChange={(v: number) => onUpdate(element.id, { width: v })} />
              <CoordInput label="H" value={element.height} onChange={(v: number) => onUpdate(element.id, { height: v })} />
            </div>
            <PropSlider label="Rotation" value={element.rotation} display={`${element.rotation}°`} min={0} max={360} step={1}
              onChange={(v: number) => onUpdate(element.id, { rotation: v })} />
            
            <div className="pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-2">Flip</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn("h-9 gap-2 text-xs font-bold rounded-lg border-slate-200", element.flipHorizontal && "bg-primary/10 border-primary/40 text-primary")}
                  onClick={() => onUpdate(element.id, { flipHorizontal: !element.flipHorizontal })}
                >
                  <FlipHorizontal size={14} />
                  Horizontal
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn("h-9 gap-2 text-xs font-bold rounded-lg border-slate-200", element.flipVertical && "bg-primary/10 border-primary/40 text-primary")}
                  onClick={() => onUpdate(element.id, { flipVertical: !element.flipVertical })}
                >
                  <FlipVertical size={14} />
                  Vertical
                </Button>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40" />

          {/* Align to Page */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Align to page</p>
            <div className="grid grid-cols-3 gap-3">
              <IconToggle icon={AlignHorizontalJustifyStart} title="Left" onClick={() => onUpdate(element.id, { x: 0 })} />
              <IconToggle icon={AlignHorizontalJustifyCenter} title="Center H" onClick={() => onUpdate(element.id, { x: (product.width - element.width) / 2 })} />
              <IconToggle icon={AlignHorizontalJustifyEnd} title="Right" onClick={() => onUpdate(element.id, { x: product.width - element.width })} />
              <IconToggle icon={AlignVerticalJustifyStart} title="Top" onClick={() => onUpdate(element.id, { y: 0 })} />
              <IconToggle icon={AlignVerticalJustifyCenter} title="Center V" onClick={() => onUpdate(element.id, { y: (product.height - element.height) / 2 })} />
              <IconToggle icon={AlignVerticalJustifyEnd} title="Bottom" onClick={() => onUpdate(element.id, { y: product.height - element.height })} />
            </div>
          </div>

          <div className="h-px bg-border/40" />

          {/* Layering */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Layer order</p>
            <div className="grid grid-cols-4 gap-3">
              <IconToggle icon={BringToFront} title="Bring to Front" onClick={() => onMoveLayer('front')} />
              <IconToggle icon={ChevronsUp} title="Bring Forward" onClick={() => onMoveLayer('forward')} />
              <IconToggle icon={ChevronsDown} title="Send Backward" onClick={() => onMoveLayer('backward')} />
              <IconToggle icon={SendToBack} title="Send to Back" onClick={() => onMoveLayer('back')} />
            </div>
          </div>
        </TabsContent>

        {/* ===== EFFECTS TAB ===== */}
        <TabsContent value="effects" className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-6 space-y-6 mt-0">
          {/* Opacity */}
          <PropSlider label="Opacity" value={element.opacity} display={`${Math.round(element.opacity * 100)}%`} min={0} max={1} step={0.01}
            onChange={(v: number) => onUpdate(element.id, { opacity: v })} />

          {/* Container Styles for Text & Group */}
          {['text', 'group'].includes(element.type) && (
            <>
              <div className="h-px bg-border/40" />
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-muted-foreground">Container</p>
                <div className="rounded-xl bg-muted/20 border border-border/40 p-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground/70 ml-1">Container background</Label>
                    <Button 
                      variant="outline" 
                      className="h-10 w-full px-3 justify-start rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                      onClick={() => onOpenColorPicker("Container background", element.backgroundColor || "transparent", (color) => onUpdate(element.id, { backgroundColor: color }))}
                    >
                      <div 
                        className="w-5 h-5 rounded-md border border-white/20 shadow-sm mr-3" 
                        style={{ 
                          backgroundColor: element.backgroundColor === 'transparent' ? undefined : element.backgroundColor,
                          backgroundImage: element.backgroundColor === 'transparent' ? 'repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%)' : undefined,
                          backgroundSize: '6px 6px'
                        }} 
                      />
                      <span className="text-xs font-mono">{element.backgroundColor || "transparent"}</span>
                    </Button>
                  </div>
                </div>

                {/* Border */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground/70">Border</p>
                  <div className="grid grid-cols-[1fr_2fr_auto] gap-1.5 items-end">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground/60">Width</Label>
                      <Input type="number" value={element.borderWidth || 0}
                        onChange={(e) => onUpdate(element.id, { borderWidth: parseInt(e.target.value, 10) || 0 })}
                        className="h-7 text-xs bg-muted/40 border-0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground/60">Style</Label>
                      <Select value={element.borderStyle || 'solid'} onValueChange={(v) => onUpdate(element.id, { borderStyle: v as any })}>
                        <SelectTrigger className="h-7 text-xs bg-muted/40 border-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <input type="color" value={element.borderColor || '#000000'}
                      onChange={(e) => onUpdate(element.id, { borderColor: e.target.value })}
                      className="w-7 h-7 p-0.5 rounded border border-border/50 cursor-pointer bg-muted/40" />
                  </div>
                </div>

                {/* Corner Radius */}
                <PropSlider label="Corner Radius" value={element.borderRadius || 0} display={`${element.borderRadius || 0}px`}
                  min={0} max={Math.min(element.width, element.height) / 2} step={1}
                  onChange={(v: number) => onUpdate(element.id, { borderRadius: v })} />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
