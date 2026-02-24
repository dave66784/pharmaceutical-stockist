package com.pharma.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    private String manufacturer;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Stock quantity is required")
    @PositiveOrZero(message = "Stock quantity must be zero or positive")
    private Integer stockQuantity;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Long subCategoryId;

    private java.util.List<String> imageUrls;

    private LocalDate expiryDate;

    private Boolean isPrescriptionRequired = false;
    
    private Boolean isBundleOffer = false;
    
    private Integer bundleBuyQuantity;
    
    private Integer bundleFreeQuantity;
    
    private BigDecimal bundlePrice;
}
