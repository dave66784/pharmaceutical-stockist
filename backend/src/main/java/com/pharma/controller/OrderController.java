package com.pharma.controller;

import com.pharma.dto.request.OrderRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Order;
import com.pharma.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<Order>> createOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication
    ) {
        Order order = orderService.createOrder(authentication.getName(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order created successfully", order));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getUserOrders(Authentication authentication) {
        List<Order> orders = orderService.getUserOrders(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Orders retrieved successfully", orders));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderById(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order retrieved successfully", order));
    }
}
