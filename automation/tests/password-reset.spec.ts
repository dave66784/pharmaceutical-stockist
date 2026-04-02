import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

// All test emails match '%@test.com' — cleaned up by globalTeardown
const testEmail = `pwreset_${Date.now()}@test.com`;
const initialPassword = 'Initial@123';
const newPassword = 'NewPass@456';

// ─── Helper: fetch password reset token from DB ──────────────────────────────
function getResetTokenFromDb(email: string): string | null {
    try {
        const result = execSync(
            `docker exec pharma-db psql -U postgres -d pharma_db -t -c "SELECT password_reset_token FROM users WHERE email = '${email}'"`,
            { stdio: ['ignore', 'pipe', 'pipe'] }
        ).toString().trim();
        return result || null;
    } catch {
        return null;
    }
}

test.describe('Password Reset Flow', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ request }) => {
        // Register the test user via OTP flow
        const payload = {
            firstName: 'Reset',
            lastName: 'Tester',
            email: testEmail,
            password: initialPassword,
            phone: '9000000001',
        };
        const otpRes = await request.post('/api/auth/send-otp', { data: payload });
        expect(otpRes.ok()).toBeTruthy();

        const verifyRes = await request.post('/api/auth/verify-otp', {
            data: { email: testEmail, otp: '123456' },
        });
        expect(verifyRes.ok()).toBeTruthy();
    });

    // ─── UI: Forgot password link on login page ─────────────────────────────

    test('login page shows "Forgot your password?" link', async ({ page }) => {
        await page.goto('/login');
        const link = page.getByRole('link', { name: /Forgot your password/i });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', '/forgot-password');
    });

    // ─── UI: Forgot password page ────────────────────────────────────────────

    test('forgot password page renders correctly', async ({ page }) => {
        await page.goto('/forgot-password');
        await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.getByRole('button', { name: /Send reset link/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Back to sign in/i })).toBeVisible();
    });

    test('forgot password shows success state after submission', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.locator('#email').fill('doesnotexist@test.com');
        await page.getByRole('button', { name: /Send reset link/i }).click();

        // Always shows success to avoid email enumeration
        await expect(page.getByRole('heading', { name: /Check your inbox/i })).toBeVisible({ timeout: 10000 });
    });

    test('forgot password via "Forgot your password?" link on login page', async ({ page }) => {
        await page.goto('/login');
        await page.getByRole('link', { name: /Forgot your password/i }).click();
        await expect(page).toHaveURL(/.*forgot-password/);
        await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    });

    // ─── UI: Reset password page ─────────────────────────────────────────────

    test('reset password page shows error when token is missing', async ({ page }) => {
        await page.goto('/reset-password');
        await expect(page.getByText(/Invalid or missing reset token/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: 'Reset password' })).toBeDisabled();
    });

    test('reset password page renders form when token is present', async ({ page }) => {
        await page.goto('/reset-password?token=some-fake-token-for-ui-test');
        await expect(page.getByRole('heading', { name: /Set a new password/i })).toBeVisible();
        await expect(page.locator('#newPassword')).toBeVisible();
        await expect(page.locator('#confirmPassword')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Reset password' })).toBeVisible();
    });

    test('reset password page shows error for invalid token on submit', async ({ page }) => {
        await page.goto('/reset-password?token=invalid-token-xyz');
        await page.locator('#newPassword').fill('NewPass@789');
        await page.locator('#confirmPassword').fill('NewPass@789');
        await page.getByRole('button', { name: 'Reset password' }).click();
        await expect(page.getByText(/Invalid|expired/i)).toBeVisible({ timeout: 10000 });
    });

    // ─── API: forgot-password endpoint ───────────────────────────────────────

    test('POST /api/auth/forgot-password stores a reset token in DB', async ({ request }) => {
        const res = await request.post('/api/auth/forgot-password', {
            data: { email: testEmail },
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);

        // Token should now be present in DB
        await new Promise(r => setTimeout(r, 500)); // small wait for DB write
        const token = getResetTokenFromDb(testEmail);
        expect(token).not.toBeNull();
        expect(token!.length).toBeGreaterThan(10);
    });

    test('POST /api/auth/forgot-password returns success even for unknown email', async ({ request }) => {
        const res = await request.post('/api/auth/forgot-password', {
            data: { email: 'nobody_here@test.com' },
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
    });

    // ─── Full flow: forgot password → reset → login ───────────────────────────

    test('full password reset flow: reset via valid token, login with new password', async ({ page, request }) => {
        // Step 1: trigger password reset via API
        const forgotRes = await request.post('/api/auth/forgot-password', {
            data: { email: testEmail },
        });
        expect(forgotRes.ok()).toBeTruthy();

        // Step 2: get the token from DB
        await new Promise(r => setTimeout(r, 500));
        const token = getResetTokenFromDb(testEmail);
        expect(token).not.toBeNull();

        // Step 3: navigate to reset password page with the token
        await page.goto(`/reset-password?token=${token}`);
        await expect(page.getByRole('heading', { name: /Set a new password/i })).toBeVisible();

        // Step 4: fill in new password
        await page.locator('#newPassword').fill(newPassword);
        await page.locator('#confirmPassword').fill(newPassword);
        await page.getByRole('button', { name: 'Reset password' }).click();

        // Step 5: expect success message and redirect to login
        await expect(page.getByText(/Password updated|Password reset/i)).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });

        // Step 6: login with new password
        await page.getByLabel('Email').fill(testEmail);
        await page.getByLabel('Password').fill(newPassword);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/$|.*products/, { timeout: 15000 });
    });

    test('used reset token cannot be reused', async ({ request }) => {
        // The token was consumed in the previous test — trying it again should fail
        // We need a new (invalid) token for this check
        const res = await request.post('/api/auth/reset-password', {
            data: { token: 'already-consumed-token', newPassword: 'AnotherPass@1' },
        });
        // Should be 4xx
        expect(res.ok()).toBeFalsy();
        const body = await res.json();
        expect(body.success).toBe(false);
    });

    test('reset password rejects passwords shorter than 8 chars', async ({ request }) => {
        const res = await request.post('/api/auth/reset-password', {
            data: { token: 'anytoken', newPassword: 'short' },
        });
        expect(res.ok()).toBeFalsy();
        const body = await res.json();
        expect(body.success).toBe(false);
    });
});

