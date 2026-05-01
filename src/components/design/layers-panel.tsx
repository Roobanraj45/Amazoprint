'use client';

import type { DesignElement } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    Type, 
    Image as ImageIcon, 
    Shapes, 
    Group, 
    Brush, 
    Spline,
    Eye, 
    EyeOff, 
    Lock, 
    Unlock, 
    Copy, 
    Trash2,
    QrCode,
    Eraser,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type LayersPanelProps = {
  elements: DesignElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string | null, isShift?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
};

const ElementIcon = ({ type }: { type: DesignElement['type'] }) => {
  switch (type) {
    case 'text': return <Type className="h-4 w-4" />;
    case 'image': return <ImageIcon className="h-4 w-4" />;
    case 'shape': return <Shapes className="h-4 w-4" />;
    case 'group': return <Group className="h-4 w-4" />;
    case 'brush': return <Brush className="h-4 w-4" />;
    case 'qrcode': return <QrCode className="h-4 w-4" />;
    case 'path': return <Spline className="h-4 w-4" />;
    default: return null;
  }
};

const getElementLabel = (element: DesignElement): string => {
  const truncate = (str: string, len: number) =>
    str.length > len ? `${str.substring(0, len - 3)}...` : str;

  switch (element.type) {
    case 'text':
      return element.content ? truncate(element.content, 25) : 'Text';
    case 'image':
      return 'Image';
    case 'shape':
      return element.shapeType || 'Shape';
    case 'qrcode':
      return 'QR Code';
    case 'group':
      return `Group (${element.children?.length || 0})`;
    case 'brush':
      return 'Brush Stroke';
    case 'path':
      return 'Vector Path';
    default:
      return 'Element';
  }
};

const LayerItem = ({
  element,
  selected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete
}: any) => {
  return (
    <div
      className={cn(
        'group/layer grid grid-cols-2 items-center rounded-md mb-1',
        element.visible === false && 'opacity-40',
        selected && !element.locked ? 'bg-accent' : 'hover:bg-accent/50'
      )}
    >
      <div
        className="flex items-center gap-2 p-2 cursor-pointer min-w-0"
        onClick={(e) => {
          if (element.locked) return;
          onSelect(element.id, e.shiftKey);
        }}
      >
        <ElementIcon type={element.type} />
        <span className="text-sm truncate font-medium">
          {getElementLabel(element)}
        </span>
      </div>

      <div className="flex justify-end gap-1 pr-1 opacity-0 group-hover/layer:opacity-100">
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDuplicate(element.id); }}>
          <Copy size={14} />
        </Button>
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}>
          <Trash2 size={14} />
        </Button>
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onToggleVisibility(element.id); }}>
          {element.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
        </Button>
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onToggleLock(element.id); }}>
          {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </Button>
      </div>
    </div>
  );
};

export function LayersPanel({
  elements,
  selectedElementIds,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete,
  onDeleteAll,
}: LayersPanelProps) {

  const renderLayers = (els: DesignElement[], level = 0): React.ReactNode[] => {
    return els.flatMap(el => {
      const item = (
        <div key={el.id} style={{ paddingLeft: `${level * 0.75}rem` }}>
          <LayerItem
            element={el}
            selected={selectedElementIds.includes(el.id)}
            onSelect={onSelectElement}
            onToggleVisibility={onToggleVisibility}
            onToggleLock={onToggleLock}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      );

      if (el.type === 'group' && el.children) {
        return [item, ...renderLayers([...el.children].reverse(), level + 1)];
      }

      return [item];
    });
  };

  return (
    <div className="flex flex-col bg-card">
      
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <div>
          <h4 className="text-sm font-medium">Layers</h4>
          <p className="text-xs text-muted-foreground">Top-most first</p>
        </div>

        {elements.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive">
                <Eraser className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all layers?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteAll}>
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* SCROLL FIX HERE */}
      <div className="shrink-0">
        <ScrollArea className="h-[400px] w-full">
          <div className="p-2">
            {elements.length > 0 ? (
              renderLayers([...elements].reverse())
            ) : (
              <div className="text-center text-sm text-muted-foreground p-6">
                No layers
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}