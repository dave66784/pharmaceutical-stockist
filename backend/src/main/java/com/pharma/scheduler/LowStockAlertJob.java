package com.pharma.scheduler;

import com.pharma.model.Product;
import com.pharma.service.EmailService;
import com.pharma.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Runs a daily check for low-stock products and sends an alert email to admin.
 *
 * Switch on/off via:
 *   app.email.admin.notifications.low-stock-scheduler.enabled=true|false
 *
 * Threshold controlled by:
 *   app.notifications.low-stock.threshold=10
 *
 * Schedule: every day at 08:00 AM (server timezone).
 * To change the time, update the cron expression below.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LowStockAlertJob {

    private final ProductService productService;
    private final EmailService emailService;

    @Value("${app.email.admin.notifications.low-stock-scheduler.enabled:false}")
    private boolean schedulerEnabled;

    @Value("${app.notifications.low-stock.threshold:10}")
    private int threshold;

    // Runs every day at 08:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void checkLowStock() {
        if (!schedulerEnabled) {
            log.info("[LOW-STOCK SCHEDULER OFF] Skipping daily low-stock check.");
            return;
        }

        log.info("[LOW-STOCK SCHEDULER] Running daily low-stock check (threshold={})", threshold);
        List<Product> lowStock = productService.getLowStockProducts(threshold);

        if (lowStock.isEmpty()) {
            log.info("[LOW-STOCK SCHEDULER] All products are adequately stocked.");
        } else {
            log.warn("[LOW-STOCK SCHEDULER] Found {} product(s) below threshold. Sending alert.", lowStock.size());
            emailService.sendLowStockAlert(lowStock);
        }
    }
}
