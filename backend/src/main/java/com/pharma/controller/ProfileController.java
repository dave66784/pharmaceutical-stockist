package com.pharma.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharma.dto.request.PasswordUpdateRequest;
import com.pharma.dto.request.ProfileRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.dto.response.AuthResponse;
import com.pharma.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @PutMapping
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(
            @Valid @RequestBody ProfileRequest request,
            Authentication authentication) {
        
        AuthResponse response = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully", response));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @Valid @RequestBody PasswordUpdateRequest request,
            Authentication authentication) {
        
        try {
            userService.updatePassword(authentication.getName(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Password updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }
}
