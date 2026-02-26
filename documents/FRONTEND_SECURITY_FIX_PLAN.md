# Frontend Security Vulnerability Fix Plan
## Pharmaceutical Stockist — React/TypeScript Frontend Audit

**Stack:** React 18 · TypeScript · Axios · React Router v6 · Vite · Tailwind CSS  
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

A total of **15 distinct security issues** were identified in the frontend codebase. Two are rated Critical and stem from how authentication state is stored and how admin authorisation is enforced purely on the client side. Several High issues involve hardcoded backend URLs leaking into production builds and a direct token extraction outside the secure API layer. The codebase is otherwise reasonably structured — React's JSX escaping prevents the most common XSS vectors — but the authentication model requires a fundamental rethink before production.

---

## 1. Critical Vulnerabilities

---

### 🔴 CRIT-FE-01 — JWT and Full User Object Stored in `localStorage` (XSS-Accessible)

**Files:** `services/authService.ts`, `services/api.ts`

```typescript
// authService.ts — login and verifyOtp
localStorage.setItem('token', response.data.data.token);
localStorage.setItem('user', JSON.stringify(response.data.data));

// api.ts — every request
const token = localStorage.getItem('token');
```

**Impact:** `localStorage` is fully accessible to any JavaScript running on the page. A single XSS vulnerability — in a third-party script, a dependency, or even a future code change — would allow an attacker to silently steal the JWT and the entire user object (including `id`, `email`, `firstName`, `lastName`, `role`) from every active session. The token can then be used from any device to impersonate the user until it expires (currently 24 hours).

**Fix:** Migrate to `httpOnly` cookies (coordinated with backend fix HIGH-04 in the backend plan). Once cookies are in place, remove all `localStorage` token access:

```typescript
// authService.ts — remove these lines entirely:
// localStorage.setItem('token', ...)
// localStorage.setItem('user', ...)
// localStorage.removeItem('token')
// localStorage.removeItem('user')

// api.ts — remove manual token injection:
// The browser will automatically send the httpOnly cookie with every request.
// Remove the request interceptor's Authorization header injection.

// For getCurrentUser(): fetch from a /api/auth/me endpoint instead:
getCurrentUser: async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
}
```

Store session state in React context or Zustand (which is already a listed dependency) in memory only:

```typescript
// stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

---

### 🔴 CRIT-FE-02 — Admin Role Checked from Tampered `localStorage` Data

**File:** `components/auth/AdminRoute.tsx`

```typescript
const user = authService.getCurrentUser(); // reads localStorage
if (user?.role !== 'ADMIN') {
  return <Navigate to="/" replace />;
}
```

**Impact:** The `user` object is read directly from `localStorage`, which a user can edit freely in any browser. A customer can open DevTools, change `localStorage.getItem('user')` to set `"role": "ADMIN"`, and gain access to every admin UI route: `/admin/products`, `/admin/orders`, `/admin/users`, and so on. While API requests would still be rejected by the server (which validates the JWT), the admin UI is fully exposed — including forms that submit destructive operations.

**Secondary impact:** `ProtectedRoute` only checks `!!authService.getToken()` — the presence of *any* string in `localStorage.token`, including expired or fabricated JWTs — grants access to all protected pages.

**Fix:**
1. After migrating to `httpOnly` cookies (CRIT-FE-01), user state must come from a server-validated source, not `localStorage`.
2. Create an `/api/auth/me` endpoint that returns the current user's details based on the cookie-bound JWT.
3. On app load, call `GET /api/auth/me` to hydrate auth state:

```typescript
// App.tsx
useEffect(() => {
  api.get('/auth/me')
    .then(res => setUser(res.data.data))
    .catch(() => setUser(null)); // token invalid or absent
}, []);
```

4. `AdminRoute` should derive the role from in-memory state only:

```typescript
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return <>{children}</>;
};
```

---

## 2. High Vulnerabilities

---

### 🟠 HIGH-FE-01 — Hardcoded `http://localhost:8080` in 8 Production Files

**Files:** `pages/ProductDetail.tsx` (×2), `pages/Cart.tsx`, `pages/Checkout.tsx`, `pages/OrderDetails.tsx`, `pages/admin/ManageOrders.tsx`, `components/admin/ProductForm.tsx`, `components/products/ProductCard.tsx`

