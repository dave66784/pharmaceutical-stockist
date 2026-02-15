# 📋 Pending Enhancements & Features List

This document lists all the features that need to be implemented to complete the pharmaceutical stockist application.

---

## 🎨 Frontend Implementation (HIGH PRIORITY)

### 1. Product Pages
**Status:** ⚠️ Placeholder Only

**What's Missing:**
- [ ] Product listing page with real data from API
- [ ] Product grid/list view with images
- [ ] Product filters (category, price range, prescription required)
- [ ] Search functionality integration
- [ ] Sorting options (price, name, newest)
- [ ] Pagination controls
- [ ] Product detail page with full information
- [ ] "Add to Cart" button functionality
- [ ] Stock availability display
- [ ] Prescription required badge/warning

**Files to Update:**
- `frontend/src/pages/Products.tsx`
- `frontend/src/pages/ProductDetail.tsx`
- `frontend/src/components/products/ProductCard.tsx` (create)
- `frontend/src/components/products/ProductList.tsx` (create)
- `frontend/src/components/products/ProductFilters.tsx` (create)

**Estimated Time:** 8-12 hours

---

### 2. Shopping Cart
**Status:** ⚠️ Placeholder Only

**What's Missing:**
- [ ] Cart page showing items from API
- [ ] Quantity increment/decrement controls
- [ ] Remove item functionality
- [ ] Cart total calculation
- [ ] Empty cart state
- [ ] Continue shopping button
- [ ] Proceed to checkout button
- [ ] Stock validation before checkout
- [ ] Cart item count in header/navbar

**Files to Update:**
- `frontend/src/pages/Cart.tsx`
- `frontend/src/components/cart/CartItem.tsx` (create)
- `frontend/src/components/cart/CartSummary.tsx` (create)
- `frontend/src/components/common/Header.tsx` (create)

**Estimated Time:** 6-8 hours

---

### 3. Checkout & Orders
**Status:** ⚠️ Not Implemented

**What's Missing:**
- [ ] Checkout page with shipping address form
- [ ] Order summary before confirmation
- [ ] Order confirmation page
- [ ] Order history page with real data
- [ ] Order details page
- [ ] Order status badges (Pending, Shipped, etc.)
- [ ] Order tracking information
- [ ] Reorder functionality
- [ ] Cancel order (if pending)

**Files to Create:**
- `frontend/src/pages/Checkout.tsx`
- `frontend/src/pages/OrderConfirmation.tsx`
- `frontend/src/pages/Orders.tsx` (update)
- `frontend/src/components/orders/OrderCard.tsx`
- `frontend/src/components/orders/OrderDetails.tsx`

**Estimated Time:** 8-10 hours

---

### 4. Admin Dashboard
**Status:** ⚠️ Placeholder Only

**What's Missing:**
- [ ] Dashboard overview with statistics
  - Total sales
  - Total orders
  - Low stock alerts
  - Recent orders
- [ ] Product management page
  - List all products
  - Add new product form
  - Edit product form
  - Delete product with confirmation
  - Bulk actions
- [ ] Order management page
  - View all orders
  - Filter by status
  - Update order status
  - View order details
- [ ] User management (optional)
  - View all users
  - Change user roles
  - Deactivate users

**Files to Create/Update:**
- `frontend/src/pages/admin/AdminDashboard.tsx` (update)
- `frontend/src/pages/admin/ManageProducts.tsx` (create)
- `frontend/src/pages/admin/ManageOrders.tsx` (create)
- `frontend/src/pages/admin/ProductForm.tsx` (create)
- `frontend/src/components/admin/StatsCard.tsx` (create)
- `frontend/src/components/admin/OrderTable.tsx` (create)

**Estimated Time:** 12-16 hours

---

### 5. User Profile & Settings
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] User profile page
- [ ] Edit profile information
- [ ] Change password functionality
- [ ] View saved addresses
- [ ] Add/edit/delete addresses
- [ ] Order history in profile
- [ ] Account deletion option

**Files to Create:**
- `frontend/src/pages/Profile.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/components/profile/ProfileForm.tsx`
- `frontend/src/components/profile/AddressList.tsx`

**Estimated Time:** 6-8 hours

---

### 6. Navigation & Layout
**Status:** ⚠️ Basic Implementation Only

