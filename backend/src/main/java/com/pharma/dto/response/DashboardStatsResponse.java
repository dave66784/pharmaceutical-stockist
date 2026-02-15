package com.pharma.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    // Revenue statistics
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;

    // Order statistics
    private Long totalOrders;
    private Long todayOrders;
    private Map<String, Long> ordersByStatus;

    // Product statistics
    private Long totalProducts;
    private Long lowStockProducts;
    private Long outOfStockProducts;

    // Customer statistics
    private Long totalCustomers;
    private Long newCustomersThisMonth;
}
