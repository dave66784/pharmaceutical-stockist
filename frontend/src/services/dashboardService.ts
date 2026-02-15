import api from './api';

export interface DashboardStats {
    totalRevenue: number;
    todayRevenue: number;
    monthRevenue: number;
    totalOrders: number;
    todayOrders: number;
    ordersByStatus: Record<string, number>;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/admin/dashboard/stats');
        return response.data.data;
    },
};
