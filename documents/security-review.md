# Security Review — PharmaCare Stockist Application

**Scope:** Full-stack review covering the Spring Boot backend, React/TypeScript frontend, OpenAPI Specification (OAS), Nginx reverse proxy, and Docker Compose infrastructure.  
**Date:** March 2026  
**Severity Scale:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low · 🔵 Info

---

## Executive Summary

The PharmaCare application has a well-structured foundation — JWT with RS256, BCrypt password hashing, `@PreAuthorize` method-level security, and an OTP-verified registration flow are all solid choices. However, several significant vulnerabilities were identified, particularly around **IDOR on orders**, **insecure token storage**, **hardcoded test credentials**, and **infrastructure misconfigurations** that must be addressed before any production deployment.

| Category | Issues Found | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| Backend | 12 | 1 | 4 | 5 | 2 |
| Frontend | 7 | 1 | 2 | 3 | 1 |
| Infrastructure | 6 | 1 | 2 | 2 | 1 |
| OAS | 5 | 0 | 1 | 2 | 2 |

---

## Backend Security

### 🔴 CRIT-BE-01 — IDOR: Order Access Without Ownership Check

**Status:** ✅ Fixed (Phase 2)

**File:** `OrderController.java` · `GET /api/orders/{id}`

The `getOrderById` endpoint fetches an order by its numeric ID without verifying that the authenticated user owns that order. Any authenticated user can enumerate orders belonging to other customers.

```java
// Current — no ownership check
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Order>> getOrderById(@PathVariable Long id) {
    Order order = orderService.getOrderById(id);
    return ResponseEntity.ok(new ApiResponse<>(true, "Order retrieved successfully", order));
}
```

**Fix:**

```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Order>> getOrderById(
        @PathVariable Long id, Authentication authentication) {
    Order order = orderService.getOrderById(id);
    // Admins may access any order; customers only their own
    if (!authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
        && !order.getUser().getEmail().equals(authentication.getName())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ApiResponse<>(false, "Access denied"));
    }
    return ResponseEntity.ok(new ApiResponse<>(true, "Order retrieved successfully", order));
}
```

The `downloadReceipt` and `exportUserOrders` endpoints have similar issues and need the same guard.

---

### 🟠 HIGH-BE-02 — Hardcoded Test OTP Override Active in Development

**Status:** ✅ Fixed (Phase 2)

**File:** `OtpService.java`, `application.properties`

When `app.email.customer.notifications.otp-verification.enabled=false` (the default), any user can complete registration using the hardcoded OTP `123456`. This config is committed to the repository.

```properties
app.otp.test-override=123456
```

**Fix:** Remove the test-override mechanism entirely or gate it strictly on a `spring.profiles.active=test` profile. Never commit static OTPs to source control. Rotate any credentials that appear alongside this property.

```properties
# application-test.properties ONLY
app.otp.test-override=123456
```

```properties
# application.properties (production) — remove entirely or:
app.otp.test-override=
```

---

### 🟠 HIGH-BE-03 — Unsorted Sort Parameter Allows Potential Column Injection

**Status:** ✅ Fixed (Phase 2)

**File:** `ProductController.java`

The `sortBy` query parameter is passed directly into `Sort.by()` without a whitelist. Spring Data JPA does not validate field names at compile time; an attacker can probe valid column names (useful for reconnaissance) or potentially cause errors exposing schema details.

```java
// Dangerous — sortBy is unvalidated user input
Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy));
```

**Fix:**

```java
private static final Set<String> ALLOWED_SORT_FIELDS =
    Set.of("id", "name", "price", "createdAt", "stockQuantity");

private String sanitiseSortBy(String sortBy) {
    return ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
}
```

---

### 🟠 HIGH-BE-04 — Image Upload: MIME Type Not Validated

**Status:** ✅ Fixed (Phase 2)

**File:** `ProductController.java` · `POST /api/products/images`

Only the file extension is checked (by absence of any check — no extension check exists). There is no validation of the actual MIME type or magic bytes. An attacker could upload a disguised PHP/HTML/executable file.

```java
// No extension or MIME check at all; filenames are sanitised via UUID but content is not
String filename = UUID.randomUUID().toString() + extension;
Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
```

**Fix:**

```java
private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
private static final Set<String> ALLOWED_MIME_TYPES  = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

// In upload handler:
String contentType = file.getContentType();
if (!ALLOWED_MIME_TYPES.contains(contentType) || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
    return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Invalid image type"));
}
```

