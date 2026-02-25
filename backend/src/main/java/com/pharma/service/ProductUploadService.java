package com.pharma.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.pharma.model.Category;
import com.pharma.model.Product;
import com.pharma.model.SubCategory;
import com.pharma.repository.CategoryRepository;
import com.pharma.repository.ProductRepository;
import com.pharma.repository.SubCategoryRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductUploadService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;

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

    public byte[] generateTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            // 1. Create the main "Products" sheet
            Sheet sheet = workbook.createSheet("Products");
            Row headerRow = sheet.createRow(0);
            
            String[] columns = {
                "Name *", "Description", "Manufacturer", "Price *", "Stock Quantity *", 
                "Category *", "Image URL", "Prescription Required", "Is Bundle Offer", 
                "Bundle Buy Quantity", "Bundle Free Quantity", "Bundle Price", "Sub-Category"
            };
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }

            // 2. Create the hidden "Data" sheet for dropdown values
            Sheet dataSheet = workbook.createSheet("Data");
            
            // Populate Categories
            List<Category> categories = categoryRepository.findAll();
            Row categoryHeader = dataSheet.createRow(0);
            categoryHeader.createCell(0).setCellValue("Categories");
            
            int rowIndex = 1;
            for (Category category : categories) {
                Row row = dataSheet.getRow(rowIndex);
                if (row == null) row = dataSheet.createRow(rowIndex);
                row.createCell(0).setCellValue(category.getName());
                rowIndex++;
            }
            
            // Populate Sub-Categories
            List<SubCategory> subCategories = subCategoryRepository.findAll();
            categoryHeader.createCell(1).setCellValue("SubCategories");
            
            rowIndex = 1;
            for (SubCategory subCategory : subCategories) {
                Row row = dataSheet.getRow(rowIndex);
                if (row == null) row = dataSheet.createRow(rowIndex);
                row.createCell(1).setCellValue(subCategory.getName());
                rowIndex++;
            }

            // Hide the Data sheet
            workbook.setSheetHidden(1, true);

            // 3. Add Data Validation for the "Products" sheet
            DataValidationHelper validationHelper = sheet.getDataValidationHelper();

            // Setup Category Validation (Column F / Index 5)
            if (!categories.isEmpty()) {
                CellRangeAddressList categoryAddressList = new CellRangeAddressList(1, 1000, 5, 5);
                String categoryFormula = "Data!$A$2:$A$" + (categories.size() + 1);
                DataValidationConstraint categoryConstraint = validationHelper.createFormulaListConstraint(categoryFormula);
                DataValidation categoryValidation = validationHelper.createValidation(categoryConstraint, categoryAddressList);
                categoryValidation.setShowErrorBox(true);
                sheet.addValidationData(categoryValidation);
            }

            // Setup Sub-Category Validation (Column M / Index 12)
            if (!subCategories.isEmpty()) {
                CellRangeAddressList subCategoryAddressList = new CellRangeAddressList(1, 1000, 12, 12);
                String subCategoryFormula = "Data!$B$2:$B$" + (subCategories.size() + 1);
                DataValidationConstraint subCategoryConstraint = validationHelper.createFormulaListConstraint(subCategoryFormula);
                DataValidation subCategoryValidation = validationHelper.createValidation(subCategoryConstraint, subCategoryAddressList);
                subCategoryValidation.setShowErrorBox(true);
                sheet.addValidationData(subCategoryValidation);
            }

            workbook.write(out);
            return out.toByteArray();
        }
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
        Category category = categoryRepository.findByNameIgnoreCase(categoryStr.trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + categoryStr + ". Please ensure this category exists in the system."));
        product.setCategory(category);

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
        String subCategoryStr = getCellValueAsString(row.getCell(12));
        if (subCategoryStr != null && !subCategoryStr.trim().isEmpty()) {
            SubCategory subCategory = subCategoryRepository.findByNameIgnoreCaseAndCategory(subCategoryStr.trim(), product.getCategory())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid sub-category: " + subCategoryStr + " for category: " + product.getCategory().getName()));
            product.setSubCategory(subCategory);
        }

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


}
