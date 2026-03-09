# Pharmaceutical Stockist — Application Review & Suggestions

> Comprehensive audit of the **pharmaceutical-stockist** application covering Backend, Frontend, Automation, Infrastructure, Security, and DevOps.

---

## Current Application Snapshot

| Layer | Components | Status |
|-------|-----------|--------|
| **Backend Controllers** | 10 (Auth, Admin, Address, Cart, Category, Dashboard, Order, Product, Profile, User) | ✅ Complete |
| **Backend Services** | 15 (Address, Admin, Cart, Category, Dashboard, Email, Jwt, OrderExport, OrderReceipt, Order, Otp, Product, ProductUpload, SubCategory, User) | ✅ Complete |
| **Models / Entities** | 9 (User, Product, Category, SubCategory, Order, OrderItem, Cart, CartItem, Address) | ✅ Complete |
| **Backend Unit Tests** | 12/15 services tested, 4/10 controllers tested | ⚠️ Partial |
| **Frontend Pages** | 14 customer + 5 admin pages | ✅ Complete |
| **Frontend Services** | 9 API service modules (axios-based) | ✅ Complete |
| **UI Automation** | 11 spec files, 102 tests × 3 browsers | ✅ Complete |
| **API Test Suite** | 56 endpoint tests via shell script | ✅ Complete |
| **Infrastructure** | Docker Compose (8 services), Nginx reverse proxy | ✅ Complete |
| **Monitoring** | Prometheus, Grafana, Alertmanager, Loki + Promtail | ✅ Complete |
| **Security** | RSA JWT, HttpOnly cookies, method-level RBAC, CSP headers | ✅ Complete |

---

## 🔴 High Priority — Must Do

### 1. Complete Missing Backend Unit Tests

Currently 6 controller tests and 3 service tests are missing:

| Type | Missing Tests |
|------|--------------|
| **Controllers** | `AuthController`, `CartController`, `DashboardController`, `OrderController`, `SubCategoryController`, `UserController` |
| **Services** | `DashboardService`, `OrderExportService`, `OrderReceiptService` |

**Why**: Test coverage gaps mean regressions can slip through. These are critical business logic areas.

---

### 2. Protect the `/orders/:id` Route

In `App.tsx`, the `/orders/:id` route renders `<OrderDetails />` **without** a `<ProtectedRoute>` wrapper:

```tsx
// Current — unprotected!
<Route path="/orders/:id" element={<OrderDetails />} />

// Should be:
<Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
```

**Why**: Any unauthenticated user can potentially access order details by guessing the URL.

---

### 3. Enable CSRF Protection (or Document Why It's Disabled)

`SecurityConfig.java` completely disables CSRF:
```java
.csrf(AbstractHttpConfigurer::disable)
```

