package com.pharma.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class DashboardStatsResponse {
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private Long totalOrders;
    private Long todayOrders;
    private Long totalProducts;
    private Long lowStockProducts;
    private Long outOfStockProducts;
    private Long totalCustomers;
    private Long newCustomersThisMonth;
    private Map<String, Long> ordersByStatus;
}
