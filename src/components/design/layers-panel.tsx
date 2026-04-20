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
} from 'lucide-react';

type LayersPanelProps = {
  elements: DesignElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string, isShift?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
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
  const truncate = (str: string, len: number) => {
    return str.length > len ? `${str.substring(0, len - 3)}...` : str;
  };

  switch (element.type) {
    case 'text':
      return element.content ? truncate(element.content, 25) : 'Text';
    case 'image':
      if (element.src?.startsWith('data:')) {
        return 'Image';
      }
      if (element.src) {
        const parts = element.src.split('/');
        const filename = parts[parts.length - 1].split('?')[0]; // remove query params
        if (filename) {
          try {
            return truncate(decodeURIComponent(filename), 25);
          } catch(e) {
            return truncate(filename, 25);
          }
        }
      }
      return 'Image';
    case 'shape':
      return element.shapeType ? `${element.shapeType.charAt(0).toUpperCase()}${element.shapeType.slice(1)}` : 'Shape';
    case 'qrcode':
      return element.qrValue ? `QR: ${truncate(element.qrValue, 15)}` : 'QR Code';
    case 'group':
      return `Group (${element.children?.length || 0} items)`;
    case 'brush':
      return 'Brush Stroke';
    case 'path':
      return 'Vector Path';
    default:
      return 'Untitled Element';
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
}: {
    element: DesignElement;
    selected: boolean;
    onSelect: (id: string, isShift: boolean) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    return (
        <div
            className={cn(
                'group/layer grid grid-cols-2 items-center rounded-md transition-colors w-full overflow-hidden mb-1',
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
                <div className="text-muted-foreground shrink-0">
                    <ElementIcon type={element.type} />
                </div>
                <span className="text-sm truncate select-none font-medium">
                    {getElementLabel(element)}
                </span>
            </div>
            <div className="flex items-center justify-end gap-0 pr-1 opacity-0 group-hover/layer:opacity-100 transition-opacity bg-inherit overflow-hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); onDuplicate(element.id); }} title="Duplicate">
                    <Copy size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(element.id); }} title="Delete">
                    <Trash2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); onToggleVisibility(element.id); }} title={element.visible !== false ? 'Hide' : 'Show'}>
                    {element.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); onToggleLock(element.id); }} title={element.locked ? 'Unlock' : 'Lock'}>
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
  onDelete
}: LayersPanelProps) {
    
    const reversedElements = [...elements].reverse();

    const findElementRecursive = (els: DesignElement[], id: string): DesignElement | undefined => {
        for (const el of els) {
            if (el.id === id) return el;
            if (el.children) {
                const found = findElementRecursive(el.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    const renderLayers = (els: DesignElement[], level = 0): React.ReactNode[] => {
        return els.flatMap(element => {
            const isSelected = selectedElementIds.includes(element.id);
            const item = (
                <div key={element.id} style={{ paddingLeft: `${level * 0.75}rem` }}>
                    <LayerItem
                        element={element}
                        selected={isSelected}
                        onSelect={onSelectElement}
                        onToggleVisibility={onToggleVisibility}
                        onToggleLock={onToggleLock}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                    />
                </div>
            );

            if (element.type === 'group' && element.children) {
                const childrenReversed = [...element.children].reverse();
                return [item, ...renderLayers(childrenReversed, level + 1)];
            }
            return [item];
        });
    }

  return (
    <div className="flex flex-col h-full bg-card">
        <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Layers</h4>
            <p className="text-xs text-muted-foreground">Top-most layers first.</p>
        </div>
        <ScrollArea className="flex-1 h-96">
            <div className="p-2">
                {elements.length > 0 ? (
                    renderLayers(reversedElements)
                ) : (
                    <div className="text-center text-sm text-muted-foreground p-8">
                        No layers yet.
                    </div>
                )}
            </div>
        </ScrollArea>
    </div>
  );
}