Additionally, consider using [Apache Tika](https://tika.apache.org/) to verify the actual file content (magic bytes) rather than relying on the declared content-type header.

---

### 🟠 HIGH-BE-05 — No JWT Revocation / Token Blacklist

**File:** `JwtService.java`, `SecurityConfig.java`

JWT tokens are stateless and valid for 24 hours (`jwt.expiration=86400000`). There is no refresh token mechanism and no logout blacklist. Stolen tokens remain valid for their full lifetime and there is no way to invalidate a compromised token.

**Fix options (in order of preference):**
1. Shorten the expiry to 15-30 minutes and implement a refresh token pattern (refresh token stored as httpOnly cookie, access token kept short-lived).
2. Maintain a Redis-backed token revocation set keyed by JWT `jti` claim with a TTL matching token expiry.
3. At minimum, store a per-user token version in the database and embed it in the JWT — increment on logout.

---

### 🟡 MED-BE-06 — In-Memory OTP Store is Not Cluster-Safe

**Status:** ⚠️ Won't Fix (Accepted Risk for Dev)

**File:** `OtpService.java`

OTPs are stored in a `ConcurrentHashMap` within the application process. This means:
- All pending OTPs are lost if the application restarts.
- The system cannot be horizontally scaled (multiple pods would each have a different store).

**Fix:** Replace the in-memory map with a Redis key-value store with a TTL matching `app.otp.expiry-minutes`. Spring's `RedisTemplate` or Spring Data Redis make this straightforward.
*(User confirmed this is acceptable for the current development use case).*

---

### 🟡 MED-BE-07 — Clickjacking Protection Disabled

**Status:** ✅ Fixed (Phase 2)

**File:** `SecurityConfig.java`

`frameOptions.disable()` removes the `X-Frame-Options` header entirely, leaving the application open to clickjacking attacks.

```java
// Disables the header completely
.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()))
```

**Fix:** Unless you explicitly need to embed this app in an `<iframe>`, remove this customisation and let Spring Security set `X-Frame-Options: DENY` by default. If embedding in a specific trusted domain is required, use `SAMEORIGIN` or the more modern `Content-Security-Policy: frame-ancestors` directive.

---

### 🟡 MED-BE-08 — SMTP TLS Disabled

**Status:** ✅ Fixed (Phase 2)

**File:** `application.properties`

```properties
spring.mail.properties.mail.smtp.starttls.enable=false
```

Email is transmitted in plaintext. OTP codes, order confirmations, and low-stock alerts will be exposed on the wire.

**Fix:**

```properties
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

---

### 🟡 MED-BE-09 — Debug Logging in Production Config

**Status:** ✅ Fixed (Phase 2)

**File:** `application.properties`

```properties
logging.level.com.pharma=DEBUG
logging.level.org.springframework.security=DEBUG
```

Security-level `DEBUG` logs emit token values, filter decisions, and user details. This creates a significant information-disclosure risk in production log aggregators.

**Fix:** Set `INFO` or `WARN` for production, and use environment-specific Spring profiles (`application-prod.properties`) to prevent debug settings from leaking into production.

---

### 🟡 MED-BE-10 — `spring.jpa.show-sql=true` in Main Config

**Status:** ✅ Fixed (Phase 2)

**File:** `application.properties`

All SQL queries (including those with user email/address data) are printed to the application log. This should never be enabled in production.

**Fix:** Remove from `application.properties` and only enable in `application-dev.properties` or test configs.

---

### 🟢 LOW-BE-11 — Actuator Health Shows Full Details Publicly

**Status:** ✅ Fixed (Phase 2)

**File:** `application.properties`

```properties
management.endpoint.health.show-details=always
```

Health details (database status, disk space, memory) are exposed publicly. While the `/actuator/health` endpoint itself is correctly open (for load balancer health checks), the `show-details=always` setting leaks internal system information to unauthenticated callers.

**Fix:**

```properties
management.endpoint.health.show-details=when_authorized
```

---

### 🟢 LOW-BE-12 — `ddl-auto=update` is Unsafe for Production

**Status:** ✅ Fixed (Phase 2)

**File:** `application.properties`

Hibernate's `update` DDL strategy silently applies schema changes on startup. This can cause irreversible data loss (dropped columns, type mismatches) in production.

**Fix:** Use `validate` in production and manage schema evolution with a proper migration tool (Flyway or Liquibase).

```properties
spring.jpa.hibernate.ddl-auto=validate
```

---

## Frontend Security

### 🔴 CRIT-FE-01 — JWT Stored in `localStorage` (XSS Risk)

**Status:** ✅ Fixed (Phase 2)

**File:** `services/api.ts`, `services/authService.ts`

```typescript
localStorage.setItem('token', response.data.data.token);
```

`localStorage` is accessible by any JavaScript on the page. A single XSS vulnerability — in the application itself, in a third-party script, or in a browser extension — gives an attacker full access to the token.

**Fix:** Store the JWT in an `httpOnly`, `SameSite=Strict` cookie set by the server. The frontend cannot read such a cookie but the browser sends it automatically with every request.

Backend change needed:
```java
// In AuthController — set httpOnly cookie instead of returning token in body
ResponseCookie cookie = ResponseCookie.from("access_token", token)
    .httpOnly(true)
    .secure(true) // HTTPS only
    .sameSite("Strict")
    .maxAge(Duration.ofHours(24))
    .path("/api")
    .build();
response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
```

---

### 🟠 HIGH-FE-02 — Admin Role Enforcement is Client-Side Only

**File:** `components/auth/AdminRoute.tsx`

```typescript
if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
}
```

The `user` object is read from `localStorage` and is fully attacker-controllable. A user can manually set `role: "ADMIN"` in browser dev tools to bypass the frontend guard and access the admin UI. The backend correctly enforces `@PreAuthorize("hasRole('ADMIN')")`, so admin API calls will still be rejected — but the admin UI is fully visible.

**Fix:** The client-side check is fine as a UX guard, but never rely on it for security. Ensure all admin API endpoints remain server-enforced. Additionally, consider fetching the current user's profile from the server on app load instead of trusting the stored object.

---

### 🟠 HIGH-FE-03 — Payment Method ONLINE Has No Payment Gateway

**File:** `pages/Payment.tsx`, `services/orderService.ts`

The UI presents `ONLINE` as a payment option (card / UPI / net banking), but submitting an order with `paymentMethod: "ONLINE"` simply marks the order as `PAYMENT_STATUS: PENDING` without any real payment. A user can place an order without paying by selecting ONLINE and skipping any payment step.

**Fix:** Either remove the ONLINE option until a payment gateway (Razorpay, Stripe, etc.) is integrated, or disable the option with a "Coming soon" label. If integrating a gateway: the payment intent must be created and confirmed server-side before the order is fulfilled.

---

### 🟡 MED-FE-04 — Backend Error Messages Exposed to UI

**File:** Multiple pages (`Login.tsx`, `Register.tsx`, `Payment.tsx`, etc.)

```typescript
errorToast(axiosError.response?.data?.message || 'Login failed');
```

Raw backend error messages are displayed in toasts. These can include internal exception details, stack traces (if the global exception handler misbehaves), or user enumeration hints (e.g., "Email already registered").

**Fix:** Map backend error codes to user-friendly messages on the frontend. Have the backend return structured error codes in addition to human-readable messages:

```json
{ "success": false, "code": "EMAIL_TAKEN", "message": "..." }
```

---

### 🟡 MED-FE-05 — No Rate Limiting on Login Button

**File:** `pages/Login.tsx`

The login form has no client-side debouncing or rate limiting on the submit button. While Nginx limits `/api/auth/` to 500 req/min — far too permissive for a brute-force scenario — there is also no frontend lockout after repeated failures.

**Fix:**
1. **Nginx:** Reduce to 10 req/min with a burst of 20 for auth endpoints.
2. **Backend:** Implement account lockout after N failed attempts (e.g., 5) using a cache/Redis counter.
3. **Frontend:** Disable the login button for a brief period after each failure.

---

### 🟡 MED-FE-06 — Checkout State Stored in `sessionStorage` Without Integrity Check

**File:** `pages/Payment.tsx`

```typescript
const savedState = sessionStorage.getItem('checkoutState');
const state = savedState ? JSON.parse(savedState) as { shippingAddress?: string; addressId?: number } : undefined;
```

The checkout state is cast from raw sessionStorage without schema validation. A tampered `addressId` could cause an order to be placed against a different user's saved address. While the backend should enforce ownership, a Zod schema parse (as used in `authService`) would add a defense-in-depth layer.

---

### 🟢 LOW-FE-07 — Third-Party Image Loading from Unsplash

**File:** `pages/Login.tsx`, `pages/Register.tsx`

Background images are loaded directly from Unsplash CDN. These requests expose user IP addresses to a third party and create an availability dependency. If Unsplash is unavailable or changes their URL scheme, the login page layout breaks.

**Fix:** Host brand imagery as local assets in the `public/` folder.

---

## Infrastructure Security

### 🔴 CRIT-INFRA-01 — Hardcoded Database Credentials in Docker Compose

**Status:** ✅ Fixed (Phase 2)

**File:** `docker-compose.yml`

```yaml
environment:
  POSTGRES_PASSWORD: postgres
  SPRING_DATASOURCE_PASSWORD: postgres
