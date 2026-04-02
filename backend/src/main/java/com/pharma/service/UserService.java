package com.pharma.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharma.dto.request.LoginRequest;
import com.pharma.dto.request.RegisterRequest;
import com.pharma.dto.response.AuthResponse;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.RefreshToken;
import com.pharma.model.User;
import com.pharma.model.enums.Role;
import com.pharma.repository.RefreshTokenRepository;
import com.pharma.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final com.pharma.repository.AddressRepository addressRepository;
        private final EmailService emailService;
        private final OtpService otpService;
        private final RefreshTokenRepository refreshTokenRepository;

        @Value("${app.frontend.url:http://localhost:3000}")
        private String frontendUrl;

        /** Validates email availability without creating an account. */
        public void assertEmailAvailable(String email) {
                if (userRepository.existsByEmail(email)) {
                        throw new IllegalArgumentException("An account with this email already exists.");
                }
        }

        /** Step 2 of OTP registration: verify OTP then create the account. */
        public AuthResponse verifyOtpAndRegister(String email, String otp) {
                // OtpService validates OTP and returns the original RegisterRequest
                RegisterRequest request = otpService.verifyAndConsume(email, otp);
                return register(request);
        }

        /** Internal: create user and return JWT. */
        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new IllegalArgumentException("Email already exists");
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

                // CUSTOMER: send welcome email (gated by its own switch)
                emailService.sendWelcomeEmail(savedUser);

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

    public com.pharma.dto.response.AuthResponse updateProfile(String email, com.pharma.dto.request.ProfileRequest request) {
        User user = getUserByEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        return new com.pharma.dto.response.AuthResponse(
                null,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name()
        );
    }

    public void updatePassword(String email, com.pharma.dto.request.PasswordUpdateRequest request) {
        User user = getUserByEmail(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ─── Refresh Token ────────────────────────────────────────────────────────

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Invalidate any existing token for this user (one active session per user)
        refreshTokenRepository.deleteByUser(user);
        RefreshToken token = new RefreshToken(
                UUID.randomUUID().toString(),
                user,
                LocalDateTime.now().plusDays(7));
        return refreshTokenRepository.save(token);
    }

    /**
     * Validates the refresh token and returns a new JWT access token.
     * Throws IllegalArgumentException if the token is missing, expired, or unknown.
     */
    @Transactional
    public String refreshAccessToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token missing");
        }
        RefreshToken stored = refreshTokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new IllegalArgumentException("Refresh token expired");
        }
        User user = stored.getUser();
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();
        return jwtService.generateToken(userDetails);
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            refreshTokenRepository.deleteByToken(rawToken);
        }
    }

    // ─── Password Reset ────────────────────────────────────────────────────────

    public void initiateForgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Don't reveal whether the email exists
            return;
        }
        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink);
    }

    /** Resets the password and returns the user's email for audit logging. */
    public String resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));
        if (user.getPasswordResetTokenExpiry() == null ||
                user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token has expired");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
        return user.getEmail();
    }
}
