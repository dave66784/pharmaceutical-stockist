package com.pharma.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharma.dto.request.OrderRequest;
import com.pharma.exception.InsufficientStockException;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.Cart;
import com.pharma.model.CartItem;
import com.pharma.model.Order;
import com.pharma.model.OrderItem;
import com.pharma.model.Product;
import com.pharma.model.User;
import com.pharma.model.enums.OrderStatus;
import com.pharma.model.enums.PaymentStatus;
import com.pharma.repository.OrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final UserService userService;
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
            Product product = cartItem.getProduct();
            int orderedQty = cartItem.getQuantity();
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(orderedQty);
            orderItem.setPrice(product.getPrice());

            BigDecimal itemTotal = BigDecimal.ZERO;
            int freeQty = 0;

            if (product.getIsBundleOffer() != null && product.getIsBundleOffer() && 
                product.getBundleBuyQuantity() != null && product.getBundleFreeQuantity() != null &&
                product.getBundlePrice() != null) {
                
                int unitSize = product.getBundleBuyQuantity() + product.getBundleFreeQuantity();
                if (orderedQty >= unitSize) {
                    int numBundles = orderedQty / unitSize;
                    int remainder = orderedQty % unitSize;
                    
                    BigDecimal bundleTotal = product.getBundlePrice().multiply(BigDecimal.valueOf(numBundles));
                    BigDecimal remainderTotal = product.getPrice().multiply(BigDecimal.valueOf(remainder));
                    
                    itemTotal = bundleTotal.add(remainderTotal);
                    freeQty = numBundles * product.getBundleFreeQuantity();
                } else {
                    itemTotal = product.getPrice().multiply(BigDecimal.valueOf(orderedQty));
                }
            } else {
                itemTotal = product.getPrice().multiply(BigDecimal.valueOf(orderedQty));
            }

            orderItem.setFreeQuantity(freeQty);
            orderItem.setSubtotal(itemTotal);
            order.getOrderItems().add(orderItem);
            totalAmount = totalAmount.add(itemTotal);

            // Reduce stock
            product.setStockQuantity(product.getStockQuantity() - orderedQty);
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