```typescript
// Examples across the codebase:
src={`http://localhost:8080${product.imageUrls[0]}`}
src={`http://localhost:8080${item.product.imageUrls[0]}`}
```

**Impact:** In production, all image URLs will point to `localhost:8080` — a server that does not exist from the user's browser. Every product image will be broken. Beyond the UX failure, `http://` URLs on an `https://` page trigger mixed-content blocking in all modern browsers, causing images to fail silently. In some cases this also leaks the internal architecture (the backend's direct address) in page source.

**Fix:** Define the base URL in a single environment variable and reference it consistently:

```typescript
// src/config/env.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Usage in components (relative URLs work via Nginx proxy):
src={product.imageUrls[0]}  // if backend returns full relative path like /uploads/images/...

// Or if absolute is needed:
src={`${API_BASE_URL}${product.imageUrls[0]}`}
```

```bash
# .env.production
VITE_API_BASE_URL=https://api.yourproductiondomain.com

# .env.development  
VITE_API_BASE_URL=http://localhost:8080
```

Add `.env.production` to `.gitignore` and document the variable in a `.env.example` file. Update all 8 occurrences.

---

### 🟠 HIGH-FE-02 — Direct Axios Call Bypasses Auth Interceptor, Token Extracted Manually

**File:** `pages/admin/ManageOrders.tsx`

```typescript
const token = localStorage.getItem('token');
const response = await axios.get(
    `http://localhost:8080/api/admin/orders/export?${params.toString()}`,
    {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
    }
);
```

**Impact:** This call imports raw `axios` instead of the shared `api` instance, bypassing the request interceptor (which handles token injection, error handling, and 401 redirects) and the response interceptor. If the token is migrated to `httpOnly` cookies, this call will still try to read `localStorage` and send `Authorization: Bearer null`, silently failing authentication. It also hardcodes the backend URL (HIGH-FE-01).

**Fix:** Use the shared `api` instance which will automatically handle auth via cookie once CRIT-FE-01 is implemented:

```typescript
// Replace the raw axios.get call with:
const response = await api.get('/admin/orders/export', {
    params: Object.fromEntries(params),
    responseType: 'blob',
});
```

---

### 🟠 HIGH-FE-03 — Password Persists in React State Across OTP Verification Step

**File:** `pages/Register.tsx`

```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',   // <-- set during step 1
  firstName: '',
  lastName: '',
  phone: '',
});
// Password stays in state throughout step 2 (OTP entry), until component unmounts
```

**Impact:** The plaintext password lives in React component state from the moment the user types it, through the OTP sending step, and through the entire OTP verification step. Any React DevTools extension (legitimate or malicious), browser memory inspection tool, or crash dump could expose the password. It also means the password survives a tab background/foreground cycle while the user checks their email for the OTP.

**Fix:** Clear the password from state immediately after the OTP is sent successfully:

```typescript
const handleSendOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await authService.sendOtp(formData);
    // Store password temporarily in a ref (not state) for the verify step
    // OR pass it via a closure, NOT through visible state
    passwordRef.current = formData.password;
    setFormData(prev => ({ ...prev, password: '' })); // clear from state
    setStep('otp');
    setResendCooldown(60);
    successToast('OTP sent! Please check your inbox.');
  } catch (err) { ... }
};
```

Use a `useRef` to hold the password for the verify call, as refs are not serialised or visible in React DevTools component trees.

---

### 🟠 HIGH-FE-04 — 50 `console.*` Calls Leak Internal State and Errors in Production

**Scope:** 50 occurrences across the `src/` directory

```typescript
// Examples found:
console.log('Actually calling deleteProduct API for ID:', id);
console.log('Received bulk delete request for IDs:', Array.from(selectedIds));
console.error('Checkout load error:', err);
console.error('Failed to fetch cart', err);
```

**Impact:** Production browser consoles expose internal API error details (including full Axios error responses with headers, request URLs, and response bodies), user IDs, product IDs, operation traces, and debugging statements left from development. Any user who opens DevTools can see these. More critically, error objects logged to the console often contain response bodies from the server — which in this codebase include exception messages, stack traces, and data that aids reconnaissance.

**Fix:**
1. Create a centralised logger that strips output in production:

```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  error: (...args: unknown[]) => isDev && console.error(...args),
  warn: (...args: unknown[]) => isDev && console.warn(...args),
};
```

2. Replace all `console.*` calls with `logger.*`.
3. Add a Vite build plugin to strip all remaining console calls in production builds:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true }
    }
  }
});
```

