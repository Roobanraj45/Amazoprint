'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AmazonPrintLoaderDialog } from '@/components/ui/amazon-print-loader-dialog';

interface LoaderOptions {
  message?: string | null;
  showText?: boolean;
  intervalDuration?: number;
  size?: 'sm' | 'md' | 'lg';
}

interface AmazonLoaderContextType {
  showLoader: (options?: LoaderOptions) => void;
  hideLoader: () => void;
  updateLoader: (options: Partial<LoaderOptions>) => void;
  isLoading: boolean;
}

const AmazonLoaderContext = createContext<AmazonLoaderContextType | undefined>(undefined);

export function AmazonLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<LoaderOptions>({});

  const showLoader = useCallback((opts?: LoaderOptions) => {
    setOptions(opts || {});
    setIsOpen(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsOpen(false);
  }, []);

  const updateLoader = useCallback((opts: Partial<LoaderOptions>) => {
    setOptions((prev) => ({ ...prev, ...opts }));
  }, []);

  return (
    <AmazonLoaderContext.Provider value={{ showLoader, hideLoader, updateLoader, isLoading: isOpen }}>
      {children}
      <AmazonPrintLoaderDialog
        isOpen={isOpen}
        onClose={hideLoader}
        message={options.message}
        showText={options.showText}
        intervalDuration={options.intervalDuration}
        size={options.size}
      />
    </AmazonLoaderContext.Provider>
  );
}

export function useAmazonLoader() {
  const context = useContext(AmazonLoaderContext);
  if (!context) {
    throw new Error('useAmazonLoader must be used within an AmazonLoaderProvider');
  }
  return context;
}
