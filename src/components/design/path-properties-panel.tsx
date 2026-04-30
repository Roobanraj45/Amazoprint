
'use client';

import { ShapePropertiesPanel } from './shape-properties-panel';
import type { DesignElement } from '@/lib/types';

type PathPropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    onOpenColorPicker: (label: string, color: string, onChange: (color: string) => void) => void;
};

export function PathPropertiesPanel({ element, onUpdate, onOpenColorPicker }: PathPropertiesPanelProps) {
    // We can reuse the ShapePropertiesPanel as it handles fill and stroke,
    // which are the primary properties we want to edit for a path.
    return <ShapePropertiesPanel element={element} onUpdate={onUpdate} onOpenColorPicker={onOpenColorPicker} />;
}
