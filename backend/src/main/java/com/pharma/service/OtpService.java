package com.pharma.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.pharma.dto.request.RegisterRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * In-memory OTP store for email verification during registration.
 * OTPs expire after the configured number of minutes.
 * No database changes required.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes:10}")
    private int expiryMinutes;

    @Value("${app.email.customer.notifications.otp-verification.enabled:false}")
    private boolean otpEmailEnabled;

    @Value("${app.otp.test-override:123456}")
    private String testOtpOverride;

    // Holds pending registrations keyed by email (lowercase)
    private final Map<String, PendingRegistration> pendingStore = new ConcurrentHashMap<>();

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Generate OTP, persist pending registration, send OTP email. */
    public void initiateRegistration(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String otp = generateOtp();
        pendingStore.put(email, new PendingRegistration(request, otp, Instant.now()));
        log.info("[OTP] Stored pending registration for {} (expires in {} min)", email, expiryMinutes);
        emailService.sendOtpEmail(email, request.getFirstName(), otp, expiryMinutes);
    }

    /**
     * Validate OTP and return the original RegisterRequest if valid.
     * Removes the entry so OTPs can only be used once.
     *
     * @throws IllegalArgumentException if OTP is invalid or expired
     */
    public RegisterRequest verifyAndConsume(String email, String otp) {
        String key = email.toLowerCase().trim();
        PendingRegistration pending = pendingStore.get(key);

        if (pending == null) {
            throw new IllegalArgumentException("No pending registration found for this email. Please request a new OTP.");
        }

        long elapsedMinutes = (Instant.now().toEpochMilli() - pending.generatedAt().toEpochMilli()) / 60000;
        if (elapsedMinutes >= expiryMinutes) {
            pendingStore.remove(key);
            throw new IllegalArgumentException("OTP has expired. Please request a new one.");
        }

        boolean isOverrideValid = !otpEmailEnabled 
                && testOtpOverride != null 
                && !testOtpOverride.isBlank()
                && testOtpOverride.equals(otp.trim());

        if (!pending.otp().equals(otp.trim()) && !isOverrideValid) {
            throw new IllegalArgumentException("Invalid OTP. Please check your email and try again.");
        }

        pendingStore.remove(key); // consume — single use
        log.info("[OTP] Verified successfully for {}", key);
        return pending.request();
    }

    /** Resend: regenerate OTP for an already-pending registration. */
    public void resendOtp(String email) {
        String key = email.toLowerCase().trim();
        PendingRegistration existing = pendingStore.get(key);
        if (existing == null) {
            throw new IllegalArgumentException("No pending registration found. Please fill out the registration form again.");
        }
        String newOtp = generateOtp();
        pendingStore.put(key, new PendingRegistration(existing.request(), newOtp, Instant.now()));
        log.info("[OTP] Resent OTP for {}", key);
        emailService.sendOtpEmail(key, existing.request().getFirstName(), newOtp, expiryMinutes);
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    private String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    /** Immutable record holding a pending registration. */
    private record PendingRegistration(RegisterRequest request, String otp, Instant generatedAt) {}
}
