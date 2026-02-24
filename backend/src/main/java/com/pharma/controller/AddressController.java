package com.pharma.controller;

import com.pharma.dto.request.AddressRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Address;
import com.pharma.service.UserService;
import com.pharma.service.AddressService;
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
    private final AddressService addressService;

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

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Address>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        com.pharma.model.User user = userService.getUserByEmail(authentication.getName());
        Address addressDetails = new Address();
        addressDetails.setStreet(request.getStreet());
        addressDetails.setCity(request.getCity());
        addressDetails.setState(request.getState());
        addressDetails.setZipCode(request.getZipCode());
        addressDetails.setCountry(request.getCountry());
        addressDetails.setDefault(request.isDefault());

        Address updatedAddress = addressService.updateAddress(user.getId(), id, addressDetails);
        return ResponseEntity.ok(new ApiResponse<>(true, "Address updated successfully", updatedAddress));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            Authentication authentication) {
        com.pharma.model.User user = userService.getUserByEmail(authentication.getName());
        addressService.deleteAddress(user.getId(), id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Address deleted successfully", null));
    }
}
