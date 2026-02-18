# UI Automation Implementation Plan

## Goal
Implement robust End-to-End (E2E) UI automation to verify critical user journeys in the frontend application.

## User Review Required
> [!NOTE]
> We will use **Playwright** for automation due to its speed, reliability, and modern feature set. This requires installing new dev dependencies in `frontend/package.json`.

## Proposed Changes

### Frontend Configuration
- Install Playwright: `npm init playwright@latest`
- Configure `playwright.config.ts` for:
  - Base URL: `http://localhost:3000`
  - Browsers: Chromium, Firefox, WebKit
  - Headless mode (default) with trace/video on failure

### Test Suites
Create strict test scenarios in `tests/`:

#### 1. Authentication (`tests/auth.spec.ts`)
- [ ] Verify Login Page loads
- [ ] additional: Test successful login with Admin credentials
- [ ] Test failed login (invalid credentials)
- [ ] Verify redirection to Dashboard after login

#### 2. Core Workflows (`tests/core.spec.ts`)
- [ ] **Dashboard**: Verify stats and charts load
- [ ] **Products**: Verify product list renders
- [ ] **Cart**:
    - Add item to cart
    - Verify cart badge update
    - Verify item appears in Cart page

## Verification Plan
### Automated Tests
Run the full suite using:
```bash
npx playwright test
```
### Manual Verification
- Review Playwright HTML report (`playwright-report/index.html`) to ensure all assertions pass.
