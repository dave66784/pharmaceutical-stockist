# Security Vulnerability Fix Plan
## Pharmaceutical Stockist — Full-Stack Audit

**Stack:** Spring Boot (Java) · React/TypeScript · PostgreSQL · Docker · Nginx  
**Audit Date:** February 2026  
**Severity Legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Vulnerabilities](#1-critical-vulnerabilities)
3. [High Vulnerabilities](#2-high-vulnerabilities)
4. [Medium Vulnerabilities](#3-medium-vulnerabilities)
5. [Low / Hardening Items](#4-low--hardening-items)
6. [Prioritised Fix Roadmap](#prioritised-fix-roadmap)

---

## Executive Summary

A total of **17 distinct security issues** were identified across authentication, authorisation, infrastructure configuration, input handling, and secrets management. Five are rated Critical and must be resolved before any production deployment. The most severe findings involve a hardcoded OTP bypass that allows any account to be registered without a real email, unauthenticated access to any order record, and sensitive credentials stored in plain text in infrastructure files.

---

## 1. Critical Vulnerabilities

---

### 🔴 CRIT-01 — Hardcoded OTP Test Bypass in Production Code

**File:** `backend/src/main/resources/application.properties`  
**Lines:**
```properties
app.otp.test-override=123456
```
**File:** `OtpService.java` — `verifyAndConsume()` method
```java
boolean isOverrideValid = !otpEmailEnabled 
    && testOtpOverride != null 
    && !testOtpOverride.isBlank()
    && testOtpOverride.equals(otp.trim());
```

**Impact:** When `app.email.customer.notifications.otp-verification.enabled=false` (the current default), any attacker can register any email address using OTP `123456`, completely bypassing the email verification step. This allows mass account creation, account takeover for emails not yet registered, and circumvention of the registration flow entirely.

**Fix:**
1. Remove `app.otp.test-override` from `application.properties` entirely.
2. In `OtpService.verifyAndConsume()`, delete the `isOverrideValid` branch.
3. Create a separate Spring profile (`application-dev.properties`) that enables the override only when the active profile is `dev` or `test`.
4. Add a guard in `OtpService` to throw a startup exception if `test-override` is non-blank and the active profile is `prod`:

```java
@PostConstruct
public void validateConfig() {
    if (environment.matchesProfiles("prod") && testOtpOverride != null && !testOtpOverride.isBlank()) {
        throw new IllegalStateException("app.otp.test-override must not be set in production");
    }
}
```

---

### 🔴 CRIT-02 — Broken Object-Level Authorisation on `GET /api/orders/{id}`

**File:** `OrderController.java`
```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Order>> getOrderById(@PathVariable Long id) {
    Order order = orderService.getOrderById(id);   // no ownership check
    return ResponseEntity.ok(...);
}
```

**Impact:** Any authenticated user can fetch any order in the system by incrementing the `id` path parameter (IDOR). A customer can view another customer's shipping address, items ordered, payment method, and personal details.

**Fix:** Inject `Authentication` and verify ownership before returning:

```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<Order>> getOrderById(
        @PathVariable Long id, Authentication authentication) {
    Order order = orderService.getOrderById(id);
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (!isAdmin && !order.getUser().getEmail().equals(authentication.getName())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ApiResponse<>(false, "Access denied"));
    }
    return ResponseEntity.ok(new ApiResponse<>(true, "Order retrieved successfully", order));
}
```

Apply the same ownership check to `GET /api/orders/{id}/receipt` in `OrderController`.

---

### 🔴 CRIT-03 — Hardcoded Database Password in Docker Compose

**File:** `docker-compose.yml`
```yaml
environment:
  POSTGRES_PASSWORD: postgres
  SPRING_DATASOURCE_PASSWORD: postgres
```

**Impact:** The database is accessible with a well-known default password. Any process that can reach port 5432 (which is exposed to the host) can connect as `postgres` superuser with full access to all data, including customer PII and order history.

**Fix:**
1. Remove the hardcoded password from `docker-compose.yml`. Use only `env_file: - .env`.
2. Remove `SPRING_DATASOURCE_PASSWORD` from the `environment` block in the `backend` service — it overrides the `.env` value.
3. Set a strong, randomly generated password in `.env` and ensure `.env` is in `.gitignore`.
4. Close the database port to the host in production:
```yaml
# Remove this block entirely in production:
ports:
  - "5432:5432"
# Replace with internal-only (no host binding):
expose:
  - "5432"
```

---

### 🔴 CRIT-04 — Swagger / OpenAPI Exposed Publicly

**File:** `SecurityConfig.java`
```java
.requestMatchers("/swagger-ui/**", "/api-docs/**").permitAll()
```

**Impact:** The full API schema — including all endpoints, request/response structures, authentication requirements, and data models — is publicly accessible without any authentication. This provides attackers with a detailed map of the application surface.

**Fix:** Restrict Swagger to admin role, or disable it entirely via Spring profile in production:

```java
// Option A: Require ADMIN role
.requestMatchers("/swagger-ui/**", "/api-docs/**").hasRole("ADMIN")

// Option B: Disable in application-prod.properties
springdoc.swagger-ui.enabled=false
springdoc.api-docs.enabled=false
```

---

### 🔴 CRIT-05 — Actuator Endpoints Expose Sensitive Metrics Publicly

**File:** `application.properties`
```properties
management.endpoints.web.exposure.include=health,info,prometheus,metrics
management.endpoint.health.show-details=always
```

**Impact:** The `health` endpoint with `show-details=always` exposes database connection URLs, datasource pool status, and disk space. The `prometheus` and `metrics` endpoints reveal internal performance data and can expose internal hostnames, thread counts, and memory details useful for profiling attacks.

**Fix:**
```properties
# Restrict health detail to admin only
management.endpoint.health.show-details=when-authorized
management.endpoint.health.roles=ADMIN

# Expose only health for public; everything else requires ADMIN (already in SecurityConfig)
management.endpoints.web.exposure.include=health,prometheus,metrics,info
```

Ensure the `SecurityConfig` rule for `/actuator/**` requiring `ADMIN` role is applied before the `health` permit:
```java
.requestMatchers("/actuator/health").hasRole("ADMIN")  // remove the permitAll line
.requestMatchers("/actuator/**").hasRole("ADMIN")
```

---

## 2. High Vulnerabilities

---

### 🟠 HIGH-01 — No Rate Limiting on Non-Auth API Endpoints

**File:** `nginx.conf`

The Nginx config applies rate limiting only to `/api/auth/`. All other endpoints — including cart, order creation, and search — have no rate limit.

**Impact:** An attacker can flood `/api/orders` (which creates an order and decrements stock) or `/api/products/search` (triggering database queries) to cause DoS or abuse business logic.

**Fix:** Add a general rate limit zone in addition to the auth-specific one:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... existing proxy config
}
```

---

### 🟠 HIGH-02 — No File Type Validation on Image Uploads (Content-Type Only)

**File:** `ProductController.java` — `uploadImages()` method

The image upload endpoint only checks file extension in the Excel upload path. The `/api/products/images` endpoint performs no content validation at all — only a UUID filename is generated.

**Impact:** An attacker with ADMIN credentials (or through a compromised admin account) could upload a `.php`, `.jsp`, or `.html` file renamed with an image extension. If the web server is misconfigured, this could lead to server-side code execution.

**Fix:** Validate the actual file content using magic bytes:

```java
private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
    "image/jpeg", "image/png", "image/gif", "image/webp"
);
private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
    "image/jpeg", new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF},
    "image/png",  new byte[]{(byte)0x89, 0x50, 0x4E, 0x47}
);

private void validateImageFile(MultipartFile file) throws IOException {
    String contentType = file.getContentType();
    if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
        throw new IllegalArgumentException("Invalid file type: " + contentType);
    }
    byte[] header = file.getBytes();
    // Check magic bytes match declared content type
    byte[] expected = MAGIC_BYTES.get(contentType);
    if (expected != null) {
        for (int i = 0; i < expected.length; i++) {
            if (header[i] != expected[i]) {
                throw new IllegalArgumentException("File content does not match declared type");
            }
        }
    }
    // Enforce size limit (5MB)
    if (file.getSize() > 5 * 1024 * 1024) {
        throw new IllegalArgumentException("File too large");
    }
}
```

---

### 🟠 HIGH-03 — In-Memory OTP Store Not Cluster-Safe and Not Garbage Collected

**File:** `OtpService.java`
```java
private final Map<String, PendingRegistration> pendingStore = new ConcurrentHashMap<>();
```

**Impact:** The in-memory store leaks memory if registrations are initiated but never completed — an attacker can flood `/api/auth/send-otp` with unique emails to exhaust heap. Additionally, in a multi-instance deployment, OTPs created on one instance cannot be verified on another.

**Fix:**
1. Add TTL-based eviction using a scheduled task:

```java
@Scheduled(fixedDelay = 60_000) // every minute
public void evictExpired() {
    Instant cutoff = Instant.now().minusSeconds(expiryMinutes * 60L);
    pendingStore.entrySet().removeIf(e -> e.getValue().generatedAt().isBefore(cutoff));
}
```

2. For production, migrate to Redis with TTL:
```java
// store.set(key, serialize(registration), expiryMinutes, TimeUnit.MINUTES)
```

---

### 🟠 HIGH-04 — JWT Stored in `localStorage` (XSS-Accessible)

**File:** `frontend/src/services/api.ts`
```typescript
const token = localStorage.getItem('token');
```

**Impact:** If any XSS vulnerability exists anywhere in the application (including third-party scripts), an attacker can steal the JWT from `localStorage` and impersonate any user. `localStorage` has no protection against JavaScript access.

**Fix:**
1. Migrate token storage to `httpOnly` cookies. Update the backend to set the cookie on login:

```java
// In AuthController.login():
ResponseCookie jwtCookie = ResponseCookie.from("jwt", token)
    .httpOnly(true)
    .secure(true)
    .sameSite("Strict")
    .path("/")
    .maxAge(Duration.ofMillis(jwtExpiration))
    .build();
