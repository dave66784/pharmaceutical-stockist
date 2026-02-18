package com.pharma.service;

import com.pharma.dto.request.OrderRequest;
import com.pharma.exception.InsufficientStockException;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.*;
import com.pharma.model.enums.OrderStatus;
import com.pharma.model.enums.PaymentStatus;
import com.pharma.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final UserService userService;
    private final ProductService productService;
    private final EmailService emailService;

    @Transactional
    public Order createOrder(String email, OrderRequest request) {
        User user = userService.getUserByEmail(email);
        Cart cart = cartService.getCartByUser(email);

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Validate stock availability
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }
        }

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(request.getShippingAddress());
        order.setAddressId(request.getAddressId());
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(PaymentStatus.PENDING);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getProduct().getPrice());

            order.getOrderItems().add(orderItem);

            BigDecimal itemTotal = cartItem.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            // Reduce stock
            Product product = cartItem.getProduct();
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
        }

        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);

        // Clear cart
        cartService.clearCart(email);

        // Send notification
        emailService.sendOrderPlacedNotification(savedOrder);

        return savedOrder;
    }

    public List<Order> getUserOrders(String email) {
        User user = userService.getUserByEmail(email);
        return orderRepository.findByUser(user);
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    public Page<Order> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable);
    }

    public List<Order> getAllOrdersList() {
        return orderRepository.findAll();
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
