package com.pharma.service;

import com.pharma.model.Order;
import com.pharma.model.OrderItem;
import com.pharma.model.Product;
import com.pharma.model.User;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    private Order order;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "senderEmail", "test@example.com");
        ReflectionTestUtils.setField(emailService, "adminEmail", "admin@example.com");
        ReflectionTestUtils.setField(emailService, "orderPlacedEnabled", true);

        User user = new User();
        // user.setName("John Doe"); // getName() computes this
        user.setEmail("john@example.com");
        user.setFirstName("John");
        user.setLastName("Doe");

        Product product = new Product();
        product.setName("Test Product");

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);
        item.setPrice(BigDecimal.TEN);

        order = new Order();
        order.setId(1L);
        order.setUser(user);
        order.setTotalAmount(BigDecimal.valueOf(20.0));
        order.setOrderItems(new ArrayList<>());
        order.getOrderItems().add(item);
    }

    @Test
    void sendOrderPlacedNotification_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendOrderPlacedNotification(order);

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void sendOrderPlacedNotification_Disabled() {
        ReflectionTestUtils.setField(emailService, "orderPlacedEnabled", false);

        emailService.sendOrderPlacedNotification(order);

        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
