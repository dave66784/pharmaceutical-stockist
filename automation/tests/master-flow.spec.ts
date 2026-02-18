import { test, expect } from '@playwright/test';

test('End-to-End Master Flow', async ({ page, request }) => {
    const adminEmail = 'admin@pharma.com';
    const adminPass = 'admin123';
    const customerEmail = `master_${Date.now()}@test.com`;
    const customerPass = 'Password123!';
    const productName = `Master Product ${Date.now()}`;

    // 1. Setup (API) - Create Admin Product and Register Customer
    // This part is fast and ensures we have clean data for the recording.
    const loginRes = await request.post('/api/auth/login', {
        data: { email: adminEmail, password: adminPass }
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    await request.post('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` },
        data: {
            name: productName,
            description: 'This is a master product for the combined video flow.',
            price: 50.00,
            stockQuantity: 100,
            category: 'OTHER',
            manufacturer: 'MasterFlow Corp'
        }
    });

    await request.post('/api/auth/register', {
        data: {
            firstName: 'Master',
            lastName: 'User',
            email: customerEmail,
            password: customerPass,
            phone: '1234567890'
        }
    });

    // --- START VISUAL FLOW ---

    // 2. Login as Customer
    await page.goto('/login');
    await page.getByLabel('Email').fill(customerEmail);
    await page.getByLabel('Password').fill(customerPass);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/$/);

    // 3. Browse and Filter
    await page.getByRole('link', { name: 'Products' }).first().click();
    await expect(page).toHaveURL(/.*products/);
    await page.getByLabel('Category:').selectOption('OTHER');
    await expect(page.getByText(productName)).toBeVisible();

    // 4. Add to Cart
    const productCard = page.locator('div', { hasText: productName }).last();
    await productCard.locator('button[title="Add to Cart"]').click();
    await expect(page.getByText(/Added .* to cart/i)).toBeVisible();

    // 5. View Cart
    await page.locator('a[href="/cart"]').first().click();
    await expect(page).toHaveURL(/.*cart/);
    await expect(page.getByText(productName)).toBeVisible();

    // 6. Checkout
    await page.getByRole('button', { name: /Checkout|Proceed/i }).click();
    await expect(page).toHaveURL(/.*checkout/);
    await page.fill('input[name="street"]', '456 Master Way');
    await page.fill('input[name="city"]', 'Video City');
    await page.fill('input[name="state"]', 'VC');
    await page.fill('input[name="zipCode"]', '99999');
    await page.getByRole('button', { name: 'Continue to Payment' }).click();

    // 7. Payment and Order Placement
    await expect(page).toHaveURL(/.*payment/);
    await page.getByText('Cash on Delivery', { exact: true }).click();
    await page.getByRole('button', { name: /Place Order/i }).click();

    // 8. Order Confirmation and Details
    await expect(page).toHaveURL(/.*orders\/\d+/);
    await expect(page.getByText('Order placed successfully')).toBeVisible();
    await expect(page.getByText('Order Items')).toBeVisible();

    // 9. Order History
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'My Orders' }).click();
    await expect(page).toHaveURL(/.*orders/);
    await expect(page.getByRole('heading', { name: 'Order History' })).toBeVisible();
    await page.getByRole('link', { name: /Details/i }).first().click();

    // 10. Logout and Admin Check
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/.*login/);

    // 11. Admin Flow
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPass);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/.*admin/);
    await page.locator('a[href="/admin/products"]').first().click();
    await expect(page.getByText(productName)).toBeVisible();

    // Final wait to ensure video captures the state
    await page.waitForTimeout(2000);
});
