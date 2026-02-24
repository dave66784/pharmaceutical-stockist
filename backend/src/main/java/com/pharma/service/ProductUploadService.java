package com.pharma.service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.pharma.model.Product;
import com.pharma.model.enums.ProductCategory;
import com.pharma.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductUploadService {

    private final ProductRepository productRepository;

    public Map<String, Object> uploadProducts(MultipartFile file) throws IOException {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        List<Product> validProducts = new ArrayList<>();
        int successCount = 0;

        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            int rowNum = 0;

            for (Row row : sheet) {
                // Skip header row
                if (rowNum == 0) {
                    rowNum++;
                    continue;
                }

                try {
                    Product product = parseProductFromRow(row, rowNum);
                    if (product != null) {
                        validProducts.add(product);
                    }
                } catch (Exception e) {
                    errors.add("Row " + (rowNum + 1) + ": " + e.getMessage());
                    log.error("Error parsing row {}: {}", rowNum + 1, e.getMessage());
                }

                rowNum++;
            }

            // Save all valid products
            if (!validProducts.isEmpty()) {
                List<Product> savedProducts = productRepository.saveAll(validProducts);
                successCount = savedProducts.size();
            }

        } catch (Exception e) {
            log.error("Error processing Excel file", e);
            throw new IOException("Failed to process Excel file: " + e.getMessage());
        }

        result.put("successCount", successCount);
        result.put("errorCount", errors.size());
        result.put("errors", errors);

        return result;
    }

    private Product parseProductFromRow(Row row, int rowNum) {
        Product product = new Product();

        // Column 0: Name (required)
        String name = getCellValueAsString(row.getCell(0));
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        product.setName(name.trim());

        // Column 1: Description
        product.setDescription(getCellValueAsString(row.getCell(1)));

        // Column 2: Manufacturer
        product.setManufacturer(getCellValueAsString(row.getCell(2)));

        // Column 3: Price (required)
        Double price = getCellValueAsDouble(row.getCell(3));
        if (price == null || price <= 0) {
            throw new IllegalArgumentException("Valid price is required");
        }
        product.setPrice(BigDecimal.valueOf(price));

        // Column 4: Stock Quantity (required)
        Double stockQty = getCellValueAsDouble(row.getCell(4));
        if (stockQty == null || stockQty < 0) {
            throw new IllegalArgumentException("Valid stock quantity is required");
        }
        product.setStockQuantity(stockQty.intValue());

        // Column 5: Category (required)
        String categoryStr = getCellValueAsString(row.getCell(5));
        if (categoryStr == null || categoryStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }
        try {
            ProductCategory category = ProductCategory.valueOf(categoryStr.trim().toUpperCase());
            product.setCategory(category);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category: " + categoryStr + ". Valid categories are: " +
                    String.join(", ", getValidCategories()));
        }

        // Column 6: Image URL (comma separated for multiple)
        String imageUrlStr = getCellValueAsString(row.getCell(6));
        if (imageUrlStr != null && !imageUrlStr.trim().isEmpty()) {
            java.util.List<String> urls = java.util.Arrays.asList(imageUrlStr.split(","));
            // Trim each URL
            urls = urls.stream().map(String::trim).collect(java.util.stream.Collectors.toList());
            product.setImageUrls(urls);
        }

        // Column 7: Prescription Required (default false)
        Boolean prescriptionRequired = getCellValueAsBoolean(row.getCell(7));
        product.setIsPrescriptionRequired(prescriptionRequired != null ? prescriptionRequired : false);

        // Column 8: Is Bundle Offer (default false)
        Boolean isBundleOffer = getCellValueAsBoolean(row.getCell(8));
        product.setIsBundleOffer(isBundleOffer != null ? isBundleOffer : false);

        // Column 9: Bundle Buy Quantity
        Double bundleBuyQty = getCellValueAsDouble(row.getCell(9));
        if (bundleBuyQty != null) {
            product.setBundleBuyQuantity(bundleBuyQty.intValue());
        }

        // Column 10: Bundle Free Quantity
        Double bundleFreeQty = getCellValueAsDouble(row.getCell(10));
        if (bundleFreeQty != null) {
            product.setBundleFreeQuantity(bundleFreeQty.intValue());
        }

        // Column 11: Bundle Price
        Double bundlePrice = getCellValueAsDouble(row.getCell(11));
        if (bundlePrice != null) {
            product.setBundlePrice(BigDecimal.valueOf(bundlePrice));
        }

        // Column 12: Sub-Category
        product.setSubCategory(getCellValueAsString(row.getCell(12)));

        return product;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private Double getCellValueAsDouble(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case NUMERIC:
                return cell.getNumericCellValue();
            case STRING:
                try {
                    return Double.parseDouble(cell.getStringCellValue());
                } catch (NumberFormatException e) {
                    return null;
                }
            default:
                return null;
        }
    }

    private Boolean getCellValueAsBoolean(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case STRING:
                String val = cell.getStringCellValue().toLowerCase();
                return val.equals("true") || val.equals("yes") || val.equals("1");
            case NUMERIC:
                return cell.getNumericCellValue() > 0;
            default:
                return null;
        }
    }

    private List<String> getValidCategories() {
        List<String> categories = new ArrayList<>();
        for (ProductCategory category : ProductCategory.values()) {
            categories.add(category.name());
        }
        return categories;
    }
}
