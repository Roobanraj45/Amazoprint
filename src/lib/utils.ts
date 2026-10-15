import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PathPoint } from "./types";
import { FIREBASE_ASSETS } from "./firebase-assets";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImagePath(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // data URLs and blob URLs — use as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  // External absolute URL (e.g. Firebase, external CDNs) — check if it's already Firebase
  if (trimmed.startsWith('https://firebasestorage.googleapis.com')) {
    return trimmed;
  }

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

  // Route brand assets and fallbacks directly to Firebase Storage
  if (cleanPath === '/uploads/amazoLogo.png' || cleanPath === 'amazoLogo.png' || cleanPath.endsWith('/amazoLogo.png')) {
    return FIREBASE_ASSETS.logo;
  }
  if (cleanPath === '/uploads/amazoIcon.png' || cleanPath === 'amazoIcon.png' || cleanPath.endsWith('/amazoIcon.png')) {
    return FIREBASE_ASSETS.icon;
  }
  if (cleanPath === '/uploads/hero.png' || cleanPath === 'hero.png' || cleanPath.endsWith('/hero.png')) {
    return FIREBASE_ASSETS.hero;
  }

  // If it is another external absolute URL (e.g. Unsplash, external CDNs), use as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Ensure leading slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  return cleanPath;
}

export function getProductImageUrl(path?: string | null, fallback: string = FIREBASE_ASSETS.hero): string {
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

export const COLOR_NAME_MAP: Record<string, string> = {
    // Basic neutrals
    'black': '#000000',
    'jet black': '#0a0a0a',
    'white': '#FFFFFF',
    'pure white': '#FFFFFF',
    'off white': '#FAF9F6',
    'ivory': '#FFFFF0',
    'cream': '#FFFDD0',
    'grey': '#6B7280',
    'gray': '#6B7280',
    'light grey': '#D1D5DB',
    'light gray': '#D1D5DB',
    'dark grey': '#374151',
    'dark gray': '#374151',
    'charcoal': '#27272A',
    'charcoal grey': '#27272A',
    'charcoal gray': '#27272A',
    'slate': '#475569',
    'silver': '#E2E8F0',

    // Blues
    'navy': '#001B44',
    'navy blue': '#001B44',
    'dark blue': '#0A192F',
    'midnight blue': '#191970',
    'royal blue': '#1D4ED8',
    'blue': '#2563EB',
    'sky blue': '#38BDF8',
    'light blue': '#BAE6FD',
    'cyan': '#06B6D4',
    'teal': '#0D9488',
    'turquoise': '#14B8A6',
    'indigo': '#4F46E5',
    'cobalt': '#0047AB',
    'denim': '#1560BD',

    // Reds & Pinks
    'red': '#DC2626',
    'dark red': '#991B1B',
    'crimson': '#BE123C',
    'maroon': '#800000',
    'burgundy': '#800020',
    'wine': '#722F37',
    'ruby': '#E0115F',
    'pink': '#EC4899',
    'light pink': '#FBCFE8',
    'hot pink': '#DB2777',
    'rose': '#F43F5E',
    'rose gold': '#B76E79',
    'magenta': '#D946EF',
    'fuchsia': '#C026D3',
    'salmon': '#FA8072',
    'coral': '#FB7185',
    'peach': '#FFDAB9',

    // Greens
    'green': '#16A34A',
    'dark green': '#14532D',
    'forest green': '#15803D',
    'emerald': '#059669',
    'olive': '#556B2F',
    'olive green': '#556B2F',
    'military green': '#4B5320',
    'army green': '#4B5320',
    'bottle green': '#064E3B',
    'lime': '#84CC16',
    'lime green': '#65A30D',
    'mint': '#6EE7B7',
    'mint green': '#6EE7B7',
    'sage': '#9CA3AF',
    'sage green': '#84A98C',
    'sea green': '#2E8B57',

    // Yellows & Oranges
    'yellow': '#EAB308',
    'light yellow': '#FEF08A',
    'lemon': '#FDE047',
    'mustard': '#CA8A04',
    'mustard yellow': '#CA8A04',
    'gold': '#EAB308',
    'golden': '#EAB308',
    'orange': '#EA580C',
    'dark orange': '#C2410C',
    'tangerine': '#F97316',
    'amber': '#D97706',
    'rust': '#9A3412',
    'copper': '#B87333',
    'bronze': '#92400E',

    // Purples
    'purple': '#7C3AED',
    'violet': '#8B5CF6',
    'lavender': '#DDD6FE',
    'lilac': '#C8A2C8',
    'plum': '#701A75',
    'mauve': '#A855F7',

    // Browns & Neutrals
    'brown': '#78350F',
    'chocolate': '#451A03',
    'coffee': '#5C3D2E',
    'tan': '#D2B48C',
    'beige': '#F5F5DC',
    'khaki': '#A3997A',
    'camel': '#C19A6B',
    'sand': '#E7D8C9',
};

export function resolveColorHex(value?: string | null, name?: string | null): string {
    const val = (value || '').trim();
    if (val) {
        if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(val)) return val;
        if (/^(rgb|hsl)a?\(.+?\)$/i.test(val)) return val;
        const lowerVal = val.toLowerCase();
        if (COLOR_NAME_MAP[lowerVal]) return COLOR_NAME_MAP[lowerVal];
    }

    const nm = (name || '').trim().toLowerCase();
    if (nm) {
        if (COLOR_NAME_MAP[nm]) return COLOR_NAME_MAP[nm];
        // Word or substring search for composite names like "Navy Blue", "Glossy White", "Matte Black"
        for (const [key, hex] of Object.entries(COLOR_NAME_MAP)) {
            if (nm.includes(key)) {
                return hex;
            }
        }
    }

    return val || '#000000';
}