response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());
```

2. Update `JwtAuthenticationFilter` to also read the token from cookies in addition to the `Authorization` header.
3. Remove `localStorage.getItem('token')` from the frontend API interceptor.

---

### 🟠 HIGH-05 — `spring.jpa.show-sql=true` and `DEBUG` Log Level in Production Config

**File:** `application.properties`
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.com.pharma=DEBUG
logging.level.org.springframework.security=DEBUG
```

**Impact:** All SQL queries including those containing user emails, addresses, and order data are written to logs. Spring Security DEBUG logs emit tokens and authentication details. In any environment where logs are shipped to a third-party aggregator, this constitutes a data leak.

**Fix:**
```properties
# application-prod.properties
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
logging.level.com.pharma=INFO
logging.level.org.springframework.security=WARN
```

---

## 3. Medium Vulnerabilities

---

### 🟡 MED-01 — CSRF Protection Disabled

**File:** `SecurityConfig.java`
```java
.csrf(AbstractHttpConfigurer::disable)
```

**Impact:** While CSRF is commonly disabled for stateless JWT APIs, this application also stores the JWT in `localStorage` and does not use `httpOnly` cookies — creating a mixed-mode risk. Once HIGH-04 is fixed and tokens move to cookies, CSRF protection becomes mandatory.