---

## 3. Medium Vulnerabilities

---

### 🟡 MED-FE-01 — `authService.getCurrentUser()` Parses `localStorage` JSON Without Validation

**File:** `services/authService.ts`

```typescript
getCurrentUser: () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
```

**Impact:** `JSON.parse` on arbitrary `localStorage` content is unsafe if the string is malformed or has been tampered with. A prototype pollution attack (injecting `__proto__` keys into the JSON) or a storage poisoning attack from a subdomain can cause unexpected application behaviour. The returned object is used directly for role checks in `AdminRoute`.

**Fix:** After migrating to cookie-based auth (CRIT-FE-01), this method is removed entirely. Until then, validate the parsed object with a type guard:

```typescript
import { z } from 'zod'; // already a listed dependency

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  token: z.string(),
});

getCurrentUser: () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return UserSchema.parse(JSON.parse(raw));
  } catch {
    localStorage.removeItem('user'); // clear corrupted data
    return null;
  }
}
```

---

### 🟡 MED-FE-02 — Checkout Form Uses `noValidate` Without Full Custom Validation

**File:** `pages/Checkout.tsx`

```tsx
<form onSubmit={handleSubmit} noValidate>
```

The `handleSubmit` function only checks if all fields are non-empty (`!street || !city || ...`) but performs no format validation on zip code, phone number patterns, or special character injection in address fields.

**Impact:** A user can enter address data with special characters (`<script>`, SQL fragments, or path traversal characters like `../`) that gets passed directly as a string to the backend and stored in the database. While the backend stores this as a plain string (not executed), it becomes a stored XSS risk if admin order views ever render addresses without escaping.

**Fix:** Add field-level validation with the `zod` schema already available as a dependency, and use `react-hook-form` (also already listed):

```typescript
const addressSchema = z.object({
  street: z.string().min(3).max(200).regex(/^[a-zA-Z0-9\s,.\-#]+$/, 'Invalid characters in address'),
  city: z.string().min(2).max(100).regex(/^[a-zA-Z\s\-]+$/, 'City must contain only letters'),
  state: z.string().min(2).max(100),
  zipCode: z.string().regex(/^[A-Z0-9\s\-]{3,10}$/i, 'Invalid postal code format'),
  country: z.string().min(2),
});
```

---

### 🟡 MED-FE-03 — Password Strength Requirements Not Shown on Registration Form

**File:** `pages/Register.tsx`

```tsx
<input ... type="password" required minLength={8} placeholder="Minimum 8 characters" />
```

The frontend only enforces `minLength={8}` via the HTML attribute. The backend requires: at least one uppercase letter, one lowercase letter, one number, and one special character (`@#$%^&+=!`). This mismatch means users can attempt to register with a simple 8-character password like `password`, only to receive a cryptic backend validation error.

**Impact:** While not a direct vulnerability, it creates a social engineering risk — frustrated users may pick the weakest password that satisfies the frontend, and the backend's error message may not clearly explain the full requirements, leading users to retry with slightly stronger but still weak passwords.

**Fix:** Mirror backend validation on the frontend with explicit user feedback:

```typescript
const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'At least one uppercase letter')
  .regex(/[a-z]/, 'At least one lowercase letter')
  .regex(/[0-9]/, 'At least one number')
  .regex(/[@#$%^&+=!]/, 'At least one special character (@#$%^&+=!)');
```

Display a visual strength indicator on the registration form that updates as the user types.

---

### 🟡 MED-FE-04 — Shipping Address Passed via React Router `location.state` (Forgeable)

**Files:** `pages/Checkout.tsx` → `pages/Payment.tsx`

```typescript
// Checkout.tsx
navigate('/payment', { state: { shippingAddress: finalAddressString, addressId } });

// Payment.tsx
const state = location.state as { shippingAddress?: string; addressId?: number };
if (!state?.shippingAddress) return <Navigate to="/checkout" replace />;
```

