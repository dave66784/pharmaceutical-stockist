package com.pharma.service;

import com.pharma.dto.response.DashboardStatsResponse;
import com.pharma.dto.response.DailyRevenueDto;
import com.pharma.dto.response.ExpiringProductDto;
import com.pharma.dto.response.ProductSalesDto;
import com.pharma.model.Product;
import com.pharma.model.enums.OrderStatus;
import com.pharma.model.enums.Role;
import com.pharma.repository.OrderRepository;
import com.pharma.repository.ProductRepository;
import com.pharma.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    private static final int LOW_STOCK_THRESHOLD = 10;

    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        // Revenue calculations
        stats.setTotalRevenue(calculateTotalRevenue());
        stats.setTodayRevenue(calculateTodayRevenue());
        stats.setMonthRevenue(calculateMonthRevenue());

        // Order statistics
        stats.setTotalOrders(orderRepository.count());
        stats.setTodayOrders(countTodayOrders());
        stats.setOrdersByStatus(getOrderCountByStatus());

        // Product statistics
        stats.setTotalProducts(productRepository.count());
        stats.setLowStockProducts(countLowStockProducts());
        stats.setOutOfStockProducts(countOutOfStockProducts());

        // Customer statistics
        stats.setTotalCustomers(userRepository.countByRole(Role.CUSTOMER));
        stats.setNewCustomersThisMonth(countNewCustomersThisMonth());

        return stats;
    }

    private BigDecimal calculateTotalRevenue() {
        BigDecimal revenue = orderRepository.sumTotalAmount();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private BigDecimal calculateTodayRevenue() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        BigDecimal revenue = orderRepository.sumTotalAmountByDateRange(startOfDay, endOfDay);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private BigDecimal calculateMonthRevenue() {
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);
        BigDecimal revenue = orderRepository.sumTotalAmountByDateRange(startOfMonth, endOfMonth);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private Long countTodayOrders() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return orderRepository.countByOrderDateBetween(startOfDay, endOfDay);
    }

    private Map<String, Long> getOrderCountByStatus() {
        Map<String, Long> statusCounts = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            Long count = orderRepository.countByStatus(status);
            statusCounts.put(status.name(), count);
        }
        return statusCounts;
    }

    private Long countLowStockProducts() {
        return productRepository.countByStockQuantityBetween(1, LOW_STOCK_THRESHOLD);
    }

    private Long countOutOfStockProducts() {
        return productRepository.countByStockQuantity(0);
    }

    private Long countNewCustomersThisMonth() {
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        return userRepository.countByRoleAndCreatedAtAfter(Role.CUSTOMER, startOfMonth);
    }

    // New analytics methods
    public List<DailyRevenueDto> getDailyRevenue(int days) {
        List<DailyRevenueDto> dailyRevenues = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);

            BigDecimal revenue = orderRepository.sumTotalAmountByDateRange(startOfDay, endOfDay);
            dailyRevenues.add(new DailyRevenueDto(date, revenue != null ? revenue : BigDecimal.ZERO));
        }

        return dailyRevenues;
    }

    public List<ExpiringProductDto> getExpiringProducts(int days) {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(days);

        List<Product> products = productRepository.findAll();

        return products.stream()
                .filter(p -> p.getExpiryDate() != null)
                .filter(p -> !p.getExpiryDate().isBefore(today) && !p.getExpiryDate().isAfter(futureDate))
                .map(p -> {
                    long daysUntil = ChronoUnit.DAYS.between(today, p.getExpiryDate());
                    return new ExpiringProductDto(
                            p.getId(),
                            p.getName(),
                            p.getExpiryDate(),
                            p.getStockQuantity(),
                            (int) daysUntil);
                })
                .sorted(Comparator.comparing(ExpiringProductDto::getDaysUntilExpiry))
                .collect(Collectors.toList());
    }

    public List<ProductSalesDto> getTopSellingProducts(int limit) {
        // Get all orders and aggregate by product
        Map<Long, ProductSalesDto> salesMap = new HashMap<>();

        orderRepository.findAll().forEach(order -> {
            order.getOrderItems().forEach(item -> {
                Long productId = item.getProduct().getId();
                String productName = item.getProduct().getName();
                Long quantity = (long) item.getQuantity();
                BigDecimal revenue = item.getPrice().multiply(BigDecimal.valueOf(quantity));

                salesMap.merge(
                        productId,
                        new ProductSalesDto(productId, productName, quantity, revenue),
                        (existing, newVal) -> new ProductSalesDto(
                                existing.getProductId(),
                                existing.getProductName(),
                                existing.getTotalQuantitySold() + newVal.getTotalQuantitySold(),
                                existing.getTotalRevenue().add(newVal.getTotalRevenue())));
            });
        });

        return salesMap.values().stream()
                .sorted((a, b) -> b.getTotalQuantitySold().compareTo(a.getTotalQuantitySold()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
