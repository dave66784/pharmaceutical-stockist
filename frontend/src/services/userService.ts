import api from './api';

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    createdAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export const userService = {
    getAllUsers: async (page: number = 0, size: number = 20): Promise<PageResponse<User>> => {
        const response = await api.get('/admin/users', {
            params: { page, size }
        });
        return response.data.data;
    },

    getUsersByRole: async (role: string, page: number = 0, size: number = 20): Promise<PageResponse<User>> => {
        const response = await api.get(`/admin/users/role/${role}`, {
            params: { page, size }
        });
        return response.data.data;
    },

    updateUserRole: async (userId: number, role: string): Promise<User> => {
        const response = await api.put(
            `/admin/users/${userId}/role`,
            null,
            {
                params: { role }
            }
        );
        return response.data.data;
    },
};
