import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CheckoutState {
    shippingAddress: string;
    addressId?: number;
    setCheckoutData: (shippingAddress: string, addressId?: number) => void;
    clearCheckoutData: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set) => ({
            shippingAddress: '',
            addressId: undefined,
            setCheckoutData: (shippingAddress, addressId) => set({ shippingAddress, addressId }),
            clearCheckoutData: () => set({ shippingAddress: '', addressId: undefined }),
        }),
        {
            name: 'checkout-storage',
        }
    )
);