```

The database credentials are hardcoded in the compose file, which is committed to version control. Any developer or CI system with access to the repository has database access.

**Fix:**
- Use Docker secrets or external secret management (Vault, AWS Secrets Manager).
- At minimum, source from environment variables or a `.env` file that is `.gitignore`d:

```yaml
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD}
```

```bash
# .env (gitignored)
DB_PASSWORD=<generated-strong-password>
```

---

### 🟠 HIGH-INFRA-02 — Backend Port 8080 Exposed Directly to Host

**Status:** ✅ Fixed (Phase 2)

**File:** `docker-compose.yml`

```yaml
backend:
  ports:
    - "8080:8080"
```

The backend is reachable directly on port 8080, bypassing the Nginx reverse proxy entirely (including the auth rate limiting and header injection). In production this means the rate limiting and proxy headers provide no security benefit.

**Fix:** Remove the host port mapping for the backend service. Only Nginx (and the monitoring stack if required) should be exposed. Backend should be internal-only on the Docker network.

```yaml
backend:
  # Remove ports — accessed only via pharma-network by nginx
  expose:
    - "8080"
```

---

### 🟠 HIGH-INFRA-03 — Auth Rate Limit is Trivially Bypassable

**Status:** ✅ Fixed (Phase 2)

**File:** `frontend/nginx.conf`

```nginx
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=500r/m;
limit_req zone=auth_limit burst=500 nodelay;
```

500 requests per minute per IP (burst 500 with `nodelay`) effectively provides no rate limiting for brute-force attacks. A 6-digit OTP has 1,000,000 combinations; at 500 req/min an attacker can exhaust the space in ~33 hours. The OTP expiry (10 min) reduces this window but does not eliminate it since OTPs can be continuously resent.

**Fix:**

```nginx
# Tighter limits for auth
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;
limit_req zone=auth_limit burst=20 nodelay;

