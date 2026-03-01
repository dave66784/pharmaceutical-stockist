package com.pharma.controller;

import com.pharma.dto.request.OrderRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Order;
import com.pharma.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final com.pharma.service.OrderReceiptService orderReceiptService;
    private final com.pharma.service.OrderExportService orderExportService;

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> createOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication) {
        Order order = orderService.createOrder(authentication.getName(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order created successfully", order));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getUserOrders(Authentication authentication) {
        List<Order> orders = orderService.getUserOrders(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Orders retrieved successfully", orders));
    }

    /**
     * Fetch a single order by ID.
     *
     * <p>Ownership check: the authenticated user must either own the order or hold
     * the ADMIN role. Any other caller receives a 403 Forbidden — deliberately
     * identical to a 404 in its information content so as not to leak whether
     * the order ID exists.</p>
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderById(
            @PathVariable Long id,
            Authentication authentication) {

        Order order = orderService.getOrderById(id);

        if (!isOwnerOrAdmin(order, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "Access denied"));
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Order retrieved successfully", order));
    }

    /**
     * Download a PDF receipt for an order.
     *
     * <p>Same ownership rule as {@link #getOrderById}: the caller must own the
     * order or be an admin.</p>
     */
    @GetMapping("/{id}/receipt")
    public ResponseEntity<?> downloadReceipt(
            @PathVariable Long id,
            Authentication authentication)
            throws java.io.IOException, com.lowagie.text.DocumentException {

        Order order = orderService.getOrderById(id);

        if (!isOwnerOrAdmin(order, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "Access denied"));
        }

        byte[] pdf = orderReceiptService.generateReceipt(id);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=receipt_" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    /**
     * Export the authenticated user's own orders as an Excel file.
     * No ownership risk — scoped to the caller by email.
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportOrders(Authentication authentication) throws java.io.IOException {
        byte[] excelContent = orderExportService.exportUserOrders(authentication.getName());
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=orders.xlsx")
                .contentType(org.springframework.http.MediaType
                        .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelContent);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Returns true when the caller either owns the order or has the ADMIN role.
     *
     * @param order          the order being accessed
     * @param authentication the current request's authentication context
     */
    private boolean isOwnerOrAdmin(Order order, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isOwner = order.getUser().getEmail().equals(authentication.getName());

        return isAdmin || isOwner;
    }
}
