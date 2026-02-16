import api from './api';
import { Order, ApiResponse, PageResponse } from '../types';

export const orderService = {
  createOrder: async (shippingAddress: string, paymentMethod: string, addressId?: number) => {
    interface OrderPayload {
      shippingAddress: string;
      paymentMethod: string;
      addressId?: number;
    }
    const payload: OrderPayload = { shippingAddress, paymentMethod };
    if (addressId) {
      payload.addressId = addressId;
    }
    const response = await api.post<ApiResponse<Order>>('/orders', payload);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await api.get<ApiResponse<Order[]>>('/orders');
    return response.data;
  },

  getOrderById: async (id: number) => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  // Admin endpoints
  getAllOrders: async (page = 0, size = 20) => {
    const response = await api.get<ApiResponse<PageResponse<Order>>>('/admin/orders', {
      params: { page, size },
    });
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await api.put<ApiResponse<Order>>(`/admin/orders/${orderId}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  downloadReceipt: async (orderId: number) => {
    const response = await api.get(`/orders/${orderId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadOrdersExport: async () => {
    const response = await api.get('/orders/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};
