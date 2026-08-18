'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AmazonPrintLoader } from './amazon-print-loader';

export interface AmazonPrintLoaderDialogProps {
  /**
   * Whether the loading overlay is visible.
   */
  isOpen: boolean;
  /**
   * Optional callback when close is requested.
   */
  onClose?: () => void;
  /**
   * Optional custom short text message.
   */
  message?: string | null;
  /**
   * Whether to show dynamic action text. Default: true.
   */
  showText?: boolean;
  /**
   * Whether to show website feature highlight badge. Default: true.
   */
  showFeatures?: boolean;
  /**
   * Transition speed in ms. Default: 1500ms.
   */
  intervalDuration?: number;
  /**
   * Loader size variant. Default: 'md'.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional container classes.
   */
  className?: string;
}

export function AmazonPrintLoaderDialog({
  isOpen,
  message,
  showText = true,
  showFeatures = true,
  intervalDuration = 1500,
  size = 'md',
  className,
}: AmazonPrintLoaderDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'fixed inset-0 z-[99999] flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md select-none pointer-events-auto',
            className
          )}
        >
          {/* Pure Evolving Creative Loader - Floating on 30% Transparent Translucent Backdrop */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AmazonPrintLoader
              size={size}
              message={message}
              showText={showText}
              showFeatures={showFeatures}
              intervalDuration={intervalDuration}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
