package com.pharma.service;

import com.pharma.model.Order;
import com.pharma.model.OrderItem;
import com.pharma.model.Product;
import com.pharma.model.User;
import com.pharma.model.enums.OrderStatus;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.email.admin-address}")
    private String adminEmail;

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN notification switches
    // ═══════════════════════════════════════════════════════════════════════════
    @Value("${app.email.admin.notifications.order-placed.enabled:false}")
    private boolean adminOrderPlacedEnabled;

    @Value("${app.email.admin.notifications.low-stock.enabled:false}")
    private boolean adminLowStockEnabled;

    // ═══════════════════════════════════════════════════════════════════════════
    // CUSTOMER notification switches
    // ═══════════════════════════════════════════════════════════════════════════
    @Value("${app.email.customer.notifications.welcome.enabled:false}")
    private boolean customerWelcomeEnabled;

    @Value("${app.email.customer.notifications.order-confirmation.enabled:false}")
    private boolean customerOrderConfirmationEnabled;

    @Value("${app.email.customer.notifications.order-status-update.enabled:false}")
    private boolean customerOrderStatusUpdateEnabled;

    @Value("${app.email.customer.notifications.otp-verification.enabled:true}")
    private boolean otpVerificationEnabled;

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN — 1. New Order Alert
    // ═══════════════════════════════════════════════════════════════════════════
    @Async
    public void sendOrderPlacedNotification(Order order) {
        if (!adminOrderPlacedEnabled) {
            log.info("[ADMIN NOTIF OFF] order-placed alert skipped for Order #{}", order.getId());
            return;
        }
        try {
            sendHtmlEmail(adminEmail,
                    "🛒 New Order Received: #" + order.getId(),
                    buildAdminOrderBody(order));
            log.info("[ADMIN EMAIL SENT] New order alert for Order #{}", order.getId());
        } catch (Exception e) {
            log.error("[ADMIN EMAIL FAILED] New order alert for Order #{}", order.getId(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN — 2. Low Stock Daily Digest
    // ═══════════════════════════════════════════════════════════════════════════
    @Async
    public void sendLowStockAlert(List<Product> lowStockProducts) {
        if (!adminLowStockEnabled) {
            log.info("[ADMIN NOTIF OFF] low-stock digest skipped ({} products)", lowStockProducts.size());
            return;
        }
        if (lowStockProducts.isEmpty()) return;
        try {
            sendHtmlEmail(adminEmail,
                    "⚠️ Low Stock Alert — " + lowStockProducts.size() + " product(s) need restocking",
                    buildLowStockBody(lowStockProducts));
            log.info("[ADMIN EMAIL SENT] Low stock digest for {} products", lowStockProducts.size());
        } catch (Exception e) {
            log.error("[ADMIN EMAIL FAILED] Low stock digest", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CUSTOMER — 0. OTP Verification Email
    // ═══════════════════════════════════════════════════════════════════════════
    @Async
    public void sendOtpEmail(String email, String firstName, String otp, int expiryMinutes) {
        if (!otpVerificationEnabled) {
            log.info("[CUSTOMER NOTIF OFF] OTP email skipped for {}", email);
            return;
        }
        try {
            sendHtmlEmail(email,
                    "🔐 Your PharmaStockist Verification Code",
                    buildOtpBody(firstName, otp, expiryMinutes));
            log.info("[CUSTOMER EMAIL SENT] OTP email to {}", email);
        } catch (Exception e) {
            log.error("[CUSTOMER EMAIL FAILED] OTP email to {}", email, e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CUSTOMER — 1. Welcome Email
    // ═══════════════════════════════════════════════════════════════════════════
    @Async
    public void sendWelcomeEmail(User user) {
        if (!customerWelcomeEnabled) {
            log.info("[CUSTOMER NOTIF OFF] welcome email skipped for {}", user.getEmail());
            return;
        }
        try {
            sendHtmlEmail(user.getEmail(),
                    "👋 Welcome to PharmaStockist, " + user.getFirstName() + "!",
                    buildWelcomeBody(user));
            log.info("[CUSTOMER EMAIL SENT] Welcome to {}", user.getEmail());
        } catch (Exception e) {
            log.error("[CUSTOMER EMAIL FAILED] Welcome to {}", user.getEmail(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CUSTOMER — 2. Order Confirmation
    // ═══════════════════════════════════════════════════════════════════════════
    @Async
    public void sendCustomerOrderConfirmation(Order order) {
        if (!customerOrderConfirmationEnabled) {
            log.info("[CUSTOMER NOTIF OFF] order-confirmation skipped for Order #{}", order.getId());
            return;
        }
        try {
            sendHtmlEmail(order.getUser().getEmail(),
                    "✅ Order Confirmed: #" + order.getId() + " — Thank you!",
                    buildCustomerOrderConfirmationBody(order));
            log.info("[CUSTOMER EMAIL SENT] Order confirmation to {} for Order #{}", order.getUser().getEmail(), order.getId());
        } catch (Exception e) {
            log.error("[CUSTOMER EMAIL FAILED] Order confirmation for Order #{}", order.getId(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CUSTOMER — 3. Order Status Update
    // ═══════════════════════════════════════════════════════════════════════════
    @Async
    public void sendOrderStatusUpdate(Order order, OrderStatus newStatus) {
        if (!customerOrderStatusUpdateEnabled) {
            log.info("[CUSTOMER NOTIF OFF] order-status-update skipped for Order #{}", order.getId());
            return;
        }
        try {
            sendHtmlEmail(order.getUser().getEmail(),
                    statusSubject(newStatus, order.getId()),
                    buildStatusUpdateBody(order, newStatus));
            log.info("[CUSTOMER EMAIL SENT] Status update ({}) for Order #{}", newStatus, order.getId());
        } catch (Exception e) {
            log.error("[CUSTOMER EMAIL FAILED] Status update for Order #{}", order.getId(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Shared send helper
    // ═══════════════════════════════════════════════════════════════════════════
    private void sendHtmlEmail(String to, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(senderEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Email body builders
    // ═══════════════════════════════════════════════════════════════════════════

    private String buildAdminOrderBody(Order order) {
        return emailHeader("New Order Received 🛒")
                + "<p>A new order has been placed and requires your attention.</p>"
                + orderSummaryTable(order)
                + itemsTable(order)
                + "<p style='margin-top:24px'><a href='http://localhost:3000/admin' "
                + "style='background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none'>View in Admin Dashboard</a></p>"
                + emailFooter();
    }

    private String buildCustomerOrderConfirmationBody(Order order) {
        return emailHeader("Order Confirmed! ✅")
                + "<p>Hi <strong>" + order.getUser().getFirstName() + "</strong>,</p>"
                + "<p>Thank you for your order. We've received it and will begin processing it shortly.</p>"
                + orderSummaryTable(order)
                + itemsTable(order)
                + "<p style='margin-top:24px'><a href='http://localhost:3000/orders/" + order.getId()
                + "' style='background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none'>Track Your Order</a></p>"
                + emailFooter();
    }

    private String buildStatusUpdateBody(Order order, OrderStatus newStatus) {
        String icon = switch (newStatus) {
            case CONFIRMED -> "✅"; case SHIPPED -> "📦"; case DELIVERED -> "🏠"; case CANCELLED -> "❌"; default -> "🔔";
        };
        String message = switch (newStatus) {
            case CONFIRMED -> "Your order has been confirmed and is being prepared.";
            case SHIPPED   -> "Great news! Your order is on its way.";
            case DELIVERED -> "Your order has been delivered. Enjoy!";
            case CANCELLED -> "Your order has been cancelled. Contact support if you need help.";
            default        -> "Your order status has been updated.";
        };
        return emailHeader(icon + " Order #" + order.getId() + " — " + newStatus.name())
                + "<p>Hi <strong>" + order.getUser().getFirstName() + "</strong>,</p>"
                + "<p>" + message + "</p>"
                + orderSummaryTable(order)
                + "<p style='margin-top:24px'><a href='http://localhost:3000/orders/" + order.getId()
                + "' style='background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none'>View Order Details</a></p>"
                + emailFooter();
    }

    private String buildOtpBody(String firstName, String otp, int expiryMinutes) {
        return emailHeader("🔐 Email Verification")
                + "<p>Hi <strong>" + firstName + "</strong>,</p>"
                + "<p>Use the verification code below to complete your PharmaStockist registration:</p>"
                + "<div style='text-align:center;margin:28px 0'>"
                + "<div style='display:inline-block;background:#f0f9ff;border:2px dashed #2563eb;border-radius:12px;padding:20px 40px'>"
                + "<p style='margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px'>Verification Code</p>"
                + "<span style='font-size:42px;font-weight:900;letter-spacing:10px;color:#1e40af;font-family:monospace'>" + otp + "</span>"
                + "<p style='margin:8px 0 0;font-size:12px;color:#ef4444'>⏱ Expires in " + expiryMinutes + " minutes</p>"
                + "</div></div>"
                + "<p style='font-size:13px;color:#6b7280'>If you did not request this code, please ignore this email. Do not share this code with anyone.</p>"
                + emailFooter();
    }

    private String buildWelcomeBody(User user) {

        return emailHeader("Welcome to PharmaStockist! 👋")
                + "<p>Hi <strong>" + user.getFirstName() + "</strong>,</p>"
                + "<p>Your account is ready. Browse our full catalogue, place orders, and track deliveries — all in one place.</p>"
                + "<ul><li>✅ Thousands of pharmaceutical products</li>"
                + "<li>✅ Secure checkout with Cash on Delivery</li>"
                + "<li>✅ Order history & PDF receipts</li></ul>"
                + "<p style='margin-top:24px'><a href='http://localhost:3000/products' "
                + "style='background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none'>Start Shopping</a></p>"
                + emailFooter();
    }

    private String buildLowStockBody(List<Product> products) {
        StringBuilder t = new StringBuilder(emailHeader("⚠️ Low Stock Alert — Action Required"));
        t.append("<p>The following products are running low and may need restocking:</p>");
        t.append("<table style='width:100%;border-collapse:collapse'>");
        t.append("<tr style='background:#f3f4f6'><th style='padding:8px;text-align:left;border:1px solid #e5e7eb'>Product</th>");
        t.append("<th style='padding:8px;text-align:left;border:1px solid #e5e7eb'>Category</th>");
        t.append("<th style='padding:8px;text-align:center;border:1px solid #e5e7eb'>Stock</th></tr>");
        for (Product p : products) {
            String rowBg = p.getStockQuantity() == 0 ? "#fef2f2" : "#fffbeb";
            t.append("<tr style='background:").append(rowBg).append("'>")
             .append("<td style='padding:8px;border:1px solid #e5e7eb'>").append(p.getName()).append("</td>")
             .append("<td style='padding:8px;border:1px solid #e5e7eb'>").append(p.getCategory() != null ? p.getCategory().getName() : "—").append("</td>")
             .append("<td style='padding:8px;text-align:center;font-weight:bold;border:1px solid #e5e7eb'>").append(p.getStockQuantity()).append("</td></tr>");
        }
        t.append("</table>");
        t.append("<p style='margin-top:24px'><a href='http://localhost:3000/admin/products' "
                + "style='background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none'>Manage Inventory</a></p>");
        t.append(emailFooter());
        return t.toString();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Shared HTML template helpers
    // ═══════════════════════════════════════════════════════════════════════════

    private String emailHeader(String title) {
        return "<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937'>"
                + "<div style='background:linear-gradient(135deg,#1e40af,#2563eb);padding:24px 32px;border-radius:10px 10px 0 0'>"
                + "<h1 style='margin:0;color:#fff;font-size:22px'>PharmaStockist</h1>"
                + "<p style='margin:4px 0 0;color:#bfdbfe;font-size:13px'>Your trusted pharmaceutical partner</p>"
                + "</div>"
                + "<div style='background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none'>"
                + "<h2 style='color:#1e40af;margin-top:0'>" + title + "</h2>";
    }

    private String emailFooter() {
        return "</div>"
                + "<div style='background:#f9fafb;padding:16px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;text-align:center'>"
                + "<p style='margin:0;font-size:12px;color:#6b7280'>Automated message from PharmaStockist. Do not reply.</p>"
                + "</div></body></html>";
    }

    private String orderSummaryTable(Order order) {
        return "<table style='width:100%;border-collapse:collapse;margin:16px 0'>"
                + "<tr><td style='padding:6px 0;color:#6b7280;width:140px'>Order ID</td><td style='font-weight:bold'>#" + order.getId() + "</td></tr>"
                + "<tr><td style='padding:6px 0;color:#6b7280'>Status</td><td>" + order.getStatus().name() + "</td></tr>"
                + "<tr><td style='padding:6px 0;color:#6b7280'>Payment</td><td>" + order.getPaymentMethod() + "</td></tr>"
                + "<tr><td style='padding:6px 0;color:#6b7280'>Total</td><td style='font-weight:bold;color:#16a34a'>$" + order.getTotalAmount() + "</td></tr>"
                + "<tr><td style='padding:6px 0;color:#6b7280'>Ship To</td><td>" + order.getShippingAddress() + "</td></tr>"
                + "</table>";
    }

    private String itemsTable(Order order) {
        StringBuilder t = new StringBuilder("<h3 style='color:#374151;font-size:15px;margin-bottom:8px'>Order Items</h3>"
                + "<table style='width:100%;border-collapse:collapse'>"
                + "<tr style='background:#f3f4f6'><th style='padding:8px;text-align:left;border:1px solid #e5e7eb'>Product</th>"
                + "<th style='padding:8px;text-align:center;border:1px solid #e5e7eb'>Qty</th>"
                + "<th style='padding:8px;text-align:right;border:1px solid #e5e7eb'>Subtotal</th></tr>");
        for (OrderItem item : order.getOrderItems()) {
            t.append("<tr><td style='padding:8px;border:1px solid #e5e7eb'>").append(item.getProduct().getName()).append("</td>")
             .append("<td style='padding:8px;text-align:center;border:1px solid #e5e7eb'>").append(item.getQuantity()).append("</td>")
             .append("<td style='padding:8px;text-align:right;border:1px solid #e5e7eb'>$")
             .append(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))).append("</td></tr>");
        }
        t.append("</table>");
        return t.toString();
    }

    private String statusSubject(OrderStatus status, Long orderId) {
        return switch (status) {
            case CONFIRMED -> "✅ Order #" + orderId + " Confirmed";
            case SHIPPED   -> "📦 Order #" + orderId + " Shipped";
            case DELIVERED -> "🏠 Order #" + orderId + " Delivered";
            case CANCELLED -> "❌ Order #" + orderId + " Cancelled";
            default        -> "🔔 Order #" + orderId + " Status Update";
        };
    }
}
