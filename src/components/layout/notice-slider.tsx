'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
  Zap,
  Award,
  X,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface NoticeItem {
  id: string;
  badge: string;
  badgeBg?: string;
  badgeColor?: string;
  icon: React.ElementType;
  text: string;
  highlight?: string;
  link?: string;
  linkText?: string;
}

const DUMMY_NOTICES: NoticeItem[] = [
  {
    id: '1',
    badge: 'FESTIVE OFFER',
    badgeBg: 'bg-amber-500/20 border-amber-400/30',
    badgeColor: 'text-amber-300',
    icon: Sparkles,
    text: 'Flat 30% OFF on all customized bulk printing orders!',
    highlight: 'Code: BULK30',
    link: '/products',
    linkText: 'Shop Now',
  },
  {
    id: '2',
    badge: 'EXPRESS DELIVERY',
    badgeBg: 'bg-blue-500/20 border-blue-400/30',
    badgeColor: 'text-blue-300',
    icon: Truck,
    text: 'Free Pan-India express shipping on orders above ₹999',
    highlight: '500+ Cities',
    link: '/products',
    linkText: 'Explore',
  },
  {
    id: '3',
    badge: 'SAME DAY DISPATCH',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/30',
    badgeColor: 'text-emerald-300',
    icon: Zap,
    text: 'Orders placed before 12:00 PM are dispatched on the same day!',
    highlight: 'Super Fast',
    link: '/products',
    linkText: 'Order Now',
  },
  {
    id: '4',
    badge: 'DESIGN QUESTS',
    badgeBg: 'bg-purple-500/20 border-purple-400/30',
    badgeColor: 'text-purple-300',
    icon: Award,
    text: 'Participate in weekly design contests and win up to ₹10,000!',
    highlight: 'Join Now',
    link: '/contests',
    linkText: 'View Quests',
  },
  {
    id: '5',
    badge: 'SPECIAL ANNOUNCEMENT',
    badgeBg: 'bg-rose-500/20 border-rose-400/30',
    badgeColor: 'text-rose-300',
    icon: Megaphone,
    text: '500+ New premium templates added for Business Cards & Flyers',
    highlight: 'Free Access',
    link: '/templates',
    linkText: 'Browse Templates',
  },
];

interface NoticeSliderProps {
  className?: string;
  variant?: 'dark' | 'glass';
}

export function NoticeSlider({ className, variant = 'dark' }: NoticeSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobilePaused, setIsMobilePaused] = useState(false);

  useEffect(() => {
    if (isPaused || isDismissed) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % DUMMY_NOTICES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, isDismissed]);

  if (isDismissed) return null;

  const currentNotice = DUMMY_NOTICES[currentIndex];
  const IconComponent = currentNotice.icon;

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % DUMMY_NOTICES.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + DUMMY_NOTICES.length) % DUMMY_NOTICES.length);
  };

  const slideVariants = {
    initial: (dir: number) => ({
      y: dir > 0 ? 18 : -18,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -18 : 18,
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn(
        'relative w-full h-10 sm:h-11 md:h-12 z-40 overflow-hidden flex items-center transition-colors duration-300 select-none border-b border-white/20 shadow-md',
        variant === 'dark'
          ? 'bg-gradient-to-r from-[#0a0a24] via-[#141440] to-[#222254] text-white'
          : 'bg-[#1a1a4e] text-white border-b border-white/20 shadow-md',
        className
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. SMALL SCREENS (< md): SEAMLESS INFINITE MARQUEE STYLE
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="flex md:hidden w-full h-full relative items-center overflow-hidden"
        onTouchStart={() => setIsMobilePaused(true)}
        onTouchEnd={() => setIsMobilePaused(false)}
        onMouseEnter={() => setIsMobilePaused(true)}
        onMouseLeave={() => setIsMobilePaused(false)}
      >
        {/* Left & Right gradient edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0a0a24] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#222254] to-transparent z-10 pointer-events-none" />

        {/* Continuous Marquee Track */}
        <motion.div
          animate={isMobilePaused ? {} : { x: ['0%', '-50%'] }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex items-center gap-6 whitespace-nowrap will-change-transform"
        >
          {/* Double list to create seamless infinite loop */}
          {[...DUMMY_NOTICES, ...DUMMY_NOTICES].map((notice, idx) => {
            const ItemIcon = notice.icon;
            return (
              <Link
                key={`marquee-${notice.id}-${idx}`}
                href={notice.link || '/products'}
                className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-yellow-200 transition-colors group flex-shrink-0"
              >
                {/* Badge */}
                <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border border-white/40 bg-white/15 text-white uppercase shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                  {notice.badge}
                </span>

                {/* Icon */}
                <ItemIcon className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />

                {/* Text */}
                <span className="font-semibold text-white/95">
                  {notice.text}
                </span>

                {/* Highlight */}
                {notice.highlight && (
                  <span className="font-black text-yellow-300 bg-yellow-400/10 px-1.5 py-0.2 rounded border border-yellow-300/30">
                    {notice.highlight}
                  </span>
                )}

                {/* Separator icon between items */}
                <span className="text-white/30 text-xs font-mono ml-4">✦</span>
              </Link>
            );
          })}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. DESKTOP SCREENS (>= md): INTERACTIVE CAROUSEL SLIDER
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:flex w-full h-full px-4 lg:px-6 items-center justify-between gap-3"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Arrow Controls */}
        <button
          onClick={handlePrev}
          type="button"
          aria-label="Previous notice"
          className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 border border-white/40 transition-all flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Notice Content Slider */}
        <div className="flex-1 overflow-hidden h-full flex items-center justify-center relative min-w-0">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentNotice.id}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center gap-3 text-center min-w-0 w-full px-2 py-1"
            >
              {/* Badge with White Border */}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-black tracking-wider px-3.5 py-1 rounded-full border-2 border-white shadow-md flex-shrink-0 uppercase bg-white/20 text-white'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                {currentNotice.badge}
              </span>

              {/* Icon */}
              <IconComponent className="w-4 h-4 text-yellow-300 flex-shrink-0 drop-shadow-sm" />

              {/* Notice text */}
              <p className="text-xs sm:text-sm font-bold tracking-tight text-white truncate max-w-full leading-normal">
                {currentNotice.text}{' '}
                {currentNotice.highlight && (
                  <span className="font-extrabold text-yellow-300 underline underline-offset-2 ml-1">
                    {currentNotice.highlight}
                  </span>
                )}
              </p>

              {/* Link CTA with White Border */}
              {currentNotice.link && (
                <Link
                  href={currentNotice.link}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white hover:text-[#1a1a4e] transition-all bg-white/15 hover:bg-white border-2 border-white shadow-md px-3.5 py-1 rounded-lg flex-shrink-0 ml-1.5"
                >
                  {currentNotice.linkText || 'Learn More'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Controls + Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleNext}
            type="button"
            aria-label="Next notice"
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 border border-white/40 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1.5px] bg-white/40 mx-1 block" />
          <button
            onClick={() => setIsDismissed(true)}
            type="button"
            aria-label="Dismiss notice bar"
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
