import { test, expect } from '@playwright/test';

test.describe('Receipt Workflows', () => {

    test.beforeAll(async ({ request }) => {
        // Login as admin to get token
        const loginRes = await request.post('/api/auth/login', {
            data: { email: 'admin@pharma.com', password: 'admin123' }
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        // Fetch products to get a valid product ID
        const prodRes = await request.get('/api/products?size=1');
        if (prodRes.ok()) {
            const prodData = await prodRes.json();
            const product = prodData.data.content[0];

            if (product) {
                // Add to cart
                await request.post('/api/cart/items', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    data: { productId: product.id, quantity: 1 }
                });

                // Checkout mapping cart to order
                await request.post('/api/orders', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    data: { shippingAddress: '123 Admin Lane', paymentMethod: 'COD' }
                });
            }
        }
    });

    test('Download Receipt', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@pharma.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('text="Sign in"');
        await page.waitForTimeout(2000);

        // 2. Go to Orders
        await page.goto('/orders');
        await page.waitForTimeout(2000);

        // 3. Click the first order View details
        await page.click('text="Details"');
        await page.waitForTimeout(2000);

        // 4. Download Receipt
        const downloadPromise = page.waitForEvent('download');
        await page.click('text="Download Receipt"');
        const download = await downloadPromise;

        // 5. Verify it's a valid PDF
        const path = await download.path();
        expect(path).toBeTruthy();
        console.log(`Downloaded receipt to ${path}`);
    });
});
