package com.pharma.service;

import com.pharma.dto.response.DashboardStatsResponse;
import com.pharma.model.enums.OrderStatus;
import com.pharma.model.enums.Role;
import com.pharma.repository.OrderRepository;
import com.pharma.repository.ProductRepository;
import com.pharma.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        LocalDateTime startOfMonth = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);

        // Revenue
        stats.setTotalRevenue(orderRepository.sumTotalAmount());
        stats.setTodayRevenue(orderRepository.sumTotalAmountByDateRange(startOfDay, endOfDay));
        stats.setMonthRevenue(orderRepository.sumTotalAmountByDateRange(startOfMonth, endOfDay));

        if (stats.getTotalRevenue() == null)
            stats.setTotalRevenue(BigDecimal.ZERO);
        if (stats.getTodayRevenue() == null)
            stats.setTodayRevenue(BigDecimal.ZERO);
        if (stats.getMonthRevenue() == null)
            stats.setMonthRevenue(BigDecimal.ZERO);

        // Orders
        stats.setTotalOrders(orderRepository.count());
        stats.setTodayOrders(orderRepository.countByOrderDateBetween(startOfDay, endOfDay));

        // Products
        stats.setTotalProducts(productRepository.count());
        stats.setLowStockProducts(productRepository.countByStockQuantityLessThanAndIsDeletedFalse(10)); // Assuming 10
                                                                                                        // is low stock

        // Customers
        stats.setTotalCustomers(userRepository.countByRole(Role.CUSTOMER));
        stats.setNewCustomersThisMonth(userRepository.countByRoleAndCreatedAtAfter(Role.CUSTOMER, startOfMonth));

        // Orders by Status
        Map<String, Long> statusMap = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            statusMap.put(status.name(), orderRepository.countByStatus(status));
        }
        stats.setOrdersByStatus(statusMap);

        return stats;
    }
}