**Impact:** React Router `location.state` can be set programmatically by any JavaScript on the page. A script could call `navigate('/payment', { state: { shippingAddress: 'injected address', addressId: 999 } })` to place an order using another user's saved address ID. While the backend should verify that `addressId` belongs to the requesting user, there is currently no such check in `AddressController`, meaning a valid `addressId` for any user's address could be passed here.

**Fix:**
1. On the backend: verify `addressId` ownership in `OrderService.createOrder()`.
2. On the frontend: do not rely on `location.state` for security-relevant data. Instead, persist the selected address ID in the auth-scoped Zustand store or re-fetch it during payment:

```typescript
// checkoutStore.ts
const useCheckoutStore = create<CheckoutState>((set) => ({
  selectedAddressId: null,
  setSelectedAddressId: (id) => set({ selectedAddressId: id }),
}));
```

---

### 🟡 MED-FE-05 — No Content Security Policy Configured

**Files:** `index.html`, `nginx.conf` (frontend)

Neither the HTML `<meta>` tag nor Nginx response headers define a Content Security Policy.

**Impact:** Without CSP, a successful XSS attack has no browser-level restriction on what it can do: exfiltrate data to arbitrary domains, load external scripts, or make credentialed requests. CSP is the last line of defence after input sanitisation.

**Fix:** Add a CSP `<meta>` tag to `index.html` as a starting point (Nginx header is preferred but requires deployment changes):

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self'; 
           style-src 'self' 'unsafe-inline'; 
           img-src 'self' data: https://images.unsplash.com https://via.placeholder.com; 
           connect-src 'self'; 
           font-src 'self'; 
           frame-ancestors 'none';">
