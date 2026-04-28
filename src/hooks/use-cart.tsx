'use client';

import React, { createContext, useReducer, useContext, useEffect, type ReactNode } from 'react';

// Define a more generic Product type for the cart
type Product = {
  id: number;
  name: string;
  sellingPrice: number | string;
  imageUrls?: (string | null)[] | null;
  [key: string]: any; // Allow other properties
};

export type CartItem = Product & { quantity: number };

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'SET_STATE'; payload: CartState }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
      };
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      };
    }
    case 'SET_STATE': {
      return action.payload;
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
        } else if (parsed && parsed.items) {
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
    // During SSR, the context will be undefined. Return a dummy state
    // so that components don't crash. They should use an `isMounted`
    // check to render the actual cart data only on the client.
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
  const removeItem = (id: number) => dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  const updateQuantity = (id: number, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = state.items.reduce((total, item) => total + Number(item.sellingPrice) * item.quantity, 0);

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
