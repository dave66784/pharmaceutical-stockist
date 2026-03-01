import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const adminEmail = 'admin@pharma.com';
const adminPass = 'Admin@123';

test.describe('Product Management - Image Upload', () => {
    test.beforeAll(async ({ request }) => {
        // Ensure admin user exists
        // (Assuming create_admin.sh was run)
    });

    test('should create product with image upload', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPass);
        await page.click('button[type="submit"]');

        // 2. Navigate to Admin Dashboard -> Products
        await page.click('text="Admin"');
        await page.click('text="Manage Products"');

        // 3. Click "Add Product"
        await page.click('text="Add Product"');

        // 4. Fill form
        const productName = `Test Image Product ${Date.now()}`;
        await page.fill('input[name="name"]', productName);
        await page.fill('input[name="manufacturer"]', 'Test Lab');
        await page.fill('textarea[name="description"]', 'A product with an uploaded image');
        await page.fill('input[name="price"]', '99.99');
        await page.fill('input[name="stockQuantity"]', '50');

        // Select a category (wait for load)
        const categorySelect = page.locator('select[name="categoryId"]');
        await expect(categorySelect).toBeVisible();
        await categorySelect.selectOption({ index: 1 });

        // 5. Upload Image
        // Create a dummy image file for testing if it doesn't exist
        const testImagePath = path.join(__dirname, 'test-image.png');
        if (!fs.existsSync(testImagePath)) {
            // Using a very small base64 pixel as a dummy image
            const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
            fs.writeFileSync(testImagePath, Buffer.from(base64Data, 'base64'));
        }

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text="Upload files"');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(testImagePath);

        // Wait for upload to complete (spinner disappears or image appears)
        await page.waitForSelector('img[alt^="Product 1"]', { timeout: 10000 });

        // 6. Save product
        await page.click('button[type="submit"]:has-text("Save")');

        // 7. Verify in list
        await page.waitForSelector(`text="${productName}"`);
        const productRow = page.locator('tr').filter({ hasText: productName });
        await expect(productRow).toBeVisible();

        // 8. Open Edit mode to verify image is there
        await productRow.locator('button:has-text("Edit")').click();

        // Wait for image in form
        const formImage = page.locator('img[alt^="Product 1"]');
        await expect(formImage).toBeVisible();

        // Verify image natural width (not broken)
        const isBroken = await formImage.evaluate((img: HTMLImageElement) => img.naturalWidth === 0);
        expect(isBroken).toBeFalsy();
    });
});
