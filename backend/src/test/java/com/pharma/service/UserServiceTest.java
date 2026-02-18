package com.pharma.service;

import com.pharma.model.User;
import com.pharma.model.enums.Role;
import com.pharma.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    @Mock
    private com.pharma.repository.AddressRepository addressRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPassword("encodedPassword");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setRole(Role.CUSTOMER);
    }

    @Test
    void getUserByEmail_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        User foundUser = userService.getUserByEmail("test@example.com");

        assertNotNull(foundUser);
        assertEquals("test@example.com", foundUser.getEmail());
        verify(userRepository, times(1)).findByEmail("test@example.com");
    }

    @Test
    void getUserByEmail_NotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.getUserByEmail("unknown@example.com"));
    }

    @Test
    void registerUser_Success() {
        com.pharma.dto.request.RegisterRequest request = new com.pharma.dto.request.RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setPhone("1234567890");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateToken(any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn("token");

        com.pharma.dto.response.AuthResponse response = userService.register(request);

        assertNotNull(response);
        assertEquals("token", response.getToken());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_EmailExists() {
        com.pharma.dto.request.RegisterRequest request = new com.pharma.dto.request.RegisterRequest();
        request.setEmail("test@example.com");

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        com.pharma.dto.request.LoginRequest request = new com.pharma.dto.request.LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(org.springframework.security.core.userdetails.UserDetails.class)))
                .thenReturn("token");

        com.pharma.dto.response.AuthResponse response = userService.login(request);

        assertNotNull(response);
        assertEquals("token", response.getToken());
        verify(authenticationManager).authenticate(
                any(org.springframework.security.authentication.UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_UserNotFound() {
        com.pharma.dto.request.LoginRequest request = new com.pharma.dto.request.LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("password");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.login(request));
    }

    @Test
    void getAllUsers_Success() {
        org.springframework.data.domain.Page<User> userPage = new org.springframework.data.domain.PageImpl<>(
                java.util.Collections.singletonList(user));
        when(userRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(userPage);

        org.springframework.data.domain.Page<User> result = userService
                .getAllUsers(org.springframework.data.domain.PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void updateUserRole_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User updatedUser = userService.updateUserRole(1L, com.pharma.model.enums.Role.ADMIN);

        assertNotNull(updatedUser);
        verify(userRepository).save(user);
    }

    @Test
    void addAddress_Success() {
        com.pharma.dto.request.AddressRequest request = new com.pharma.dto.request.AddressRequest();
        request.setStreet("123 Main St");
        request.setCity("City");
        request.setState("State");
        request.setZipCode("12345");
        request.setCountry("Country");
        request.setDefault(true);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(addressRepository.findByUserId(1L)).thenReturn(new java.util.ArrayList<>());
        when(addressRepository.save(any(com.pharma.model.Address.class))).thenAnswer(i -> i.getArguments()[0]);

        com.pharma.model.Address address = userService.addAddress("test@example.com", request);

        assertNotNull(address);
        assertEquals("123 Main St", address.getStreet());
    }

    @Test
    void getUserAddresses_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(addressRepository.findByUserId(1L)).thenReturn(java.util.Collections.singletonList(new com.pharma.model.Address()));

        java.util.List<com.pharma.model.Address> addresses = userService.getUserAddresses("test@example.com");

        assertNotNull(addresses);
        assertEquals(1, addresses.size());
    }
}
