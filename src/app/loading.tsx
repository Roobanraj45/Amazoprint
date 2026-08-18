import React from 'react';
import { AmazonPrintLoader } from '@/components/ui/amazon-print-loader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
      <AmazonPrintLoader 
        size="md" 
        showText={true}
        showFeatures={true}
        intervalDuration={1500}
      />
    </div>
  );
}
