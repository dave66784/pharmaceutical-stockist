package com.pharma.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExpiringProductDto {
    private Long id;
    private String name;
    private LocalDate expiryDate;
    private Integer stockQuantity;
    private Integer daysUntilExpiry;
}
