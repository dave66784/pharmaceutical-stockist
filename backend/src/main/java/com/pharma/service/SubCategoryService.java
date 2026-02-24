package com.pharma.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharma.dto.request.SubCategoryRequest;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.Category;
import com.pharma.model.SubCategory;
import com.pharma.repository.SubCategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubCategoryService {

    private final SubCategoryRepository subCategoryRepository;
    private final CategoryService categoryService;

    public List<SubCategory> getSubCategoriesByCategory(Long categoryId) {
        Category category = categoryService.getCategoryById(categoryId);
        return subCategoryRepository.findByCategory(category);
    }

    public SubCategory getSubCategoryById(Long id) {
        return subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + id));
    }

    @Transactional
    public SubCategory createSubCategory(SubCategoryRequest request) {
        Category category = categoryService.getCategoryById(request.getCategoryId());
        SubCategory subCategory = new SubCategory();
        subCategory.setName(request.getName());
        subCategory.setDescription(request.getDescription());
        subCategory.setCategory(category);
        subCategory.setSlug(generateSlug(request.getName()));
        return subCategoryRepository.save(subCategory);
    }

    @Transactional
    public SubCategory updateSubCategory(Long id, SubCategoryRequest request) {
        SubCategory subCategory = getSubCategoryById(id);
        Category category = categoryService.getCategoryById(request.getCategoryId());
        
        subCategory.setName(request.getName());
        subCategory.setDescription(request.getDescription());
        subCategory.setCategory(category);
        subCategory.setSlug(generateSlug(request.getName()));
        return subCategoryRepository.save(subCategory);
    }

    @Transactional
    public void deleteSubCategory(Long id) {
        SubCategory subCategory = getSubCategoryById(id);
        subCategoryRepository.delete(subCategory);
    }

    private String generateSlug(String name) {
        return name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}