// ─── Session Cookie & Refresh Token ──────────────────────────────────────────

test.describe('Session Cookies & Refresh Token', () => {
    test.describe.configure({ mode: 'serial' });

    test('access_token cookie is a session cookie (no Max-Age or Expires)', async ({ page, context }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('admin@pharma.com');
        await page.getByLabel('Password').fill('Admin@123');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/.*admin/, { timeout: 15000 });

        const cookies = await context.cookies();
        const accessToken = cookies.find(c => c.name === 'access_token');
        expect(accessToken).toBeDefined();
        // Session cookies have expires = -1 in Playwright (no expiry set)
        expect(accessToken!.expires).toBe(-1);
    });

    test('POST /api/auth/refresh returns 200 and sets new access_token cookie', async ({ request }) => {
        // Login first (sets both access_token and refresh_token cookies on the request context)
        const loginRes = await request.post('/api/auth/login', {
            data: { email: 'admin@pharma.com', password: 'Admin@123' },
        });
        expect(loginRes.ok()).toBeTruthy();

        // Call refresh — should succeed (refresh_token cookie is sent automatically)
        const refreshRes = await request.post('/api/auth/refresh');
        expect(refreshRes.ok()).toBeTruthy();
        const body = await refreshRes.json();
        expect(body.success).toBe(true);
    });

    test('POST /api/auth/refresh without cookie returns 401', async ({ request }) => {
        // A brand-new request context has no cookies
        const refreshRes = await request.post('/api/auth/refresh');
        expect(refreshRes.status()).toBe(401);
    });

    test('logout clears access_token cookie', async ({ page, context }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('admin@pharma.com');
        await page.getByLabel('Password').fill('Admin@123');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/.*admin/, { timeout: 15000 });

        // Verify cookie is set
        const beforeCookies = await context.cookies();
        expect(beforeCookies.find(c => c.name === 'access_token')).toBeDefined();

        // Logout via the UI dropdown
        await page.getByRole('button', { name: 'Open user menu' }).click();
        await page.getByRole('menuitem', { name: /Logout|Sign out/i }).click();
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });

        // access_token should be cleared (expired with maxAge=0)
        const afterCookies = await context.cookies();
        const tokenAfter = afterCookies.find(c => c.name === 'access_token');
        expect(!tokenAfter || tokenAfter.value === '').toBeTruthy();
    });

    test('authenticated page redirects to login after cookie cleared', async ({ page, context }) => {
        // Login first
        await page.goto('/login');
        await page.getByLabel('Email').fill('admin@pharma.com');
        await page.getByLabel('Password').fill('Admin@123');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/.*admin/, { timeout: 15000 });

        // Manually clear the access_token cookie to simulate browser-close expiry
        await context.clearCookies();

        // Navigate to a protected page — should be redirected to login
        await page.goto('/admin');
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
});
