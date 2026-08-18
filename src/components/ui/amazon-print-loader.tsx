'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Shirt, 
  Coffee, 
  CreditCard, 
  Stamp,
  Crop,
  PenTool,
  Layers,
  Palette,
  Printer,
  Compass,
  Aperture,
  Zap,
  Truck,
  ShieldCheck,
  Package,
  Award,
  CheckCircle2,
  Box
} from 'lucide-react';

export interface AmazonPrintLoaderProps {
  /**
   * Optional custom loading message.
   */
  message?: string | null;
  /**
   * If true, dynamically cycles the short stage text.
   * Default: true
   */
  dynamicText?: boolean;
  /**
   * Duration per stage in ms.
   * Default: 1500ms
   */
  intervalDuration?: number;
  /**
   * Loader size. Default: 'md' (~128px).
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional container CSS classes.
   */
  className?: string;
  /**
   * Show dynamic feature badge & text under the loader.
   * Default: true
   */
  showText?: boolean;
  /**
   * Show website feature highlight pill badges.
   * Default: true
   */
  showFeatures?: boolean;
}

export interface LoaderStage {
  id: string;
  actionText: string;
  featureTag: string;
  featureIcon: React.ElementType;
  themeColor: string;
  auraColor: string;
}

const STAGES: LoaderStage[] = [
  { 
    id: 'sketch', 
    actionText: 'Drafting artwork blueprint…',
    featureTag: 'AI Design Studio',
    featureIcon: Sparkles,
    themeColor: '#64748B',
    auraColor: 'bg-slate-400/25'
  },
  { 
    id: 'digital-pen', 
    actionText: 'Smoothing vector paths…',
    featureTag: '10,000+ Custom Templates',
    featureIcon: PenTool,
    themeColor: '#3B82F6',
    auraColor: 'bg-blue-500/25'
  },
  { 
    id: 'brush-stroke', 
    actionText: 'Blending rich pigment washes…',
    featureTag: 'Vibrant CMYK Matching',
    featureIcon: Palette,
    themeColor: '#EC4899',
    auraColor: 'bg-pink-500/25'
  },
  { 
    id: 'canvas-design', 
    actionText: 'Assembling sacred geometry…',
    featureTag: 'Custom Die-Cut & Spot UV',
    featureIcon: Layers,
    themeColor: '#8B5CF6',
    auraColor: 'bg-purple-500/25'
  },
  { 
    id: 'photo-edit', 
    actionText: 'Calibrating 300 DPI optics…',
    featureTag: 'Ultra-HD Pre-Flight Check',
    featureIcon: Aperture,
    themeColor: '#14B8A6',
    auraColor: 'bg-teal-500/25'
  },
  { 
    id: 'color-palette', 
    actionText: 'Harmonizing Pantone swatches…',
    featureTag: 'True-to-Life Color Accuracy',
    featureIcon: Palette,
    themeColor: '#F59E0B',
    auraColor: 'bg-amber-500/25'
  },
  { 
    id: 'laser-printing', 
    actionText: 'Precision laser printing…',
    featureTag: 'Industrial Print Precision',
    featureIcon: Printer,
    themeColor: '#0EA5E9',
    auraColor: 'bg-sky-500/30'
  },
  { 
    id: 'foil-packaging', 
    actionText: 'Applying gold foil & packaging…',
    featureTag: 'Luxury Finish & Fast Courier',
    featureIcon: Package,
    themeColor: '#F59E0B',
    auraColor: 'bg-amber-500/30'
  },
  { 
    id: 'product-mockup', 
    actionText: 'Your finished print is ready!',
    featureTag: '100% Quality Guaranteed',
    featureIcon: ShieldCheck,
    themeColor: '#10B981',
    auraColor: 'bg-emerald-500/30'
  },
];