**Fix:** After implementing cookie-based auth (HIGH-04), re-enable CSRF with token synchronisation:
```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
)
```

---

### 🟡 MED-02 — No Login Attempt Rate Limiting or Account Lockout

**File:** `UserService.java` — `login()` method

There is no tracking of failed login attempts. An attacker can brute-force any account password without restriction (the Nginx rate limit of 5/min applies only to `/api/auth/` from a single IP, which is easily bypassed with distributed IPs).

**Fix:** Implement account-level lockout using a counter stored in Redis or database:

```java
// On failed authentication, increment attempts counter
// After 5 failures within 15 minutes: lock account for 30 minutes
// Return 429 Too Many Requests with Retry-After header
// On successful login: reset counter
```

Consider integrating Spring Security's `AbstractUserDetailsAuthenticationProvider` with a custom `UserDetailsChecker`.

---

### 🟡 MED-03 — `X-Frame-Options` Disabled

**File:** `SecurityConfig.java`
```java
.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()))
```

**Impact:** Disabling frame options allows the application to be embedded in an iframe on any third-party site, enabling clickjacking attacks where a user believes they are clicking on their own UI but are actually interacting with a transparent overlay.

**Fix:** Unless H2 console or a legitimate iframe use is required, enable SAMEORIGIN:
```java
.headers(headers -> headers
    .frameOptions(frameOptions -> frameOptions.sameOrigin())
    .contentSecurityPolicy(csp -> csp.policyDirectives(
        "default-src 'self'; frame-ancestors 'none';"))
)
```