```

Note: once external image URLs are removed (HIGH-FE-01), the `img-src` directive can be tightened to `'self' data:` only.

---

## 4. Low / Hardening Items

---

### 🔵 LOW-FE-01 — `as any` Type Assertions Bypass TypeScript Safety

**Files:** `pages/AddressManagement.tsx`, `pages/Checkout.tsx`, `components/admin/ProductForm.tsx`

```typescript
const apiResponse = response.data as any;
const addrData = addressResponse.data as any;
(product as any).imageUrl
```

**Impact:** `as any` disables all TypeScript type checking for those variables. If the API shape changes, TypeScript will not warn the developer, potentially allowing runtime `undefined` access or unexpected data to flow through the application undetected.

**Fix:** Define proper typed response interfaces matching the API contract and use `zod` for runtime validation of API responses:

```typescript
// Instead of: const addrData = addressResponse.data as any;
const addrData = AddressListResponseSchema.safeParse(addressResponse.data);
if (addrData.success) {
  setSavedAddresses(addrData.data.data);
}
```

---

### 🔵 LOW-FE-02 — Toast IDs Generated with `Math.random()` (Predictable)

**File:** `context/ToastContext.tsx`

```typescript
const id = Math.random().toString(36).substring(2, 9);
```

**Impact:** `Math.random()` is not cryptographically random. In scenarios where toast IDs are used to reference or dismiss notifications, a predictable ID could theoretically be guessed and used to dismiss alerts the user should see. Low risk in practice but trivially fixable.

**Fix:**
```typescript
const id = crypto.randomUUID();
```

---

### 🔵 LOW-FE-03 — `window.dispatchEvent` Used for Cart State Communication

**File:** `pages/Payment.tsx`

```typescript
window.dispatchEvent(new Event('cartUpdated'));
```

**Impact:** Using global window events for inter-component communication is fragile and a potential attack surface. A malicious script injected via XSS could dispatch `cartUpdated` events to confuse UI state or prevent the cart from clearing correctly, giving false confirmation of order success.

**Fix:** Use the Zustand cart store (already available as a dependency) to trigger state updates directly instead of broadcasting window events.

---

### 🔵 LOW-FE-04 — External Image Fallback URL (`via.placeholder.com`)

**Files:** `pages/Checkout.tsx`, `pages/OrderDetails.tsx`

```typescript
onError={(e) => {
  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
}}
```

**Impact:** `via.placeholder.com` is an external third-party service. Requests to it are tracked and can be used to fingerprint users. It also adds an unnecessary external dependency that could go offline or serve malicious content.

**Fix:** Host a local placeholder image in the public assets directory:

```typescript
onError={(e) => {
  (e.target as HTMLImageElement).src = '/assets/placeholder-product.png';
}}
```

---

### 🔵 LOW-FE-05 — Node Engine Requirement Set to `>=24.0.0` (Non-Standard)

**File:** `package.json`

```json
"engines": {
  "node": ">=24.0.0"
}
```

**Impact:** Node.js 24 is not yet an LTS release (as of early 2026). This requirement would force CI/CD pipelines to use a non-LTS, potentially less-stable Node version. It could also cause builds to fail in environments using the current LTS (Node 22) and may indicate the `engines` field was set incorrectly.

**Fix:**
```json
"engines": {
  "node": ">=20.0.0"
}
```

---

### 🔵 LOW-FE-06 — `ManageProducts.tsx` Uses `alert()` for User-Facing Validation

**File:** `pages/admin/ManageProducts.tsx`

```typescript
alert('Please select at least one product to delete');
```

**Impact:** `alert()` calls cannot be styled, are blocking (freeze the entire tab), and in some security contexts (CSPs, iframes) are disabled. They also look unprofessional and inconsistent with the Toast system used everywhere else.

**Fix:** Replace with the existing toast system:
```typescript
errorToast('Please select at least one product to delete');
```

---

## Prioritised Fix Roadmap

| Priority | ID | Title | Effort | Depends On |
|---|---|---|---|---|
| P0 — Immediate | CRIT-FE-01 | Migrate JWT to httpOnly cookies | 4h | Backend HIGH-04 |
| P0 — Immediate | CRIT-FE-02 | Derive admin role from server-validated state | 3h | CRIT-FE-01 |
| P0 — Immediate | HIGH-FE-01 | Replace all 8 hardcoded `localhost:8080` URLs | 2h | Fixed |
| P0 — Immediate | HIGH-FE-02 | Replace raw axios call with shared `api` instance | 1h | Fixed |
| P1 — This Sprint | HIGH-FE-03 | Clear password from state after OTP send | 1h | Fixed |
| P1 — This Sprint | HIGH-FE-04 | Remove `console.*` calls from production builds | 2h | Fixed |
| P1 — This Sprint | MED-FE-01 | Validate `getCurrentUser()` output with Zod | 2h | Fixed |
| P2 — Next Sprint | MED-FE-02 | Add Zod validation to Checkout address form | 3h | Fixed |
| P2 — Next Sprint | MED-FE-03 | Show full password requirements on register | 2h | Fixed |
| P2 — Next Sprint | MED-FE-04 | Move checkout state to Zustand, not router state | 3h | Fixed |
| P2 — Next Sprint | MED-FE-05 | Add Content Security Policy meta tag | 1h | Fixed |
| P3 — Backlog | LOW-FE-01 | Replace `as any` with typed Zod schemas | 3h | — |
| P3 — Backlog | LOW-FE-02 | Use `crypto.randomUUID()` for toast IDs | 15m | — |
| P3 — Backlog | LOW-FE-03 | Replace `window.dispatchEvent` with Zustand | 1h | — |
| P3 — Backlog | LOW-FE-04 | Replace `via.placeholder.com` with local asset | 30m | — |
| P3 — Backlog | LOW-FE-05 | Fix Node engine requirement to LTS (>=20) | 5m | — |
| P3 — Backlog | LOW-FE-06 | Replace `alert()` with toast in ManageProducts | 15m | — |

---

## Cross-Cutting Note: Backend Coordination Required

Several frontend fixes are **blocked on or tightly coupled with backend changes**:

| Frontend Fix | Backend Prerequisite |
|---|---|
| CRIT-FE-01 (httpOnly cookies) | Backend must set `Set-Cookie` response header on login |
| CRIT-FE-02 (server-validated role) | Backend needs `GET /api/auth/me` endpoint |
| MED-FE-04 (address ownership) | Backend must validate `addressId` belongs to requesting user |
| MED-FE-05 (CSP) | Nginx must serve `Content-Security-Policy` header (more reliable than meta tag) |

These should be planned and deployed together in a coordinated sprint.

---

*This plan covers vulnerabilities identified through static code review of all frontend source files. A full dynamic analysis including browser-based XSS testing, CSP validation via browser security tools, and dependency audit (`npm audit`) is recommended before production launch.*
