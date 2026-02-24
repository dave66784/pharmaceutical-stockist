package com.pharma.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubCategoryRequest {
    @NotBlank(message = "SubCategory Name is required")
    private String name;

    private String description;

    private Long categoryId;
}
