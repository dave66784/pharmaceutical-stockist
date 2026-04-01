import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    globalTeardown: './globalTeardown.ts',
    fullyParallel: false,
    timeout: 120000, // 2 minutes (increased for ultra-slow 2s delay run)
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'results.json' }],
    ],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'on',
        video: 'on',
        launchOptions: {
            // slowMo: 2000, // 2000ms (2s) delay between actions for human-speed videos
        },
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
});
