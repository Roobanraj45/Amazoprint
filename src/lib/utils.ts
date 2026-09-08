import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PathPoint } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImagePath(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // data URLs and blob URLs — use as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  // Strip localhost / 127.0.0.1 / 0.0.0.0 — keep just the path part
  let cleanPath = trimmed.replace(/^https?:\/\/(localhost|0\.0\.0\.0|127\.0\.0\.1)(:\d+)?/, '');

  // Strip amazoprint domains so they resolve relatively against current origin (works across localhost & production)
  cleanPath = cleanPath
    .replace(/^https?:\/\/(www\.)?amazoprint\.in/, '')
    .replace(/^https?:\/\/(www\.)?amazoprint\.com/, '');

  // Strip /public/ prefix if present
  if (cleanPath.includes('/public/')) {
    cleanPath = cleanPath.split('/public')[1];
  }

  // Normalize /api/media/products/ → /uploads/products/ and /api/media/ → /uploads/
  cleanPath = cleanPath
    .replace(/^\/api\/media\/products\//, '/uploads/products/')
    .replace(/^api\/media\/products\//, '/uploads/products/')
    .replace(/^\/api\/media\//, '/uploads/')
    .replace(/^api\/media\//, '/uploads/');

  // If it is another external absolute URL (e.g. Unsplash, Firebase, external CDNs), use as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Ensure leading slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  return cleanPath;
}

export function getProductImageUrl(path?: string | null, fallback = '/uploads/hero.png'): string {
  if (!path || typeof path !== 'string' || !path.trim()) return fallback;
  return resolveImagePath(path) || fallback;
}



/**
 * Generates an SVG path data string (d attribute) from a set of PathPoints.
 * Uses Cubic Bezier curves (C) between points.
 */
export function generatePathD(points: PathPoint[], isClosed: boolean, offsetX = 0, offsetY = 0): string {
    if (!points || points.length === 0) return '';
  
    const start = points[0];
    let d = `M ${start.x + offsetX} ${start.y + offsetY}`;
  
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      // Curve from current point to next point using p1's exit handle (cp2) and p2's entry handle (cp1)
      d += ` C ${p1.cp2x + offsetX} ${p1.cp2y + offsetY}, ${p2.cp1x + offsetX} ${p2.cp1y + offsetY}, ${p2.x + offsetX} ${p2.y + offsetY}`;
    }
  
    if (isClosed && points.length > 1) {
      const lastPoint = points[points.length - 1];
      // Final segment connecting back to the start
      d += ` C ${lastPoint.cp2x + offsetX} ${lastPoint.cp2y + offsetY}, ${start.cp1x + offsetX} ${start.cp1y + offsetY}, ${start.x + offsetX} ${start.y + offsetY}`;
      d += ' Z';
    }
    
    return d;
}

export function measureTextDimensions(
    text: string, 
    element: { 
        fontSize: number; 
        fontFamily: string; 
        fontWeight?: string | number; 
        fontStyle?: string; 
        lineHeight?: number; 
        letterSpacing?: number; 
    },
    maxWidthLimit: number
) {
    if (typeof document === 'undefined') return { width: 100, height: 50 };
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return { width: 100, height: 50 };

    context.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize || 16}px "${element.fontFamily || 'sans-serif'}"`;
    if ('letterSpacing' in context) {
        (context as any).letterSpacing = `${element.letterSpacing || 0}px`;
    }

    const paragraphs = text.split('\n');
    let maxLineWidth = 0;
    let totalLines = 0;
    const lineHeightPx = (element.lineHeight || 1.2) * (element.fontSize || 16);

    paragraphs.forEach(para => {
        const words = para.split(' ');
        let currentLine = "";
        let paraLines = 0;

        if (words.length === 0 || (words.length === 1 && words[0] === "")) {
            totalLines += 1;
            return;
        }

        words.forEach(word => {
            const testLine = currentLine ? currentLine + " " + word : word;
            const testWidth = context.measureText(testLine).width;

            if (testWidth > maxWidthLimit && currentLine) {
                maxLineWidth = Math.max(maxLineWidth, context.measureText(currentLine).width);
                paraLines++;
                currentLine = word;
            } else {
                currentLine = testLine;
                maxLineWidth = Math.max(maxLineWidth, testWidth);
            }
        });
        if (currentLine) {
            paraLines++;
            maxLineWidth = Math.max(maxLineWidth, context.measureText(currentLine).width);
        }
        totalLines += paraLines;
    });

    return {
        width: Math.max(50, Math.min(maxLineWidth + 30, maxWidthLimit)),
        height: Math.max(element.fontSize * 1.5, totalLines * lineHeightPx + 15)
    };
}
