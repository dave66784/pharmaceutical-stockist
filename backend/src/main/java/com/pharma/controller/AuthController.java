package com.pharma.controller;

import java.util.Map;

import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharma.dto.request.LoginRequest;
import com.pharma.dto.request.RegisterRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.dto.response.AuthResponse;
import com.pharma.service.OtpService;
import com.pharma.service.UserService;

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
        // Check email not already in use before sending OTP
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
            jakarta.servlet.http.HttpServletResponse response) {
        String email = body.get("email");
        String otp = body.get("otp");
        AuthResponse authResponse = userService.verifyOtpAndRegister(email, otp);
        
        setTokenCookie(response, authResponse.getToken());
        if (!java.util.Arrays.asList(env.getActiveProfiles()).contains("dev")) {
            authResponse.setToken(null); // Remove token from body in production
        }
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Account created successfully!", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletResponse response) {
        AuthResponse authResponse = userService.login(request);
        
        setTokenCookie(response, authResponse.getToken());
        if (!java.util.Arrays.asList(env.getActiveProfiles()).contains("dev")) {
            authResponse.setToken(null); // Remove token from body in production
        }
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(jakarta.servlet.http.HttpServletResponse response) {
        clearTokenCookie(response);
        return ResponseEntity.ok(new ApiResponse<>(true, "Logged out successfully"));
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getMe() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(new ApiResponse<>(false, "Not authenticated", null));
        }
        
        com.pharma.model.User user = userService.getUserByEmail(authentication.getName());
        AuthResponse authResponse = new AuthResponse(
                null, // Do not return token here
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name());
        return ResponseEntity.ok(new ApiResponse<>(true, "User retrieved successfully", authResponse));
    }

    private void setTokenCookie(jakarta.servlet.http.HttpServletResponse response, String token) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .sameSite("Strict")
                .path("/")
                .maxAge(1800) // 30 minutes to match jwt.expiration
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearTokenCookie(jakarta.servlet.http.HttpServletResponse response) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