**What's Missing:**
- [ ] Proper navbar with all links
- [ ] User menu dropdown (profile, orders, logout)
- [ ] Cart icon with item count
- [ ] Category menu
- [ ] Search bar in header
- [ ] Footer with links
- [ ] Breadcrumb navigation
- [ ] Mobile responsive menu
- [ ] Loading states/spinners
- [ ] Error boundaries

**Files to Create:**
- `frontend/src/components/common/Navbar.tsx`
- `frontend/src/components/common/Header.tsx`
- `frontend/src/components/common/Footer.tsx`
- `frontend/src/components/common/SearchBar.tsx`
- `frontend/src/components/common/Loader.tsx`

**Estimated Time:** 8-10 hours

---

## 🔧 Backend Enhancements (MEDIUM PRIORITY)

### 7. File Upload
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Product image upload endpoint
- [ ] Prescription document upload
- [ ] File validation (size, type)
- [ ] Image resizing/optimization
- [ ] Store files in proper location
- [ ] Serve uploaded files

**Files to Create/Update:**
- `backend/src/main/java/com/pharma/controller/FileController.java`
- `backend/src/main/java/com/pharma/service/FileStorageService.java`
- `backend/src/main/java/com/pharma/config/FileStorageConfig.java`

**Estimated Time:** 6-8 hours

---

### 8. Email Notifications
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Email service configuration (SMTP)
- [ ] Order confirmation email
- [ ] Order status update emails
- [ ] Password reset email
- [ ] Welcome email on registration
- [ ] Low stock alerts to admin
- [ ] Email templates (HTML)

**Files to Create:**
- `backend/src/main/java/com/pharma/service/EmailService.java`
- `backend/src/main/java/com/pharma/config/MailConfig.java`
- `backend/src/main/resources/templates/email/` (email templates)

**Dependencies to Add:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

**Estimated Time:** 6-8 hours

---

### 9. Password Reset
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Forgot password endpoint
- [ ] Generate password reset token
- [ ] Send reset email with link
- [ ] Verify reset token
- [ ] Reset password endpoint
- [ ] Token expiration logic

**Files to Create/Update:**
- `backend/src/main/java/com/pharma/model/PasswordResetToken.java`
- `backend/src/main/java/com/pharma/repository/PasswordResetTokenRepository.java`
- `backend/src/main/java/com/pharma/controller/PasswordResetController.java`
- `backend/src/main/java/com/pharma/service/PasswordResetService.java`

**Estimated Time:** 4-6 hours

---

### 10. Search & Filtering
**Status:** ⚠️ Basic Search Only

**What's Missing:**
- [ ] Advanced search with multiple filters
- [ ] Filter by price range
- [ ] Filter by manufacturer
- [ ] Filter by prescription requirement
- [ ] Filter by expiry date
- [ ] Sort by multiple criteria
- [ ] Search suggestions/autocomplete
- [ ] Full-text search optimization

**Files to Update:**
- `backend/src/main/java/com/pharma/repository/ProductRepository.java`
- `backend/src/main/java/com/pharma/service/ProductService.java`
- `backend/src/main/java/com/pharma/controller/ProductController.java`

**Estimated Time:** 6-8 hours

---

### 11. Prescription Management
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Prescription entity and repository
- [ ] Upload prescription for order
- [ ] Admin verification workflow
- [ ] Prescription status (Pending, Approved, Rejected)
- [ ] Reject prescription with reason
- [ ] Notification to customer on status change
- [ ] View prescription images

**Files to Create:**
- `backend/src/main/java/com/pharma/model/Prescription.java` (exists but not used)
- `backend/src/main/java/com/pharma/repository/PrescriptionRepository.java`
- `backend/src/main/java/com/pharma/service/PrescriptionService.java`
- `backend/src/main/java/com/pharma/controller/PrescriptionController.java`
- `backend/src/main/java/com/pharma/dto/PrescriptionDTO.java`

**Estimated Time:** 8-10 hours

---

### 12. Inventory Management
**Status:** ⚠️ Basic Implementation

**What's Missing:**
- [ ] Low stock threshold configuration
- [ ] Automatic low stock alerts
- [ ] Stock history tracking
- [ ] Bulk stock update
- [ ] Stock reservation during checkout
- [ ] Release reserved stock if order cancelled
- [ ] Expiry date alerts
- [ ] Batch/lot number tracking

**Files to Create/Update:**
- `backend/src/main/java/com/pharma/model/StockHistory.java`
- `backend/src/main/java/com/pharma/service/InventoryService.java`
- `backend/src/main/java/com/pharma/controller/InventoryController.java`

