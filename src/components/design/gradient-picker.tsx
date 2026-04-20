'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { GradientStop } from '@/lib/types';
import { CMYKColorPicker as ColorPicker } from './cmyk-color-picker';

type GradientPickerProps = {
  stops: GradientStop[];
  direction: number;
  onStopsChange: (stops: GradientStop[]) => void;
  onDirectionChange: (direction: number) => void;
};

export function GradientPicker({ stops, direction, onStopsChange, onDirectionChange }: GradientPickerProps) {
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
    <div className="space-y-2 rounded-md border p-2">
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
            <Label>Direction</Label>
            <span>{direction}°</span>
        </div>
        <Slider value={[direction]} onValueChange={v => onDirectionChange(v[0])} max={360} step={1} />
      </div>
      <div className="space-y-1">
        <Label className="px-1">Stops</Label>
        <div className="space-y-1">
          {stops.map((stop, index) => (
            <div key={stop.id} className="flex items-center gap-1">
                <ColorPicker
                    label={`Stop ${index + 1}`}
                    color={stop.color}
                    onChange={color => handleStopChange(index, { color })}
                    containerClassName="flex-1"
                />
                {stops.length > 2 ? (
                    <Button variant="ghost" size="icon" onClick={() => removeStop(index)} className="h-9 w-9 self-end">
                        <X className="h-4 w-4" />
                    </Button>
                ) : <div className="w-9 h-9" />}
            </div>
          ))}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={addStop} className="w-full">
        Add Color Stop
      </Button>
    </div>
  );
}
