package com.pharma.controller;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.pharma.dto.request.AddressRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Address;
import com.pharma.model.User;
import com.pharma.service.AddressService;
import com.pharma.service.UserService;

@ExtendWith(MockitoExtension.class)
class AddressControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private AddressService addressService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AddressController addressController;

    private Address testAddress;
    private AddressRequest testRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user@example.com");

        testAddress = new Address();
        testAddress.setId(1L);
        testAddress.setStreet("123 Main St");
        testAddress.setCity("City");
        testAddress.setState("State");
        testAddress.setZipCode("12345");
        testAddress.setCountry("Country");

        testRequest = new AddressRequest();
        testRequest.setStreet("123 Main St");
        testRequest.setCity("City");
        testRequest.setState("State");
        testRequest.setZipCode("12345");
        testRequest.setCountry("Country");
        testRequest.setDefault(true);
    }

    @Test
    void addAddress_ShouldReturnCreatedAddress() {
        when(authentication.getName()).thenReturn("user@example.com");
        when(userService.addAddress(eq("user@example.com"), any(AddressRequest.class))).thenReturn(testAddress);

        ResponseEntity<ApiResponse<Address>> response = addressController.addAddress(testRequest, authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Address added successfully", response.getBody().getMessage());
        assertEquals("123 Main St", response.getBody().getData().getStreet());
    }

    @Test
    void getUserAddresses_ShouldReturnList() {
        when(authentication.getName()).thenReturn("user@example.com");
        when(userService.getUserAddresses("user@example.com")).thenReturn(List.of(testAddress));

        ResponseEntity<ApiResponse<List<Address>>> response = addressController.getUserAddresses(authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("123 Main St", response.getBody().getData().get(0).getStreet());
    }

    @Test
    void updateAddress_ShouldReturnUpdatedAddress() {
        when(authentication.getName()).thenReturn("user@example.com");
        when(userService.getUserByEmail("user@example.com")).thenReturn(testUser);
        when(addressService.updateAddress(eq(1L), eq(1L), any(Address.class))).thenReturn(testAddress);

        ResponseEntity<ApiResponse<Address>> response = addressController.updateAddress(1L, testRequest, authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Address updated successfully", response.getBody().getMessage());
        assertEquals("123 Main St", response.getBody().getData().getStreet());
    }

    @Test
    void deleteAddress_ShouldReturnSuccess() {
        when(authentication.getName()).thenReturn("user@example.com");
        when(userService.getUserByEmail("user@example.com")).thenReturn(testUser);
        doNothing().when(addressService).deleteAddress(1L, 1L);

        ResponseEntity<ApiResponse<Void>> response = addressController.deleteAddress(1L, authentication);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Address deleted successfully", response.getBody().getMessage());
        verify(addressService).deleteAddress(1L, 1L);
    }
}
