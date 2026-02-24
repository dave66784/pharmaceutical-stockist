package com.pharma.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharma.dto.request.CategoryRequest;
import com.pharma.dto.request.SubCategoryRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Category;
import com.pharma.model.SubCategory;
import com.pharma.service.CategoryService;
import com.pharma.service.SubCategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final SubCategoryService subCategoryService;

    // --- Public Read Endpoints ---

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(new ApiResponse<>(true, "Categories retrieved successfully", categories));
    }

    @GetMapping("/{categoryId}/subcategories")
    public ResponseEntity<ApiResponse<List<SubCategory>>> getSubCategoriesByCategory(@PathVariable Long categoryId) {
        List<SubCategory> subCategories = subCategoryService.getSubCategoriesByCategory(categoryId);
        return ResponseEntity.ok(new ApiResponse<>(true, "SubCategories retrieved successfully", subCategories));
    }

    // --- Admin Modification Endpoints ---

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody CategoryRequest request) {
        Category category = categoryService.createCategory(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category created successfully", category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        Category category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category updated successfully", category));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Category deleted successfully"));
    }

    @PostMapping("/{categoryId}/subcategories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubCategory>> createSubCategory(
            @PathVariable Long categoryId, @Valid @RequestBody SubCategoryRequest request) {
        request.setCategoryId(categoryId);
        SubCategory subCategory = subCategoryService.createSubCategory(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "SubCategory created successfully", subCategory));
    }

    @PutMapping("/subcategories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubCategory>> updateSubCategory(
            @PathVariable Long id, @Valid @RequestBody SubCategoryRequest request) {
        SubCategory subCategory = subCategoryService.updateSubCategory(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "SubCategory updated successfully", subCategory));
    }

    @DeleteMapping("/subcategories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSubCategory(@PathVariable Long id) {
        subCategoryService.deleteSubCategory(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "SubCategory deleted successfully"));
    }
}
