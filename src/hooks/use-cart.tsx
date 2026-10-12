'use client';

import React, { createContext, useReducer, useContext, useEffect, type ReactNode } from 'react';

// Define a flexible Product type for the cart
export type Product = {
  id: number;
  name: string;
  sellingPrice: number | string;
  cartItemId?: string;
  imageUrls?: (string | null)[] | null;
  image?: string;
  imageUrl?: string;
  quantity?: number;
  [key: string]: any; // Allow other properties like attributes, customizations, etc.
};

export type CartItem = Product & {
  cartItemId: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: string | number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string | number; quantity: number } }
  | { type: 'SET_STATE'; payload: CartState }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | undefined>(undefined);

export const getCartItemKey = (item: any): string => {
  if (item.cartItemId) return String(item.cartItemId);
  const attrKey = item.selectedAttributes && typeof item.selectedAttributes === 'object'
    ? Object.entries(item.selectedAttributes).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|')
    : '';
  const textKey = item.customText ? String(item.customText).trim() : '';
  return `${item.id || item.productId || 'item'}_${attrKey}_${textKey}`;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemKey = getCartItemKey(action.payload);
      const addQty = Math.max(1, Number(action.payload.quantity) || 1);
      const existingIndex = state.items.findIndex(item => getCartItemKey(item) === itemKey);

      if (existingIndex > -1) {
        return {
          ...state,
          items: state.items.map((item, idx) =>
            idx === existingIndex
              ? {
                  ...item,
                  ...action.payload,
                  cartItemId: itemKey,
                  quantity: item.quantity + addQty,
                }
              : item
          ),
        };
      }

      const newItem: CartItem = {
        ...action.payload,
        cartItemId: itemKey,
        quantity: addQty,
      };

      return {
        ...state,
        items: [...state.items, newItem],
      };
    }

    case 'REMOVE_ITEM': {
      const targetId = String(action.payload.id);
      return {
        ...state,
        items: state.items.filter(item => getCartItemKey(item) !== targetId && String(item.id) !== targetId && item.cartItemId !== targetId),
      };
    }

    case 'UPDATE_QUANTITY': {
      const targetId = String(action.payload.id);
      const newQty = Number(action.payload.quantity);

      if (newQty <= 0) {
        return {
          ...state,
          items: state.items.filter(item => getCartItemKey(item) !== targetId && String(item.id) !== targetId && item.cartItemId !== targetId),
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          (getCartItemKey(item) === targetId || String(item.id) === targetId || item.cartItemId === targetId)
            ? { ...item, quantity: newQty }
            : item
        ),
      };
    }

    case 'SET_STATE': {
      // Ensure all loaded items have valid cartItemId and quantity
      const sanitizedItems = (action.payload.items || []).map(item => ({
        ...item,
        cartItemId: getCartItemKey(item),
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
      return { items: sanitizedItems };
    }

    case 'CLEAR_CART': {
      return { items: [] };
    }

    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('amazoprint_cart');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'SET_STATE', payload: { items: parsed } });
        } else if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'SET_STATE', payload: parsed });
        } else {
          dispatch({ type: 'SET_STATE', payload: { items: [] } });
        }
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('amazoprint_cart', JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    if (typeof window === 'undefined') {
      return {
        items: [],
        addItem: () => { console.warn("Attempted to modify cart on the server"); },
        removeItem: () => { console.warn("Attempted to modify cart on the server"); },
        updateQuantity: () => { console.warn("Attempted to modify cart on the server"); },
        clearCart: () => { console.warn("Attempted to modify cart on the server"); },
        totalItems: 0,
        subtotal: 0,
      };
    }
    throw new Error('useCart must be used within a CartProvider');
  }

  const { state, dispatch } = context;

  const addItem = (product: Product) => dispatch({ type: 'ADD_ITEM', payload: product });
  const removeItem = (id: string | number) => dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  const updateQuantity = (id: string | number, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = state.items.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
  const subtotal = state.items.reduce((total, item) => total + (Number(item.sellingPrice || item.unitPrice || 0) * (Number(item.quantity) || 1)), 0);

  return {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal
  };
};
