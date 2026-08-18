'use client';

import React, { useState } from 'react';
import { AmazonPrintLoader } from '@/components/ui/amazon-print-loader';
import { AmazonPrintLoaderDialog } from '@/components/ui/amazon-print-loader-dialog';
import { Sparkles, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoaderDemoPage() {
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [speed, setSpeed] = useState(1500);
  const [showText, setShowText] = useState(true);
  const [showFeatures, setShowFeatures] = useState(true);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const triggerSimulatedLoad = () => {
    setIsOverlayOpen(true);
    setTimeout(() => {
      setIsOverlayOpen(false);
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Visual background mock items to showcase 30% translucency */}
      <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-pink-300/30 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-2 mb-8 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm text-blue-700 text-xs font-semibold border border-blue-200 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          AmazonPrint.in · Evolving Loader
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          9-Stage Print Art & Feature Words
        </h1>
        <p className="text-xs text-slate-600">
          Continuous creative morphing animations with cycling website feature highlights
        </p>
      </div>

      {/* Center Live Floating Loader Preview */}
      <div className="w-full max-w-sm bg-white/50 backdrop-blur-md rounded-3xl border border-white/80 shadow-lg p-8 flex flex-col items-center justify-center min-h-[260px] z-10">
        <AmazonPrintLoader
          size={size}
          intervalDuration={speed}
          showText={showText}
          showFeatures={showFeatures}
        />
      </div>

      {/* Control Buttons */}
      <div className="w-full max-w-sm mt-6 space-y-3 z-10">
        
        {/* Size Selection */}
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-white/80 text-xs font-medium shadow-xs">
          <span className="text-slate-600 pl-2">Size</span>
          <div className="flex gap-1">
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-3 py-1 rounded-xl uppercase text-[11px] font-bold transition-all ${
                  size === s ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/80'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Pills & Text Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              showFeatures ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white/70 text-slate-600 border-white/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showFeatures ? 'Features: ON' : 'Features: OFF'}
          </button>

          <button
            onClick={() => setShowText(!showText)}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              showText ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white/70 text-slate-600 border-white/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showText ? 'Text: ON' : 'Text: OFF'}
          </button>
        </div>

        {/* Trigger Fullscreen 30% Translucent Dialog */}
        <Button
          onClick={triggerSimulatedLoad}
          className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Test 30% Translucent Modal Overlay (6s)
        </Button>

      </div>

      {/* Fullscreen Overlay Test Modal */}
      <AmazonPrintLoaderDialog
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        size={size}
        showText={showText}
        showFeatures={showFeatures}
        intervalDuration={speed}
      />

    </div>
  );
}
