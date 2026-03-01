import { test, expect } from '@playwright/test';

const adminEmail = 'admin@pharma.com';
const adminPass = 'Admin@123';
const customerEmail = `cart_user_${Date.now()}@test.com`;
const customerPass = 'Password123!';
const productName = `Cart Test Product ${Date.now()}`;
let testCategorySlug = '';

test.describe('Cart Workflows', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ request }) => {
        // 1. Login as Admin to create a product
        const loginRes = await request.post('/api/auth/login', {
            data: { email: adminEmail, password: adminPass }
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        // Fetch category to use
        const catRes = await request.get('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } });
        const catData = await catRes.json();
        const firstCat = catData.data[0];
        testCategorySlug = firstCat.slug;

        // 2. Create Product
        await request.post('/api/products', {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                name: productName,
                description: 'Description for cart test product',
                price: 15.75,
                stockQuantity: 50,
                categoryId: firstCat.id,
                manufacturer: 'Pharma Cart Inc'
            }
        });

        const payload = {
            firstName: 'Cart',
            lastName: 'Customer',
            email: customerEmail,
            password: customerPass,
            phone: '1234567890'
        };
        await request.post('/api/auth/send-otp', { data: payload });
        await request.post('/api/auth/verify-otp', { data: { email: customerEmail, otp: '123456' } });
    });

    test.beforeEach(async ({ page }) => {
        // Login as Customer
        await page.goto('/login');
        await page.getByLabel('Email').fill(customerEmail);
        await page.getByLabel('Password').fill(customerPass);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/$/);
    });

    test('should update item quantity in cart', async ({ page }) => {
        // Add item to cart
        await page.getByRole('link', { name: 'Products' }).first().click();
        await page.getByLabel('Category:').selectOption(testCategorySlug);
        await expect(page.getByText(productName)).toBeVisible();
        const productCard = page.locator('div', { hasText: productName }).last();
        await productCard.locator('button[title="Add to Cart"]').click();
        await expect(page.getByText(`Added ${productName} to cart`)).toBeVisible();

        // Go to Cart
        await page.locator('a[href="/cart"]').first().click();
        await expect(page).toHaveURL(/.*cart/);

        // Verify initial quantity and total
        const row = page.locator('li', { hasText: productName });
        const quantitySpan = row.locator('span.text-center');
        await expect(quantitySpan).toHaveText('1');

        // Wait for the total to be visible (price * 1)
        await expect(row.getByText('$15.75').first()).toBeVisible();

        // Update quantity
        const increaseBtn = row.getByRole('button', { name: '+' });
        await increaseBtn.click();
        await expect(quantitySpan).toHaveText('2');
        await increaseBtn.click();
        await expect(quantitySpan).toHaveText('3');

        // Check new total (price * 3)
        await expect(row.getByText('$47.25')).toBeVisible();

        // Also check main cart total
        await expect(page.getByText('$47.25').last()).toBeVisible();
    });

    test('should remove item from cart', async ({ page }) => {
        // Go to Cart (assuming item was added in previous test due to serial mode)
        await page.locator('a[href="/cart"]').first().click();
        await expect(page).toHaveURL(/.*cart/);

        const row = page.locator('li', { hasText: productName });
        await expect(row).toBeVisible();

        // Click remove button (trash icon or 'Remove' text, let's look for a button with danger/red or specific text in Cart.tsx)
        // Usually it's an X or Trash icon with a title or aria-label
        const removeButton = row.locator('button').last(); // Assuming remove is the last button in the row
        await removeButton.click();

        // Verify item is removed
        await expect(page.getByText(productName)).not.toBeVisible();

        // Verify empty cart message
        await expect(page.getByText('Your cart is empty')).toBeVisible();
    });

    test.afterAll(async ({ request }) => {
        // Clean up product
        const loginRes = await request.post('/api/auth/login', {
            data: { email: adminEmail, password: adminPass }
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        const searchRes = await request.get(`/api/products/search?query=${productName}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (searchRes.ok()) {
            const searchData = await searchRes.json();
            const product = searchData.data.content.find((p: any) => p.name === productName);

            if (product) {
                await request.delete(`/api/products/${product.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        }
    });
});
