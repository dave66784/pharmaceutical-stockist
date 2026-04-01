# Feature Roadmap

Current state: fully functional pharmaceutical e-commerce platform with product browsing, cart, COD checkout, order management, admin dashboard, bundle offers, and email notifications. The gaps below are grouped by priority.

> **Business context:** This platform is used exclusively by doctors and medical professionals — not the general public. Features like prescription upload/verification are therefore not required.

---

## Priority 1 — Core Business Gaps

These are missing features that directly impact the ability to run the business properly.

---

### 1.1 Online Payment Integration

**Why:** The `ONLINE` payment method already exists in the codebase (enum, UI option) but returns an error. It is the most-requested feature for any e-commerce platform.

**What to build:**
- Integrate a payment gateway (Razorpay or Stripe)
- Payment initiation endpoint: creates order, returns payment session/link
- Webhook endpoint: gateway calls back with payment result, updates `paymentStatus`
- Frontend payment page updated to redirect to gateway and handle callback
- Refund trigger when order is cancelled post-payment

**Touches:** `PaymentController`, `PaymentService`, `Payment.tsx`, webhook handler, `.env` keys.

---

### 1.2 Return & Refund Management

**Why:** No mechanism exists for customers to return products or receive refunds after delivery.

**What to build:**
- Customer raises a return request from order details page (reason, quantity, description)
- Admin reviews and approves/rejects in a new "Returns" admin tab
- On approval: trigger refund via payment gateway (if online payment), update stock
- New statuses: `RETURN_REQUESTED`, `RETURN_APPROVED`, `RETURNED`, `REFUND_INITIATED`, `REFUNDED`

**Touches:** new `ReturnRequest` entity, `ReturnController`, `ReturnService`, admin UI, order status enum extension.

---

### 1.3 Stock Reservation During Checkout

**Why:** Stock is only validated when the order is placed, not when items are added to cart. Two customers can both see "50 in stock", both add 50 to cart, and one order will fail.

**What to build:**
- Reserve stock when checkout begins (soft reservation with a 15-minute TTL)
- Release reservation if checkout is abandoned or TTL expires (scheduled job)
- Confirm reservation when order is placed

**Touches:** new `StockReservation` entity, `StockReservationService`, scheduled cleanup job, cart/checkout flow.

---

## Priority 2 — Customer Experience

Features that improve conversion and retention.

---

### 2.1 Wishlist

**Why:** Customers browsing prescription or out-of-stock products have no way to save them for later.

**What to build:**
- "Save to Wishlist" button on `ProductCard` and `ProductDetail`
- Wishlist page showing saved products with direct "Add to Cart" action
- Items automatically removed from wishlist when added to cart (optional toggle)
- Backend: `Wishlist` entity (user → products), CRUD endpoints

**Touches:** new `Wishlist` entity, `WishlistController`, `WishlistService`, frontend page + service.

---

### 2.2 Product Reviews & Ratings

**Why:** No social proof exists. Customers cannot see what others think of a product.

**What to build:**
- Customers who have received an order containing the product can leave a rating (1–5 stars) and review text
- Reviews displayed on `ProductDetail` page with average rating
- Admin can moderate (delete inappropriate reviews)
- Average rating shown on `ProductCard`

**Touches:** new `Review` entity, `ReviewController`, `ReviewService`, `ProductDetail.tsx`, `ProductCard.tsx`, admin moderation UI.

---

### 2.3 Advanced Product Filters

**Why:** Current filtering is only by category/subcategory. Customers cannot filter by price range, prescription status, availability, or brand.

**What to build:**
- Price range slider (min/max)
- Filter by prescription required (Yes/No)
- Filter by manufacturer/brand
- Sort by: price low→high, price high→low, newest, most popular
- "In Stock Only" toggle
- All filters persist in URL query params

**Touches:** `Products.tsx`, `ProductController.getAllProducts()` query params, repository custom query.

---

### 2.4 Out-of-Stock Notifications

**Why:** When a product is out of stock, customers have no way to be notified when it comes back.

**What to build:**
- "Notify me when available" button on out-of-stock products
- Email sent to subscribed customers when admin restocks the product (stock goes from 0 → >0)
- Admin sees subscriber count on product list

