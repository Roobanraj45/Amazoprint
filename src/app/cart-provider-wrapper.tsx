'use client';

import { CartProvider } from '@/hooks/use-cart';
import { ReactNode } from 'react';

export default function CartProviderWrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
