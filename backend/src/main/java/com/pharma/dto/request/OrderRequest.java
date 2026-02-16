package com.pharma.dto.request;

import com.pharma.model.enums.PaymentMethod;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    private Long addressId;

    private PaymentMethod paymentMethod;
}
