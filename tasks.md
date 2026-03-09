1. No Customer Profile Page
Users can register and log in, but there's no page to update name, phone number, or password. The UserController and UserService exist but there's no matching frontend route.
2. Address Management Has No Edit or Delete
AddressManagement.tsx lets users add addresses but there's no edit or delete action. The AddressService on the backend supports both.
3. No Customer Order Tracking Timeline
The OrderDetails page shows a status, but there's no visual status history or timeline (e.g. Pending → Processing → Shipped → Delivered). The OrderStatus enum supports this but no audit trail is recorded.
5. Checkout State Stored in sessionStorage
The shipping address is passed between the Checkout and Payment pages via sessionStorage.setItem('checkoutState', ...). If the user refreshes mid-flow, navigates away, or opens a new tab, this state is lost or stale, causing a silent redirect back to /checkout.
6. calculateTotal() is Duplicated Across Three Pages
Cart.tsx, Checkout.tsx, and Payment.tsx all independently re-fetch the cart and recalculate the total. If the cart changes mid-flow, the totals can diverge. This logic should be centralised in the cart store.
7. Cart Quantity Increment Has No Stock Feedback
The + button is disabled at stockQuantity, but if stockQuantity is 0 or low, there's no visible indication on the product listing or cart. Users only discover stock issues at order placement.
8. No Order Cancellation for Customers
Users can place orders but have no way to cancel them. Only admins can update order status. A customer-facing cancel button (for PENDING orders) should exist.