**Touches:** new `StockNotification` entity, email trigger on product update, frontend button on `ProductDetail`.

---

## Priority 3 — Admin & Operations

Features that improve how the business is managed day-to-day.

---

### 3.1 Supplier / Restock Management

**Why:** No way to track where products come from or raise purchase orders when stock is low.

**What to build:**
- `Supplier` entity: name, contact, email, lead time (days)
- Link suppliers to products
- Admin can raise a "Restock Order" with quantity and supplier
- Restock orders tracked with status: RAISED → CONFIRMED → RECEIVED
- Dashboard widget: pending restock orders

**Touches:** new `Supplier`, `RestockOrder` entities, admin UI tab, dashboard widget.

---

### 3.2 Audit Log

**Why:** No record of who changed what. Critical for compliance in a pharmaceutical context.

**What to build:**
- Automatic logging of: product create/update/delete, order status changes, user role changes, stock changes
- Log entry captures: actor (admin email), action, entity type/id, old value, new value, timestamp
- Admin "Audit Log" page with filters by date, actor, entity type

**Touches:** new `AuditLog` entity, Spring AOP aspect to intercept service methods, admin UI page.

---

### 3.3 Delivery Date Estimation

**Why:** The `deliveryDate` field exists on the `Order` entity but is never set. Customers see no estimated delivery.

**What to build:**
- Admin configures delivery lead time per zone (or a global default)
- Estimated delivery date calculated and shown at checkout and on order confirmation
- Set on order creation, displayed on `OrderDetails` and confirmation email

**Touches:** `OrderService.createOrder()`, `Checkout.tsx`, `OrderConfirmation.tsx`, `OrderDetails.tsx`, email templates.

---

### 3.4 Repeat Order

**Why:** No mechanism to reward repeat customers or make reordering easy.

**What to build:**
- "Reorder" button on past orders — adds all items back to cart in one click
- "Frequently ordered" section on home page for logged-in customers (based on order history)

**Touches:** `OrderController` new endpoint, `Orders.tsx`, `Home.tsx` (conditional section).

---

## Priority 4 — Technical & Compliance

Not customer-facing but important for production readiness.

---

### 4.1 API Rate Limiting

- Protect OTP endpoint (brute-force risk), login endpoint, and search endpoint
- Use Bucket4j or Spring's built-in mechanisms
- Return `429 Too Many Requests` with retry-after header

---

### 4.2 Password Reset Flow

**Why:** Currently no "Forgot password" — users are permanently locked out if they forget their password.

**What to build:**
- "Forgot password" link on login page
- User enters email → receives reset link (JWT one-time token, 15-min expiry)
- Token validated, user sets new password

**Touches:** `AuthController`, `AuthService`, new frontend page, email template.

---

### 4.3 Session Management

**Why:** JWT tokens are 30 minutes, no refresh mechanism. Users get logged out mid-session.

**What to build:**
- Refresh token (long-lived, stored in DB) issued alongside access token
- Silent refresh via Axios interceptor before access token expires
- Logout invalidates refresh token in DB

**Touches:** new `RefreshToken` entity, `AuthController`, Axios interceptor in `api.ts`.

---

## Summary Table

| # | Feature | Priority | Effort | Impact |
|---|---------|----------|--------|--------|
| 1.1 | Online Payment Integration | Critical | Medium | Revenue |
| 1.2 | Return & Refund Management | High | High | Customer trust |
| 1.3 | Stock Reservation at Checkout | High | Medium | Data integrity |
| 2.1 | Wishlist | Medium | Low | Engagement |
| 2.2 | Product Reviews & Ratings | Medium | Medium | Conversion |
| 2.3 | Advanced Product Filters | Medium | Medium | Discoverability |
| 2.4 | Out-of-Stock Notifications | Medium | Low | Retention |
| 3.1 | Supplier / Restock Management | Medium | High | Operations |
| 3.2 | Audit Log | High | Medium | Compliance |
| 3.3 | Delivery Date Estimation | Low | Low | UX |
| 3.4 | Repeat Order / Reorder Button | Low | Low | Retention |
| 4.1 | API Rate Limiting | High | Low | Security |
| 4.2 | Password Reset Flow | High | Low | Accessibility |
| 4.3 | Session / Refresh Token | Medium | Medium | UX |
