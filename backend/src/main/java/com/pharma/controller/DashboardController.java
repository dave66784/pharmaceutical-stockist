package com.pharma.controller;

import com.pharma.dto.response.ApiResponse;
import com.pharma.dto.response.DashboardStatsResponse;
import com.pharma.dto.response.DailyRevenueDto;
import com.pharma.dto.response.ExpiringProductDto;
import com.pharma.dto.response.ProductSalesDto;
import com.pharma.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard statistics retrieved successfully", stats));
    }

    @GetMapping("/daily-revenue")
    public ResponseEntity<ApiResponse<java.util.List<DailyRevenueDto>>> getDailyRevenue(
            @RequestParam(defaultValue = "7") int days) {
        java.util.List<DailyRevenueDto> revenue = dashboardService.getDailyRevenue(days);
        return ResponseEntity.ok(new ApiResponse<>(true, "Daily revenue retrieved successfully", revenue));
    }

    @GetMapping("/expiring-products")
    public ResponseEntity<ApiResponse<java.util.List<ExpiringProductDto>>> getExpiringProducts(
            @RequestParam(defaultValue = "30") int days) {
        java.util.List<ExpiringProductDto> products = dashboardService.getExpiringProducts(days);
        return ResponseEntity.ok(new ApiResponse<>(true, "Expiring products retrieved successfully", products));
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<java.util.List<ProductSalesDto>>> getTopSellingProducts(
            @RequestParam(defaultValue = "5") int limit) {
        java.util.List<ProductSalesDto> products = dashboardService.getTopSellingProducts(limit);
        return ResponseEntity.ok(new ApiResponse<>(true, "Top selling products retrieved successfully", products));
    }
}
