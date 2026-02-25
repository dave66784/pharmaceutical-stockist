package com.pharma.controller;

import java.util.Collections;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Category;
import com.pharma.model.Product;
import com.pharma.model.SubCategory;
import com.pharma.service.ProductService;
import com.pharma.service.ProductUploadService;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductService productService;

    @Mock
    private ProductUploadService productUploadService;

    @InjectMocks
    private ProductController productController;

    private Product product;

    private Category category;
    private SubCategory subCategory;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(1L);
        category.setSlug("vaccines");
        category.setName("Vaccines");

        subCategory = new SubCategory();
        subCategory.setId(1L);
        subCategory.setSlug("tdap");
        subCategory.setName("Tdap");
        subCategory.setCategory(category);

        product = new Product();
        product.setId(1L);
        product.setName("Test Vaccine");
        product.setCategory(category);
        product.setSubCategory(subCategory);
    }

    @Test
    void getProductsByCategory_WithSubCategory() {
        Page<Product> productPage = new PageImpl<>(Collections.singletonList(product));
        List<String> subCategories = List.of("tdap");
        
        when(productService.getProductsByCategoryAndSubCategory(
                eq("vaccines"),
                eq(subCategories),
                any(Pageable.class)
        )).thenReturn(productPage);

        ResponseEntity<ApiResponse<Page<Product>>> response = productController.getProductsByCategory(
                "vaccines",
                subCategories,
                0,
                12
        );

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getTotalElements());
        
        verify(productService).getProductsByCategoryAndSubCategory(
                eq("vaccines"),
                eq(subCategories),
                any(Pageable.class)
        );
    }
}
