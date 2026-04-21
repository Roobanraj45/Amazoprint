'use client';

import React from 'react';
import type { PathPoint } from '@/lib/types';
import { generatePathD } from '@/lib/utils';

type PenToolCanvasProps = {
  livePath: PathPoint[] | null;
  zoom: number;
  safetyMargin: number;
};

/**
 * An overlay component that renders the active pen tool path,
 * including anchor points and Bezier control handles.
 */
export function PenToolCanvas({ livePath, zoom, safetyMargin }: PenToolCanvasProps) {
  if (!livePath || livePath.length === 0) return null;

  const pathData = generatePathD(livePath, false, safetyMargin, safetyMargin);
  const handleSize = 10 / zoom;
  const pointSize = 10 / zoom;
  const strokeWidth = 2 / zoom;
  const handleLineStroke = 1 / zoom;

  return (
    <svg 
        style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            overflow: 'visible', 
            pointerEvents: 'none', 
            zIndex: 999 
        }}
    >
      {/* The main path being drawn */}
      <path 
        d={pathData} 
        fill="rgba(37, 99, 235, 0.1)" 
        stroke="#2563eb" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {livePath.map((p, i) => (
        <React.Fragment key={`point-${i}`}>
          {/* Handle lines connecting anchor to control points */}
          <line 
            x1={p.cp1x + safetyMargin} y1={p.cp1y + safetyMargin} 
            x2={p.x + safetyMargin} y2={p.y + safetyMargin} 
            stroke="#2563eb" strokeWidth={handleLineStroke} opacity={0.6}
          />
          <line 
            x1={p.x + safetyMargin} y1={p.y + safetyMargin} 
            x2={p.cp2x + safetyMargin} y2={p.cp2y + safetyMargin} 
            stroke="#2563eb" strokeWidth={handleLineStroke} opacity={0.6}
          />
          
          {/* Anchor Point (The main point on the curve) */}
          <rect 
            x={p.x + safetyMargin - pointSize / 2} 
            y={p.y + safetyMargin - pointSize / 2} 
            width={pointSize} 
            height={pointSize} 
            fill="white" 
            stroke="#2563eb" 
            strokeWidth={strokeWidth} 
            style={{ cursor: 'move', pointerEvents: 'auto' }}
          />
          
          {/* Control Point 1 (Entry handle) */}
          <circle 
            cx={p.cp1x + safetyMargin} 
            cy={p.cp1y + safetyMargin} 
            r={handleSize / 2.5} 
            fill="#2563eb" 
            stroke="white" 
            strokeWidth={handleLineStroke} 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          />
          
          {/* Control Point 2 (Exit handle) */}
          <circle 
            cx={p.cp2x + safetyMargin} 
            cy={p.cp2y + safetyMargin} 
            r={handleSize / 2.5} 
            fill="#2563eb" 
            stroke="white" 
            strokeWidth={handleLineStroke} 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }} 
          />
        </React.Fragment>
      ))}
    </svg>
  );
}
