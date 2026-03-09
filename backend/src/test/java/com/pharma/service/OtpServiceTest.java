package com.pharma.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import com.pharma.dto.request.RegisterRequest;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private EmailService emailService;

    @Mock
    private Environment environment;

    @InjectMocks
    private OtpService otpService;

    private RegisterRequest testRequest;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(otpService, "expiryMinutes", 10);
        ReflectionTestUtils.setField(otpService, "otpEmailEnabled", false);
        ReflectionTestUtils.setField(otpService, "testOtpOverride", "123456");

        testRequest = new RegisterRequest();
        testRequest.setEmail("test@example.com");
        testRequest.setFirstName("Test");
        testRequest.setLastName("User");
        testRequest.setPassword("Password123!");
    }

    @Test
    void initiateRegistration_ShouldStorePendingRegistrationAndSendEmail() {
        otpService.initiateRegistration(testRequest);

        verify(emailService).sendOtpEmail(eq("test@example.com"), eq("Test"), anyString(), eq(10));
    }

    @Test
    void verifyAndConsume_ValidTestOverride_ShouldReturnRequest() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        otpService.initiateRegistration(testRequest);

        RegisterRequest result = otpService.verifyAndConsume("test@example.com", "123456");

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void verifyAndConsume_NotFound_ShouldThrowException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
            otpService.verifyAndConsume("notfound@example.com", "123456")
        );

        assertEquals("No pending registration found for this email. Please request a new OTP.", exception.getMessage());
    }

    @Test
    void verifyAndConsume_Expired_ShouldThrowException() {
        ReflectionTestUtils.setField(otpService, "expiryMinutes", -1); // Expired immediately

        otpService.initiateRegistration(testRequest);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
            otpService.verifyAndConsume("test@example.com", "123456")
        );

        assertEquals("OTP has expired. Please request a new one.", exception.getMessage());
    }

    @Test
    void verifyAndConsume_InvalidOtp_ShouldThrowException() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        otpService.initiateRegistration(testRequest);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
            otpService.verifyAndConsume("test@example.com", "000000")
        );

        assertEquals("Invalid OTP. Please check your email and try again.", exception.getMessage());
    }

    @Test
    void resendOtp_ShouldRegenerateAndSendEmail() {
        otpService.initiateRegistration(testRequest);
        verify(emailService).sendOtpEmail(eq("test@example.com"), eq("Test"), anyString(), eq(10));

        otpService.resendOtp("test@example.com");
        verify(emailService, times(2)).sendOtpEmail(eq("test@example.com"), eq("Test"), anyString(), eq(10));
    }

    @Test
    void resendOtp_NotFound_ShouldThrowException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
            otpService.resendOtp("notfound@example.com")
        );

        assertEquals("No pending registration found. Please fill out the registration form again.", exception.getMessage());
    }
}
