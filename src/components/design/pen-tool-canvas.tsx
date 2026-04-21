
'use client';

import React from 'react';
import type { PathPoint } from '@/lib/types';
import { generatePathD } from '@/lib/utils';

type PenToolCanvasProps = {
  livePath: PathPoint[] | null;
  mousePos: { x: number, y: number } | null;
  zoom: number;
  safetyMargin: number;
};

/**
 * An overlay component that renders the active pen tool path,
 * including anchor points, Bezier control handles, and a rubber-band preview.
 */
export function PenToolCanvas({ livePath, mousePos, zoom, safetyMargin }: PenToolCanvasProps) {
  if (!livePath || livePath.length === 0) return null;

  const pathData = generatePathD(livePath, false, safetyMargin, safetyMargin);
  const handleSize = 10 / zoom;
  const pointSize = 12 / zoom;
  const strokeWidth = 2 / zoom;
  const handleLineStroke = 1 / zoom;

  const lastPoint = livePath[livePath.length - 1];
  
  // Render rubber-band line from last point to mouse
  let previewLineD = '';
  if (mousePos && lastPoint) {
      // Use the last point's exit handle (CP2) as the starting curve control
      const hasExitHandle = Math.hypot(lastPoint.cp2x - lastPoint.x, lastPoint.cp2y - lastPoint.y) > 0.1;
      
      if (hasExitHandle) {
          // If we have an exit handle, preview as a curve connecting to mouse
          previewLineD = `M ${lastPoint.x + safetyMargin} ${lastPoint.y + safetyMargin} C ${lastPoint.cp2x + safetyMargin} ${lastPoint.cp2y + safetyMargin}, ${mousePos.x + safetyMargin} ${mousePos.y + safetyMargin}, ${mousePos.x + safetyMargin} ${mousePos.y + safetyMargin}`;
      } else {
          // Otherwise it's a straight line
          previewLineD = `M ${lastPoint.x + safetyMargin} ${lastPoint.y + safetyMargin} L ${mousePos.x + safetyMargin} ${mousePos.y + safetyMargin}`;
      }
  }

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
      {/* Rubber-band preview line */}
      {previewLineD && (
          <path
            d={previewLineD}
            fill="none"
            stroke="#2563eb"
            strokeWidth={strokeWidth}
            strokeDasharray={`${5/zoom} ${5/zoom}`}
            opacity={0.5}
          />
      )}

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
            stroke="#2563eb" strokeWidth={handleLineStroke} opacity={0.4}
          />
          <line 
            x1={p.x + safetyMargin} y1={p.y + safetyMargin} 
            x2={p.cp2x + safetyMargin} y2={p.cp2y + safetyMargin} 
            stroke="#2563eb" strokeWidth={handleLineStroke} opacity={0.4}
          />
          
          {/* Anchor Point (The main point on the curve) */}
          <rect 
            x={p.x + safetyMargin - pointSize / 2} 
            y={p.y + safetyMargin - pointSize / 2} 
            width={pointSize} 
            height={pointSize} 
            fill={i === 0 ? "#10b981" : "white"} 
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