---

### 🟡 MED-04 — CORS Allows Only Localhost Origins (Deployment Risk)

**File:** `CorsConfig.java`
```java
configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
```

**Impact:** While this is overly restrictive for production (the real frontend domain is missing), a common "fix" is to change this to `*`, which would be a serious vulnerability. The CORS config needs to be environment-specific.

**Fix:** Externalise allowed origins:
```properties
# application.properties
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}
```
```java
@Value("${cors.allowed-origins}")
private String[] allowedOrigins;

configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
```

---

### 🟡 MED-05 — Grafana Default Admin Password

**File:** `docker-compose.yml`
```yaml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=admin
```

**Impact:** Grafana is accessible on port 3001 with username `admin` / password `admin`. Grafana has access to all Prometheus metrics and can be configured to make outbound HTTP requests (via data source queries), enabling SSRF.

**Fix:**
```yaml
- GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
```
Set a strong password in `.env`. Bind Grafana to localhost only in non-production:
```yaml
ports:
  - "127.0.0.1:3001:3000"
```

---

### 🟡 MED-06 — Missing Security Headers in Nginx

**File:** `nginx.conf`

The Nginx config proxies requests but sets no security response headers.

**Fix:** Add to the `server` block:
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### 🟡 MED-07 — Email Address Hardcoded in application.properties

**File:** `application.properties`
```properties
spring.mail.username=[EMAIL_ADDRESS]
app.email.admin-address=[EMAIL_ADDRESS]
```

**Impact:** While shown here as a placeholder, this value is likely a real email address in the developer's local copy. Committed credentials or PII in config files are a common source of data leaks.

**Fix:** Move both to environment variables:
```properties
spring.mail.username=${MAIL_USERNAME}
app.email.admin-address=${ADMIN_EMAIL}
```

---

## 4. Low / Hardening Items

---

### 🔵 LOW-01 — No `max` Validation on Pagination Parameters

**Files:** `ProductController.java`, `UserController.java`, `AdminController.java`

`@RequestParam(defaultValue = "12") int size` has no upper bound. A caller can pass `size=100000`, triggering a full table scan.

**Fix:** Cap page size in each controller or via a global `PageableHandlerMethodArgumentResolverCustomizer`:
```java
@Bean
public PageableHandlerMethodArgumentResolverCustomizer pageableCustomizer() {
    return resolver -> resolver.setMaxPageSize(100);
}
```

---

### 🔵 LOW-02 — Exception Message Leaked to Client in Upload Endpoint

**File:** `ProductController.java`
```java
return ResponseEntity.internalServerError()
    .body(new ApiResponse<>(false, "Failed to process file: " + e.getMessage()));
```

**Impact:** Internal Java exception messages (stack paths, class names, data values) are returned to the client, aiding an attacker in understanding the server's internals.

**Fix:** Log the full exception server-side and return a generic message to the client:
```java
log.error("Error processing upload", e);
return ResponseEntity.internalServerError()
    .body(new ApiResponse<>(false, "Failed to process file. Please check format and try again."));
```

---

### 🔵 LOW-03 — JWT Keys Decoded on Every Request (No Caching)

**File:** `JwtService.java` — `getPrivateKey()` / `getPublicKey()`

Both methods decode and reconstruct RSA keys from Base64 on every single JWT operation. This is computationally wasteful and adds unnecessary latency.