**Estimated Time:** 8-10 hours

---

## 💳 Payment Integration (HIGH PRIORITY)

### 13. Payment Gateway
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Payment entity and repository
- [ ] Payment processing workflow
- [ ] Payment success/failure handling
- [ ] Refund functionality
- [ ] Payment history
- [ ] Invoice generation

**Files to Create:**
- `backend/src/main/java/com/pharma/model/Payment.java`
- `backend/src/main/java/com/pharma/repository/PaymentRepository.java`
- `backend/src/main/java/com/pharma/service/PaymentService.java`
- `backend/src/main/java/com/pharma/controller/PaymentController.java`
- `backend/src/main/java/com/pharma/config/PaymentConfig.java`

**Dependencies:**
```xml
<!-- For Stripe -->
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>24.0.0</version>
</dependency>

<!-- For Razorpay -->
<dependency>
    <groupId>com.razorpay</groupId>
    <artifactId>razorpay-java</artifactId>
    <version>1.4.3</version>
</dependency>
```

**Estimated Time:** 10-12 hours

---

## 📊 Reporting & Analytics (MEDIUM PRIORITY)

### 14. Admin Reports
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Sales report (daily, weekly, monthly)
- [ ] Revenue analytics
- [ ] Top-selling products
- [ ] Low-performing products
- [ ] Order status breakdown
- [ ] Customer analytics
- [ ] Export reports to PDF/Excel
- [ ] Visual charts and graphs

**Files to Create:**
- `backend/src/main/java/com/pharma/service/ReportService.java`
- `backend/src/main/java/com/pharma/controller/ReportController.java`
- `backend/src/main/java/com/pharma/dto/ReportDTO.java`

**Frontend:**
- `frontend/src/pages/admin/Reports.tsx`
- `frontend/src/components/admin/SalesChart.tsx`
- `frontend/src/components/admin/ReportTable.tsx`

**Estimated Time:** 12-16 hours

---

## 🎁 Additional Features (LOW PRIORITY)

### 15. Discount & Coupon System
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Coupon entity and repository
- [ ] Create/manage coupons (admin)
- [ ] Apply coupon at checkout
- [ ] Validate coupon code
- [ ] Discount calculation
- [ ] Coupon usage limits
- [ ] Expiry date handling
- [ ] Percentage vs fixed amount discounts

**Estimated Time:** 8-10 hours

---

### 16. Product Reviews & Ratings
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Review entity and repository
- [ ] Submit review (after purchase)
- [ ] Star rating system
- [ ] Review moderation (admin approval)
- [ ] Display reviews on product page
- [ ] Average rating calculation
- [ ] Helpful/not helpful votes

**Estimated Time:** 10-12 hours

---

### 17. Wishlist
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Wishlist entity and repository
- [ ] Add/remove from wishlist
- [ ] View wishlist
- [ ] Move from wishlist to cart
- [ ] Share wishlist
- [ ] Wishlist icon/counter

**Estimated Time:** 6-8 hours

---

### 18. Advanced User Features
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Multiple shipping addresses
- [ ] Default address selection
- [ ] Order notes/special instructions
- [ ] Delivery time slot selection
- [ ] Prescription history
- [ ] Medication reminders
- [ ] Reorder previous purchases

**Estimated Time:** 10-12 hours

---

### 19. Notifications
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] In-app notifications
- [ ] Push notifications (web push)
- [ ] SMS notifications (Twilio)
- [ ] Notification preferences
- [ ] Mark as read/unread
- [ ] Notification history

**Estimated Time:** 8-10 hours

---

### 20. Multi-language Support
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] i18n configuration
- [ ] Translation files
- [ ] Language switcher
- [ ] RTL support (for Arabic, etc.)
- [ ] Database content translation

**Estimated Time:** 12-16 hours

---

## 🔒 Security Enhancements

### 21. Security Improvements
**Status:** ⚠️ Basic Implementation

**What's Missing:**
- [ ] Rate limiting on APIs
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication (2FA)
- [ ] Email verification on registration
- [ ] Session management
- [ ] Security headers configuration
- [ ] Input sanitization
- [ ] SQL injection prevention (mostly done)
- [ ] XSS prevention
- [ ] CSRF protection

**Estimated Time:** 10-12 hours

---

## 🧪 Testing (HIGH PRIORITY)

