package com.pharma.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.UUID;

import com.pharma.dto.request.ProductRequest;
import com.pharma.dto.response.ApiResponse;
import com.pharma.model.Product;
import com.pharma.model.enums.ProductCategory;
import com.pharma.service.ProductService;
import com.pharma.service.ProductUploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;
    private final ProductUploadService productUploadService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Product>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<Product> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Products retrieved successfully", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product retrieved successfully", product));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<Product>>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> products = productService.searchProducts(query, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Search results retrieved successfully", products));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<Product>>> getProductsByCategory(
            @PathVariable ProductCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> products = productService.getProductsByCategory(category, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Products retrieved successfully", products));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody ProductRequest request) {
        Product product = productService.createProduct(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product created successfully", product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        Product product = productService.updateProduct(id, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product updated successfully", product));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> uploadProducts(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Please select a file to upload"));
            }

            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Please upload a valid Excel file (.xlsx or .xls)"));
            }

            java.util.Map<String, Object> result = productUploadService.uploadProducts(file);
            return ResponseEntity.ok(new ApiResponse<>(true, "File processed successfully", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Failed to process file: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Product deleted successfully"));
    }

    @DeleteMapping("/delete-bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> bulkDeleteProducts(
            @RequestBody java.util.List<Long> productIds) {
        log.info("Received bulk delete request for IDs: {}", productIds);
        try {
            int deletedCount = 0;
            java.util.List<String> errors = new java.util.ArrayList<>();

            for (Long id : productIds) {
                try {
                    log.debug("Deleting product ID: {}", id);
                    productService.deleteProduct(id);
                    deletedCount++;
                } catch (Exception e) {
                    log.error("Failed to delete product ID {}: {}", id, e.getMessage());
                    errors.add("Failed to delete product ID " + id + ": " + e.getMessage());
                }
            }

            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("deletedCount", deletedCount);
            result.put("errorCount", errors.size());
            result.put("errors", errors);

            log.info("Bulk delete completed. Deleted: {}, Errors: {}", deletedCount, errors.size());
            return ResponseEntity.ok(new ApiResponse<>(true, "Bulk delete completed", result));
        } catch (Exception e) {
            log.error("Bulk delete failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Failed to process bulk delete: " + e.getMessage()));
        }
    }

    @PostMapping("/images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<String>>> uploadImages(
            @RequestParam("files") MultipartFile[] files) {
        try {
            java.util.List<String> fileUrls = new ArrayList<>();
            Path uploadDir = Paths.get("uploads/images");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            for (MultipartFile file : files) {
                String originalFilename = file.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String filename = UUID.randomUUID().toString() + extension;
                Path filePath = uploadDir.resolve(filename);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                fileUrls.add("/uploads/images/" + filename);
            }

            return ResponseEntity.ok(new ApiResponse<>(true, "Images uploaded successfully", fileUrls));
        } catch (Exception e) {
            log.error("Failed to upload images", e);
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Failed to upload images: " + e.getMessage()));
        }
    }
}
