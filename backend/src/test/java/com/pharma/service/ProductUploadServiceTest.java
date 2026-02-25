package com.pharma.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;

import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pharma.model.Category;
import com.pharma.model.SubCategory;
import com.pharma.repository.CategoryRepository;
import com.pharma.repository.ProductRepository;
import com.pharma.repository.SubCategoryRepository;

@ExtendWith(MockitoExtension.class)
public class ProductUploadServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SubCategoryRepository subCategoryRepository;

    @InjectMocks
    private ProductUploadService productUploadService;

    private Category testCategory;
    private SubCategory testSubCategory;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Pain Relief");

        testSubCategory = new SubCategory();
        testSubCategory.setId(1L);
        testSubCategory.setName("Paracetamol");
        testSubCategory.setCategory(testCategory);
    }

    @Test
    void testGenerateTemplate() throws IOException {
        when(categoryRepository.findAll()).thenReturn(Arrays.asList(testCategory));
        when(subCategoryRepository.findAll()).thenReturn(Arrays.asList(testSubCategory));

        byte[] templateBytes = productUploadService.generateTemplate();
        assertNotNull(templateBytes);
        assertTrue(templateBytes.length > 0);

        try (ByteArrayInputStream bis = new ByteArrayInputStream(templateBytes);
             Workbook workbook = new XSSFWorkbook(bis)) {
             
            Sheet productsSheet = workbook.getSheet("Products");
            assertNotNull(productsSheet);
            assertNotNull(productsSheet.getRow(0)); // Header row exists
            
            Sheet dataSheet = workbook.getSheet("Data");
            assertNotNull(dataSheet);
            assertTrue(workbook.isSheetHidden(workbook.getSheetIndex("Data")));
        }
    }
}
