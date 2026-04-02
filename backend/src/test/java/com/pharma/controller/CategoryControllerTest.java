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

import com.pharma.dto.request.CategoryRequest;
import com.pharma.dto.request.SubCategoryRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Category;
import com.pharma.model.SubCategory;
import com.pharma.service.AuditService;
import com.pharma.service.CategoryService;
import com.pharma.service.SubCategoryService;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    @Mock
    private SubCategoryService subCategoryService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CategoryController categoryController;

    private Category testCategory;
    private SubCategory testSubCategory;
    private CategoryRequest testCategoryRequest;
    private SubCategoryRequest testSubCategoryRequest;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Category");

        testSubCategory = new SubCategory();
        testSubCategory.setId(1L);
        testSubCategory.setName("SubCategory");
        testSubCategory.setCategory(testCategory);

        testCategoryRequest = new CategoryRequest();
        testCategoryRequest.setName("Category");
        testCategoryRequest.setDescription("Desc");

        testSubCategoryRequest = new SubCategoryRequest();
        testSubCategoryRequest.setName("SubCategory");
        testSubCategoryRequest.setDescription("Desc");
        testSubCategoryRequest.setCategoryId(1L);
    }

    @Test
    void getAllCategories_ShouldReturnList() {
        when(categoryService.getAllCategories()).thenReturn(List.of(testCategory));

        ResponseEntity<ApiResponse<List<Category>>> response = categoryController.getAllCategories();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Categories retrieved successfully", response.getBody().getMessage());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("Category", response.getBody().getData().get(0).getName());
    }

    @Test
    void getSubCategoriesByCategory_ShouldReturnList() {
        when(subCategoryService.getSubCategoriesByCategory(1L)).thenReturn(List.of(testSubCategory));

        ResponseEntity<ApiResponse<List<SubCategory>>> response = categoryController.getSubCategoriesByCategory(1L);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("SubCategories retrieved successfully", response.getBody().getMessage());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("SubCategory", response.getBody().getData().get(0).getName());
    }

    @Test
    void createCategory_ShouldReturnCreatedCategory() {
        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(testCategory);

        ResponseEntity<ApiResponse<Category>> response = categoryController.createCategory(testCategoryRequest, null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Category created successfully", response.getBody().getMessage());
        assertEquals("Category", response.getBody().getData().getName());
    }

    @Test
    void updateCategory_ShouldReturnUpdatedCategory() {
        testCategory.setName("Updated");
        when(categoryService.updateCategory(eq(1L), any(CategoryRequest.class))).thenReturn(testCategory);

        ResponseEntity<ApiResponse<Category>> response = categoryController.updateCategory(1L, testCategoryRequest, null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Category updated successfully", response.getBody().getMessage());
        assertEquals("Updated", response.getBody().getData().getName());
    }

    @Test
    void deleteCategory_ShouldReturnSuccess() {
        doNothing().when(categoryService).deleteCategory(1L);

        ResponseEntity<ApiResponse<Void>> response = categoryController.deleteCategory(1L, null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Category deleted successfully", response.getBody().getMessage());
        verify(categoryService).deleteCategory(1L);
    }

    @Test
    void createSubCategory_ShouldReturnCreatedSubCategory() {
        when(subCategoryService.createSubCategory(any(SubCategoryRequest.class))).thenReturn(testSubCategory);

        ResponseEntity<ApiResponse<SubCategory>> response = categoryController.createSubCategory(1L, testSubCategoryRequest, null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("SubCategory created successfully", response.getBody().getMessage());
        assertEquals("SubCategory", response.getBody().getData().getName());
        assertEquals(1L, testSubCategoryRequest.getCategoryId());
    }

    @Test
    void updateSubCategory_ShouldReturnUpdatedSubCategory() {
        testSubCategory.setName("Updated Sub");
        when(subCategoryService.updateSubCategory(eq(1L), any(SubCategoryRequest.class))).thenReturn(testSubCategory);

        ResponseEntity<ApiResponse<SubCategory>> response = categoryController.updateSubCategory(1L, testSubCategoryRequest, null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("SubCategory updated successfully", response.getBody().getMessage());
        assertEquals("Updated Sub", response.getBody().getData().getName());
    }

    @Test
    void deleteSubCategory_ShouldReturnSuccess() {
        doNothing().when(subCategoryService).deleteSubCategory(1L);

        ResponseEntity<ApiResponse<Void>> response = categoryController.deleteSubCategory(1L, null, null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("SubCategory deleted successfully", response.getBody().getMessage());
        verify(subCategoryService).deleteSubCategory(1L);
    }
}