# Return 429 Too Many Requests (not 503)
limit_req_status 429;
```

Also add server-side OTP attempt counting (lock after 5 wrong attempts).

---

### 🟡 MED-INFRA-04 — Grafana Default Admin Password

**Status:** ✅ Fixed (Phase 2)

**File:** `docker-compose.yml`

```yaml
grafana:
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

The Grafana instance is accessible at port 3001 with `admin/admin`. Grafana exposes all metrics, dashboards, and potentially alert configurations.

**Fix:**

```yaml
- GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
```

And add Grafana behind authentication or restrict its port binding to localhost.

---

### 🟡 MED-INFRA-05 — CORS Restricted to Localhost Only (No Production Config)

**File:** `CorsConfig.java`

```java
configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
```

There is no production-ready CORS configuration. When deployed, all cross-origin requests from the actual production domain will be blocked, or developers will need to open CORS to `*` as a quick fix — which is highly insecure.

**Fix:** Inject the allowed origins from environment variables:

```java
@Value("${cors.allowed-origins}")
private List<String> allowedOrigins;
```

```properties
# application-prod.properties
cors.allowed-origins=https://pharmacare.example.com
```

---

### 🔵 INFO-INFRA-06 — Prometheus Metrics Require ADMIN Role (Correct)

**File:** `SecurityConfig.java`, `application.properties`

```java
.requestMatchers("/actuator/**").hasRole("ADMIN")
```

Prometheus scraping on `/actuator/prometheus` is protected. Note that Prometheus itself (running on port 9090) is exposed to the host network and has no authentication by default. If Prometheus is accessible beyond localhost, metrics can be read unauthenticated.

**Recommendation:** Bind Prometheus to localhost or use Prometheus's built-in TLS and basic auth configuration.

---

## OAS Specification Issues

### 🟠 HIGH-OAS-01 — Eight Implemented Endpoints Missing from OAS

The original specification was missing the following routes, all of which are active in the backend:

