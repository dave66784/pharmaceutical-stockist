package com.pharma.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LowStockProductDto {
    private Long id;
    private String name;
    private String category;
    private Integer stockQuantity;
}
