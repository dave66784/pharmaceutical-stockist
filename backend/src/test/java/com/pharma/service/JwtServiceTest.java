package com.pharma.service;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    private JwtService jwtService;
    private long expiration = 1000L * 60 * 60 * 24; // 24 hours

    @BeforeEach
    void setUp() throws Exception {
        jwtService = new JwtService();

        // Generate a fresh RSA key pair for each test
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        PrivateKey privateKey = keyPair.getPrivate();
        PublicKey publicKey = keyPair.getPublic();

        String privateKeyBase64 = Base64.getEncoder().encodeToString(privateKey.getEncoded());
        String publicKeyBase64 = Base64.getEncoder().encodeToString(publicKey.getEncoded());

        ReflectionTestUtils.setField(jwtService, "privateKeyBase64", privateKeyBase64);
        ReflectionTestUtils.setField(jwtService, "publicKeyBase64", publicKeyBase64);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", expiration);
    }

    @Test
    void testGenerateTokenAndExtractUsername() {
        UserDetails userDetails = new User("testuser", "password", Collections.emptyList());
        String token = jwtService.generateToken(userDetails);
        assertNotNull(token);

        String username = jwtService.extractUsername(token);
        assertEquals("testuser", username);
    }

    @Test
    void testIsTokenValid() {
        UserDetails userDetails = new User("testuser", "password", Collections.emptyList());
        String token = jwtService.generateToken(userDetails);
        boolean isValid = jwtService.isTokenValid(token, userDetails);
        assertTrue(isValid);
    }

    @Test
    void testTokenIsInvalidForDifferentUser() {
        UserDetails user1 = new User("user1", "password", Collections.emptyList());
        UserDetails user2 = new User("user2", "password", Collections.emptyList());
        String token = jwtService.generateToken(user1);
        assertFalse(jwtService.isTokenValid(token, user2));
    }
}