| Endpoint | Method | Controller |
|---|---|---|
| `/api/auth/send-otp` | POST | AuthController |
| `/api/auth/resend-otp` | POST | AuthController |
| `/api/auth/verify-otp` | POST | AuthController |
| `/api/products/upload` | POST | ProductController |
| `/api/products/upload/template` | GET | ProductController |
| `/api/products/images` | POST | ProductController |
| `/api/products/delete-bulk` | DELETE | ProductController |
| `/api/orders/{id}/receipt` | GET | OrderController |
| `/api/orders/export` | GET | OrderController |
| `/api/categories/**` | * | CategoryController |

All have been added in the updated OAS. The old `/api/auth/register` path was removed — it no longer exists in the backend.

---

### 🟡 MED-OAS-02 — `OrderRequest` Missing `paymentMethod` Field

The original `OrderRequest` schema did not include `paymentMethod`, yet the backend `OrderService` and frontend `orderService.ts` both require and transmit it. The field has been added (enum: `COD`, `ONLINE`) in the updated schema.

---

### 🟡 MED-OAS-03 — Product `category` Field Mis-typed as Enum String

The original schema typed `category` as a simple string enum of legacy category names, but the actual model uses a relational `Category` entity with an `id` and `slug`. `ProductRequest` referenced `category: string` but the backend takes `categoryId: Long`. Both schemas have been corrected.

---

### 🟢 LOW-OAS-04 — Auth Endpoints Lacked `security: []` Override

`POST /api/auth/login` and the registration flow are public endpoints, but they inherited the global `security: [bearerAuth: []]` without explicitly overriding it with `security: []`. This causes API clients and code generators to incorrectly require a token on public endpoints. Fixed in the updated auth path file.

---

### 🟢 LOW-OAS-05 — No 4xx Response Schemas on Most Endpoints

Most endpoints only defined the happy-path `200` response. Consistent `400`, `401`, `403`, and `404` responses using the `ApiResponse` schema have been added to the updated product, order, and auth path files.

---

## Remediation Priority

| # | Finding | Severity | Effort |
|---|---|---|---|
| 1 | IDOR on order endpoints | 🔴 Critical | Low |
| 2 | Hardcoded test OTP `123456` | 🟠 High | Low |
| 3 | JWT in localStorage | 🔴 Critical | Medium |
| 4 | Hardcoded DB credentials in compose | 🔴 Critical | Low |
| 5 | Backend port 8080 exposed in compose | 🟠 High | Low |
| 6 | Auth rate limit (500/min) too permissive | 🟠 High | Low |
| 7 | ONLINE payment method unimplemented | 🟠 High | High |
| 8 | JWT expiry 24h / no revocation | 🟠 High | Medium |
| 9 | Image upload MIME validation missing | 🟠 High | Low |
| 10 | SMTP TLS disabled | 🟡 Medium | Low |
| 11 | Clickjacking (`frameOptions.disable()`) | 🟡 Medium | Low |
| 12 | SQL logging in production config | 🟡 Medium | Low |
| 13 | In-memory OTP store (not cluster-safe) | 🟡 Medium | Medium |
| 14 | Grafana default credentials | 🟡 Medium | Low |
| 15 | `ddl-auto=update` in production | 🟡 Medium | Medium |
| 16 | Debug security logging in production | 🟡 Medium | Low |

---

## What's Done Well

- **RS256 asymmetric JWT** — using separate public/private keys is the correct approach; secrets are injected via environment variables.
- **BCrypt password hashing** — industry-standard with appropriate work factor.
- **OTP-verified registration** — prevents account creation with unverified email addresses.
- **`@EnableMethodSecurity` + `@PreAuthorize`** — admin endpoints are enforced at the method level, providing defense in depth beyond URL pattern matching.
- **Global exception handler** — prevents stack traces from reaching the client.
- **Password hashed on backend** — `@JsonIgnore` on the `password` field prevents it from ever appearing in API responses.
- **Input validation** — `@Valid` annotations on request bodies with `MethodArgumentNotValidException` handling.
- **CORS restricted** — only specific origins allowed (though localhost-only needs a production config).
- **Stateless session** — `SessionCreationPolicy.STATELESS` eliminates session fixation risks.
- **Zod validation in `authService`** — user object from localStorage is schema-validated before use.

---

*This report was generated from static analysis of the source code. Dynamic testing (DAST, penetration testing) is recommended before production launch to identify runtime-specific vulnerabilities.*
