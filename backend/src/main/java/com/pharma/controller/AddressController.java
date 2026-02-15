package com.pharma.controller;

import com.pharma.model.Address;
import com.pharma.model.User;
import com.pharma.service.AddressService;
import com.pharma.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Address>> getUserAddresses() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(addressService.getUserAddresses(currentUser.getId()));
    }

    @PostMapping
    public ResponseEntity<Address> createAddress(@RequestBody Address address) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(addressService.createAddress(currentUser.getId(), address));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Address> updateAddress(@PathVariable Long id, @RequestBody Address address) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(addressService.updateAddress(currentUser.getId(), id, address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        addressService.deleteAddress(currentUser.getId(), id);
        return ResponseEntity.ok().build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userService.getUserByEmail(email);
    }
}
