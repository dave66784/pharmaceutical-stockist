import { chromium, expect } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('request', request => {
        if (request.url().includes('api/products')) {
            console.log('>>', request.method(), request.url());
        }
    });

    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123'); // Assume this is the password from previous tasks
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    console.log('Navigating to Products...');
    await page.goto('http://localhost:3000/products?category=VACCINES');

    await page.waitForTimeout(2000);

    console.log('Clicking Tdap...');
    await page.locator('button', { hasText: 'Tdap' }).click();

    await page.waitForTimeout(2000);

    const productCards = await page.locator('.group.bg-white.rounded-2xl.shadow-sm').count();
    console.log('Number of product cards rendered:', productCards);

    await browser.close();
})();
