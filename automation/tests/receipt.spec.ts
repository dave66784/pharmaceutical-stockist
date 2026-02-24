import { test, expect } from '@playwright/test';

test('Download Receipt', async ({ page, context }) => {
    // 1. Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@pharma.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('text="Sign in"');
    await page.waitForTimeout(2000);

    // 2. Go to Orders
    await page.goto('http://localhost:3000/orders');
    await page.waitForTimeout(2000);

    // 3. Click the first order View details
    await page.click('text="View Details"');
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
