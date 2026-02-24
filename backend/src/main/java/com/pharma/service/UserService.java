package com.pharma.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pharma.dto.request.LoginRequest;
import com.pharma.dto.request.RegisterRequest;
import com.pharma.dto.response.AuthResponse;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.User;
import com.pharma.model.enums.Role;
import com.pharma.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final com.pharma.repository.AddressRepository addressRepository;

        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new RuntimeException("Email already exists");
                }

                User user = new User();
                user.setEmail(request.getEmail());
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                user.setFirstName(request.getFirstName());
                user.setLastName(request.getLastName());
                user.setPhone(request.getPhone());
                user.setRole(Role.CUSTOMER);

                User savedUser = userRepository.save(user);

                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                                .username(savedUser.getEmail())
                                .password(savedUser.getPassword())
                                .roles(savedUser.getRole().name())
                                .build();

                String token = jwtService.generateToken(userDetails);

                return new AuthResponse(
                                token,
                                savedUser.getId(),
                                savedUser.getEmail(),
                                savedUser.getFirstName(),
                                savedUser.getLastName(),
                                savedUser.getRole().name());
        }

        public AuthResponse login(LoginRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));

                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                                .username(user.getEmail())
                                .password(user.getPassword())
                                .roles(user.getRole().name())
                                .build();

                String token = jwtService.generateToken(userDetails);

                return new AuthResponse(
                                token,
                                user.getId(),
                                user.getEmail(),
                                user.getFirstName(),
                                user.getLastName(),
                                user.getRole().name());
        }

        public User getUserByEmail(String email) {
                return userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        // Admin methods
        public org.springframework.data.domain.Page<User> getAllUsers(
                        org.springframework.data.domain.Pageable pageable) {
                return userRepository.findAll(pageable);
        }

        public org.springframework.data.domain.Page<User> getUsersByRole(Role role,
                        org.springframework.data.domain.Pageable pageable) {
                return userRepository.findByRole(role, pageable);
        }

        public User updateUserRole(Long userId, Role role) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                user.setRole(role);
                return userRepository.save(user);
        }

        // Address management
        public com.pharma.model.Address addAddress(String email, com.pharma.dto.request.AddressRequest request) {
                User user = getUserByEmail(email);
                com.pharma.model.Address address = new com.pharma.model.Address();
                address.setUser(user);
                address.setStreet(request.getStreet());
                address.setCity(request.getCity());
                address.setState(request.getState());
                address.setZipCode(request.getZipCode());
                address.setCountry(request.getCountry());
                address.setDefault(request.isDefault());

                if (request.isDefault()) {
                        // Update other addresses to not be default
                        java.util.List<com.pharma.model.Address> userAddresses = addressRepository
                                        .findByUserId(user.getId());
                        for (com.pharma.model.Address addr : userAddresses) {
                                if (addr.isDefault()) {
                                        addr.setDefault(false);
                                        addressRepository.save(addr);
                                }
                        }
                }

                return addressRepository.save(address);
        }

        public java.util.List<com.pharma.model.Address> getUserAddresses(String email) {
                User user = getUserByEmail(email);
                return addressRepository.findByUserId(user.getId());
        }
}
