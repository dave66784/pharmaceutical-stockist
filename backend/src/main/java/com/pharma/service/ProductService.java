package com.pharma.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharma.dto.request.ProductRequest;
import com.pharma.exception.ResourceNotFoundException;
import com.pharma.model.Category;
import com.pharma.model.Product;
import com.pharma.model.SubCategory;
import com.pharma.repository.CategoryRepository;
import com.pharma.repository.ProductRepository;
import com.pharma.repository.SubCategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;

    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findByIsDeletedFalse(pageable);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public Page<Product> searchProducts(String searchTerm, Pageable pageable) {
        return productRepository.searchProducts(searchTerm, pageable);
    }

    public Page<Product> getProductsByCategory(String categorySlug, Pageable pageable) {
        Category category = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categorySlug));
        return productRepository.findByCategoryAndIsDeletedFalse(category, pageable);
    }

    public Page<Product> getProductsByCategoryAndSubCategory(String categorySlug, List<String> subCategorySlugs, Pageable pageable) {
        Category category = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categorySlug));

        List<SubCategory> subCategoryEntities = subCategorySlugs.stream()
                .map(slug -> subCategoryRepository.findBySlugAndCategory(slug, category)
                        .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found: " + slug)))
                .collect(Collectors.toList());

        return productRepository.findByCategoryAndSubCategoryInAndIsDeletedFalse(category, subCategoryEntities, pageable);
    }

    @Transactional
    public Product createProduct(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setManufacturer(request.getManufacturer());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        product.setCategory(category);
        
        if (request.getSubCategoryId() != null) {
            SubCategory subCategory = subCategoryRepository.findById(request.getSubCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + request.getSubCategoryId()));
            product.setSubCategory(subCategory);
        }
        
        product.setImageUrls(request.getImageUrls() != null ? request.getImageUrls() : new java.util.ArrayList<>());
        product.setExpiryDate(request.getExpiryDate());
        product.setIsPrescriptionRequired(Boolean.TRUE.equals(request.getIsPrescriptionRequired()));
        product.setIsBundleOffer(Boolean.TRUE.equals(request.getIsBundleOffer()));
        product.setBundleBuyQuantity(request.getBundleBuyQuantity());
        product.setBundleFreeQuantity(request.getBundleFreeQuantity());
        product.setBundlePrice(request.getBundlePrice());
        product.setIsDeleted(false);

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setManufacturer(request.getManufacturer());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        product.setCategory(category);
        
        if (request.getSubCategoryId() != null) {
            SubCategory subCategory = subCategoryRepository.findById(request.getSubCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("SubCategory not found with id: " + request.getSubCategoryId()));
            product.setSubCategory(subCategory);
        } else {
            product.setSubCategory(null);
        }

        product.setImageUrls(request.getImageUrls() != null ? request.getImageUrls() : new java.util.ArrayList<>());
        product.setExpiryDate(request.getExpiryDate());
        product.setIsPrescriptionRequired(Boolean.TRUE.equals(request.getIsPrescriptionRequired()));
        product.setIsBundleOffer(Boolean.TRUE.equals(request.getIsBundleOffer()));
        product.setBundleBuyQuantity(request.getBundleBuyQuantity());
        product.setBundleFreeQuantity(request.getBundleFreeQuantity());
        product.setBundlePrice(request.getBundlePrice());

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setIsDeleted(true);
        productRepository.save(product);
    }

    public List<Product> getLowStockProducts(Integer threshold) {
        return productRepository.findByStockQuantityLessThanAndIsDeletedFalse(threshold);
    }
}
