import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PathPoint } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImagePath(path?: string): string {
  if (!path) return '';

  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  if (path.includes('/public/')) {
    return path.split('/public')[1];
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function generatePathD(points: PathPoint[], isClosed: boolean, offsetX = 0, offsetY = 0): string {
    if (!points || points.length === 0) return '';
  
    const start = points[0];
    let d = `M ${start.x + offsetX} ${start.y + offsetY}`;
  
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      d += ` C ${p1.cp2x + offsetX} ${p1.cp2y + offsetY}, ${p2.cp1x + offsetX} ${p2.cp1y + offsetY}, ${p2.x + offsetX} ${p2.y + offsetY}`;
    }
  
    if (isClosed && points.length > 1) {
      const lastPoint = points[points.length - 1];
      d += ` C ${lastPoint.cp2x + offsetX} ${lastPoint.cp2y + offsetY}, ${start.cp1x + offsetX} ${start.cp1y + offsetY}, ${start.x + offsetX} ${start.y + offsetY}`;
      d += ' Z';
    }
    
    return d;
}