export function AmazonPrintLoader({
  message,
  dynamicText = true,
  intervalDuration = 1500,
  size = 'md',
  className,
  showText = true,
  showFeatures = true,
}: AmazonPrintLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [productCycle, setProductCycle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, intervalDuration);
    return () => clearInterval(timer);
  }, [intervalDuration]);

  // Fast cycle for merchandise products on the final stage
  useEffect(() => {
    if (STAGES[stageIndex].id !== 'product-mockup') return;
    const pTimer = setInterval(() => {
      setProductCycle((prev) => (prev + 1) % 5);
    }, 1100);
    return () => clearInterval(pTimer);
  }, [stageIndex]);

  const sizeDimensions = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  }[size];

  const currentStage = STAGES[stageIndex];
  const FeatureIcon = currentStage.featureIcon;

  return (
    <div className={cn('relative flex flex-col items-center justify-center select-none', className)}>
      
      {/* Dynamic ambient color aura that reacts to each stage */}
      <motion.div
        animate={{
          scale: [0.9, 1.2, 0.9],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'absolute -inset-4 rounded-full blur-2xl pointer-events-none transition-colors duration-700',
          currentStage.auraColor
        )}
      />

      {/* Central Evolving Visual Animation Stage */}
      <div className={cn('relative flex items-center justify-center', sizeDimensions)}>
        <AnimatePresence mode="wait">
          {stageIndex === 0 && <StagePencilBlueprint key="stg-0" />}
          {stageIndex === 1 && <StageVectorBezier key="stg-1" />}
          {stageIndex === 2 && <StageArtisanBrush key="stg-2" />}
          {stageIndex === 3 && <StageSacredGeometryCanvas key="stg-3" />}
          {stageIndex === 4 && <StageCameraOpticsCrop key="stg-4" />}
          {stageIndex === 5 && <StageCmykColorPrism key="stg-5" />}
          {stageIndex === 6 && <StageLaserPrintEngine key="stg-6" />}
          {stageIndex === 7 && <StageFoilPackaging key="stg-7" />}
          {stageIndex === 8 && <StageProductShowcase key="stg-8" cycle={productCycle} />}
        </AnimatePresence>
      </div>

      {/* Website Features & Mini Words Highlights */}
      {(showText || showFeatures) && (
        <div className="mt-3.5 flex flex-col items-center justify-center gap-1.5 text-center min-h-[44px]">
          
          {/* Subtle Website Feature Pill */}
          {showFeatures && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`feat-${currentStage.id}`}
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 dark:bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-sm"
              >
                <FeatureIcon className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-wide uppercase">
                  {currentStage.featureTag}
                </span>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Action Status Line */}
          {showText && (
            <AnimatePresence mode="wait">
              <motion.p
                key={`text-${currentStage.id}`}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight font-sans drop-shadow-xs"
              >
                {message || (dynamicText ? currentStage.actionText : 'Crafting your print…')}
              </motion.p>
            </AnimatePresence>
          )}

        </div>
      )}

    </div>
  );
}

// =========================================================================
// 9 RICH VECTOR ART ANIMATIONS (Expanded with Gold Foil & Packaging)
// =========================================================================

/**
 * 1. PENCIL & GOLDEN SPIRAL BLUEPRINT
 */
