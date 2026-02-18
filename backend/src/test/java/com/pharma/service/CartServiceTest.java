package com.pharma.service;

import com.pharma.model.Cart;
import com.pharma.model.CartItem;
import com.pharma.model.Product;
import com.pharma.model.User;
import com.pharma.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private com.pharma.repository.CartItemRepository cartItemRepository;

    @Mock
    private UserService userService;

    @Mock
    private ProductService productService;

    @InjectMocks
    private CartService cartService;

    private User user;
    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("test@example.com");

        cart = new Cart();
        cart.setUser(user);
        cart.setItems(new ArrayList<>());

        product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setPrice(BigDecimal.TEN);
        product.setStockQuantity(100);
    }

    @Test
    void getCartByUser_ExistingCart() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));

        Cart result = cartService.getCartByUser("test@example.com");

        assertNotNull(result);
        assertEquals(user, result.getUser());
    }

    @Test
    void getCartByUser_NewCart() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArguments()[0]);

        Cart result = cartService.getCartByUser("test@example.com");

        assertNotNull(result);
        assertEquals(user, result.getUser());
    }

    @Test
    void addItemToCart_NewItem() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(productService.getProductById(1L)).thenReturn(product);
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        when(cartItemRepository.findByCartAndProduct(any(Cart.class), any(Product.class))).thenReturn(Optional.empty());

        com.pharma.dto.request.CartItemRequest request = new com.pharma.dto.request.CartItemRequest();
        request.setProductId(1L);
        request.setQuantity(2);

        Cart updatedCart = cartService.addItemToCart("test@example.com", request);

        assertNotNull(updatedCart);
    }

    @Test
    void clearCart_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        
        cart.getItems().add(new CartItem());
        
        cartService.clearCart("test@example.com");
        
        assertTrue(cart.getItems().isEmpty());
        verify(cartRepository, times(1)).save(cart);

    }

    @Test
    void updateCartItem_Success() {
        com.pharma.model.CartItem cartItem = new com.pharma.model.CartItem();
        cartItem.setId(10L);
        cartItem.setCart(cart);
        cartItem.setProduct(product);
        cartItem.setQuantity(1);

        cart.setId(100L); // Set Cart ID to match

        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(10L)).thenReturn(Optional.of(cartItem));

        product.setStockQuantity(100);

        Cart updatedCart = cartService.updateCartItem("test@example.com", 10L, 5);

        verify(cartItemRepository).save(cartItem);
        assertEquals(5, cartItem.getQuantity());
    }

    @Test
    void removeItemFromCart_Success() {
        Cart cart = new Cart();
        cart.setId(100L);
        cart.setUser(user);
        cart.setItems(new ArrayList<>());

        com.pharma.model.CartItem cartItem = new com.pharma.model.CartItem();
        cartItem.setId(10L);
        cartItem.setCart(cart);
        cart.getItems().add(cartItem);

        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(10L)).thenReturn(Optional.of(cartItem));

        cartService.removeItemFromCart("test@example.com", 10L);

        verify(cartItemRepository).delete(cartItem);
        assertTrue(cart.getItems().isEmpty());
    }

    @Test
    void addItemToCart_InsufficientStock_ExistingItem() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(productService.getProductById(1L)).thenReturn(product);

        com.pharma.model.CartItem existingItem = new com.pharma.model.CartItem();
        existingItem.setProduct(product);
        existingItem.setQuantity(50);
        when(cartItemRepository.findByCartAndProduct(any(Cart.class), any(Product.class))).thenReturn(Optional.of(existingItem));

        com.pharma.dto.request.CartItemRequest request = new com.pharma.dto.request.CartItemRequest();
        request.setProductId(1L);
        request.setQuantity(60); // Total 110 > 100

        assertThrows(com.pharma.exception.InsufficientStockException.class, () -> cartService.addItemToCart("test@example.com", request));
    }

    @Test
    void updateCartItem_ItemNotFound() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(com.pharma.exception.ResourceNotFoundException.class, () -> cartService.updateCartItem("test@example.com", 99L, 5));
    }

    @Test
    void updateCartItem_NotBelongToUser() {
        Cart otherCart = new Cart();
        otherCart.setId(200L); // Different ID

        com.pharma.model.CartItem cartItem = new com.pharma.model.CartItem();
        cartItem.setId(10L);
        cartItem.setCart(otherCart);

        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(10L)).thenReturn(Optional.of(cartItem));

        cart.setId(100L);

        assertThrows(RuntimeException.class, () -> cartService.updateCartItem("test@example.com", 10L, 5));
    }

    @Test
    void updateCartItem_InsufficientStock() {
        com.pharma.model.CartItem cartItem = new com.pharma.model.CartItem();
        cartItem.setId(10L);
        cartItem.setCart(cart);
        cartItem.setProduct(product);
        cartItem.setQuantity(1);

        cart.setId(100L);

        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(10L)).thenReturn(Optional.of(cartItem));

        product.setStockQuantity(100);

        assertThrows(com.pharma.exception.InsufficientStockException.class,
                () -> cartService.updateCartItem("test@example.com", 10L, 101));
    }

    @Test
    void removeItemFromCart_ItemNotFound() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(com.pharma.exception.ResourceNotFoundException.class, () -> cartService.removeItemFromCart("test@example.com", 99L));
    }

    @Test
    void removeItemFromCart_NotBelongToUser() {
        Cart otherCart = new Cart();
        otherCart.setId(200L);

        com.pharma.model.CartItem cartItem = new com.pharma.model.CartItem();
        cartItem.setId(10L);
        cartItem.setCart(otherCart);

        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(10L)).thenReturn(Optional.of(cartItem));

        cart.setId(100L);

        assertThrows(RuntimeException.class, () -> cartService.removeItemFromCart("test@example.com", 10L));
    }
}
