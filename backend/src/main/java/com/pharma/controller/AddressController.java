package com.pharma.controller;

import com.pharma.dto.request.AddressRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Address;
import com.pharma.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<Address>> addAddress(
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        Address address = userService.addAddress(authentication.getName(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Address added successfully", address));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Address>>> getUserAddresses(Authentication authentication) {
        List<Address> addresses = userService.getUserAddresses(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Addresses retrieved successfully", addresses));
    }
}
