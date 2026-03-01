import { test, expect } from '@playwright/test';

const existingUserEmail = `existing_${Date.now()}@test.com`;

test.describe('Registration Workflows', () => {

    test.beforeAll(async ({ request }) => {
        const payload = {
            firstName: 'Existing',
            lastName: 'User',
            email: existingUserEmail,
            password: 'Password123!',
            phone: '1234567890'
        };
        await request.post('/api/auth/send-otp', { data: payload });
        await request.post('/api/auth/verify-otp', { data: { email: existingUserEmail, otp: '123456' } });
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
        await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    });

    test('should prevent registration with existing email', async ({ page }) => {
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'Duplicate');
        await page.fill('input[name="email"]', existingUserEmail);
        await page.fill('input[name="password"]', 'Password123!');

        // The button now says 'Send Verification Code'
        await page.getByRole('button', { name: /Send Verification Code/i }).click();

        // Should see an error message toast or text
        await expect(page.getByText(/already in use|Email already|failed/i)).toBeVisible();
    });

    test('should require minimum password length', async ({ page }) => {
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'ShortPass');
        await page.fill('input[name="email"]', `new_${Date.now()}@test.com`);
        await page.fill('input[name="password"]', 'short');

        await page.getByRole('button', { name: /Send Verification Code/i }).click();

        // HTML5 validation might block submission (minLength={8})
        // We can check if it stays on the page or fails
        const passwordInput = page.locator('input[name="password"]');

        // Evaluate native validity
        const isValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(isValid).toBeFalsy();
    });

    test('should successfully register a new user', async ({ page }) => {
        const newUserEmail = `new_${Date.now()}@test.com`;
        await page.fill('input[name="firstName"]', 'New');
        await page.fill('input[name="lastName"]', 'User');
        await page.fill('input[name="email"]', newUserEmail);
        await page.fill('input[name="password"]', 'Password123!');
        await page.fill('input[name="phone"]', '9876543210');

        await page.getByRole('button', { name: /Send Verification Code/i }).click();

        // Wait for OTP step
        await expect(page.getByText(/Verify Your Email/i)).toBeVisible();
        await page.fill('input[name="otp"]', '123456'); // Using test override OTP

        await page.getByRole('button', { name: /Verify & Create Account/i }).click();

        // Expect to be redirected to login page and see success message
        await expect(page).toHaveURL(/.*products|.*login/);
    });
});
