package com.pharma.service;

import com.pharma.model.Order;
import com.pharma.model.OrderItem;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.email.admin-address}")
    private String adminEmail;

    @Value("${app.email.notifications.order-placed.enabled:false}")
    private boolean orderPlacedEnabled;

    @Async
    public void sendOrderPlacedNotification(Order order) {
        if (!orderPlacedEnabled) {
            log.info("Order placed notification is disabled. Skipping email for Order ID: {}", order.getId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(adminEmail);
            helper.setSubject("New Order Received: #" + order.getId());

            StringBuilder body = new StringBuilder();
            body.append("<html><body>");
            body.append("<h2>New Order Received</h2>");
            body.append("<p><strong>Order ID:</strong> ").append(order.getId()).append("</p>");
            body.append("<p><strong>Customer:</strong> ").append(order.getUser().getName()).append(" (")
                    .append(order.getUser().getEmail()).append(")</p>");
            body.append("<p><strong>Total Amount:</strong> $").append(order.getTotalAmount()).append("</p>");
            body.append("<h3>Order Items:</h3>");
            body.append("<ul>");

            for (OrderItem item : order.getOrderItems()) {
                body.append("<li>")
                        .append(item.getProduct().getName())
                        .append(" x ").append(item.getQuantity())
                        .append(" - $").append(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .append("</li>");
            }

            body.append("</ul>");
            body.append("<p>Please login to the admin dashboard to process this order.</p>");
            body.append("</body></html>");

            helper.setText(body.toString(), true);

            mailSender.send(message);
            log.info("Order placed notification sent to admin for Order ID: {}", order.getId());

        } catch (Exception e) {
            log.error("Failed to send order notification email", e);
        }
    }
}