**Fix:** Cache the keys at startup using `@PostConstruct`:
```java
private PrivateKey privateKey;
private PublicKey publicKey;

@PostConstruct
public void init() {
    this.privateKey = loadPrivateKey();
    this.publicKey = loadPublicKey();
}
```

---

### 🔵 LOW-04 — `sortBy` Parameter Not Validated (Potential SQL Injection via JPA Sort)

**File:** `ProductController.java`
```java
@RequestParam(defaultValue = "id") String sortBy
Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy));
```

**Impact:** While Spring Data JPA typically uses parameterised queries, passing unsanitised column names to `Sort.by()` can in some configurations cause unexpected behaviour or information disclosure (e.g., passing `password` as the sort column leaks ordering by that field).

**Fix:** Whitelist allowed sort fields:
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "name", "price", "createdAt");

String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, safeSortBy));
```

---

### 🔵 LOW-05 — `resendOtp` Has No Rate Limit Logic

**File:** `OtpService.java` — `resendOtp()`

There is no limit on how many times `resendOtp` can be called for a given email. The Nginx rate limit of 5/min applies globally per IP, but this is insufficient to prevent OTP enumeration or email bombing.

**Fix:** Track resend attempts per email in the `PendingRegistration` record and enforce a max resend count (e.g., 3):
```java
private record PendingRegistration(RegisterRequest request, String otp, Instant generatedAt, int resendCount) {}

// In resendOtp():
if (existing.resendCount() >= 3) {
    throw new IllegalArgumentException("Maximum OTP resend attempts reached. Please restart registration.");
}
```

---

## Prioritised Fix Roadmap

| Priority | ID | Title | Effort | Owner |
|---|---|---|---|---|
| P0 — Immediate | CRIT-01 | Remove OTP test bypass | 1h | Backend |
| P0 — Immediate | CRIT-02 | Fix IDOR on order endpoint | 2h | Backend |
| P0 — Immediate | CRIT-03 | Remove hardcoded DB password from docker-compose | 1h | DevOps |
| P0 — Immediate | CRIT-04 | Restrict Swagger to ADMIN or disable in prod | 30m | Backend |
| P0 — Immediate | CRIT-05 | Restrict Actuator health details | 30m | Backend |
| P1 — This Sprint | HIGH-01 | Add rate limiting to all API routes | 2h | DevOps |
| P1 — This Sprint | HIGH-02 | Validate image uploads by magic bytes | 3h | Backend |
| P1 — This Sprint | HIGH-04 | Migrate JWT to httpOnly cookies | 4h | Backend + Frontend |
| P1 — This Sprint | HIGH-05 | Disable SQL logging and DEBUG logs in prod | 30m | Backend |
| P2 — Next Sprint | MED-01 | Re-enable CSRF after cookie migration | 2h | Backend |
| P2 — Next Sprint | MED-02 | Implement login attempt lockout | 4h | Backend |
| P2 — Next Sprint | MED-03 | Re-enable X-Frame-Options | 30m | Backend |
| P2 — Next Sprint | MED-05 | Secure Grafana default password | 30m | DevOps |
| P2 — Next Sprint | MED-06 | Add Nginx security headers | 1h | DevOps |
| P3 — Backlog | HIGH-03 | Replace in-memory OTP store with Redis | 1 day | Backend |
| P3 — Backlog | MED-04 | Externalise CORS origins to env vars | 1h | Backend |
| P3 — Backlog | MED-07 | Move hardcoded email to env vars | 30m | Backend |
| P3 — Backlog | LOW-01 | Cap pagination page size | 1h | Backend |
| P3 — Backlog | LOW-02 | Don't leak exception messages to client | 1h | Backend |
| P3 — Backlog | LOW-03 | Cache JWT RSA keys at startup | 30m | Backend |
| P3 — Backlog | LOW-04 | Whitelist sortBy parameter values | 1h | Backend |
| P3 — Backlog | LOW-05 | Rate-limit OTP resend per email | 2h | Backend |

---

*This plan covers vulnerabilities identified through static code review. A full penetration test including dynamic analysis, dependency scanning (`mvn dependency-check`), and secrets scanning (`git secrets` / `trufflehog`) is recommended before production launch.*
