import api from './api';
import { Category, SubCategory } from '../types';

export const categoryService = {
    // Get all categories
    getAllCategories: async (): Promise<Category[]> => {
        const response = await api.get('/categories');
        return response.data.data;
    },

    // Get subcategories for a specific category
    getSubCategoriesByCategory: async (categoryId: number): Promise<SubCategory[]> => {
        const response = await api.get(`/categories/${categoryId}/subcategories`);
        return response.data.data;
    },

    // --- Admin Endpoints ---

    createCategory: async (data: { name: string; description?: string }): Promise<Category> => {
        const response = await api.post('/categories', data);
        return response.data.data;
    },

    updateCategory: async (id: number, data: { name: string; description?: string }): Promise<Category> => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data.data;
    },

    deleteCategory: async (id: number): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },

    createSubCategory: async (categoryId: number, data: { name: string; description?: string }): Promise<SubCategory> => {
        const response = await api.post(`/categories/${categoryId}/subcategories`, data);
        return response.data.data;
    },

    updateSubCategory: async (id: number, data: { name: string; description?: string; categoryId: number }): Promise<SubCategory> => {
        const response = await api.put(`/categories/subcategories/${id}`, data);
        return response.data.data;
    },

    deleteSubCategory: async (id: number): Promise<void> => {
        await api.delete(`/categories/subcategories/${id}`);
    }
};
