'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'wide' | 'banner' | 'large';
  isSimple?: boolean;
}

export function AmazoprintLogo(logoProps: LogoProps) {
  const {
    variant = 'wide',
    className,
    isSimple,
    ...props
  } = logoProps;
  
  /**
   * SIMPLE MODE: Icons/Sidebar
   */
  if (isSimple) {
    return (
      <div className={cn("relative w-8 h-8", className)} {...props}>
        <img
          src="/uploads/amazoLogo.png"
          alt="Amazoprint Logo"
          className="object-contain w-full h-full"
        />
      </div>
    );
  }

  /**
   * FULL MODE: Brand headers/Heroes
   * Reduced sizes by approx 20%
   */
  let dimensions = "h-14 w-44"; 
  
  if (variant === 'large') {
    dimensions = "h-20 w-60";
  } else if (variant === 'banner') {
    dimensions = "h-28 w-80";
  } else {
    dimensions = "h-16 w-52"; // Default wide
  }

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative flex items-center justify-center",
          "cursor-pointer group",
          dimensions
        )}
      >
        <div className="relative z-20 h-full w-full flex items-center justify-center">
          <img
            src="/uploads/amazoLogo.png"
            alt="Amazoprint Logo"
            className="object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105 w-full h-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
