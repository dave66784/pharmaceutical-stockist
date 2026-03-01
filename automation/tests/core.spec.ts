import { test, expect } from '@playwright/test';

const adminEmail = 'admin@pharma.com';
const adminPass = 'Admin@123';
const customerEmail = `customer_${Date.now()}@test.com`;
const customerPass = 'Password123!';
const productName = `Test Product ${Date.now()}`;
let testCategorySlug = '';

test.describe('Customer Core Workflows', () => {
    test.describe.configure({ mode: 'serial' });


    test.beforeAll(async ({ request }) => {
        // 1. Login as Admin
        const loginRes = await request.post('/api/auth/login', {
            data: { email: adminEmail, password: adminPass }
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;
        expect(token).toBeTruthy();

        const catRes = await request.get('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } });
        const catData = await catRes.json();
        const firstCat = catData.data[0];
        testCategorySlug = firstCat.slug;

        // 2. Create Product
        const productRes = await request.post('/api/products', {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                name: productName,
                description: 'Description for test product',
                price: 25.50,
                stockQuantity: 100,
                categoryId: firstCat.id,
                manufacturer: 'PharmaTest Inc'
            }
        });
        expect(productRes.ok()).toBeTruthy();

        const payload = {
            firstName: 'Test',
            lastName: 'Customer',
            email: customerEmail,
            password: customerPass,
            phone: '1234567890'
        };
        await request.post('/api/auth/send-otp', { data: payload });
        const regRes = await request.post('/api/auth/verify-otp', { data: { email: customerEmail, otp: '123456' } });
        // If user already exists (e.g. re-run), ignoring 400.
        // But with unique email, it should be 200.
        expect(regRes.ok()).toBeTruthy();
    });

    test.beforeEach(async ({ page }) => {
        // Login as Customer
        await page.goto('/login');
        await page.getByLabel('Email').fill(customerEmail);
        await page.getByLabel('Password').fill(customerPass);
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Use a more relaxed URL expectation or check for home content
        // Customer redirects to /
        await expect(page).toHaveURL(/\/$/);
    });

    test('should list products and filter by category', async ({ page }) => {
        // Go to products page
        await page.getByRole('link', { name: 'Products' }).first().click();
        await expect(page).toHaveURL(/.*products/);

        // Filter by OTHER since we created one
        await page.getByLabel('Category:').selectOption(testCategorySlug);

        // Wait for product to appear
        await expect(page.getByText(productName)).toBeVisible();
    });

    test('should add item to cart', async ({ page }) => {
        await page.getByRole('link', { name: 'Products' }).first().click();

        // Filter to find our specific product
        await page.getByLabel('Category:').selectOption(testCategorySlug);
        await expect(page.getByText(productName)).toBeVisible();

        // Click Add to Cart button (using title attribute)
        // Find the card containing our product name, then find the button within it
        const productCard = page.locator('div', { hasText: productName }).last();
        const addToCartBtn = productCard.locator('button[title="Add to Cart"]');

        await addToCartBtn.click();

        // Verify success toast message
        await expect(page.getByText(`Added ${productName} to cart`)).toBeVisible();
    });

    test('should view cart', async ({ page }) => {
        await page.getByRole('link', { name: 'Products' }).first().click();

        // Add item first to ensure cart is not empty
        await page.getByLabel('Category:').selectOption(testCategorySlug);
        // Wait for product to exist
        await expect(page.getByText(productName)).toBeVisible();

        const productCard = page.locator('div', { hasText: productName }).last();
        await productCard.locator('button[title="Add to Cart"]').click();

        // Go to Cart (Cart icon has no text, so use href)
        await page.locator('a[href="/cart"]').first().click();
        await expect(page).toHaveURL(/.*cart/);

        // Verify Item is there
        await expect(page.getByText(productName)).toBeVisible();
    });

    test('should complete checkout workflow', async ({ page }) => {
        // 1. Add item to cart
        await page.getByRole('link', { name: 'Products' }).first().click();
        await page.getByLabel('Category:').selectOption(testCategorySlug);
        await expect(page.getByText(productName)).toBeVisible();
        const productCard = page.locator('div', { hasText: productName }).last();
        await productCard.locator('button[title="Add to Cart"]').click();

        // 2. Go to Checkout
        // We can go via Cart or directly if there's a link, but let's go via Cart for realism
        await page.locator('a[href="/cart"]').first().click();
        await expect(page).toHaveURL(/.*cart/);
        await page.getByRole('button', { name: /Checkout|Proceed/i }).click();
        await expect(page).toHaveURL(/.*checkout/);

        // 3. Fill Shipping Address
        // Check if "Use New Address" is selected by default or we need to click it.
        // Based on Checkout.tsx: const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
        // So it's 'new' by default.
        await page.fill('input[name="street"]', '123 Test St');
        await page.fill('input[name="city"]', 'Test City');
        await page.fill('input[name="state"]', 'TS');
        await page.fill('input[name="zipCode"]', '12345');
        // Country defaults to USA

        await page.getByRole('button', { name: 'Continue to Payment' }).click();

        // 4. Payment
        await expect(page).toHaveURL(/.*payment/);

        // Debugging: Listen to console
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Explicitly select COD (even if default) to ensure interactivity
        await page.getByText('Cash on Delivery', { exact: true }).click();

        // Wait for button to be enabled and visible
        const placeOrderBtn = page.getByRole('button', { name: /Place Order/i });
        await expect(placeOrderBtn).toBeVisible();
        await expect(placeOrderBtn).toBeEnabled();

        // Click and wait for response or navigation
        // Note: The click triggers an API call.
        await placeOrderBtn.click();

        // 5. Success
        // Waits for navigation to /orders/:id
        // Increase timeout just in case backend is slow
        await expect(page).toHaveURL(/.*orders\/\d+/, { timeout: 10000 });
        await expect(page.getByText('Order placed successfully')).toBeVisible();
        await expect(page.getByText('Order Items')).toBeVisible();
    });

    test('should view order history', async ({ page }) => {
        // Authenticate as the test customer
        await page.goto('/login');
        await page.fill('input[name="email"]', customerEmail);
        await page.fill('input[name="password"]', customerPass);
        await page.click('button[type="submit"]');
        // Wait for successful login (usually redirects to /products or /)
        await page.waitForURL(url => !url.href.includes('/login'));

        // Open User Menu dropdown
        await page.getByRole('button', { name: 'Open user menu' }).click();

        // Navigate to Orders via Link in Navbar
        // The link might be in a dropdown, so we wait for it to be visible
        const ordersLink = page.getByRole('menuitem', { name: 'My Orders' });
        await expect(ordersLink).toBeVisible();
        await ordersLink.click();
        await expect(page).toHaveURL(/.*orders/);

        // Verify that at least some orders are listed
        await expect(page.getByRole('heading', { name: 'Order History' })).toBeVisible();

        // Check for the "Details" link (case-insensitive)
        const detailsLink = page.getByRole('link', { name: /Details/i });
        await expect(detailsLink.first()).toBeVisible();
    });

    test('should view product list as admin', async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.fill('input[name="email"]', adminEmail);
        await page.fill('input[name="password"]', adminPass);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*admin/);

        // Navigate to Products in Admin Panel
        // Use href selector for robustness as there are multiple links
        await page.locator('a[href="/admin/products"]').first().click();
        await expect(page).toHaveURL(/.*admin\/products/);

        // Verify our test product is listed
        await expect(page.getByText(productName)).toBeVisible();
    });

    // Cleanup hook remains here...
    test.afterAll(async ({ request }) => {
        // Authenticate as Admin to clean up
        const loginRes = await request.post('/api/auth/login', {
            data: { email: adminEmail, password: adminPass }
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        // Search for the product to get its ID (since we only have name)
        // Or we could have stored the ID from creation.
        // Let's rely on search by name if API supports it, or recreate the flow to store ID.
        // Actually, let's fetch products by category OTHER and find it.
        const searchRes = await request.get(`/api/products/search?query=${productName}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (searchRes.ok()) {
            const searchData = await searchRes.json();
            const product = searchData.data.content.find((p: any) => p.name === productName);

            if (product) {
                const deleteRes = await request.delete(`/api/products/${product.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                expect(deleteRes.ok()).toBeTruthy();
            }
        }
    });

});
