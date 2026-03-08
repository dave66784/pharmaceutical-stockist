import { create } from 'zustand';
import { cartService } from '../services/cartService';

import { calculateItemTotal } from '../utils/pricing';

interface CartState {
    cartItemCount: number;
    cartTotal: number;
    cartSubtotal: number;
    fetchCartCount: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
    cartItemCount: 0,
    cartTotal: 0,
    cartSubtotal: 0,
    fetchCartCount: async () => {
        try {
            const response = await cartService.getCart();
            if (response.data && response.data.items) {
                const totalItems = response.data.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                );
                const cartSubtotal = response.data.items.reduce(
                    (sum, item) => sum + calculateItemTotal(item.product, item.quantity),
                    0
                );
                set({ cartItemCount: totalItems, cartSubtotal, cartTotal: cartSubtotal });
            } else {
                set({ cartItemCount: 0, cartSubtotal: 0, cartTotal: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch cart count:', error);
            set({ cartItemCount: 0, cartSubtotal: 0, cartTotal: 0 });
        }
    }
}));
