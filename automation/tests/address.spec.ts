import { test, expect } from '@playwright/test';

const customerEmail = `address_${Date.now()}@test.com`;
const customerPass = 'Password123!';

test.describe('Address Management Workflows', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ request }) => {
        // Register Customer
        await request.post('/api/auth/register', {
            data: {
                firstName: 'Address',
                lastName: 'User',
                email: customerEmail,
                password: customerPass,
                phone: '1234567890'
            }
        });
    });

    test.beforeEach(async ({ page }) => {
        // Login as Customer
        await page.goto('/login');
        await page.getByLabel('Email').fill(customerEmail);
        await page.getByLabel('Password').fill(customerPass);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/$/);

        // Navigate to Address Management
        // Directly navigating is faster and more robust than clicking through menus
        await page.goto('/account/addresses');
        await expect(page.getByRole('heading', { name: 'My Addresses' })).toBeVisible();
    });

    test('should add a new address', async ({ page }) => {
        await page.getByRole('button', { name: 'Add New Address' }).click();
        await expect(page.getByRole('heading', { name: 'Add New Address' })).toBeVisible();

        // Fill form
        const street = '123 Playwright St';
        await page.locator('input[type="text"]').nth(0).fill(street); // Street Address
        await page.locator('input[type="text"]').nth(1).fill('Testingville'); // City
        await page.locator('input[type="text"]').nth(2).fill('TX'); // State
        await page.locator('input[type="text"]').nth(3).fill('12345'); // ZIP Code
        await page.locator('input[type="text"]').nth(4).fill('USA'); // Country

        await page.getByRole('button', { name: 'Save Address' }).click();

        // Wait for save to complete and list to render
        await expect(page.getByText(street)).toBeVisible();
    });

    test('should edit an existing address', async ({ page }) => {
        const oldStreet = '123 Playwright St';
        const newStreet = '456 Updated Ave';

        // Wait for the address card to be visible
        await expect(page.getByText(oldStreet)).toBeVisible();

        const addressCard = page.locator('.bg-white.shadow.rounded-lg.p-6', { hasText: oldStreet });

        // Find Edit button using its specific hover class
        const editBtn = addressCard.locator('button.hover\\:text-blue-600');
        await editBtn.click();

        await expect(page.getByRole('heading', { name: 'Edit Address' })).toBeVisible();

        // Update street
        await page.locator('input[type="text"]').nth(0).fill(newStreet);
        await page.getByRole('button', { name: 'Save Address' }).click();

        // Verify update
        await expect(page.getByText(newStreet)).toBeVisible();
        await expect(page.getByText(oldStreet)).not.toBeVisible();
    });

    test('should delete an address', async ({ page }) => {
        const targetStreet = '456 Updated Ave';

        // Wait for it
        await expect(page.getByText(targetStreet)).toBeVisible();

        const addressCard = page.locator('.bg-white.shadow.rounded-lg.p-6', { hasText: targetStreet });

        // Setup confirmation dialog handler before clicking delete
        page.on('dialog', dialog => dialog.accept());

        // Find Delete button using its specific hover class
        const deleteBtn = addressCard.locator('button.hover\\:text-red-600');
        await deleteBtn.click();

        // Verify deletion
        await expect(page.getByText(targetStreet)).not.toBeVisible();
        await expect(page.getByText('Get started by adding a new address.')).toBeVisible();
    });
});
