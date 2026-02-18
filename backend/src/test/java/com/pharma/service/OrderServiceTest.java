package com.pharma.service;

import com.pharma.dto.request.OrderRequest;
import com.pharma.exception.InsufficientStockException;
import com.pharma.model.*;
import com.pharma.model.enums.OrderStatus;
import com.pharma.model.enums.PaymentMethod;
import com.pharma.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartService cartService;

    @Mock
    private UserService userService;

    @Mock
    private ProductService productService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OrderService orderService;

    private User user;
    private Product product;
    private Cart cart;
    private OrderRequest orderRequest;
    private Order order;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("test@example.com");

        product = new Product();
        product.setId(1L);
        product.setName("Paracetamol");
        product.setPrice(BigDecimal.valueOf(10.0));
        product.setStockQuantity(100);

        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setQuantity(2);

        cart = new Cart();
        cart.setItems(Collections.singletonList(cartItem));

        orderRequest = new OrderRequest();
        orderRequest.setPaymentMethod(PaymentMethod.COD);
        orderRequest.setShippingAddress("123 Test St");

        order = new Order();
        order.setId(1L);
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
    }

    @Test
    void createOrder_Success() {
        when(userService.getUserByEmail(anyString())).thenReturn(user);
        when(cartService.getCartByUser(anyString())).thenReturn(cart);
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        Order createdOrder = orderService.createOrder("test@example.com", orderRequest);

        assertNotNull(createdOrder);
        verify(emailService, times(1)).sendOrderPlacedNotification(any(Order.class));
        verify(cartService, times(1)).clearCart(anyString());
    }

    @Test
    void createOrder_InsufficientStock() {
        product.setStockQuantity(1); // Less than cart quantity (2)
        when(userService.getUserByEmail(anyString())).thenReturn(user);
        when(cartService.getCartByUser(anyString())).thenReturn(cart);

        assertThrows(InsufficientStockException.class,
                () -> orderService.createOrder("test@example.com", orderRequest));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrder_ReferenceCheck() {
        when(userService.getUserByEmail(anyString())).thenReturn(user);
        when(cartService.getCartByUser(anyString())).thenReturn(cart);
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        Order result = orderService.createOrder("test@example.com", orderRequest);

        assertNotNull(result);
        assertEquals(OrderStatus.PENDING, result.getStatus());
    }

    @Test
    void getOrderById_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        Order found = orderService.getOrderById(1L);
        assertEquals(1L, found.getId());
    }

    @Test
    void updateOrderStatus_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order updated = orderService.updateOrderStatus(1L, OrderStatus.SHIPPED);

        assertEquals(OrderStatus.SHIPPED, updated.getStatus());
    }
}
