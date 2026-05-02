'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X, Plus, MoveRight, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GradientStop } from '@/lib/types';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';

type GradientPickerProps = {
  stops: GradientStop[];
  direction: number;
  onDirectionChange: (direction: number) => void;
  onTypeChange?: (type: 'linear' | 'radial') => void;
  gradientType?: 'linear' | 'radial';
  onOpenColorPicker: (label: string, color: string, onChange: (color: string, cmyk?: { c: number, m: number, y: number, k: number } | null) => void, cmyk?: { c: number, m: number, y: number, k: number } | null) => void;
};

export function GradientPicker({ 
  stops, 
  direction, 
  onStopsChange, 
  onDirectionChange, 
  onOpenColorPicker,
  onTypeChange,
  gradientType = 'linear'
}: GradientPickerProps) {
  const handleStopChange = (index: number, newStopProps: Partial<GradientStop>) => {
    let newStops = [...stops];
    newStops[index] = { ...newStops[index], ...newStopProps };
    onStopsChange(newStops);
  };

  const addStop = () => {
    if (stops.length >= 10) return; // Limit stops
    const newStop = { id: crypto.randomUUID(), color: '#ffffff', position: 0, weight: 1 };
    onStopsChange([...stops, newStop]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    const newStops = [...stops];
    newStops.splice(index, 1);
    onStopsChange(newStops);
  };

  return (
    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 shadow-sm">
      {/* Type Toggle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Gradient Type</Label>
        </div>
        <Tabs value={gradientType} onValueChange={(v) => onTypeChange?.(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-7 bg-slate-200/50 border border-slate-200/50 p-0.5 rounded-lg">
            <TabsTrigger value="linear" className="text-[10px] gap-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all py-0">
              <MoveRight size={12} />
              Linear
            </TabsTrigger>
            <TabsTrigger value="radial" className="text-[10px] gap-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all py-0">
              <CircleDot size={12} />
              Radial
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Direction / Angle - Only for linear */}
      {gradientType === 'linear' && (
        <div className="space-y-1 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center px-0.5">
              <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Angle</Label>
              <span className="text-[10px] font-mono font-bold text-primary">{direction}°</span>
          </div>
          <Slider value={[direction]} onValueChange={v => onDirectionChange(v[0])} max={360} step={1} className="py-1" />
        </div>
      )}

      {/* Color Stops */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Color Stops</Label>
          <span className="text-[9px] font-mono text-muted-foreground/30">{stops.length} stops</span>
        </div>
        
        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5 custom-scrollbar">
          {stops.map((stop, index) => (
            <div key={stop.id} className="group relative flex flex-col gap-0.5 bg-white p-1.5 rounded-xl border border-slate-200 hover:border-primary/30 transition-all shadow-sm">
                <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                        <Button 
                            variant="ghost" 
                            className="h-7 w-full px-1.5 justify-start rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all group-hover:border-primary/10"
                            onClick={() => onOpenColorPicker(`Stop ${index + 1}`, stop.color, (color, cmyk) => handleStopChange(index, { color, cmyk }), stop.cmyk)}
                        >
                            <div className="w-3.5 h-3.5 rounded-sm border border-slate-200 shadow-sm mr-2 shrink-0" style={{ backgroundColor: stop.color }} />
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">#{index + 1}</span>
                              <span className="text-[10px] font-mono leading-none tracking-tight text-slate-700">{stop.color.toUpperCase()}</span>
                            </div>
                        </Button>
                    </div>
                    
                    {stops.length > 2 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeStop(index)} 
                          className="h-6 w-6 rounded-md hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                            <X size={12} />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 px-1">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase w-8">Ratio</Label>
                    <Slider 
                      value={[stop.weight ?? 1]} 
                      onValueChange={(v) => handleStopChange(index, { weight: v[0] })} 
                      min={1} 
                      max={10} 
                      step={0.1} 
                      className="flex-1"
                    />
                    <span className="text-[9px] font-mono font-bold text-slate-500 w-6 text-right">{(stop.weight ?? 1).toFixed(1)}</span>
                </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addStop} 
          className="w-full h-8 gap-1.5 border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-primary/40 rounded-lg transition-all shadow-sm"
        >
          <Plus size={12} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Add Stop</span>
        </Button>
      </div>
    </div>
  );
}
