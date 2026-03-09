package com.pharma.service;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pharma.dto.request.CategoryRequest;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.Category;
import com.pharma.repository.CategoryRepository;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category testCategory;
    private CategoryRequest testRequest;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Test Category");
        testCategory.setDescription("Test Description");
        testCategory.setSlug("test-category");

        testRequest = new CategoryRequest();
        testRequest.setName("Updated Category");
        testRequest.setDescription("Updated Description");
    }

    @Test
    void getAllCategories_ShouldReturnListOfCategories() {
        when(categoryRepository.findAll()).thenReturn(List.of(testCategory));

        List<Category> categories = categoryService.getAllCategories();

        assertNotNull(categories);
        assertEquals(1, categories.size());
        assertEquals("Test Category", categories.get(0).getName());
        verify(categoryRepository).findAll();
    }

    @Test
    void getCategoryById_ShouldReturnCategory() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));

        Category result = categoryService.getCategoryById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Category", result.getName());
        verify(categoryRepository).findById(1L);
    }

    @Test
    void getCategoryById_CategoryNotFound_ShouldThrowException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> 
            categoryService.getCategoryById(1L)
        );

        assertEquals("Category not found with id: 1", exception.getMessage());
        verify(categoryRepository).findById(1L);
    }

    @Test
    void createCategory_ShouldCreateAndReturnCategory() {
        when(categoryRepository.save(any(Category.class))).thenReturn(testCategory);

        CategoryRequest newRequest = new CategoryRequest();
        newRequest.setName("New Category!@#");
        newRequest.setDescription("New Description");

        categoryService.createCategory(newRequest);

        ArgumentCaptor<Category> categoryCaptor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(categoryCaptor.capture());

        Category savedCategory = categoryCaptor.getValue();
        assertEquals("New Category!@#", savedCategory.getName());
        assertEquals("New Description", savedCategory.getDescription());
        assertEquals("new-category", savedCategory.getSlug());
    }

    @Test
    void updateCategory_ShouldUpdateAndReturnCategory() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(testCategory);

        categoryService.updateCategory(1L, testRequest);

        ArgumentCaptor<Category> categoryCaptor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(categoryCaptor.capture());

        Category savedCategory = categoryCaptor.getValue();
        assertEquals("Updated Category", savedCategory.getName());
        assertEquals("Updated Description", savedCategory.getDescription());
        assertEquals("updated-category", savedCategory.getSlug());
    }

    @Test
    void updateCategory_CategoryNotFound_ShouldThrowException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> 
            categoryService.updateCategory(1L, testRequest)
        );

        assertEquals("Category not found with id: 1", exception.getMessage());
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void deleteCategory_ShouldDeleteCategory() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));

        categoryService.deleteCategory(1L);

        verify(categoryRepository).delete(testCategory);
    }

    @Test
    void deleteCategory_CategoryNotFound_ShouldThrowException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> 
            categoryService.deleteCategory(1L)
        );

        assertEquals("Category not found with id: 1", exception.getMessage());
        verify(categoryRepository, never()).delete(any());
    }
}
