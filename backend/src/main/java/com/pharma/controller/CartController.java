package com.pharma.controller;

import com.pharma.dto.request.CartItemRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Cart;
import com.pharma.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    
    private final CartService cartService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<Cart>> getCart(Authentication authentication) {
        Cart cart = cartService.getCartByUser(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Cart retrieved successfully", cart));
    }
    
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<Cart>> addItemToCart(
            @Valid @RequestBody CartItemRequest request,
            Authentication authentication
    ) {
        Cart cart = cartService.addItemToCart(authentication.getName(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Item added to cart successfully", cart));
    }
    
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Cart>> updateCartItem(
            @PathVariable Long itemId,
            @RequestParam Integer quantity,
            Authentication authentication
    ) {
        Cart cart = cartService.updateCartItem(authentication.getName(), itemId, quantity);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cart item updated successfully", cart));
    }
    
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Cart>> removeItemFromCart(
            @PathVariable Long itemId,
            Authentication authentication
    ) {
        Cart cart = cartService.removeItemFromCart(authentication.getName(), itemId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Item removed from cart successfully", cart));
    }
    
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.ok(new ApiResponse<>(true, "Cart cleared successfully"));
    }
}
