import { test, expect } from '@playwright/test';

const adminEmail = 'admin@pharma.com';
const adminPass = 'Admin@123';
const customerEmail = `p_user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}@test.com`;
const customerPass = 'Password123!';
const productName = `StockLimit_${Math.random().toString(36).substring(2, 11)}`;
let testCategorySlug = '';
let createdProductId: number | null = null;

test.describe('User Profile & Stock Limit', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ request }) => {
        // 1. Admin login
        const loginRes = await request.post('/api/auth/login', {
            data: { email: adminEmail, password: adminPass }
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        // 2. Fetch a category
        const catRes = await request.get('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
        expect(catRes.ok()).toBeTruthy();
        const catData = await catRes.json();
        const firstCat = catData.data[0];
        testCategorySlug = firstCat.slug;

        // 3. Create a product with low stock (5 units) for stock limit test
        const prodRes = await request.post('/api/products', {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: productName,
                description: 'Product for stock limit testing',
                price: 8.00,
                stockQuantity: 5,
                categoryId: firstCat.id,
                manufacturer: 'LimitedStockCo'
            }
        });
        expect(prodRes.ok()).toBeTruthy();
        const prodData = await prodRes.json();
        createdProductId = prodData.data?.id ?? null;

        // VERIFY STOCK via API immediately to rule out backend truncation
        const verifyStockRes = await request.get(`/api/products/${createdProductId}`);
        const verifyStockData = await verifyStockRes.json();
        expect(verifyStockData.data.stockQuantity).toBe(5);

        // 4. Register customer
        const payload = { firstName: 'Profile', lastName: 'Tester', email: customerEmail, password: customerPass, phone: '5555555555' };
        const otpRes = await request.post('/api/auth/send-otp', { data: payload });
        expect(otpRes.ok()).toBeTruthy();

        const verifyRes = await request.post('/api/auth/verify-otp', { data: { email: customerEmail, otp: '123456' } });
        expect(verifyRes.ok()).toBeTruthy();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill(customerEmail);
        await page.getByLabel('Password').fill(customerPass);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    });

    // ─── Profile Page ────────────────────────────────────────────────────────────

    test('should navigate to profile page', async ({ page }) => {
        await page.getByRole('button', { name: 'Open user menu' }).click();
        await page.getByRole('menuitem', { name: /Profile|My Profile/i }).click();
        await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
        await expect(page.getByRole('heading', { name: /Profile|Account/i }).first()).toBeVisible();
    });

    test('should update user first name and last name', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // First input in the grid = First Name, second = Last Name
        const firstNameInput = page.locator('input[type="text"]').nth(0);
        await firstNameInput.fill('UpdatedFirst');

        const lastNameInput = page.locator('input[type="text"]').nth(1);
        await lastNameInput.fill('UpdatedLast');

        // Submit the profile form
        await page.getByRole('button', { name: 'Update Profile' }).click();

        // Toast confirmation - Profile.tsx calls showToast('success', 'Profile updated successfully')
        await expect(page.getByText('Profile updated successfully')).toBeVisible({ timeout: 15000 });
    });

    test('should keep Update Password button disabled when passwords do not match', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');

        // Fill the password section inputs (password inputs, in order: current, new, confirm)
        const passwordInputs = page.locator('input[type="password"]');
        await passwordInputs.nth(0).fill(customerPass);      // Current Password
        await passwordInputs.nth(1).fill('NewPass@123');     // New Password
        await passwordInputs.nth(2).fill('Mismatch@456');    // Confirm Password (different)

        // The button should remain disabled since passwords don't match
        // Profile.tsx: button is disabled if newPassword !== confirmPassword
        const updatePasswordBtn = page.getByRole('button', { name: 'Update Password' });
        await expect(updatePasswordBtn).toBeDisabled();
    });

    // ─── Stock Limit Enforcement in Cart ────────────────────────────────────────

    test('should disable + button when cart quantity reaches stock limit', async ({ page }) => {
        test.slow(); // Increases timeout 3x

        // Add the low-stock product to cart
        await page.goto('/products');
        await page.getByLabel('Category:').selectOption(testCategorySlug);

        // Wait for product card with unique name to appear
        const card = page.locator('div', { hasText: productName }).last();
        await expect(card).toBeVisible({ timeout: 15000 });

        await card.locator('button[title="Add to Cart"]').click();
        await expect(page.getByText(`Added ${productName} to cart`)).toBeVisible({ timeout: 15000 });

        // Go to Cart
        await page.locator('a[href="/cart"]').first().click();
        await expect(page).toHaveURL(/.*cart/, { timeout: 15000 });

        const row = page.locator('li', { hasText: productName });
        await expect(row).toBeVisible({ timeout: 15000 });

        const increaseBtn = row.getByRole('button', { name: '+' });
        const quantityDisplay = row.locator('span').filter({ hasText: /^\d+$/ }).first();

        // Initial qty is 1. Stock is 5.
        // Increments: 2, 3, 4, 5
        for (let i = 2; i <= 5; i++) {
            await expect(increaseBtn, `Button should be enabled for qty ${i}`).toBeEnabled({ timeout: 10000 });
            await increaseBtn.click();
            await expect(quantityDisplay, `Quantity should reach ${i}`).toHaveText(i.toString(), { timeout: 30000 });
        }

        // Now it should be disabled at 5
        await expect(increaseBtn).toBeDisabled({ timeout: 15000 });
        await expect(page.getByText('Max stock limit')).toBeVisible({ timeout: 10000 });
    });

    test('should show stock limit warning on Product Detail page', async ({ page }) => {
        // Navigate to product detail directly via the product name link
        await page.goto('/products');
        await page.getByLabel('Category:').selectOption(testCategorySlug);

        const productLink = page.getByRole('link', { name: productName }).first();
        await expect(productLink).toBeVisible({ timeout: 15000 });
        await productLink.click();

        await expect(page).toHaveURL(/.*products\/\d+/, { timeout: 15000 });
        await page.waitForLoadState('networkidle');

        // Increment quantity to max (5)
        const increaseBtn = page.getByRole('button', { name: '+' });
        for (let i = 2; i <= 5; i++) {
            await expect(increaseBtn).toBeEnabled({ timeout: 10000 });
            await increaseBtn.click();
        }

        // At stock limit, button disabled and warning shown
        await expect(increaseBtn).toBeDisabled({ timeout: 15000 });
        await expect(page.getByText('Maximum available stock reached')).toBeVisible({ timeout: 15000 });
    });

    // ─── Checkout State Persistence ─────────────────────────────────────────────

    test('should persist shipping address across page refresh on Payment page', async ({ page, request }) => {
        // Add to cart via API first for speed
        const loginRes = await request.post('/api/auth/login', {
            data: { email: customerEmail, password: customerPass }
        });
        const { data: { token } } = await loginRes.json();
        await request.post('/api/cart/items', {
            headers: { Authorization: `Bearer ${token}` },
            data: { productId: createdProductId, quantity: 1 }
        });

        // Go to cart → checkout
        await page.goto('/cart');
        await page.getByRole('button', { name: /Checkout|Proceed/i }).click();
        await expect(page).toHaveURL(/.*checkout/, { timeout: 15000 });

        // Fill shipping address
        await page.fill('input[name="street"]', '99 Persist Lane');
        await page.fill('input[name="city"]', 'Stateville');
        await page.fill('input[name="state"]', 'ST');
        await page.fill('input[name="zipCode"]', '77777');
        await page.getByRole('button', { name: 'Continue to Payment' }).click();
        await expect(page).toHaveURL(/.*payment/, { timeout: 15000 });

        // Reload the payment page to test persistence
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should still be on the payment page (not redirected to checkout)
        await expect(page).toHaveURL(/.*payment/, { timeout: 15000 });

        // The order summary should still display the shipping address
        await expect(page.getByText(/99 Persist Lane/i)).toBeVisible({ timeout: 15000 });
    });

    test.afterAll(async ({ request }) => {
        if (!createdProductId) return;
        const loginRes = await request.post('/api/auth/login', { data: { email: adminEmail, password: adminPass } });
        const { data: { token } } = await loginRes.json();
        await request.delete(`/api/products/${createdProductId}`, { headers: { Authorization: `Bearer ${token}` } });
    });
});
