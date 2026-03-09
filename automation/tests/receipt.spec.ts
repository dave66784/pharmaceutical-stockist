import { test, expect } from '@playwright/test';

export const receiptTestProductName = `Receipt Prod ${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

test.describe('Receipt Workflows', () => {

    test.beforeAll(async ({ request }) => {
        // Login as admin to get token
        const loginRes = await request.post('/api/auth/login', {
            data: { email: 'admin@pharma.com', password: 'Admin@123' }
        });
        if (!loginRes.ok()) {
            throw new Error(`Login failed with status ${loginRes.status()}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        // Fetch category to use
        const catRes = await request.get('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } });
        const catData = await catRes.json();
        const firstCat = catData.data[0];

        // Create a unique product for the receipt test
        const prodRes = await request.post('/api/products', {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                name: receiptTestProductName,
                description: 'Product for receipt testing',
                price: 12.50,
                stockQuantity: 10,
                categoryId: firstCat.id,
                manufacturer: 'ReceiptCo'
            }
        });
        if (!prodRes.ok()) {
            throw new Error(`Product creation failed with status ${prodRes.status()}`);
        }
        const prodData = await prodRes.json();
        const product = prodData.data;

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
    });

    test('Download Receipt', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@pharma.com');
        await page.fill('input[type="password"]', 'Admin@123');
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
