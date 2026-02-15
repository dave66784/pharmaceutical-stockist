import api from './api';
import { Product, ApiResponse, PageResponse } from '../types';

export const productService = {
  getAllProducts: async (page = 0, size = 12) => {
    const response = await api.get<ApiResponse<PageResponse<Product>>>('/products', {
      params: { page, size },
    });
    return response.data;
  },

  getProductById: async (id: number) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  searchProducts: async (query: string, page = 0, size = 12) => {
    const response = await api.get<ApiResponse<PageResponse<Product>>>('/products/search', {
      params: { query, page, size },
    });
    return response.data;
  },

  getProductsByCategory: async (category: string, page = 0, size = 12) => {
    const response = await api.get<ApiResponse<PageResponse<Product>>>(`/products/category/${category}`, {
      params: { page, size },
    });
    return response.data;
  },

  createProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<ApiResponse<Product>>('/products', productData);
    return response.data;
  },

  updateProduct: async (id: number, productData: Partial<Product>) => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/products/${id}`);
    return response.data;
  },

  bulkDeleteProducts: async (ids: number[]) => {
    console.log('Sending bulk delete request for IDs:', ids);
    const response = await api.delete<ApiResponse<any>>('/products/delete-bulk', {
      data: ids
    });
    return response.data;
  },
};
