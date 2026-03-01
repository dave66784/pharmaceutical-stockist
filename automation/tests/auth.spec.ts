import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should show login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();
    });

    test('should login successfully as admin', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('admin@pharma.com');
        await page.getByLabel('Password').fill('Admin@123');
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Expect to be redirected to admin dashboard
        await expect(page).toHaveURL(/.*admin/);
        await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('invalid@user.com');
        await page.getByLabel('Password').fill('wrongpassword');
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Match common error messages
        await expect(page.getByText(/Invalid|failed|Bad credentials/i)).toBeVisible();
    });
});