function StagePencilBlueprint() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85, rotate: 8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* Rotating Architectural Grid Compass Ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="36"
          stroke="#94A3B8"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '50px', originY: '50px' }}
        />

        {/* Blueprint Golden Spiral Path */}
        <motion.path
          d="M 50 18 C 68 18, 82 32, 82 50 C 82 68, 68 82, 50 82 C 32 82, 22 68, 22 50 C 22 36, 34 28, 50 28 C 62 28, 70 38, 70 50 C 70 60, 60 68, 50 68"
          stroke="#475569"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
        />

        {/* Diagonal Crosshatch Shading Lines */}
        <line x1="28" y1="36" x2="38" y2="26" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="62" y1="74" x2="72" y2="64" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="32" y1="70" x2="42" y2="60" stroke="#CBD5E1" strokeWidth="1" />

        {/* Drafting Pencil Assembly */}
        <motion.g
          animate={{
            x: [0, 8, -4, 6, 0],
            y: [0, -6, 8, -2, 0],
            rotate: [-20, -10, -25, -15, -20],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '50px', originY: '50px' }}
        >
          <polygon points="50,50 56,36 44,36" fill="#F59E0B" />
          <polygon points="50,50 52,44 48,44" fill="#0F172A" />
          <rect x="44" y="8" width="12" height="28" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.2" />
          <rect x="44" y="2" width="12" height="8" rx="2" fill="#F43F5E" />
          <rect x="44" y="8" width="12" height="3" fill="#94A3B8" />
        </motion.g>

        {/* Drafting Lead Sparks */}
        <motion.circle cx="50" cy="50" r="2.5" fill="#3B82F6" animate={{ scale: [0, 1.8, 0], opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
      </svg>
    </motion.div>
  );
}

/**
 * 2. DIGITAL VECTOR & BÉZIER STYLUS
 */
