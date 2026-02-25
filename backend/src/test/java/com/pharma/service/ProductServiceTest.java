package com.pharma.service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.pharma.model.Category;
import com.pharma.model.Product;
import com.pharma.model.SubCategory;
import com.pharma.repository.CategoryRepository;
import com.pharma.repository.ProductRepository;
import com.pharma.repository.SubCategoryRepository;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SubCategoryRepository subCategoryRepository;

    private Product product;
    private Category category;
    private SubCategory subCategory;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(1L);
        category.setSlug("pain-relief");

        subCategory = new SubCategory();
        subCategory.setId(1L);
        subCategory.setSlug("paracetamol");
        subCategory.setCategory(category);

        product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setPrice(BigDecimal.valueOf(100.0));
        product.setStockQuantity(50);
        product.setManufacturer("Test Manufacturer");
        product.setCategory(category);
        product.setSubCategory(subCategory);
    }

    @Test
    void getAllProducts_Success() {
        Page<Product> productPage = new PageImpl<>(Collections.singletonList(product));
        when(productRepository.findByIsDeletedFalse(any(Pageable.class))).thenReturn(productPage);

        Page<Product> result = productService.getAllProducts(PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(productRepository, times(1)).findByIsDeletedFalse(any(Pageable.class));
    }

    @Test
    void getProductById_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        Product found = productService.getProductById(1L);

        assertNotNull(found);
        assertEquals("Test Product", found.getName());
    }

    @Test
    void getProductById_NotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> productService.getProductById(99L));
    }

    @Test
    void createProduct_Success() {
        com.pharma.dto.request.ProductRequest request = new com.pharma.dto.request.ProductRequest();
        request.setName("Test Product");
        request.setPrice(BigDecimal.valueOf(100.0));
        request.setStockQuantity(50);
        request.setCategoryId(1L);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product saved = productService.createProduct(request);

        assertNotNull(saved);
        assertEquals(1L, saved.getId());
    }

    @Test
    void deleteProduct_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        productService.deleteProduct(1L);

        verify(productRepository, times(1)).save(any(Product.class)); // Soft delete
    }

    @Test
    void searchProducts_Success() {
        Page<Product> productPage = new PageImpl<>(Collections.singletonList(product));
        when(productRepository.searchProducts(anyString(), any(Pageable.class))).thenReturn(productPage);

        Page<Product> results = productService.searchProducts("Test", PageRequest.of(0, 10));

        assertNotNull(results);
        assertEquals(1, results.getTotalElements());
    }

    @Test
    void updateProduct_Success() {
        com.pharma.dto.request.ProductRequest request = new com.pharma.dto.request.ProductRequest();
        request.setName("Updated Product");
        request.setPrice(BigDecimal.valueOf(150.0));
        request.setStockQuantity(60);
        request.setCategoryId(1L);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product updated = productService.updateProduct(1L, request);

        assertNotNull(updated);
        assertEquals("Updated Product", updated.getName());
        verify(productRepository).save(product);
    }

    @Test
    void getProductsByCategory_Success() {
        Page<Product> productPage = new PageImpl<>(Collections.singletonList(product));
        when(categoryRepository.findBySlug("pain-relief")).thenReturn(Optional.of(category));
        when(productRepository.findByCategoryAndIsDeletedFalse(any(Category.class),
                any(Pageable.class))).thenReturn(productPage);

        Page<Product> result = productService.getProductsByCategory("pain-relief",
                PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getProductsByCategoryAndSubCategory_Success() {
        Page<Product> productPage = new PageImpl<>(Collections.singletonList(product));
        when(categoryRepository.findBySlug("pain-relief")).thenReturn(Optional.of(category));
        when(subCategoryRepository.findBySlugAndCategory("paracetamol", category)).thenReturn(Optional.of(subCategory));
        when(productRepository.findByCategoryAndSubCategoryInAndIsDeletedFalse(
                any(Category.class),
                anyList(),
                any(Pageable.class))).thenReturn(productPage);

        Page<Product> result = productService.getProductsByCategoryAndSubCategory(
                "pain-relief",
                List.of("paracetamol"),
                PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getLowStockProducts_Success() {
        when(productRepository.findByStockQuantityLessThanAndIsDeletedFalse(anyInt())).thenReturn(Collections.singletonList(product));

        List<Product> result = productService.getLowStockProducts(10);

        assertNotNull(result);
        assertEquals(1, result.size());
    }
}
