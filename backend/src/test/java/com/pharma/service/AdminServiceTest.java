package com.pharma.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pharma.dto.response.DashboardStatsResponse;
import com.pharma.model.enums.OrderStatus;
import com.pharma.model.enums.Role;
import com.pharma.repository.OrderRepository;
import com.pharma.repository.ProductRepository;
import com.pharma.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private AdminService adminService;

    @Test
    void getDashboardStats_ShouldReturnCompleteStats() {
        when(orderRepository.sumTotalAmount()).thenReturn(new BigDecimal("10000.00"));
        when(orderRepository.sumTotalAmountByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("1000.00")); // Mocks both today and month, they'll just return the same
        
        when(orderRepository.count()).thenReturn(500L);
        when(orderRepository.countByOrderDateBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(15L);

        when(productRepository.count()).thenReturn(200L);
        when(productRepository.countByStockQuantityLessThanAndIsDeletedFalse(anyInt())).thenReturn(25L);

        when(userRepository.countByRole(Role.CUSTOMER)).thenReturn(300L);
        when(userRepository.countByRoleAndCreatedAtAfter(eq(Role.CUSTOMER), any(LocalDateTime.class))).thenReturn(50L);

        when(orderRepository.countByStatus(OrderStatus.PENDING)).thenReturn(10L);
        when(orderRepository.countByStatus(OrderStatus.CONFIRMED)).thenReturn(5L);
        when(orderRepository.countByStatus(OrderStatus.SHIPPED)).thenReturn(15L);
        when(orderRepository.countByStatus(OrderStatus.DELIVERED)).thenReturn(400L);
        when(orderRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(70L);

        DashboardStatsResponse stats = adminService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(new BigDecimal("10000.00"), stats.getTotalRevenue());
        assertEquals(new BigDecimal("1000.00"), stats.getTodayRevenue());
        assertEquals(new BigDecimal("1000.00"), stats.getMonthRevenue());
        
        assertEquals(500L, stats.getTotalOrders());
        assertEquals(15L, stats.getTodayOrders());
        
        assertEquals(200L, stats.getTotalProducts());
        assertEquals(25L, stats.getLowStockProducts());
        
        assertEquals(300L, stats.getTotalCustomers());
        assertEquals(50L, stats.getNewCustomersThisMonth());
        
        assertEquals(5, stats.getOrdersByStatus().size());
        assertEquals(10L, stats.getOrdersByStatus().get(OrderStatus.PENDING.name()));
        assertEquals(5L, stats.getOrdersByStatus().get(OrderStatus.CONFIRMED.name()));
        assertEquals(15L, stats.getOrdersByStatus().get(OrderStatus.SHIPPED.name()));
        assertEquals(400L, stats.getOrdersByStatus().get(OrderStatus.DELIVERED.name()));
        assertEquals(70L, stats.getOrdersByStatus().get(OrderStatus.CANCELLED.name()));
    }

    @Test
    void getDashboardStats_WhenNullRevenues_ShouldDefaultToZero() {
        when(orderRepository.sumTotalAmount()).thenReturn(null);
        when(orderRepository.sumTotalAmountByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(null);
                
        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.countByOrderDateBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(0L);

        when(productRepository.count()).thenReturn(0L);
        when(productRepository.countByStockQuantityLessThanAndIsDeletedFalse(anyInt())).thenReturn(0L);

        when(userRepository.countByRole(Role.CUSTOMER)).thenReturn(0L);
        when(userRepository.countByRoleAndCreatedAtAfter(eq(Role.CUSTOMER), any(LocalDateTime.class))).thenReturn(0L);

        for (OrderStatus status : OrderStatus.values()) {
            when(orderRepository.countByStatus(status)).thenReturn(0L);
        }

        DashboardStatsResponse stats = adminService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(BigDecimal.ZERO, stats.getTotalRevenue());
        assertEquals(BigDecimal.ZERO, stats.getTodayRevenue());
        assertEquals(BigDecimal.ZERO, stats.getMonthRevenue());
    }
}