**Why**: While CSRF is commonly disabled for stateless JWT APIs, your application uses **HttpOnly cookies** for auth tokens, which makes it vulnerable to CSRF attacks from malicious sites. Either:
- Re-enable CSRF with a token-based approach (Spring's `CookieCsrfTokenRepository.withHttpOnlyFalse()`)
- Or add `SameSite=Strict` **and** verify `Origin`/`Referer` headers in a custom filter

---

### 4. Add Rate Limiting to Auth Endpoints

No rate limiting exists on `/api/auth/login`, `/api/auth/send-otp`, or `/api/auth/verify-otp`.

**Why**: An attacker can brute-force passwords or OTP codes without any throttling. Implement Spring's `RateLimiter` or an Nginx-level rate limit (`limit_req_zone`).

---

## 🟠 Medium Priority — Should Do

### 5. Add Pagination to Admin User Management

`UserController.java` returns all users at once. As the user base grows, this will degrade performance.

**Suggestion**: Add `Pageable` support like `AdminController.getAllOrders()` already does.

---

### 6. Improve Error Handling & Logging

The `GlobalExceptionHandler` only handles `ResourceNotFoundException` and `InsufficientStockException`. Other common exceptions are unhandled:
- `MethodArgumentNotValidException` (validation errors) — returns raw Spring error
- `DataIntegrityViolationException` (duplicate entries) — returns 500 instead of 409
- `AccessDeniedException` — returns raw 403 without a JSON body

**Suggestion**: Add handlers for these, returning consistent `ApiResponse` bodies.

---

### 7. Centralise Cart Total Calculation

`Cart.tsx`, `Checkout.tsx`, and `Payment.tsx` all independently re-fetch and recalculate cart totals. This was flagged in your existing `tasks.md`.

**Suggestion**: Centralise in the cart store (`stores/cartStore.ts`) so the total is computed once and shared.

---

### 8. Add Order Status Timeline/Tracking

The `OrderStatus` enum supports `PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED`, but there's no audit trail recording **when** each transition happened.

**Suggestion**:
- Add an `OrderStatusHistory` entity with columns: `id`, `orderId`, `fromStatus`, `toStatus`, `changedAt`, `changedBy`
- Show a visual timeline on the `OrderDetails` page

---

### 9. Add Product Search to the Admin Panel

`ManageProducts.tsx` lists all products but has no search/filter capability.

**Suggestion**: Add a search bar that uses the existing `GET /api/products/search?query=` endpoint.

---

### 10. Clean Up Debug/Temp Files

Several debug files exist in the repo root and automation directory:
- `build_error.log`, `fetch_by_id.json`, `products_list_before.json`, `products_list_after.json`, `receipt_test.pdf`, `unified-test-report.html`
- `automation/run_debug_test.js` through `run_debug_test5.js`

**Suggestion**: Add these to `.gitignore` or remove them.

---

## 🟡 Low Priority — Nice to Have

### 11. Add Frontend Unit Tests

There are **zero** frontend component tests. The app relies entirely on E2E Playwright tests.

**Suggestion**: Add Jest + React Testing Library tests for critical components:
- `AuthContext` / `ProtectedRoute` / `AdminRoute`
- Cart calculations
- Form validation (Login, Register, Checkout)

---

### 12. Add Database Migrations with Flyway/Liquibase

The app uses JPA's `ddl-auto` for schema management. This is fragile for production.

**Suggestion**: Introduce Flyway migration scripts for version-controlled, repeatable schema changes.

---

### 13. Add Soft Delete for Products and Categories

`DELETE /api/products/{id}` and `DELETE /api/categories/{id}` perform hard deletes. Orders referencing deleted products will have broken foreign keys.

**Suggestion**: Add an `isActive` / `deletedAt` flag and filter queries accordingly.

---

### 14. Implement Wishlist/Favourites Feature

Users can browse products but have no way to save items for later.

**Suggestion**: New `Wishlist` entity → `WishlistService` → `WishlistController` → Frontend page.

---

### 15. Add Email Notifications for Order Status Changes

`EmailService.java` is already robust (21KB), but currently only handles:
- OTP verification
- Order confirmation

**Suggestion**: Add emails for: order shipped, order delivered, low stock alerts to admin.

---

### 16. Implement Product Reviews / Ratings

No review or rating system exists for products.

**Suggestion**: New `Review` entity with `rating`, `comment`, `userId`, `productId` → display on `ProductDetail` page.

---

### 17. Add Swagger/OpenAPI Documentation

The `SecurityConfig` permits `/swagger-ui/**` and `/api-docs/**`, but confirm these endpoints are actually serving live docs. The `oas/` directory contains 17 static files.

**Suggestion**: Add `springdoc-openapi` dependency and annotate controllers with `@Operation`, `@ApiResponse`, etc.

---

### 18. Production Readiness Checklist

| Item | Current Status | Action Needed |
|------|---------------|---------------|
| HTTPS / TLS termination | Cookie `secure=false` | Set `secure=true` and add TLS to Nginx |
| Log aggregation | Loki + Promtail configured | ✅ Done |
| Health checks | `/actuator/health` exposed | Add liveness/readiness probes in Compose |
| Backup strategy | PostgreSQL volume only | Add `pg_dump` cron job or use managed DB |
| CI/CD pipeline | None detected | Add GitHub Actions for build → test → deploy |
| Environment configs | Single `.env` file | Separate configs per environment (dev/staging/prod) |
| Cookie `SameSite` | Set to `Strict` | ✅ Already correct |

---

## Summary of Recommended Order

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Complete 6 missing controller + 3 service tests | 🔴 High | Medium |
| 2 | Protect `/orders/:id` route | 🔴 High | Trivial |
| 3 | Address CSRF with HttpOnly cookies | 🔴 High | Medium |
| 4 | Rate limit auth endpoints | 🔴 High | Medium |
| 5 | Paginate admin user listing | 🟠 Medium | Small |
| 6 | Improve global exception handling | 🟠 Medium | Small |
| 7 | Centralise cart total calculation | 🟠 Medium | Small |
| 8 | Order status timeline/audit trail | 🟠 Medium | Medium |
| 9 | Admin product search | 🟠 Medium | Small |
| 10 | Clean up debug/temp files | 🟠 Medium | Trivial |
| 11 | Frontend component tests | 🟡 Low | Large |
| 12 | Database migrations (Flyway) | 🟡 Low | Medium |
| 13 | Soft delete for products/categories | 🟡 Low | Medium |
| 14 | Wishlist feature | 🟡 Low | Large |
| 15 | Order status email notifications | 🟡 Low | Medium |
| 16 | Product reviews/ratings | 🟡 Low | Large |
| 17 | Swagger/OpenAPI live docs | 🟡 Low | Small |
| 18 | Production readiness (HTTPS, CI/CD, backups) | 🟡 Low | Large |
