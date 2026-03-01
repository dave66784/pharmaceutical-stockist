import { test, expect } from '@playwright/test';

const adminEmail = 'admin@pharma.com';
const adminPass = 'Admin@123';

test.describe('Admin Dashboard Workflows', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.getByLabel('Email').fill(adminEmail);
        await page.getByLabel('Password').fill(adminPass);
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Wait for redirection to admin dashboard
        await expect(page).toHaveURL(/.*admin/);
        // Sometimes the URL is just /admin or /admin/dashboard

        // Verify Dashboard Header
        await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
    });

    test('should view main dashboard statistics', async ({ page }) => {
        // Verify that the statistics cards are visible
        // By checking for the titles of the cards in AdminDashboard.tsx
        await expect(page.getByText('Total Revenue')).toBeVisible();
        await expect(page.getByText('Total Orders')).toBeVisible();
        await expect(page.getByText('Total Customers')).toBeVisible();
        await expect(page.getByText('Total Products')).toBeVisible();

        // Ensure Revenue Chart is present (canvas or container)
        // Usually recharts or chart.js renders a canvas or svg
        const chartsCount = await page.locator('.recharts-wrapper, canvas').count();
        expect(chartsCount).toBeGreaterThan(0);
    });

    test('should navigate to products management', async ({ page }) => {
        // Click Products in sidebar
        // Sidebar usually has links. If not found by name, use href
        await page.locator('a[href="/admin/products"]').first().click();
        await expect(page).toHaveURL(/.*admin\/products/);

        // Verify Products Management header
        await expect(page.getByRole('heading', { name: 'Manage Products' })).toBeVisible();

        // Verify Add Product button is visible
        await expect(page.getByRole('button', { name: /Add Product/i })).toBeVisible();
    });

    test('should navigate to orders management', async ({ page }) => {
        // Click Orders in sidebar
        await page.locator('a[href="/admin/orders"]').first().click();
        await expect(page).toHaveURL(/.*admin\/orders/);

        // Verify Orders Management header
        await expect(page.getByRole('heading', { name: 'Manage Orders' })).toBeVisible();

        // Check for table headers
        await expect(page.getByText('Order ID')).toBeVisible();
        await expect(page.getByText('Customer')).toBeVisible();
        await expect(page.getByText('Status')).toBeVisible();
    });

    test('should navigate to users management', async ({ page }) => {
        // Click Users in sidebar
        await page.locator('a[href="/admin/users"]').first().click();
        await expect(page).toHaveURL(/.*admin\/users/);

        // Verify Users Management header
        await expect(page.getByRole('heading', { name: 'Manage Users' })).toBeVisible();

        // Ensure the users table loads by checking specific columns
        await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    });
});
