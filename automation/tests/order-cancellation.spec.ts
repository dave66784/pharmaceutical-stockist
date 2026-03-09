import { test, expect } from '@playwright/test';

const adminEmail = 'admin@pharma.com';
const adminPass = 'Admin@123';
const customerEmail = `c_user_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
const customerPass = 'Password123!';
const productName = `Cancel Prod ${Date.now()}_${Math.floor(Math.random() * 1000)}`;
let testCategorySlug = '';
let createdProductId: number | null = null;

test.describe('Order Cancellation', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ request }) => {
        // 1. Admin login
        const loginRes = await request.post('/api/auth/login', {
            data: { email: adminEmail, password: adminPass }
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        // 2. Fetch first category
        const catRes = await request.get('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
        expect(catRes.ok()).toBeTruthy();
        const catData = await catRes.json();
        const firstCat = catData.data[0];
        testCategorySlug = firstCat.slug;

        // 3. Create product
        const prodRes = await request.post('/api/products', {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: productName,
                description: 'Product for cancellation tests',
                price: 20.00,
                stockQuantity: 10,
                categoryId: firstCat.id,
                manufacturer: 'CancelCorp'
            }
        });
        expect(prodRes.ok()).toBeTruthy();
        const prodData = await prodRes.json();
        createdProductId = prodData.data?.id ?? null;

        // 4. Register customer via OTP
        const payload = { firstName: 'Cancel', lastName: 'Tester', email: customerEmail, password: customerPass, phone: '9999999999' };
        const sendOtpRes = await request.post('/api/auth/send-otp', { data: payload });
        expect(sendOtpRes.ok()).toBeTruthy();

        const verifyOtpRes = await request.post('/api/auth/verify-otp', { data: { email: customerEmail, otp: '123456' } });
        expect(verifyOtpRes.ok()).toBeTruthy();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill(customerEmail);
        await page.getByLabel('Password').fill(customerPass);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    });

    /**
     * Helper: places an order via API and returns the order ID.
     */
    async function placeOrderViaApi(request: any): Promise<number> {
        const loginRes = await request.post('/api/auth/login', {
            data: { email: customerEmail, password: customerPass }
        });
        const { data: { token } } = await loginRes.json();

        // Add to cart
        await request.post('/api/cart/items', {
            headers: { Authorization: `Bearer ${token}` },
            data: { productId: createdProductId, quantity: 1 }
        });

        // Place order
        const orderRes = await request.post('/api/orders', {
            headers: { Authorization: `Bearer ${token}` },
            data: { shippingAddress: '1 Cancel Lane, Testville, TV 00000', paymentMethod: 'COD' }
        });
        const orderData = await orderRes.json();
        return orderData.data.id as number;
    }

    test('should show Cancel button only for PENDING orders on Orders page', async ({ page, request }) => {
        const orderId = await placeOrderViaApi(request);

        await page.getByRole('button', { name: 'Open user menu' }).click();
        await page.getByRole('menuitem', { name: 'My Orders' }).click();
        await expect(page).toHaveURL(/.*orders/, { timeout: 15000 });

        const orderRow = page.locator('li', { hasText: `Order #${orderId}` });
        await expect(orderRow).toBeVisible({ timeout: 15000 });

        const cancelBtn = orderRow.getByRole('button', { name: 'Cancel' });
        await expect(cancelBtn).toBeVisible({ timeout: 10000 });
    });

    test('should successfully cancel a PENDING order from Orders page', async ({ page, request }) => {
        const orderId = await placeOrderViaApi(request);

        await page.getByRole('button', { name: 'Open user menu' }).click();
        await page.getByRole('menuitem', { name: 'My Orders' }).click();
        await expect(page).toHaveURL(/.*orders/, { timeout: 15000 });

        const orderRow = page.locator('li', { hasText: `Order #${orderId}` });
        await expect(orderRow).toBeVisible({ timeout: 15000 });

        page.on('dialog', dialog => dialog.accept());
        await orderRow.getByRole('button', { name: 'Cancel' }).click();

        await expect(page.getByText('Order cancelled successfully')).toBeVisible({ timeout: 15000 });
        await expect(orderRow.getByText('CANCELLED')).toBeVisible({ timeout: 15000 });
        await expect(orderRow.getByRole('button', { name: 'Cancel' })).not.toBeVisible({ timeout: 10000 });
    });

    test('should successfully cancel a PENDING order from Order Details page', async ({ page, request }) => {
        const orderId = await placeOrderViaApi(request);

        await page.goto(`/orders/${orderId}`);
        await page.waitForLoadState('networkidle');

        const cancelBtn = page.getByRole('button', { name: 'Cancel Order' });
        await expect(cancelBtn).toBeVisible({ timeout: 15000 });

        page.on('dialog', dialog => dialog.accept());
        await cancelBtn.click();

        await expect(page.getByText('Order cancelled successfully')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('CANCELLED').first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Order Tracking')).not.toBeVisible({ timeout: 10000 });
    });

    test('should NOT show Cancel button for a CONFIRMED order', async ({ page, request }) => {
        const orderId = await placeOrderViaApi(request);

        const adminLoginRes = await request.post('/api/auth/login', { data: { email: adminEmail, password: adminPass } });
        const { data: { token } } = await adminLoginRes.json();
        await request.put(`/api/admin/orders/${orderId}/status?status=CONFIRMED`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        await page.goto(`/orders/${orderId}`);
        await page.waitForLoadState('networkidle');

        const cancelBtn = page.getByRole('button', { name: 'Cancel Order' });
        await expect(cancelBtn).not.toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Order Tracking')).toBeVisible({ timeout: 15000 });
    });

    test.afterAll(async ({ request }) => {
        if (!createdProductId) return;
        const loginRes = await request.post('/api/auth/login', { data: { email: adminEmail, password: adminPass } });
        const { data: { token } } = await loginRes.json();
        await request.delete(`/api/products/${createdProductId}`, { headers: { Authorization: `Bearer ${token}` } });
    });
});
