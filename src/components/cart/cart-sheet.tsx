'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useCart } from '@/hooks/use-cart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IndianRupee, Plus, Minus, Trash2, ShoppingCart, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { resolveImagePath, cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export function CartSheet({ className }: { className?: string }) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, subtotal } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Button variant="outline" size="icon" className={cn("relative rounded-xl", className)} disabled>
        <ShoppingCart className="h-5 w-5" />
        <span className="sr-only">Open cart</span>
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className={cn("relative rounded-xl hover:border-primary/50 transition-all", className)}>
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50">
              {totalItems}
            </span>
          )}
          <span className="sr-only">Open cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-6">
        <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-black flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-500" />
              <span>Draft Order Items ({totalItems})</span>
            </SheetTitle>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
              >
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => {
                  const itemKey = item.cartItemId || String(item.id);
                  const imgSrc = resolveImagePath(item.image || item.imageUrl || (item.imageUrls && item.imageUrls[0]) || '/uploads/hero.png');
                  const unitPrice = Number(item.sellingPrice || item.unitPrice || 0);
                  const lineTotal = unitPrice * item.quantity;

                  return (
                    <div
                      key={itemKey}
                      className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-18 w-18 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                          <Image
                            src={imgSrc}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug">
                                {item.name}
                              </h4>
                              <button
                                type="button"
                                className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 shrink-0"
                                onClick={() => removeItem(itemKey)}
                                title="Remove item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Attributes / Options Badge */}
                            {(item.selectedAttributesFormatted || item.selectedSize) && (
                              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                                {item.selectedAttributesFormatted || `Size: ${item.selectedSize}`}
                              </p>
                            )}

                            {/* Custom Inscription Text */}
                            {item.customText && (
                              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 line-clamp-1">
                                <Sparkles size={10} className="shrink-0" /> "{item.customText}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                              ₹{unitPrice.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ unit</span>
                            </span>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              ₹{lineTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Modifier Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Quantity:
                        </span>
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-lg text-slate-600 hover:bg-white dark:hover:bg-slate-800"
                            onClick={() => updateQuantity(itemKey, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val > 0) {
                                updateQuantity(itemKey, val);
                              }
                            }}
                            className="h-6 w-12 border-0 bg-transparent text-center p-0 text-xs font-black focus-visible:ring-0"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-lg text-slate-600 hover:bg-white dark:hover:bg-slate-800"
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <SheetFooter className="mt-auto space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Items In Draft</span>
                  <span className="text-slate-900 dark:text-white font-black">{totalItems} pcs</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Subtotal</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 flex items-center">
                    <IndianRupee size={16} className="mr-0.5" />
                    {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <SheetClose asChild>
                <Button asChild size="lg" className="w-full h-12 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                  <Link href="/checkout-cart" className="flex items-center justify-center gap-2">
                    <span>Order All in Multiple ({totalItems})</span>
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 dark:text-white">Your draft order is empty</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Add quick selling products to draft to order multiple items together in one checkout.
              </p>
            </div>
            <SheetClose asChild>
              <Button asChild variant="outline" className="rounded-xl font-bold text-xs mt-2">
                <Link href="/products">Explore Quick Products</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
