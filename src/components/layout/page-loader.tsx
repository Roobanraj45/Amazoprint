'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AmazonPrintLoaderDialog } from '@/components/ui/amazon-print-loader-dialog';

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hide loader when route changes
  useEffect(() => {
    if (isLoading) {
      const exitTimer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(exitTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Handle link clicks across the application
  const handleLinkClick = useCallback((event: MouseEvent) => {
    try {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        const targetAttr = anchor.getAttribute('target');
        const isDownload = anchor.hasAttribute('download');
        
        if (!href || isDownload) return;

        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
          return;
        }

        const url = new URL(href, window.location.origin);
        
        if (url.origin !== window.location.origin || targetAttr === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          return;
        }

        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
          return;
        }

        if (url.href === window.location.href) {
          return;
        }
        
        setIsLoading(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, 6000);
      }
    } catch (err) {
      // Ignore URL parsing errors
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleLinkClick]);
  
  useEffect(() => {
    const handlePopState = () => {
      setIsLoading(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <AmazonPrintLoaderDialog
      isOpen={isLoading}
      onClose={() => setIsLoading(false)}
      showText={false} // Clean, minimal pure loader without text or card
      intervalDuration={1400} // Fast and fluid
      size="md"
    />
  );
}
