/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import api from '../../services/api';
import { useAuth } from './AuthContext';

export interface CartItem {
    id?: number;
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
}

interface CartContextType {
    outletId: number | null;
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
    removeFromCart: (menuItemId: number) => void;
    updateItemQuantity: (cartItemId: number, action: 'increase' | 'decrease') => Promise<void>;
    clearCart: (localOnly?: boolean) => void;
    cartTotal: number;
    syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const mapCartResponse = (cart: any): { outletId: number | null; items: CartItem[] } => {
    if (!Array.isArray(cart) || cart.length === 0) {
        return { outletId: null, items: [] };
    }

    const outletId = cart[0]?.menu_items?.outlets?.id ?? null;
    const items: CartItem[] = cart
        .filter((i: any) => i?.menu_items != null)
        .map((i: any) => ({
            id: i.id,
            menuItemId: i.menu_items.id,
            name: i.menu_items.name,
            price: Number(i.menu_items.price),
            quantity: i.quantity ?? 1,
        }));
    return { outletId, items };
};


export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, user } = useAuth();
    const [outletId, setOutletId] = useState<number | null>(null);
    const [items, setItems] = useState<CartItem[]>([]);

    const syncCart = useCallback(async () => {
        try {
            const res = await api.get('/cart');
            const { outletId: oid, items: itms } = mapCartResponse(res.data);
            setOutletId(oid);
            setItems(itms);
        } catch (err) {
            console.error('Failed to sync cart:', err);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'STUDENT') {
            syncCart();
        } else {
            setItems([]);
            setOutletId(null);
        }
    }, [isAuthenticated, user]);

    const addToCart = useCallback(async (item: Omit<CartItem, 'quantity'>) => {
        const res = await api.post('/cart/add', {
            menuItemId: item.menuItemId,
            quantity: 1,
        });
        const { outletId: oid, items: itms } = mapCartResponse(res.data);
        setOutletId(oid);
        setItems(itms);
    }, []);

    const removeFromCart = useCallback(async (menuItemId: number) => {
        try {
            const res = await api.delete(`/cart/remove/${menuItemId}`);
            const { outletId: oid, items: itms } = mapCartResponse(res.data);
            setOutletId(oid);
            setItems(itms);
        } catch (err) {
            console.error('Failed to remove from cart:', err);
        }
    }, []);

    const clearCart = useCallback(async (localOnly: boolean = false) => {
        try {
            if (!localOnly) {
                await api.delete('/cart/clear');
            }
            setItems([]);
            setOutletId(null);
        } catch (err) {
            console.error('Failed to clear cart:', err);
        }
    }, []);

    const updateItemQuantity = useCallback(async (cartItemId: number, action: 'increase' | 'decrease') => {
        try {
            const res = await api.put('/cart/update', { cartItemId, action });
            const { outletId: oid, items: itms } = mapCartResponse(res.data);
            setOutletId(oid);
            setItems(itms);
        } catch (err) {
            console.error('Failed to update cart item quantity:', err);
        }
    }, []);

    const cartTotal = useMemo(() => items.reduce((total, item) => total + item.price * item.quantity, 0), [items]);

    const value = useMemo(() => ({
        outletId,
        items,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        clearCart,
        cartTotal,
        syncCart
    }), [outletId, items, addToCart, removeFromCart, updateItemQuantity, clearCart, cartTotal, syncCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
