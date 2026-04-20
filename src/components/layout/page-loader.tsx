
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const [animationKey, setAnimationKey] = useState(0);

  // Hide loader on new page load
  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Show loader on link click
  const handleLinkClick = useCallback((event: MouseEvent) => {
    try {
      const target = event.target as HTMLElement;
      // Find the closest 'a' tag, in case the click is on an element inside a link
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        const targetAttr = anchor.getAttribute('target');
        
        if (!href) return;

        const url = new URL(href, window.location.origin);
        
        // Don't show for external links or new tabs
        if (url.origin !== window.location.origin || targetAttr === '_blank' || event.ctrlKey || event.metaKey) {
          return;
        }

        // Don't show for same-page hash links
        if (url.pathname === pathname && url.hash) {
            return;
        }
        // Don't show if the path is identical (and there's no search/hash)
        if (url.href === window.location.href) {
            return;
        }
        
        setIsLoading(true);
        setAnimationKey(prev => prev + 1); // Ensure animation re-runs
      }
    } catch (err) {
      // Ignore errors from invalid URLs (like 'mailto:')
    }
  }, [pathname]);

  useEffect(() => {
    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [handleLinkClick]);
  
  // Stop loading if the user uses browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setIsLoading(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key={animationKey}
            className="h-full bg-gradient-to-r from-primary via-blue-500 to-emerald-500"
            initial={{ width: "0%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 1.5, ease: "circOut" }}
            exit={{ width: "100%", opacity: 0, transition: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
