package com.pharma.controller;

import java.util.Arrays;
import java.util.Map;

import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharma.dto.request.LoginRequest;
import com.pharma.dto.request.RegisterRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.dto.response.AuthResponse;
import com.pharma.model.RefreshToken;
import com.pharma.service.OtpService;
import com.pharma.service.UserService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final OtpService otpService;
    private final Environment env;

    /** Step 1: Validate details, send OTP — no account created yet. */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody RegisterRequest request) {
        userService.assertEmailAvailable(request.getEmail());
        otpService.initiateRegistration(request);
        return ResponseEntity.ok(new ApiResponse<>(true,
                "OTP sent to " + request.getEmail() + ". Please check your inbox.", "otp_sent"));
    }

    /** Step 1b: Resend OTP for an existing pending registration. */
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<String>> resendOtp(@RequestBody Map<String, String> body) {
        otpService.resendOtp(body.get("email"));
        return ResponseEntity.ok(new ApiResponse<>(true, "A new OTP has been sent.", "otp_resent"));
    }

    /** Step 2: Verify OTP → create account → return JWT in cookie. */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @RequestBody Map<String, String> body,
            HttpServletResponse response) {
        String email = body.get("email");
        String otp = body.get("otp");
        AuthResponse authResponse = userService.verifyOtpAndRegister(email, otp);

        com.pharma.model.User user = userService.getUserByEmail(email);
        RefreshToken refreshToken = userService.createRefreshToken(user);

        setAccessTokenCookie(response, authResponse.getToken());
        setRefreshTokenCookie(response, refreshToken.getToken());

        if (!Arrays.asList(env.getActiveProfiles()).contains("dev")) {
            authResponse.setToken(null);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Account created successfully!", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = userService.login(request);

        com.pharma.model.User user = userService.getUserByEmail(request.getEmail());
        RefreshToken refreshToken = userService.createRefreshToken(user);

        setAccessTokenCookie(response, authResponse.getToken());
        setRefreshTokenCookie(response, refreshToken.getToken());

        if (!Arrays.asList(env.getActiveProfiles()).contains("dev")) {
            authResponse.setToken(null);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractCookieValue(request, "refresh_token");
        userService.revokeRefreshToken(refreshToken);
        clearAccessTokenCookie(response);
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok(new ApiResponse<>(true, "Logged out successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractCookieValue(request, "refresh_token");
        try {
            String newAccessToken = userService.refreshAccessToken(rawToken);
            setAccessTokenCookie(response, newAccessToken);
            return ResponseEntity.ok(new ApiResponse<>(true, "Token refreshed"));
        } catch (IllegalArgumentException e) {
            clearAccessTokenCookie(response);
            clearRefreshTokenCookie(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Session expired. Please log in again."));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email != null && !email.isBlank()) {
            userService.initiateForgotPassword(email.trim().toLowerCase());
        }
        // Always return success to avoid email enumeration
        return ResponseEntity.ok(new ApiResponse<>(true,
                "If an account with that email exists, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Token and new password are required."));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Password must be at least 8 characters."));
        }
        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok(new ApiResponse<>(true, "Password reset successfully. You can now log in."));
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getMe() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Not authenticated", null));
        }

        com.pharma.model.User user = userService.getUserByEmail(authentication.getName());
        AuthResponse authResponse = new AuthResponse(
                null,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name());
        return ResponseEntity.ok(new ApiResponse<>(true, "User retrieved successfully", authResponse));
    }

    // ─── Cookie helpers ────────────────────────────────────────────────────────

    private void setAccessTokenCookie(HttpServletResponse response, String token) {
        // Session cookie (no maxAge) — cleared when browser closes
        ResponseCookie cookie = ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        // Session cookie (no maxAge) — cleared when browser closes
        ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/api/auth/refresh")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearAccessTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/api/auth/refresh")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