### 22. Backend Testing
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Unit tests for services
- [ ] Unit tests for repositories
- [ ] Integration tests for controllers
- [ ] Security tests
- [ ] API endpoint tests
- [ ] Test coverage >70%

**Estimated Time:** 16-20 hours

---

### 23. Frontend Testing
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Component unit tests
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Test coverage >60%

**Estimated Time:** 12-16 hours

---

## 📱 Mobile & Responsive

### 24. Responsive Design
**Status:** ⚠️ Partial

**What's Missing:**
- [ ] Mobile-first responsive design
- [ ] Tablet optimization
- [ ] Touch-friendly controls
- [ ] Mobile menu
- [ ] Swipe gestures
- [ ] PWA features (optional)

**Estimated Time:** 8-12 hours

---

## 🚀 Performance & Optimization

### 25. Performance Optimization
**Status:** ❌ Not Implemented

**What's Missing:**
- [ ] Database indexing
- [ ] Query optimization
- [ ] Caching (Redis)
- [ ] Image lazy loading
- [ ] Code splitting
- [ ] API response compression
- [ ] Database connection pooling
- [ ] CDN for static assets

**Estimated Time:** 8-10 hours

---

## 📝 Documentation

### 26. Documentation
**Status:** ⚠️ Partial

**What's Missing:**
- [ ] API documentation (Swagger complete)
- [ ] Code documentation (JavaDoc)
- [ ] Architecture diagram
- [ ] Database schema diagram
- [ ] User manual
- [ ] Admin manual
- [ ] Developer guide
- [ ] Deployment guide

**Estimated Time:** 12-16 hours

---

## 🎯 Priority Summary

### Phase 1 (Must Have - 2-3 weeks)
1. ✅ Product pages with real data
2. ✅ Shopping cart functionality
3. ✅ Checkout and order creation
4. ✅ Admin product management
5. ✅ Admin order management
6. ✅ Proper navigation/layout

**Estimated: 60-80 hours**

### Phase 2 (Should Have - 2-3 weeks)
7. Payment gateway integration
8. File upload (images, prescriptions)
9. Email notifications
10. Password reset
11. Advanced search/filtering
12. Basic testing

**Estimated: 50-70 hours**

### Phase 3 (Nice to Have - 2-4 weeks)
13. Prescription management
14. Reviews & ratings
15. Reporting & analytics
16. Discount/coupon system
17. Security enhancements
18. Performance optimization

**Estimated: 60-80 hours**

### Phase 4 (Future - Ongoing)
19. Multi-language support
20. Push notifications
21. Mobile app
22. Advanced analytics
23. Comprehensive testing
24. Full documentation

**Estimated: 80-100+ hours**

---

## 📊 Total Effort Estimate

- **Core Features (Phase 1-2):** 110-150 hours (3-4 weeks full-time)
- **Enhanced Features (Phase 3):** 60-80 hours (2-3 weeks)
- **Advanced Features (Phase 4):** 80-100+ hours (3-4 weeks)

**Total: 250-330+ hours (8-12 weeks full-time development)**

---

## 🎓 Recommended Development Order

1. **Week 1-2:** Frontend - Products, Cart, Checkout
2. **Week 3:** Admin Dashboard - Product Management
3. **Week 4:** Admin Dashboard - Order Management
4. **Week 5:** Payment Integration
5. **Week 6:** File Upload & Prescriptions
6. **Week 7:** Email Notifications & Password Reset
7. **Week 8:** Search, Filters & Reviews
8. **Week 9-10:** Testing & Bug Fixes
9. **Week 11:** Security Enhancements
10. **Week 12:** Performance & Documentation

---

## 📌 Quick Wins (Start Here!)

These can be implemented quickly for immediate value:

1. **Product Listing Page** (4-6 hours)
2. **Product Detail Page** (2-3 hours)
3. **Cart Display** (3-4 hours)
4. **Basic Navbar** (2-3 hours)
5. **Order History Display** (2-3 hours)

**Total Quick Wins: 15-20 hours**

---

## 🔗 Useful Resources

- **Spring Boot:** https://spring.io/guides
- **React:** https://react.dev/learn
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Stripe Integration:** https://stripe.com/docs/development
- **JWT Best Practices:** https://jwt.io/introduction

---

**This list should keep you busy for a while! 😊** Start with Phase 1 features to get a working MVP, then gradually add more features based on your priorities.
