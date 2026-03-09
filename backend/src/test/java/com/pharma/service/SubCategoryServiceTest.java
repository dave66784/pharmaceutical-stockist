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

import com.pharma.dto.request.SubCategoryRequest;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.Category;
import com.pharma.model.SubCategory;
import com.pharma.repository.SubCategoryRepository;

@ExtendWith(MockitoExtension.class)
class SubCategoryServiceTest {

    @Mock
    private SubCategoryRepository subCategoryRepository;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private SubCategoryService subCategoryService;

    private Category testCategory;
    private SubCategory testSubCategory;
    private SubCategoryRequest testRequest;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Category");

        testSubCategory = new SubCategory();
        testSubCategory.setId(1L);
        testSubCategory.setName("SubCategory");
        testSubCategory.setDescription("Desc");
        testSubCategory.setCategory(testCategory);
        testSubCategory.setSlug("subcategory");

        testRequest = new SubCategoryRequest();
        testRequest.setCategoryId(1L);
        testRequest.setName("New SubCategory");
        testRequest.setDescription("New Desc");
    }

    @Test
    void getSubCategoriesByCategory_ShouldReturnList() {
        when(categoryService.getCategoryById(1L)).thenReturn(testCategory);
        when(subCategoryRepository.findByCategory(testCategory)).thenReturn(List.of(testSubCategory));

        List<SubCategory> result = subCategoryService.getSubCategoriesByCategory(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("SubCategory", result.get(0).getName());
        verify(categoryService).getCategoryById(1L);
        verify(subCategoryRepository).findByCategory(testCategory);
    }

    @Test
    void getSubCategoryById_ShouldReturnSubCategory() {
        when(subCategoryRepository.findById(1L)).thenReturn(Optional.of(testSubCategory));

        SubCategory result = subCategoryService.getSubCategoryById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("SubCategory", result.getName());
    }

    @Test
    void getSubCategoryById_NotFound_ShouldThrowException() {
        when(subCategoryRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () ->
            subCategoryService.getSubCategoryById(1L)
        );

        assertEquals("SubCategory not found with id: 1", exception.getMessage());
    }

    @Test
    void createSubCategory_ShouldCreateAndReturn() {
        when(categoryService.getCategoryById(1L)).thenReturn(testCategory);
        when(subCategoryRepository.save(any(SubCategory.class))).thenReturn(testSubCategory);

        subCategoryService.createSubCategory(testRequest);

        ArgumentCaptor<SubCategory> captor = ArgumentCaptor.forClass(SubCategory.class);
        verify(subCategoryRepository).save(captor.capture());

        SubCategory savedSubCategory = captor.getValue();
        assertEquals("New SubCategory", savedSubCategory.getName());
        assertEquals("New Desc", savedSubCategory.getDescription());
        assertEquals("new-subcategory", savedSubCategory.getSlug());
        assertEquals(testCategory, savedSubCategory.getCategory());
    }

    @Test
    void updateSubCategory_ShouldUpdateAndReturn() {
        when(subCategoryRepository.findById(1L)).thenReturn(Optional.of(testSubCategory));
        when(categoryService.getCategoryById(1L)).thenReturn(testCategory);
        when(subCategoryRepository.save(any(SubCategory.class))).thenReturn(testSubCategory);

        subCategoryService.updateSubCategory(1L, testRequest);

        ArgumentCaptor<SubCategory> captor = ArgumentCaptor.forClass(SubCategory.class);
        verify(subCategoryRepository).save(captor.capture());

        SubCategory savedSubCategory = captor.getValue();
        assertEquals("New SubCategory", savedSubCategory.getName());
        assertEquals("New Desc", savedSubCategory.getDescription());
        assertEquals("new-subcategory", savedSubCategory.getSlug());
        assertEquals(testCategory, savedSubCategory.getCategory());
    }

    @Test
    void updateSubCategory_NotFound_ShouldThrowException() {
        when(subCategoryRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () ->
            subCategoryService.updateSubCategory(1L, testRequest)
        );

        assertEquals("SubCategory not found with id: 1", exception.getMessage());
        verify(subCategoryRepository, never()).save(any());
    }

    @Test
    void deleteSubCategory_ShouldDelete() {
        when(subCategoryRepository.findById(1L)).thenReturn(Optional.of(testSubCategory));

        subCategoryService.deleteSubCategory(1L);

        verify(subCategoryRepository).delete(testSubCategory);
    }

    @Test
    void deleteSubCategory_NotFound_ShouldThrowException() {
        when(subCategoryRepository.findById(1L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () ->
            subCategoryService.deleteSubCategory(1L)
        );

        assertEquals("SubCategory not found with id: 1", exception.getMessage());
        verify(subCategoryRepository, never()).delete(any());
    }
}
