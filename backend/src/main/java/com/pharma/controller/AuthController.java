package com.pharma.controller;

import com.pharma.dto.request.LoginRequest;
import com.pharma.dto.request.RegisterRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.dto.response.AuthResponse;
import com.pharma.service.OtpService;
import com.pharma.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final OtpService otpService;

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

    /** Step 2: Verify OTP → create account → return JWT. */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        AuthResponse response = userService.verifyOtpAndRegister(email, otp);
        return ResponseEntity.ok(new ApiResponse<>(true, "Account created successfully!", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.login(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
    }
}
