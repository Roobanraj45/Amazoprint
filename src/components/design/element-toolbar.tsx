'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { DesignElement, FoilType, ViewState } from '@/lib/types';
import { Copy, Sparkles, Trash2, X } from 'lucide-react';
import React from 'react';

type ElementToolbarProps = {
  selectedElements: DesignElement[];
  viewState: ViewState;
  onDuplicate: () => void;
  onDelete: () => void;
  spotUvAllowed: boolean;
  availableFoils: FoilType[];
  onSetSpecialFinish: (active: boolean, foil?: FoilType | null) => void;
  showRulers: boolean;
  safetyMargin: number;
};

const TOOLBAR_OFFSET_Y = 15;
const RULER_SIZE = 60;

export function ElementToolbar({
  selectedElements,
  viewState,
  onDuplicate,
  onDelete,
  spotUvAllowed,
  availableFoils,
  onSetSpecialFinish,
  showRulers,
  safetyMargin,
}: ElementToolbarProps) {
  if (selectedElements.length === 0) {
    return null;
  }

  const { zoom, pan } = viewState;

  // Bounding box calculation
  const minX = Math.min(...selectedElements.map(el => el.x));
  const minY = Math.min(...selectedElements.map(el => el.y));
  const midX = minX + (Math.max(...selectedElements.map(el => el.x + el.width)) - minX) / 2;

  const rulerOffset = showRulers ? RULER_SIZE : 0;
  const top = ((minY + safetyMargin + rulerOffset) * zoom) + pan.y - TOOLBAR_OFFSET_Y;
  const left = ((midX + safetyMargin + rulerOffset) * zoom) + pan.x;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translate(-50%, -100%)',
    zIndex: 30,
  };
  
  const element = selectedElements[0];
  const isSingleElementSelected = selectedElements.length === 1;
  const canHaveSpotUv = isSingleElementSelected && ['shape', 'text', 'brush', 'image', 'qrcode', 'path'].includes(element.type);
  const spotUvIsEnabled = !!element.spotUv;

  const handleSpotUvClick = () => {
    // If standard spot UV is already active, turn it off. Otherwise, turn it on.
    if (spotUvIsEnabled && !element.foilId) {
      onSetSpecialFinish(false);
    } else {
      onSetSpecialFinish(true, null);
    }
  };
  
  const handleFoilClick = (foil: FoilType) => {
    // If this foil is active, turn it off. Otherwise, activate it.
    if (spotUvIsEnabled && element.foilId === foil.id) {
      onSetSpecialFinish(false);
    } else {
      onSetSpecialFinish(true, foil);
    }
  };
  
  return (
    <div style={style}>
      <Card className="p-1 flex items-center gap-1 shadow-lg whitespace-nowrap">
        <Button variant="ghost" size="icon" onClick={onDuplicate} title="Duplicate">
          <Copy className="h-4 w-4" />
        </Button>
        
        {canHaveSpotUv && spotUvAllowed && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button
              variant={spotUvIsEnabled && !element.foilId ? 'selected' : 'ghost'}
              onClick={handleSpotUvClick}
              className="h-9 w-auto px-2.5"
              title="Apply Spot UV (Clear Gloss)"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Spot UV
            </Button>

            {availableFoils.map((foil) => (
              <Button
                key={foil.id}
                variant={spotUvIsEnabled && element.foilId === foil.id ? 'selected' : 'ghost'}
                onClick={() => handleFoilClick(foil)}
                className="h-9 w-auto px-2.5"
                title={`Apply ${foil.name}`}
              >
                <div 
                    className="w-3 h-3 rounded-full border mr-1.5" 
                    style={{ backgroundColor: foil.colorCode || '#000' }} 
                />
                <span className="text-sm">{foil.name}</span>
              </Button>
            ))}
          </>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </Card>
    </div>
  );
}
