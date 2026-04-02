package com.pharma.service;

import com.pharma.model.AuditLog;
import com.pharma.model.enums.AuditAction;
import com.pharma.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an action performed by an authenticated principal.
     * Runs asynchronously so it never blocks the main request.
     */
    @Async
    public void log(AuditAction action, String entityType, String entityId,
                    String details, Authentication auth, HttpServletRequest request) {
        String email = (auth != null) ? auth.getName() : null;
        persist(action, entityType, entityId, details, email, extractIp(request));
    }

    /**
     * Log an action where the actor email is known but there is no Spring
     * Authentication object yet (e.g. login attempts, registration).
     */
    @Async
    public void logByEmail(AuditAction action, String entityType, String entityId,
                           String details, String email, HttpServletRequest request) {
        persist(action, entityType, entityId, details, email, extractIp(request));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void persist(AuditAction action, String entityType, String entityId,
                         String details, String email, String ip) {
        try {
            AuditLog entry = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .userEmail(email)
                    .ipAddress(ip)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Audit logging must never break the main flow
            log.warn("Failed to persist audit log [{}]: {}", action, e.getMessage());
        }
    }

    public static String extractIp(HttpServletRequest request) {
        if (request == null) return null;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
