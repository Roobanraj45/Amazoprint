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
        'relative w-full h-9 z-40 overflow-hidden flex items-center transition-colors duration-300 select-none',
        variant === 'dark'
          ? 'bg-gradient-to-r from-[#0d0d2b] via-[#1a1a4e] to-[#282860] text-white border-b border-white/10'
          : 'bg-[#1a1a4e]/90 backdrop-blur-md text-white border-b border-white/15 shadow-sm',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="w-full h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2">
        {/* Left Arrow Controls */}
        <button
          onClick={handlePrev}
          aria-label="Previous notice"
          className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
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
              className="flex items-center justify-center gap-2.5 text-center min-w-0 w-full px-2"
            >
              {/* Badge */}
              <span
                className={cn(
                  'hidden sm:inline-flex items-center gap-1 text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full border flex-shrink-0 uppercase',
                  currentNotice.badgeBg || 'bg-amber-500/20 border-amber-400/30',
                  currentNotice.badgeColor || 'text-amber-300'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {currentNotice.badge}
              </span>

              {/* Icon */}
              <IconComponent className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />

              {/* Notice text */}
              <p className="text-[11px] sm:text-xs font-semibold tracking-tight text-white/95 truncate max-w-full">
                {currentNotice.text}{' '}
                {currentNotice.highlight && (
                  <span className="font-extrabold text-yellow-300 underline underline-offset-2 ml-1">
                    {currentNotice.highlight}
                  </span>
                )}
              </p>

              {/* Link CTA */}
              {currentNotice.link && (
                <Link
                  href={currentNotice.link}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] font-black text-white hover:text-yellow-300 transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-md flex-shrink-0 ml-1"
                >
                  {currentNotice.linkText || 'Learn More'}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Controls + Close */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleNext}
            aria-label="Next notice"
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-[1px] bg-white/20 mx-1 hidden sm:block" />
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss notice bar"
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all hidden sm:block"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
