'use client';

import React from 'react';
import type { PathPoint } from '@/lib/types';
import { generatePathD } from '@/lib/utils';

type PenToolCanvasProps = {
  livePath: PathPoint[] | null;
  zoom: number;
  safetyMargin: number;
};

export function PenToolCanvas({ livePath, zoom, safetyMargin }: PenToolCanvasProps) {
  if (!livePath || livePath.length === 0) return null;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 999 }}>
      <path 
        d={generatePathD(livePath, false, safetyMargin, safetyMargin)} 
        fill="rgba(37, 99, 235, 0.1)" 
        stroke="#2563eb" 
        strokeWidth={2 / zoom} 
      />
      {livePath.map((p, i) => (
        <React.Fragment key={i}>
          {/* Control point lines */}
          <line x1={p.cp1x + safetyMargin} y1={p.cp1y + safetyMargin} x2={p.x + safetyMargin} y2={p.y + safetyMargin} stroke="#2563eb" strokeWidth={1 / zoom} />
          <line x1={p.x + safetyMargin} y1={p.y + safetyMargin} x2={p.cp2x + safetyMargin} y2={p.cp2y + safetyMargin} stroke="#2563eb" strokeWidth={1 / zoom} />
          
          {/* Anchor Point */}
          <rect 
            x={p.x + safetyMargin - 5 / zoom} 
            y={p.y + safetyMargin - 5 / zoom} 
            width={10 / zoom} 
            height={10 / zoom} 
            fill="white" 
            stroke="#2563eb" 
            strokeWidth={2 / zoom} 
            style={{ cursor: 'move', pointerEvents: 'auto' }}
          />
          
          {/* Control Points */}
          <circle 
            cx={p.cp1x + safetyMargin} 
            cy={p.cp1y + safetyMargin} 
            r={5 / zoom} 
            fill="#2563eb" 
            stroke="white" 
            strokeWidth={1/zoom} 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          />
          <circle 
            cx={p.cp2x + safetyMargin} 
            cy={p.cp2y + safetyMargin} 
            r={5 / zoom} 
            fill="#2563eb" 
            stroke="white" 
            strokeWidth={1/zoom} 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }} 
          />
        </React.Fragment>
      ))}
    </svg>
  );
}
