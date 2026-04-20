'use client';

import type { DesignElement, Product, Background, GradientStop } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '../ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { TextPropertiesPanel } from './text-properties-panel';
import { ImagePropertiesPanel } from './image-properties-panel';
import { ShapePropertiesPanel } from './shape-properties-panel';
import { PencilPropertiesPanel } from './pencil-properties-panel';
import { QrCodePropertiesPanel } from './qrcode-properties-panel';
import { PathPropertiesPanel } from './path-properties-panel';
import { Slider } from '../ui/slider';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GradientPicker } from './gradient-picker';
import {
  Maximize,
  Palette,
  Target,
  ShoppingCart,
  Move,
  RotateCw,
  Layers,
  UploadCloud,
  Grid3X3,
  Square,
  ListFilter,
  ImageIcon,
  BringToFront,
  SendToBack,
  ChevronsUp,
  ChevronsDown,
  AlignCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

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
  };
  croppingElementId: string | null;
  setCroppingElementId: (id: string | null) => void;
  isAdmin?: boolean;
  onMoveLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
};

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-3">
    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all">
      <Icon size={16} />
    </div>
    <span className="text-sm font-bold">{title}</span>
  </div>
);

export function PropertiesPanel({
  element,
  onUpdate,
  product,
  onProductUpdate,
  quantity,
  onQuantityChange,
  background,
  onBackgroundChange,
  canvasSettings,
  croppingElementId,
  setCroppingElementId,
  isAdmin,
  onMoveLayer,
}: PropertiesPanelProps) {

  // ====================== NO ELEMENT SELECTED → CANVAS SETTINGS ======================
  if (!element) {
    const handleBackgroundChange = (props: Partial<Background>) => {
      onBackgroundChange({ ...background, ...props });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          handleBackgroundChange({ imageSrc: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    };

    const handleBackgroundFillTypeChange = (fillType: 'solid' | 'gradient' | 'stepped-gradient' | 'image') => {
      const newProps: Partial<Background> = { type: fillType };

      if (fillType === 'stepped-gradient') {
        const steps = background.gradientSteps || 2;
        const currentStops = background.gradientStops || [];
        const defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];
        const newStops: GradientStop[] = Array.from({ length: steps }, (_, i) => ({
          id: currentStops[i]?.id || crypto.randomUUID(),
          color: currentStops[i]?.color || defaultColors[i % defaultColors.length],
          position: 0,
          weight: currentStops[i]?.weight || 1,
        }));
        newProps.gradientStops = newStops;
        newProps.gradientSteps = steps;
      }

      handleBackgroundChange(newProps);
    };

    const handleBackgroundGradientStepsChange = (steps: number) => {
      const newSteps = Math.max(2, Math.min(10, steps));
      const currentStops = background.gradientStops || [];
      const defaultColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#aaaaaa', '#555555'];

      const newStops: GradientStop[] = Array.from({ length: newSteps }, (_, i) => ({
        id: currentStops[i]?.id || crypto.randomUUID(),
        color: currentStops[i]?.color || defaultColors[i % defaultColors.length],
        position: 0,
        weight: currentStops[i]?.weight || 1,
      }));

      handleBackgroundChange({ gradientSteps: newSteps, gradientStops: newStops });
    };

    const handleBackgroundSteppedStopChange = (index: number, newProps: Partial<GradientStop>) => {
      const newStops = [...(background.gradientStops || [])];
      if (newStops[index]) {
        newStops[index] = { ...newStops[index], ...newProps };
        handleBackgroundChange({ gradientStops: newStops });
      }
    };

    const gradientStops = background.gradientStops?.length
      ? background.gradientStops
      : [
          { id: crypto.randomUUID(), color: background.color || '#000000', position: 0 },
          { id: crypto.randomUUID(), color: '#ffffff', position: 1 },
        ];

    return (
      <div className="h-full bg-background border-l overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b bg-muted/20">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Layers size={16} /> Canvas Settings
          </h2>
        </div>

        <Accordion type="multiple" defaultValue={['dimensions', 'background']} className="w-full">
          {/* Dimensions */}
          <AccordionItem value="dimensions" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Maximize} title="Dimensions" />
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4 px-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-muted-foreground">Width (mm)</Label>
                  <Input
                    className="h-9 bg-muted/30"
                    type="number"
                    value={Math.round(product?.width * PX_TO_MM)}
                    onChange={(e) => onProductUpdate({ width: Math.round(parseInt(e.target.value) * MM_TO_PX) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-muted-foreground">Height (mm)</Label>
                  <Input
                    className="h-9 bg-muted/30"
                    type="number"
                    value={Math.round(product?.height * PX_TO_MM)}
                    onChange={(e) => onProductUpdate({ height: Math.round(parseInt(e.target.value) * MM_TO_PX) })}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Background */}
          <AccordionItem value="background" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Palette} title="Background" />
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4 px-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fill Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBackgroundFillTypeChange('solid')}
                    className={cn("h-10 flex items-center justify-start gap-2 text-xs", background.type === 'solid' && "border-primary ring-1 ring-primary")}
                  >
                    <div className="w-5 h-5 rounded-sm border bg-gray-400" />
                    Solid Color
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBackgroundFillTypeChange('gradient')}
                    className={cn("h-10 flex items-center justify-start gap-2 text-xs", background.type === 'gradient' && "border-primary ring-1 ring-primary")}
                  >
                    <div className="w-5 h-5 rounded-sm border bg-gradient-to-br from-blue-400 to-purple-500" />
                    Gradient
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBackgroundFillTypeChange('stepped-gradient')}
                    className={cn("h-10 flex items-center justify-start gap-2 text-xs", background.type === 'stepped-gradient' && "border-primary ring-1 ring-primary")}
                  >
                    <div className="w-5 h-5 rounded-sm border bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                    Stepped
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBackgroundFillTypeChange('image')}
                    className={cn("h-10 flex items-center justify-start gap-2 text-xs", background.type === 'image' && "border-primary ring-1 ring-primary")}
                  >
                    <ImageIcon size={14} className="text-muted-foreground" />
                    Image Texture
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                {background.type === 'solid' && (
                  <ColorPicker label="Background Color" color={background.color} onChange={(color) => handleBackgroundChange({ color })} />
                )}

                {background.type === 'gradient' && (
                  <GradientPicker
                    stops={gradientStops}
                    direction={background.gradientDirection || 0}
                    onDirectionChange={(direction) => handleBackgroundChange({ gradientDirection: direction })}
                    onStopsChange={(stops) => handleBackgroundChange({ gradientStops: stops })}
                  />
                )}

                {background.type === 'stepped-gradient' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/40">
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                          <Label>Angle</Label>
                          <span>{background.gradientDirection || 0}°</span>
                        </div>
                        <Slider
                          value={[background.gradientDirection || 0]}
                          onValueChange={(v) => handleBackgroundChange({ gradientDirection: v[0] })}
                          max={360}
                          step={1}
                        />
                      </div>
                      <div className="w-px h-10 bg-border/60" />
                      <div className="w-16 space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Steps</Label>
                        <Input
                          type="number"
                          className="h-8 text-xs font-mono bg-background border-none"
                          value={background.gradientSteps || 2}
                          onChange={(e) => handleBackgroundGradientStepsChange(parseInt(e.target.value))}
                          min={2}
                          max={10}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                        <ListFilter size={12} />
                        Color Steps
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {(background.gradientStops || []).map((stop, index) => (
                          <div key={stop.id} className="bg-background/40 p-3 rounded-xl border border-border/40">
                            <div className="flex gap-3 items-end">
                              <ColorPicker
                                label={`Step ${index + 1}`}
                                color={stop.color}
                                onChange={color => handleBackgroundSteppedStopChange(index, { color })}
                                containerClassName="space-y-0 flex-1"
                              />
                              <div className="w-20 space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground text-center">Ratio</Label>
                                <Input
                                  type="number"
                                  className="h-8 text-xs font-mono bg-background border-border/50 focus-visible:ring-1 ring-primary/30"
                                  value={stop.weight ?? 1}
                                  onChange={e => handleBackgroundSteppedStopChange(index, { weight: parseInt(e.target.value) || 1 })}
                                  min={1}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBackgroundGradientStepsChange((background.gradientSteps || 2) + 1)}
                        className="w-full mt-2"
                      >
                        Add Step
                      </Button>
                    </div>
                  </div>
                )}

                {background.type === 'image' && (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] uppercase">Upload Texture</Label>
                      <div className="relative group">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="h-20 opacity-0 absolute inset-0 cursor-pointer z-10"
                        />
                        <div className="h-20 rounded-lg border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <UploadCloud size={20} />
                          <span className="text-[10px]">Click to upload</span>
                        </div>
                      </div>
                    </div>

                    <Select
                      value={background.imagePosition || 'fill'}
                      onValueChange={(v) => handleBackgroundChange({ imagePosition: v as any })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fill">Fill</SelectItem>
                        <SelectItem value="fit">Fit</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Precision & View */}
          <AccordionItem value="precision" className="border-b px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-sm font-semibold">
              <SectionHeader icon={Grid3X3} title="Precision & View" />
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4 px-0">
              <div className="grid gap-2">
                {[
                  { label: "Rulers", checked: canvasSettings.showRulers, fn: canvasSettings.setShowRulers },
                  { label: "Grid Lines", checked: canvasSettings.showGrid, fn: canvasSettings.setShowGrid },
                  { label: "Snap to Grid", checked: canvasSettings.snapToGrid, fn: canvasSettings.setSnapToGrid },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/10 hover:bg-muted/30 transition-colors">
                    <Label className="text-xs cursor-pointer">{item.label}</Label>
                    <Switch className="scale-75" checked={item.checked} onCheckedChange={item.fn} />
                  </div>
                ))}
              </div>

              {canvasSettings.showGrid && (
                <div className="space-y-2 pt-2 px-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                    <span>Grid Size</span>
                    <span>{canvasSettings.gridSize}px</span>
                  </div>
                  <Slider
                    value={[canvasSettings.gridSize]}
                    onValueChange={(v) => canvasSettings.setGridSize(v[0])}
                    min={5}
                    max={100}
                    step={1}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Production */}
          <AccordionItem value="order" className="px-4 border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-sm font-semibold text-primary">
              <div className="flex items-center gap-2"><ShoppingCart size={16} /> Production</div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                <Label className="text-xs font-bold text-primary">Order Quantity</Label>
                <Input
                  className="bg-background border-primary/20"
                  type="number"
                  value={quantity || 0}
                  min="1"
                  onChange={(e) => onQuantityChange(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  // ====================== ELEMENT SELECTED → SPECIFIC PANELS FIRST ======================
  const defaultOpen = ['specific', 'position', 'transform', 'appearance'];

  return (
    <div className="h-full bg-background border-l overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="font-bold text-sm capitalize flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {element.type} Properties
        </h3>
      </div>

      <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
        {/* ====================== SPECIFIC ELEMENT PANELS (TOP) ====================== */}
        {element.type === 'text' && (
          <AccordionItem value="specific" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Layers} title="Text Properties" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-6">
              <TextPropertiesPanel element={element} onUpdate={onUpdate} product={product} isAdmin={isAdmin} />
            </AccordionContent>
          </AccordionItem>
        )}

        {element.type === 'image' && (
          <AccordionItem value="specific" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={ImageIcon} title="Image Properties" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-6">
              <ImagePropertiesPanel
                element={element}
                onUpdate={onUpdate}
                croppingElementId={croppingElementId}
                setCroppingElementId={setCroppingElementId}
                isAdmin={isAdmin}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {element.type === 'shape' && (
          <AccordionItem value="specific" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Square} title="Shape Properties" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-6">
              <ShapePropertiesPanel element={element} onUpdate={onUpdate} isAdmin={isAdmin} />
            </AccordionContent>
          </AccordionItem>
        )}

        {element.type === 'path' && (
          <AccordionItem value="specific" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Layers} title="Path Properties" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-6">
              <PathPropertiesPanel element={element} onUpdate={onUpdate} />
            </AccordionContent>
          </AccordionItem>
        )}

        {element.type === 'brush' && (
          <AccordionItem value="specific" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Layers} title="Brush Properties" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-6">
              <PencilPropertiesPanel element={element} onUpdate={onUpdate} />
            </AccordionContent>
          </AccordionItem>
        )}

        {element.type === 'qrcode' && (
          <AccordionItem value="specific" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Layers} title="QR Code Properties" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-6">
              <QrCodePropertiesPanel element={element} onUpdate={onUpdate} isAdmin={isAdmin} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* ====================== GENERAL PANELS ====================== */}
        <AccordionItem value="position" className="border-b">
          <AccordionTrigger className="hover:no-underline py-4 px-4">
            <SectionHeader icon={Move} title="Positioning" />
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 px-4">
            {/* Align to Page */}
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-foreground">
                    <AlignCenter size={12} />
                    <span>Align to Page</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="icon" className="h-9" title="Align Left" onClick={() => onUpdate(element.id, { x: 0 })}>
                        <AlignHorizontalJustifyStart size={16} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9" title="Align Center (Horizontal)" onClick={() => onUpdate(element.id, { x: (product.width - element.width) / 2 })}>
                        <AlignHorizontalJustifyCenter size={16} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9" title="Align Right" onClick={() => onUpdate(element.id, { x: product.width - element.width })}>
                        <AlignHorizontalJustifyEnd size={16} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9" title="Align Top" onClick={() => onUpdate(element.id, { y: 0 })}>
                        <AlignVerticalJustifyStart size={16} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9" title="Align Middle (Vertical)" onClick={() => onUpdate(element.id, { y: (product.height - element.height) / 2 })}>
                        <AlignVerticalJustifyCenter size={16} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9" title="Align Bottom" onClick={() => onUpdate(element.id, { y: product.height - element.height })}>
                        <AlignVerticalJustifyEnd size={16} />
                    </Button>
                </div>
            </div>

            {/* Layering */}
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-foreground">
                <Layers size={12} />
                <span>Layering</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <Button variant="outline" size="icon" onClick={() => onMoveLayer('front')} title="Bring to Front">
                  <BringToFront size={14} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onMoveLayer('forward')} title="Bring Forward">
                  <ChevronsUp size={14} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onMoveLayer('backward')} title="Send Backward">
                  <ChevronsDown size={14} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onMoveLayer('back')} title="Send to Back">
                  <SendToBack size={14} />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Transform */}
        <AccordionItem value="transform" className="border-b">
          <AccordionTrigger className="hover:no-underline py-4 px-4">
            <SectionHeader icon={Maximize} title="Transform" />
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 px-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50 group-focus-within:text-primary transition-colors">X</span>
                <Input
                  className="pl-7 h-9 bg-muted/30 text-xs font-mono"
                  type="number"
                  step="0.1"
                  value={parseFloat(element.x.toFixed(1))}
                  onChange={(e) => onUpdate(element.id, { x: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50 group-focus-within:text-primary transition-colors">Y</span>
                <Input
                  className="pl-7 h-9 bg-muted/30 text-xs font-mono"
                  type="number"
                  step="0.1"
                  value={parseFloat(element.y.toFixed(1))}
                  onChange={(e) => onUpdate(element.id, { y: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50 group-focus-within:text-primary transition-colors">W</span>
                <Input
                  className="pl-7 h-9 bg-muted/30 text-xs font-mono"
                  type="number"
                  value={parseFloat(element.width.toFixed(1))}
                  onChange={(e) => onUpdate(element.id, { width: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50 group-focus-within:text-primary transition-colors">H</span>
                <Input
                  className="pl-7 h-9 bg-muted/30 text-xs font-mono"
                  type="number"
                  value={parseFloat(element.height.toFixed(1))}
                  onChange={(e) => onUpdate(element.id, { height: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-2 px-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Rotation</Label>
                <span className="text-[10px] font-mono text-primary">{element.rotation}°</span>
              </div>
              <div className="flex gap-4 items-center">
                <RotateCw size={14} className="text-muted-foreground" />
                <Slider
                  className="flex-1"
                  value={[element.rotation]}
                  onValueChange={(v) => onUpdate(element.id, { rotation: v[0] })}
                  max={360}
                  step={1}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Appearance */}
        <AccordionItem value="appearance" className="border-b">
          <AccordionTrigger className="hover:no-underline py-4 px-4">
            <SectionHeader icon={Layers} title="Appearance" />
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 px-4">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <Label>Opacity</Label>
                <span>{Math.round(element.opacity * 100)}%</span>
              </div>
              <Slider
                value={[element.opacity]}
                onValueChange={(v) => onUpdate(element.id, { opacity: v[0] })}
                max={1}
                step={0.01}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Container Styles for Text & Group */}
        {['text', 'group'].includes(element.type) && (
          <AccordionItem value="container-styles" className="border-b">
            <AccordionTrigger className="hover:no-underline py-4 px-4">
              <SectionHeader icon={Square} title="Container Styles" />
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6 px-4">
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                <ColorPicker
                  label="Element Background"
                  color={element.backgroundColor}
                  onChange={(color) => onUpdate(element.id, { backgroundColor: color })}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <Square className="h-3 w-3 text-muted-foreground" />
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Border</Label>
                </div>
                <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground">Width</Label>
                    <Input
                      type="number"
                      value={element.borderWidth || 0}
                      onChange={(e) => onUpdate(element.id, { borderWidth: parseInt(e.target.value, 10) || 0 })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground">Style</Label>
                    <Select
                      value={element.borderStyle || 'solid'}
                      onValueChange={(v) => onUpdate(element.id, { borderStyle: v as any })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="color"
                    value={element.borderColor || '#000000'}
                    onChange={(e) => onUpdate(element.id, { borderColor: e.target.value })}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Corner Radius</Label>
                  </div>
                  <span className="text-[10px] font-mono">{element.borderRadius || 0}px</span>
                </div>
                <Slider
                  value={[element.borderRadius || 0]}
                  onValueChange={(v) => onUpdate(element.id, { borderRadius: v[0] })}
                  max={Math.min(element.width, element.height) / 2}
                  step={1}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
