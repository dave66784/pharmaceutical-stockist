package com.pharma.service;

import com.pharma.dto.request.CartItemRequest;
import com.pharma.exception.InsufficientStockException;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.Cart;
import com.pharma.model.CartItem;
import com.pharma.model.Product;
import com.pharma.model.User;
import com.pharma.repository.CartItemRepository;
import com.pharma.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {
    
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final UserService userService;
    
    public Cart getCartByUser(String email) {
        User user = userService.getUserByEmail(email);
        return cartRepository.findByUser(user)
                .orElseGet(() -> createCart(user));
    }
    
    private Cart createCart(User user) {
        Cart cart = new Cart();
        cart.setUser(user);
        return cartRepository.save(cart);
    }
    
    @Transactional
    public Cart addItemToCart(String email, CartItemRequest request) {
        Cart cart = getCartByUser(email);
        Product product = productService.getProductById(request.getProductId());
        
        if (product.getStockQuantity() < request.getQuantity()) {
            throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
        }
        
        CartItem existingItem = cartItemRepository.findByCartAndProduct(cart, product)
                .orElse(null);
        
        if (existingItem != null) {
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (product.getStockQuantity() < newQuantity) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(request.getQuantity());
            cart.getItems().add(cartItem);
            cartItemRepository.save(cartItem);
        }
        
        return cartRepository.save(cart);
    }
    
    @Transactional
    public Cart updateCartItem(String email, Long itemId, Integer quantity) {
        Cart cart = getCartByUser(email);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Cart item does not belong to user");
        }
        
        if (cartItem.getProduct().getStockQuantity() < quantity) {
            throw new InsufficientStockException("Insufficient stock for product: " + cartItem.getProduct().getName());
        }
        
        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        
        return cart;
    }
    
    @Transactional
    public Cart removeItemFromCart(String email, Long itemId) {
        Cart cart = getCartByUser(email);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Cart item does not belong to user");
        }
        
        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);
        
        return cart;
    }
    
    @Transactional
    public void clearCart(String email) {
        Cart cart = getCartByUser(email);
        cartItemRepository.deleteByCart(cart);
        cart.getItems().clear();
        cartRepository.save(cart);
    }
}