function StageVectorBezier() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* Animated Smooth S-Curve */}
        <motion.path
          d="M 18 70 C 26 22, 74 22, 82 70"
          stroke="#2563EB"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Vector Anchor Nodes & Tangent Handles */}
        <motion.g animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <line x1="26" y1="22" x2="74" y2="22" stroke="#60A5FA" strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="26" cy="22" r="3.5" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="1.2" />
          <circle cx="74" cy="22" r="3.5" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="1.2" />
        </motion.g>

        {/* Start / End Points */}
        <rect x="15" y="67" width="6" height="6" fill="#1D4ED8" rx="1" />
        <rect x="79" y="67" width="6" height="6" fill="#1D4ED8" rx="1" />

        {/* Stylus Apple-Pencil Moving Along Curve */}
        <motion.g
          animate={{
            x: [0, 20, 45, 60, 0],
            y: [0, -35, -35, 0, 0],
            rotate: [25, 45, 15, 30, 25],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M 22 66 L 36 28 L 41 30 L 26 68 Z" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.2" />
          <polygon points="22,66 21,70 25,68" fill="#0F172A" />
          <path d="M 36 28 L 41 30 L 43 25 L 38 23 Z" fill="#3B82F6" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

/**
 * 3. ARTISAN BRUSH & FLUID WATERCOLOR WASH
 */
function StageArtisanBrush() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: 10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85, rotate: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* Layer 1: Magenta Watercolor Swirl */}
        <motion.path
          d="M 18 52 C 30 32, 52 68, 82 44"
          stroke="#EC4899"
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
        {/* Layer 2: Violet Watercolor Swirl */}
        <motion.path
          d="M 22 58 C 36 38, 60 70, 78 50"
          stroke="#8B5CF6"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.1, ease: 'easeInOut' }}
        />
        {/* Layer 3: Cyan Fluid Highlight */}
        <motion.path
          d="M 28 62 C 44 45, 66 65, 75 55"
          stroke="#06B6D4"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.2, ease: 'easeInOut' }}
        />

        {/* Paint Splatter Droplets */}
        <motion.circle cx="34" cy="30" r="2.5" fill="#EC4899" animate={{ scale: [0, 1.2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.1 }} />
        <motion.circle cx="78" cy="32" r="3" fill="#8B5CF6" animate={{ scale: [0, 1.3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
        <motion.circle cx="68" cy="74" r="2" fill="#06B6D4" animate={{ scale: [0, 1.4, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.5 }} />

        {/* Artist Paintbrush Sweeping */}
        <motion.g
          animate={{
            x: [-15, 15, -10, 10, -15],
            y: [5, -10, 8, -5, 5],
            rotate: [-15, 10, -20, 5, -15],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '55px', originY: '45px' }}
        >
          <path d="M 68 18 L 84 34 L 62 56 L 46 40 Z" fill="#92400E" stroke="#78350F" strokeWidth="1" />
          <path d="M 46 40 L 62 56 L 56 62 L 40 46 Z" fill="#94A3B8" />
          <path d="M 40 46 L 56 62 C 54 68, 44 72, 36 68 C 32 60, 36 50, 40 46 Z" fill="#EC4899" />
          <circle cx="36" cy="68" r="2" fill="#BE185D" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

/**
 * 4. GRAPHIC CANVAS & SACRED GEOMETRY
 */
function StageSacredGeometryCanvas() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: -15 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85, rotate: 15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* Canvas Frame */}
        <rect x="20" y="20" width="60" height="60" rx="8" stroke="#6366F1" strokeWidth="2" strokeDasharray="5 3" fill="#EEF2FF" fillOpacity="0.4" />

        {/* Rotating Isometric Cube / Diamond */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '50px', originY: '50px' }}
        >
          <polygon points="50,28 69,39 69,61 50,72 31,61 31,39" stroke="#4F46E5" strokeWidth="1.8" fill="#818CF8" fillOpacity="0.3" />
          <line x1="50" y1="50" x2="50" y2="72" stroke="#4F46E5" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="69" y2="39" stroke="#4F46E5" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="31" y2="39" stroke="#4F46E5" strokeWidth="1.5" />
        </motion.g>

        {/* Typography Stamp Marker */}
        <motion.text
          x="50"
          y="54"
          textAnchor="middle"
          fill="#4338CA"
          fontSize="14"
          fontWeight="900"
          fontFamily="sans-serif"
          animate={{ scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '50px', originY: '50px' }}
        >
          A
        </motion.text>

        {/* Selection Transform Handles */}
        <rect x="17" y="17" width="6" height="6" fill="#4F46E5" rx="1" />
        <rect x="77" y="17" width="6" height="6" fill="#4F46E5" rx="1" />
        <rect x="17" y="77" width="6" height="6" fill="#4F46E5" rx="1" />
        <rect x="77" y="77" width="6" height="6" fill="#4F46E5" rx="1" />
      </svg>
    </motion.div>
  );
}

/**
 * 5. CAMERA OPTICS & PRECISION PHOTO CROP
 */
function StageCameraOpticsCrop() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* Photo Artwork (Sunset Mountains) */}
        <rect x="22" y="24" width="56" height="52" rx="4" fill="#0D9488" fillOpacity="0.2" />
        <circle cx="40" cy="40" r="7" fill="#F59E0B" />
        <polygon points="26,70 46,48 58,60 74,44 78,70" fill="#0D9488" fillOpacity="0.7" />

        {/* Rule of Thirds Grid Lines */}
        <line x1="41" y1="24" x2="41" y2="76" stroke="#14B8A6" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="59" y1="24" x2="59" y2="76" stroke="#14B8A6" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="22" y1="41" x2="78" y2="41" stroke="#14B8A6" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="22" y1="59" x2="78" y2="59" stroke="#14B8A6" strokeWidth="0.8" strokeDasharray="2 2" />

        {/* Animated Crop Bounding Corners */}
        <motion.g
          animate={{
            scale: [1, 0.88, 1.05, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '50px', originY: '50px' }}
        >
          {/* Top-Left */}
          <path d="M 28 18 L 18 18 L 18 28" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
          {/* Top-Right */}
          <path d="M 72 18 L 82 18 L 82 28" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
          {/* Bottom-Left */}
          <path d="M 28 82 L 18 82 L 18 72" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
          {/* Bottom-Right */}
          <path d="M 72 82 L 82 82 L 82 72" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

/**
 * 6. CMYK COLOR PRISM & PANTONE SWATCHES
 */
function StageCmykColorPrism() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85, rotate: 20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* CMYK 4 Overlapping Color Wheels */}
        {/* Cyan */}
        <motion.circle cx="42" cy="40" r="16" fill="#06B6D4" fillOpacity="0.75" animate={{ scale: [0.9, 1.05, 0.9] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Magenta */}
        <motion.circle cx="58" cy="40" r="16" fill="#EC4899" fillOpacity="0.75" animate={{ scale: [1.05, 0.9, 1.05] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Yellow */}
        <motion.circle cx="50" cy="54" r="16" fill="#FACC15" fillOpacity="0.8" animate={{ scale: [0.95, 1.1, 0.95] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Key Black Center Core */}
        <circle cx="50" cy="45" r="7" fill="#0F172A" fillOpacity="0.9" />

        {/* Fanned Out Pantone Card Swatches */}
        <motion.g
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '50px', originY: '85px' }}
        >
          <rect x="42" y="55" width="16" height="30" rx="2" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.2" transform="rotate(-25 50 85)" />
          <rect x="42" y="55" width="16" height="30" rx="2" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.2" transform="rotate(0 50 85)" />
          <rect x="42" y="55" width="16" height="30" rx="2" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.2" transform="rotate(25 50 85)" />
          <circle cx="50" cy="80" r="2.5" fill="#334155" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

/**
 * 7. INDUSTRIAL LASER PRINTHEAD & CARRIAGE ROLLER
 */
function StageLaserPrintEngine() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* Industrial Printer Housing Frame */}
        <rect x="18" y="24" width="64" height="24" rx="4" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
        <rect x="24" y="32" width="52" height="8" rx="2" fill="#0F172A" />

        {/* Paper Sheet Rolling Out from Platen */}
        <motion.g
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="28" y="36" width="44" height="42" rx="2" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.2" />
          {/* Freshly Printed Artwork Strips on Sheet */}
          <rect x="34" y="42" width="32" height="4" rx="1" fill="#EC4899" />
          <rect x="34" y="48" width="24" height="4" rx="1" fill="#3B82F6" />
          <rect x="34" y="54" width="28" height="4" rx="1" fill="#10B981" />
          <rect x="34" y="60" width="16" height="4" rx="1" fill="#F59E0B" />
          {/* Registration Crosshairs */}
          <circle cx="31" cy="72" r="1.5" stroke="#94A3B8" strokeWidth="0.8" />
          <circle cx="69" cy="72" r="1.5" stroke="#94A3B8" strokeWidth="0.8" />
        </motion.g>

        {/* Moving Laser Carriage Head with UV Cyan Beam */}
        <motion.g
          animate={{ x: [-18, 18, -18] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          style={{ originY: '30px' }}
        >
          <rect x="46" y="28" width="8" height="12" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <line x1="50" y1="40" x2="50" y2="70" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <circle cx="50" cy="55" r="4" fill="#38BDF8" opacity="0.6" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

/**
 * 8. LUXURY GOLD FOIL STAMP & PACKAGING
 */
function StageFoilPackaging() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85, rotate: 10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {/* 3D Delivery Box Body */}
        <polygon points="50,22 82,36 82,66 50,82 18,66 18,36" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
        <line x1="50" y1="52" x2="50" y2="82" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="50" y1="52" x2="82" y2="36" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="50" y1="52" x2="18" y2="36" stroke="#F59E0B" strokeWidth="1.5" />

        {/* Gold Foil Seal Stamp */}
        <motion.circle
          cx="50"
          cy="48"
          r="10"
          fill="#F59E0B"
          stroke="#FEF3C7"
          strokeWidth="1.5"
          animate={{ scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M 46 48 L 49 51 L 55 45"
          stroke="#78350F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Iridescent Shimmer Sweep */}
        <motion.line
          x1="25"
          y1="25"
          x2="75"
          y2="75"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
          animate={{ opacity: [0, 0.8, 0], x: [-15, 15, -15] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />

        {/* Sparkles */}
        <motion.circle cx="75" cy="28" r="2.5" fill="#FBBF24" animate={{ scale: [0, 1.4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
        <motion.circle cx="25" cy="68" r="2" fill="#FBBF24" animate={{ scale: [0, 1.4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.5 }} />
      </svg>
    </motion.div>
  );
}

/**
 * 9. FINISHED PHYSICAL MERCHANDISE SHOWCASE
 */
function StageProductShowcase({ cycle }: { cycle: number }) {
  return (
    <motion.div
      key={`prod-${cycle}`}
      initial={{ opacity: 0, scale: 0.82, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.82, y: -8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        
        {/* A. Cotton T-Shirt */}
        {cycle === 0 && (
          <g>
            <path d="M 32 20 L 40 26 C 44 24, 56 24, 60 26 L 68 20 L 84 32 L 76 42 L 70 38 L 70 78 L 30 78 L 30 38 L 24 42 L 16 32 Z" fill="#059669" stroke="#047857" strokeWidth="1.8" />
            <motion.circle cx="50" cy="46" r="8" fill="#FBBF24" animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <path d="M 46 46 L 54 46" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {/* B. Ceramic Coffee Mug */}
        {cycle === 1 && (
          <g>
            <rect x="28" y="32" width="36" height="42" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
            <path d="M 64 38 C 76 38, 76 64, 64 64" stroke="#0369A1" strokeWidth="4" strokeLinecap="round" />
            <rect x="34" y="42" width="24" height="20" rx="3" fill="#FFFFFF" />
            <motion.circle cx="46" cy="52" r="5" fill="#F43F5E" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
            {/* Steam Trails */}
            <motion.path d="M 38 24 Q 40 18 44 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" animate={{ y: [-2, 2, -2] }} transition={{ duration: 1, repeat: Infinity }} />
            <motion.path d="M 48 22 Q 50 16 54 22" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" animate={{ y: [-3, 3, -3] }} transition={{ duration: 1.2, repeat: Infinity }} />
          </g>
        )}

        {/* C. Velvet Gold-Foil Visiting Card */}
        {cycle === 2 && (
          <g>
            <rect x="18" y="30" width="64" height="40" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
            <rect x="24" y="36" width="18" height="3" fill="#F59E0B" />
            <rect x="24" y="43" width="32" height="2.5" fill="#E2E8F0" />
            <rect x="24" y="49" width="24" height="2" fill="#94A3B8" />
            <circle cx="68" cy="50" r="9" fill="#F59E0B" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="68" y="53" textAnchor="middle" fill="#F59E0B" fontSize="8" fontWeight="bold">AP</text>
          </g>
        )}

        {/* D. Holographic Die-Cut Sticker */}
        {cycle === 3 && (
          <g>
            <path d="M 50 20 L 60 36 L 78 38 L 65 52 L 68 70 L 50 60 L 32 70 L 35 52 L 22 38 L 40 36 Z" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="2" />
            <circle cx="50" cy="46" r="10" fill="#EC4899" />
            <motion.path d="M 46 46 L 54 46" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" animate={{ rotate: 180 }} transition={{ duration: 2, repeat: Infinity }} />
          </g>
        )}

        {/* E. Framed Canvas Wall Poster */}
        {cycle === 4 && (
          <g>
            <rect x="22" y="18" width="56" height="64" rx="3" fill="#451A03" stroke="#292524" strokeWidth="2.5" />
            <rect x="28" y="24" width="44" height="52" fill="#F8FAFC" />
            <circle cx="44" cy="38" r="6" fill="#F59E0B" />
            <polygon points="30,66 48,46 56,56 64,44 70,66" fill="#0D9488" />
          </g>
        )}

        {/* Bursting Completion Sparkles */}
        <motion.circle cx="82" cy="22" r="3" fill="#10B981" animate={{ scale: [0, 1.5, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }} />
        <motion.circle cx="18" cy="74" r="2.5" fill="#3B82F6" animate={{ scale: [0, 1.4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
      </svg>
    </motion.div>
  );
}
