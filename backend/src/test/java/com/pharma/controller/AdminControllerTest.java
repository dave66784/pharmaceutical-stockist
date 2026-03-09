package com.pharma.controller;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Order;
import com.pharma.model.enums.OrderStatus;
import com.pharma.service.OrderExportService;
import com.pharma.service.OrderService;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private OrderService orderService;

    @Mock
    private OrderExportService orderExportService;

    @InjectMocks
    private AdminController adminController;

    private Order testOrder;
    private Page<Order> orderPage;

    @BeforeEach
    void setUp() {
        testOrder = new Order();
        testOrder.setId(1L);
        testOrder.setStatus(OrderStatus.PENDING);
        
        orderPage = new PageImpl<>(List.of(testOrder));
    }

    @Test
    void getAllOrders_ShouldReturnOrderPage() {
        when(orderService.getAllOrders(any(Pageable.class))).thenReturn(orderPage);

        ResponseEntity<ApiResponse<Page<Order>>> response = adminController.getAllOrders(0, 20, "orderDate");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Orders retrieved successfully", response.getBody().getMessage());
        assertEquals(1, response.getBody().getData().getContent().size());
        assertEquals(1L, response.getBody().getData().getContent().get(0).getId());
    }

    @Test
    void getOrdersByStatus_ShouldReturnOrderPage() {
        when(orderService.getOrdersByStatus(eq(OrderStatus.PENDING), any(Pageable.class))).thenReturn(orderPage);

        ResponseEntity<ApiResponse<Page<Order>>> response = adminController.getOrdersByStatus(OrderStatus.PENDING, 0, 20);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Orders retrieved successfully", response.getBody().getMessage());
        assertEquals(1, response.getBody().getData().getContent().size());
    }

    @Test
    void updateOrderStatus_ShouldReturnUpdatedOrder() {
        testOrder.setStatus(OrderStatus.SHIPPED);
        when(orderService.updateOrderStatus(1L, OrderStatus.SHIPPED)).thenReturn(testOrder);

        ResponseEntity<ApiResponse<Order>> response = adminController.updateOrderStatus(1L, OrderStatus.SHIPPED);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Order status updated successfully", response.getBody().getMessage());
        assertEquals(OrderStatus.SHIPPED, response.getBody().getData().getStatus());
    }

    @Test
    void exportOrders_ShouldReturnExcelFile() throws Exception {
        byte[] mockExcelContent = "mock excel content".getBytes();
        when(orderExportService.exportAllOrders(any(), any(), any())).thenReturn(mockExcelContent);

        ResponseEntity<byte[]> response = adminController.exportOrders("user@test.com", "2023-01-01", "2023-12-31");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(mockExcelContent, response.getBody());
    }
}
