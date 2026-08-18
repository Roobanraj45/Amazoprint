'use client';

import { CartProvider } from '@/hooks/use-cart';
import { AmazonLoaderProvider } from '@/hooks/use-amazon-loader';
import { ReactNode } from 'react';

export default function CartProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <AmazonLoaderProvider>
        {children}
      </AmazonLoaderProvider>
    </CartProvider>
  );
}

