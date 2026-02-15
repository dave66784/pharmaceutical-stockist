import api from './api';
import { Cart, ApiResponse } from '../types';

export const cartService = {
  getCart: async () => {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data;
  },

  addToCart: async (productId: number, quantity: number) => {
    const response = await api.post<ApiResponse<Cart>>('/cart/items', {
      productId,
      quantity,
    });
    return response.data;
  },

  updateCartItem: async (itemId: number, quantity: number) => {
    const response = await api.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, null, {
      params: { quantity },
    });
    return response.data;
  },

  removeFromCart: async (itemId: number) => {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete<ApiResponse<void>>('/cart/clear');
    return response.data;
  },
};
