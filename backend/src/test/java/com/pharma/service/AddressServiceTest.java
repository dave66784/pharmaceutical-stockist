package com.pharma.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pharma.model.Address;
import com.pharma.model.User;
import com.pharma.repository.AddressRepository;
import com.pharma.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AddressService addressService;

    private User testUser;
    private Address testAddress;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);

        testAddress = new Address();
        testAddress.setId(1L);
        testAddress.setUser(testUser);
        testAddress.setStreet("123 Main St");
        testAddress.setCity("Anytown");
        testAddress.setState("NY");
        testAddress.setZipCode("12345");
        testAddress.setCountry("USA");
        testAddress.setDefault(false);
    }

    @Test
    void getUserAddresses_ShouldReturnListOfAddresses() {
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(testAddress));

        List<Address> addresses = addressService.getUserAddresses(1L);

        assertNotNull(addresses);
        assertEquals(1, addresses.size());
        assertEquals("123 Main St", addresses.get(0).getStreet());
        verify(addressRepository).findByUserId(1L);
    }

    @Test
    void createAddress_FirstAddress_ShouldSetAsDefault() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);

        Address newAddress = new Address();
        newAddress.setStreet("456 Elm St");

        addressService.createAddress(1L, newAddress);

        ArgumentCaptor<Address> addressCaptor = ArgumentCaptor.forClass(Address.class);
        verify(addressRepository).save(addressCaptor.capture());

        Address savedAddress = addressCaptor.getValue();
        assertTrue(savedAddress.isDefault());
        assertEquals(testUser, savedAddress.getUser());
    }

    @Test
    void createAddress_NotFirstAndIsDefault_ShouldUnsetOtherDefaults() {
        Address existingDefault = new Address();
        existingDefault.setId(2L);
        existingDefault.setDefault(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(existingDefault));
        when(addressRepository.findByUserIdAndIsDefaultTrue(1L)).thenReturn(List.of(existingDefault));
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);

        Address newAddress = new Address();
        newAddress.setDefault(true);

        addressService.createAddress(1L, newAddress);

        verify(addressRepository).save(existingDefault);
        assertFalse(existingDefault.isDefault(), "Old default should be unset");
        verify(addressRepository, times(2)).save(any(Address.class));
    }

    @Test
    void createAddress_UserNotFound_ShouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            addressService.createAddress(1L, testAddress)
        );

        assertEquals("User not found", exception.getMessage());
        verify(addressRepository, never()).save(any());
    }

    @Test
    void updateAddress_ShouldUpdateAllFields() {
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);

        Address updateDetails = new Address();
        updateDetails.setStreet("789 Oak St");
        updateDetails.setCity("New City");
        updateDetails.setState("CA");
        updateDetails.setZipCode("54321");
        updateDetails.setCountry("Canada");
        updateDetails.setDefault(false);

        addressService.updateAddress(1L, 1L, updateDetails);

        ArgumentCaptor<Address> addressCaptor = ArgumentCaptor.forClass(Address.class);
        verify(addressRepository).save(addressCaptor.capture());

        Address savedAddress = addressCaptor.getValue();
        assertEquals("789 Oak St", savedAddress.getStreet());
        assertEquals("New City", savedAddress.getCity());
        assertEquals("CA", savedAddress.getState());
        assertEquals("54321", savedAddress.getZipCode());
        assertEquals("Canada", savedAddress.getCountry());
        assertFalse(savedAddress.isDefault());
    }

    @Test
    void updateAddress_SetAsDefault_ShouldUnsetOtherDefaults() {
        testAddress.setDefault(false);
        Address existingDefault = new Address();
        existingDefault.setId(2L);
        existingDefault.setDefault(true);

        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(addressRepository.findByUserIdAndIsDefaultTrue(1L)).thenReturn(List.of(existingDefault));
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);

        Address updateDetails = new Address();
        updateDetails.setDefault(true);

        addressService.updateAddress(1L, 1L, updateDetails);

        verify(addressRepository).save(existingDefault);
        assertFalse(existingDefault.isDefault());
        assertTrue(testAddress.isDefault());
    }

    @Test
    void updateAddress_AddressNotFound_ShouldThrowException() {
        when(addressRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            addressService.updateAddress(1L, 1L, testAddress)
        );

        assertEquals("Address not found", exception.getMessage());
        verify(addressRepository, never()).save(any());
    }

    @Test
    void updateAddress_UnauthorizedAccess_ShouldThrowException() {
        User otherUser = new User();
        otherUser.setId(2L);
        testAddress.setUser(otherUser);

        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            addressService.updateAddress(1L, 1L, testAddress)
        );

        assertEquals("Unauthorized access to address", exception.getMessage());
        verify(addressRepository, never()).save(any());
    }

    @Test
    void deleteAddress_ShouldDeleteAddress() {
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

        addressService.deleteAddress(1L, 1L);

        verify(addressRepository).delete(testAddress);
    }

    @Test
    void deleteAddress_AddressNotFound_ShouldThrowException() {
        when(addressRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            addressService.deleteAddress(1L, 1L)
        );

        assertEquals("Address not found", exception.getMessage());
        verify(addressRepository, never()).delete(any());
    }

    @Test
    void deleteAddress_UnauthorizedAccess_ShouldThrowException() {
        User otherUser = new User();
        otherUser.setId(2L);
        testAddress.setUser(otherUser);

        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            addressService.deleteAddress(1L, 1L)
        );

        assertEquals("Unauthorized access to address", exception.getMessage());
        verify(addressRepository, never()).delete(any());
    }
}
