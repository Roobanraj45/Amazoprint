
export interface MaskShape {
  id: string;
  label: string;
  path: string;
  color?: string;
}

export const MASK_SHAPES: MaskShape[] = [
  // Basic Geometric
  { id: 'rectangle', label: 'Square', path: 'M 0 0 H 100 V 100 H 0 Z', color: '#3b82f6' },
  { id: 'circle', label: 'Circle', path: 'M 50, 50 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0', color: '#ef4444' },
  { id: 'heart', label: 'Heart', path: 'M 50 15 C 35 0 0 0 0 35 C 0 55 20 75 50 95 C 80 75 100 55 100 35 C 100 0 65 0 50 15 Z', color: '#ec4899' },
  { id: 'star-5', label: 'Star 5', path: 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z', color: '#f59e0b' },
  { id: 'diamond', label: 'Diamond', path: 'M 50 0 L 100 50 L 50 100 L 0 50 Z', color: '#10b981' },
  { id: 'triangle', label: 'Triangle', path: 'M 50 0 L 100 100 L 0 100 Z', color: '#6366f1' },
  { id: 'hexagon', label: 'Hexagon', path: 'M 50 0 L 93 25 L 93 75 L 50 100 L 7 75 L 7 25 Z', color: '#8b5cf6' },
  { id: 'octagon', label: 'Octagon', path: 'M 30 0 H 70 L 100 30 V 70 L 70 100 H 30 L 0 70 V 30 Z', color: '#06b6d4' },
  { id: 'pill', label: 'Pill', path: 'M 30 0 H 70 C 86.5 0 100 22.4 100 50 C 100 77.6 86.5 100 70 100 H 30 C 13.5 100 0 77.6 0 50 C 0 22.4 13.5 0 30 0 Z', color: '#f97316' },

  // Blobs & Organic
  { id: 'blob-1', label: 'Amoeba', path: 'M 50 0 C 70 0 100 20 100 50 C 100 80 70 100 50 100 C 30 100 0 80 0 50 C 0 20 30 0 50 0 Z', color: '#22c55e' },
  { id: 'blob-2', label: 'Soft Blob', path: 'M 88 50 C 88 71 71 88 50 88 C 29 88 12 71 12 50 C 12 29 29 12 50 12 C 71 12 88 29 88 50 Z', color: '#fbbf24' },
  { id: 'blob-3', label: 'Organic', path: 'M90,50C90,72.1,72.1,90,50,90S10,72.1,10,50S27.9,10,50,10S90,27.9,90,50z', color: '#a855f7' },
  { id: 'cloud', label: 'Cloud', path: 'M 25 40 C 10 40 0 50 0 65 C 0 80 15 90 30 90 H 80 C 95 90 100 80 100 70 C 100 55 90 45 75 45 C 75 25 55 10 35 15 C 30 15 25 25 25 40 Z', color: '#38bdf8' },
  
  // Badges & Labels
  { id: 'badge-1', label: 'Badge', path: 'M 50 0 L 60 10 H 90 V 40 L 100 50 L 90 60 V 90 H 60 L 50 100 L 40 90 H 10 V 60 L 0 50 L 10 40 V 10 H 40 Z', color: '#ef4444' },
  { id: 'banner', label: 'Banner', path: 'M 0 20 H 100 V 80 H 0 L 15 50 Z', color: '#f43f5e' },
  { id: 'tag', label: 'Tag', path: 'M 0 0 H 70 L 100 50 L 70 100 H 0 Z', color: '#14b8a6' },
  { id: 'shield', label: 'Shield', path: 'M 0 10 C 0 10 50 0 50 0 C 50 0 100 10 100 10 V 50 C 100 80 50 100 50 100 C 50 100 0 80 0 50 V 10 Z', color: '#4338ca' },

  // Abstract & Symbols
  { id: 'flower', label: 'Flower', path: 'M 50 0 C 60 0 70 10 70 20 S 60 40 50 40 S 30 30 30 20 S 40 0 50 0 M 100 50 C 100 60 90 70 80 70 S 60 60 60 50 S 70 30 80 30 S 100 40 100 50 M 50 100 C 40 100 30 90 30 80 S 40 60 50 60 S 70 70 70 80 S 60 100 50 100 M 0 50 C 0 40 10 30 20 30 S 40 40 40 50 S 30 70 20 70 S 0 60 0 50', color: '#f472b6' },
  { id: 'leaf', label: 'Leaf', path: 'M 50 100 C 50 100 0 80 0 40 C 0 0 50 0 50 0 C 50 0 100 0 100 40 C 100 80 50 100 50 100 Z', color: '#16a34a' },
  { id: 'drop', label: 'Drop', path: 'M 50 0 C 50 0 100 40 100 70 C 100 85 85 100 50 100 C 15 100 0 85 0 70 C 0 40 50 0 50 0 Z', color: '#0ea5e9' },
  { id: 'sun', label: 'Sun', path: 'M 50 20 A 30 30 0 1 0 50 80 A 30 30 0 1 0 50 20 M 50 0 V 15 M 50 85 V 100 M 0 50 H 15 M 85 50 H 100 M 15 15 L 25 25 M 75 75 L 85 85 M 15 85 L 25 75 M 75 15 L 85 25', color: '#eab308' },
  { id: 'moon', label: 'Moon', path: 'M 50 0 A 50 50 0 1 0 100 50 A 40 40 0 1 1 50 0 Z', color: '#475569' },

  // More Geometric / Tech
  { id: 'cross', label: 'Cross', path: 'M 35 0 H 65 V 35 H 100 V 65 H 65 V 100 H 35 V 65 H 0 V 35 H 35 Z', color: '#ef4444' },
  { id: 'bolt', label: 'Bolt', path: 'M 60 0 L 20 55 H 50 L 40 100 L 80 45 H 50 Z', color: '#fbbf24' },
  { id: 'chevron-right', label: 'Chevron', path: 'M 30 0 L 80 50 L 30 100 L 20 90 L 60 50 L 20 10 Z', color: '#3b82f6' },
  { id: 'arrow-up', label: 'Arrow', path: 'M 50 0 L 100 50 H 70 V 100 H 30 V 50 H 0 Z', color: '#22c55e' },
  
  // Funky Shapes
  { id: 'burst', label: 'Burst', path: 'M 50 0 L 60 30 L 90 20 L 70 50 L 100 60 L 70 70 L 80 100 L 50 80 L 20 100 L 30 70 L 0 60 L 30 50 L 10 20 L 40 30 Z', color: '#f97316' },
  { id: 'gear', label: 'Gear', path: 'M 50 35 A 15 15 0 1 0 50 65 A 15 15 0 1 0 50 35 M 45 0 H 55 V 20 H 45 Z M 45 80 H 55 V 100 H 45 Z M 0 45 H 20 V 55 H 0 Z M 80 45 H 100 V 55 H 80 Z M 15 15 L 25 25 M 75 75 L 85 85 M 15 85 L 25 75 M 75 15 L 85 25', color: '#64748b' },
  { id: 'clover', label: 'Clover', path: 'M 50 50 C 50 20 20 20 20 50 C 20 80 50 80 50 50 M 50 50 C 80 50 80 20 50 20 C 20 20 20 50 50 50 M 50 50 C 50 80 80 80 80 50 C 80 20 50 20 50 50 M 50 50 C 20 50 20 80 50 80 C 80 80 80 50 50 50', color: '#10b981' },
  { id: 'waves', label: 'Waves', path: 'M 0 50 Q 25 25 50 50 T 100 50 V 100 H 0 Z', color: '#60a5fa' },

  // Symbols 2
  { id: 'puzzle', label: 'Puzzle', path: 'M 30 0 H 70 C 80 0 80 20 70 20 V 40 H 90 C 100 40 100 60 90 60 H 70 V 80 C 80 80 80 100 70 100 H 30 C 20 100 20 80 30 80 V 60 H 10 C 0 60 0 40 10 40 H 30 V 20 C 20 20 20 0 30 0', color: '#f59e0b' },
  { id: 'eye', label: 'Eye', path: 'M 0 50 C 20 20 80 20 100 50 C 80 80 20 80 0 50 M 50 35 A 15 15 0 1 0 50 65 A 15 15 0 1 0 50 35', color: '#6366f1' },
  { id: 'home', label: 'Home', path: 'M 50 0 L 100 50 V 100 H 70 V 70 H 30 V 100 H 0 V 50 Z', color: '#ef4444' },
  { id: 'lock', label: 'Lock', path: 'M 25 40 V 25 A 25 25 0 0 1 75 25 V 40 H 85 V 100 H 15 V 40 Z M 35 40 H 65 V 25 A 15 15 0 0 0 35 25 Z', color: '#d946ef' },

  // Abstract Patterns
  { id: 'zigzag', label: 'Zigzag', path: 'M 0 20 L 20 0 L 40 20 L 60 0 L 80 20 L 100 0 V 80 L 80 100 L 60 80 L 40 100 L 20 80 L 0 100 Z', color: '#f43f5e' },
  { id: 'spiral', label: 'Swirl', path: 'M 50 0 C 80 0 100 20 100 50 C 100 80 80 100 50 100 C 20 100 0 80 0 50 C 0 20 20 0 50 0 M 50 20 C 35 20 20 35 20 50 C 20 65 35 80 50 80 C 65 80 80 65 80 50 C 80 40 70 30 60 30', color: '#8b5cf6' },
  { id: 'steps', label: 'Steps', path: 'M 0 100 V 80 H 20 V 60 H 40 V 40 H 60 V 20 H 80 V 0 H 100 V 100 Z', color: '#10b981' },
  { id: 'stairs', label: 'Stairs', path: 'M 0 100 L 20 80 L 40 80 L 60 60 L 80 60 L 100 40 V 100 Z', color: '#ec4899' },

  // Organic 2
  { id: 'bean', label: 'Bean', path: 'M 50 10 C 80 10 90 40 90 60 C 90 90 60 90 50 80 C 40 90 10 90 10 60 C 10 40 20 10 50 10 Z', color: '#b91c1c' },
  { id: 'egg', label: 'Egg', path: 'M 50 0 C 80 0 100 50 100 70 C 100 90 80 100 50 100 C 20 100 0 90 0 70 C 0 50 20 0 50 0 Z', color: '#fef3c7' },
  { id: 'pebble', label: 'Pebble', path: 'M 40 10 C 70 -10 100 20 90 60 C 80 90 50 110 20 80 C -10 50 10 30 40 10 Z', color: '#6b7280' },
  { id: 'splat', label: 'Splat', path: 'M 50 10 L 60 0 L 70 20 L 90 10 L 80 40 L 100 50 L 80 60 L 90 90 L 60 80 L 50 100 L 40 80 L 10 90 L 20 60 L 0 50 L 20 40 L 10 10 L 40 20 Z', color: '#a3e635' },

  // Tech / UI 2
  { id: 'display', label: 'Monitor', path: 'M 0 10 H 100 V 70 H 60 L 70 90 H 30 L 40 70 H 0 Z', color: '#334155' },
  { id: 'frame', label: 'Frame', path: 'M 0 0 H 100 V 100 H 0 V 0 M 10 10 V 90 H 90 V 10 H 10 Z', color: '#94a3b8' },
  { id: 'window', label: 'Window', path: 'M 0 0 H 100 V 100 H 0 Z M 50 0 V 100 M 0 50 H 100', color: '#38bdf8' },
  { id: 'search', label: 'Search', path: 'M 40 10 A 30 30 0 1 0 40 70 A 30 30 0 1 0 40 10 M 65 65 L 95 95', color: '#6366f1' },

  // Decorative
  { id: 'diamond-alt', label: 'Jewel', path: 'M 50 0 L 85 20 L 100 50 L 85 80 L 50 100 L 15 80 L 0 50 L 15 20 Z', color: '#0ea5e9' },
  { id: 'hexagon-alt', label: 'Cell', path: 'M 25 0 L 75 0 L 100 50 L 75 100 L 25 100 L 0 50 Z', color: '#f59e0b' },
  { id: 'pentagon', label: 'Pentagon', path: 'M 50 0 L 100 38 L 81 100 H 19 L 0 38 Z', color: '#84cc16' },
  { id: 'shuriken', label: 'Ninja', path: 'M 50 0 L 60 40 L 100 50 L 60 60 L 50 100 L 40 60 L 0 50 L 40 40 Z', color: '#1e293b' },
];
