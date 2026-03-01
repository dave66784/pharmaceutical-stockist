import { create } from 'zustand';
import { cartService } from '../services/cartService';

interface CartState {
    cartItemCount: number;
    fetchCartCount: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
    cartItemCount: 0,
    fetchCartCount: async () => {
        try {
            const response = await cartService.getCart();
            if (response.data && response.data.items) {
                const totalItems = response.data.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                );
                set({ cartItemCount: totalItems });
            } else {
                set({ cartItemCount: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch cart count:', error);
            set({ cartItemCount: 0 });
        }
    }
}));
